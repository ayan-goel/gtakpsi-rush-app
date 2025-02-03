use mongodb::{options::ClientOptions, Client, Collection};
use std::sync::Arc;
use tokio::sync::OnceCell;

use crate::models::{misc::RushNight, pis::{PISQuestion, PISTimeslot}, Rushee::RusheeModel};

pub static MONGO_CLIENT: OnceCell<Arc<Client>> = OnceCell::const_new();

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

/// Get a reference to the MongoDB client
pub fn get_client() -> Arc<Client> {
    MONGO_CLIENT
        .get()
        .expect("MongoDB client is not initialized. Call `initialize_mongo_client` first.")
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
}