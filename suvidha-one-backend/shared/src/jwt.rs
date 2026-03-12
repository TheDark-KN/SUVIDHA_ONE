use crate::error::AuthError;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use thiserror::Error;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Role {
    Citizen,
    KioskAdmin,
    DeptOfficer,
    SystemAdmin,
    ServiceAccount,
}

impl Role {
    pub fn is_allowed(&self, roles: &[Role]) -> bool {
        roles.contains(self)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessClaims {
    pub sub: uuid::Uuid,
    pub jti: uuid::Uuid,
    pub iat: i64,
    pub exp: i64,
    pub iss: String,
    pub aud: Vec<String>,
    pub kiosk: String,
    pub roles: Vec<Role>,
    pub lang: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshClaims {
    pub sub: uuid::Uuid,
    pub jti: uuid::Uuid,
    pub iat: i64,
    pub exp: i64,
    pub family: uuid::Uuid,
}

#[derive(Debug, Error)]
pub enum JwtError {
    #[error("Failed to encode token: {0}")]
    Encoding(String),
    #[error("Failed to decode token: {0}")]
    Decoding(String),
    #[error("Invalid token: {0}")]
    InvalidToken(String),
}

pub struct JwtService {
    private_key: EncodingKey,
    public_key: DecodingKey,
    issuer: String,
    audience: Vec<String>,
    access_ttl_secs: u64,
    refresh_ttl_secs: u64,
}

impl JwtService {
    pub fn new(
        private_pem: &[u8],
        public_pem: &[u8],
        issuer: String,
        audience: Vec<String>,
        access_ttl_secs: u64,
        refresh_ttl_secs: u64,
    ) -> Result<Self, JwtError> {
        Ok(Self {
            private_key: EncodingKey::from_rsa_pem(private_pem)
                .map_err(|e| JwtError::Encoding(e.to_string()))?,
            public_key: DecodingKey::from_rsa_pem(public_pem)
                .map_err(|e| JwtError::Decoding(e.to_string()))?,
            issuer,
            audience,
            access_ttl_secs,
            refresh_ttl_secs,
        })
    }

    pub fn issue_access_token(
        &self,
        user_id: uuid::Uuid,
        kiosk_id: &str,
        roles: Vec<Role>,
        lang: &str,
    ) -> Result<String, JwtError> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        let claims = AccessClaims {
            sub: user_id,
            jti: uuid::Uuid::new_v4(),
            iat: now,
            exp: now + self.access_ttl_secs as i64,
            iss: self.issuer.clone(),
            aud: self.audience.clone(),
            kiosk: kiosk_id.to_string(),
            roles,
            lang: lang.to_string(),
        };

        let header = Header::new(Algorithm::RS256);
        encode(&header, &claims, &self.private_key).map_err(|e| JwtError::Encoding(e.to_string()))
    }

    pub fn issue_refresh_token(
        &self,
        user_id: uuid::Uuid,
        family: uuid::Uuid,
    ) -> Result<String, JwtError> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        let claims = RefreshClaims {
            sub: user_id,
            jti: uuid::Uuid::new_v4(),
            iat: now,
            exp: now + self.refresh_ttl_secs as i64,
            family,
        };

        let header = Header::new(Algorithm::RS256);
        encode(&header, &claims, &self.private_key).map_err(|e| JwtError::Encoding(e.to_string()))
    }

    pub fn verify_access_token(&self, token: &str) -> Result<AccessClaims, AuthError> {
        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_issuer(&[&self.issuer]);
        validation.set_audience(&self.audience);

        decode::<AccessClaims>(token, &self.public_key, &validation)
            .map(|td| td.claims)
            .map_err(|e| match e.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature => AuthError::TokenExpired,
                jsonwebtoken::errors::ErrorKind::InvalidAudience => AuthError::InvalidToken,
                _ => AuthError::InvalidToken,
            })
    }

    pub fn verify_refresh_token(&self, token: &str) -> Result<RefreshClaims, JwtError> {
        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_issuer(&[&self.issuer]);
        validation.set_audience(&self.audience);
        validation.insecure_disable_signature_validation();

        decode::<RefreshClaims>(token, &self.public_key, &validation)
            .map(|td| td.claims)
            .map_err(|e| JwtError::Decoding(e.to_string()))
    }
}

pub fn build_access_claims(
    user_id: uuid::Uuid,
    kiosk_id: &str,
    roles: Vec<Role>,
    lang: &str,
    issuer: &str,
    audience: &[String],
    access_ttl_secs: u64,
) -> AccessClaims {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    AccessClaims {
        sub: user_id,
        jti: uuid::Uuid::new_v4(),
        iat: now,
        exp: now + access_ttl_secs as i64,
        iss: issuer.to_string(),
        aud: audience.to_vec(),
        kiosk: kiosk_id.to_string(),
        roles,
        lang: lang.to_string(),
    }
}

pub fn build_refresh_claims(
    user_id: uuid::Uuid,
    family: uuid::Uuid,
    _issuer: &str,
    _audience: &[String],
    refresh_ttl_secs: u64,
) -> RefreshClaims {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    RefreshClaims {
        sub: user_id,
        jti: uuid::Uuid::new_v4(),
        iat: now,
        exp: now + refresh_ttl_secs as i64,
        family,
    }
}
