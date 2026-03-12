pub mod handlers;
pub mod services;
pub mod repository;
pub mod routes;

use std::sync::Arc;
use axum::Router;
use shared::{AppConfig, JwtService};
use deadpool_redis::Pool;

#[derive(Clone)]
pub struct AppState {
    pub jwt_svc: Arc<JwtService>,
    pub redis_pool: Pool,
    pub config: AppConfig,
}

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .merge(routes::auth_routes())
        .merge(routes::health_routes())
        .with_state(state)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    shared::tracing::init_tracing();

    let config = shared::config::load_config()
        .unwrap_or_else(|_| AppConfig {
            server: shared::config::ServerConfig {
                host: "0.0.0.0".to_string(),
                port: 3001,
                env: "dev".to_string(),
            },
            database: shared::config::DatabaseConfig {
                url: std::env::var("DATABASE_URL")
                    .unwrap_or_else(|_| "postgresql://postgres:postgres@localhost:5432/suvidha".to_string()),
                max_connections: 50,
                min_connections: 5,
            },
            redis: shared::config::RedisConfig {
                url: std::env::var("REDIS_URL")
                    .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
                max_connections: 50,
            },
            jwt: shared::config::JwtConfig {
                private_key_pem: std::env::var("JWT_PRIVATE_KEY_PEM")
                    .unwrap_or_else(|_| include_str!("../../keys/private.pem").to_string()),
                public_key_pem: std::env::var("JWT_PUBLIC_KEY_PEM")
                    .unwrap_or_else(|_| include_str!("../../keys/public.pem").to_string()),
                access_ttl_secs: 900,
                refresh_ttl_secs: 604800,
                issuer: "suvidha-one-auth".to_string(),
                audience: vec!["suvidha-one-api".to_string()],
            },
            uidai: None,
            npci: None,
            digilocker: None,
            sms: None,
            whatsapp: None,
        });

    let redis_pool = deadpool_redis::Config::from_url(&config.redis.url)
        .create_pool(Some(deadpool_redis::Runtime::Tokio1))?;

    let jwt_svc = JwtService::new(
        config.jwt.private_key_pem.as_bytes(),
        config.jwt.public_key_pem.as_bytes(),
        config.jwt.issuer.clone(),
        config.jwt.audience.clone(),
        config.jwt.access_ttl_secs,
        config.jwt.refresh_ttl_secs,
    )?;

    let state = AppState {
        jwt_svc: Arc::new(jwt_svc),
        redis_pool,
        config,
    };

    let app = build_router(state.clone());

    let addr = format!("{}:{}", state.config.server.host, state.config.server.port);
    tracing::info!("Starting auth-service on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
