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

pub async fn rate_limit_middleware(
    State(_redis_pool): State<deadpool_redis::Pool>,
    req: Request,
    next: Next,
) -> Result<Response, AppError> {
    // Rate limiting disabled due to Redis version compatibility
    // TODO: Re-enable with proper Redis version alignment
    Ok(next.run(req).await)
}

pub fn cors_layer() -> tower_http::cors::CorsLayer {
    tower_http::cors::CorsLayer::new()
        .allow_origin(tower_http::cors::Any)
        .allow_methods(tower_http::cors::Any)
        .allow_headers(tower_http::cors::Any)
}
