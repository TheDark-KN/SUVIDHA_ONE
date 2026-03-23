pub mod error;
pub mod jwt;
pub mod models;
pub mod config;
pub mod response;
pub mod middleware;
pub mod tracing;
pub mod validation;
pub mod tts;
pub mod sms;
pub mod razorpay;

pub use error::{AppError, AuthError};
pub use jwt::{JwtService, AccessClaims, RefreshClaims, Role};
pub use models::*;
pub use config::AppConfig;
pub use response::{ApiResponse, Meta, ok, created, no_content};
pub use validation::Validated;
pub use tts::{TtsService, TtsSynthesizeRequest, TtsSynthesizeResponse, TtsLanguage};
pub use sms::{SmsService, SmsError};
pub use razorpay::{
    RazorpayService, RazorpayError, RazorpayOrder, RazorpayPayment,
    KioskPaymentRequest, KioskPaymentResponse, PaymentVerificationRequest,
    RazorpayWebhookEvent, decimal_to_paise, paise_to_decimal
};
