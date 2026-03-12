use crate::AppState;
use axum::{
    extract::{State, Json},
    http::header::HeaderMap,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use shared::{
    models::PaymentStatus,
    error::AppError,
};

#[derive(Debug, Deserialize)]
pub struct UpiWebhookPayload {
    pub transaction_id: String,
    pub status: String,
    pub amount: f64,
    pub utr: Option<String>,
    pub timestamp: String,
}

#[derive(Debug, Serialize)]
pub struct WebhookResponse {
    pub received: bool,
}

pub async fn upi_callback(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<UpiWebhookPayload>,
) -> Result<StatusCode, AppError> {
    let _signature = headers
        .get("X-NPCI-Signature")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::Validation("Missing webhook signature".to_string()))?;

    let _webhook_secret = std::env::var("NPCI_WEBHOOK_SECRET")
        .unwrap_or_else(|_| "default-secret".to_string());

    let key = format!("webhook:upi:{}", payload.transaction_id);
    let mut conn = state.redis_pool.get().await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let exists: bool = redis::cmd("SETNX")
        .arg(&key)
        .arg(1u8)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    if !exists {
        tracing::info!(txn_id = %payload.transaction_id, "Webhook already processed");
        return Ok(StatusCode::OK);
    }

    redis::cmd("EXPIRE")
        .arg(&key)
        .arg(86400)
        .query_async::<_, ()>(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let new_status = match payload.status.as_str() {
        "SUCCESS" => PaymentStatus::Success,
        "FAILED" => PaymentStatus::Failed,
        _ => PaymentStatus::Pending,
    };

    sqlx::query!(
        "UPDATE payments SET status = $1, tx_ref = COALESCE($2, tx_ref), updated_at = NOW()
         WHERE tx_ref = $3",
        new_status as PaymentStatus,
        payload.utr,
        payload.transaction_id
    )
    .execute(&state.db_pool)
    .await?;

    tracing::info!(
        txn_id = %payload.transaction_id,
        status = ?new_status,
        amount = payload.amount,
        "UPI webhook processed"
    );

    Ok(StatusCode::OK)
}
