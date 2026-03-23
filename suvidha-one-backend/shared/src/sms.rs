use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum SmsError {
    #[error("SMS request failed: {0}")]
    RequestFailed(String),
    #[error("Invalid phone number: {0}")]
    InvalidPhone(String),
    #[error("SMS service configuration error: {0}")]
    ConfigError(String),
    #[error("Rate limit exceeded")]
    RateLimitExceeded,
}

#[derive(Debug, Serialize)]
struct Fast2SmsRequest {
    authorization: String,
    message: Vec<String>,
    language: String,
    route: String,
    numbers: String,
}

#[derive(Debug, Deserialize)]
struct Fast2SmsResponse {
    #[serde(rename = "return")]
    return_status: bool,
    request_id: String,
    message: Vec<String>,
}

pub struct SmsService {
    api_key: String,
    sender_id: String,
    client: reqwest::Client,
}

impl SmsService {
    pub fn new() -> Result<Self, SmsError> {
        let api_key = std::env::var("FAST2SMS_API_KEY")
            .map_err(|_| SmsError::ConfigError("FAST2SMS_API_KEY not set".to_string()))?;
        
        let sender_id = std::env::var("FAST2SMS_SENDER_ID")
            .unwrap_or_else(|_| "FSTSMS".to_string());

        let client = reqwest::Client::new();

        Ok(Self {
            api_key,
            sender_id,
            client,
        })
    }

    /// Validates and normalizes Indian phone number to +91XXXXXXXXXX format
    pub fn validate_phone(&self, phone: &str) -> Result<String, SmsError> {
        let cleaned = phone.trim().replace(&[' ', '-', '(', ')'][..], "");
        
        let normalized = if cleaned.starts_with("+91") {
            cleaned
        } else if cleaned.starts_with("91") && cleaned.len() == 12 {
            format!("+{}", cleaned)
        } else if cleaned.len() == 10 && cleaned.chars().all(|c| c.is_ascii_digit()) {
            format!("+91{}", cleaned)
        } else {
            return Err(SmsError::InvalidPhone(
                "Phone number must be a valid Indian number (+91XXXXXXXXXX)".to_string()
            ));
        };

        // Validate the final format
        if !normalized.starts_with("+91") || normalized.len() != 13 {
            return Err(SmsError::InvalidPhone(
                "Phone number must be in format +91XXXXXXXXXX".to_string()
            ));
        }

        Ok(normalized)
    }

    /// Sends OTP SMS via Fast2SMS
    pub async fn send_otp_sms(&self, phone: &str, otp: u32) -> Result<String, SmsError> {
        let validated_phone = self.validate_phone(phone)?;
        let phone_number = validated_phone.trim_start_matches("+91"); // Fast2SMS expects without +91

        let message = format!("Your SUVIDHA ONE OTP is: {}. Valid for 5 minutes. Do not share this code with anyone.", otp);

        let request_data = serde_json::json!({
            "authorization": self.api_key,
            "message": vec![message],
            "language": "english",
            "route": "otp",
            "numbers": phone_number
        });

        tracing::info!(phone = %validated_phone, "Sending OTP SMS via Fast2SMS");

        let response = self.client
            .post("https://www.fast2sms.com/dev/bulkV2")
            .header("Content-Type", "application/json")
            .json(&request_data)
            .send()
            .await
            .map_err(|e| SmsError::RequestFailed(format!("HTTP request failed: {}", e)))?;

        let status = response.status();
        let response_text = response.text().await
            .map_err(|e| SmsError::RequestFailed(format!("Failed to read response: {}", e)))?;

        if status.is_success() {
            match serde_json::from_str::<Fast2SmsResponse>(&response_text) {
                Ok(sms_response) => {
                    if sms_response.return_status {
                        tracing::info!(request_id = %sms_response.request_id, "OTP SMS sent successfully");
                        Ok(sms_response.request_id)
                    } else {
                        tracing::error!(response = %response_text, "Fast2SMS returned failure status");
                        Err(SmsError::RequestFailed("SMS service returned failure status".to_string()))
                    }
                }
                Err(e) => {
                    tracing::error!(response = %response_text, error = %e, "Failed to parse SMS response");
                    Err(SmsError::RequestFailed(format!("Invalid response format: {}", e)))
                }
            }
        } else {
            tracing::error!(status = %status, response = %response_text, "SMS API request failed");
            Err(SmsError::RequestFailed(format!("SMS API returned status {}: {}", status, response_text)))
        }
    }

    /// Sends custom SMS message
    pub async fn send_message(&self, phone: &str, message: &str) -> Result<String, SmsError> {
        let validated_phone = self.validate_phone(phone)?;
        let phone_number = validated_phone.trim_start_matches("+91");

        let request_data = serde_json::json!({
            "authorization": self.api_key,
            "message": vec![message],
            "language": "english",
            "route": "p",
            "numbers": phone_number
        });

        let response = self.client
            .post("https://www.fast2sms.com/dev/bulkV2")
            .header("Content-Type", "application/json")
            .json(&request_data)
            .send()
            .await
            .map_err(|e| SmsError::RequestFailed(format!("HTTP request failed: {}", e)))?;

        if response.status().is_success() {
            let sms_response: Fast2SmsResponse = response.json().await
                .map_err(|e| SmsError::RequestFailed(format!("Failed to parse response: {}", e)))?;

            if sms_response.return_status {
                Ok(sms_response.request_id)
            } else {
                Err(SmsError::RequestFailed("SMS service returned failure status".to_string()))
            }
        } else {
            Err(SmsError::RequestFailed(format!("SMS API request failed with status: {}", response.status())))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_phone_validation() {
        let service = SmsService {
            api_key: "test".to_string(),
            sender_id: "TEST".to_string(),
            client: reqwest::Client::new(),
        };

        // Valid formats
        assert_eq!(service.validate_phone("+919876543210").unwrap(), "+919876543210");
        assert_eq!(service.validate_phone("919876543210").unwrap(), "+919876543210");
        assert_eq!(service.validate_phone("9876543210").unwrap(), "+919876543210");
        assert_eq!(service.validate_phone(" 98765 43210 ").unwrap(), "+919876543210");

        // Invalid formats
        assert!(service.validate_phone("123456789").is_err());
        assert!(service.validate_phone("+1234567890").is_err());
        assert!(service.validate_phone("abc1234567").is_err());
    }
}