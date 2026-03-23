use crate::AppState;
use axum::{
    extract::{State, Path, Json, Extension},
    response::IntoResponse,
    http::HeaderMap,
};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use shared::{
    jwt::AccessClaims,
    models::{PaymentMethod, PaymentStatus},
    response::ok,
    error::{AppError, PaymentError},
    razorpay::{
        RazorpayService, KioskPaymentRequest, KioskPaymentResponse,
        PaymentVerificationRequest, RazorpayWebhookEvent, decimal_to_paise, paise_to_decimal
    },
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

/// Kiosk payment creation request
#[derive(Debug, Deserialize)]
pub struct CreateKioskPaymentRequest {
    pub phone: String,
    pub amount: i64, // Amount in paise
    pub service_type: String,
    pub kiosk_id: Option<String>,
}

/// Kiosk payment verification request
#[derive(Debug, Deserialize)]
pub struct VerifyKioskPaymentRequest {
    pub razorpay_order_id: String,
    pub razorpay_payment_id: String,
    pub razorpay_signature: String,
}

/// Payment history response
#[derive(Debug, Serialize)]
pub struct PaymentHistoryItem {
    pub payment_id: Uuid,
    pub amount: Decimal,
    pub status: String,
    pub service_type: Option<String>,
    pub razorpay_order_id: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub paid_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// Create a Razorpay order for kiosk payment
pub async fn create_kiosk_payment(
    State(state): State<AppState>,
    Json(req): Json<CreateKioskPaymentRequest>,
) -> Result<impl IntoResponse, AppError> {
    // Validate phone format
    let phone = shared::sms::SmsService::validate_phone(&req.phone)
        .map_err(|e| AppError::Validation(e.to_string()))?;

    // Check rate limiting (max 10 payments per hour per phone)
    let rate_key = format!("payment:rate:{}", phone);
    let mut conn = state.redis_pool.get().await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let rate_count: i64 = redis::cmd("INCR")
        .arg(&rate_key)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    if rate_count == 1 {
        let _: () = redis::cmd("EXPIRE")
            .arg(&rate_key)
            .arg(3600i64)
            .query_async(&mut *conn)
            .await
            .map_err(|e| AppError::Cache(e.to_string()))?;
    }

    if rate_count > 10 {
        return Err(AppError::RateLimited("Too many payment requests. Max 10 per hour.".to_string()));
    }

    let razorpay = state.razorpay.as_ref()
        .ok_or_else(|| AppError::Config("Razorpay not configured".to_string()))?;

    let kiosk_request = KioskPaymentRequest {
        phone: phone.clone(),
        amount: req.amount,
        service_type: req.service_type.clone(),
        kiosk_id: req.kiosk_id.clone().unwrap_or_else(|| "DEFAULT".to_string()),
    };

    let order_response = razorpay.create_kiosk_payment(&kiosk_request)
        .await
        .map_err(|e| AppError::External(format!("Razorpay error: {}", e)))?;

    // Save payment to database
    let payment_id = Uuid::new_v4();
    let amount_decimal = paise_to_decimal(req.amount);
    let expires_at = chrono::Utc::now() + chrono::Duration::minutes(15);

    sqlx::query!(
        r#"INSERT INTO payments 
           (payment_id, user_id, amount, tx_ref, status, method, razorpay_order_id, phone, service_type, kiosk_id, expires_at)
           VALUES ($1, $2, $3, $4, 'Pending', 'UPI', $5, $6, $7, $8, $9)"#,
        payment_id,
        Uuid::nil(), // No user_id for kiosk payments
        amount_decimal,
        order_response.receipt,
        order_response.order_id,
        phone,
        req.service_type,
        req.kiosk_id.unwrap_or_else(|| "DEFAULT".to_string()),
        expires_at
    )
    .execute(&state.db_pool)
    .await?;

    // Log payment event
    sqlx::query!(
        "INSERT INTO payment_events (payment_id, event_type, event_data) VALUES ($1, 'created', $2)",
        payment_id,
        serde_json::json!({
            "razorpay_order_id": order_response.order_id,
            "amount_paise": req.amount,
            "phone": phone,
            "service_type": req.service_type
        })
    )
    .execute(&state.db_pool)
    .await.ok(); // Don't fail if event logging fails

    tracing::info!(
        payment_id = %payment_id,
        order_id = %order_response.order_id,
        phone = %phone,
        amount = %req.amount,
        "Kiosk payment order created"
    );

    Ok(ok(order_response))
}

/// Verify Razorpay payment signature and complete payment
pub async fn verify_kiosk_payment(
    State(state): State<AppState>,
    Json(req): Json<VerifyKioskPaymentRequest>,
) -> Result<impl IntoResponse, AppError> {
    let razorpay = state.razorpay.as_ref()
        .ok_or_else(|| AppError::Config("Razorpay not configured".to_string()))?;

    // Idempotency check using Redis SETNX
    let idempotency_key = format!("verify:{}:{}", req.razorpay_order_id, req.razorpay_payment_id);
    let mut conn = state.redis_pool.get().await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    let acquired: bool = redis::cmd("SETNX")
        .arg(&idempotency_key)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    if !acquired {
        // Already processing this payment - check if completed
        let cached: Option<String> = redis::cmd("GET")
            .arg(format!("{}:result", idempotency_key))
            .query_async(&mut *conn)
            .await
            .map_err(|e| AppError::Cache(e.to_string()))?;

        if let Some(result) = cached {
            return Ok(ok(serde_json::from_str(&result).unwrap_or(serde_json::json!({"success": true}))));
        }
    }

    // Set TTL on idempotency key (5 minutes to complete)
    let _: () = redis::cmd("EXPIRE")
        .arg(&idempotency_key)
        .arg(300)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    // Verify signature
    razorpay.verify_payment_signature(
        &req.razorpay_order_id,
        &req.razorpay_payment_id,
        &req.razorpay_signature,
    ).map_err(|e| {
        // Release idempotency lock on failure
        let _: () = redis::cmd("DEL")
            .arg(&idempotency_key)
            .query_async(&mut *conn)
            .await
            .map_err(|_| ());
        AppError::Payment(PaymentError::Unauthorized)
    })?;

    // Check if order has expired
    let expires_at: Option<chrono::DateTime<chrono::Utc>> = sqlx::query_scalar(
        "SELECT expires_at FROM payments WHERE razorpay_order_id = $1"
    )
    .bind(&req.razorpay_order_id)
    .fetch_optional(&state.db_pool)
    .await?;

    if let Some(expires) = expires_at {
        if chrono::Utc::now() > expires {
            let _: () = redis::cmd("DEL")
                .arg(&idempotency_key)
                .query_async(&mut *conn)
                .await
                .map_err(|_| ());
            return Err(AppError::Validation("Payment order has expired".to_string()));
        }
    }

    // Update payment in database with idempotency
    let result = sqlx::query!(
        r#"UPDATE payments 
           SET status = 'Success', 
               razorpay_payment_id = $1, 
               razorpay_signature = $2, 
               captured = true,
               paid_at = NOW(),
               updated_at = NOW()
           WHERE razorpay_order_id = $3 
             AND status IN ('Pending', 'pending')
             AND razorpay_payment_id IS NULL
           RETURNING payment_id, amount, phone, service_type, kiosk_id"#,
        req.razorpay_payment_id,
        req.razorpay_signature,
        req.razorpay_order_id
    )
    .fetch_optional(&state.db_pool)
    .await?;

    match result {
        Some(row) => {
            let payment_id = row.payment_id;
            let amount = row.amount;
            let phone = row.phone.unwrap_or_default();
            let service_type = row.service_type.unwrap_or_default();
            let kiosk_id = row.kiosk_id.unwrap_or_default();

            // Log payment event
            sqlx::query!(
                "INSERT INTO payment_events (payment_id, event_type, event_data) VALUES ($1, 'captured', $2)",
                payment_id,
                serde_json::json!({
                    "razorpay_payment_id": req.razorpay_payment_id,
                    "verified": true,
                    "source": "client_verify"
                })
            )
            .execute(&state.db_pool)
            .await.ok();

            // Update daily revenue
            sqlx::query!(
                r#"INSERT INTO daily_revenue (revenue_date, kiosk_id, service_type, total_amount, transaction_count)
                   VALUES (CURRENT_DATE, $1, $2, $3, 1)
                   ON CONFLICT (revenue_date, kiosk_id, service_type)
                   DO UPDATE SET 
                       total_amount = daily_revenue.total_amount + $3,
                       transaction_count = daily_revenue.transaction_count + 1,
                       updated_at = NOW()"#,
                kiosk_id,
                service_type,
                amount
            )
            .execute(&state.db_pool)
            .await.ok();

            let response = serde_json::json!({
                "success": true,
                "payment_id": payment_id,
                "amount": amount,
                "status": "Success",
                "receipt": format!("RCPT-{}", payment_id.to_string()[..8].to_uppercase())
            });

            // Store result with 24 hour TTL for idempotency
            let _: () = redis::cmd("SETEX")
                .arg(format!("{}:result", idempotency_key))
                .arg(86400)
                .arg(serde_json::to_string(&response).unwrap())
                .query_async(&mut *conn)
                .await
                .map_err(|e| AppError::Cache(e.to_string()))?;

            // Release idempotency lock but keep result
            let _: () = redis::cmd("DEL")
                .arg(&idempotency_key)
                .query_async(&mut *conn)
                .await
                .map_err(|_| ());

            tracing::info!(
                payment_id = %payment_id,
                razorpay_payment_id = %req.razorpay_payment_id,
                phone = %phone,
                "Payment verified and captured"
            );

            Ok(ok(response))
        }
        None => {
            tracing::warn!(
                order_id = %req.razorpay_order_id,
                "Payment not found, already processed, or already has razorpay_payment_id"
            );
            Err(AppError::NotFound("Payment not found or already processed".to_string()))
        }
    }
}

/// Get payment history for a phone number
pub async fn get_payment_history(
    State(state): State<AppState>,
    Path(phone): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let normalized_phone = shared::sms::SmsService::validate_phone(&phone)
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let payments: Vec<(Uuid, Decimal, String, Option<String>, Option<String>, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>)> = sqlx::query_as(
        r#"SELECT payment_id, amount, status, service_type, razorpay_order_id, created_at, paid_at
           FROM payments 
           WHERE phone = $1 
           ORDER BY created_at DESC 
           LIMIT 50"#
    )
    .bind(&normalized_phone)
    .fetch_all(&state.db_pool)
    .await?;

    let history: Vec<PaymentHistoryItem> = payments.into_iter().map(|(payment_id, amount, status, service_type, razorpay_order_id, created_at, paid_at)| {
        PaymentHistoryItem {
            payment_id,
            amount,
            status,
            service_type,
            razorpay_order_id,
            created_at,
            paid_at,
        }
    }).collect();

    Ok(ok(history))
}

/// Razorpay webhook handler
pub async fn razorpay_webhook(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: String,
) -> Result<impl IntoResponse, AppError> {
    let signature = headers
        .get("X-Razorpay-Signature")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::Validation("Missing signature header".to_string()))?;

    let razorpay = state.razorpay.as_ref()
        .ok_or_else(|| AppError::Config("Razorpay not configured".to_string()))?;

    // Verify webhook signature
    if !razorpay.verify_webhook_signature(&body, signature)
        .map_err(|_| AppError::Payment(PaymentError::Unauthorized))? 
    {
        return Err(AppError::Payment(PaymentError::Unauthorized));
    }

    let event: RazorpayWebhookEvent = serde_json::from_str(&body)
        .map_err(|e| AppError::Validation(format!("Invalid webhook payload: {}", e)))?;

    tracing::info!(event_type = %event.event, "Razorpay webhook received");

    // Idempotency check using Redis
    let mut conn = state.redis_pool.get().await
        .map_err(|e| AppError::Cache(e.to_string()))?;
    
    let webhook_key = format!("webhook:razorpay:{}:{}", event.event, event.payload.payment.as_ref().map(|p| p.entity.id.as_str()).unwrap_or("unknown"));
    let already_processed: bool = redis::cmd("EXISTS")
        .arg(&webhook_key)
        .query_async(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    if already_processed {
        tracing::info!(webhook_key = %webhook_key, "Webhook already processed, skipping");
        return Ok(ok(serde_json::json!({"status": "ok", "skipped": true})));
    }

    match event.event.as_str() {
        "payment.captured" | "payment.authorized" => {
            if let Some(payment_entity) = event.payload.payment {
                let payment = payment_entity.entity;
                
                // Check if order has expired
                let order_expired: Option<(chrono::DateTime<chrono::Utc>,)> = sqlx::query_as(
                    "SELECT expires_at FROM payments WHERE razorpay_order_id = $1"
                )
                .bind(&payment.order_id)
                .fetch_optional(&state.db_pool)
                .await?;

                if let Some((expires_at,)) = order_expired {
                    if chrono::Utc::now() > expires_at {
                        tracing::warn!(order_id = %payment.order_id, "Order expired, ignoring webhook");
                        return Ok(ok(serde_json::json!({"status": "ok", "reason": "order_expired"})));
                    }
                }

                // Update payment with idempotency - check razorpay_payment_id
                let result = sqlx::query!(
                    r#"UPDATE payments 
                       SET status = 'Success', 
                           razorpay_payment_id = $1,
                           captured = $2,
                           webhook_received = true,
                           paid_at = NOW(),
                           updated_at = NOW()
                       WHERE razorpay_order_id = $3 
                         AND status IN ('Pending', 'pending')
                         AND (razorpay_payment_id IS NULL OR razorpay_payment_id = $1)
                       RETURNING payment_id"#,
                    payment.id,
                    payment.captured,
                    payment.order_id
                )
                .fetch_optional(&state.db_pool)
                .await?;

                if let Some(row) = result {
                    // Mark webhook as processed in Redis (24 hour TTL)
                    let _: () = redis::cmd("SETEX")
                        .arg(&webhook_key)
                        .arg(86400)
                        .arg(1u8)
                        .query_async(&mut *conn)
                        .await
                        .map_err(|e| AppError::Cache(e.to_string()))?;

                    tracing::info!(
                        payment_id = %row.payment_id,
                        razorpay_payment_id = %payment.id,
                        order_id = %payment.order_id,
                        "Payment captured via webhook"
                    );
                } else {
                    tracing::info!(order_id = %payment.order_id, "Payment already processed or not found");
                }
            }
        }
        "payment.failed" => {
            if let Some(payment_entity) = event.payload.payment {
                let payment = payment_entity.entity;
                
                let result = sqlx::query!(
                    r#"UPDATE payments 
                       SET status = 'Failed', 
                           razorpay_payment_id = $1,
                           webhook_received = true,
                           updated_at = NOW()
                       WHERE razorpay_order_id = $2
                         AND status IN ('Pending', 'pending')
                       RETURNING payment_id"#,
                    payment.id,
                    payment.order_id
                )
                .fetch_optional(&state.db_pool)
                .await?;

                if let Some(row) = result {
                    // Mark webhook as processed
                    let _: () = redis::cmd("SETEX")
                        .arg(&webhook_key)
                        .arg(86400)
                        .arg(1u8)
                        .query_async(&mut *conn)
                        .await
                        .map_err(|e| AppError::Cache(e.to_string()))?;

                    tracing::warn!(
                        payment_id = %row.payment_id,
                        razorpay_payment_id = %payment.id,
                        "Payment failed via webhook"
                    );
                }
            }
        }
        _ => {
            tracing::debug!(event_type = %event.event, "Unhandled webhook event");
        }
    }

    Ok(ok(serde_json::json!({"status": "ok"})))
}

/// Get daily revenue summary (admin endpoint)
pub async fn get_daily_revenue(
    State(state): State<AppState>,
    Extension(_claims): Extension<AccessClaims>,
) -> Result<impl IntoResponse, AppError> {
    let revenue: Vec<(chrono::NaiveDate, Option<String>, Option<String>, Decimal, i32)> = sqlx::query_as(
        r#"SELECT revenue_date, kiosk_id, service_type, total_amount, transaction_count
           FROM daily_revenue 
           WHERE revenue_date >= CURRENT_DATE - INTERVAL '30 days'
           ORDER BY revenue_date DESC, total_amount DESC"#
    )
    .fetch_all(&state.db_pool)
    .await?;

    let summary: Vec<serde_json::Value> = revenue.into_iter().map(|(date, kiosk_id, service_type, total, count)| {
        serde_json::json!({
            "date": date.to_string(),
            "kiosk_id": kiosk_id,
            "service_type": service_type,
            "total_amount": total,
            "transaction_count": count
        })
    }).collect();

    Ok(ok(summary))
}

// Keep existing handlers for backward compatibility
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
