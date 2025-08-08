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

use std::sync::atomic::{AtomicUsize, Ordering};
static NEXT_ID: AtomicUsize = AtomicUsize::new(1);

pub type ClientList = Arc<DashMap<usize, mpsc::UnboundedSender<Message>>>;

pub async fn ws_handler(
    Path(id): Path<String>,
    ws: WebSocketUpgrade,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    clients: ClientList,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, addr, clients, Some(id)))
}

pub async fn spawn_pubsub_listener(clients: ClientList) {
    let mut pubsub = get_redis_pubsub().await;
    pubsub.subscribe("rushee").await.expect("subscribe failed");
    pubsub.subscribe("question").await.expect("subscribe failed");

    tokio::spawn(async move {
        let mut stream = pubsub.on_message();
        while let Some(msg) = stream.next().await {
            let channel = msg.get_channel_name().to_string();
            if let Ok(payload) = msg.get_payload::<String>() {
                let msg = match channel.as_str() {
                    "rushee" => serde_json::json!({
                        "type": "rushee_update",
                        "rushee": payload
                    }),
                    "question" => serde_json::json!({
                        "type": "question_update",
                        "question": payload
                    }),
                    _ => continue,
                };
                broadcast_to_clients(&clients, msg.to_string());
            }
        }
    });
}

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

async fn handle_socket(socket: WebSocket, addr: SocketAddr, clients: ClientList, client_id: Option<String>) {
    println!("🔌 Client connected from {}", addr);

    let (mut ws_sender, mut ws_receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();
    let id: usize = client_id
        .and_then(|s| s.parse().ok())
        .unwrap_or_else(|| NEXT_ID.fetch_add(1, Ordering::Relaxed));
    clients.insert(id, tx.clone());

    let redis = get_redis_conn().await;
    let mut conn = (*redis).clone();

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
            println!("❌ Redis error while fetching 'rushee': {e}");
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
            println!("❌ Redis error while fetching 'question': {e}");
        }
    }

    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if ws_sender.send(msg).await.is_err() {
                println!("❌ Failed to send to client {}, connection likely closed", id);
                break;
            }
        }
    });

    let recv_task = tokio::spawn(async move {
        while let Some(msg) = ws_receiver.next().await {
            match msg {
                Ok(Message::Close(_)) => {
                    println!("🔒 Client {} sent close message", id);
                    break;
                }
                Ok(Message::Ping(_)) => {
                    println!("🏓 Ping from client {}", id);
                }
                Ok(Message::Text(_)) | Ok(Message::Binary(_)) => {}
                Ok(Message::Pong(_)) => {}
                Err(e) => {
                    println!("❌ WebSocket error for client {}: {}", id, e);
                    break;
                }
            }
        }
    });

    tokio::select! {
        _ = send_task => {
            println!("📤 Send task completed for client {}", id);
        },
        _ = recv_task => {
            println!("📥 Connection monitoring completed for client {}", id);
        },
    }

    clients.remove(&id);
    println!("🔒 Client {} disconnected", id);
}
