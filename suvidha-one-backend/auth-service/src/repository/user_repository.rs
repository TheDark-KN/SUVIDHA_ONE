use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;
use shared::{models::User, error::AppError};

#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, AppError>;
    async fn find_by_mobile_hash(&self, mobile_hash: &str) -> Result<Option<User>, AppError>;
    async fn upsert(&self, mobile_hash: Option<&str>, aadhaar_hash: Option<&str>, full_name: &str, state_code: &str) -> Result<User, AppError>;
}

pub struct PgUserRepository {
    pool: PgPool,
}

impl PgUserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UserRepository for PgUserRepository {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as!(
            User,
            r#"SELECT user_id, 
                      aadhaar_id_hash, 
                      mobile_hash, 
                      full_name, 
                      state_code,
                      preferred_language, 
                      created_at, 
                      updated_at, 
                      is_active
             FROM users WHERE user_id = $1 AND is_active = true"#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    async fn find_by_mobile_hash(&self, mobile_hash: &str) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as!(
            User,
            r#"SELECT user_id, 
                      aadhaar_id_hash, 
                      mobile_hash, 
                      full_name, 
                      state_code,
                      preferred_language, 
                      created_at, 
                      updated_at, 
                      is_active
             FROM users WHERE mobile_hash = $1 AND is_active = true"#,
            mobile_hash
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    async fn upsert(
        &self,
        mobile_hash: Option<&str>,
        aadhaar_hash: Option<&str>,
        full_name: &str,
        state_code: &str,
    ) -> Result<User, AppError> {
        if let Some(mh) = mobile_hash {
            if let Some(user) = self.find_by_mobile_hash(mh).await? {
                let user = sqlx::query_as!(
                    User,
                    r#"UPDATE users 
                       SET full_name = $1, updated_at = NOW()
                       WHERE user_id = $2
                       RETURNING user_id, aadhaar_id_hash, mobile_hash, full_name, state_code,
                                 preferred_language, created_at, updated_at, is_active"#,
                    full_name,
                    user.user_id
                )
                .fetch_one(&self.pool)
                .await?;
                return Ok(user);
            }
        }

        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (user_id, mobile_hash, aadhaar_id_hash, full_name, state_code, preferred_language)
            VALUES ($1, $2, $3, $4, $5, 'en')
            RETURNING user_id, 
                      aadhaar_id_hash, 
                      mobile_hash, 
                      full_name, 
                      state_code,
                      preferred_language, 
                      created_at, 
                      updated_at, 
                      is_active
            "#,
            Uuid::new_v4(),
            mobile_hash,
            aadhaar_hash,
            full_name,
            state_code
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(user)
    }
}
