use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    extract::{ConnectInfo, Path},
    response::IntoResponse,
};
use dashmap::DashMap;
use futures_util::{SinkExt, StreamExt};
use redis::AsyncCommands;
use std::{net::SocketAddr, sync::Arc};
use tokio::sync::mpsc;

use crate::db::{get_redis_conn, get_redis_pubsub};

/// Global atomic counter for unique client IDs
use std::sync::atomic::{AtomicUsize, Ordering};
static NEXT_ID: AtomicUsize = AtomicUsize::new(1);

/// Type alias for active WebSocket clients
pub type ClientList = Arc<DashMap<usize, mpsc::UnboundedSender<Message>>>;

/// WebSocket route handler for admin page
pub async fn admin_ws_handler(
    Path(id): Path<String>,
    ws: WebSocketUpgrade,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    clients: ClientList,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, addr, clients, Some(id)))
}

/// Background task that listens to Redis pubsub channels and pushes updates to clients
pub async fn admin_spawn_pubsub_listener(clients: ClientList) {
    let mut pubsub = get_redis_pubsub().await;

    pubsub.subscribe("vote_channel").await.expect("subscribe failed");
    pubsub.subscribe("rushee").await.expect("subscribe failed");
    pubsub.subscribe("question").await.expect("subscribe failed");

    tokio::spawn(async move {
        let mut stream = pubsub.on_message();
        while let Some(msg) = stream.next().await {
            let channel = msg.get_channel_name().to_string();

            if let Ok(payload) = msg.get_payload::<String>() {
                match channel.as_str() {
                    "vote_channel" => {

                        let redis = get_redis_conn().await;
                        let mut conn = redis.as_ref().clone();

                        match conn.hvals::<_, Vec<String>>("vote_log").await {
                            Ok(values) => {
                                let votes: Vec<serde_json::Value> = values
                                    .into_iter()
                                    .filter_map(|s| serde_json::from_str(&s).ok())
                                    .collect();

                                let msg = serde_json::json!({
                                    "type": "vote_update",
                                    "votes": votes
                                });

                                broadcast_to_clients(&clients, msg.to_string());
                            }
                            Err(e) => {
                                println!("❌ Failed to fetch vote_log hash: {}", e);
                            }
                        }
                    }
                    "rushee" => {
                        let msg = serde_json::json!({
                            "type": "rushee_update",
                            "rushee": payload
                        });
                        broadcast_to_clients(&clients, msg.to_string());
                    }
                    "question" => {
                        let msg = serde_json::json!({
                            "type": "question_update",
                            "question": payload
                        });
                        broadcast_to_clients(&clients, msg.to_string());
                    }
                    _ => {}
                }
            }
        }
    });
}

/// Helper to send messages to all clients
fn broadcast_to_clients(clients: &ClientList, msg_str: String) {
    let mut to_remove = Vec::new();
    for entry in clients.iter() {
        let (id, tx) = entry.pair();
        if tx.send(Message::Text(msg_str.clone())).is_err() {
            to_remove.push(*id);
        }
    }

    for id in to_remove {
        clients.remove(&id);
        println!("🗑️ Removed disconnected client {}", id);
    }
}

/// Handles a single WebSocket connection for the admin dashboard
async fn handle_socket(
    socket: WebSocket,
    addr: SocketAddr,
    clients: ClientList,
    client_id: Option<String>,
) {
    println!("Admin client connected from {}", addr);

    let (mut ws_sender, mut ws_receiver) = socket.split();

    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();
    let id: usize = client_id
        .and_then(|s| s.parse().ok())
        .unwrap_or_else(|| NEXT_ID.fetch_add(1, Ordering::Relaxed));
    clients.insert(id, tx.clone());

    // Initial vote log snapshot
    let redis = get_redis_conn().await;
    let mut conn = redis.as_ref().clone();

    match conn.hvals::<_, Vec<String>>("vote_log").await {
        Ok(values) => {
            let votes: Vec<serde_json::Value> = values
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
            println!("Redis error while fetching vote_log: {}", e);
        }
    }

    // Initial rushee snapshot
    match conn.get::<_, Option<String>>("rushee").await {
        Ok(Some(data)) => {
            let msg = serde_json::json!({
                "type": "rushee_update",
                "rushee": data
            });
            let _ = tx.send(Message::Text(msg.to_string()));
        }
        Ok(None) => {
            let fallback_msg = serde_json::json!({
                "type": "rushee_update",
                "rushee": null
            });
            let _ = tx.send(Message::Text(fallback_msg.to_string()));
        }
        Err(e) => {
            println!("Redis error while fetching rushee: {}", e);
        }
    }

    match conn.get::<_, Option<String>>("question").await {
                Ok(Some(data)) => {
            let msg = serde_json::json!({
                "type": "question_update",
                "question": data
            });
            let _ = tx.send(Message::Text(msg.to_string()));
        }
        Ok(None) => {
            let fallback_msg = serde_json::json!({
                "type": "question_update",
                "question": null
            });
            let _ = tx.send(Message::Text(fallback_msg.to_string()));
        }
        Err(e) => {
            println!("Redis error while fetching question: {}", e);
        }
    }

    // Task to send messages to client
    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if ws_sender.send(msg).await.is_err() {
                println!("Failed to send to client {}, connection likely closed", id);
                break;
            }
        }
    });

    // Task to monitor for disconnects or client messages (ignored)
    let recv_task = tokio::spawn(async move {
        while let Some(msg) = ws_receiver.next().await {
            match msg {
                Ok(Message::Close(_)) => {
                    println!("Client {} sent close", id);
                    break;
                }
                Ok(Message::Ping(_)) => {
                    println!("Ping from client {}", id);
                }
                Ok(Message::Text(_)) | Ok(Message::Binary(_)) => {}
                Ok(Message::Pong(_)) => {}
                Err(e) => {
                    println!("WebSocket error for client {}: {}", id, e);
                    break;
                }
            }
        }
    });

    tokio::select! {
        _ = send_task => {
            println!("Send task completed for client {}", id);
        },
        _ = recv_task => {
            println!("Recv task completed for client {}", id);
        }
    }

    clients.remove(&id);
    println!("🔒 Client {} disconnected", id);
}
