pub mod handlers;
pub mod routes;

use std::sync::Arc;
use axum::Router;
use sqlx::postgres::PgPoolOptions;
use deadpool_redis::Pool;
use shared::{AppConfig, JwtService, TtsService};
use std::time::Duration;
use tower_http::cors::{Any, CorsLayer};

#[derive(Clone)]
pub struct AppState {
    pub jwt_svc: Arc<JwtService>,
    pub db_pool: sqlx::PgPool,
    pub redis_pool: Pool,
    pub config: AppConfig,
    pub tts_service: Arc<TtsService>,
}

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .merge(routes::utility_routes())
        .nest("/api/tts", routes::tts_routes())
        .merge(routes::health_routes())
        .with_state(state)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    shared::tracing::init_tracing();

    let config = shared::config::load_config()
        .unwrap_or_else(|_| AppConfig {
            server: shared::config::ServerConfig { host: "0.0.0.0".to_string(), port: 3003, env: "dev".to_string() },
            database: shared::config::DatabaseConfig {
                url: std::env::var("DATABASE_URL").unwrap_or_else(|_| "postgresql://postgres:postgres@localhost:5432/suvidha".to_string()),
                max_connections: 50, min_connections: 5,
            },
            redis: shared::config::RedisConfig {
                url: std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string()),
                max_connections: 50,
            },
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

    // Initialize TTS service (Edge TTS - free, no API key required)
    let tts_service = TtsService::new();

    let state = AppState { 
        jwt_svc: Arc::new(jwt_svc), 
        db_pool, 
        redis_pool, 
        config,
        tts_service: Arc::new(tts_service),
    };

    // CORS configuration
    let cors = if std::env::var("FRONTEND_URLS").unwrap_or_else(|_| std::env::var("FRONTEND_URL").unwrap_or_else(|_| "*".to_string())) == "*" {
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
            .allow_origin(origins)
            .allow_methods(Any)
            .allow_headers(Any)
    };

    let app = build_router(state.clone())
        .layer(cors);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3003".to_string()).parse::<u16>().unwrap_or(3003);
    tracing::info!("Starting utility-service on port {}", port);
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    axum::serve(listener, app).await?;

    Ok(())
}