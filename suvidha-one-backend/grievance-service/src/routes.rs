use axum::{routing::{post, get, patch}, Router};

mod handlers {
    use axum::{extract::{State, Path, Json, Extension}, response::IntoResponse};
    use serde::{Deserialize, Serialize};
    use uuid::Uuid;
    use shared::{jwt::AccessClaims, models::{Grievance, GrievanceStatus, GrievanceCategory, Department, Priority}, response::ok, error::AppError};

    #[derive(Serialize)]
    pub struct HealthResponse { pub status: String, pub service: String, pub version: String }

    pub async fn health(State(_state): State<crate::AppState>) -> impl IntoResponse {
        Json(HealthResponse { status: "healthy".to_string(), service: "grievance-service".to_string(), version: "1.0.0".to_string() })
    }

    #[derive(Debug, Deserialize)]
    pub struct CreateGrievanceRequest {
        pub category: GrievanceCategory,
        pub department: Department,
        pub subject: String,
        pub description: String,
    }

    pub async fn create_grievance(
        State(state): State<crate::AppState>,
        Extension(claims): Extension<AccessClaims>,
        Json(req): Json<CreateGrievanceRequest>,
    ) -> Result<impl IntoResponse, AppError> {
        let grievance = Grievance {
            grievance_id: Uuid::new_v4(),
            user_id: claims.sub,
            category: req.category,
            department: req.department,
            subject: req.subject,
            description: req.description,
            status: GrievanceStatus::Open,
            priority: Priority::Medium,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            resolved_at: None,
        };

        sqlx::query!(
            "INSERT INTO grievances (grievance_id, user_id, category, department, subject, description, status, priority)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            grievance.grievance_id, grievance.user_id, grievance.category as GrievanceCategory,
            grievance.department as Department, grievance.subject, grievance.description,
            grievance.status as GrievanceStatus, grievance.priority as Priority
        )
        .execute(&state.db_pool)
        .await?;

        tracing::info!(user_id = %claims.sub, grievance_id = %grievance.grievance_id, "Grievance created");
        Ok(ok(grievance))
    }

    pub async fn list_grievances(
        State(state): State<crate::AppState>,
        Extension(claims): Extension<AccessClaims>,
    ) -> Result<impl IntoResponse, AppError> {
        let grievances: Vec<Grievance> = sqlx::query_as!(
            Grievance,
            r#"SELECT grievance_id, user_id, 
                      category as "category: GrievanceCategory", 
                      department as "department: Department", 
                      subject, description, 
                      status as "status: GrievanceStatus", 
                      priority as "priority: Priority", 
                      created_at, updated_at, resolved_at
             FROM grievances WHERE user_id = $1 ORDER BY created_at DESC"#,
            claims.sub
        )
        .fetch_all(&state.db_pool)
        .await?;

        Ok(ok(grievances))
    }

    pub async fn get_grievance(
        State(state): State<crate::AppState>,
        Extension(claims): Extension<AccessClaims>,
        Path(grievance_id): Path<Uuid>,
    ) -> Result<impl IntoResponse, AppError> {
        let grievance: Option<Grievance> = sqlx::query_as!(
            Grievance,
            r#"SELECT grievance_id, user_id, 
                      category as "category: GrievanceCategory", 
                      department as "department: Department", 
                      subject, description, 
                      status as "status: GrievanceStatus", 
                      priority as "priority: Priority", 
                      created_at, updated_at, resolved_at
             FROM grievances WHERE grievance_id = $1 AND user_id = $2"#,
            grievance_id, claims.sub
        )
        .fetch_optional(&state.db_pool)
        .await?;

        match grievance {
            Some(g) => Ok(ok(g)),
            None => Err(AppError::NotFound("Grievance not found".to_string())),
        }
    }

    #[derive(Debug, Deserialize)]
    pub struct UpdateGrievanceRequest {
        pub status: Option<GrievanceStatus>,
    }

    pub async fn update_grievance(
        State(state): State<crate::AppState>,
        Extension(claims): Extension<AccessClaims>,
        Path(grievance_id): Path<Uuid>,
        Json(req): Json<UpdateGrievanceRequest>,
    ) -> Result<impl IntoResponse, AppError> {
        if let Some(status) = req.status {
            sqlx::query!(
                "UPDATE grievances SET status = $1, updated_at = NOW() WHERE grievance_id = $2 AND user_id = $3",
                status as GrievanceStatus, grievance_id, claims.sub
            )
            .execute(&state.db_pool)
            .await?;
        }

        Ok(ok(serde_json::json!({ "message": "Grievance updated successfully" })))
    }
}

pub fn grievance_routes() -> Router<crate::AppState> {
    Router::new()
        .route("/grievances", post(handlers::create_grievance))
        .route("/grievances", get(handlers::list_grievances))
        .route("/grievances/:id", get(handlers::get_grievance))
        .route("/grievances/:id/update", patch(handlers::update_grievance))
}

pub fn health_routes() -> Router<crate::AppState> {
    Router::new()
        .route("/health", get(handlers::health))
        .route("/ready", get(handlers::health))
}
