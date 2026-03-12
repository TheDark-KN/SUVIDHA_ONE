use axum::{
    routing::{get, post},
    Router,
};

pub fn auth_routes() -> Router<crate::AppState> {
    Router::new()
        .route("/auth/otp/send", post(crate::handlers::otp::send_otp))
        .route("/auth/otp/verify", post(crate::handlers::otp::verify_otp))
        .route("/auth/refresh", post(crate::handlers::auth::refresh_token))
        .route("/auth/logout", post(crate::handlers::auth::logout))
}

pub fn health_routes() -> Router<crate::AppState> {
    Router::new()
        .route("/health", get(crate::handlers::health::health))
        .route("/ready", get(crate::handlers::health::health))
}
