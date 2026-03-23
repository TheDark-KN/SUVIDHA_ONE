//! Bhashini API Integration for SUVIDHA ONE
//! 
//! Provides Speech-to-Text (ASR), Text-to-Speech (TTS), and Translation services
//! using India's official Bhashini AI4Bharat APIs.
//! 
//! Supports 11 Indian languages: Hindi, Bengali, Telugu, Tamil, Marathi, Gujarati,
//! Kannada, Malayalam, Punjabi, Odia, and English.
//!
//! API Docs: https://bhashini.gov.in, https://dibd-bhashini.gitbook.io/bhashini-apis

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;
use std::time::Duration;
use thiserror::Error;

// ═══════════════════════════════════════════════════════════════════════════════
// ERRORS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Error, Debug)]
pub enum BhashiniError {
    #[error("Bhashini API error: {0}")]
    ApiError(String),
    #[error("Configuration error: {0}")]
    ConfigError(String),
    #[error("Request failed: {0}")]
    RequestFailed(String),
    #[error("Invalid audio format: {0}")]
    InvalidAudio(String),
    #[error("Language not supported: {0}")]
    UnsupportedLanguage(String),
    #[error("Rate limited - try again later")]
    RateLimited,
    #[error("Service unavailable")]
    ServiceUnavailable,
}

impl From<reqwest::Error> for BhashiniError {
    fn from(err: reqwest::Error) -> Self {
        BhashiniError::RequestFailed(err.to_string())
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LANGUAGES
// ═══════════════════════════════════════════════════════════════════════════════

/// Bhashini supported languages (ISO 639-1 codes)
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash, Default)]
pub enum BhashiniLanguage {
    #[default]
    #[serde(rename = "hi")]
    Hindi,
    #[serde(rename = "bn")]
    Bengali,
    #[serde(rename = "te")]
    Telugu,
    #[serde(rename = "ta")]
    Tamil,
    #[serde(rename = "mr")]
    Marathi,
    #[serde(rename = "gu")]
    Gujarati,
    #[serde(rename = "kn")]
    Kannada,
    #[serde(rename = "ml")]
    Malayalam,
    #[serde(rename = "pa")]
    Punjabi,
    #[serde(rename = "or")]
    Odia,
    #[serde(rename = "en")]
    English,
}

impl BhashiniLanguage {
    /// Get ISO 639-1 code
    pub fn code(&self) -> &'static str {
        match self {
            Self::Hindi => "hi",
            Self::Bengali => "bn",
            Self::Telugu => "te",
            Self::Tamil => "ta",
            Self::Marathi => "mr",
            Self::Gujarati => "gu",
            Self::Kannada => "kn",
            Self::Malayalam => "ml",
            Self::Punjabi => "pa",
            Self::Odia => "or",
            Self::English => "en",
        }
    }

    /// Get native name
    pub fn native_name(&self) -> &'static str {
        match self {
            Self::Hindi => "हिन्दी",
            Self::Bengali => "বাংলা",
            Self::Telugu => "తెలుగు",
            Self::Tamil => "தமிழ்",
            Self::Marathi => "मराठी",
            Self::Gujarati => "ગુજરાતી",
            Self::Kannada => "ಕನ್ನಡ",
            Self::Malayalam => "മലയാളം",
            Self::Punjabi => "ਪੰਜਾਬੀ",
            Self::Odia => "ଓଡ଼ିଆ",
            Self::English => "English",
        }
    }

    /// Parse from string (flexible - accepts codes, names, etc.)
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().trim() {
            "hi" | "hin" | "hindi" | "हिन्दी" => Some(Self::Hindi),
            "bn" | "ben" | "bengali" | "বাংলা" => Some(Self::Bengali),
            "te" | "tel" | "telugu" | "తెలుగు" => Some(Self::Telugu),
            "ta" | "tam" | "tamil" | "தமிழ்" => Some(Self::Tamil),
            "mr" | "mar" | "marathi" | "मराठी" => Some(Self::Marathi),
            "gu" | "guj" | "gujarati" | "ગુજરાતી" => Some(Self::Gujarati),
            "kn" | "kan" | "kannada" | "ಕನ್ನಡ" => Some(Self::Kannada),
            "ml" | "mal" | "malayalam" | "മലയാളം" => Some(Self::Malayalam),
            "pa" | "pan" | "punjabi" | "ਪੰਜਾਬੀ" => Some(Self::Punjabi),
            "or" | "ori" | "odia" | "oriya" | "ଓଡ଼ିଆ" => Some(Self::Odia),
            "en" | "eng" | "english" => Some(Self::English),
            _ => None,
        }
    }

    /// Get all supported languages
    pub fn all() -> &'static [BhashiniLanguage] {
        &[
            Self::Hindi,
            Self::Bengali,
            Self::Telugu,
            Self::Tamil,
            Self::Marathi,
            Self::Gujarati,
            Self::Kannada,
            Self::Malayalam,
            Self::Punjabi,
            Self::Odia,
            Self::English,
        ]
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG REQUEST/RESPONSE STRUCTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Request to get pipeline configuration
#[derive(Debug, Serialize)]
struct ConfigRequest {
    #[serde(rename = "pipelineTasks")]
    pipeline_tasks: Vec<PipelineTask>,
    #[serde(rename = "pipelineRequestConfig")]
    pipeline_request_config: PipelineRequestConfig,
}

#[derive(Debug, Serialize)]
struct PipelineTask {
    #[serde(rename = "taskType")]
    task_type: String,
    config: Option<TaskConfigRequest>,
}

#[derive(Debug, Serialize)]
struct TaskConfigRequest {
    #[serde(rename = "sourceLanguage", skip_serializing_if = "Option::is_none")]
    source_language: Option<String>,
    #[serde(rename = "targetLanguage", skip_serializing_if = "Option::is_none")]
    target_language: Option<String>,
}

#[derive(Debug, Serialize)]
struct PipelineRequestConfig {
    #[serde(rename = "pipelineId")]
    pipeline_id: String,
}

/// Bhashini pipeline configuration response
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct BhashiniConfig {
    #[serde(rename = "pipelineInferenceAPIEndPoint")]
    pub endpoint: InferenceEndpoint,
    #[serde(rename = "pipelineResponseConfig")]
    pub response_config: Vec<TaskConfig>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct InferenceEndpoint {
    #[serde(rename = "callbackUrl")]
    pub callback_url: String,
    #[serde(rename = "inferenceApiKey")]
    pub inference_api_key: InferenceApiKey,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct InferenceApiKey {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct TaskConfig {
    #[serde(rename = "taskType")]
    pub task_type: String,
    pub config: Vec<ServiceConfig>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ServiceConfig {
    #[serde(rename = "serviceId")]
    pub service_id: String,
    #[serde(rename = "modelId", default)]
    pub model_id: Option<String>,
    pub language: LanguageConfig,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LanguageConfig {
    #[serde(rename = "sourceLanguage")]
    pub source_language: String,
    #[serde(rename = "targetLanguage", skip_serializing_if = "Option::is_none")]
    pub target_language: Option<String>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// INFERENCE REQUEST/RESPONSE STRUCTS
// ═══════════════════════════════════════════════════════════════════════════════

/// ASR (Speech-to-Text) request
#[derive(Debug, Serialize)]
struct AsrRequest {
    #[serde(rename = "pipelineTasks")]
    pipeline_tasks: Vec<AsrPipelineTask>,
    #[serde(rename = "inputData")]
    input_data: AsrInputData,
}

#[derive(Debug, Serialize)]
struct AsrPipelineTask {
    #[serde(rename = "taskType")]
    task_type: String,
    config: AsrTaskConfig,
}

#[derive(Debug, Serialize)]
struct AsrTaskConfig {
    #[serde(rename = "serviceId")]
    service_id: String,
    language: LanguageConfig,
    #[serde(rename = "audioFormat")]
    audio_format: String,
    #[serde(rename = "samplingRate")]
    sampling_rate: u32,
}

#[derive(Debug, Serialize)]
struct AsrInputData {
    audio: Vec<AudioInput>,
}

#[derive(Debug, Serialize)]
struct AudioInput {
    #[serde(rename = "audioContent")]
    audio_content: String,
}

/// TTS (Text-to-Speech) request
#[derive(Debug, Serialize)]
struct TtsRequest {
    #[serde(rename = "pipelineTasks")]
    pipeline_tasks: Vec<TtsPipelineTask>,
    #[serde(rename = "inputData")]
    input_data: TtsInputData,
}

#[derive(Debug, Serialize)]
struct TtsPipelineTask {
    #[serde(rename = "taskType")]
    task_type: String,
    config: TtsTaskConfig,
}

#[derive(Debug, Serialize)]
struct TtsTaskConfig {
    #[serde(rename = "serviceId")]
    service_id: String,
    language: LanguageConfig,
    gender: String,
}

#[derive(Debug, Serialize)]
struct TtsInputData {
    input: Vec<TextInput>,
}

#[derive(Debug, Serialize)]
struct TextInput {
    source: String,
}

/// Translation request
#[derive(Debug, Serialize)]
struct TranslationRequest {
    #[serde(rename = "pipelineTasks")]
    pipeline_tasks: Vec<TranslationPipelineTask>,
    #[serde(rename = "inputData")]
    input_data: TranslationInputData,
}

#[derive(Debug, Serialize)]
struct TranslationPipelineTask {
    #[serde(rename = "taskType")]
    task_type: String,
    config: TranslationTaskConfig,
}

#[derive(Debug, Serialize)]
struct TranslationTaskConfig {
    #[serde(rename = "serviceId")]
    service_id: String,
    language: LanguageConfig,
}

#[derive(Debug, Serialize)]
struct TranslationInputData {
    input: Vec<TextInput>,
}

/// Generic pipeline response
#[derive(Debug, Deserialize)]
struct PipelineResponse {
    #[serde(rename = "pipelineResponse")]
    pipeline_response: Vec<TaskResponse>,
}

#[derive(Debug, Deserialize)]
struct TaskResponse {
    #[serde(rename = "taskType")]
    task_type: String,
    output: Option<Vec<OutputItem>>,
    audio: Option<Vec<AudioOutput>>,
}

#[derive(Debug, Deserialize)]
struct OutputItem {
    source: Option<String>,
    target: Option<String>,
}

#[derive(Debug, Deserialize)]
struct AudioOutput {
    #[serde(rename = "audioContent")]
    audio_content: String,
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/// ASR (Speech-to-Text) result
#[derive(Debug, Clone, Serialize)]
pub struct AsrResult {
    /// Transcribed text
    pub text: String,
    /// Source language detected/used
    pub language: String,
    /// Confidence score (0.0-1.0) if available
    pub confidence: Option<f32>,
}

/// TTS (Text-to-Speech) result
#[derive(Debug, Clone, Serialize)]
pub struct TtsResult {
    /// Audio bytes (WAV format)
    pub audio_bytes: Vec<u8>,
    /// Audio as base64 string
    pub audio_base64: String,
    /// Language used
    pub language: String,
    /// Voice gender used
    pub gender: String,
}

/// Translation result
#[derive(Debug, Clone, Serialize)]
pub struct TranslationResult {
    /// Translated text
    pub text: String,
    /// Source language
    pub source_language: String,
    /// Target language
    pub target_language: String,
}

/// Voice input/output request for complete voice interaction
#[derive(Debug, Deserialize)]
pub struct VoiceInputRequest {
    /// Base64 encoded audio (WAV 16kHz preferred)
    pub audio: String,
    /// Source language code (e.g., "hi", "ta", "en")
    pub language: Option<String>,
    /// Auto-detect language if not specified
    #[serde(default)]
    pub auto_detect: bool,
}

/// Complete voice interaction response
#[derive(Debug, Serialize)]
pub struct VoiceResponse {
    /// Transcribed text from user's voice
    pub transcript: String,
    /// Detected intent (e.g., "bill_payment", "complaint")
    pub intent: String,
    /// System's text reply
    pub reply_text: String,
    /// Base64 encoded audio response
    pub reply_audio: String,
    /// Language used
    pub language: String,
}

// ═══════════════════════════════════════════════════════════════════════════════
// BHASHINI SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

/// Bhashini API service client
pub struct BhashiniService {
    client: Client,
    user_id: String,
    api_key: String,
    pipeline_id: String,
    config_url: String,
}

impl BhashiniService {
    /// Create new Bhashini service from environment variables
    /// 
    /// Required env vars:
    /// - BHASHINI_USER_ID: Your Bhashini user ID
    /// - BHASHINI_API_KEY: Your Bhashini API key
    /// 
    /// Optional env vars:
    /// - BHASHINI_PIPELINE_ID: Pipeline ID (default: 64392f96daac500b55c543cd)
    /// - BHASHINI_CONFIG_URL: Config API URL
    pub fn new() -> Result<Self, BhashiniError> {
        let user_id = env::var("BHASHINI_USER_ID")
            .map_err(|_| BhashiniError::ConfigError("BHASHINI_USER_ID not set".into()))?;
        
        let api_key = env::var("BHASHINI_API_KEY")
            .map_err(|_| BhashiniError::ConfigError("BHASHINI_API_KEY not set".into()))?;
        
        let pipeline_id = env::var("BHASHINI_PIPELINE_ID")
            .unwrap_or_else(|_| "64392f96daac500b55c543cd".into());
        
        let config_url = env::var("BHASHINI_CONFIG_URL")
            .unwrap_or_else(|_| "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline".into());

        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()?;

        Ok(Self {
            client,
            user_id,
            api_key,
            pipeline_id,
            config_url,
        })
    }

    /// Create a dummy service for testing (no real API calls)
    pub fn new_dummy() -> Self {
        Self {
            client: Client::new(),
            user_id: "dummy_user".into(),
            api_key: "dummy_key".into(),
            pipeline_id: "dummy_pipeline".into(),
            config_url: "https://dummy.url".into(),
        }
    }

    /// Check if service is properly configured
    pub fn is_configured(&self) -> bool {
        !self.user_id.is_empty() 
            && !self.api_key.is_empty() 
            && self.user_id != "dummy_user"
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PIPELINE CONFIG
    // ─────────────────────────────────────────────────────────────────────────

    /// Get pipeline configuration for specified tasks
    /// 
    /// Tasks: "asr" (speech-to-text), "tts" (text-to-speech), "translation"
    pub async fn get_pipeline_config(
        &self,
        tasks: &[&str],
        source_lang: Option<&str>,
        target_lang: Option<&str>,
    ) -> Result<BhashiniConfig, BhashiniError> {
        let pipeline_tasks: Vec<PipelineTask> = tasks
            .iter()
            .map(|&task| PipelineTask {
                task_type: task.to_string(),
                config: if task == "translation" {
                    Some(TaskConfigRequest {
                        source_language: source_lang.map(String::from),
                        target_language: target_lang.map(String::from),
                    })
                } else {
                    Some(TaskConfigRequest {
                        source_language: source_lang.map(String::from),
                        target_language: None,
                    })
                },
            })
            .collect();

        let body = ConfigRequest {
            pipeline_tasks,
            pipeline_request_config: PipelineRequestConfig {
                pipeline_id: self.pipeline_id.clone(),
            },
        };

        tracing::debug!(tasks = ?tasks, "Fetching Bhashini pipeline config");

        let res = self.client
            .post(&self.config_url)
            .header("userID", &self.user_id)
            .header("ulcaApiKey", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        let status = res.status();
        if !status.is_success() {
            let error_text = res.text().await.unwrap_or_default();
            tracing::error!(status = %status, error = %error_text, "Bhashini config API error");
            
            if status.as_u16() == 429 {
                return Err(BhashiniError::RateLimited);
            }
            return Err(BhashiniError::ApiError(format!("Status {}: {}", status, error_text)));
        }

        let config: BhashiniConfig = res.json().await
            .map_err(|e| BhashiniError::ApiError(format!("Invalid response: {}", e)))?;

        tracing::info!(
            endpoint = %config.endpoint.callback_url,
            services = config.response_config.len(),
            "Bhashini config loaded"
        );

        Ok(config)
    }

    /// Get config for ASR (speech-to-text)
    pub async fn get_asr_config(&self, lang: &str) -> Result<BhashiniConfig, BhashiniError> {
        self.get_pipeline_config(&["asr"], Some(lang), None).await
    }

    /// Get config for TTS (text-to-speech)
    pub async fn get_tts_config(&self, lang: &str) -> Result<BhashiniConfig, BhashiniError> {
        self.get_pipeline_config(&["tts"], Some(lang), None).await
    }

    /// Get config for ASR + TTS (voice interaction)
    pub async fn get_voice_config(&self, lang: &str) -> Result<BhashiniConfig, BhashiniError> {
        self.get_pipeline_config(&["asr", "tts"], Some(lang), None).await
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ASR (SPEECH TO TEXT)
    // ─────────────────────────────────────────────────────────────────────────

    /// Convert speech to text
    /// 
    /// # Arguments
    /// * `config` - Pipeline config from `get_asr_config()`
    /// * `audio_bytes` - WAV audio bytes (16kHz, mono recommended)
    /// * `lang` - Language code (e.g., "hi", "ta", "en")
    /// 
    /// # Returns
    /// Transcribed text
    pub async fn speech_to_text(
        &self,
        config: &BhashiniConfig,
        audio_bytes: &[u8],
        lang: &str,
    ) -> Result<AsrResult, BhashiniError> {
        // Find ASR service ID for the language
        let asr_config = config.response_config
            .iter()
            .find(|t| t.task_type == "asr")
            .and_then(|t| t.config.iter().find(|c| c.language.source_language == lang))
            .ok_or_else(|| BhashiniError::UnsupportedLanguage(
                format!("No ASR model for language: {}", lang)
            ))?;

        let audio_b64 = BASE64.encode(audio_bytes);

        let body = AsrRequest {
            pipeline_tasks: vec![AsrPipelineTask {
                task_type: "asr".to_string(),
                config: AsrTaskConfig {
                    service_id: asr_config.service_id.clone(),
                    language: LanguageConfig {
                        source_language: lang.to_string(),
                        target_language: None,
                    },
                    audio_format: "wav".to_string(),
                    sampling_rate: 16000,
                },
            }],
            input_data: AsrInputData {
                audio: vec![AudioInput {
                    audio_content: audio_b64,
                }],
            },
        };

        tracing::debug!(lang = %lang, audio_size = audio_bytes.len(), "Calling Bhashini ASR");

        let res = self.client
            .post(&config.endpoint.callback_url)
            .header(&config.endpoint.inference_api_key.name, &config.endpoint.inference_api_key.value)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        let status = res.status();
        if !status.is_success() {
            let error_text = res.text().await.unwrap_or_default();
            tracing::error!(status = %status, error = %error_text, "Bhashini ASR error");
            return Err(BhashiniError::ApiError(format!("ASR failed: {}", error_text)));
        }

        let response: PipelineResponse = res.json().await
            .map_err(|e| BhashiniError::ApiError(format!("Invalid ASR response: {}", e)))?;

        // Extract transcribed text
        let text = response.pipeline_response
            .first()
            .and_then(|r| r.output.as_ref())
            .and_then(|o| o.first())
            .and_then(|i| i.source.as_ref())
            .cloned()
            .unwrap_or_default();

        tracing::info!(lang = %lang, text_len = text.len(), "Bhashini ASR success");

        Ok(AsrResult {
            text,
            language: lang.to_string(),
            confidence: None,
        })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TTS (TEXT TO SPEECH)
    // ─────────────────────────────────────────────────────────────────────────

    /// Convert text to speech
    /// 
    /// # Arguments
    /// * `config` - Pipeline config from `get_tts_config()`
    /// * `text` - Text to synthesize
    /// * `lang` - Language code
    /// * `gender` - Voice gender ("female" or "male")
    /// 
    /// # Returns
    /// Audio bytes (WAV format)
    pub async fn text_to_speech(
        &self,
        config: &BhashiniConfig,
        text: &str,
        lang: &str,
        gender: &str,
    ) -> Result<TtsResult, BhashiniError> {
        // Find TTS service ID for the language
        let tts_config = config.response_config
            .iter()
            .find(|t| t.task_type == "tts")
            .and_then(|t| t.config.iter().find(|c| c.language.source_language == lang))
            .ok_or_else(|| BhashiniError::UnsupportedLanguage(
                format!("No TTS model for language: {}", lang)
            ))?;

        let body = TtsRequest {
            pipeline_tasks: vec![TtsPipelineTask {
                task_type: "tts".to_string(),
                config: TtsTaskConfig {
                    service_id: tts_config.service_id.clone(),
                    language: LanguageConfig {
                        source_language: lang.to_string(),
                        target_language: None,
                    },
                    gender: gender.to_string(),
                },
            }],
            input_data: TtsInputData {
                input: vec![TextInput {
                    source: text.to_string(),
                }],
            },
        };

        tracing::debug!(lang = %lang, text_len = text.len(), "Calling Bhashini TTS");

        let res = self.client
            .post(&config.endpoint.callback_url)
            .header(&config.endpoint.inference_api_key.name, &config.endpoint.inference_api_key.value)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        let status = res.status();
        if !status.is_success() {
            let error_text = res.text().await.unwrap_or_default();
            tracing::error!(status = %status, error = %error_text, "Bhashini TTS error");
            return Err(BhashiniError::ApiError(format!("TTS failed: {}", error_text)));
        }

        let response: PipelineResponse = res.json().await
            .map_err(|e| BhashiniError::ApiError(format!("Invalid TTS response: {}", e)))?;

        // Extract audio content
        let audio_b64 = response.pipeline_response
            .first()
            .and_then(|r| r.audio.as_ref())
            .and_then(|a| a.first())
            .map(|a| a.audio_content.clone())
            .unwrap_or_default();

        let audio_bytes = BASE64.decode(&audio_b64)
            .map_err(|e| BhashiniError::ApiError(format!("Invalid audio base64: {}", e)))?;

        tracing::info!(lang = %lang, audio_size = audio_bytes.len(), "Bhashini TTS success");

        Ok(TtsResult {
            audio_bytes,
            audio_base64: audio_b64,
            language: lang.to_string(),
            gender: gender.to_string(),
        })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TRANSLATION
    // ─────────────────────────────────────────────────────────────────────────

    /// Translate text between languages
    pub async fn translate(
        &self,
        config: &BhashiniConfig,
        text: &str,
        source_lang: &str,
        target_lang: &str,
    ) -> Result<TranslationResult, BhashiniError> {
        // Find translation service ID
        let nmt_config = config.response_config
            .iter()
            .find(|t| t.task_type == "translation")
            .and_then(|t| t.config.iter().find(|c| {
                c.language.source_language == source_lang 
                    && c.language.target_language.as_deref() == Some(target_lang)
            }))
            .ok_or_else(|| BhashiniError::UnsupportedLanguage(
                format!("No translation model for {} -> {}", source_lang, target_lang)
            ))?;

        let body = TranslationRequest {
            pipeline_tasks: vec![TranslationPipelineTask {
                task_type: "translation".to_string(),
                config: TranslationTaskConfig {
                    service_id: nmt_config.service_id.clone(),
                    language: LanguageConfig {
                        source_language: source_lang.to_string(),
                        target_language: Some(target_lang.to_string()),
                    },
                },
            }],
            input_data: TranslationInputData {
                input: vec![TextInput {
                    source: text.to_string(),
                }],
            },
        };

        let res = self.client
            .post(&config.endpoint.callback_url)
            .header(&config.endpoint.inference_api_key.name, &config.endpoint.inference_api_key.value)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        let status = res.status();
        if !status.is_success() {
            let error_text = res.text().await.unwrap_or_default();
            return Err(BhashiniError::ApiError(format!("Translation failed: {}", error_text)));
        }

        let response: PipelineResponse = res.json().await
            .map_err(|e| BhashiniError::ApiError(format!("Invalid translation response: {}", e)))?;

        let translated = response.pipeline_response
            .first()
            .and_then(|r| r.output.as_ref())
            .and_then(|o| o.first())
            .and_then(|i| i.target.as_ref())
            .cloned()
            .unwrap_or_default();

        Ok(TranslationResult {
            text: translated,
            source_language: source_lang.to_string(),
            target_language: target_lang.to_string(),
        })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTENT DETECTION
    // ─────────────────────────────────────────────────────────────────────────

    /// Detect intent from transcribed text (simple keyword-based)
    pub fn detect_intent(&self, text: &str, _lang: &str) -> String {
        let t = text.to_lowercase();

        // Electricity bill
        if t.contains("बिजली") || t.contains("bijli") || t.contains("electricity") 
            || t.contains("light bill") || t.contains("विद्युत") {
            return "electricity_bill".to_string();
        }

        // Water bill
        if t.contains("पानी") || t.contains("water") || t.contains("jal") 
            || t.contains("जल") || t.contains("paani") {
            return "water_bill".to_string();
        }

        // Gas booking
        if t.contains("गैस") || t.contains("gas") || t.contains("सिलेंडर") 
            || t.contains("cylinder") || t.contains("lpg") {
            return "gas_booking".to_string();
        }

        // Property tax
        if t.contains("टैक्स") || t.contains("tax") || t.contains("property") 
            || t.contains("संपत्ति") || t.contains("कर") {
            return "property_tax".to_string();
        }

        // Complaint/Grievance
        if t.contains("शिकायत") || t.contains("complaint") || t.contains("problem") 
            || t.contains("issue") || t.contains("समस्या") {
            return "complaint".to_string();
        }

        // Certificate
        if t.contains("प्रमाण") || t.contains("certificate") || t.contains("cert") 
            || t.contains("सर्टिफिकेट") || t.contains("document") {
            return "certificate".to_string();
        }

        // Aadhaar
        if t.contains("आधार") || t.contains("aadhaar") || t.contains("aadhar") 
            || t.contains("uid") {
            return "aadhaar".to_string();
        }

        // Payment
        if t.contains("भुगतान") || t.contains("payment") || t.contains("pay") 
            || t.contains("पेमेंट") || t.contains("paisa") {
            return "payment".to_string();
        }

        // Help
        if t.contains("मदद") || t.contains("help") || t.contains("सहायता") 
            || t.contains("sahayata") {
            return "help".to_string();
        }

        "general".to_string()
    }

    /// Get appropriate response text based on intent
    pub fn get_intent_response(&self, intent: &str, lang: &str) -> String {
        match (intent, lang) {
            ("electricity_bill", "hi") => "आपका बिजली बिल देखा जा रहा है। कृपया प्रतीक्षा करें।".to_string(),
            ("electricity_bill", _) => "Checking your electricity bill. Please wait.".to_string(),
            
            ("water_bill", "hi") => "आपका पानी का बिल देखा जा रहा है।".to_string(),
            ("water_bill", _) => "Checking your water bill.".to_string(),
            
            ("gas_booking", "hi") => "गैस सिलेंडर बुकिंग की जा रही है।".to_string(),
            ("gas_booking", _) => "Processing your gas cylinder booking.".to_string(),
            
            ("property_tax", "hi") => "आपका संपत्ति कर विवरण देखा जा रहा है।".to_string(),
            ("property_tax", _) => "Checking your property tax details.".to_string(),
            
            ("complaint", "hi") => "आपकी शिकायत दर्ज की जा रही है। कृपया विवरण बताएं।".to_string(),
            ("complaint", _) => "Registering your complaint. Please provide details.".to_string(),
            
            ("certificate", "hi") => "प्रमाण पत्र सेवा खोली जा रही है।".to_string(),
            ("certificate", _) => "Opening certificate service.".to_string(),
            
            ("aadhaar", "hi") => "आधार सेवा खोली जा रही है।".to_string(),
            ("aadhaar", _) => "Opening Aadhaar service.".to_string(),
            
            ("payment", "hi") => "भुगतान पेज खोला जा रहा है।".to_string(),
            ("payment", _) => "Opening payment page.".to_string(),
            
            ("help", "hi") => "मैं आपकी मदद के लिए हूं। आप बिजली, पानी, गैस बिल भुगतान, शिकायत दर्ज, या प्रमाण पत्र प्राप्त कर सकते हैं।".to_string(),
            ("help", _) => "I'm here to help. You can pay bills, file complaints, or get certificates.".to_string(),
            
            (_, "hi") => "कृपया अपना अनुरोध दोहराएं।".to_string(),
            _ => "Please repeat your request.".to_string(),
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_language_parsing() {
        assert_eq!(BhashiniLanguage::from_str("hi"), Some(BhashiniLanguage::Hindi));
        assert_eq!(BhashiniLanguage::from_str("hindi"), Some(BhashiniLanguage::Hindi));
        assert_eq!(BhashiniLanguage::from_str("हिन्दी"), Some(BhashiniLanguage::Hindi));
        assert_eq!(BhashiniLanguage::from_str("ta"), Some(BhashiniLanguage::Tamil));
        assert_eq!(BhashiniLanguage::from_str("unknown"), None);
    }

    #[test]
    fn test_language_codes() {
        assert_eq!(BhashiniLanguage::Hindi.code(), "hi");
        assert_eq!(BhashiniLanguage::Tamil.code(), "ta");
        assert_eq!(BhashiniLanguage::English.code(), "en");
    }

    #[test]
    fn test_intent_detection() {
        let service = BhashiniService::new_dummy();
        
        assert_eq!(service.detect_intent("मुझे बिजली का बिल देखना है", "hi"), "electricity_bill");
        assert_eq!(service.detect_intent("show my electricity bill", "en"), "electricity_bill");
        assert_eq!(service.detect_intent("पानी का बिल", "hi"), "water_bill");
        assert_eq!(service.detect_intent("gas cylinder booking", "en"), "gas_booking");
        assert_eq!(service.detect_intent("मेरी शिकायत दर्ज करो", "hi"), "complaint");
        assert_eq!(service.detect_intent("random text", "en"), "general");
    }

    #[test]
    fn test_all_languages() {
        let langs = BhashiniLanguage::all();
        assert_eq!(langs.len(), 11);
        assert!(langs.contains(&BhashiniLanguage::Hindi));
        assert!(langs.contains(&BhashiniLanguage::Tamil));
    }
}
