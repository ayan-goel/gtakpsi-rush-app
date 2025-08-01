mod voter_socket;
mod admin_socket;
mod db;

use axum::{routing::get, Router, extract::Path};
use std::{net::SocketAddr, sync::Arc};
use db::{get_redis_conn, get_redis_pubsub};
use voter_socket::{ws_handler, ClientList, spawn_pubsub_listener};
use admin_socket::{admin_ws_handler, admin_spawn_pubsub_listener};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    let clients: ClientList = Arc::new(dashmap::DashMap::new());
    let admins: ClientList = Arc::new(dashmap::DashMap::new());

    // Start background pubsub listener
    spawn_pubsub_listener(clients.clone()).await;
    admin_spawn_pubsub_listener(admins.clone()).await;

    let app = 
    Router::new()
    .route(
        "/voter/:id",
        get({
            let clients = clients.clone();
            move |path, ws, addr| ws_handler(path, ws, addr, clients)
        }),
    )
    .route(
        "/admin/:id",
        get({
            let admins = admins.clone();
            move |path, ws, addr| admin_ws_handler(path, ws, addr, clients) 
        })
    );

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Broadcaster running on ws://{}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .unwrap();
}