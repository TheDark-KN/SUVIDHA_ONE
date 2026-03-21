use std::sync::Arc;
use axum::{routing::{post, get}, extract::{State, Path, Json, Extension}, response::IntoResponse, Router};
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
        .route("/documents/apply", post(apply_document))
        .route("/documents", get(list_documents))
        .route("/documents/:id", get(get_document))
        .route("/health", get(health))
        .with_state(state)
}

async fn apply_document(
    State(state): State<AppState>,
    Extension(claims): Extension<shared::jwt::AccessClaims>,
    Json(req): Json<serde_json::Value>,
) -> Result<impl IntoResponse, shared::AppError> {
    let doc_id = uuid::Uuid::new_v4();
    sqlx::query!(
        "INSERT INTO documents (document_id, user_id, doc_type, name, status) VALUES ($1, $2, $3, $4, 'Pending')",
        doc_id, claims.sub, req["doc_type"].as_str().unwrap_or(""), req["name"].as_str().unwrap_or("")
    )
    .execute(&state.db_pool)
    .await?;

    Ok(shared::response::ok(serde_json::json!({ "document_id": doc_id, "message": "Application submitted" })))
}

async fn list_documents(
    State(state): State<AppState>,
    Extension(claims): Extension<shared::jwt::AccessClaims>,
) -> Result<impl IntoResponse, shared::AppError> {
    let docs: Vec<serde_json::Value> = sqlx::query!(
        "SELECT document_id, doc_type, name, status, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC",
        claims.sub
    )
    .fetch_all(&state.db_pool)
    .await?
    .into_iter()
    .map(|r| serde_json::json!({ "document_id": r.document_id, "doc_type": r.doc_type, "name": r.name, "status": r.status, "created_at": r.created_at }))
    .collect();

    Ok(shared::response::ok(docs))
}

async fn get_document(
    State(state): State<AppState>,
    Extension(claims): Extension<shared::jwt::AccessClaims>,
    Path(doc_id): Path<uuid::Uuid>,
) -> Result<impl IntoResponse, shared::AppError> {
    let doc: Option<serde_json::Value> = sqlx::query!(
        "SELECT document_id, doc_type, name, status, created_at FROM documents WHERE document_id = $1 AND user_id = $2",
        doc_id, claims.sub
    )
    .fetch_optional(&state.db_pool)
    .await?
    .map(|r| serde_json::json!({ "document_id": r.document_id, "doc_type": r.doc_type, "name": r.name, "status": r.status, "created_at": r.created_at }));

    match doc {
        Some(d) => Ok(shared::response::ok(d)),
        None => Err(shared::AppError::NotFound("Document not found".to_string())),
    }
}

async fn health(State(_state): State<AppState>) -> impl IntoResponse {
    Json(serde_json::json!({ "status": "healthy", "service": "document-service", "version": "1.0.0" }))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    shared::tracing::init_tracing();

    let config = shared::config::load_config()
        .unwrap_or_else(|_| AppConfig {
            server: shared::config::ServerConfig { host: "0.0.0.0".to_string(), port: 3005, env: "dev".to_string() },
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

    tracing::info!("Starting document-service on {}", state.config.server.port);
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", state.config.server.port)).await?;
    axum::serve(listener, app).await?;

    Ok(())
}