# SUVIDHA ONE Backend - Complete Services Documentation

**Version:** 1.0.0  
**Framework:** Rust + Axum 0.7 + Tokio  
**Database:** PostgreSQL 16  
**Cache:** Redis 7  
**Object Storage:** MinIO (S3-compatible)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Service Details](#service-details)
3. [Shared Library](#shared-library)
4. [Database Schema](#database-schema)
5. [Configuration](#configuration)
6. [Deployment](#deployment)
7. [Monitoring & Observability](#monitoring--observability)
8. [Security](#security)

---

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                               │
│                    Web App │ Mobile App │ Kiosk UI                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (NGINX)                           │
│                         Port 80/443 │ SSL Termination                   │
│                    Rate Limiting │ Load Balancing                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌──────────────┐           ┌──────────────┐           ┌──────────────┐
│   Auth       │           │   Payment    │           │   Utility    │
│   Service    │           │   Service    │           │   Service    │
│   :3001      │           │   :3002      │           │   :3003      │
└──────────────┘           └──────────────┘           └──────────────┘
        │                           │                           │
┌──────────────┐           ┌──────────────┐           ┌──────────────┐
│  Grievance   │           │   Document   │           │ Notification │
│   Service    │           │   Service    │           │   Service    │
│   :3004      │           │   :3005      │           │   :3006      │
└──────────────┘           └──────────────┘           └──────────────┘
        │                           │                           │
┌──────────────┐           ┌──────────────┐
│   Session    │           │    Kiosk     │
│   Service    │           │   Service    │
│   :3007      │           │   :3008      │
└──────────────┘           └──────────────┘
        │                           │
        └───────────────────────────┼───────────────────────────┐
                                    │                           │
                                    ▼                           ▼
                          ┌─────────────────┐         ┌─────────────────┐
                          │   PostgreSQL 16 │         │    Redis 7      │
                          │   :5432         │         │    :6379        │
                          └─────────────────┘         └─────────────────┘
```

### Communication Flow

1. **Client Request** → NGINX (API Gateway)
2. **NGINX** → Routes to appropriate microservice
3. **Microservice** → Validates JWT token
4. **Microservice** → Queries PostgreSQL/Redis
5. **Microservice** → Returns response
6. **NGINX** → Applies security headers
7. **Client** → Receives response

---

## Service Details

### 1. Auth Service (:3001)

**Purpose:** Authentication and authorization service

**Responsibilities:**
- OTP generation and verification
- JWT token issuance
- Token refresh and revocation
- Session management
- Aadhaar authentication (planned)
- QR code authentication (planned)

**Key Features:**
- HMAC-SHA256 hashed OTP storage
- Rate limiting (3 OTPs per 10 minutes)
- Maximum 3 OTP verification attempts
- Refresh token rotation
- Replay attack prevention

**Dependencies:**
- Redis (OTP storage, session cache)
- JWT Service (token generation)

**API Endpoints:**
```
POST /auth/otp/send          - Send OTP to mobile
POST /auth/otp/verify        - Verify OTP and get tokens
POST /auth/refresh           - Refresh access token
POST /auth/logout            - Invalidate session
GET  /health                 - Health check
GET  /ready                  - Readiness check
```

**Data Flow (OTP Send):**
```
1. Client → POST /auth/otp/send { mobile, kiosk_id }
2. Service → Check rate limit in Redis
3. Service → Generate 6-digit OTP
4. Service → Hash OTP with HMAC-SHA256
5. Service → Store hash in Redis (5 min TTL)
6. Service → Send OTP via SMS (external provider)
7. Service → Return { message, expires_in }
```

**Data Flow (OTP Verify):**
```
1. Client → POST /auth/otp/verify { mobile, otp, kiosk_id }
2. Service → Check attempt count in Redis
3. Service → Hash submitted OTP
4. Service → Compare with stored hash
5. Service → Generate JWT access + refresh tokens
6. Service → Store session in Redis
7. Service → Return { access_token, refresh_token, expires_in }
```

---

### 2. Payment Service (:3002)

**Purpose:** Payment processing and orchestration

**Responsibilities:**
- Payment initiation
- Payment status tracking
- UPI integration
- Card payment processing
- BBPS integration
- Webhook handling
- Receipt generation

**Key Features:**
- Idempotent payment processing
- Multiple payment methods (UPI, Card, BBPS)
- QR code generation for UPI
- Transaction reference tracking
- Webhook signature verification

**Dependencies:**
- PostgreSQL (payment records)
- Redis (idempotency cache)
- NPCI (payment gateway)

**API Endpoints:**
```
POST /payments/initiate           - Initiate payment
GET  /payments/status/:id         - Get payment status
POST /webhooks/upi/callback       - UPI webhook callback
GET  /health                      - Health check
GET  /ready                       - Readiness check
```

**Payment Flow:**
```
1. Client → POST /payments/initiate { bill_ids, method, idempotency_key }
2. Service → Check idempotency key in Redis
3. Service → Fetch bills from database
4. Service → Calculate total amount
5. Service → Create payment record
6. Service → Update bill status to 'Paid'
7. Service → Generate UPI QR code (if UPI)
8. Service → Return { payment_id, qr_code, amount }
9. Client → Scan QR / Complete payment
10. NPCI → POST /webhooks/upi/callback { status, utr }
11. Service → Verify webhook signature
12. Service → Update payment status
```

---

### 3. Utility Service (:3003)

**Purpose:** Utility bill management

**Responsibilities:**
- Bill fetching
- Bill details retrieval
- Service listing
- BBPS integration
- Consumer verification

**Key Features:**
- Multi-department support
- Bill caching (30 min TTL)
- Real-time bill status
- Consumer ID validation

**Dependencies:**
- PostgreSQL (bill records)
- Redis (bill cache)
- BBPS API (bill fetching)

**API Endpoints:**
```
POST /bills/fetch              - Fetch bills by consumer ID
GET  /bills/:bill_id           - Get bill details
GET  /services                 - List available services
GET  /health                   - Health check
GET  /ready                    - Readiness check
```

**Supported Departments:**
- Electricity (DISCOM)
- Water (Municipal)
- Gas (PNGRB)
- Municipal (Property Tax)

---

### 4. Grievance Service (:3004)

**Purpose:** Grievance/complaint management

**Responsibilities:**
- Grievance creation
- Grievance tracking
- Status updates
- Department routing
- SLA monitoring

**Key Features:**
- Multi-category support
- Priority assignment
- Status workflow
- Department assignment
- Resolution tracking

**Dependencies:**
- PostgreSQL (grievance records)

**API Endpoints:**
```
POST /grievances                    - Create grievance
GET  /grievances                    - List user grievances
GET  /grievances/:id                - Get grievance details
PATCH /grievances/:id/update        - Update status (admin)
GET  /health                        - Health check
GET  /ready                         - Readiness check
```

**Grievance Workflow:**
```
Open → In Progress → Resolved → Closed
```

**Categories:**
- Billing
- Service
- Infrastructure
- Other

**Priorities:**
- Low
- Medium
- High
- Critical

---

### 5. Document Service (:3005)

**Purpose:** Document and certificate management

**Responsibilities:**
- Document applications
- DigiLocker integration
- Certificate generation
- Document status tracking
- Document retrieval

**Key Features:**
- DigiLocker integration
- Application tracking
- Document verification
- Secure storage

**Dependencies:**
- PostgreSQL (document records)
- DigiLocker API
- MinIO (document storage)

**API Endpoints:**
```
POST /documents/apply          - Apply for document
GET  /documents                - List user documents
GET  /documents/:id            - Get document status
GET  /health                   - Health check
GET  /ready                    - Readiness check
```

**Document Types:**
- Birth Certificate
- Caste Certificate
- Income Certificate
- Residence Certificate
- Aadhaar Card
- Voter ID

**Document Status:**
- Pending
- Applied
- Issued
- Rejected

---

### 6. Notification Service (:3006)

**Purpose:** Multi-channel notifications

**Responsibilities:**
- SMS notifications
- WhatsApp messages
- Push notifications
- Email notifications
- Notification templating
- Delivery tracking

**Key Features:**
- Multi-channel support
- Template-based messages
- Delivery status tracking
- Retry mechanism

**Dependencies:**
- PostgreSQL (notification logs)
- SMS Provider API
- WhatsApp API
- Firebase (push notifications)

**API Endpoints:**
```
POST /notifications/send       - Send notification
GET  /health                   - Health check
GET  /ready                    - Readiness check
```

**Notification Types:**
- OTP
- Payment Receipt
- Bill Reminder
- Grievance Update
- Document Ready

**Channels:**
- SMS
- WhatsApp
- Push
- Email

---

### 7. Session Service (:3007)

**Purpose:** Kiosk session management

**Responsibilities:**
- Session creation
- Session refresh
- Session termination
- Idle timeout handling
- Concurrent session management

**Key Features:**
- Redis-based session storage
- Configurable timeouts
- Automatic cleanup
- Session state management

**Dependencies:**
- Redis (session storage)

**API Endpoints:**
```
POST /sessions/create          - Create session
POST /sessions/refresh         - Refresh session
GET  /sessions/:id             - Get session details
DELETE /sessions/:id           - Delete session
GET  /health                   - Health check
GET  /ready                    - Readiness check
```

**Session Timeouts:**
- Idle Timeout: 3 minutes (180 seconds)
- Hard Timeout: 15 minutes (900 seconds)

**Session Lifecycle:**
```
1. Create → Session stored in Redis (15 min TTL)
2. Activity → TTL reset on each request
3. Idle > 3 min → Session marked inactive
4. Total > 15 min → Session auto-deleted
5. Logout → Manual session deletion
```

---

### 8. Kiosk Service (:3008)

**Purpose:** Kiosk registration and management

**Responsibilities:**
- Kiosk registration
- Heartbeat monitoring
- Configuration management
- Status tracking
- Location management

**Key Features:**
- Automatic heartbeat monitoring
- Configuration versioning
- Location-based routing
- Status tracking

**Dependencies:**
- PostgreSQL (kiosk records)
- Redis (heartbeat cache)

**API Endpoints:**
```
POST /kiosks/register              - Register kiosk
GET  /kiosks                       - List kiosks
GET  /kiosks/:id                   - Get kiosk details
POST /kiosks/:id/heartbeat         - Send heartbeat
GET  /kiosks/:id/config            - Get kiosk config
GET  /health                       - Health check
GET  /ready                        - Readiness check
```

**Kiosk Status:**
- Active
- Inactive
- Maintenance
- Offline

**Heartbeat:**
- Frequency: Every 60 seconds
- Timeout: 5 minutes (marked offline)

---

## Shared Library

The `shared` crate provides common functionality across all services.

### Modules

#### `error.rs` - Error Handling
- `AppError` - Main error type
- `AuthError` - Authentication errors
- `PaymentError` - Payment processing errors
- `UtilityError` - Utility service errors
- `GrievanceError` - Grievance service errors
- `DocumentError` - Document service errors
- `NotificationError` - Notification service errors

#### `jwt.rs` - JWT Utilities
- `JwtService` - Token generation and verification
- `AccessClaims` - Access token claims structure
- `RefreshClaims` - Refresh token claims structure
- `Role` - User role enumeration

#### `models.rs` - Data Models
- `User` - User entity
- `Session` - Session entity
- `BillDetails` - Bill entity
- `PaymentRecord` - Payment entity
- `Grievance` - Grievance entity
- `Document` - Document entity
- `Kiosk` - Kiosk entity
- `Notification` - Notification entity

#### `response.rs` - Response Wrappers
- `ApiResponse<T>` - Standard API response
- `Meta` - Response metadata
- Helper functions: `ok()`, `created()`, `no_content()`

#### `middleware.rs` - Tower Middleware
- `jwt_auth_middleware` - JWT authentication
- `require_role` - Role-based authorization
- `rate_limit_middleware` - Rate limiting
- `security_headers` - Security header injection
- `cors_layer` - CORS configuration

#### `config.rs` - Configuration
- `AppConfig` - Application configuration
- `ServerConfig` - Server settings
- `DatabaseConfig` - Database settings
- `RedisConfig` - Redis settings
- `JwtConfig` - JWT settings
- External service configs (UIDAI, NPCI, DigiLocker, etc.)

#### `tracing.rs` - Logging
- `init_tracing` - Console logging setup
- `init_tracing_json` - JSON logging setup
- `init_tracing_with_otlp` - OpenTelemetry setup

---

## Database Schema

### Tables

#### `users`
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aadhaar_id_hash VARCHAR(255) UNIQUE,
    mobile_hash VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    state_code VARCHAR(10) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true
);
```

#### `sessions`
```sql
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    kiosk_id VARCHAR(100) NOT NULL,
    auth_method VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    idle_timeout INTEGER DEFAULT 180,
    hard_timeout INTEGER DEFAULT 900
);
```

#### `bills`
```sql
CREATE TABLE bills (
    bill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    consumer_id VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    department VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `payments`
```sql
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    amount DECIMAL(12, 2) NOT NULL,
    tx_ref VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    method VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `grievances`
```sql
CREATE TABLE grievances (
    grievance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    category VARCHAR(50) NOT NULL,
    department VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Open',
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
```

#### `documents`
```sql
CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    doc_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    digilocker_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `notifications`
```sql
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `kiosks`
```sql
CREATE TABLE kiosks (
    kiosk_id VARCHAR(100) PRIMARY KEY,
    state_code VARCHAR(10) NOT NULL,
    district_code VARCHAR(20) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    config_version VARCHAR(50) DEFAULT '1.0.0',
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_users_mobile_hash ON users(mobile_hash);
CREATE INDEX idx_users_aadhaar_hash ON users(aadhaar_id_hash);
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_consumer_id ON bills(consumer_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_tx_ref ON payments(tx_ref);
CREATE INDEX idx_grievances_user_id ON grievances(user_id);
CREATE INDEX idx_grievances_status ON grievances(status);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_kiosks_status ON kiosks(status);
```

---

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/suvidha

# Redis
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_PRIVATE_KEY_PEM=<RSA private key>
JWT_PUBLIC_KEY_PEM=<RSA public key>

# OTP Configuration
OTP_HMAC_SECRET=<random secret>

# UIDAI (Aadhaar)
UIDAI_API_KEY=<api key>
UIDAI_AUA_CODE=<AUA code>

# NPCI (Payments)
NPCI_MERCHANT_ID=<merchant ID>
NPCI_WEBHOOK_SECRET=<webhook secret>

# DigiLocker
DIGILOCKER_CLIENT_ID=<client ID>
DIGILOCKER_CLIENT_SECRET=<client secret>

# SMS Provider
SMS_PROVIDER_API_KEY=<api key>

# WhatsApp
WHATSAPP_API_KEY=<api key>

# Application
APP_ENV=dev
RUST_LOG=info
```

### Configuration Files

**config/default.toml:**
```toml
[server]
host = "0.0.0.0"
port = 3001
env = "dev"

[database]
url = "postgresql://postgres:postgres@localhost:5432/suvidha"
max_connections = 50
min_connections = 5

[redis]
url = "redis://localhost:6379"
max_connections = 50

[jwt]
access_ttl_secs = 900
refresh_ttl_secs = 604800
issuer = "suvidha-one-auth"
audience = ["suvidha-one-api"]
```

---

## Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: suvidha-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: suvidha
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d

  redis:
    image: redis:7-alpine
    container_name: suvidha-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  auth-service:
    build:
      context: ./auth-service
      dockerfile: Dockerfile
    container_name: suvidha-auth
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/suvidha
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  # ... other services ...

  nginx:
    image: nginx:alpine
    container_name: suvidha-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - auth-service
      - payment-service
      - utility-service
```

### Build Commands

```bash
# Build all services
cargo build --release

# Build specific service
cargo build -p auth-service --release

# Build Docker images
docker-compose build

# Deploy
docker-compose up -d
```

---

## Monitoring & Observability

### Logging

**Format:** JSON (production) / Pretty (development)

**Fields:**
- timestamp
- level
- target
- message
- span (trace context)
- request_id

**Example:**
```json
{
  "timestamp": "2026-03-10T10:00:00.000Z",
  "level": "INFO",
  "target": "auth_service::handlers::otp",
  "message": "OTP sent successfully",
  "mobile": "9876543210",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Metrics (Prometheus)

**Endpoints:** `GET /metrics`

**Metrics:**
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `db_pool_connections` - Database connection pool size
- `redis_connections` - Redis connection count
- `active_sessions` - Current active sessions
- `otp_sent_total` - Total OTPs sent
- `payments_processed_total` - Total payments processed

### Tracing (OpenTelemetry)

**Exporters:**
- Jaeger (development)
- OTLP Collector (production)

**Spans:**
- HTTP request handling
- Database queries
- Redis operations
- External API calls

---

## Security

### Authentication Flow

```
1. User enters mobile number
2. System sends OTP via SMS
3. User enters OTP
4. System verifies OTP
5. System generates JWT tokens
6. Client stores tokens
7. Client includes token in requests
8. Service validates token
9. Service processes request
```

### JWT Token Security

**Algorithm:** RS256 (RSA Signature with SHA-256)

**Key Size:** 2048 bits

**Token Lifetime:**
- Access Token: 15 minutes
- Refresh Token: 7 days

**Claims:**
```json
{
  "sub": "user-id",
  "jti": "unique-token-id",
  "iat": "issued-at",
  "exp": "expiration",
  "iss": "issuer",
  "aud": ["audience"],
  "kiosk": "kiosk-id",
  "roles": ["citizen"],
  "lang": "en"
}
```

### Security Headers

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' fonts.googleapis.com
Referrer-Policy: strict-origin-when-cross-origin
```

### Rate Limiting

**Default Limits:**
- OTP Send: 3 per 10 minutes per mobile
- OTP Verify: 3 attempts per OTP
- API Requests: 1000 per minute per IP

### Input Validation

**Validated Fields:**
- Mobile number (10 digits, numeric)
- OTP (6 digits)
- Email (RFC 5322 format)
- UUID format
- Enum values

---

## Testing

### Unit Tests

```bash
# Run all tests
cargo test

# Run specific service tests
cargo test -p auth-service

# Run with output
cargo test -- --nocapture
```

### Integration Tests

```bash
# Start test database
docker-compose up -d postgres redis

# Run migrations
sqlx migrate run

# Run integration tests
cargo test --test integration
```

### Load Testing

```bash
# Using k6
k6 run load-tests/auth.js

# Using wrk
wrk -t12 -c400 -d30s http://localhost:3001/health
```

---

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
```
Error: connection refused
Solution: Check PostgreSQL is running and DATABASE_URL is correct
```

**2. Redis Connection Failed**
```
Error: Connection refused (os error 111)
Solution: Check Redis is running and REDIS_URL is correct
```

**3. JWT Verification Failed**
```
Error: Invalid token
Solution: Check JWT keys are correctly configured and match
```

**4. SQLx Query Error**
```
Error: set DATABASE_URL to use query macros
Solution: Set DATABASE_URL or run cargo sqlx prepare
```

---

## Performance Optimization

### Database

- Use connection pooling (SQLx)
- Index frequently queried columns
- Use prepared statements
- Implement query caching

### Redis

- Use connection pooling (deadpool-redis)
- Set appropriate TTLs
- Use pipelining for batch operations
- Implement circuit breakers

### Application

- Use async/await for I/O
- Implement request timeouts
- Use compression (gzip)
- Enable HTTP/2

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Run tests
5. Submit pull request

### Code Style

```bash
# Format code
cargo fmt

# Lint code
cargo clippy --all-targets --all-features

# Check for security issues
cargo audit
```

---

## License

Proprietary - SUVIDHA ONE Project

---

## Support

For issues and queries, refer to:
- API_DOCUMENTATION.md - API reference
- BUILD_ERRORS_REPORT.md - Build troubleshooting
- BACKEND_CODE_DOCUMENTATION.md - Code structure
