use hmac::{Hmac, Mac};
use reqwest::Client;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use thiserror::Error;
use uuid::Uuid;

#[derive(Error, Debug)]
pub enum RazorpayError {
    #[error("Razorpay API error: {0}")]
    ApiError(String),
    #[error("Invalid configuration: {0}")]
    ConfigError(String),
    #[error("Signature verification failed")]
    SignatureInvalid,
    #[error("Request failed: {0}")]
    RequestFailed(String),
    #[error("Invalid amount: {0}")]
    InvalidAmount(String),
}

/// Razorpay Order creation request
#[derive(Debug, Serialize)]
pub struct CreateOrderRequest {
    pub amount: i64, // Amount in paise
    pub currency: String,
    pub receipt: String,
    pub notes: serde_json::Value,
}

/// Razorpay Order response
#[derive(Debug, Deserialize, Clone)]
pub struct RazorpayOrder {
    pub id: String,
    pub entity: String,
    pub amount: i64,
    pub amount_paid: i64,
    pub amount_due: i64,
    pub currency: String,
    pub receipt: String,
    pub status: String,
    pub created_at: i64,
}

/// Payment verification request
#[derive(Debug, Deserialize, Serialize)]
pub struct PaymentVerificationRequest {
    pub razorpay_order_id: String,
    pub razorpay_payment_id: String,
    pub razorpay_signature: String,
}

/// Razorpay Payment details
#[derive(Debug, Deserialize, Clone)]
pub struct RazorpayPayment {
    pub id: String,
    pub entity: String,
    pub amount: i64,
    pub currency: String,
    pub status: String,
    pub order_id: String,
    pub method: String,
    pub description: Option<String>,
    pub bank: Option<String>,
    pub wallet: Option<String>,
    pub vpa: Option<String>,
    pub email: Option<String>,
    pub contact: Option<String>,
    pub created_at: i64,
    pub captured: bool,
}

/// Razorpay Webhook event
#[derive(Debug, Deserialize)]
pub struct RazorpayWebhookEvent {
    pub entity: String,
    pub account_id: String,
    pub event: String,
    pub contains: Vec<String>,
    pub payload: RazorpayWebhookPayload,
    pub created_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct RazorpayWebhookPayload {
    pub payment: Option<RazorpayWebhookEntity<RazorpayPayment>>,
    pub order: Option<RazorpayWebhookEntity<RazorpayOrder>>,
}

#[derive(Debug, Deserialize)]
pub struct RazorpayWebhookEntity<T> {
    pub entity: T,
}

/// Kiosk-specific payment request
#[derive(Debug, Deserialize, Serialize)]
pub struct KioskPaymentRequest {
    pub phone: String,
    pub amount: i64, // Amount in paise (₹100 = 10000 paise)
    pub service_type: String, // "aadhaar_print", "document_verify", "certificate"
    pub kiosk_id: String,
}

/// Kiosk payment response with QR code
#[derive(Debug, Serialize)]
pub struct KioskPaymentResponse {
    pub order_id: String,
    pub amount: i64,
    pub amount_display: String, // "₹100.00"
    pub currency: String,
    pub receipt: String,
    pub razorpay_key_id: String,
    pub qr_code_url: Option<String>,
    pub upi_link: String,
    pub status: String,
    pub expires_at: i64,
}

/// Razorpay service for handling payments
pub struct RazorpayService {
    key_id: String,
    key_secret: String,
    client: Client,
    base_url: String,
}

impl RazorpayService {
    pub fn new() -> Result<Self, RazorpayError> {
        let key_id = std::env::var("RAZORPAY_KEY_ID")
            .map_err(|_| RazorpayError::ConfigError("RAZORPAY_KEY_ID not set".to_string()))?;
        
        let key_secret = std::env::var("RAZORPAY_KEY_SECRET")
            .map_err(|_| RazorpayError::ConfigError("RAZORPAY_KEY_SECRET not set".to_string()))?;

        let base_url = std::env::var("RAZORPAY_BASE_URL")
            .unwrap_or_else(|_| "https://api.razorpay.com/v1".to_string());

        Ok(Self {
            key_id,
            key_secret,
            client: Client::new(),
            base_url,
        })
    }

    /// Creates a new dummy service for testing/development without API keys
    pub fn new_dummy() -> Self {
        Self {
            key_id: "rzp_test_dummy".to_string(),
            key_secret: "dummy_secret".to_string(),
            client: Client::new(),
            base_url: "https://api.razorpay.com/v1".to_string(),
        }
    }

    /// Get the Razorpay Key ID for frontend
    pub fn get_key_id(&self) -> &str {
        &self.key_id
    }

    /// Validates amount is within kiosk limits (₹10 - ₹5000)
    pub fn validate_amount(&self, amount_paise: i64) -> Result<(), RazorpayError> {
        const MIN_AMOUNT: i64 = 1000; // ₹10
        const MAX_AMOUNT: i64 = 500000; // ₹5000

        if amount_paise < MIN_AMOUNT {
            return Err(RazorpayError::InvalidAmount(format!(
                "Minimum amount is ₹10 (got ₹{:.2})",
                amount_paise as f64 / 100.0
            )));
        }

        if amount_paise > MAX_AMOUNT {
            return Err(RazorpayError::InvalidAmount(format!(
                "Maximum amount is ₹5000 (got ₹{:.2})",
                amount_paise as f64 / 100.0
            )));
        }

        Ok(())
    }

    /// Create a Razorpay order for kiosk payment
    pub async fn create_order(
        &self,
        amount_paise: i64,
        receipt: &str,
        notes: serde_json::Value,
    ) -> Result<RazorpayOrder, RazorpayError> {
        self.validate_amount(amount_paise)?;

        let request = CreateOrderRequest {
            amount: amount_paise,
            currency: "INR".to_string(),
            receipt: receipt.to_string(),
            notes,
        };

        let response = self.client
            .post(format!("{}/orders", self.base_url))
            .basic_auth(&self.key_id, Some(&self.key_secret))
            .json(&request)
            .send()
            .await
            .map_err(|e| RazorpayError::RequestFailed(e.to_string()))?;

        let status = response.status();
        let response_text = response.text().await
            .map_err(|e| RazorpayError::RequestFailed(e.to_string()))?;

        if status.is_success() {
            serde_json::from_str(&response_text)
                .map_err(|e| RazorpayError::ApiError(format!("Invalid response: {}", e)))
        } else {
            tracing::error!(status = %status, response = %response_text, "Razorpay order creation failed");
            Err(RazorpayError::ApiError(format!("Order creation failed: {}", response_text)))
        }
    }

    /// Create a kiosk-specific payment order
    pub async fn create_kiosk_payment(
        &self,
        request: &KioskPaymentRequest,
    ) -> Result<KioskPaymentResponse, RazorpayError> {
        self.validate_amount(request.amount)?;

        let receipt = format!("KIOSK_{}_{}", request.kiosk_id, Uuid::new_v4().to_string()[..8].to_uppercase());
        
        let notes = serde_json::json!({
            "phone": request.phone,
            "service_type": request.service_type,
            "kiosk_id": request.kiosk_id,
            "platform": "kiosk"
        });

        let order = self.create_order(request.amount, &receipt, notes).await?;

        // Generate UPI deep link for QR scanning
        let amount_rupees = request.amount as f64 / 100.0;
        let upi_link = format!(
            "upi://pay?pa=suvidha@razorpay&pn=SUVIDHA%20ONE&tr={}&tn={}&am={:.2}&cu=INR",
            order.id,
            urlencoding::encode(&request.service_type),
            amount_rupees
        );

        Ok(KioskPaymentResponse {
            order_id: order.id,
            amount: order.amount,
            amount_display: format!("₹{:.2}", amount_rupees),
            currency: order.currency,
            receipt: order.receipt,
            razorpay_key_id: self.key_id.clone(),
            qr_code_url: None, // Frontend generates QR from upi_link
            upi_link,
            status: order.status,
            expires_at: order.created_at + 900, // 15 minutes
        })
    }

    /// Verify payment signature from Razorpay
    pub fn verify_payment_signature(
        &self,
        order_id: &str,
        payment_id: &str,
        signature: &str,
    ) -> Result<bool, RazorpayError> {
        let payload = format!("{}|{}", order_id, payment_id);
        
        let mut mac = Hmac::<Sha256>::new_from_slice(self.key_secret.as_bytes())
            .map_err(|_| RazorpayError::SignatureInvalid)?;
        
        mac.update(payload.as_bytes());
        let expected_signature = hex::encode(mac.finalize().into_bytes());

        if expected_signature == signature {
            Ok(true)
        } else {
            tracing::warn!(
                order_id = %order_id,
                payment_id = %payment_id,
                "Payment signature verification failed"
            );
            Err(RazorpayError::SignatureInvalid)
        }
    }

    /// Verify webhook signature
    pub fn verify_webhook_signature(
        &self,
        body: &str,
        signature: &str,
    ) -> Result<bool, RazorpayError> {
        let webhook_secret = std::env::var("RAZORPAY_WEBHOOK_SECRET")
            .map_err(|_| RazorpayError::ConfigError(
                "RAZORPAY_WEBHOOK_SECRET not set. Configure it in Razorpay Dashboard -> Webhooks.".to_string()
            ))?;

        if webhook_secret.is_empty() || webhook_secret == "your_webhook_secret_here_change_in_production" {
            return Err(RazorpayError::ConfigError(
                "RAZORPAY_WEBHOOK_SECRET is not configured. Set a proper webhook secret.".to_string()
            ));
        }

        let mut mac = Hmac::<Sha256>::new_from_slice(webhook_secret.as_bytes())
            .map_err(|_| RazorpayError::SignatureInvalid)?;
        
        mac.update(body.as_bytes());
        let expected_signature = hex::encode(mac.finalize().into_bytes());

        if expected_signature != signature {
            tracing::warn!("Webhook signature verification failed - possible tampering attempt");
        }

        Ok(expected_signature == signature)
    }

    /// Fetch payment details from Razorpay
    pub async fn get_payment(&self, payment_id: &str) -> Result<RazorpayPayment, RazorpayError> {
        let response = self.client
            .get(format!("{}/payments/{}", self.base_url, payment_id))
            .basic_auth(&self.key_id, Some(&self.key_secret))
            .send()
            .await
            .map_err(|e| RazorpayError::RequestFailed(e.to_string()))?;

        if response.status().is_success() {
            response.json().await
                .map_err(|e| RazorpayError::ApiError(format!("Invalid response: {}", e)))
        } else {
            let error_text = response.text().await.unwrap_or_default();
            Err(RazorpayError::ApiError(format!("Failed to fetch payment: {}", error_text)))
        }
    }

    /// Capture a payment (for auto-capture mode, this is usually not needed)
    pub async fn capture_payment(
        &self,
        payment_id: &str,
        amount_paise: i64,
    ) -> Result<RazorpayPayment, RazorpayError> {
        let request = serde_json::json!({
            "amount": amount_paise,
            "currency": "INR"
        });

        let response = self.client
            .post(format!("{}/payments/{}/capture", self.base_url, payment_id))
            .basic_auth(&self.key_id, Some(&self.key_secret))
            .json(&request)
            .send()
            .await
            .map_err(|e| RazorpayError::RequestFailed(e.to_string()))?;

        if response.status().is_success() {
            response.json().await
                .map_err(|e| RazorpayError::ApiError(format!("Invalid response: {}", e)))
        } else {
            let error_text = response.text().await.unwrap_or_default();
            Err(RazorpayError::ApiError(format!("Failed to capture payment: {}", error_text)))
        }
    }

    /// Initiate a refund
    pub async fn create_refund(
        &self,
        payment_id: &str,
        amount_paise: Option<i64>,
        notes: Option<serde_json::Value>,
    ) -> Result<serde_json::Value, RazorpayError> {
        let mut request = serde_json::json!({});
        
        if let Some(amount) = amount_paise {
            request["amount"] = serde_json::json!(amount);
        }
        
        if let Some(n) = notes {
            request["notes"] = n;
        }

        let response = self.client
            .post(format!("{}/payments/{}/refund", self.base_url, payment_id))
            .basic_auth(&self.key_id, Some(&self.key_secret))
            .json(&request)
            .send()
            .await
            .map_err(|e| RazorpayError::RequestFailed(e.to_string()))?;

        if response.status().is_success() {
            response.json().await
                .map_err(|e| RazorpayError::ApiError(format!("Invalid response: {}", e)))
        } else {
            let error_text = response.text().await.unwrap_or_default();
            Err(RazorpayError::ApiError(format!("Refund failed: {}", error_text)))
        }
    }

    /// Generate thermal printer receipt (ESC/POS compatible)
    pub fn generate_thermal_receipt(
        &self,
        payment: &RazorpayPayment,
        phone: &str,
        service_type: &str,
    ) -> String {
        let amount_rupees = payment.amount as f64 / 100.0;
        let timestamp = chrono::Utc::now().format("%d/%m/%Y %H:%M");
        
        // Hindi/Devanagari receipt with ESC/POS commands
        format!(
            r#"
================================
      सुविधा एक सेवा केंद्र
      SUVIDHA ONE SERVICE
================================

दिनांक/Date: {}
फोन/Phone: {}

सेवा/Service: {}
राशि/Amount: ₹{:.2}

भुगतान विधि/Method: {}
लेनदेन आईडी/TxnID: {}
ऑर्डर आईडी/OrderID: {}

स्थिति/Status: {}

================================
     धन्यवाद! / Thank You!
     www.suvidhaone.gov.in
================================
"#,
            timestamp,
            phone,
            service_type,
            amount_rupees,
            payment.method.to_uppercase(),
            payment.id,
            payment.order_id,
            if payment.captured { "सफल/SUCCESS ✓" } else { "PENDING" }
        )
    }
}

/// Convert Decimal to paise (i64)
pub fn decimal_to_paise(amount: Decimal) -> i64 {
    (amount * Decimal::from(100)).to_string().parse().unwrap_or(0)
}

/// Convert paise to Decimal rupees
pub fn paise_to_decimal(paise: i64) -> Decimal {
    Decimal::from(paise) / Decimal::from(100)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_amount_validation() {
        let service = RazorpayService::new_dummy();
        
        // Valid amounts
        assert!(service.validate_amount(1000).is_ok()); // ₹10
        assert!(service.validate_amount(25000).is_ok()); // ₹250
        assert!(service.validate_amount(500000).is_ok()); // ₹5000
        
        // Invalid amounts
        assert!(service.validate_amount(500).is_err()); // ₹5 - too low
        assert!(service.validate_amount(600000).is_err()); // ₹6000 - too high
    }

    #[test]
    fn test_decimal_conversion() {
        assert_eq!(decimal_to_paise(Decimal::from(100)), 10000);
        assert_eq!(paise_to_decimal(10000), Decimal::from(100));
    }
}
