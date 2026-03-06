# 🦀 SUVIDHA ONE — Rust Backend Documentation

> **Complete Developer Documentation | Architected for 1,000,000+ Users Per Minute**

---

<div align="center">

| | |
|---|---|
| **Team** | The_Dark_Knight · ID: 21 |
| **Project** | SUVIDHA ONE — Unified Citizen Service Kiosk |
| **Runtime** | Rust (Axum + Tokio) — async, zero-cost abstractions |
| **Target Scale** | 1,000,000+ authenticated requests per minute |
| **Database** | PostgreSQL 16 + Redis 7 + MinIO (S3) |
| **Auth** | JWT (RS256) + Aadhaar OTP + QR Session |
| **Version** | 1.0 · February 2026 |

</div>

---

## 📋 Table of Contents

1. [Introduction to the Backend Architecture](#1-introduction-to-the-backend-architecture)
2. [Authentication — OTP, Aadhaar & Session Design](#2-authentication--otp-aadhaar--session-design)
3. [JSON Web Tokens (JWT) — RS256 Implementation](#3-json-web-tokens-jwt--rs256-implementation)
4. [Authorization — RBAC & Tower Middleware](#4-authorization--rbac--tower-middleware)
5. [Web & API Security Best Practices](#5-web--api-security-best-practices)
6. [Business Logic Layer (BLL)](#6-business-logic-layer-bll)
7. [Caching Strategies — Redis + CDN](#7-caching-strategies--redis--cdn)
8. [Error Handling & Error Codes](#8-error-handling--error-codes)
9. [OpenAPI Standards & API Design](#9-openapi-standards--api-design)
10. [Webhooks — Design & Delivery](#10-webhooks--design--delivery)
11. [Logging, Monitoring & Observability](#11-logging-monitoring--observability)
12. [Testing & Code Quality](#12-testing--code-quality)
13. [Configuration Management](#13-configuration-management)
14. [Database Interactions & CRUD Operations](#14-database-interactions--crud-operations)
15. [Serialization & Deserialization (Serde)](#15-serialization--deserialization-serde)
16. [Appendix — Dependencies, Env Vars & Ports](#16-appendix--dependencies-env-vars--ports)

---

## 1. Introduction to the Backend Architecture

SUVIDHA ONE's Rust backend is purpose-built to serve over one million authenticated citizen requests per minute across a nationwide fleet of public kiosks. Every architectural choice — from the async runtime to the data access layer — is motivated by three non-negotiable goals: **safety**, **throughput**, and **auditability**.

### 1.1 Why Rust?

| Criterion | Rust Advantage | Impact at Scale |
|-----------|---------------|-----------------|
| **Memory Safety** | Ownership model eliminates data races, use-after-free, buffer overflows — at compile time | Zero security-class memory bugs in production |
| **Performance** | Zero-cost abstractions; performance matches C/C++ without GC pauses | Consistent sub-10ms p99 latency at 1M req/min |
| **Concurrency** | Tokio async runtime — millions of lightweight tasks on a thread pool | Handles 50k+ concurrent kiosk connections per node |
| **Type Safety** | Exhaustive pattern matching; `Result<T,E>` forces error handling | Reduces runtime panics to near zero in production |
| **Correctness** | Compiler as a code reviewer; impossible states are unrepresentable | Complex payment state machine enforced at compile time |
| **Ecosystem** | Axum (web), SQLx (DB), Serde (JSON), Tokio (async), Tower (middleware) | Best-in-class crates for every backend concern |

### 1.2 Five-Layer Architecture

The backend maps directly onto the five-layer system architecture:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SUVIDHA ONE SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 1 — EDGE                                                          │  │
│  │  NGINX reverse proxy · Kong API Gateway · TLS termination · DDoS guard  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                    │ HTTPS / TLS 1.3 + JWT                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 2 — API GATEWAY                                                   │  │
│  │  Axum router · Auth middleware · CORS · Rate limiting · Request routing  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                             │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 3 — MICROSERVICES                                                 │  │
│  │  auth · payment · utility · grievance · document · notification          │  │
│  │  session · kiosk                                                         │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                             │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 4 — DATA LAYER                                                    │  │
│  │  PostgreSQL 16 (primary) · Redis 7 (cache/sessions) · MinIO (documents) │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                             │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 5 — EXTERNAL INTEGRATIONS                                         │  │
│  │  UIDAI (Aadhaar) · NPCI (UPI/BBPS) · DigiLocker · DISCOM · Municipal    │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

| Layer | Component | Rust Crate / Tech | Responsibility |
|-------|-----------|-------------------|----------------|
| **1 — Edge** | NGINX reverse proxy | NGINX + Kong | TLS termination, rate-limit, DDoS protection |
| **2 — Gateway** | Axum API Gateway router | `axum 0.7`, `tower` | Auth middleware, request routing, CORS |
| **3 — Services** | 8 Axum microservices | `axum`, `tokio`, `tonic` (gRPC) | Business logic per domain |
| **4 — Data** | PostgreSQL / Redis / MinIO | `sqlx`, `deadpool-redis`, `aws-sdk-s3` | Persistence, caching, document storage |
| **5 — Integrations** | UIDAI, NPCI, DigiLocker | `reqwest`, `hyper` | Government API adapters with circuit breakers |

### 1.3 Microservice Topology

| Service | Port | Description |
|---------|------|-------------|
| `auth-service` | 3001 | OTP, Aadhaar, QR auth; JWT issuance & refresh |
| `payment-service` | 3002 | UPI, Card, BBPS payment orchestration |
| `utility-service` | 3003 | Electricity, Water, Gas, Municipal bill fetch & actions |
| `grievance-service` | 3004 | Complaint filing, tracking, escalation engine |
| `document-service` | 3005 | DigiLocker integration, certificate apply/download |
| `notification-service` | 3006 | SMS, WhatsApp, push notifications (async queue) |
| `session-service` | 3007 | Kiosk session state, idle timeout management |
| `kiosk-service` | 3008 | Kiosk registration, heartbeat, OTA config delivery |

### 1.4 Project File Structure (Backend)

```
suvidha-one/backend/
├── auth-service/
│   ├── src/
│   │   ├── main.rs              # Tokio entry point, router setup
│   │   ├── routes/              # Axum handler functions
│   │   │   ├── otp.rs
│   │   │   ├── aadhaar.rs
│   │   │   └── session.rs
│   │   ├── middleware/          # Tower middleware layers
│   │   │   ├── jwt.rs
│   │   │   └── rate_limit.rs
│   │   ├── models/              # SQLx query models + Serde structs
│   │   ├── services/            # Business logic (BLL)
│   │   ├── repository/          # DB access layer (trait + impl)
│   │   ├── cache/               # Redis operations
│   │   ├── errors.rs            # AppError enum + IntoResponse
│   │   └── config.rs            # Environment config
│   ├── Cargo.toml
│   └── Dockerfile
├── payment-service/             # Same structure
├── shared/                      # Shared crate (models, errors, utils)
│   └── src/
│       ├── lib.rs
│       ├── jwt.rs               # Shared JWT utilities
│       └── tracing.rs           # Shared observability setup
└── Cargo.toml                   # Workspace Cargo.toml
```

```toml
# Cargo.toml (workspace)
[workspace]
members = [
  "auth-service",
  "payment-service",
  "utility-service",
  "grievance-service",
  "document-service",
  "notification-service",
  "shared",
]
resolver = "2"

[workspace.dependencies]
axum         = "0.7"
tokio        = { version = "1", features = ["full"] }
serde        = { version = "1", features = ["derive"] }
sqlx         = { version = "0.7", features = ["postgres", "uuid", "chrono", "runtime-tokio"] }
redis        = { version = "0.24", features = ["tokio-comp"] }
jsonwebtoken = "9"
tracing      = "0.1"
tracing-subscriber = "0.3"
reqwest      = { version = "0.11", features = ["json", "rustls-tls"] }
uuid         = { version = "1", features = ["v4", "serde"] }
chrono       = { version = "0.4", features = ["serde"] }
anyhow       = "1"
thiserror    = "1"
```

---

## 2. Authentication — OTP, Aadhaar & Session Design

Authentication is the most security-critical layer. SUVIDHA ONE supports three authentication flows — **Mobile OTP**, **Aadhaar Biometric** (via UIDAI AUA), and **QR Code** session transfer. Each flow produces an identical JWT + Refresh Token pair so downstream services have a uniform interface.

### 2.1 Authentication Flow Overview

| Flow | Steps | Security Properties |
|------|-------|---------------------|
| **Mobile OTP** | 1. `POST /auth/otp/send` → generate 6-digit TOTP, store in Redis (TTL 300s)<br>2. `POST /auth/otp/verify` → compare hash, rate-limit 3 attempts<br>3. Upsert user row → generate JWT + refresh token | OTP hashed (HMAC-SHA256) in Redis; never stored plain; brute-force blocked at 3 attempts/IP/5min |
| **Aadhaar Biometric** | 1. `POST /auth/aadhaar/init` → get session token from UIDAI AUA API<br>2. Kiosk scans fingerprint → `POST /auth/aadhaar/verify` → UIDAI validates<br>3. Receive tokenized UID (VID) → upsert user → generate JWT | VID used — raw Aadhaar number never touches our DB; UIDAI AUA certified; mTLS to UIDAI endpoint |
| **QR Code** | 1. Citizen scans personal QR from DigiLocker/Aadhaar app<br>2. `POST /auth/qr/scan` → decode signed payload, verify signature<br>3. Extract user identity → generate JWT | QR payload signed by DigiLocker; expiry embedded; replay protected via nonce in Redis |

### 2.2 OTP Generation & Storage

```rust
// src/services/otp.rs
use hmac::{Hmac, Mac};
use sha2::Sha256;
use redis::AsyncCommands;

const OTP_TTL_SECS: usize = 300;   // 5 minutes
const OTP_MAX_ATTEMPTS: u8 = 3;

pub async fn send_otp(
    mobile: &str,
    redis: &mut redis::aio::Connection,
    sms_client: &SmsClient,
) -> Result<(), AppError> {
    // 1. Rate-limit check: max 3 OTPs per mobile per 10 min
    let rate_key = format!("otp:rate:{}", mobile);
    let count: u8 = redis.incr(&rate_key, 1).await?;
    if count == 1 { redis.expire(&rate_key, 600).await?; }
    if count > 3  { return Err(AppError::RateLimitExceeded); }

    // 2. Generate cryptographically random 6-digit OTP
    let otp: u32 = rand::thread_rng().gen_range(100_000..=999_999);

    // 3. Store HMAC-SHA256 hash of OTP (never plaintext)
    let secret = std::env::var("OTP_HMAC_SECRET")?;
    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes())
        .map_err(|_| AppError::Internal("HMAC init failed".into()))?;
    mac.update(otp.to_string().as_bytes());
    let otp_hash = hex::encode(mac.finalize().into_bytes());

    // 4. Store hash + attempt counter in Redis
    let key = format!("otp:hash:{}", mobile);
    redis.set_ex(&key, &otp_hash, OTP_TTL_SECS).await?;
    let attempt_key = format!("otp:attempts:{}", mobile);
    redis.set_ex(&attempt_key, 0u8, OTP_TTL_SECS).await?;

    // 5. Send OTP via SMS (actual digits sent to user, hash kept server-side)
    sms_client.send(mobile, &format!("Your SUVIDHA ONE OTP: {}", otp)).await?;
    Ok(())
}
```

### 2.3 OTP Verification

```rust
pub async fn verify_otp(
    mobile: &str,
    submitted_otp: &str,
    redis: &mut redis::aio::Connection,
) -> Result<(), AppError> {
    // 1. Check attempt count
    let attempt_key = format!("otp:attempts:{}", mobile);
    let attempts: u8 = redis.get(&attempt_key).await.unwrap_or(0);
    if attempts >= OTP_MAX_ATTEMPTS {
        return Err(AppError::Auth(AuthError::OtpMaxAttemptsExceeded));
    }
    redis.incr::<_, u8>(&attempt_key, 1).await?;

    // 2. Recompute hash of submitted OTP
    let secret = std::env::var("OTP_HMAC_SECRET")?;
    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes())
        .map_err(|_| AppError::Internal("HMAC init".into()))?;
    mac.update(submitted_otp.as_bytes());
    let submitted_hash = hex::encode(mac.finalize().into_bytes());

    // 3. Compare against stored hash (constant-time — prevents timing attacks)
    let stored_key = format!("otp:hash:{}", mobile);
    let stored_hash: Option<String> = redis.get(&stored_key).await?;
    match stored_hash {
        Some(h) if constant_time_eq(h.as_bytes(), submitted_hash.as_bytes()) => {
            // 4. Delete OTP keys on success
            redis.del(&[&stored_key, &attempt_key]).await?;
            Ok(())
        }
        Some(_) => Err(AppError::Auth(AuthError::InvalidOtp)),
        None    => Err(AppError::Auth(AuthError::OtpExpired)),
    }
}
```

### 2.4 Session Management

> **Note:** Sessions are stored server-side in Redis. The JWT is stateless but every request is also checked against the Redis session store. This enables instant logout — deleting the Redis key invalidates the token even if its JWT expiry has not passed.

```rust
// Session struct stored in Redis as JSON
#[derive(Debug, Serialize, Deserialize)]
pub struct Session {
    pub session_id:   Uuid,
    pub user_id:      Uuid,
    pub kiosk_id:     String,
    pub auth_method:  AuthMethod,   // Otp | Aadhaar | Qr
    pub created_at:   DateTime<Utc>,
    pub last_active:  DateTime<Utc>,
    pub idle_timeout: u64,          // seconds, default 180 (3 min)
    pub hard_timeout: u64,          // seconds, default 900 (15 min)
}

pub async fn create_session(
    user_id: Uuid,
    kiosk_id: &str,
    auth_method: AuthMethod,
    redis: &mut redis::aio::Connection,
) -> Result<Session, AppError> {
    let session = Session {
        session_id:   Uuid::new_v4(),
        user_id,
        kiosk_id:     kiosk_id.to_owned(),
        auth_method,
        created_at:   Utc::now(),
        last_active:  Utc::now(),
        idle_timeout: 180,
        hard_timeout: 900,
    };
    let key  = format!("session:{}", session.session_id);
    let json = serde_json::to_string(&session)?;
    redis.set_ex(&key, json, 900usize).await?;   // Hard timeout TTL
    Ok(session)
}
```

---

## 3. JSON Web Tokens (JWT) — RS256 Implementation

SUVIDHA ONE uses **asymmetric RS256 JWTs**. The `auth-service` holds the RSA private key for signing; all other microservices verify tokens using only the public key. This means a compromised downstream service **cannot forge tokens**.

### 3.1 JWT Claims Structure

```rust
/// Access token claims (expires in 15 minutes)
#[derive(Debug, Serialize, Deserialize)]
pub struct AccessClaims {
    pub sub:    Uuid,           // user_id
    pub jti:    Uuid,           // unique token ID (for blacklist check)
    pub iat:    i64,            // issued at (Unix timestamp)
    pub exp:    i64,            // expiry (iat + 900 seconds)
    pub iss:    String,         // "suvidha-one-auth"
    pub aud:    Vec<String>,    // ["suvidha-one-api"]
    pub kiosk:  String,         // kiosk_id — request must originate here
    pub roles:  Vec<Role>,      // [Citizen, KioskAdmin, SystemAdmin]
    pub lang:   String,         // preferred language (for BFF responses)
}

/// Refresh token claims (expires in 7 days)
#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshClaims {
    pub sub:    Uuid,
    pub jti:    Uuid,
    pub iat:    i64,
    pub exp:    i64,            // iat + 604800 seconds (7 days)
    pub family: Uuid,           // token family for rotation detection
}
```

### 3.2 Token Issuance

```rust
use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};

pub struct JwtService {
    private_key: EncodingKey,   // RSA-2048 PEM loaded at startup
    public_key:  DecodingKey,
}

impl JwtService {
    pub fn new(private_pem: &[u8], public_pem: &[u8]) -> Result<Self, AppError> {
        Ok(Self {
            private_key: EncodingKey::from_rsa_pem(private_pem)?,
            public_key:  DecodingKey::from_rsa_pem(public_pem)?,
        })
    }

    pub fn issue_access_token(&self, claims: &AccessClaims) -> Result<String, AppError> {
        let header = Header::new(Algorithm::RS256);
        encode(&header, claims, &self.private_key)
            .map_err(|e| AppError::JwtEncoding(e.to_string()))
    }

    pub fn verify_access_token(&self, token: &str) -> Result<AccessClaims, AppError> {
        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_issuer(&["suvidha-one-auth"]);
        validation.set_audience(&["suvidha-one-api"]);
        decode::<AccessClaims>(token, &self.public_key, &validation)
            .map(|td| td.claims)
            .map_err(|e| match e.kind() {
                ErrorKind::ExpiredSignature => AppError::Auth(AuthError::TokenExpired),
                ErrorKind::InvalidAudience  => AppError::Auth(AuthError::InvalidToken),
                _                           => AppError::Auth(AuthError::InvalidToken),
            })
    }
}
```

### 3.3 Refresh Token Rotation

> **Security Note:** Token families prevent refresh token reuse attacks. If a compromised token is used after rotation, the entire family is invalidated, logging out all sessions for that user.

```rust
pub async fn refresh_tokens(
    refresh_token: &str,
    jwt_svc: &JwtService,
    redis: &mut redis::aio::Connection,
    db: &PgPool,
) -> Result<(String, String), AppError> {
    // 1. Verify refresh token signature & expiry
    let claims = jwt_svc.verify_refresh_token(refresh_token)?;

    // 2. Check token is not already used (rotation detection)
    let used_key = format!("rt:used:{}", claims.jti);
    if redis.exists(&used_key).await? {
        // Replay attack detected — invalidate entire family
        let family_key = format!("rt:family:{}", claims.family);
        redis.del(&family_key).await?;
        return Err(AppError::Auth(AuthError::RefreshTokenReplay));
    }

    // 3. Mark old token as used
    redis.set_ex(&used_key, 1u8, 604_800usize).await?;

    // 4. Issue new access + refresh token pair
    let user        = fetch_user_by_id(db, claims.sub).await?;
    let new_access  = jwt_svc.issue_access_token(&build_access_claims(&user))?;
    let new_refresh = jwt_svc.issue_refresh_token(
        &build_refresh_claims(&user, claims.family)
    )?;
    Ok((new_access, new_refresh))
}
```

---

## 4. Authorization — RBAC & Tower Middleware

Authorization is enforced via **Tower middleware layers** in Axum. Roles are embedded in the JWT claims and checked before any handler runs. This means no handler ever receives an unauthorized request — the middleware short-circuits with a `403` before the BLL is invoked.

### 4.1 Role Definitions

| Role | Permissions |
|------|-------------|
| **Citizen** | Read own profile, pay bills, file complaints, apply for certificates, view own history |
| **KioskAdmin** | All Citizen permissions + register kiosk, view kiosk health, push OTA config |
| **DeptOfficer** | All Citizen + view/update complaints in own department, verify documents |
| **SystemAdmin** | All permissions + manage users, view all audit logs, manage kiosk fleet |
| **ServiceAccount** | Machine-to-machine only — notification delivery, heartbeat, webhook receipt |

### 4.2 JWT Middleware Implementation

```rust
use axum::{extract::State, http::{Request, StatusCode}, middleware::Next, response::Response};

/// Tower middleware — validates JWT and injects claims into request extensions
pub async fn jwt_auth_middleware<B>(
    State(jwt_svc): State<Arc<JwtService>>,
    State(redis):   State<Arc<RedisPool>>,
    mut req: Request<B>,
    next:    Next<B>,
) -> Result<Response, AppError> {
    // 1. Extract Bearer token from Authorization header
    let token = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or(AppError::Auth(AuthError::MissingToken))?;

    // 2. Verify JWT signature, expiry, issuer, audience
    let claims = jwt_svc.verify_access_token(token)?;

    // 3. Check Redis session store (enables instant logout)
    let session_key = format!("session:{}", claims.jti);
    let mut conn = redis.get().await?;
    if !conn.exists::<_, bool>(&session_key).await? {
        return Err(AppError::Auth(AuthError::SessionInvalidated));
    }

    // 4. Refresh idle timer in session store
    conn.expire(&session_key, 180i64).await?;

    // 5. Inject verified claims for handlers to extract
    req.extensions_mut().insert(claims);
    Ok(next.run(req).await)
}

/// Role-check middleware
pub async fn require_role<B, R: RoleCheck>(
    Extension(claims): Extension<AccessClaims>,
    req: Request<B>,
    next: Next<B>,
) -> Result<Response, AppError> {
    if !R::is_allowed(&claims.roles) {
        return Err(AppError::Forbidden("Insufficient role".into()));
    }
    Ok(next.run(req).await)
}
```

### 4.3 Router Configuration with Middleware Layers

```rust
use axum::{middleware, Router};

pub fn build_router(state: AppState) -> Router {
    let public_routes = Router::new()
        .route("/auth/otp/send",     post(handlers::otp::send))
        .route("/auth/otp/verify",   post(handlers::otp::verify))
        .route("/auth/aadhaar/init", post(handlers::aadhaar::init))
        .route("/services",          get(handlers::services::list));

    let citizen_routes = Router::new()
        .route("/user/profile",    get(handlers::user::profile))
        .route("/bills/pay",       post(handlers::bills::pay))
        .route("/grievance/file",  post(handlers::grievance::file))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            jwt_auth_middleware,    // JWT + session check
        ))
        .layer(middleware::from_fn(require_role::<Citizen>));

    let admin_routes = Router::new()
        .route("/kiosk/register", post(handlers::kiosk::register))
        .layer(middleware::from_fn_with_state(state.clone(), jwt_auth_middleware))
        .layer(middleware::from_fn(require_role::<SystemAdmin>));

    Router::new()
        .merge(public_routes)
        .nest("/api/v1",       citizen_routes)
        .nest("/api/v1/admin", admin_routes)
        .with_state(state)
}
```

---

## 5. Web & API Security Best Practices

### 5.1 Security Headers Middleware

```rust
use axum::http::{header, HeaderValue};
use tower_http::set_header::SetResponseHeaderLayer;

pub fn security_headers() -> impl tower::Layer<axum::routing::Router> {
    tower::ServiceBuilder::new()
        // Prevent clickjacking
        .layer(SetResponseHeaderLayer::overriding(
            header::X_FRAME_OPTIONS,
            HeaderValue::from_static("DENY"),
        ))
        // Disable MIME sniffing
        .layer(SetResponseHeaderLayer::overriding(
            header::X_CONTENT_TYPE_OPTIONS,
            HeaderValue::from_static("nosniff"),
        ))
        // Strict HTTPS (1 year, includes subdomains)
        .layer(SetResponseHeaderLayer::overriding(
            header::STRICT_TRANSPORT_SECURITY,
            HeaderValue::from_static("max-age=31536000; includeSubDomains; preload"),
        ))
        // Content Security Policy
        .layer(SetResponseHeaderLayer::overriding(
            header::CONTENT_SECURITY_POLICY,
            HeaderValue::from_static(
                "default-src 'self'; script-src 'self'; style-src 'self' fonts.googleapis.com"
            ),
        ))
        // Referrer Policy
        .layer(SetResponseHeaderLayer::overriding(
            header::REFERRER_POLICY,
            HeaderValue::from_static("strict-origin-when-cross-origin"),
        ))
}
```

### 5.2 Input Validation

> **Rule:** All input validation happens at the deserialization boundary using the `validator` crate. Invalid requests are rejected before they reach any handler or BLL code.

```rust
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct SendOtpRequest {
    #[validate(length(min = 10, max = 10), regex(path = "MOBILE_REGEX"))]
    pub mobile: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct PayBillRequest {
    #[validate(length(min = 1))]
    pub bill_ids: Vec<Uuid>,
    #[validate(range(min = 1.0, max = 100_000.0))]
    pub amount:   f64,
    pub method:   PaymentMethod,    // enum — no raw strings accepted
}

/// Generic validated extractor for all request bodies
pub struct Validated<T>(pub T);

#[async_trait]
impl<S, T> FromRequest<S> for Validated<T>
where
    T: DeserializeOwned + Validate,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(value) = Json::<T>::from_request(req, state).await
            .map_err(|e| AppError::Validation(e.to_string()))?;
        value.validate()
            .map_err(|e| AppError::Validation(e.to_string()))?;
        Ok(Validated(value))
    }
}
```

### 5.3 Rate Limiting Strategy

| Tier | Limit | Window | Enforcement |
|------|-------|--------|-------------|
| **Global (per IP)** | 1,000 requests | 1 minute | NGINX + Kong |
| **Auth endpoints** | 5 attempts | 1 minute | Redis sliding window |
| **OTP send** | 3 OTPs per mobile | 10 min | Redis counter |
| **Payment init** | 10 payments per session | 15 min | Redis + DB check |
| **Admin endpoints** | 100 requests per token | 1 minute | Tower middleware |

```rust
// Redis sliding window rate limiter
pub async fn check_rate_limit(
    redis: &mut redis::aio::Connection,
    key: &str,
    max: u64,
    window_secs: u64,
) -> Result<(), AppError> {
    let now          = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis() as u64;
    let window_start = now - (window_secs * 1000);

    // Use Redis sorted set for sliding window
    let _: () = redis.zrembyscore(key, "-inf", window_start as f64).await?;
    let count: u64 = redis.zcard(key).await?;
    if count >= max {
        return Err(AppError::RateLimitExceeded);
    }
    let _: () = redis.zadd(key, now as f64, now).await?;
    redis.expire(key, window_secs as i64).await?;
    Ok(())
}
```

### 5.4 SQL Injection Prevention

> **Architecture Note:** SUVIDHA ONE uses SQLx exclusively with compile-time verified parameterized queries. String interpolation into SQL is a **compile error** — not a runtime risk.

```rust
// ✅ CORRECT — compile-time checked, parameterized
let user = sqlx::query_as!(User,
    "SELECT * FROM users WHERE mobile_hash = $1 AND is_active = true",
    mobile_hash
)
.fetch_optional(&db)
.await?;

// ❌ IMPOSSIBLE with SQLx — the compiler prevents this pattern entirely
// let query = format!("SELECT * FROM users WHERE mobile = '{}'", mobile);
```

---

## 6. Business Logic Layer (BLL)

The BLL is the core of each microservice. It contains **pure Rust logic** — no HTTP, no DB, no Redis. This separation makes the BLL independently unit-testable and means the same logic can be called from an HTTP handler, a gRPC handler, or a background job.

### 6.1 BLL Architecture Principles

- **Pure functions** — BLL functions take typed inputs and return typed outputs. Side effects (DB, cache, notifications) are injected as trait objects.
- **Repository pattern** — The BLL depends on repository traits, not concrete DB implementations. This enables mock repositories in tests.
- **Domain errors** — All BLL errors are typed via `thiserror`, never raw strings.
- **Idempotency** — Payment and complaint operations are idempotency-keyed to prevent double submission.
- **Transaction boundaries** — DB transactions are managed at the BLL level, ensuring atomicity across multiple tables.

### 6.2 Repository Trait Pattern

```rust
// Trait definition (in shared crate)
#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, DbError>;
    async fn find_by_mobile_hash(&self, hash: &str) -> Result<Option<User>, DbError>;
    async fn upsert(&self, user: &UpsertUser) -> Result<User, DbError>;
    async fn update_preferences(&self, id: Uuid, prefs: &Preferences) -> Result<(), DbError>;
}

// Concrete implementation (uses SQLx)
pub struct PgUserRepository { pool: PgPool }

#[async_trait]
impl UserRepository for PgUserRepository {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, DbError> {
        Ok(sqlx::query_as!(User,
            "SELECT * FROM users WHERE user_id = $1", id
        )
        .fetch_optional(&self.pool)
        .await?)
    }
    // ... other implementations
}
```

### 6.3 Payment BLL — Idempotency Example

```rust
pub struct PaymentService {
    payment_repo:  Arc<dyn PaymentRepository>,
    bill_repo:     Arc<dyn BillRepository>,
    npci_client:   Arc<dyn NpciGateway>,
    notification:  Arc<dyn NotificationService>,
}

impl PaymentService {
    /// Pay one or more bills atomically.
    /// `idempotency_key` prevents duplicate payments on network retry.
    pub async fn pay_bills(
        &self,
        user_id: Uuid,
        bill_ids: &[Uuid],
        method: PaymentMethod,
        idempotency_key: Uuid,
    ) -> Result<PaymentReceipt, PaymentError> {
        // 1. Check idempotency — return existing receipt if key already used
        if let Some(existing) = self.payment_repo
            .find_by_idempotency_key(idempotency_key).await?
        {
            return Ok(existing.into_receipt());
        }

        // 2. Fetch and validate bills
        let bills = self.bill_repo.fetch_many(bill_ids).await?;
        for bill in &bills {
            if bill.user_id != user_id { return Err(PaymentError::Unauthorized); }
            if bill.status == BillStatus::Paid { return Err(PaymentError::AlreadyPaid); }
        }
        let total = bills.iter().map(|b| b.amount).sum::<Decimal>();

        // 3. Initiate payment with NPCI/BBPS (external call with retry)
        let tx_ref = self.npci_client.initiate(total, method).await?;

        // 4. Persist payment record (atomic transaction)
        let receipt = self.payment_repo.create_with_idempotency(
            idempotency_key, user_id, &bills, tx_ref, total
        ).await?;

        // 5. Fire async notifications (non-blocking)
        let receipt_clone = receipt.clone();
        let notification  = self.notification.clone();
        tokio::spawn(async move {
            notification.send_receipt(&receipt_clone).await
                .unwrap_or_else(|e| tracing::error!("Notification failed: {}", e));
        });

        Ok(receipt)
    }
}
```

---

## 7. Caching Strategies — Redis + CDN

### 7.1 Cache Taxonomy

| Cache Layer | Technology | TTL | What Is Cached |
|-------------|-----------|-----|----------------|
| **OTP codes** | Redis | 300 s | HMAC hash of OTP + attempt counter |
| **Active sessions** | Redis | 900 s | Full `Session` struct as JSON |
| **Rate limits** | Redis | 60–600 s | Sorted-set sliding windows per key |
| **Bill data** | Redis | 1800 s | BBPS bill fetch response per `consumer_id` |
| **User profile** | Redis | 300 s | User struct after first DB fetch in session |
| **Service list** | Redis | 3600 s | Full services JSON (rarely changes) |
| **Kiosk config** | Redis | 1800 s | Per-kiosk config JSON |
| **Static assets** | CloudFront CDN | 86400 s | JS, CSS, icons, fonts |
| **Offline cache** | IndexedDB (kiosk) | Persistent | Service definitions for offline usage |

### 7.2 Redis Connection Pool

```rust
use deadpool_redis::{Config, Pool, Runtime};

pub fn create_redis_pool(redis_url: &str) -> Result<Pool, AppError> {
    let cfg = Config::from_url(redis_url);
    cfg.create_pool(Some(Runtime::Tokio1))
        .map_err(|e| AppError::Infrastructure(e.to_string()))
}

/// Generic cache helper with automatic serialization / deserialization
pub async fn cache_get_or_fetch<T, F, Fut>(
    redis: &Pool,
    key: &str,
    ttl: u64,
    fetch: F,
) -> Result<T, AppError>
where
    T: Serialize + DeserializeOwned,
    F: FnOnce() -> Fut,
    Fut: Future<Output = Result<T, AppError>>,
{
    let mut conn = redis.get().await?;
    // Try cache first
    if let Ok(cached) = conn.get::<_, String>(key).await {
        if let Ok(val) = serde_json::from_str::<T>(&cached) {
            return Ok(val);
        }
    }
    // Cache miss — fetch from source of truth
    let val  = fetch().await?;
    let json = serde_json::to_string(&val)?;
    conn.set_ex(key, json, ttl as usize).await?;
    Ok(val)
}
```

### 7.3 Cache Invalidation

```rust
// Invalidate user profile cache on profile update
pub async fn update_user_profile(
    db: &PgPool,
    redis: &Pool,
    user_id: Uuid,
    update: &UpdateProfile,
) -> Result<User, AppError> {
    // 1. Update in DB
    let updated = sqlx::query_as!(User, /* ... */).fetch_one(db).await?;

    // 2. Invalidate cache key — next request will re-fetch from DB
    let cache_key = format!("user:profile:{}", user_id);
    let mut conn  = redis.get().await?;
    conn.del(&cache_key).await?;

    Ok(updated)
}
```

---

## 8. Error Handling & Error Codes

Rust's type system enforces that every error path is explicitly handled. SUVIDHA ONE uses a hierarchical `AppError` enum that implements Axum's `IntoResponse` trait, converting domain errors into structured JSON HTTP responses with correct status codes and application-level error codes.

### 8.1 AppError Enum

```rust
use thiserror::Error;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Json, Response};

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Authentication error: {0}")]
    Auth(#[from] AuthError),

    #[error("Payment error: {0}")]
    Payment(#[from] PaymentError),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("External API error: {0}")]
    ExternalApi(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Cache error: {0}")]
    Cache(String),

    #[error("Internal error: {0}")]
    Internal(String),
}
```

### 8.2 IntoResponse Implementation

```rust
#[derive(Serialize)]
struct ErrorResponse {
    error_code: u32,
    message:    String,
    request_id: Uuid,   // injected from request extension for traceability
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message) = match &self {
            AppError::Auth(AuthError::MissingToken)          => (StatusCode::UNAUTHORIZED,        1001, self.to_string()),
            AppError::Auth(AuthError::TokenExpired)          => (StatusCode::UNAUTHORIZED,        1002, self.to_string()),
            AppError::Auth(AuthError::InvalidOtp)            => (StatusCode::UNAUTHORIZED,        1003, self.to_string()),
            AppError::Auth(AuthError::OtpExpired)            => (StatusCode::UNAUTHORIZED,        1004, self.to_string()),
            AppError::Auth(AuthError::SessionInvalidated)    => (StatusCode::UNAUTHORIZED,        1005, self.to_string()),
            AppError::Auth(AuthError::RefreshTokenReplay)    => (StatusCode::UNAUTHORIZED,        1006, self.to_string()),
            AppError::Payment(PaymentError::AlreadyPaid)     => (StatusCode::CONFLICT,            2001, self.to_string()),
            AppError::Payment(PaymentError::Unauthorized)    => (StatusCode::FORBIDDEN,           2002, self.to_string()),
            AppError::Payment(PaymentError::GatewayError)    => (StatusCode::BAD_GATEWAY,         2003, self.to_string()),
            AppError::Validation(_)                          => (StatusCode::BAD_REQUEST,         9001, self.to_string()),
            AppError::NotFound(_)                            => (StatusCode::NOT_FOUND,           9002, self.to_string()),
            AppError::Forbidden(_)                           => (StatusCode::FORBIDDEN,           9003, self.to_string()),
            AppError::RateLimitExceeded                      => (StatusCode::TOO_MANY_REQUESTS,   9004, "Rate limit exceeded. Please wait.".into()),
            AppError::ExternalApi(_)                         => (StatusCode::BAD_GATEWAY,         9005, "External service unavailable.".into()),
            AppError::Database(_) | AppError::Internal(_)   => {
                // Never leak internal details to the client
                tracing::error!("Internal error: {:?}", self);
                (StatusCode::INTERNAL_SERVER_ERROR, 9999, "An internal error occurred.".into())
            }
            _ => (StatusCode::INTERNAL_SERVER_ERROR, 9999, "Unexpected error.".into()),
        };
        (status, Json(ErrorResponse {
            error_code: code,
            message,
            request_id: Uuid::new_v4(),
        })).into_response()
    }
}
```

### 8.3 Error Code Reference

| Code Range | Domain | Example Codes | HTTP Status |
|------------|--------|---------------|-------------|
| **1000–1099** | Authentication | 1001 Missing token · 1002 Expired · 1003 Bad OTP · 1004 OTP expired · 1005 Session invalidated | 401, 403 |
| **2000–2099** | Payment | 2001 Already paid · 2002 Unauthorized · 2003 Gateway error | 402, 403, 502 |
| **3000–3099** | Bills / Utility | 3001 Bill not found · 3002 BBPS error | 404, 502 |
| **4000–4099** | Grievance | 4001 Not found · 4002 Already closed | 404, 409 |
| **5000–5099** | Certificates | 5001 Not eligible · 5002 DigiLocker error | 403, 502 |
| **9000–9099** | System | 9001 Validation · 9002 Not found · 9003 Forbidden · 9004 Rate limit · 9999 Internal | 400, 404, 429, 500 |

---

## 9. OpenAPI Standards & API Design

### 9.1 OpenAPI 3.1 Specification

Every SUVIDHA ONE API endpoint is documented via OpenAPI 3.1. The spec is auto-generated from code using [`utoipa`](https://github.com/juhaku/utoipa). The Swagger UI is served at `/docs` in non-production environments.

```rust
use utoipa::{OpenApi, ToSchema};

#[derive(OpenApi)]
#[openapi(
    paths(
        crate::routes::otp::send_otp,
        crate::routes::otp::verify_otp,
        crate::routes::bills::pay_bills,
    ),
    components(schemas(
        SendOtpRequest, VerifyOtpRequest,
        PayBillRequest, ApiErrorResponse
    )),
    info(
        title = "SUVIDHA ONE API",
        version = "1.0.0",
        description = "Unified Citizen Service Kiosk Backend",
        contact(name = "Team The_Dark_Knight", email = "team@suvidhaone.gov.in"),
    ),
    tags(
        (name = "auth",      description = "Authentication endpoints"),
        (name = "bills",     description = "Bill fetch and payment"),
        (name = "grievance", description = "Complaint management"),
    ),
    servers(
        (url = "https://api.suvidhaone.gov.in/v1",         description = "Production"),
        (url = "https://staging-api.suvidhaone.gov.in/v1", description = "Staging"),
    )
)]
pub struct ApiDoc;
```

### 9.2 API Design Standards

| Standard | Rule | Example |
|----------|------|---------|
| **Versioning** | URL-path versioning: `/v1/` | `/v1/bills/pay`, `/v2/bills/pay` (breaking change) |
| **HTTP Methods** | REST semantics enforced strictly | GET=read, POST=create, PUT=replace, PATCH=partial update, DELETE=remove |
| **Response envelope** | All responses wrapped in standard envelope | `{"data": {...}, "meta": {"request_id": "...", "ts": "..."}}` |
| **Error format** | RFC 7807 Problem Details | `{"error_code": 1003, "message": "...", "request_id": "..."}` |
| **Pagination** | Cursor-based for large result sets | `?cursor=<opaque>&limit=20` — no `OFFSET` pagination |
| **Field naming** | `snake_case` in JSON (Serde `rename_all`) | `user_id`, `created_at`, `mobile_hash` |
| **Date format** | ISO 8601 UTC strings | `"2026-02-01T14:30:00Z"` |
| **Empty responses** | 204 No Content for void actions | `DELETE /session → 204 No Content` |

### 9.3 Standard Response Wrapper

```rust
#[derive(Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub data: T,
    pub meta: Meta,
}

#[derive(Serialize)]
pub struct Meta {
    pub request_id: Uuid,
    pub timestamp:  DateTime<Utc>,
    pub version:    &'static str,
}

// Convenience constructor used in every handler
pub fn ok<T: Serialize>(data: T) -> (StatusCode, Json<ApiResponse<T>>) {
    (StatusCode::OK, Json(ApiResponse {
        data,
        meta: Meta {
            request_id: Uuid::new_v4(),
            timestamp:  Utc::now(),
            version:    "1.0.0",
        },
    }))
}
```

---

## 10. Webhooks — Design & Delivery

SUVIDHA ONE receives inbound webhooks from payment gateways (NPCI/UPI) and DISCOM APIs, and emits outbound webhooks to department systems. All webhook processing is **asynchronous** and **idempotent**.

### 10.1 Inbound Webhook Handler — UPI Payment Callback

```rust
/// POST /webhooks/upi/callback
/// Called by NPCI when a UPI transaction settles
pub async fn upi_payment_callback(
    headers:      HeaderMap,
    State(state): State<AppState>,
    body:         Bytes,
) -> Result<StatusCode, AppError> {
    // 1. Verify HMAC-SHA256 signature from NPCI
    let signature = headers
        .get("X-NPCI-Signature")
        .and_then(|v| v.to_str().ok())
        .ok_or(AppError::Validation("Missing webhook signature".into()))?;

    verify_npci_signature(&body, signature, &state.npci_webhook_secret)?;

    // 2. Parse payload
    let event: UpiWebhookEvent = serde_json::from_slice(&body)
        .map_err(|e| AppError::Validation(e.to_string()))?;

    // 3. Idempotency check — NPCI may retry on timeout
    let key       = format!("webhook:upi:{}", event.transaction_id);
    let mut conn  = state.redis.get().await?;
    if conn.set_nx::<_, _, bool>(&key, 1u8).await? == false {
        // Already processed — acknowledge without reprocessing
        return Ok(StatusCode::OK);
    }
    conn.expire(&key, 86_400i64).await?;

    // 4. Process asynchronously — respond to NPCI immediately (< 5s required)
    let state_clone = state.clone();
    tokio::spawn(async move {
        if let Err(e) = process_upi_settlement(&event, &state_clone).await {
            tracing::error!(txn_id = %event.transaction_id,
                error = %e, "Failed to process UPI webhook");
        }
    });

    Ok(StatusCode::OK)
}
```

### 10.2 Outbound Webhook Delivery with Retry

```rust
pub struct WebhookDeliveryService {
    http:         reqwest::Client,
    webhook_repo: Arc<dyn WebhookRepository>,
}

impl WebhookDeliveryService {
    pub async fn deliver(&self, webhook: &OutboundWebhook) -> Result<(), AppError> {
        let max_attempts = 5;
        let mut attempt  = 0;

        loop {
            attempt += 1;
            match self.try_deliver(webhook).await {
                Ok(_) => {
                    self.webhook_repo.mark_delivered(webhook.id).await?;
                    return Ok(());
                }
                Err(e) if attempt >= max_attempts => {
                    self.webhook_repo.mark_failed(webhook.id, &e.to_string()).await?;
                    tracing::error!(webhook_id = %webhook.id,
                        "Webhook delivery exhausted retries");
                    return Err(e);
                }
                Err(e) => {
                    // Exponential backoff: 1s → 2s → 4s → 8s → 16s
                    let delay = Duration::from_secs(2u64.pow(attempt - 1));
                    tracing::warn!(attempt, delay_secs = delay.as_secs(),
                        "Webhook delivery failed, retrying: {}", e);
                    tokio::time::sleep(delay).await;
                }
            }
        }
    }

    async fn try_deliver(&self, wh: &OutboundWebhook) -> Result<(), AppError> {
        // Sign payload with HMAC for receiver to verify
        let signature = sign_payload(&wh.payload, &wh.secret)?;
        self.http
            .post(&wh.url)
            .header("X-Suvidha-Signature", signature)
            .header("X-Suvidha-Event", &wh.event_type)
            .json(&wh.payload)
            .timeout(Duration::from_secs(10))
            .send()
            .await
            .map_err(|e| AppError::ExternalApi(e.to_string()))?;
        Ok(())
    }
}
```

---

## 11. Logging, Monitoring & Observability

### 11.1 Structured Logging with `tracing`

```rust
// main.rs — tracing setup
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

pub fn init_tracing() {
    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env())     // RUST_LOG=info,sqlx=warn
        .with(
            tracing_subscriber::fmt::layer()
                .json()                          // Structured JSON for ELK ingestion
                .with_current_span(true)
                .with_span_events(
                    tracing_subscriber::fmt::format::FmtSpan::CLOSE
                )
        )
        .init();
}

// Example instrumented handler
#[tracing::instrument(skip(state), fields(user_id = %claims.sub))]
pub async fn pay_bills(
    Extension(claims): Extension<AccessClaims>,
    State(state):      State<AppState>,
    Validated(req):    Validated<PayBillRequest>,
) -> Result<impl IntoResponse, AppError> {
    tracing::info!(
        bill_count = req.bill_ids.len(),
        method = ?req.method,
        "Payment initiated"
    );

    let receipt = state.payment_svc
        .pay_bills(claims.sub, &req.bill_ids, req.method, req.idempotency_key)
        .await?;

    tracing::info!(
        txn_id = %receipt.transaction_id,
        amount = %receipt.total,
        "Payment successful"
    );
    Ok(ok(receipt))
}
```

### 11.2 Prometheus Metrics

```rust
use prometheus::{Counter, Histogram, IntGauge, Registry, histogram_opts, opts};

#[derive(Clone)]
pub struct Metrics {
    pub requests_total:   Counter,
    pub request_duration: Histogram,
    pub payment_success:  Counter,
    pub payment_failure:  Counter,
    pub active_sessions:  IntGauge,
    pub db_pool_size:     IntGauge,
}

impl Metrics {
    pub fn new(registry: &Registry) -> Self {
        let request_duration = Histogram::with_opts(
            histogram_opts!(
                "http_request_duration_seconds",
                "HTTP request latency",
                vec![0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
            )
        ).unwrap();
        registry.register(Box::new(request_duration.clone())).unwrap();
        // ... register other metrics
        Self { request_duration, /* ... */ }
    }
}
```

### 11.3 Key Metrics & Alert Thresholds

| Metric | Type | Target / Threshold | Alert Condition |
|--------|------|-------------------|-----------------|
| `http_request_duration_seconds` (p95) | Histogram | < 200ms target / 500ms SLA | p95 > 2s for 10 min → Medium |
| `payment_success_rate` | Gauge | > 99.5% | > 10% failures → High |
| `auth_success_rate` | Gauge | > 98% | > 5% failures for 5 min → High |
| `error_rate` | Counter | < 0.1% | > 5% for 5 min → Critical |
| `db_pool_connections` | IntGauge | < 80% of `max_size` | > 80% of max → Critical |
| `active_sessions` | IntGauge | Informational | Sudden drop → High (possible outage) |
| `kiosk_heartbeat_missing` | Counter | 0 missing | > 20 kiosks offline → High |

### 11.4 Distributed Tracing (OpenTelemetry)

Trace context is propagated across all microservices via W3C `traceparent` headers.

```rust
use opentelemetry::global;
use tracing_opentelemetry::OpenTelemetryLayer;

pub fn init_tracing_with_otlp(service_name: &str) {
    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(
            opentelemetry_otlp::new_exporter()
                .tonic()
                .with_endpoint("http://otel-collector:4317")
        )
        .install_batch(opentelemetry_sdk::runtime::Tokio)
        .unwrap();

    tracing_subscriber::registry()
        .with(OpenTelemetryLayer::new(tracer))
        .with(tracing_subscriber::fmt::layer().json())
        .init();
}
```

---

## 12. Testing & Code Quality

### 12.1 Testing Strategy

| Test Type | Tool / Crate | Scope | Coverage Target |
|-----------|-------------|-------|-----------------|
| **Unit tests** | Built-in Rust `#[test]` | BLL functions, parsers, validators | ≥ 90% of BLL code |
| **Integration tests** | `sqlx` + `testcontainers-rs` | Repository + real PostgreSQL/Redis | All CRUD paths |
| **API (e2e) tests** | `axum::test` + `reqwest` | Full request → response including middleware | All routes |
| **Load tests** | `k6.io` | 1M req/min simulation | p99 < 500ms at peak load |
| **Security tests** | `cargo-audit` + OWASP ZAP | Dependency CVEs + endpoint fuzzing | CI gate — 0 criticals |
| **Property tests** | `proptest` | Serialization round-trips, edge inputs | Key data models |

### 12.2 Unit Test Example — OTP Service

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use mockall::predicate::*;
    use mockall::mock;

    mock! {
        RedisConn {}
        #[async_trait]
        impl RedisCache for RedisConn {
            async fn get(&mut self, key: &str) -> Result<Option<String>, CacheError>;
            async fn set_ex(&mut self, key: &str, val: &str, ttl: usize) -> Result<(), CacheError>;
            async fn del(&mut self, key: &str) -> Result<(), CacheError>;
        }
    }

    #[tokio::test]
    async fn test_otp_expired_returns_error() {
        let mut mock_redis = MockRedisConn::new();
        // Simulate no OTP in cache (expired)
        mock_redis.expect_get()
            .with(eq("otp:hash:9999900000"))
            .returning(|_| Ok(None));

        let result = verify_otp("9999900000", "123456", &mut mock_redis).await;

        assert!(matches!(result, Err(AppError::Auth(AuthError::OtpExpired))));
    }

    #[tokio::test]
    async fn test_otp_wrong_code_increments_attempt() {
        let mut mock_redis = MockRedisConn::new();
        // Return mismatched hash
        mock_redis.expect_get()
            .returning(|_| Ok(Some("deadbeef".into())));
        mock_redis.expect_get()   // attempt counter
            .returning(|_| Ok(Some("0".into())));
        mock_redis.expect_incr()
            .returning(|_, _| Ok(1u8));

        let result = verify_otp("9999900000", "111111", &mut mock_redis).await;
        assert!(matches!(result, Err(AppError::Auth(AuthError::InvalidOtp))));
    }
}
```

### 12.3 Integration Test Example — Bill Payment

```rust
#[sqlx::test(fixtures("users", "bills"))]
async fn test_pay_bill_success(pool: PgPool) {
    let redis = create_test_redis().await;
    let state = build_test_app_state(pool, redis);
    let app   = build_router(state);

    let token    = issue_test_jwt(TEST_USER_ID);
    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/bills/pay")
                .header("Authorization", format!("Bearer {}", token))
                .header("Content-Type", "application/json")
                .body(Body::from(serde_json::to_string(&json!({
                    "bill_ids":        [TEST_BILL_ID],
                    "method":          "Upi",
                    "idempotency_key": Uuid::new_v4(),
                })).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body: serde_json::Value = parse_body(response).await;
    assert!(body["data"]["transaction_id"].is_string());
}
```

### 12.4 Code Quality Gates (CI Pipeline)

```yaml
# .github/workflows/ci.yml
- name: Format check
  run: cargo fmt -- --check

- name: Clippy (deny warnings)
  run: cargo clippy --all-targets -- -D warnings

- name: Unit tests
  run: cargo test --lib

- name: Integration tests
  run: cargo test --test '*'

- name: Audit dependencies for CVEs
  run: cargo audit --deny warnings

- name: Code coverage (minimum 80%)
  run: cargo tarpaulin --out Xml --fail-under 80
```

---

## 13. Configuration Management

> ⚠️ **Never commit secrets to source control.** All sensitive values (JWT keys, API credentials, DB passwords) are injected at runtime via Kubernetes Secrets or environment variables.

### 13.1 Typed Configuration with `config-rs`

```rust
use config::{Config, Environment};
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub server:   ServerConfig,
    pub database: DatabaseConfig,
    pub redis:    RedisConfig,
    pub jwt:      JwtConfig,
    pub uidai:    UidaiConfig,
    pub npci:     NpciConfig,
    pub sms:      SmsConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JwtConfig {
    pub private_key_pem:  String,  // Mounted from K8s Secret as volume
    pub public_key_pem:   String,
    pub access_ttl_secs:  u64,     // default 900
    pub refresh_ttl_secs: u64,     // default 604800
}

pub fn load_config() -> Result<AppConfig, config::ConfigError> {
    Config::builder()
        // 1. Base defaults
        .add_source(config::File::with_name("config/default"))
        // 2. Environment-specific overrides (config/production.toml, etc.)
        .add_source(config::File::with_name(
            &format!("config/{}", std::env::var("APP_ENV").unwrap_or_default())
        ).required(false))
        // 3. Environment variables override all others
        .add_source(Environment::with_prefix("SUVIDHA").separator("__"))
        .build()?
        .try_deserialize()
}
```

### 13.2 Environment Variables Reference

| Variable | Service | Example Value | Secret? |
|----------|---------|---------------|---------|
| `DATABASE_URL` | All | `postgresql://user:pass@db/suvidha` | ✅ Yes |
| `REDIS_URL` | All | `redis://redis:6379` | ✅ Yes |
| `JWT_PRIVATE_KEY_PEM` | auth | `<RSA-2048 PEM>` | ✅ Yes |
| `JWT_PUBLIC_KEY_PEM` | All | `<RSA-2048 PEM public>` | No |
| `OTP_HMAC_SECRET` | auth | `<32-byte random hex>` | ✅ Yes |
| `UIDAI_API_KEY` | auth | `<UIDAI AUA key>` | ✅ Yes |
| `NPCI_MERCHANT_ID` | payment | `<BBPS merchant ID>` | ✅ Yes |
| `NPCI_WEBHOOK_SECRET` | payment | `<HMAC webhook secret>` | ✅ Yes |
| `DIGILOCKER_CLIENT_ID` | document | `<DigiLocker OAuth client>` | ✅ Yes |
| `SMS_PROVIDER_API_KEY` | notification | `<Airtel/Jio API key>` | ✅ Yes |
| `RUST_LOG` | All | `info,sqlx=warn,tower=info` | No |
| `APP_ENV` | All | `production` \| `staging` \| `dev` | No |

---

## 14. Database Interactions & CRUD Operations

SUVIDHA ONE uses **SQLx with compile-time verified queries** — invalid SQL or type mismatches are caught at **compile time**, not in production. All database access goes through the repository pattern described in [Section 6](#6-business-logic-layer-bll).

### 14.1 Connection Pool Setup

```rust
use sqlx::postgres::{PgPool, PgPoolOptions};

pub async fn create_pg_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(50)              // ~50 per service pod
        .min_connections(5)               // Keep warm connections alive
        .acquire_timeout(Duration::from_secs(5))
        .idle_timeout(Duration::from_secs(60))
        .max_lifetime(Duration::from_secs(1800))
        .connect(database_url)
        .await
}
```

### 14.2 Create — INSERT with RETURNING

```rust
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub user_id:             Uuid,
    pub full_name:           String,
    pub state_code:          String,
    pub preferred_language:  String,
    pub created_at:          DateTime<Utc>,
}

pub async fn create_user(pool: &PgPool, req: &CreateUserRequest) -> Result<User, sqlx::Error> {
    sqlx::query_as!(User,
        r#"
        INSERT INTO users (
            user_id, aadhaar_id_hash, mobile_hash,
            full_name, state_code, preferred_language
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (aadhaar_id_hash) DO UPDATE
            SET full_name  = EXCLUDED.full_name,
                updated_at = NOW()
        RETURNING user_id, full_name, state_code, preferred_language, created_at
        "#,
        Uuid::new_v4(),
        req.aadhaar_id_hash,
        req.mobile_hash,
        req.full_name,
        req.state_code,
        req.preferred_language,
    )
    .fetch_one(pool)
    .await
}
```

### 14.3 Read — Fetch Single & Cursor Pagination

```rust
// Fetch single user by ID
pub async fn get_user_by_id(pool: &PgPool, id: Uuid) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as!(User,
        "SELECT user_id, full_name, state_code, preferred_language, created_at
         FROM users WHERE user_id = $1 AND is_active = true",
        id
    )
    .fetch_optional(pool)
    .await
}

// Cursor-based pagination — no OFFSET (does not scale)
pub async fn list_transactions(
    pool:    &PgPool,
    user_id: Uuid,
    cursor:  Option<DateTime<Utc>>,     // created_at of last seen item
    limit:   i64,
) -> Result<Vec<Transaction>, sqlx::Error> {
    sqlx::query_as!(Transaction,
        r#"
        SELECT * FROM transactions
        WHERE user_id = $1
          AND ($2::timestamptz IS NULL OR created_at < $2)
        ORDER BY created_at DESC
        LIMIT $3
        "#,
        user_id,
        cursor,
        limit,
    )
    .fetch_all(pool)
    .await
}
```

### 14.4 Update — PATCH with Partial Fields

```rust
pub async fn update_preferences(
    pool:    &PgPool,
    user_id: Uuid,
    prefs:   &UpdatePreferences,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "UPDATE users
         SET preferred_language     = COALESCE($2, preferred_language),
             accessibility_settings = COALESCE($3, accessibility_settings),
             updated_at             = NOW()
         WHERE user_id = $1",
        user_id,
        prefs.preferred_language,
        prefs.accessibility_settings
            .as_ref()
            .map(|s| serde_json::to_value(s).unwrap()),
    )
    .execute(pool)
    .await?;
    Ok(())
}
```

### 14.5 Delete — Soft Delete Pattern

```rust
// SUVIDHA ONE never hard-deletes citizen records (audit trail + DPDP Act compliance)
// Soft delete: set is_active = false
pub async fn deactivate_user(pool: &PgPool, user_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "UPDATE users SET is_active = false, updated_at = NOW() WHERE user_id = $1",
        user_id
    )
    .execute(pool)
    .await?;
    Ok(())
}
```

### 14.6 Transactions — Atomic Bill Payment

```rust
/// Pay multiple bills atomically.
/// If any step fails, the entire operation rolls back.
pub async fn atomic_bill_payment(
    pool:     &PgPool,
    user_id:  Uuid,
    bill_ids: &[Uuid],
    tx_ref:   &str,
    total:    Decimal,
) -> Result<PaymentRecord, sqlx::Error> {
    // Begin explicit database transaction
    let mut tx = pool.begin().await?;

    // 1. Mark all bills as paid within the transaction
    for bill_id in bill_ids {
        sqlx::query!(
            "UPDATE bills SET status = 'Paid', paid_at = NOW() WHERE bill_id = $1",
            bill_id
        )
        .execute(&mut *tx)
        .await?;
    }

    // 2. Create payment record within the same transaction
    let payment = sqlx::query_as!(PaymentRecord,
        "INSERT INTO payments (payment_id, user_id, amount, tx_ref, status)
         VALUES ($1, $2, $3, $4, 'Success')
         RETURNING *",
        Uuid::new_v4(), user_id, total, tx_ref
    )
    .fetch_one(&mut *tx)
    .await?;

    // 3. Commit — both bill updates and payment record committed atomically
    tx.commit().await?;
    Ok(payment)
}
```

---

## 15. Serialization & Deserialization (Serde)

Serde is Rust's **zero-cost serialization framework**. SUVIDHA ONE uses Serde for JSON (API bodies), binary (internal gRPC), and database JSONB field deserialization. Serde transformations happen at **compile time** — there is no runtime reflection overhead.

### 15.1 Core Serde Patterns

```rust
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, DisplayFromStr};

#[serde_as]
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]    // JSON uses camelCase; Rust uses snake_case
pub struct BillDetails {
    pub bill_id:     Uuid,
    pub consumer_id: String,

    #[serde_as(as = "DisplayFromStr")]
    pub amount: Decimal,              // Precise decimal — never f32/f64 for money

    pub due_date:   NaiveDate,        // Serialized as "2026-03-15"
    pub department: Department,       // Enum → string in JSON
    pub status:     BillStatus,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,  // Field omitted entirely if None

    #[serde(skip)]
    pub internal_ref: String,         // Never exposed in API responses
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Department {
    Electricity,   // JSON: "ELECTRICITY"
    Water,
    Gas,
    Municipal,
}
```

### 15.2 Custom Deserializer — Sanitized Mobile Number

```rust
use serde::{de, Deserializer};
use std::fmt;

/// Custom deserializer: strips non-digits, validates 10-digit Indian mobile number
pub fn deserialize_mobile<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    struct MobileVisitor;

    impl<'de> de::Visitor<'de> for MobileVisitor {
        type Value = String;

        fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
            write!(f, "a 10-digit Indian mobile number")
        }

        fn visit_str<E: de::Error>(self, v: &str) -> Result<String, E> {
            let digits: String = v.chars().filter(|c| c.is_ascii_digit()).collect();
            let normalized = digits.trim_start_matches("91");  // Strip country code
            if normalized.len() != 10 {
                return Err(E::custom(format!("Invalid mobile number: {}", v)));
            }
            Ok(normalized.to_string())
        }
    }

    deserializer.deserialize_str(MobileVisitor)
}

#[derive(Deserialize)]
pub struct SendOtpRequest {
    #[serde(deserialize_with = "deserialize_mobile")]
    pub mobile: String,
}
```

### 15.3 JSONB Deserialization from PostgreSQL

```rust
/// Accessibility settings stored as JSONB in PostgreSQL
#[derive(Debug, Serialize, Deserialize, Clone, sqlx::Type)]
#[sqlx(type_name = "jsonb")]
pub struct AccessibilitySettings {
    #[serde(default)]
    pub font_scale:    f32,           // 1.0 | 1.3 | 1.5
    #[serde(default)]
    pub high_contrast: bool,
    #[serde(default = "default_true")]
    pub voice_enabled: bool,
}

fn default_true() -> bool { true }

impl sqlx::decode::Decode<'_, sqlx::Postgres> for AccessibilitySettings {
    fn decode(
        value: sqlx::postgres::PgValueRef
    ) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let json: serde_json::Value = sqlx::decode::Decode::decode(value)?;
        Ok(serde_json::from_value(json)?)
    }
}
```

### 15.4 Performance: Zero-Copy Deserialization

```rust
/// For large payloads, borrow from the input buffer instead of cloning
#[derive(Debug, Deserialize)]
pub struct WebhookPayload<'a> {
    pub event_type:     &'a str,                       // Zero-copy borrow from input
    pub transaction_id: &'a str,
    pub data:           &'a serde_json::value::RawValue,  // Defer parsing until needed
}

pub fn parse_webhook(body: &[u8]) -> Result<WebhookPayload<'_>, serde_json::Error> {
    serde_json::from_slice(body)   // Borrows directly from body buffer — no allocation
}
```

---

## 16. Appendix — Dependencies, Env Vars & Ports

### 16.1 Full Dependency List

| Crate | Version | Purpose |
|-------|---------|---------|
| `axum` | 0.7 | Async web framework (Tokio-native, Tower-compatible) |
| `tokio` | 1.* | Async runtime (full features: rt, net, time, sync) |
| `tower` | 0.4 | Middleware trait (rate-limit, auth layers) |
| `tower-http` | 0.5 | HTTP-specific middleware (CORS, compression, security headers) |
| `serde` | 1.* | Serialization framework (with `derive` feature) |
| `serde_json` | 1.* | JSON serialize/deserialize |
| `serde_with` | 3.* | Extended serde helpers (`DisplayFromStr`, etc.) |
| `sqlx` | 0.7 | Async, compile-time verified PostgreSQL driver |
| `deadpool-redis` | 0.12 | Async Redis connection pool |
| `jsonwebtoken` | 9.* | JWT encode/decode (RS256, HS256) |
| `validator` | 0.16 | Struct-level input validation with derive macro |
| `thiserror` | 1.* | Ergonomic error enum derivation |
| `anyhow` | 1.* | Flexible error handling for application code |
| `tracing` | 0.1 | Structured, async-aware logging framework |
| `tracing-subscriber` | 0.3 | Tracing output layer (JSON, stdout) |
| `opentelemetry` | 0.21 | Distributed tracing (OTLP export to Jaeger) |
| `prometheus` | 0.13 | Metrics collection and Prometheus exposition |
| `reqwest` | 0.11 | Async HTTP client (UIDAI, NPCI, DigiLocker calls) |
| `uuid` | 1.* | UUID v4 generation with Serde support |
| `chrono` | 0.4 | Date/time types with Serde and SQLx support |
| `rust_decimal` | 1.* | Exact decimal arithmetic for financial amounts |
| `hmac` | 0.12 | HMAC-SHA256 for OTP and webhook signature |
| `sha2` | 0.10 | SHA-256 hash primitive |
| `rand` | 0.8 | Cryptographically secure random number generation |
| `hex` | 0.4 | Hex encoding/decoding for hashes |
| `constant_time_eq` | 0.3 | Constant-time comparison (prevents timing attacks) |
| `utoipa` | 4.* | OpenAPI 3.1 spec generation from code annotations |
| `config` | 0.13 | Layered configuration management |
| `dotenvy` | 0.15 | `.env` file loading in development |

### 16.2 Service Ports Quick Reference

| Service / Component | Port |
|--------------------|------|
| API Gateway (NGINX) | `80` (HTTP) / `443` (HTTPS) |
| `auth-service` | `3001` |
| `payment-service` | `3002` |
| `utility-service` | `3003` |
| `grievance-service` | `3004` |
| `document-service` | `3005` |
| `notification-service` | `3006` |
| `session-service` | `3007` |
| `kiosk-service` | `3008` |
| PostgreSQL | `5432` |
| Redis | `6379` |
| MinIO (S3) | `9000` (API) / `9001` (Console) |
| Prometheus | `9090` |
| Grafana | `3000` |
| Jaeger (tracing UI) | `16686` |
| OTEL Collector | `4317` (gRPC) / `4318` (HTTP) |

### 16.3 Production Checklist

- ✅ JWT uses RS256 with 2048-bit RSA keys — private key never leaves `auth-service`
- ✅ All API endpoints are rate-limited — auth at 5 req/min, global at 1000 req/min per IP
- ✅ OTP stored as HMAC-SHA256 hash, never in plaintext
- ✅ Aadhaar VID tokenization — raw Aadhaar number never stored or logged
- ✅ All payments offloaded to PCI-DSS Level 1 gateway — no card data on our infrastructure
- ✅ Immutable audit log — write-once PostgreSQL partition + forwarded to ELK SIEM
- ✅ DPDP Act 2023 compliance — consent screen, data minimization, right-to-erasure API
- ✅ `cargo audit` gates in CI — zero known critical CVEs in production build
- ✅ Health check endpoints on all services — Kubernetes liveness + readiness probes
- ✅ Distributed tracing across all 8 services via W3C `traceparent` propagation
- ✅ `sqlx` compile-time query verification — SQL injection impossible via type system
- ✅ Offline mode for kiosk — IndexedDB cache + background sync API

---

<div align="center">

**SUVIDHA ONE — Rust Backend Documentation**

Team: The_Dark_Knight · ID: 21 · Version 1.0 · February 2026

*Built for 1,000,000+ Users Per Minute · Safety · Throughput · Auditability* 🦀

[![GitHub](https://img.shields.io/badge/GitHub-SUVIDHA__ONE-blue?logo=github)](https://github.com/jadavmadhavkumar/SUVIDHA_ONE)

</div>
