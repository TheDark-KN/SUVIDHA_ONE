//! Voice input/output handlers for Bhashini integration
//!
//! Provides endpoints for:
//! - POST /voice/input - Process voice input (ASR) and return voice response (TTS)
//! - POST /voice/asr - Speech-to-text only
//! - POST /voice/tts - Text-to-speech only
//! - GET /voice/languages - List supported languages

use crate::AppState;
use axum::{
    extract::{Multipart, State},
    response::IntoResponse,
    Json,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use serde::{Deserialize, Serialize};
use shared::{
    bhashini::{BhashiniConfig, BhashiniLanguage, VoiceResponse},
    error::AppError,
    response::ok,
};

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST/RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/// ASR-only request (JSON with base64 audio)
#[derive(Debug, Deserialize)]
pub struct AsrRequest {
    /// Base64 encoded audio (WAV 16kHz mono)
    pub audio: String,
    /// Language code (e.g., "hi", "ta", "en")
    pub language: String,
}

/// ASR response
#[derive(Debug, Serialize)]
pub struct AsrResponse {
    pub transcript: String,
    pub language: String,
}

/// TTS-only request
#[derive(Debug, Deserialize)]
pub struct TtsRequest {
    /// Text to synthesize
    pub text: String,
    /// Language code
    pub language: String,
    /// Voice gender ("male" or "female")
    #[serde(default = "default_gender")]
    pub gender: String,
}

fn default_gender() -> String {
    "female".to_string()
}

/// TTS response
#[derive(Debug, Serialize)]
pub struct TtsResponse {
    /// Base64 encoded audio
    pub audio: String,
    pub language: String,
    pub gender: String,
}

/// Supported language info
#[derive(Debug, Serialize)]
pub struct LanguageInfo {
    pub code: String,
    pub name: String,
    pub native_name: String,
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

/// POST /voice/input - Complete voice interaction
/// 
/// Accepts multipart form with:
/// - audio: WAV file (16kHz mono recommended)
/// - language: Language code (optional, defaults to "hi")
///
/// Returns:
/// - transcript: What the user said
/// - intent: Detected intent
/// - reply_text: System's text response
/// - reply_audio: Base64 encoded audio response
pub async fn voice_input(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, AppError> {
    // Extract audio and language from multipart form
    let mut audio_bytes: Vec<u8> = Vec::new();
    let mut lang = "hi".to_string();

    while let Some(field) = multipart.next_field().await
        .map_err(|e| AppError::Validation(format!("Multipart error: {}", e)))? 
    {
        match field.name() {
            Some("audio") => {
                audio_bytes = field.bytes().await
                    .map_err(|e| AppError::Validation(format!("Failed to read audio: {}", e)))?
                    .to_vec();
            }
            Some("language") | Some("lang") => {
                lang = field.text().await
                    .map_err(|e| AppError::Validation(format!("Failed to read language: {}", e)))?;
            }
            _ => {}
        }
    }

    if audio_bytes.is_empty() {
        return Err(AppError::Validation("No audio provided".to_string()));
    }

    // Validate language
    let bhashini_lang = BhashiniLanguage::from_str(&lang)
        .ok_or_else(|| AppError::Validation(format!("Unsupported language: {}", lang)))?;
    let lang_code = bhashini_lang.code();

    // Get or cache Bhashini config
    let config = get_or_cache_bhashini_config(&state, lang_code).await?;

    // 1. Speech-to-Text (ASR)
    let asr_result = state.bhashini_service
        .speech_to_text(&config, &audio_bytes, lang_code)
        .await
        .map_err(|e| AppError::External(format!("ASR failed: {}", e)))?;

    tracing::info!(
        transcript = %asr_result.text, 
        lang = %lang_code, 
        "Voice input transcribed"
    );

    // 2. Detect intent from transcribed text
    let intent = state.bhashini_service.detect_intent(&asr_result.text, lang_code);

    // 3. Get appropriate response
    let reply_text = state.bhashini_service.get_intent_response(&intent, lang_code);

    // 4. Text-to-Speech (TTS) for the response
    let tts_result = state.bhashini_service
        .text_to_speech(&config, &reply_text, lang_code, "female")
        .await
        .map_err(|e| AppError::External(format!("TTS failed: {}", e)))?;

    Ok(ok(VoiceResponse {
        transcript: asr_result.text,
        intent,
        reply_text,
        reply_audio: tts_result.audio_base64,
        language: lang_code.to_string(),
    }))
}

/// POST /voice/asr - Speech-to-text only
pub async fn asr(
    State(state): State<AppState>,
    Json(req): Json<AsrRequest>,
) -> Result<impl IntoResponse, AppError> {
    // Validate language
    let bhashini_lang = BhashiniLanguage::from_str(&req.language)
        .ok_or_else(|| AppError::Validation(format!("Unsupported language: {}", req.language)))?;
    let lang_code = bhashini_lang.code();

    // Decode base64 audio
    let audio_bytes = BASE64.decode(&req.audio)
        .map_err(|e| AppError::Validation(format!("Invalid base64 audio: {}", e)))?;

    // Get Bhashini config
    let config = get_or_cache_bhashini_config(&state, lang_code).await?;

    // Call ASR
    let result = state.bhashini_service
        .speech_to_text(&config, &audio_bytes, lang_code)
        .await
        .map_err(|e| AppError::External(format!("ASR failed: {}", e)))?;

    Ok(ok(AsrResponse {
        transcript: result.text,
        language: lang_code.to_string(),
    }))
}

/// POST /voice/tts - Text-to-speech only
pub async fn tts(
    State(state): State<AppState>,
    Json(req): Json<TtsRequest>,
) -> Result<impl IntoResponse, AppError> {
    // Validate language
    let bhashini_lang = BhashiniLanguage::from_str(&req.language)
        .ok_or_else(|| AppError::Validation(format!("Unsupported language: {}", req.language)))?;
    let lang_code = bhashini_lang.code();

    // Validate text
    if req.text.is_empty() {
        return Err(AppError::Validation("Text cannot be empty".to_string()));
    }
    if req.text.len() > 5000 {
        return Err(AppError::Validation("Text too long (max 5000 chars)".to_string()));
    }

    // Get Bhashini config
    let config = get_or_cache_bhashini_config(&state, lang_code).await?;

    // Call TTS
    let result = state.bhashini_service
        .text_to_speech(&config, &req.text, lang_code, &req.gender)
        .await
        .map_err(|e| AppError::External(format!("TTS failed: {}", e)))?;

    Ok(ok(TtsResponse {
        audio: result.audio_base64,
        language: lang_code.to_string(),
        gender: req.gender,
    }))
}

/// GET /voice/languages - List supported languages
pub async fn list_languages() -> impl IntoResponse {
    let languages: Vec<LanguageInfo> = BhashiniLanguage::all()
        .iter()
        .map(|lang| LanguageInfo {
            code: lang.code().to_string(),
            name: format!("{:?}", lang),
            native_name: lang.native_name().to_string(),
        })
        .collect();

    ok(languages)
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/// Get or cache Bhashini pipeline config in Redis (1 hour TTL)
async fn get_or_cache_bhashini_config(
    state: &AppState,
    lang: &str,
) -> Result<BhashiniConfig, AppError> {
    let cache_key = format!("bhashini:config:{}", lang);

    // Try Redis cache first
    let mut conn = state.redis_pool.get().await
        .map_err(|e| AppError::Cache(e.to_string()))?;

    // Check cache
    let cached: Result<String, _> = redis::cmd("GET")
        .arg(&cache_key)
        .query_async(&mut *conn)
        .await;

    if let Ok(cached_json) = cached {
        if let Ok(config) = serde_json::from_str::<BhashiniConfig>(&cached_json) {
            tracing::debug!(lang = %lang, "Bhashini config loaded from cache");
            return Ok(config);
        }
    }

    // Cache miss - fetch fresh config
    tracing::info!(lang = %lang, "Fetching fresh Bhashini config");
    
    let config = state.bhashini_service
        .get_voice_config(lang)
        .await
        .map_err(|e| AppError::External(format!("Failed to get Bhashini config: {}", e)))?;

    // Cache for 1 hour
    if let Ok(json) = serde_json::to_string(&config) {
        let _: Result<(), _> = redis::cmd("SETEX")
            .arg(&cache_key)
            .arg(3600i64) // 1 hour TTL
            .arg(&json)
            .query_async(&mut *conn)
            .await;
    }

    Ok(config)
}
