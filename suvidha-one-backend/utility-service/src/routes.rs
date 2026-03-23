use crate::handlers::{self, health};
use axum::{
    routing::{get, post},
    Router,
};

pub fn utility_routes() -> Router<crate::AppState> {
    Router::new()
        .route("/bills/fetch", post(handlers::bill::fetch_bills))
        .route("/bills/:bill_id", get(handlers::bill::get_bill))
        .route("/services", get(handlers::service::list_services))
}

pub fn tts_routes() -> Router<crate::AppState> {
    Router::new()
        .route("/synthesize", post(handlers::tts::synthesize))
        .route("/languages", get(handlers::tts::list_languages))
}

/// Bhashini voice routes for ASR/TTS
pub fn voice_routes() -> Router<crate::AppState> {
    Router::new()
        // Complete voice interaction (ASR + intent + TTS)
        .route("/input", post(handlers::voice::voice_input))
        // ASR only (speech-to-text)
        .route("/asr", post(handlers::voice::asr))
        // TTS only (text-to-speech)  
        .route("/tts", post(handlers::voice::tts))
        // List supported languages
        .route("/languages", get(handlers::voice::list_languages))
}

pub fn health_routes() -> Router<crate::AppState> {
    Router::new()
        .route("/health", get(health))
        .route("/ready", get(health))
}
