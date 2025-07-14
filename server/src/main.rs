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
    // Always set this for Lambda compatibility (removes stage from path)
    set_var("AWS_LAMBDA_HTTP_IGNORE_STAGE_IN_PATH", "true");
    dotenv().ok();

    // --- BEGIN: LOCAL + LAMBDA SUPPORT LOGIC ---
    // The following logic allows this server to run as a normal HTTP server locally,
    // and as an AWS Lambda function in production. This is controlled by the presence
    // of the AWS_LAMBDA_FUNCTION_NAME environment variable.
    //
    // - If AWS_LAMBDA_FUNCTION_NAME is set, we run as a Lambda using lambda_http::run(app).
    // - If not set, we run as a normal Axum HTTP server on 127.0.0.1:3000 for local development.
    //
    // This enables seamless local development and cloud deployment without code changes.
    // --- END: LOCAL + LAMBDA SUPPORT LOGIC ---

    if std::env::var("AWS_LAMBDA_FUNCTION_NAME").is_ok() {
        // Lambda mode: use Router::new() and run with lambda_http::run
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
            .route("/admin/pis-signup/:id", post(controllers::admin::brother_pis_sign_up))
            .route("/admin/get-brother-pis", post(controllers::admin::get_brother_pis))
            
            .layer(
                CorsLayer::new()
                    .allow_origin(Any) // Allow requests from any origin
                    .allow_methods([Method::GET, Method::POST, Method::OPTIONS]) // Allow specific HTTP methods
                    .allow_headers(Any) // Allow any headers, including custom ones like `Authorization`
                    .expose_headers(Any), // Expose specific headers in the browser (optional)
            );
        // Run as AWS Lambda
        run(app).await
    } else {
        // Local mode: use Router::new() and run with Axum's HTTP server
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
            .route("/admin/pis-signup/:id", post(controllers::admin::brother_pis_sign_up))
            .route("/admin/get-brother-pis", post(controllers::admin::get_brother_pis))
            
            .layer(
                CorsLayer::new()
                    .allow_origin(Any) // Allow requests from any origin
                    .allow_methods([Method::GET, Method::POST, Method::OPTIONS]) // Allow specific HTTP methods
                    .allow_headers(Any) // Allow any headers, including custom ones like `Authorization`
                    .expose_headers(Any), // Expose specific headers in the browser (optional)
            );
        // Print a message for local devs
        println!("🚀 Server running on http://127.0.0.1:3000");
        // Run as a normal HTTP server
        axum::Server::bind(&"127.0.0.1:3000".parse().unwrap())
            .serve(app.into_make_service())
            .await
            .unwrap();
        Ok(())
    }
} 