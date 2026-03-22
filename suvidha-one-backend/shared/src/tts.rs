//! Text-to-Speech service for voice responses
//! Supports Microsoft Edge TTS (free) and Google Cloud TTS
//! Supports all major Indian languages

use serde::{Deserialize, Serialize};
use crate::error::AppError;
use std::process::Stdio;

/// Supported Indian languages for TTS
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum TtsLanguage {
    #[default]
    #[serde(rename = "hi-IN")]
    Hindi,
    #[serde(rename = "bn-IN")]
    Bengali,
    #[serde(rename = "te-IN")]
    Telugu,
    #[serde(rename = "ta-IN")]
    Tamil,
    #[serde(rename = "mr-IN")]
    Marathi,
    #[serde(rename = "gu-IN")]
    Gujarati,
    #[serde(rename = "kn-IN")]
    Kannada,
    #[serde(rename = "ml-IN")]
    Malayalam,
    #[serde(rename = "pa-IN")]
    Punjabi,
    #[serde(rename = "en-IN")]
    EnglishIndia,
}

impl TtsLanguage {
    pub fn as_code(&self) -> &'static str {
        match self {
            TtsLanguage::Hindi => "hi-IN",
            TtsLanguage::Bengali => "bn-IN",
            TtsLanguage::Telugu => "te-IN",
            TtsLanguage::Tamil => "ta-IN",
            TtsLanguage::Marathi => "mr-IN",
            TtsLanguage::Gujarati => "gu-IN",
            TtsLanguage::Kannada => "kn-IN",
            TtsLanguage::Malayalam => "ml-IN",
            TtsLanguage::Punjabi => "pa-IN",
            TtsLanguage::EnglishIndia => "en-IN",
        }
    }

    /// Get Edge TTS voice name for language
    pub fn edge_voice(&self) -> &'static str {
        match self {
            TtsLanguage::Hindi => "hi-IN-SwaraNeural",
            TtsLanguage::Bengali => "bn-IN-TanishaaNeural",
            TtsLanguage::Telugu => "te-IN-ShrutiNeural",
            TtsLanguage::Tamil => "ta-IN-PallaviNeural",
            TtsLanguage::Marathi => "mr-IN-AarohiNeural",
            TtsLanguage::Gujarati => "gu-IN-DhwaniNeural",
            TtsLanguage::Kannada => "kn-IN-SapnaNeural",
            TtsLanguage::Malayalam => "ml-IN-SobhanaNeural",
            TtsLanguage::Punjabi => "pa-IN-OjasNeural",
            TtsLanguage::EnglishIndia => "en-IN-NeerjaNeural",
        }
    }

    /// Parse from language code string
    pub fn from_code(code: &str) -> Option<Self> {
        match code.to_lowercase().as_str() {
            "hi-in" | "hi" | "hindi" => Some(TtsLanguage::Hindi),
            "bn-in" | "bn" | "bengali" => Some(TtsLanguage::Bengali),
            "te-in" | "te" | "telugu" => Some(TtsLanguage::Telugu),
            "ta-in" | "ta" | "tamil" => Some(TtsLanguage::Tamil),
            "mr-in" | "mr" | "marathi" => Some(TtsLanguage::Marathi),
            "gu-in" | "gu" | "gujarati" => Some(TtsLanguage::Gujarati),
            "kn-in" | "kn" | "kannada" => Some(TtsLanguage::Kannada),
            "ml-in" | "ml" | "malayalam" => Some(TtsLanguage::Malayalam),
            "pa-in" | "pa" | "punjabi" => Some(TtsLanguage::Punjabi),
            "en-in" | "en" | "english" => Some(TtsLanguage::EnglishIndia),
            _ => None,
        }
    }
}

/// Request to synthesize speech
#[derive(Debug, Deserialize)]
pub struct TtsSynthesizeRequest {
    /// Text to convert to speech
    pub text: String,
    /// Language code (e.g., "hi-IN", "hindi", "hi")
    #[serde(default)]
    pub language: Option<String>,
    /// Optional specific voice name
    pub voice: Option<String>,
    /// Speaking rate (0.5 to 2.0, default 1.0)
    #[serde(default = "default_speaking_rate")]
    pub speaking_rate: f32,
}

fn default_speaking_rate() -> f32 {
    1.0
}

/// Response with synthesized audio
#[derive(Debug, Serialize)]
pub struct TtsSynthesizeResponse {
    /// Base64 encoded audio content
    pub audio_content: String,
    /// Audio format
    pub format: String,
    /// Language used
    pub language: String,
    /// Voice used
    pub voice: String,
}

/// TTS Service client using Edge TTS (free, no API key required)
#[derive(Clone)]
pub struct TtsService {
    #[allow(dead_code)]
    client: reqwest::Client,
}

impl Default for TtsService {
    fn default() -> Self {
        Self::new()
    }
}

impl TtsService {
    /// Create new TTS service
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
    }

    /// Create from environment (for backwards compatibility)
    pub fn from_env() -> Result<Self, AppError> {
        Ok(Self::new())
    }

    /// Synthesize speech from text using Edge TTS
    pub async fn synthesize(&self, request: TtsSynthesizeRequest) -> Result<TtsSynthesizeResponse, AppError> {
        // Validate text length
        if request.text.is_empty() {
            return Err(AppError::Validation("Text cannot be empty".to_string()));
        }
        if request.text.len() > 5000 {
            return Err(AppError::Validation("Text too long (max 5000 characters)".to_string()));
        }

        // Parse language
        let language = request.language
            .as_ref()
            .and_then(|l| TtsLanguage::from_code(l))
            .unwrap_or_default();

        let voice_name = request.voice
            .unwrap_or_else(|| language.edge_voice().to_string());

        // Use edge-tts via HTTP API (free Microsoft Edge TTS)
        let audio_content = self.call_edge_tts(&request.text, &voice_name, request.speaking_rate).await?;

        Ok(TtsSynthesizeResponse {
            audio_content,
            format: "mp3".to_string(),
            language: language.as_code().to_string(),
            voice: voice_name,
        })
    }

    /// Call Edge TTS service
    async fn call_edge_tts(&self, text: &str, voice: &str, rate: f32) -> Result<String, AppError> {
        // Edge TTS uses WebSocket, we'll use the edge-tts Python package via subprocess
        // This is a workaround since there's no pure Rust edge-tts library
        
        // For production, we use a simple HTTP endpoint that wraps edge-tts
        // Or fall back to browser-based synthesis
        
        // Try to use edge-tts command line tool if available
        let rate_str = format!("{:+}%", ((rate - 1.0) * 100.0) as i32);
        
        let output = tokio::process::Command::new("edge-tts")
            .args([
                "--voice", voice,
                "--rate", &rate_str,
                "--text", text,
                "--write-media", "/tmp/tts_output.mp3",
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| {
                tracing::warn!("edge-tts not available: {}. Install with: pip install edge-tts", e);
                AppError::External("TTS service not available. Please install edge-tts.".to_string())
            })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            tracing::error!("edge-tts error: {}", stderr);
            return Err(AppError::External(format!("TTS synthesis failed: {}", stderr)));
        }

        // Read the generated audio file and convert to base64
        let audio_bytes = tokio::fs::read("/tmp/tts_output.mp3")
            .await
            .map_err(|e| AppError::External(format!("Failed to read audio file: {}", e)))?;

        // Clean up temp file
        let _ = tokio::fs::remove_file("/tmp/tts_output.mp3").await;

        Ok(base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &audio_bytes))
    }

    /// Get list of supported languages with their codes
    pub fn supported_languages() -> Vec<(&'static str, &'static str)> {
        vec![
            ("hi-IN", "Hindi"),
            ("bn-IN", "Bengali"),
            ("te-IN", "Telugu"),
            ("ta-IN", "Tamil"),
            ("mr-IN", "Marathi"),
            ("gu-IN", "Gujarati"),
            ("kn-IN", "Kannada"),
            ("ml-IN", "Malayalam"),
            ("pa-IN", "Punjabi"),
            ("en-IN", "English (India)"),
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_language_from_code() {
        assert!(matches!(TtsLanguage::from_code("hi-IN"), Some(TtsLanguage::Hindi)));
        assert!(matches!(TtsLanguage::from_code("hindi"), Some(TtsLanguage::Hindi)));
        assert!(matches!(TtsLanguage::from_code("ta"), Some(TtsLanguage::Tamil)));
        assert!(TtsLanguage::from_code("unknown").is_none());
    }

    #[test]
    fn test_edge_voices() {
        let hindi = TtsLanguage::Hindi;
        assert!(hindi.edge_voice().contains("hi-IN"));
    }
}
