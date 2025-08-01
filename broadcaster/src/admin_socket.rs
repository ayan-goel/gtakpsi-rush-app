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
type ClientList = Arc<DashMap<usize, mpsc::UnboundedSender<Message>>>;

/// WebSocket route handler
pub async fn admin_ws_handler(
    Path(id): Path<String>,
    ws: WebSocketUpgrade,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    clients: ClientList,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, addr, clients, Some(id)))
}

/// Background task that listens for Redis pubsub and broadcasts to all clients
pub async fn admin_spawn_pubsub_listener(clients: ClientList) {
    let mut pubsub = get_redis_pubsub().await;
    pubsub.subscribe("vote_channel").await.expect("subscribe failed");

    tokio::spawn(async move {
        let mut stream = pubsub.on_message();
        while let Some(msg) = stream.next().await {
            if msg.get_payload::<String>().is_err() {
                println!("❌ Failed to get payload from Redis message");
                continue;
            }
            println!("📡 Received vote_channel publish");

            // Fetch vote_log entries
            let redis = get_redis_conn().await;
            let mut conn = redis.as_ref().clone();
            
            match conn.lrange::<_, Vec<String>>("vote_log", 0, -1).await {
                Ok(entries) => {
                    println!("📊 Fetched {} vote_log entries from Redis", entries.len());
                    
                    let votes: Vec<serde_json::Value> = entries
                        .into_iter()
                        .filter_map(|s| {
                            match serde_json::from_str(&s) {
                                Ok(json) => Some(json),
                                Err(e) => {
                                    println!("⚠️ Failed to parse vote entry: {} - Error: {}", s, e);
                                    None
                                }
                            }
                        })
                        .collect();

                    println!("✅ Parsed {} valid vote entries", votes.len());

                    let message = serde_json::json!({
                        "type": "vote_update",
                        "votes": votes
                    });

                    let msg_str = message.to_string();

                    let mut to_remove = Vec::new();
                    let mut sent_count = 0;
                    let mut failed_count = 0;

                    for entry in clients.iter() {
                        let (id, tx) = entry.pair();
                        match tx.send(Message::Text(msg_str.clone())) {
                            Ok(_) => {
                                sent_count += 1;
                                println!("✅ Successfully sent to client {}", id);
                            }
                            Err(e) => {
                                failed_count += 1;
                                println!("❌ Failed to send to client {}: {}", id, e);
                                to_remove.push(*id);
                            }
                        }
                    }

                    println!("📊 Broadcast summary: {} sent, {} failed", sent_count, failed_count);

                    // Clean up disconnected clients
                    for id in to_remove {
                        clients.remove(&id);
                        println!("🗑️ Removed disconnected client {}", id);
                    }
                }
                Err(e) => {
                    println!("❌ Failed to fetch vote_log for pubsub broadcast: {}", e);
                }
            }
        }
        println!("🔚 PubSub listener ended");
    });
}

/// Handles a single WebSocket connection for the admin (vote broadcast-only)
async fn handle_socket(socket: WebSocket, addr: SocketAddr, clients: ClientList, client_id: Option<String>) {
    println!("🔌 Admin connected from {}", addr);

    // Split the WebSocket into sender/receiver
    let (mut ws_sender, mut ws_receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();

    // Assign ID and register client
    let id: usize = client_id
        .and_then(|s| s.parse().ok())
        .unwrap_or_else(|| NEXT_ID.fetch_add(1, Ordering::Relaxed));
    clients.insert(id, tx.clone());

    // Send initial vote_log state from Redis
    let redis = get_redis_conn().await;
    let mut conn = (*redis).clone();

    match conn.lrange::<_, Vec<String>>("vote_log", 0, -1).await {
        Ok(entries) => {
            let votes: Vec<serde_json::Value> = entries
                .into_iter()
                .filter_map(|s| serde_json::from_str(&s).ok())
                .collect();

            let msg = serde_json::json!({
                "type": "vote_update",
                "votes": votes
            });

            let _ = tx.send(Message::Text(msg.to_string()));
        }
        Err(e) => {
            println!("❌ Redis error while fetching vote_log: {}", e);
        }
    }

    // Task to forward messages to this WebSocket client
    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if ws_sender.send(msg).await.is_err() {
                println!("❌ Failed to send to admin {}, connection likely closed", id);
                break;
            }
        }
    });

    // Task to monitor WebSocket connection (ignoring client input)
    let recv_task = tokio::spawn(async move {
        while let Some(msg) = ws_receiver.next().await {
            match msg {
                Ok(Message::Close(_)) => {
                    println!("🔒 Admin {} sent close message", id);
                    break;
                }
                Ok(Message::Ping(_)) => {
                    println!("🏓 Ping from admin {}", id);
                }
                Ok(Message::Text(_)) | Ok(Message::Binary(_)) => {
                    // Admins can't send messages — ignore silently
                }
                Ok(Message::Pong(_)) => {}
                Err(e) => {
                    println!("❌ WebSocket error for admin {}: {}", id, e);
                    break;
                }
            }
        }
    });

    // Wait for send or receive to complete
    tokio::select! {
        _ = send_task => {
            println!("📤 Send task completed for admin {}", id);
        },
        _ = recv_task => {
            println!("📥 Connection monitoring completed for admin {}", id);
        },
    }

    // Cleanup
    clients.remove(&id);
    println!("🔒 Admin {} disconnected", id);
}