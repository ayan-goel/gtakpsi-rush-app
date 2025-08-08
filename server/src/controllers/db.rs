use mongodb::{options::ClientOptions, Client, Collection};
use std::sync::Arc;
<<<<<<< HEAD
=======
use redis::aio::ConnectionManager;
use redis::AsyncCommands;
>>>>>>> realtime-voting
use tokio::sync::OnceCell;

use crate::models::{misc::RushNight, pis::{PISQuestion, PISTimeslot}, Rushee::RusheeModel};

pub static MONGO_CLIENT: OnceCell<Arc<Client>> = OnceCell::const_new();
<<<<<<< HEAD
=======
pub static REDIS_CLIENT: OnceCell<Arc<ConnectionManager>> = OnceCell::const_new();
>>>>>>> realtime-voting

pub async fn get_mongo_client() -> Arc<Client> {
    MONGO_CLIENT
        .get_or_init(|| async {
            let uri = "mongodb+srv://gtakpsisoftware:brznOWH0oPA9fT5N@gtakpsi.bf6r1.mongodb.net/?connectTimeoutMS=3000&socketTimeoutMS=300000";
            let client_options = ClientOptions::parse(uri).await.unwrap();
            let client = Client::with_options(client_options).unwrap();
            Arc::new(client)
        })
        .await
        .clone()
}

<<<<<<< HEAD
/// Get a reference to the MongoDB client
pub fn get_client() -> Arc<Client> {
    MONGO_CLIENT
        .get()
        .expect("MongoDB client is not initialized. Call `initialize_mongo_client` first.")
=======
pub async fn get_redis_conn() -> Arc<ConnectionManager> {
    REDIS_CLIENT
        .get_or_init(|| async {
            let url = "redis://127.0.0.1:6379";
            let client = redis::Client::open(url).expect("Invalid Redis URL");
            let manager = ConnectionManager::new(client)
                .await
                .expect("Failed to connect to Redis");
            Arc::new(manager)
        })
        .await
        .clone()
}

/// DEPRECATED, Get a reference to the MongoDB client
pub fn get_client() -> Arc<Client> {
    MONGO_CLIENT
        .get()
        .expect("MongoDB client is not initialized. Call `get_mongo_client` first.")
>>>>>>> realtime-voting
        .clone()
}

pub async fn get_rushee_client() -> mongodb::Collection<RusheeModel> {
    let client = get_mongo_client().await;
    client.database("rush-app").collection("rushees")
}

pub async fn get_pis_questions_client() -> Collection<PISQuestion> {
    let client = get_mongo_client().await;
    client.database("rush-app").collection("pis-questions")
}

pub async fn get_pis_timeslots_client() -> Collection<PISTimeslot> {
    let client = get_mongo_client().await;
    client.database("rush-app").collection("pis-timeslots")
}

pub async fn get_rush_nights_client() -> Collection<RushNight> {
    let client = get_mongo_client().await;
    client.database("rush-app").collection("rush-nights")
<<<<<<< HEAD
}
=======
}
>>>>>>> realtime-voting
