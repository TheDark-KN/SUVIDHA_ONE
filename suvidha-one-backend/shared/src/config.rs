use config::{Config, Environment};
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub redis: RedisConfig,
    pub jwt: JwtConfig,
    pub uidai: Option<UidaiConfig>,
    pub npci: Option<NpciConfig>,
    pub digilocker: Option<DigilockerConfig>,
    pub sms: Option<SmsConfig>,
    pub whatsapp: Option<WhatsAppConfig>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub env: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct RedisConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JwtConfig {
    pub private_key_pem: String,
    pub public_key_pem: String,
    pub access_ttl_secs: u64,
    pub refresh_ttl_secs: u64,
    pub issuer: String,
    pub audience: Vec<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct UidaiConfig {
    pub api_key: String,
    pub aua_code: String,
    pub api_url: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct NpciConfig {
    pub merchant_id: String,
    pub api_key: String,
    pub webhook_secret: String,
    pub api_url: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DigilockerConfig {
    pub client_id: String,
    pub client_secret: String,
    pub api_url: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SmsConfig {
    pub provider: String,
    pub api_key: String,
    pub sender_id: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct WhatsAppConfig {
    pub api_url: String,
    pub api_key: String,
    pub phone_number_id: String,
}

pub fn load_config() -> Result<AppConfig, config::ConfigError> {
    Config::builder()
        .add_source(config::File::with_name("config/default").required(false))
        .add_source(
            config::File::with_name(&format!(
                "config/{}",
                std::env::var("APP_ENV").unwrap_or_else(|_| "dev".to_string())
            ))
            .required(false),
        )
        .add_source(Environment::with_prefix("SUVIDHA").separator("__"))
        .build()?
        .try_deserialize()
}
