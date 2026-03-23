use axum::{
    routing::{get, post},
    Router,
};

pub fn payment_routes() -> Router<crate::AppState> {
    Router::new()
        // Kiosk payment endpoints (Razorpay)
        .route(
            "/payment/create",
            post(crate::handlers::payment::create_kiosk_payment),
        )
        .route(
            "/payment/verify",
            post(crate::handlers::payment::verify_kiosk_payment),
        )
        .route(
            "/payment/history/:phone",
            get(crate::handlers::payment::get_payment_history),
        )
        .route(
            "/payment/revenue",
            get(crate::handlers::payment::get_daily_revenue),
        )
        // Razorpay webhook
        .route(
            "/webhooks/razorpay",
            post(crate::handlers::payment::razorpay_webhook),
        )
        // Legacy endpoints
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
