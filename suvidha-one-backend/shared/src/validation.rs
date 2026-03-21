use axum::{
    async_trait,
    extract::{FromRequest, Request},
};
use serde::de::DeserializeOwned;
use validator::Validate;
use axum::Json;

use crate::error::AppError;

/// Validated extractor for request bodies with automatic validation
/// 
/// Usage:
/// ```
/// async fn create_user(Validated(payload): Validated<CreateUserRequest>) -> Result<Json<User>, AppError> {
///     // payload is already validated
/// }
/// ```
pub struct Validated<T>(pub T);

#[async_trait]
impl<T, S> FromRequest<S> for Validated<T>
where
    T: DeserializeOwned + Validate + 'static,
    S: Send + Sync,
    axum::body::Body: Send + 'static,
{
    type Rejection = AppError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(value) = Json::<T>::from_request(req, state)
            .await
            .map_err(|e| AppError::Validation(format!("JSON deserialization failed: {}", e)))?;
        
        value
            .validate()
            .map_err(|e| AppError::Validation(format!("Validation failed: {}", e)))?;
        
        Ok(Validated(value))
    }
}

/// Validate mobile number (Indian format: 10 digits starting with 6-9)
pub fn validate_mobile(mobile: &str) -> bool {
    mobile.len() == 10 
        && mobile.chars().all(|c| c.is_numeric())
        && matches!(mobile.chars().next(), Some('6'..='9'))
}

/// Validate Aadhaar number (12 digits)
pub fn validate_aadhaar(aadhaar: &str) -> bool {
    aadhaar.len() == 12 && aadhaar.chars().all(|c| c.is_numeric())
}

/// Validate amount (positive, max 2 decimal places)
pub fn validate_amount(amount: f64) -> bool {
    amount > 0.0 && amount <= 1_000_000.0 && (amount * 100.0).fract() < 0.01
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_mobile() {
        assert!(validate_mobile("9876543210"));
        assert!(validate_mobile("6123456789"));
        assert!(!validate_mobile("1234567890")); // doesn't start with 6-9
        assert!(!validate_mobile("98765432")); // too short
        assert!(!validate_mobile("987654321a")); // contains letter
    }

    #[test]
    fn test_validate_aadhaar() {
        assert!(validate_aadhaar("123456789012"));
        assert!(!validate_aadhaar("12345678901")); // too short
        assert!(!validate_aadhaar("12345678901a")); // contains letter
    }

    #[test]
    fn test_validate_amount() {
        assert!(validate_amount(100.50));
        assert!(validate_amount(1.99));
        assert!(!validate_amount(0.0)); // zero
        assert!(!validate_amount(-10.0)); // negative
        assert!(!validate_amount(1_500_000.0)); // too large
    }
}
