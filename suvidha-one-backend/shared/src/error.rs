use axum::{
    http::StatusCode,
    response::{IntoResponse, Json, Response},
};
use serde::Serialize;
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Authentication error: {0}")]
    Auth(#[from] AuthError),

    #[error("Payment error: {0}")]
    Payment(#[from] PaymentError),

    #[error("JWT error: {0}")]
    Jwt(#[from] crate::jwt::JwtError),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("Rate limited: {0}")]
    RateLimited(String),

    #[error("External API error: {0}")]
    ExternalApi(String),

    #[error("External service error: {0}")]
    External(String),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Cache error: {0}")]
    Cache(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("Missing authentication token")]
    MissingToken,

    #[error("Invalid authentication token")]
    InvalidToken,

    #[error("Token expired")]
    TokenExpired,

    #[error("Invalid OTP")]
    InvalidOtp,

    #[error("OTP expired")]
    OtpExpired,

    #[error("Maximum OTP attempts exceeded")]
    OtpMaxAttemptsExceeded,

    #[error("Session invalidated")]
    SessionInvalidated,

    #[error("Refresh token replay detected")]
    RefreshTokenReplay,

    #[error("Aadhaar verification failed")]
    AadhaarVerificationFailed,

    #[error("QR code invalid")]
    QrCodeInvalid,
}

#[derive(Debug, Error)]
pub enum PaymentError {
    #[error("Bill already paid")]
    AlreadyPaid,

    #[error("Unauthorized payment")]
    Unauthorized,

    #[error("Payment gateway error: {0}")]
    GatewayError(String),

    #[error("Invalid payment amount")]
    InvalidAmount,

    #[error("Payment timeout")]
    Timeout,
}

#[derive(Debug, Error)]
pub enum UtilityError {
    #[error("Bill not found")]
    BillNotFound,

    #[error("BBPS error: {0}")]
    BbpsError(String),

    #[error("Consumer not found")]
    ConsumerNotFound,
}

#[derive(Debug, Error)]
pub enum GrievanceError {
    #[error("Grievance not found")]
    NotFound,

    #[error("Grievance already closed")]
    AlreadyClosed,

    #[error("Invalid grievance status")]
    InvalidStatus,
}

#[derive(Debug, Error)]
pub enum DocumentError {
    #[error("Document not found")]
    NotFound,

    #[error("DigiLocker error: {0}")]
    DigiLockerError(String),

    #[error("Not eligible for certificate")]
    NotEligible,
}

#[derive(Debug, Error)]
pub enum NotificationError {
    #[error("SMS gateway error: {0}")]
    SmsError(String),

    #[error("WhatsApp error: {0}")]
    WhatsAppError(String),
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error_code: u32,
    pub message: String,
    pub request_id: Uuid,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message) = match &self {
            AppError::Auth(AuthError::MissingToken) => {
                (StatusCode::UNAUTHORIZED, 1001, self.to_string())
            }
            AppError::Auth(AuthError::TokenExpired) => {
                (StatusCode::UNAUTHORIZED, 1002, self.to_string())
            }
            AppError::Auth(AuthError::InvalidOtp) => {
                (StatusCode::UNAUTHORIZED, 1003, self.to_string())
            }
            AppError::Auth(AuthError::OtpExpired) => {
                (StatusCode::UNAUTHORIZED, 1004, self.to_string())
            }
            AppError::Auth(AuthError::SessionInvalidated) => {
                (StatusCode::UNAUTHORIZED, 1005, self.to_string())
            }
            AppError::Auth(AuthError::RefreshTokenReplay) => {
                (StatusCode::UNAUTHORIZED, 1006, self.to_string())
            }
            AppError::Auth(AuthError::InvalidToken) => {
                (StatusCode::UNAUTHORIZED, 1007, self.to_string())
            }
            AppError::Auth(AuthError::AadhaarVerificationFailed) => {
                (StatusCode::UNAUTHORIZED, 1008, self.to_string())
            }
            AppError::Auth(AuthError::QrCodeInvalid) => {
                (StatusCode::UNAUTHORIZED, 1009, self.to_string())
            }
            AppError::Auth(AuthError::OtpMaxAttemptsExceeded) => {
                (StatusCode::TOO_MANY_REQUESTS, 1010, self.to_string())
            }

            AppError::Jwt(_) => {
                (StatusCode::UNAUTHORIZED, 1011, self.to_string())
            }

            AppError::Payment(PaymentError::AlreadyPaid) => {
                (StatusCode::CONFLICT, 2001, self.to_string())
            }
            AppError::Payment(PaymentError::Unauthorized) => {
                (StatusCode::FORBIDDEN, 2002, self.to_string())
            }
            AppError::Payment(PaymentError::GatewayError(_)) => {
                (StatusCode::BAD_GATEWAY, 2003, self.to_string())
            }
            AppError::Payment(PaymentError::InvalidAmount) => {
                (StatusCode::BAD_REQUEST, 2004, self.to_string())
            }
            AppError::Payment(PaymentError::Timeout) => {
                (StatusCode::GATEWAY_TIMEOUT, 2005, self.to_string())
            }

            AppError::Validation(_) => (StatusCode::BAD_REQUEST, 9001, self.to_string()),
            AppError::NotFound(_) => (StatusCode::NOT_FOUND, 9002, self.to_string()),
            AppError::Forbidden(_) => (StatusCode::FORBIDDEN, 9003, self.to_string()),
            AppError::RateLimitExceeded => (
                StatusCode::TOO_MANY_REQUESTS,
                9004,
                "Rate limit exceeded. Please wait.".into(),
            ),
            AppError::RateLimited(msg) => (
                StatusCode::TOO_MANY_REQUESTS,
                9004,
                msg.clone(),
            ),
            AppError::ExternalApi(_) => (
                StatusCode::BAD_GATEWAY,
                9005,
                "External service unavailable.".into(),
            ),
            AppError::External(_) => (
                StatusCode::BAD_GATEWAY,
                9007,
                "External service error.".into(),
            ),
            AppError::Config(_) => {
                tracing::error!("Config error: {:?}", self);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    9008,
                    "Service configuration error.".into(),
                )
            }
            AppError::Database(_) | AppError::Internal(_) => {
                tracing::error!("Internal error: {:?}", self);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    9999,
                    "An internal error occurred.".into(),
                )
            }
            AppError::Cache(_) => (
                StatusCode::SERVICE_UNAVAILABLE,
                9006,
                "Cache service unavailable.".into(),
            ),
        };

        (
            status,
            Json(ErrorResponse {
                error_code: code,
                message,
                request_id: Uuid::new_v4(),
            }),
        )
            .into_response()
    }
}

impl IntoResponse for UtilityError {
    fn into_response(self) -> Response {
        let (status, code, message) = match self {
            UtilityError::BillNotFound => {
                (StatusCode::NOT_FOUND, 3001, "Bill not found".to_string())
            }
            UtilityError::BbpsError(e) => {
                (StatusCode::BAD_GATEWAY, 3002, format!("BBPS error: {}", e))
            }
            UtilityError::ConsumerNotFound => (
                StatusCode::NOT_FOUND,
                3003,
                "Consumer not found".to_string(),
            ),
        };
        (
            status,
            Json(ErrorResponse {
                error_code: code,
                message,
                request_id: Uuid::new_v4(),
            }),
        )
            .into_response()
    }
}

impl IntoResponse for GrievanceError {
    fn into_response(self) -> Response {
        let (status, code, message) = match self {
            GrievanceError::NotFound => (
                StatusCode::NOT_FOUND,
                4001,
                "Grievance not found".to_string(),
            ),
            GrievanceError::AlreadyClosed => (
                StatusCode::CONFLICT,
                4002,
                "Grievance already closed".to_string(),
            ),
            GrievanceError::InvalidStatus => (
                StatusCode::BAD_REQUEST,
                4003,
                "Invalid grievance status".to_string(),
            ),
        };
        (
            status,
            Json(ErrorResponse {
                error_code: code,
                message,
                request_id: Uuid::new_v4(),
            }),
        )
            .into_response()
    }
}

impl IntoResponse for DocumentError {
    fn into_response(self) -> Response {
        let (status, code, message) = match self {
            DocumentError::NotFound => (
                StatusCode::NOT_FOUND,
                5001,
                "Document not found".to_string(),
            ),
            DocumentError::DigiLockerError(e) => (
                StatusCode::BAD_GATEWAY,
                5002,
                format!("DigiLocker error: {}", e),
            ),
            DocumentError::NotEligible => (
                StatusCode::FORBIDDEN,
                5003,
                "Not eligible for certificate".to_string(),
            ),
        };
        (
            status,
            Json(ErrorResponse {
                error_code: code,
                message,
                request_id: Uuid::new_v4(),
            }),
        )
            .into_response()
    }
}

impl IntoResponse for NotificationError {
    fn into_response(self) -> Response {
        let (status, code, message) = match self {
            NotificationError::SmsError(e) => {
                (StatusCode::BAD_GATEWAY, 6001, format!("SMS error: {}", e))
            }
            NotificationError::WhatsAppError(e) => (
                StatusCode::BAD_GATEWAY,
                6002,
                format!("WhatsApp error: {}", e),
            ),
        };
        (
            status,
            Json(ErrorResponse {
                error_code: code,
                message,
                request_id: Uuid::new_v4(),
            }),
        )
            .into_response()
    }
}
