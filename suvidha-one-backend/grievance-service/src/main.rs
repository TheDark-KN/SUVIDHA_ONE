pub mod routes;

use std::sync::Arc;
use axum::Router;
use sqlx::postgres::PgPoolOptions;
use shared::{AppConfig, JwtService};
use std::time::Duration;

#[derive(Clone)]
pub struct AppState {
    pub jwt_svc: Arc<JwtService>,
    pub db_pool: sqlx::PgPool,
    pub config: AppConfig,
}

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .merge(routes::grievance_routes())
        .merge(routes::health_routes())
        .with_state(state)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    shared::tracing::init_tracing();

    let config = shared::config::load_config()
        .unwrap_or_else(|_| AppConfig {
            server: shared::config::ServerConfig { host: "0.0.0.0".to_string(), port: 3004, env: "dev".to_string() },
            database: shared::config::DatabaseConfig {
                url: std::env::var("DATABASE_URL").unwrap_or_else(|_| "postgresql://postgres:postgres@localhost:5432/suvidha".to_string()),
                max_connections: 50, min_connections: 5,
            },
            redis: shared::config::RedisConfig { url: "redis://localhost:6379".to_string(), max_connections: 50 },
            jwt: shared::config::JwtConfig {
                private_key_pem: std::env::var("JWT_PUBLIC_KEY_PEM").unwrap_or_default(),
                public_key_pem: std::env::var("JWT_PUBLIC_KEY_PEM").unwrap_or_default(),
                access_ttl_secs: 900, refresh_ttl_secs: 604800,
                issuer: "suvidha-one-auth".to_string(),
                audience: vec!["suvidha-one-api".to_string()],
            },
            uidai: None, npci: None, digilocker: None, sms: None, whatsapp: None,
        });

    let db_pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .min_connections(config.database.min_connections)
        .acquire_timeout(Duration::from_secs(5))
        .connect(&config.database.url)
        .await?;

    let jwt_svc = JwtService::new(
        config.jwt.private_key_pem.as_bytes(),
        config.jwt.public_key_pem.as_bytes(),
        config.jwt.issuer.clone(),
        config.jwt.audience.clone(),
        config.jwt.access_ttl_secs,
        config.jwt.refresh_ttl_secs,
    )?;

    let state = AppState { jwt_svc: Arc::new(jwt_svc), db_pool, config };
    let app = build_router(state.clone());

    tracing::info!("Starting grievance-service on {}", state.config.server.port);
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", state.config.server.port)).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
