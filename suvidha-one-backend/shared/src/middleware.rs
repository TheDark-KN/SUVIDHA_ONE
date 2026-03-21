use crate::jwt::{AccessClaims, JwtService, Role};
use crate::AppError;
use axum::{
    extract::{Extension, Request, State},
    http::header,
    middleware::Next,
    response::Response,
};
use std::sync::Arc;
use tower_http::set_header::SetResponseHeaderLayer;

pub async fn jwt_auth_middleware(
    State(jwt_svc): State<Arc<JwtService>>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let token = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or(AppError::Auth(crate::error::AuthError::MissingToken))?;

    let claims = jwt_svc.verify_access_token(token)?;

    req.extensions_mut().insert(claims);
    Ok(next.run(req).await)
}

pub async fn require_role(
    Extension(claims): Extension<AccessClaims>,
    req: Request,
    next: Next,
    required_role: Role,
) -> Result<Response, AppError> {
    if !claims.roles.contains(&required_role) {
        return Err(AppError::Forbidden("Insufficient role".into()));
    }
    Ok(next.run(req).await)
}

pub fn security_headers() -> impl tower::Layer<axum::routing::Router> {
    tower::ServiceBuilder::new()
        .layer(SetResponseHeaderLayer::overriding(
            header::X_FRAME_OPTIONS,
            header::HeaderValue::from_static("DENY"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            header::X_CONTENT_TYPE_OPTIONS,
            header::HeaderValue::from_static("nosniff"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            header::STRICT_TRANSPORT_SECURITY,
            header::HeaderValue::from_static("max-age=31536000; includeSubDomains; preload"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            header::CONTENT_SECURITY_POLICY,
            header::HeaderValue::from_static(
                "default-src 'self'; script-src 'self'; style-src 'self' fonts.googleapis.com",
            ),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            header::REFERRER_POLICY,
            header::HeaderValue::from_static("strict-origin-when-cross-origin"),
        ))
}

/// Rate limiting middleware using Redis sliding window algorithm
pub async fn rate_limit_middleware(
    State(redis_pool): State<Arc<deadpool_redis::Pool>>,
    req: Request,
    next: Next,
) -> Result<Response, AppError> {
    use deadpool_redis::redis::AsyncCommands;
    use std::time::{SystemTime, UNIX_EPOCH};
    
    // Extract client identifier (IP or token)
    let client_id = req
        .headers()
        .get("X-Forwarded-For")
        .or_else(|| req.headers().get("X-Real-IP"))
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown");
    
    let path = req.uri().path();
    let rate_key = format!("rate:{}:{}", client_id, path);
    
    // Default limits: 60 requests per minute per endpoint
    let max_requests: u64 = 60;
    let window_secs: u64 = 60;
    
    let mut conn = redis_pool.get().await.map_err(|e| {
        tracing::error!("Redis connection error: {}", e);
        AppError::Cache(format!("Failed to get Redis connection: {}", e))
    })?;
    
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| AppError::Internal(format!("Time error: {}", e)))?
        .as_millis() as u64;
    
    let window_start = now.saturating_sub(window_secs * 1000);
    
    // Remove old entries outside the window
    let _: () = conn.zrembyscore(&rate_key, "-inf", window_start as f64).await.map_err(|e| {
        tracing::error!("Redis zrembyscore error: {}", e);
        AppError::Cache(format!("Rate limit check failed: {}", e))
    })?;
    
    // Count current requests in window
    let count: u64 = conn.zcard(&rate_key).await.map_err(|e| {
        tracing::error!("Redis zcard error: {}", e);
        AppError::Cache(format!("Rate limit check failed: {}", e))
    })?;
    
    if count >= max_requests {
        tracing::warn!("Rate limit exceeded for client: {}, path: {}", client_id, path);
        return Err(AppError::RateLimitExceeded);
    }
    
    // Add current request
    let _: () = conn.zadd(&rate_key, now as f64, now).await.map_err(|e| {
        tracing::error!("Redis zadd error: {}", e);
        AppError::Cache(format!("Rate limit update failed: {}", e))
    })?;
    
    // Set expiry on the key
    let _: () = conn.expire(&rate_key, window_secs as i64).await.map_err(|e| {
        tracing::error!("Redis expire error: {}", e);
        AppError::Cache(format!("Rate limit expire failed: {}", e))
    })?;
    
    Ok(next.run(req).await)
}

/// CORS layer with secure configuration
/// In production, specify allowed origins explicitly
pub fn cors_layer() -> tower_http::cors::CorsLayer {
    use tower_http::cors::{AllowOrigin, CorsLayer};
    use axum::http::{header, Method};
    
    // Get allowed origins from environment or use defaults
    let allowed_origins = std::env::var("CORS_ALLOWED_ORIGINS")
        .unwrap_or_else(|_| "http://localhost:3000,http://localhost:5173".to_string());
    
    let origins: Vec<_> = allowed_origins
        .split(',')
        .filter_map(|s| s.trim().parse().ok())
        .collect();
    
    CorsLayer::new()
        .allow_origin(AllowOrigin::list(origins))
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            header::ACCEPT,
        ])
        .allow_credentials(true)
        .max_age(std::time::Duration::from_secs(3600))
}

/// Request ID middleware - adds unique ID to each request for tracing
pub async fn request_id_middleware(
    mut req: Request,
    next: Next,
) -> Response {
    use uuid::Uuid;
    
    let request_id = Uuid::new_v4();
    req.extensions_mut().insert(request_id);
    
    let mut response = next.run(req).await;
    response.headers_mut().insert(
        "X-Request-ID",
        request_id.to_string().parse().unwrap(),
    );
    
    response
}
