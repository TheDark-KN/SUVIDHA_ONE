use rust_decimal::Decimal;
use uuid::Uuid;
use async_trait::async_trait;
use std::sync::Arc;
use shared::{
    models::{PaymentMethod, PaymentStatus, PaymentRecord},
    error::{AppError, PaymentError},
};

#[async_trait]
pub trait PaymentRepository: Send + Sync {
    async fn create(&self, user_id: Uuid, amount: Decimal, method: PaymentMethod, tx_ref: &str) -> Result<PaymentRecord, AppError>;
    async fn find_by_id(&self, payment_id: Uuid) -> Result<Option<PaymentRecord>, AppError>;
    async fn find_by_idempotency_key(&self, key: &str) -> Result<Option<PaymentRecord>, AppError>;
    async fn update_status(&self, payment_id: Uuid, status: PaymentStatus) -> Result<(), AppError>;
}

pub struct PaymentService<P: PaymentRepository> {
    payment_repo: Arc<P>,
}

impl<P: PaymentRepository> PaymentService<P> {
    pub fn new(payment_repo: Arc<P>) -> Self {
        Self { payment_repo }
    }

    pub async fn pay_bills(
        &self,
        user_id: Uuid,
        _bill_ids: &[Uuid],
        method: PaymentMethod,
        idempotency_key: Uuid,
    ) -> Result<PaymentRecord, PaymentError> {
        let key = format!("idem:{}", idempotency_key);
        
        if let Some(existing) = self.payment_repo.find_by_idempotency_key(&key).await.ok().flatten() {
            return Ok(existing);
        }

        let total = Decimal::ZERO;

        let payment = self.payment_repo
            .create(user_id, total, method, &format!("TXN{}", Uuid::new_v4()))
            .await
            .map_err(|e| PaymentError::GatewayError(e.to_string()))?;

        Ok(payment)
    }
}
