use std::sync::Arc;
use axum::{routing::{post, get}, extract::State, response::IntoResponse, Router, response::Json};
use sqlx::postgres::PgPoolOptions;
use shared::{AppConfig, JwtService};
use std::time::Duration;
use tower_http::cors::{Any, CorsLayer};

#[derive(Clone)]
pub struct AppState {
    pub jwt_svc: Arc<JwtService>,
    pub db_pool: sqlx::PgPool,
    pub config: AppConfig,
}

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .route("/notifications/send", post(send_notification))
        .route("/health", get(health))
        .with_state(state)
}

async fn send_notification(
    State(state): State<AppState>,
    Json(req): Json<serde_json::Value>,
) -> Result<impl IntoResponse, shared::AppError> {
    let notification_id = uuid::Uuid::new_v4();
    let channel = req["channel"].as_str().unwrap_or("sms");
    let recipient = req["recipient"].as_str().unwrap_or("");
    let message = req["message"].as_str().unwrap_or("");
    let user_id_str = req["user_id"].as_str().unwrap_or("");
    let notification_type = req["notification_type"].as_str().unwrap_or("sms");

    // Parse user_id as Uuid
    let user_id = uuid::Uuid::parse_str(user_id_str).unwrap_or_else(|_| uuid::Uuid::nil());

    tracing::info!(channel = %channel, recipient = %recipient, "Sending notification");

    sqlx::query!(
        "INSERT INTO notifications (notification_id, user_id, notification_type, channel, recipient, message, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Sent')",
        notification_id,
        user_id,
        notification_type,
        channel,
        recipient,
        message
    )
    .execute(&state.db_pool)
    .await?;

    Ok(shared::response::ok(serde_json::json!({ "notification_id": notification_id, "status": "sent" })))
}

async fn health(State(_state): State<AppState>) -> impl IntoResponse {
    Json(serde_json::json!({ "status": "healthy", "service": "notification-service", "version": "1.0.0" }))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    shared::tracing::init_tracing();

    let config = shared::config::load_config()
        .unwrap_or_else(|_| AppConfig {
            server: shared::config::ServerConfig { host: "0.0.0.0".to_string(), port: 3006, env: "dev".to_string() },
            database: shared::config::DatabaseConfig { url: std::env::var("DATABASE_URL").unwrap_or_else(|_| "postgresql://postgres:postgres@localhost:5432/suvidha".to_string()), max_connections: 50, min_connections: 5 },
            redis: shared::config::RedisConfig { url: "redis://localhost:6379".to_string(), max_connections: 50 },
            jwt: shared::config::JwtConfig { private_key_pem: "".to_string(), public_key_pem: "".to_string(), access_ttl_secs: 900, refresh_ttl_secs: 604800, issuer: "suvidha-one-auth".to_string(), audience: vec!["suvidha-one-api".to_string()] },
            uidai: None, npci: None, digilocker: None, sms: None, whatsapp: None,
        });

    let db_pool = PgPoolOptions::new().max_connections(50).acquire_timeout(Duration::from_secs(5)).connect(&config.database.url).await?;
    let jwt_svc = JwtService::new(config.jwt.private_key_pem.as_bytes(), config.jwt.public_key_pem.as_bytes(), config.jwt.issuer.clone(), config.jwt.audience.clone(), config.jwt.access_ttl_secs, config.jwt.refresh_ttl_secs)?;

    let state = AppState { jwt_svc: Arc::new(jwt_svc), db_pool, config };

    // CORS configuration
    let cors = if std::env::var("FRONTEND_URLS").unwrap_or_else(|_| std::env::var("FRONTEND_URL").unwrap_or("*")) == "*" {
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any)
    } else {
        let origins = std::env::var("FRONTEND_URLS")
            .or_else(|_| std::env::var("FRONTEND_URL"))
            .unwrap_or_else(|_| "http://localhost:3000".to_string())
            .split(',')
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .map(|s| s.parse().unwrap())
            .collect::<Vec<_>>();
        CorsLayer::new()
            .allow_origin(origins.into_iter())
            .allow_methods(Any)
            .allow_headers(Any)
    };

    let app = build_router(state.clone())
        .layer(cors);

    tracing::info!("Starting notification-service on {}", state.config.server.port);
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", state.config.server.port)).await?;
    axum::serve(listener, app).await?;

    Ok(())
}