use axum::extract::Query;
use axum::http::StatusCode;
use axum::{
    extract::Path,
    response::Json,
    routing::{get, post},
    Router,
};
use controllers::admin::add_pis_question;
use controllers::rushee;
use lambda_http::{run, Error};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::env::set_var;
use tower::ServiceBuilder;
use tower_http::cors::{Any, CorsLayer};
use axum::http::Method;
use dotenv::dotenv;
use std::env;

use controllers::voting::ChangeRusheePayload;

mod controllers;
mod models;
mod middlewares;

/// Example on how to return status codes and data from an Axum function
async fn health_check() -> (StatusCode, String) {
    let health = true;
    match health {
        true => (StatusCode::OK, "Healthy!".to_string()),
        false => (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Not healthy!".to_string(),
        ), 
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    // If you use API Gateway stages, the Rust Runtime will include the stage name
    // as part of the path that your application receives.
    // Setting the following environment variable, you can remove the stage from the path.
    // This variable only applies to API Gateway stages,
    // you can remove it if you don't use them.
    // i.e with: `GET /test-stage/todo/id/123` without: `GET /todo/id/123`
    set_var("AWS_LAMBDA_HTTP_IGNORE_STAGE_IN_PATH", "true");

    // required to enable CloudWatch error logging by the runtime 
    // tracing::init_default_subscriber();

    dotenv().ok();

    // let mongo_uri = env::var("MONGO_URI").expect("MONGO URI Must be Set");

    let app = Router::new()

        .route("/rushee/signup", post(controllers::rushee::signup).options(|| async { StatusCode::OK }))
        .route("/rushee/get-rushees", get(controllers::rushee::get_rushees).options(|| async { StatusCode::OK }))
        .route("/rushee/:id", get(controllers::rushee::get_rushee).options(|| async { StatusCode::OK }))
        .route("/rushee/post-comment/:id",post(controllers::rushee::post_comment).options(|| async { StatusCode::OK }))
        .route("/rushee/post-pis/:id", post(controllers::rushee::post_pis).options(|| async { StatusCode::OK }))
        .route("/rushee/update-attendance/:id",post(controllers::rushee::update_attendance).options(|| async { StatusCode::OK }))
        .route("/rushee/update-cloud/:id", post(controllers::rushee::update_cloud).options(|| async { StatusCode::OK }))
        .route("/rushee/update-rushee/:id", post(controllers::rushee::update_rushee).options(|| async { StatusCode::OK }))
        .route("/rushee/reschedule-pis/:id", post(controllers::rushee::reschedule_pis).options(|| async { StatusCode::OK }))
        .route("/rushee/edit-comment/:id", post(controllers::rushee::edit_comment).options(|| async { StatusCode::OK }))
        .route("/rushee/delete-comment/:id", post(controllers::rushee::delete_comment).options(|| async { StatusCode::OK }))
        .route("/rushee/does-rushee-exist/:id", get(controllers::rushee::does_rushee_exist))
        .route("/rushee/get-timeslots", get(controllers::rushee::get_signup_timeslots))
        .route("/brother/comments/:brother_name", get(controllers::rushee::get_brother_comments).options(|| async { StatusCode::OK }))

        .route("/admin/add_pis_question", post(controllers::admin::add_pis_question).options(|| async { StatusCode::OK }))
        .route("/admin/delete_pis_question", post(controllers::admin::delete_pis_question).options(|| async { StatusCode::OK }))
        .route("/admin/get_pis_questions", get(controllers::admin::get_pis_questions).options(|| async { StatusCode::OK }))
        .route("/admin/add_pis_timeslot", post(controllers::admin::add_pis_timeslot).options(|| async { StatusCode::OK }))
        .route("/admin/delete_pis_timeslot", post(controllers::admin::delete_pis_timeslot).options(|| async { StatusCode::OK }))
        .route("/admin/get_pis_timeslots", get(controllers::admin::get_pis_timeslots).options(|| async { StatusCode::OK }))
        .route("/admin/add-rush-night", post(controllers::admin::add_rush_night).options(|| async { StatusCode::OK }))
        .route("/admin/delete_rush_night", post(controllers::admin::delete_rush_night).options(|| async { StatusCode::OK }))
        .route("/admin/pis-signup/:id", post(controllers::admin::brother_pis_sign_up).options(|| async { StatusCode::OK }))
        .route("/admin/get-brother-pis", post(controllers::admin::get_brother_pis).options(|| async { StatusCode::OK }))
        
        .route("/rushee/vote", post(controllers::voting::handle_rushee_vote).options(|| async { StatusCode::OK }))
        .route("/admin/voting/change-rushee", post(controllers::voting::change_rushee).options(|| async { StatusCode::OK }))
        .route("/admin/voting/clear-votes", post(controllers::voting::clear_votes).options(|| async { StatusCode::OK }))
        
        .layer(
            CorsLayer::new()
                .allow_origin(Any) // Allow requests from any origin``
                .allow_methods([Method::GET, Method::POST, Method::OPTIONS]) // Allow specific HTTP methods
                .allow_headers(Any) // Allow any headers, including custom ones like `Authorization`
                .expose_headers(Any), // Expose specific headers in the browser (optional)
        );

    run(app).await

} 



