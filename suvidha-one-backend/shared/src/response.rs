use axum::{
    http::StatusCode,
    response::{IntoResponse, Json},
};
use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub data: T,
    pub meta: Meta,
}

#[derive(Serialize)]
pub struct Meta {
    pub request_id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub version: &'static str,
}

impl Meta {
    pub fn new() -> Self {
        Self {
            request_id: Uuid::new_v4(),
            timestamp: Utc::now(),
            version: "1.0.0",
        }
    }
}

impl Default for Meta {
    fn default() -> Self {
        Self::new()
    }
}

pub fn ok<T: Serialize>(data: T) -> (StatusCode, Json<ApiResponse<T>>) {
    (
        StatusCode::OK,
        Json(ApiResponse {
            data,
            meta: Meta::new(),
        }),
    )
}

pub fn created<T: Serialize>(data: T) -> (StatusCode, Json<ApiResponse<T>>) {
    (
        StatusCode::CREATED,
        Json(ApiResponse {
            data,
            meta: Meta::new(),
        }),
    )
}

pub fn no_content() -> StatusCode {
    StatusCode::NO_CONTENT
}

pub fn ok_data<T: Serialize>(data: T) -> impl IntoResponse {
    ok(data)
}

pub fn created_data<T: Serialize>(data: T) -> impl IntoResponse {
    created(data)
}
