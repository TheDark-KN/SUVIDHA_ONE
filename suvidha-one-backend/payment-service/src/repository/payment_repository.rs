use async_trait::async_trait;
use sqlx::PgPool;
use rust_decimal::Decimal;
use uuid::Uuid;
use shared::{
    models::{PaymentMethod, PaymentStatus, PaymentRecord},
    error::AppError,
};

#[async_trait]
pub trait PaymentRepository: Send + Sync {
    async fn create(&self, user_id: Uuid, amount: Decimal, method: PaymentMethod, tx_ref: &str) -> Result<PaymentRecord, AppError>;
    async fn find_by_id(&self, payment_id: Uuid) -> Result<Option<PaymentRecord>, AppError>;
    async fn find_by_idempotency_key(&self, key: &str) -> Result<Option<PaymentRecord>, AppError>;
    async fn update_status(&self, payment_id: Uuid, status: PaymentStatus) -> Result<(), AppError>;
}

pub struct PgPaymentRepository {
    pool: PgPool,
}

impl PgPaymentRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl PaymentRepository for PgPaymentRepository {
    async fn create(&self, user_id: Uuid, amount: Decimal, method: PaymentMethod, tx_ref: &str) -> Result<PaymentRecord, AppError> {
        let payment = sqlx::query_as!(
            PaymentRecord,
            r#"INSERT INTO payments (payment_id, user_id, amount, tx_ref, status, method)
               VALUES ($1, $2, $3, $4, 'Pending', $5)
               RETURNING payment_id, user_id, amount, tx_ref, status as "status: PaymentStatus", method as "method: PaymentMethod", created_at"#,
            Uuid::new_v4(),
            user_id,
            amount,
            tx_ref,
            method as PaymentMethod
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(payment)
    }

    async fn find_by_id(&self, payment_id: Uuid) -> Result<Option<PaymentRecord>, AppError> {
        let payment = sqlx::query_as!(
            PaymentRecord,
            r#"SELECT payment_id, user_id, amount, tx_ref, 
                      status as "status: PaymentStatus", 
                      method as "method: PaymentMethod", 
                      created_at
             FROM payments WHERE payment_id = $1"#,
            payment_id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(payment)
    }

    async fn find_by_idempotency_key(&self, key: &str) -> Result<Option<PaymentRecord>, AppError> {
        let payment = sqlx::query_as!(
            PaymentRecord,
            r#"SELECT p.payment_id, p.user_id, p.amount, p.tx_ref, 
                      p.status as "status: PaymentStatus", 
                      p.method as "method: PaymentMethod", 
                      p.created_at
             FROM payments p
             WHERE p.tx_ref = $1"#,
            key
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(payment)
    }

    async fn update_status(&self, payment_id: Uuid, status: PaymentStatus) -> Result<(), AppError> {
        sqlx::query!(
            "UPDATE payments SET status = $1, updated_at = NOW() WHERE payment_id = $2",
            status as PaymentStatus,
            payment_id
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}
