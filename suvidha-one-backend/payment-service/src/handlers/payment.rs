use crate::AppState;
use axum::{
    extract::{State, Path, Json, Extension},
    response::IntoResponse,
};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use shared::{
    jwt::AccessClaims,
    models::{PaymentMethod, PaymentStatus},
    response::ok,
    error::{AppError, PaymentError},
};

#[derive(Debug, Deserialize)]
pub struct InitiatePaymentRequest {
    pub bill_ids: Vec<Uuid>,
    pub method: PaymentMethod,
    pub idempotency_key: Uuid,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaymentResponse {
    pub payment_id: Uuid,
    pub transaction_ref: String,
    pub amount: Decimal,
    pub status: PaymentStatus,
    pub method: PaymentMethod,
    pub qr_code: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PaymentStatusResponse {
    pub payment_id: Uuid,
    pub status: PaymentStatus,
    pub tx_ref: String,
    pub amount: Decimal,
    pub paid_at: Option<chrono::DateTime<chrono::Utc>>,
}

pub async fn initiate_payment(
    State(state): State<AppState>,
    Extension(claims): Extension<AccessClaims>,
    Json(req): Json<InitiatePaymentRequest>,
) -> Result<impl IntoResponse, AppError> {
    let idempotency_key = format!("payment:idem:{}", req.idempotency_key);
    let mut conn = state.redis_pool.get().await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let exists: bool = redis::cmd("EXISTS")
        .arg(&idempotency_key)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    if exists {
        let cached: String = redis::cmd("GET")
            .arg(&idempotency_key)
            .query_async(&mut *conn)
            .await
            .map_err(|e| AppError::Cache(e.to_string()))?;

        let response: PaymentResponse = serde_json::from_str(&cached)
            .map_err(|e| AppError::Internal(e.to_string()))?;

        return Ok(ok(response));
    }

    let mut total = Decimal::ZERO;
    for bill_id in &req.bill_ids {
        let bill: Option<(Uuid, Decimal)> = sqlx::query_as(
            "SELECT bill_id, amount FROM bills WHERE bill_id = $1 AND user_id = $2 AND status = 'Pending'"
        )
        .bind(bill_id)
        .bind(claims.sub)
        .fetch_optional(&state.db_pool)
        .await?;

        match bill {
            Some((_, amount)) => total += amount,
            None => return Err(AppError::Payment(PaymentError::Unauthorized)),
        }
    }

    let payment_id = Uuid::new_v4();
    let tx_ref = format!("TXN{}{:012}", chrono::Utc::now().timestamp_millis(), payment_id.as_fields().0);

    sqlx::query!(
        "INSERT INTO payments (payment_id, user_id, amount, tx_ref, status, method)
         VALUES ($1, $2, $3, $4, 'Pending', $5)",
        payment_id,
        claims.sub,
        total,
        tx_ref,
        req.method as PaymentMethod
    )
    .execute(&state.db_pool)
    .await?;

    for bill_id in &req.bill_ids {
        sqlx::query!(
            "UPDATE bills SET status = 'Paid', paid_at = NOW() WHERE bill_id = $1",
            bill_id
        )
        .execute(&state.db_pool)
        .await?;
    }

    let response = PaymentResponse {
        payment_id,
        transaction_ref: tx_ref.clone(),
        amount: total,
        status: PaymentStatus::Pending,
        method: req.method,
        qr_code: Some(format!("upi://pay?pa=suvidha@bank&pn=SUVIDHA ONE&tn={}&am={}", tx_ref, total)),
    };

    redis::cmd("SETEX")
        .arg(&idempotency_key)
        .arg(86400)
        .arg(serde_json::to_string(&response).unwrap())
        .query_async::<_, ()>(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    tracing::info!(user_id = %claims.sub, payment_id = %payment_id, amount = %total, "Payment initiated");

    Ok(ok(response))
}

pub async fn get_payment_status(
    State(state): State<AppState>,
    Extension(_claims): Extension<AccessClaims>,
    Path(payment_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let payment: Option<(Uuid, String, Decimal, PaymentStatus, Option<chrono::DateTime<chrono::Utc>>)> = sqlx::query_as(
        "SELECT payment_id, tx_ref, amount, status, created_at FROM payments WHERE payment_id = $1"
    )
    .bind(payment_id)
    .fetch_optional(&state.db_pool)
    .await?;

    match payment {
        Some((id, tx_ref, amount, status, created_at)) => {
            Ok(ok(PaymentStatusResponse {
                payment_id: id,
                status,
                tx_ref,
                amount,
                paid_at: created_at,
            }))
        }
        None => Err(AppError::NotFound("Payment not found".to_string())),
    }
}
