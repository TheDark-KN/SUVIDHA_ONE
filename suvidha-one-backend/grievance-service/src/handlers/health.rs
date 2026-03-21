use axum::{response::Json, http::StatusCode};
use serde_json::{json, Value};

pub async fn health() -> (StatusCode, Json<Value>) {
    (StatusCode::OK, Json(json!({
        "status": "healthy",
        "service": "grievance-service"
    })))
}

pub async fn ready() -> (StatusCode, Json<Value>) {
    (StatusCode::OK, Json(json!({
        "status": "ready",
        "service": "grievance-service"
    })))
}
