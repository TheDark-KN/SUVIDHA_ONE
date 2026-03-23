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
    SmsError,
};

const OTP_TTL_SECS: usize = 300; // 5 minutes
const OTP_MAX_ATTEMPTS: u8 = 3;
const OTP_RATE_LIMIT: u8 = 3; // 3 OTPs per hour
const RATE_LIMIT_WINDOW_SECS: usize = 3600; // 1 hour

#[derive(Debug, Deserialize, Serialize)]
pub struct SendOtpRequest {
    pub phone: String,
    pub kiosk_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SendOtpResponse {
    pub message: String,
    pub expires_in: u32,
    pub sms_request_id: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct VerifyOtpRequest {
    pub phone: String,
    pub otp: String,
    pub kiosk_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct VerifyOtpResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: u64,
    pub user_id: String,
}

pub async fn send_otp(
    State(state): State<AppState>,
    Json(req): Json<SendOtpRequest>,
) -> Result<impl IntoResponse, AppError> {
    // Validate phone number format
    let validated_phone = state.sms_service.validate_phone(&req.phone)
        .map_err(|e| AppError::Validation(format!("Invalid phone number: {}", e)))?;

    tracing::info!(phone = %validated_phone, kiosk = %req.kiosk_id, "Processing OTP send request");

    // Rate limiting: check if user has exceeded OTP requests
    let rate_key = format!("otp:rate:{}", validated_phone);
    let mut conn = state.redis_pool.get().await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let count: u8 = redis::cmd("INCR")
        .arg(&rate_key)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    if count == 1 {
        // Set expiration only for first request
        redis::cmd("EXPIRE")
            .arg(&rate_key)
            .arg(RATE_LIMIT_WINDOW_SECS)
            .query_async::<_, ()>(&mut *conn)
            .await
            .map_err(|e| AppError::Cache(e.to_string()))?;
    }

    if count > OTP_RATE_LIMIT {
        tracing::warn!(phone = %validated_phone, count = count, "Rate limit exceeded for OTP");
        return Err(AppError::RateLimitExceeded);
    }

    // Generate 6-digit OTP
    let otp: u32 = rand::thread_rng().gen_range(100000..=999999);

    // Hash OTP for secure storage
    let secret = std::env::var("OTP_HMAC_SECRET").unwrap_or_else(|_| "default-secret".to_string());
    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes())
        .map_err(|_| AppError::Internal("HMAC init failed".into()))?;
    mac.update(otp.to_string().as_bytes());
    let otp_hash = hex::encode(mac.finalize().into_bytes());

    // Store OTP hash and reset attempt counter
    let otp_key = format!("otp:hash:{}", validated_phone);
    let attempt_key = format!("otp:attempts:{}", validated_phone);

    // Store both values using separate commands (Redis transaction not strictly needed here)
    redis::cmd("SETEX")
        .arg(&otp_key)
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

    // Send SMS via Fast2SMS
    let sms_request_id = match state.sms_service.send_otp_sms(&validated_phone, otp).await {
        Ok(request_id) => {
            tracing::info!(
                phone = %validated_phone, 
                sms_request_id = %request_id,
                otp_generated = true,
                "OTP SMS sent successfully"
            );
            Some(request_id)
        }
        Err(SmsError::RateLimitExceeded) => {
            return Err(AppError::RateLimitExceeded);
        }
        Err(e) => {
            tracing::error!(
                phone = %validated_phone,
                error = %e,
                "Failed to send OTP SMS"
            );
            // In production, you might want to still return success but log for monitoring
            // For now, we'll return an error
            return Err(AppError::External(format!("SMS delivery failed: {}", e)));
        }
    };

    Ok(ok(SendOtpResponse {
        message: "OTP sent successfully".to_string(),
        expires_in: OTP_TTL_SECS as u32,
        sms_request_id,
    }))
}

pub async fn verify_otp(
    State(state): State<AppState>,
    Json(req): Json<VerifyOtpRequest>,
) -> Result<impl IntoResponse, AppError> {
    // Validate phone number format
    let validated_phone = state.sms_service.validate_phone(&req.phone)
        .map_err(|e| AppError::Validation(format!("Invalid phone number: {}", e)))?;

    tracing::info!(phone = %validated_phone, kiosk = %req.kiosk_id, "Processing OTP verification");

    let attempt_key = format!("otp:attempts:{}", validated_phone);
    let mut conn = state.redis_pool.get().await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    // Check current attempt count
    let attempts: Option<u8> = redis::cmd("GET")
        .arg(&attempt_key)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let current_attempts = attempts.unwrap_or(0);
    if current_attempts >= OTP_MAX_ATTEMPTS {
        tracing::warn!(phone = %validated_phone, attempts = current_attempts, "Max OTP attempts exceeded");
        return Err(AppError::Auth(shared::error::AuthError::OtpMaxAttemptsExceeded));
    }

    // Increment attempt count
    redis::cmd("INCR")
        .arg(&attempt_key)
        .query_async::<_, ()>(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    // Hash submitted OTP for comparison
    let secret = std::env::var("OTP_HMAC_SECRET").unwrap_or_else(|_| "default-secret".to_string());
    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes())
        .map_err(|_| AppError::Internal("HMAC init failed".into()))?;
    mac.update(req.otp.as_bytes());
    let submitted_hash = hex::encode(mac.finalize().into_bytes());

    // Get stored OTP hash
    let stored_key = format!("otp:hash:{}", validated_phone);
    let stored_hash: Option<String> = redis::cmd("GET")
        .arg(&stored_key)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    match stored_hash {
        Some(h) if h == submitted_hash => {
            // OTP is valid - cleanup and create session
            redis::cmd("DEL")
                .arg(&[&stored_key, &attempt_key])
                .query_async::<_, ()>(&mut *conn)
                .await
                .map_err(|e| AppError::Cache(e.to_string()))?;

            // Create user session
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

            // Store session data in Redis
            let session_key = format!("session:{}", user_id);
            let session_data = serde_json::json!({
                "session_id": uuid::Uuid::new_v4(),
                "user_id": user_id,
                "phone": validated_phone,
                "kiosk_id": req.kiosk_id,
                "auth_method": "otp",
                "created_at": chrono::Utc::now().to_rfc3339(),
                "last_active": chrono::Utc::now().to_rfc3339(),
            });

            redis::cmd("SETEX")
                .arg(&session_key)
                .arg(state.config.jwt.access_ttl_secs)
                .arg(session_data.to_string())
                .query_async::<_, ()>(&mut *conn)
                .await
                .map_err(|e| AppError::Cache(e.to_string()))?;

            tracing::info!(
                user_id = %user_id, 
                phone = %validated_phone,
                kiosk = %req.kiosk_id,
                "User authenticated successfully via OTP"
            );

            Ok(ok(VerifyOtpResponse {
                access_token,
                refresh_token,
                expires_in: state.config.jwt.access_ttl_secs,
                user_id: user_id.to_string(),
            }))
        }
        Some(_) => {
            tracing::warn!(phone = %validated_phone, attempts = current_attempts + 1, "Invalid OTP submitted");
            Err(AppError::Auth(shared::error::AuthError::InvalidOtp))
        }
        None => {
            tracing::warn!(phone = %validated_phone, "OTP not found or expired");
            Err(AppError::Auth(shared::error::AuthError::OtpExpired))
        }
    }
}
