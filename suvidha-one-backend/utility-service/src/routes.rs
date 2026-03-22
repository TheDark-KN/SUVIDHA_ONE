use crate::handlers::{self, health};
use axum::{
    routing::{get, post},
    Router,
};

pub fn utility_routes() -> Router<crate::AppState> {
    Router::new()
        .route("/bills/fetch", post(handlers::bill::fetch_bills))
        .route("/bills/:bill_id", get(handlers::bill::get_bill))
        .route("/services", get(handlers::service::list_services))
}

pub fn tts_routes() -> Router<crate::AppState> {
    Router::new()
        .route("/synthesize", post(handlers::tts::synthesize))
        .route("/languages", get(handlers::tts::list_languages))
}

pub fn health_routes() -> Router<crate::AppState> {
    Router::new()
        .route("/health", get(health))
        .route("/ready", get(health))
}
