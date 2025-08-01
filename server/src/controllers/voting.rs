use crate::middlewares::rushee;
use crate::models::Rushee::{IncomingRusheeVote, RusheeVote, VoteOption};
use anyhow::{Error, Result};
/**
 * Controllers for voting
 */
use axum::{
    extract::Path,
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{get, post},
    Router,
};
use redis::AsyncCommands;
use serde::Deserialize;
use serde_json::{json, to_string, Value};
use std::sync::Arc;

use super::db::get_redis_conn;
use crate::middlewares::rushee::fetch_rushee;

#[derive(Debug, Deserialize)]
pub struct ChangeRusheePayload {
    gtid: String,
}

/**
 * Posts a rushee to the Redis DB
 * @route
 * @param
 * @returns
 */
pub async fn change_rushee(
    Json(payload): Json<ChangeRusheePayload>,
) -> Result<Json<Value>, StatusCode> {
    // first, fetch rushee using their gtid
    let rushee_result = fetch_rushee(payload.gtid).await;

    match rushee_result {
        Ok(rushee) => {
            // update redis to show this rushee
            let key = "rushee";
            let redis_conn = get_redis_conn().await;
            let serialized_rushee =
                to_string(&rushee).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?; // because redis is key-value based
            let mut redis = get_redis_conn().await.as_ref().clone();

            let _: () = redis
                .publish(key, serialized_rushee)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            Ok(Json(json!({
                "status": "success",
                "rushee": rushee
            })))
        }
        Err(_) => Err(StatusCode::NOT_FOUND),
    }
}

fn map_vote(vote: String) -> Result<VoteOption, Error> {
    match vote.to_lowercase().as_str() {
        "yes" => Ok(VoteOption::Yes),
        "no" => Ok(VoteOption::No),
        "abstain" => Ok(VoteOption::Abstain),
        _ => Err(Error::msg("Invalid vote option")),
    }
}

pub async fn handle_rushee_vote(
    Json(payload): Json<IncomingRusheeVote>,
) -> Result<Json<Value>, StatusCode> {
    let vote: VoteOption = map_vote(payload.vote.clone()).map_err(|_| StatusCode::BAD_REQUEST)?;

    let rusheeVote = RusheeVote {
        brother_id: payload.brother_id,
        first_name: payload.first_name,
        last_name: payload.last_name,
        vote: vote,
    };

    let serialized_rushee_vote: String =
        to_string(&rusheeVote).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Push to Redis first, then publish notification
    let mut conn = get_redis_conn().await.as_ref().clone();

    // check if brother has already voted
    let key = "vote_log";
    let already_voted: bool = conn.hexists(key, rusheeVote.brother_id.clone()).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if already_voted {
        return Ok(Json(json!({
            "status": "duplicate",
            "message": "Brother has already voted"
        })));
    }
    
    // Step 1: Add the vote to the log
    conn.hset(key, rusheeVote.brother_id.clone(), serialized_rushee_vote)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Publish update to notify listeners
    let _: () = conn
        .publish("vote_channel", "updated")
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({
        "status": "success",
        "message": "Vote recorded"
    })))
}

pub async fn clear_votes() -> Result<Json<Value>, StatusCode> {
    // Grab a live Redis connection
    let conn_arc = get_redis_conn().await;
    let mut conn = conn_arc.as_ref().clone();

    // 1) Delete the entire vote_log hash
    conn.del("vote_log")
        .await
        .map_err(|e| {
            println!("❌ Failed to clear vote_log: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // 2) Publish a notification so everyone knows votes have been reset
    conn.publish("vote_channel", "cleared")
        .await
        .map_err(|e| {
            println!("❌ Failed to publish clear notification: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // 3) Return success
    Ok(Json(json!({
        "status": "success",
        "message": "All votes cleared"
    })))
}