//! Google Cloud Text-to-Speech service for voice responses
//! Supports all major Indian languages

use serde::{Deserialize, Serialize};
use crate::error::AppError;

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

    /// Get default voice name for language
    pub fn default_voice(&self) -> &'static str {
        match self {
            TtsLanguage::Hindi => "hi-IN-Wavenet-A",
            TtsLanguage::Bengali => "bn-IN-Wavenet-A",
            TtsLanguage::Telugu => "te-IN-Standard-A",
            TtsLanguage::Tamil => "ta-IN-Wavenet-A",
            TtsLanguage::Marathi => "mr-IN-Wavenet-A",
            TtsLanguage::Gujarati => "gu-IN-Wavenet-A",
            TtsLanguage::Kannada => "kn-IN-Wavenet-A",
            TtsLanguage::Malayalam => "ml-IN-Wavenet-A",
            TtsLanguage::Punjabi => "pa-IN-Wavenet-A",
            TtsLanguage::EnglishIndia => "en-IN-Wavenet-A",
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
    /// Speaking rate (0.25 to 4.0, default 1.0)
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

/// Google Cloud TTS API request structure
#[derive(Debug, Serialize)]
struct GoogleTtsRequest {
    input: GoogleTtsInput,
    voice: GoogleTtsVoice,
    #[serde(rename = "audioConfig")]
    audio_config: GoogleTtsAudioConfig,
}

#[derive(Debug, Serialize)]
struct GoogleTtsInput {
    text: String,
}

#[derive(Debug, Serialize)]
struct GoogleTtsVoice {
    #[serde(rename = "languageCode")]
    language_code: String,
    name: String,
}

#[derive(Debug, Serialize)]
struct GoogleTtsAudioConfig {
    #[serde(rename = "audioEncoding")]
    audio_encoding: String,
    #[serde(rename = "speakingRate")]
    speaking_rate: f32,
}

/// Google Cloud TTS API response
#[derive(Debug, Deserialize)]
struct GoogleTtsResponse {
    #[serde(rename = "audioContent")]
    audio_content: String,
}

/// TTS Service client
#[derive(Clone)]
pub struct TtsService {
    client: reqwest::Client,
    api_key: String,
}

impl TtsService {
    /// Create new TTS service with API key
    pub fn new(api_key: String) -> Self {
        Self {
            client: reqwest::Client::new(),
            api_key,
        }
    }

    /// Create from environment variable GOOGLE_TTS_API_KEY
    pub fn from_env() -> Result<Self, AppError> {
        let api_key = std::env::var("GOOGLE_TTS_API_KEY")
            .map_err(|_| AppError::Config("GOOGLE_TTS_API_KEY not set".to_string()))?;
        Ok(Self::new(api_key))
    }

    /// Synthesize speech from text
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
            .unwrap_or_else(|| language.default_voice().to_string());

        // Build Google TTS request
        let google_request = GoogleTtsRequest {
            input: GoogleTtsInput {
                text: request.text,
            },
            voice: GoogleTtsVoice {
                language_code: language.as_code().to_string(),
                name: voice_name.clone(),
            },
            audio_config: GoogleTtsAudioConfig {
                audio_encoding: "MP3".to_string(),
                speaking_rate: request.speaking_rate.clamp(0.25, 4.0),
            },
        };

        // Call Google TTS API
        let url = format!(
            "https://texttospeech.googleapis.com/v1/text:synthesize?key={}",
            self.api_key
        );

        let response = self.client
            .post(&url)
            .json(&google_request)
            .send()
            .await
            .map_err(|e| AppError::External(format!("TTS API request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            tracing::error!("Google TTS API error: {} - {}", status, error_text);
            return Err(AppError::External(format!("TTS API error: {}", status)));
        }

        let google_response: GoogleTtsResponse = response
            .json()
            .await
            .map_err(|e| AppError::External(format!("Failed to parse TTS response: {}", e)))?;

        Ok(TtsSynthesizeResponse {
            audio_content: google_response.audio_content,
            format: "mp3".to_string(),
            language: language.as_code().to_string(),
            voice: voice_name,
        })
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
    fn test_default_voices() {
        let hindi = TtsLanguage::Hindi;
        assert!(hindi.default_voice().contains("hi-IN"));
    }
}
