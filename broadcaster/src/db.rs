use std::sync::Arc;
use redis::aio::ConnectionManager;
use redis::AsyncCommands;
use tokio::sync::OnceCell;
use redis::PubSub;

pub static REDIS_CLIENT: OnceCell<Arc<ConnectionManager>> = OnceCell::const_new();

const MONGO_URL: &str = "redis://default:RmJWHVflTRWZvAGdIVcqHOUnICJpNkzZ@yamabiko.proxy.rlwy.net:50054";

pub async fn get_redis_pubsub() -> redis::aio::PubSub {
    let url = MONGO_URL;
    let client = redis::Client::open(url).expect("Invalid Redis URL");
    let conn = client.get_async_connection().await.expect("PubSub conn failed");
    conn.into_pubsub()
}

pub async fn get_redis_conn() -> Arc<ConnectionManager> {
    REDIS_CLIENT
        .get_or_init(|| async {
            let url = MONGO_URL;
            let client = redis::Client::open(url).expect("Invalid Redis URL");
            let manager = ConnectionManager::new(client)
                .await
                .expect("Failed to connect to Redis");
            Arc::new(manager)
        })
        .await
        .clone()
}