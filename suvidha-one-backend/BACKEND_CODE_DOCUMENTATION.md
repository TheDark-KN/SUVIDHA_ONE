# SUVIDHA ONE Backend - Code Documentation

## Overview

The SUVIDHA ONE backend is a high-performance, microservices-based Rust application built to handle 1,000,000+ authenticated requests per minute. It provides citizen services through a nationwide network of kiosk terminals.

## Architecture

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Rust | 1.75+ |
| Web Framework | Axum | 0.7 |
| Async Runtime | Tokio | 1.x |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7 |
| Authentication | JWT (RS256) | - |

### Service Topology

```
┌──────────────────────────────────────────────────────────────┐
│                    API Gateway (NGINX)                       │
│                    Port: 80/443                              │
└──────────────────────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ auth-service  │    │payment-service│    │utility-service│
│   Port:3001   │    │   Port:3002   │    │   Port:3003   │
└───────────────┘    └───────────────┘    └───────────────┘
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│grievance-svc │    │document-svc   │    │notification-sv│
│   Port:3004   │    │   Port:3005   │    │   Port:3006   │
└───────────────┘    └───────────────┘    └───────────────┘
        │                      │
        ▼                      ▼
┌───────────────┐    ┌───────────────┐
│session-service│    │ kiosk-service │
│   Port:3007   │    │   Port:3008   │
└───────────────┘    └───────────────┘
```

## Shared Crate (`shared/`)

The shared crate contains common functionality used across all microservices.

### Error Handling (`shared/src/error.rs`)

The backend uses a hierarchical error system:

```rust
pub enum AppError {
    Auth(AuthError),        // Authentication errors (1001-1099)
    Payment(PaymentError), // Payment errors (2001-2099)
    Validation(String),    // Input validation (9001)
    NotFound(String),      // Resource not found (9002)
    Forbidden(String),     // Authorization failure (9003)
    RateLimitExceeded,     // Rate limit (9004)
    ExternalApi(String),  // External API errors (9005)
    Database(sqlx::Error),// Database errors
    Cache(String),        // Redis errors (9006)
    Internal(String),     // Internal errors (9999)
}
```

**Error Code Reference:**
- 1000-1099: Authentication
- 2000-2099: Payment
- 3000-3099: Utility/Bills
- 4000-4099: Grievance
- 5000-5099: Documents
- 9000-9099: System

### JWT Service (`shared/src/jwt.rs`)

The JWT service implements RS256 asymmetric encryption:

```rust
pub struct JwtService {
    private_key: EncodingKey,  // RSA-2048 for signing
    public_key: DecodingKey,   // For verification
    issuer: String,
    audience: Vec<String>,
    access_ttl_secs: u64,      // 15 minutes
    refresh_ttl_secs: u64,     // 7 days
}

impl JwtService {
    // Issue new access token
    pub fn issue_access_token(&self, user_id, kiosk_id, roles, lang) -> Result<String, JwtError>
    
    // Issue refresh token
    pub fn issue_refresh_token(&self, user_id, family) -> Result<String, JwtError>
    
    // Verify access token
    pub fn verify_access_token(&self, token: &str) -> Result<AccessClaims, AuthError>
    
    // Verify refresh token
    pub fn verify_refresh_token(&self, token: &str) -> Result<RefreshClaims, JwtError>
}
```

**Token Claims:**

```rust
pub struct AccessClaims {
    pub sub: Uuid,        // user_id
    pub jti: Uuid,       // unique token ID
    pub iat: i64,        // issued at
    pub exp: i64,        // expiry
    pub iss: String,     // issuer: "suvidha-one-auth"
    pub aud: Vec<String>, // audience: ["suvidha-one-api"]
    pub kiosk: String,   // kiosk_id
    pub roles: Vec<Role>, // [Citizen, KioskAdmin, etc.]
    pub lang: String,    // preferred language
}
```

### Models (`shared/src/models.rs`)

Core data structures used throughout the system:

```rust
// User model
pub struct User {
    pub user_id: Uuid,
    pub aadhaar_id_hash: Option<String>,
    pub mobile_hash: Option<String>,
    pub full_name: String,
    pub state_code: String,
    pub preferred_language: String,
    pub created_at: DateTime<Utc>,
    pub is_active: bool,
}

// Session model
pub struct Session {
    pub session_id: Uuid,
    pub user_id: Uuid,
    pub kiosk_id: String,
    pub auth_method: AuthMethod, // Otp, Aadhaar, Qr
    pub created_at: DateTime<Utc>,
    pub last_active: DateTime<Utc>,
    pub idle_timeout: u64,   // 180 seconds
    pub hard_timeout: u64,   // 900 seconds
}

// Payment model
pub struct PaymentRecord {
    pub payment_id: Uuid,
    pub user_id: Uuid,
    pub amount: Decimal,
    pub tx_ref: String,
    pub status: PaymentStatus, // Pending, Success, Failed
    pub method: PaymentMethod, // Upi, Card, Bbps
    pub created_at: DateTime<Utc>,
}
```

### Response Wrapper (`shared/src/response.rs`)

Standard API response format:

```rust
pub struct ApiResponse<T> {
    pub data: T,
    pub meta: Meta,
}

pub struct Meta {
    pub request_id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub version: &'static str, // "1.0.0"
}

// Helper functions
pub fn ok<T>(data: T) -> (StatusCode, Json<ApiResponse<T>>)
pub fn created<T>(data: T) -> (StatusCode, Json<ApiResponse<T>>)
pub fn no_content() -> StatusCode
```

### Middleware (`shared/src/middleware.rs`)

Tower middleware layers:

```rust
// JWT authentication middleware
pub async fn jwt_auth_middleware<B>(
    State(jwt_svc): State<Arc<JwtService>>,
    req: Request<B>,
    next: Next<B>,
) -> Result<Response, AppError>

// Role-based authorization
pub async fn require_role<B>(
    Extension(claims): Extension<AccessClaims>,
    req: Request<B>,
    next: Next<B>,
    required_role: Role,
) -> Result<Response, AppError>

// Rate limiting (1000 req/min per IP)
pub async fn rate_limit_middleware(...)

// Security headers (CORS, CSP, HSTS, etc.)
pub fn security_headers() -> impl tower::Layer<Router>
```

## Authentication Service (`auth-service/`)

### OTP Flow

```rust
// Send OTP
POST /auth/otp/send
Request: { "mobile": "9999900000", "kiosk_id": "KIOSK001" }
Response: { "data": { "message": "OTP sent", "expires_in": 300 }}

// Verify OTP  
POST /auth/otp/verify
Request: { "mobile": "9999900000", "otp": "123456", "kiosk_id": "KIOSK001" }
Response: { 
    "data": { 
        "access_token": "eyJ...",
        "refresh_token": "eyJ...",
        "expires_in": 900 
    }
}
```

**Security:**
- OTP stored as HMAC-SHA256 hash (never plaintext)
- Rate limited: 3 OTPs per mobile per 10 minutes
- Max 3 verification attempts per OTP
- Constant-time comparison prevents timing attacks

### Token Refresh

```rust
POST /auth/refresh
Request: { "refresh_token": "eyJ..." }
Response: { 
    "data": {
        "access_token": "new_access_token",
        "refresh_token": "new_refresh_token", 
        "expires_in": 900
    }
}
```

## Payment Service (`payment-service/`)

### Payment Flow

```rust
POST /payments/initiate
Request: {
    "bill_ids": ["uuid1", "uuid2"],
    "method": "upi",
    "idempotency_key": "uuid"
}
Response: {
    "data": {
        "payment_id": "uuid",
        "transaction_ref": "TXN...",
        "amount": 1500.00,
        "status": "Pending",
        "qr_code": "upi://pay?..."
    }
}
```

### Webhook Handling

```rust
POST /webhooks/upi/callback
Headers: { "X-NPCI-Signature": "hmac-..." }
Request: {
    "transaction_id": "TXN...",
    "status": "SUCCESS",
    "amount": 1500.00,
    "utr": "UTR123"
}
```

Features:
- Idempotency key prevents duplicate payments
- HMAC signature verification
- Async processing for non-blocking responses

## Utility Service (`utility-service/`)

### Bill Fetch

```rust
POST /bills/fetch
Request: {
    "consumer_id": "ELEC123456",
    "department": "electricity"
}
Response: {
    "data": [{
        "bill_id": "uuid",
        "consumer_id": "ELEC123456",
        "amount": 1500.00,
        "due_date": "2026-04-15",
        "department": "electricity",
        "status": "pending"
    }]
}
```

Caching:
- Redis TTL: 1800 seconds (30 minutes)
- Cache key format: `bill:{department}:{consumer_id}`

## Grievance Service (`grievance-service/`)

```rust
// Create grievance
POST /grievances
Request: {
    "category": "billing",
    "department": "electricity",
    "subject": "Wrong bill amount",
    "description": "..."
}

// List grievances
GET /grievances

// Get grievance
GET /grievances/:id

// Update status
PATCH /grievances/:id/update
Request: { "status": "resolved" }
```

## Session Service (`session-service/`)

Redis-based session management:

```rust
// Create session
POST /sessions/create
Request: { "user_id": "uuid", "kiosk_id": "KIOSK001" }

// Refresh session (reset TTL)
POST /sessions/refresh
Request: { "session_id": "uuid" }

// Get session
GET /sessions/:session_id

// Delete session
DELETE /sessions/:session_id
```

Session data stored in Redis:
```json
{
    "session_id": "uuid",
    "user_id": "uuid", 
    "kiosk_id": "KIOSK001",
    "created_at": "2026-03-10T...",
    "last_active": "2026-03-10T..."
}
```

TTL: 900 seconds (15 minutes hard timeout)

## Kiosk Service (`kiosk-service/`)

```rust
// Register kiosk
POST /kiosks/register
Request: {
    "kiosk_id": "KIOSK001",
    "state_code": "UP",
    "district_code": "LKO",
    "location": "Lucknow Main Market"
}

// Heartbeat
POST /kiosks/:kiosk_id/heartbeat

// Get config
GET /kiosks/:kiosk_id/config

Response: {
    "data": {
        "version": "1.0.0",
        "api_url": "https://api.suvidhaone.gov.in",
        "idle_timeout": 180,
        "session_timeout": 900,
        "features": {
            "otp_enabled": true,
            "payment_enabled": true,
            "grievance_enabled": true,
            "document_enabled": true
        }
    }
}
```

## Database Schema

### Tables

```sql
-- Users (citizen records)
users (
    user_id UUID PRIMARY KEY,
    aadhaar_id_hash VARCHAR(255),  -- SHA-256 hash
    mobile_hash VARCHAR(255),     -- SHA-256 hash
    full_name VARCHAR(255),
    state_code VARCHAR(10),
    preferred_language VARCHAR(10),
    created_at TIMESTAMPTZ,
    is_active BOOLEAN
)

-- Bills
bills (
    bill_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users,
    consumer_id VARCHAR(100),
    amount DECIMAL(12,2),
    due_date DATE,
    department VARCHAR(50),
    status VARCHAR(20),  -- Pending/Paid/Overdue
    paid_at TIMESTAMPTZ
)

-- Payments
payments (
    payment_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users,
    amount DECIMAL(12,2),
    tx_ref VARCHAR(100),
    status VARCHAR(20),   -- Pending/Success/Failed
    method VARCHAR(20),   -- Upi/Card/Bbps
    created_at TIMESTAMPTZ
)

-- Grievances
grievances (
    grievance_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users,
    category VARCHAR(50),
    department VARCHAR(50),
    subject VARCHAR(255),
    description TEXT,
    status VARCHAR(20),   -- Open/InProgress/Resolved/Closed
    priority VARCHAR(20),  -- Low/Medium/High/Critical
    created_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
)

-- Documents
documents (
    document_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users,
    doc_type VARCHAR(50),
    name VARCHAR(255),
    digilocker_id VARCHAR(100),
    status VARCHAR(20),   -- Pending/Applied/Issued/Rejected
    created_at TIMESTAMPTZ
)

-- Kiosks
kiosks (
    kiosk_id VARCHAR(100) PRIMARY KEY,
    state_code VARCHAR(10),
    district_code VARCHAR(20),
    location VARCHAR(255),
    status VARCHAR(20),   -- Active/Inactive/Maintenance/Offline
    last_heartbeat TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
```

## Security Implementation

### JWT Authentication

1. **Token Issuance** (auth-service only):
   - RS256 signing with RSA-2048 private key
   - 15-minute access token expiry
   - 7-day refresh token expiry
   - Token family for replay detection

2. **Token Verification** (all services):
   - RS256 signature verification with public key
   - Issuer and audience validation
   - Redis session check for instant logout

### OTP Security

1. **Generation**: Cryptographically secure random (6 digits)
2. **Storage**: HMAC-SHA256 hash (never plaintext)
3. **Rate Limiting**: 3 OTPs per mobile per 10 minutes
4. **Attempt Limiting**: 3 verification attempts per OTP

### API Security

1. **Rate Limiting**: 1000 requests/minute per IP
2. **Input Validation**: Using `validator` crate
3. **SQL Injection**: Prevented via SQLx compile-time checks
4. **Security Headers**: CSP, HSTS, X-Frame-Options, etc.

## Running the Backend

### Development

```bash
# Install dependencies
cargo build

# Run database migrations
sqlx migrate run

# Start services
cargo run -p auth-service
cargo run -p payment-service
# ... etc
```

### Production (Docker)

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## Testing

```bash
# Unit tests
cargo test

# Integration tests
cargo test --test '*'

# Code coverage
cargo tarpaulin --out Xml --fail-under 80
```
