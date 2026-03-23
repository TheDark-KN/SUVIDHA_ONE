pub mod auth;
pub mod bill;
pub mod service;
pub mod health;
pub mod tts;
pub mod voice;

use axum::{extract::State, response::IntoResponse, Json};
use serde::Serialize;
use crate::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub service: String,
    pub version: String,
}

pub async fn health(State(_state): State<AppState>) -> impl IntoResponse {
    Json(HealthResponse { status: "healthy".to_string(), service: "utility-service".to_string(), version: "1.0.0".to_string() })
}
