use crate::AppState;
use axum::{
    extract::{State, Json, Extension},
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use shared::{
    jwt::AccessClaims,
    response::ok,
    AppError,
};

#[derive(Debug, Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
pub struct RefreshTokenResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: u64,
}

pub async fn refresh_token(
    State(state): State<AppState>,
    Json(req): Json<RefreshTokenRequest>,
) -> Result<impl IntoResponse, AppError> {
    let claims = state.jwt_svc.verify_refresh_token(&req.refresh_token)?;

    let used_key = format!("rt:used:{}", claims.jti);
    let mut conn = state.redis_pool.get().await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let exists: bool = redis::cmd("EXISTS")
        .arg(&used_key)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    if exists {
        let family_key = format!("rt:family:{}", claims.family);
        redis::cmd("DEL")
            .arg(&family_key)
            .query_async::<_, ()>(&mut *conn)
            .await
            .map_err(|e| AppError::Cache(e.to_string()))?;

        return Err(AppError::Auth(shared::error::AuthError::RefreshTokenReplay));
    }

    redis::cmd("SETEX")
        .arg(&used_key)
        .arg(604800)
        .arg(1u8)
        .query_async::<_, ()>(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let roles = vec![shared::jwt::Role::Citizen];
    let new_access_token = state.jwt_svc.issue_access_token(
        claims.sub,
        "unknown",
        roles,
        "en",
    )?;

    let new_refresh_token = state.jwt_svc.issue_refresh_token(
        claims.sub,
        claims.family,
    )?;

    tracing::info!(user_id = %claims.sub, "Tokens refreshed successfully");

    Ok(ok(RefreshTokenResponse {
        access_token: new_access_token,
        refresh_token: new_refresh_token,
        expires_in: state.config.jwt.access_ttl_secs,
    }))
}

#[derive(Debug, Deserialize)]
pub struct LogoutRequest {
    pub token: Option<String>,
}

pub async fn logout(
    State(state): State<AppState>,
    Extension(claims): Extension<AccessClaims>,
    Json(_req): Json<LogoutRequest>,
) -> Result<impl IntoResponse, AppError> {
    let session_key = format!("session:{}", claims.jti);
    let mut conn = state.redis_pool.get().await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    redis::cmd("DEL")
        .arg(&session_key)
        .query_async::<_, ()>(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    tracing::info!(user_id = %claims.sub, jti = %claims.jti, "User logged out successfully");

    Ok(ok(serde_json::json!({ "message": "Logged out successfully" })))
}
