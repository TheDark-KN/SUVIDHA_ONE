use std::sync::Arc;
use axum::{routing::{post, get, delete}, extract::{State, Path}, response::IntoResponse, Router, response::Json};
use deadpool_redis::Pool;
use shared::{AppConfig, JwtService};
use tower_http::cors::{Any, CorsLayer};

#[derive(Clone)]
pub struct AppState {
    pub jwt_svc: Arc<JwtService>,
    pub redis_pool: Pool,
    pub config: AppConfig,
}

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .route("/sessions/create", post(create_session))
        .route("/sessions/refresh", post(refresh_session))
        .route("/sessions/:session_id", get(get_session))
        .route("/sessions/:session_id", delete(delete_session))
        .route("/health", get(health))
        .with_state(state)
}

async fn create_session(
    State(state): State<AppState>,
    Json(req): Json<serde_json::Value>,
) -> Result<impl IntoResponse, shared::AppError> {
    let user_id = req["user_id"].as_str().unwrap_or("");
    let kiosk_id = req["kiosk_id"].as_str().unwrap_or("KIOSK001");

    let session_id = uuid::Uuid::new_v4();
    let session_data = serde_json::json!({
        "session_id": session_id,
        "user_id": user_id,
        "kiosk_id": kiosk_id,
        "created_at": chrono::Utc::now().to_rfc3339(),
        "last_active": chrono::Utc::now().to_rfc3339(),
    });

    let mut conn = state.redis_pool.get().await.map_err(|e| shared::AppError::Cache(e.to_string()))?;
    redis::cmd("SETEX")
        .arg(format!("session:{}", session_id))
        .arg(900)
        .arg(session_data.to_string())
        .query_async::<_, ()>(&mut *conn)
        .await
        .map_err(|e| shared::AppError::Cache(e.to_string()))?;

    Ok(shared::response::ok(serde_json::json!({ "session_id": session_id, "expires_in": 900 })))
}

async fn refresh_session(
    State(state): State<AppState>,
    Json(req): Json<serde_json::Value>,
) -> Result<impl IntoResponse, shared::AppError> {
    let session_id = req["session_id"].as_str().unwrap_or("");

    let mut conn = state.redis_pool.get().await.map_err(|e| shared::AppError::Cache(e.to_string()))?;
    redis::cmd("EXPIRE")
        .arg(format!("session:{}", session_id))
        .arg(900)
        .query_async::<_, ()>(&mut *conn)
        .await
        .map_err(|e| shared::AppError::Cache(e.to_string()))?;

    Ok(shared::response::ok(serde_json::json!({ "message": "Session refreshed", "expires_in": 900 })))
}

async fn get_session(
    State(state): State<AppState>,
    Path(session_id): Path<String>,
) -> Result<impl IntoResponse, shared::AppError> {
    let mut conn = state.redis_pool.get().await.map_err(|e| shared::AppError::Cache(e.to_string()))?;
    let session: Option<String> = redis::cmd("GET")
        .arg(format!("session:{}", session_id))
        .query_async(&mut *conn)
        .await
        .map_err(|e| shared::AppError::Cache(e.to_string()))?;

    match session {
        Some(s) => {
            let data: serde_json::Value = serde_json::from_str(&s).unwrap();
            Ok(shared::response::ok(data))
        }
        None => Err(shared::AppError::NotFound("Session not found".to_string())),
    }
}

async fn delete_session(
    State(state): State<AppState>,
    Path(session_id): Path<String>,
) -> Result<impl IntoResponse, shared::AppError> {
    let mut conn = state.redis_pool.get().await.map_err(|e| shared::AppError::Cache(e.to_string()))?;
    redis::cmd("DEL")
        .arg(format!("session:{}", session_id))
        .query_async::<_, ()>(&mut *conn)
        .await
        .map_err(|e| shared::AppError::Cache(e.to_string()))?;

    Ok(shared::response::ok(serde_json::json!({ "message": "Session deleted" })))
}

async fn health(State(_state): State<AppState>) -> impl IntoResponse {
    Json(serde_json::json!({ "status": "healthy", "service": "session-service", "version": "1.0.0" }))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    shared::tracing::init_tracing();

    let config = shared::config::load_config()
        .unwrap_or_else(|_| AppConfig {
            server: shared::config::ServerConfig { host: "0.0.0.0".to_string(), port: 3007, env: "dev".to_string() },
            database: shared::config::DatabaseConfig { url: "".to_string(), max_connections: 50, min_connections: 5 },
            redis: shared::config::RedisConfig { url: std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".to_string()), max_connections: 50 },
            jwt: shared::config::JwtConfig { private_key_pem: "".to_string(), public_key_pem: "".to_string(), access_ttl_secs: 900, refresh_ttl_secs: 604800, issuer: "suvidha-one-auth".to_string(), audience: vec!["suvidha-one-api".to_string()] },
            uidai: None, npci: None, digilocker: None, sms: None, whatsapp: None,
        });

    let redis_pool = deadpool_redis::Config::from_url(&config.redis.url)
        .create_pool(Some(deadpool_redis::Runtime::Tokio1))?;

    let jwt_svc = JwtService::new(config.jwt.private_key_pem.as_bytes(), config.jwt.public_key_pem.as_bytes(), config.jwt.issuer.clone(), config.jwt.audience.clone(), config.jwt.access_ttl_secs, config.jwt.refresh_ttl_secs)?;

    let state = AppState { jwt_svc: Arc::new(jwt_svc), redis_pool, config };

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

    tracing::info!("Starting session-service on {}", state.config.server.port);
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", state.config.server.port)).await?;
    axum::serve(listener, app).await?;

    Ok(())
}