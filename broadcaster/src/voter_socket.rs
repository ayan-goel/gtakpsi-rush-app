use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    extract::ConnectInfo,
    response::IntoResponse,
};
use axum::extract::Path;
use dashmap::DashMap;
use redis::AsyncCommands;
use std::{net::SocketAddr, sync::Arc};
use tokio::sync::mpsc;
use crate::db::{get_redis_conn, get_redis_pubsub};
use futures_util::{SinkExt, StreamExt};

/// Global atomic counter for unique client IDs
use std::sync::atomic::{AtomicUsize, Ordering};
static NEXT_ID: AtomicUsize = AtomicUsize::new(1);

/// Type alias for active WebSocket clients
pub type ClientList = Arc<DashMap<usize, mpsc::UnboundedSender<Message>>>;

/// WebSocket route handler
pub async fn ws_handler(
    Path(id): Path<String>,
    ws: WebSocketUpgrade,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    clients: ClientList,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, addr, clients, Some(id)))
}

/// Background task that listens for Redis pubsub and broadcasts to all clients
pub async fn spawn_pubsub_listener(clients: ClientList) {
    let mut pubsub = get_redis_pubsub().await;
    pubsub.subscribe("rushee").await.expect("subscribe failed");

    tokio::spawn(async move {
        let mut stream = pubsub.on_message();
        while let Some(msg) = stream.next().await {
            if let Ok(payload) = msg.get_payload::<String>() {
                println!("📡 Broadcast from Redis: {payload}");
                
                // Remove disconnected clients while broadcasting
                let mut to_remove = Vec::new();
                for entry in clients.iter() {
                    let (id, tx) = entry.pair();
                    if tx.send(Message::Text(payload.clone())).is_err() {
                        to_remove.push(*id);
                    }
                }
                
                // Clean up disconnected clients
                for id in to_remove {
                    clients.remove(&id);
                    println!("🗑️ Removed disconnected client {}", id);
                }
            }
        }
    });
}

/// Handles a single WebSocket connection (broadcast-only)
async fn handle_socket(socket: WebSocket, addr: SocketAddr, clients: ClientList, client_id: Option<String>) {
    println!("🔌 Client connected from {}", addr);

    // Split the WebSocket - we only need the sender for broadcasts
    let (mut ws_sender, mut ws_receiver) = socket.split();
    
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();
    let id: usize = client_id
    .and_then(|s| s.parse().ok())
    .unwrap_or_else(|| NEXT_ID.fetch_add(1, Ordering::Relaxed));
    clients.insert(id, tx.clone());

    // Send initial Redis data to new client
    let redis = get_redis_conn().await;
    let mut conn = (*redis).clone();
    match conn.get::<_, Option<String>>("rushee").await {
        Ok(Some(data)) => {
            println!("📤 Sending Redis 'rushee' to client {}: {data}", id);
            let _ = tx.send(Message::Text(data));
        }
        Ok(None) => {
            let _ = tx.send(Message::Text("NO_RUSHEE".to_string()));
        }
        Err(e) => {
            println!("❌ Redis error while fetching 'rushee': {e}");
        }
    }

    // Task to send messages to this client
    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if ws_sender.send(msg).await.is_err() {
                println!("❌ Failed to send to client {}, connection likely closed", id);
                break;
            }
        }
    });

    // Task to monitor connection status (ignore incoming messages)
    let recv_task = tokio::spawn(async move {
        while let Some(msg) = ws_receiver.next().await {
            match msg {
                Ok(Message::Close(_)) => {
                    println!("🔒 Client {} sent close message", id);
                    break;
                }
                Ok(Message::Ping(_)) => {
                    // WebSocket pings are usually handled automatically by axum
                    // but we can log them if needed
                    println!("🏓 Ping from client {}", id);
                }
                Ok(Message::Text(_)) | Ok(Message::Binary(_)) => {
                    // Silently ignore incoming data messages
                    // Optionally log: println!("📥 Ignoring message from client {}", id);
                }
                Ok(Message::Pong(_)) => {
                    // Pong responses, usually automatic
                }
                Err(e) => {
                    println!("❌ WebSocket error for client {}: {}", id, e);
                    break;
                }
            }
        }
    });

    // Wait for either task to complete (connection closed or send failed)
    tokio::select! {
        _ = send_task => {
            println!("📤 Send task completed for client {}", id);
        },
        _ = recv_task => {
            println!("📥 Connection monitoring completed for client {}", id);
        },
    }

    // Clean up
    clients.remove(&id);
    println!("🔒 Client {} disconnected", id);
}