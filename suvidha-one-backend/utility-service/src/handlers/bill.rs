use crate::AppState;
use axum::{extract::{State, Path, Json, Extension}, response::IntoResponse};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use shared::{jwt::AccessClaims, models::{BillStatus, Department}, response::ok, error::AppError};

#[derive(Debug, Deserialize)]
pub struct FetchBillsRequest {
    pub consumer_id: String,
    pub department: Department,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BillResponse {
    pub bill_id: Uuid,
    pub consumer_id: String,
    pub amount: Decimal,
    pub due_date: String,
    pub department: Department,
    pub status: BillStatus,
    pub description: Option<String>,
}

pub async fn fetch_bills(
    State(state): State<AppState>,
    Extension(claims): Extension<AccessClaims>,
    Json(req): Json<FetchBillsRequest>,
) -> Result<impl IntoResponse, AppError> {
    let cache_key = format!("bill:{:?}:{}", req.department, req.consumer_id);
    let mut conn = state.redis_pool.get().await.map_err(|e| AppError::Cache(e.to_string()))?;

    if let Ok(cached) = redis::cmd("GET").arg(&cache_key).query_async::<_, String>(&mut *conn).await {
        if let Ok(bills) = serde_json::from_str::<Vec<BillResponse>>(&cached) {
            return Ok(ok(bills));
        }
    }

    let mock_bills = vec![BillResponse {
        bill_id: Uuid::new_v4(),
        consumer_id: req.consumer_id.clone(),
        amount: Decimal::from(1500),
        due_date: "2026-04-15".to_string(),
        department: req.department,
        status: BillStatus::Pending,
        description: Some("Monthly bill".to_string()),
    }];

    let bills_json = serde_json::to_string(&mock_bills).unwrap();
    redis::cmd("SETEX")
        .arg(&cache_key)
        .arg(1800)
        .arg(&bills_json)
        .query_async::<_, ()>(&mut *conn)
        .await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    tracing::info!(user_id = %claims.sub, consumer_id = %req.consumer_id, "Bills fetched successfully");
    Ok(ok(mock_bills))
}

pub async fn get_bill(
    State(_state): State<AppState>,
    Extension(_claims): Extension<AccessClaims>,
    Path(bill_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    Ok(ok(BillResponse {
        bill_id,
        consumer_id: "CONSUMER001".to_string(),
        amount: Decimal::from(1500),
        due_date: "2026-04-15".to_string(),
        department: Department::Electricity,
        status: BillStatus::Pending,
        description: Some("Monthly bill".to_string()),
    }))
}
