use serde::{Deserialize, Serialize};
use thiserror::Error;
use reqwest::Client;

#[derive(Error, Debug)]
pub enum UpstashError {
    #[error("HTTP request failed: {0}")]
    RequestFailed(#[from] reqwest::Error),
    #[error("Upstash error: {0}")]
    UpstashError(String),
}

impl From<UpstashError> for crate::AppError {
    fn from(err: UpstashError) -> Self {
        match err {
            UpstashError::RequestFailed(e) => crate::AppError::External(format!("Upstash request failed: {}", e)),
            UpstashError::UpstashError(e) => crate::AppError::External(format!("Upstash error: {}", e)),
        }
    }
}

#[derive(Debug, Serialize)]
struct UpstashCommand {
    #[serde(rename = "args")]
    args: Vec<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
struct UpstashResponse {
    #[serde(rename = "result")]
    result: serde_json::Value,
    #[serde(rename = "error")]
    error: Option<String>,
}

pub struct UpstashRedis {
    url: String,
    token: String,
    client: Client,
}

impl UpstashRedis {
    pub fn new(url: &str, token: &str) -> Self {
        Self {
            url: url.to_string(),
            token: token.to_string(),
            client: Client::new(),
        }
    }

    pub async fn get(&self, key: &str) -> Result<Option<String>, UpstashError> {
        let response = self.client
            .post(&self.url)
            .header("Authorization", format!("Bearer {}", self.token))
            .json(&UpstashCommand {
                args: vec!["GET".into(), key.into()],
            })
            .send()
            .await?;

        let result: UpstashResponse = response.json().await?;
        
        if let Some(error) = result.error {
            return Err(UpstashError::UpstashError(error));
        }

        match result.result {
            serde_json::Value::String(s) => Ok(Some(s)),
            serde_json::Value::Null => Ok(None),
            _ => Ok(Some(result.result.to_string())),
        }
    }

    pub async fn set(&self, key: &str, value: &str) -> Result<(), UpstashError> {
        let response = self.client
            .post(&self.url)
            .header("Authorization", format!("Bearer {}", self.token))
            .json(&UpstashCommand {
                args: vec!["SET".into(), key.into(), value.into()],
            })
            .send()
            .await?;

        let result: UpstashResponse = response.json().await?;
        
        if let Some(error) = result.error {
            return Err(UpstashError::UpstashError(error));
        }

        Ok(())
    }

    pub async fn setex(&self, key: &str, seconds: u64, value: &str) -> Result<(), UpstashError> {
        let response = self.client
            .post(&self.url)
            .header("Authorization", format!("Bearer {}", self.token))
            .json(&UpstashCommand {
                args: vec!["SETEX".into(), key.into(), seconds.into(), value.into()],
            })
            .send()
            .await?;

        let result: UpstashResponse = response.json().await?;
        
        if let Some(error) = result.error {
            return Err(UpstashError::UpstashError(error));
        }

        Ok(())
    }

    pub async fn incr(&self, key: &str) -> Result<i64, UpstashError> {
        let response = self.client
            .post(&self.url)
            .header("Authorization", format!("Bearer {}", self.token))
            .json(&UpstashCommand {
                args: vec!["INCR".into(), key.into()],
            })
            .send()
            .await?;

        let result: UpstashResponse = response.json().await?;
        
        if let Some(error) = result.error {
            return Err(UpstashError::UpstashError(error));
        }

        match result.result {
            serde_json::Value::Number(n) => Ok(n.as_i64().unwrap_or(0)),
            _ => Ok(0),
        }
    }

    pub async fn del(&self, key: &str) -> Result<(), UpstashError> {
        let response = self.client
            .post(&self.url)
            .header("Authorization", format!("Bearer {}", self.token))
            .json(&UpstashCommand {
                args: vec!["DEL".into(), key.into()],
            })
            .send()
            .await?;

        let result: UpstashResponse = response.json().await?;
        
        if let Some(error) = result.error {
            return Err(UpstashError::UpstashError(error));
        }

        Ok(())
    }

    pub async fn exists(&self, key: &str) -> Result<bool, UpstashError> {
        let response = self.client
            .post(&self.url)
            .header("Authorization", format!("Bearer {}", self.token))
            .json(&UpstashCommand {
                args: vec!["EXISTS".into(), key.into()],
            })
            .send()
            .await?;

        let result: UpstashResponse = response.json().await?;
        
        if let Some(error) = result.error {
            return Err(UpstashError::UpstashError(error));
        }

        match result.result {
            serde_json::Value::Number(n) => Ok(n.as_i64().unwrap_or(0) > 0),
            _ => Ok(false),
        }
    }
}
