use crate::AppState;
use axum::{
    extract::{State, Json},
    response::IntoResponse,
};
use hmac::{Hmac, Mac};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use shared::{
    response::ok,
    AppError,
};

const OTP_TTL_SECS: usize = 300;
const OTP_MAX_ATTEMPTS: u8 = 3;
const OTP_RATE_LIMIT: u8 = 3;

#[derive(Debug, Deserialize, Serialize)]
pub struct SendOtpRequest {
    pub mobile: String,
    pub kiosk_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SendOtpResponse {
    pub message: String,
    pub expires_in: u32,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct VerifyOtpRequest {
    pub mobile: String,
    pub otp: String,
    pub kiosk_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct VerifyOtpResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: u64,
}

pub async fn send_otp(
    State(state): State<AppState>,
    Json(req): Json<SendOtpRequest>,
) -> Result<impl IntoResponse, AppError> {
    let rate_key = format!("otp:rate:{}", req.mobile);
    let mut conn = state.redis_pool.get().await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let count: u8 = redis::cmd("INCR")
        .arg(&rate_key)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    if count == 1 {
        redis::cmd("EXPIRE")
            .arg(&rate_key)
            .arg(600)
            .query_async::<_, ()>(&mut *conn)
            .await
            .map_err(|e| AppError::Cache(e.to_string()))?;
    }

    if count > OTP_RATE_LIMIT {
        return Err(AppError::RateLimitExceeded);
    }

    let otp: u32 = rand::thread_rng().gen_range(100000..=999999);

    let secret = std::env::var("OTP_HMAC_SECRET").unwrap_or_else(|_| "default-secret".to_string());
    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes())
        .map_err(|_| AppError::Internal("HMAC init failed".into()))?;
    mac.update(otp.to_string().as_bytes());
    let otp_hash = hex::encode(mac.finalize().into_bytes());

    let key = format!("otp:hash:{}", req.mobile);
    let attempt_key = format!("otp:attempts:{}", req.mobile);

    redis::cmd("SETEX")
        .arg(&key)
        .arg(OTP_TTL_SECS)
        .arg(&otp_hash)
        .query_async::<_, ()>(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    redis::cmd("SETEX")
        .arg(&attempt_key)
        .arg(OTP_TTL_SECS)
        .arg(0u8)
        .query_async::<_, ()>(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    tracing::info!(mobile = %req.mobile, "OTP generated successfully");

    Ok(ok(SendOtpResponse {
        message: "OTP sent successfully".to_string(),
        expires_in: OTP_TTL_SECS as u32,
    }))
}

pub async fn verify_otp(
    State(state): State<AppState>,
    Json(req): Json<VerifyOtpRequest>,
) -> Result<impl IntoResponse, AppError> {
    let attempt_key = format!("otp:attempts:{}", req.mobile);
    let mut conn = state.redis_pool.get().await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let attempts: u8 = redis::cmd("GET")
        .arg(&attempt_key)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    if attempts >= OTP_MAX_ATTEMPTS {
        return Err(AppError::Auth(shared::error::AuthError::OtpMaxAttemptsExceeded));
    }

    redis::cmd("INCR")
        .arg(&attempt_key)
        .query_async::<_, ()>(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let secret = std::env::var("OTP_HMAC_SECRET").unwrap_or_else(|_| "default-secret".to_string());
    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes())
        .map_err(|_| AppError::Internal("HMAC init failed".into()))?;
    mac.update(req.otp.as_bytes());
    let submitted_hash = hex::encode(mac.finalize().into_bytes());

    let stored_key = format!("otp:hash:{}", req.mobile);
    let stored_hash: Option<String> = redis::cmd("GET")
        .arg(&stored_key)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    match stored_hash {
        Some(h) if h == submitted_hash => {
            redis::cmd("DEL")
                .arg(&[&stored_key, &attempt_key])
                .query_async::<_, ()>(&mut *conn)
                .await
                .map_err(|e| AppError::Cache(e.to_string()))?;

            let user_id = uuid::Uuid::new_v4();
            let roles = vec![shared::jwt::Role::Citizen];

            let access_token = state.jwt_svc.issue_access_token(
                user_id,
                &req.kiosk_id,
                roles.clone(),
                "en",
            )?;

            let refresh_token = state.jwt_svc.issue_refresh_token(
                user_id,
                uuid::Uuid::new_v4(),
            )?;

            let session_key = format!("session:{}", user_id);
            let session_data = serde_json::json!({
                "session_id": uuid::Uuid::new_v4(),
                "user_id": user_id,
                "kiosk_id": req.kiosk_id,
                "auth_method": "otp",
                "created_at": chrono::Utc::now().to_rfc3339(),
                "last_active": chrono::Utc::now().to_rfc3339(),
            });

            redis::cmd("SETEX")
                .arg(&session_key)
                .arg(900)
                .arg(session_data.to_string())
                .query_async::<_, ()>(&mut *conn)
                .await
                .map_err(|e| AppError::Cache(e.to_string()))?;

            tracing::info!(user_id = %user_id, "User authenticated successfully");

            Ok(ok(VerifyOtpResponse {
                access_token,
                refresh_token,
                expires_in: state.config.jwt.access_ttl_secs,
            }))
        }
        Some(_) => Err(AppError::Auth(shared::error::AuthError::InvalidOtp)),
        None => Err(AppError::Auth(shared::error::AuthError::OtpExpired)),
    }
}
