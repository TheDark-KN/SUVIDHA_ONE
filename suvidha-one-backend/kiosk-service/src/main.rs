use std::sync::Arc;
use axum::{routing::{post, get}, extract::{State, Path}, response::IntoResponse, Router, response::Json};
use sqlx::postgres::PgPoolOptions;
use deadpool_redis::{redis, Pool};
use shared::{AppConfig, JwtService};
use std::time::Duration;

#[derive(Clone)]
pub struct AppState {
    pub jwt_svc: Arc<JwtService>,
    pub db_pool: sqlx::PgPool,
    pub redis_pool: Pool,
    pub config: AppConfig,
}

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .route("/kiosks/register", post(register_kiosk))
        .route("/kiosks", get(list_kiosks))
        .route("/kiosks/:kiosk_id", get(get_kiosk))
        .route("/kiosks/:kiosk_id/heartbeat", post(heartbeat))
        .route("/kiosks/:kiosk_id/config", get(get_kiosk_config))
        .route("/health", get(health))
        .with_state(state)
}

async fn register_kiosk(
    State(state): State<AppState>,
    Json(req): Json<serde_json::Value>,
) -> Result<impl IntoResponse, shared::AppError> {
    let kiosk_id = req["kiosk_id"].as_str().map(|s| s.to_string()).unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let state_code = req["state_code"].as_str().unwrap_or("UP");
    let district_code = req["district_code"].as_str().unwrap_or("LKO");
    let location = req["location"].as_str().unwrap_or("");

    sqlx::query!(
        "INSERT INTO kiosks (kiosk_id, state_code, district_code, location, status, last_heartbeat)
         VALUES ($1, $2, $3, $4, 'Active', NOW())
         ON CONFLICT (kiosk_id) DO UPDATE SET status = 'Active', last_heartbeat = NOW()",
        kiosk_id, state_code, district_code, location
    )
    .execute(&state.db_pool)
    .await?;

    tracing::info!(kiosk_id = %kiosk_id, "Kiosk registered");
    Ok(shared::response::ok(serde_json::json!({ "kiosk_id": kiosk_id, "status": "registered" })))
}

async fn list_kiosks(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, shared::AppError> {
    let kiosks: Vec<serde_json::Value> = sqlx::query!(
        "SELECT kiosk_id, state_code, district_code, location, status, last_heartbeat FROM kiosks ORDER BY last_heartbeat DESC LIMIT 100"
    )
    .fetch_all(&state.db_pool)
    .await?
    .into_iter()
    .map(|r| serde_json::json!({
        "kiosk_id": r.kiosk_id,
        "state_code": r.state_code,
        "district_code": r.district_code,
        "location": r.location,
        "status": r.status,
        "last_heartbeat": r.last_heartbeat
    }))
    .collect();

    Ok(shared::response::ok(kiosks))
}

async fn get_kiosk(
    State(state): State<AppState>,
    Path(kiosk_id): Path<String>,
) -> Result<impl IntoResponse, shared::AppError> {
    let kiosk: Option<serde_json::Value> = sqlx::query!(
        "SELECT kiosk_id, state_code, district_code, location, status, last_heartbeat FROM kiosks WHERE kiosk_id = $1",
        kiosk_id
    )
    .fetch_optional(&state.db_pool)
    .await?
    .map(|r| serde_json::json!({
        "kiosk_id": r.kiosk_id,
        "state_code": r.state_code,
        "district_code": r.district_code,
        "location": r.location,
        "status": r.status,
        "last_heartbeat": r.last_heartbeat
    }));

    match kiosk {
        Some(k) => Ok(shared::response::ok(k)),
        None => Err(shared::AppError::NotFound("Kiosk not found".to_string())),
    }
}

async fn heartbeat(
    State(state): State<AppState>,
    Path(kiosk_id): Path<String>,
) -> Result<impl IntoResponse, shared::AppError> {
    sqlx::query!(
        "UPDATE kiosks SET last_heartbeat = NOW(), status = 'Active' WHERE kiosk_id = $1",
        kiosk_id
    )
    .execute(&state.db_pool)
    .await?;

    let mut conn = state.redis_pool.get().await.map_err(|e| shared::AppError::Cache(e.to_string()))?;
    redis::cmd("SETEX")
        .arg(format!("kiosk:heartbeat:{}", kiosk_id))
        .arg(300)
        .arg(1u8)
        .query_async::<_, ()>(&mut *conn)
        .await
        .map_err(|e| shared::AppError::Cache(e.to_string()))?;

    Ok(shared::response::ok(serde_json::json!({ "message": "Heartbeat received" })))
}

async fn get_kiosk_config(
    State(_state): State<AppState>,
    Path(_kiosk_id): Path<String>,
) -> Result<impl IntoResponse, shared::AppError> {
    let config = serde_json::json!({
        "version": "1.0.0",
        "api_url": "https://api.suvidhaone.gov.in",
        "idle_timeout": 180,
        "session_timeout": 900,
        "features": {
            "otp_enabled": true,
            "payment_enabled": true,
            "grievance_enabled": true,
            "document_enabled": true
        }
    });

    Ok(shared::response::ok(config))
}

async fn health(State(_state): State<AppState>) -> impl IntoResponse {
    Json(serde_json::json!({ "status": "healthy", "service": "kiosk-service", "version": "1.0.0" }))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    shared::tracing::init_tracing();

    let config = shared::config::load_config()
        .unwrap_or_else(|_| AppConfig {
            server: shared::config::ServerConfig { host: "0.0.0.0".to_string(), port: 3008, env: "dev".to_string() },
            database: shared::config::DatabaseConfig { url: std::env::var("DATABASE_URL").unwrap_or_else(|_| "postgresql://postgres:postgres@localhost:5432/suvidha".to_string()), max_connections: 50, min_connections: 5 },
            redis: shared::config::RedisConfig { url: std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string()), max_connections: 50 },
            jwt: shared::config::JwtConfig { private_key_pem: "".to_string(), public_key_pem: "".to_string(), access_ttl_secs: 900, refresh_ttl_secs: 604800, issuer: "suvidha-one-auth".to_string(), audience: vec!["suvidha-one-api".to_string()] },
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

    let jwt_svc = JwtService::new(config.jwt.private_key_pem.as_bytes(), config.jwt.public_key_pem.as_bytes(), config.jwt.issuer.clone(), config.jwt.audience.clone(), config.jwt.access_ttl_secs, config.jwt.refresh_ttl_secs)?;

    let state = AppState { jwt_svc: Arc::new(jwt_svc), db_pool, redis_pool, config };
    let app = build_router(state.clone());

    tracing::info!("Starting kiosk-service on {}", state.config.server.port);
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", state.config.server.port)).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
