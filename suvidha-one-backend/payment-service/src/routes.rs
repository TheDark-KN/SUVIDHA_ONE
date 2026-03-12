use axum::{
    routing::{get, post},
    Router,
};

pub fn payment_routes() -> Router<crate::AppState> {
    Router::new()
        .route(
            "/payments/initiate",
            post(crate::handlers::payment::initiate_payment),
        )
        .route(
            "/payments/status/:payment_id",
            get(crate::handlers::payment::get_payment_status),
        )
        .route(
            "/webhooks/upi/callback",
            post(crate::handlers::webhook::upi_callback),
        )
}

pub fn health_routes() -> Router<crate::AppState> {
    Router::new()
        .route("/health", get(crate::handlers::health::health))
        .route("/ready", get(crate::handlers::health::health))
}
