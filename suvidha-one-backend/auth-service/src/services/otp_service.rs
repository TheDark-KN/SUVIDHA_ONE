use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::sync::Arc;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum OtpError {
    #[error("Rate limit exceeded")]
    RateLimitExceeded,
    #[error("Invalid OTP")]
    InvalidOtp,
    #[error("OTP expired")]
    OtpExpired,
    #[error("Max attempts exceeded")]
    MaxAttemptsExceeded,
    #[error("Internal error: {0}")]
    Internal(String),
}

pub struct OtpService {
    hmac_secret: String,
}

impl OtpService {
    pub fn new(hmac_secret: String) -> Self {
        Self { hmac_secret }
    }

    pub fn generate_otp(&self) -> u32 {
        use rand::Rng;
        rand::thread_rng().gen_range(100000..=999999)
    }

    pub fn hash_otp(&self, otp: u32) -> Result<String, OtpError> {
        let mut mac = Hmac::<Sha256>::new_from_slice(self.hmac_secret.as_bytes())
            .map_err(|e| OtpError::Internal(e.to_string()))?;
        mac.update(otp.to_string().as_bytes());
        Ok(hex::encode(mac.finalize().into_bytes()))
    }

    pub fn verify_otp(&self, otp: &str, stored_hash: &str) -> bool {
        let mut mac = match Hmac::<Sha256>::new_from_slice(self.hmac_secret.as_bytes()) {
            Ok(m) => m,
            Err(_) => return false,
        };
        mac.update(otp.as_bytes());
        let computed_hash = hex::encode(mac.finalize().into_bytes());
        computed_hash == stored_hash
    }
}

pub type BoxedOtpService = Arc<OtpService>;
