use axum::{extract::State, Json, response::IntoResponse};
use shared::{AppError, TtsService, TtsSynthesizeRequest};
use serde::Serialize;

/// Synthesize speech from text
/// 
/// POST /api/tts/synthesize
pub async fn synthesize(
    State(state): State<crate::AppState>,
    Json(request): Json<TtsSynthesizeRequest>,
) -> Result<impl IntoResponse, AppError> {
    let response = state.tts_service.synthesize(request).await?;
    Ok(shared::ok(response))
}

/// Get list of supported languages
/// 
/// GET /api/tts/languages
pub async fn list_languages() -> impl IntoResponse {
    let languages: Vec<LanguageInfo> = TtsService::supported_languages()
        .into_iter()
        .map(|(code, name)| LanguageInfo {
            code: code.to_string(),
            name: name.to_string(),
        })
        .collect();
    
    shared::ok(languages)
}

#[derive(Serialize)]
pub struct LanguageInfo {
    pub code: String,
    pub name: String,
}
