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
const OTP_RATE_LIMIT: u8 = 5;
const RATE_LIMIT_WINDOW_SECS: usize = 3600;

#[derive(Debug, Deserialize)]
pub struct SendOtpRequest {
    pub phone: String,
    #[serde(default = "default_kiosk_id")]
    pub kiosk_id: String,
}

fn default_kiosk_id() -> String {
    "KIOSK001".to_string()
}

#[derive(Debug, Deserialize)]
pub struct VerifyOtpRequest {
    pub phone: String,
    pub otp: String,
    #[serde(default = "default_kiosk_id")]
    pub kiosk_id: String,
}

#[derive(Debug, Serialize)]
pub struct SendOtpResponse {
    pub message: String,
    pub expires_in: u32,
}

#[derive(Debug, Serialize)]
pub struct VerifyOtpResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: u64,
    pub user_id: String,
}

fn validate_phone(phone: &str) -> Result<String, AppError> {
    let cleaned = phone.trim().replace(&[' ', '-', '(', ')'][..], "");
    
    let normalized = if cleaned.starts_with("+91") {
        cleaned
    } else if cleaned.starts_with("91") && cleaned.len() == 12 {
        format!("+{}", cleaned)
    } else if cleaned.len() == 10 {
        format!("+91{}", cleaned)
    } else {
        return Err(AppError::Validation("Invalid phone number format".into()));
    };

    if normalized.len() != 13 || !normalized.starts_with("+91") {
        return Err(AppError::Validation("Invalid phone number".into()));
    }

    let digits = &normalized[3..];
    if digits.chars().any(|c| !c.is_ascii_digit()) {
        return Err(AppError::Validation("Phone must contain only digits".into()));
    }

    Ok(normalized)
}

pub async fn send_otp(
    State(state): State<AppState>,
    Json(req): Json<SendOtpRequest>,
) -> Result<impl IntoResponse, AppError> {
    let validated_phone = validate_phone(&req.phone)?;

    tracing::info!(phone = %validated_phone, "OTP send request");

    let mut conn = state.redis_pool.get().await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let rate_key = format!("otp:rate:{}", validated_phone);
    let count: u8 = redis::cmd("INCR")
        .arg(&rate_key)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    if count == 1 {
        let _: () = redis::cmd("EXPIRE")
            .arg(&rate_key)
            .arg(RATE_LIMIT_WINDOW_SECS)
            .query_async(&mut *conn)
            .await
            .map_err(|e| AppError::Cache(e.to_string()))?;
    }

    if count > OTP_RATE_LIMIT {
        tracing::warn!(phone = %validated_phone, "Rate limit exceeded");
        return Err(AppError::RateLimitExceeded);
    }

    let otp: u32 = rand::thread_rng().gen_range(100000..=999999);
    let secret = std::env::var("OTP_HMAC_SECRET")
        .unwrap_or_else(|_| "dev-otp-secret-change-in-prod".to_string());

    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes())
        .map_err(|_| AppError::Internal("HMAC init failed".into()))?;
    mac.update(otp.to_string().as_bytes());
    let otp_hash = hex::encode(mac.finalize().into_bytes());

    let otp_key = format!("otp:hash:{}", validated_phone);
    let attempt_key = format!("otp:attempts:{}", validated_phone);

    let _: () = redis::cmd("SETEX")
        .arg(&otp_key)
        .arg(OTP_TTL_SECS)
        .arg(&otp_hash)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let _: () = redis::cmd("SETEX")
        .arg(&attempt_key)
        .arg(OTP_TTL_SECS)
        .arg(0u8)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    tracing::info!(phone = %validated_phone, otp = %otp, "OTP generated");

    Ok(ok(SendOtpResponse {
        message: "OTP sent successfully".to_string(),
        expires_in: OTP_TTL_SECS as u32,
    }))
}

pub async fn verify_otp(
    State(state): State<AppState>,
    Json(req): Json<VerifyOtpRequest>,
) -> Result<impl IntoResponse, AppError> {
    let validated_phone = validate_phone(&req.phone)?;

    tracing::info!(phone = %validated_phone, "OTP verify request");

    let mut conn = state.redis_pool.get().await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let attempt_key = format!("otp:attempts:{}", validated_phone);
    let attempts: Option<u8> = redis::cmd("GET")
        .arg(&attempt_key)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let current_attempts = attempts.unwrap_or(0);
    if current_attempts >= OTP_MAX_ATTEMPTS {
        return Err(AppError::Auth(shared::error::AuthError::OtpMaxAttemptsExceeded));
    }

    let _: () = redis::cmd("INCR")
        .arg(&attempt_key)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let secret = std::env::var("OTP_HMAC_SECRET")
        .unwrap_or_else(|_| "dev-otp-secret-change-in-prod".to_string());

    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes())
        .map_err(|_| AppError::Internal("HMAC init failed".into()))?;
    mac.update(req.otp.as_bytes());
    let submitted_hash = hex::encode(mac.finalize().into_bytes());

    let stored_key = format!("otp:hash:{}", validated_phone);
    let stored_hash: Option<String> = redis::cmd("GET")
        .arg(&stored_key)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    match stored_hash {
        Some(h) if h == submitted_hash => {
            let _: () = redis::cmd("DEL")
                .arg(&[&stored_key, &attempt_key])
                .query_async(&mut *conn)
                .await
                .map_err(|e| AppError::Cache(e.to_string()))?;

            let user_id = uuid::Uuid::new_v4();
            let roles = vec![shared::jwt::Role::Citizen];

            let access_token = state.jwt_svc.issue_access_token(
                user_id,
                &req.kiosk_id,
                roles,
                "en",
            )?;

            let refresh_token = state.jwt_svc.issue_refresh_token(
                user_id,
                uuid::Uuid::new_v4(),
            )?;

            tracing::info!(user_id = %user_id, phone = %validated_phone, "User authenticated");

            Ok(ok(VerifyOtpResponse {
                access_token,
                refresh_token,
                expires_in: state.config.jwt.access_ttl_secs,
                user_id: user_id.to_string(),
            }))
        }
        Some(_) => Err(AppError::Auth(shared::error::AuthError::InvalidOtp)),
        None => Err(AppError::Auth(shared::error::AuthError::OtpExpired)),
    }
}
