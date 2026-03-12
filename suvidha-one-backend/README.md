# SUVIDHA ONE - Rust Backend

Complete backend implementation for SUVIDHA ONE Unified Citizen Service Kiosk.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SUVIDHA ONE BACKEND                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Layer 1 - EDGE                                                         │
│  NGINX Reverse Proxy / API Gateway                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  Layer 2 - MICROSERVICES (Axum + Tokio)                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ auth        │ │ payment     │ │ utility     │ │ grievance   │       │
│  │ service     │ │ service     │ │ service     │ │ service     │       │
│  │ :3001       │ │ :3002       │ │ :3003       │ │ :3004       │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ document    │ │ notification│ │ session     │ │ kiosk       │       │
│  │ service     │ │ service     │ │ service     │ │ service     │       │
│  │ :3005       │ │ :3006       │ │ :3007       │ │ :3008       │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
├─────────────────────────────────────────────────────────────────────────┤
│  Layer 3 - DATA                                                        │
│  PostgreSQL 16 │ Redis 7 │ MinIO (S3)                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| `auth-service` | 3001 | OTP, Aadhaar, QR authentication; JWT issuance |
| `payment-service` | 3002 | UPI, Card, BBPS payment orchestration |
| `utility-service` | 3003 | Electricity, Water, Gas, Municipal bills |
| `grievance-service` | 3004 | Complaint filing and tracking |
| `document-service` | 3005 | DigiLocker integration, certificates |
| `notification-service` | 3006 | SMS, WhatsApp, push notifications |
| `session-service` | 3007 | Kiosk session state management |
| `kiosk-service` | 3008 | Kiosk registration, heartbeat, config |

## Quick Start

### Prerequisites

- Rust 1.75+
- PostgreSQL 16
- Redis 7
- Docker & Docker Compose (optional)

### Development Setup

1. Clone the repository:
```bash
cd suvidha-one-backend
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Generate JWT keys:
```bash
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

4. Run database migrations:
```bash
sqlx migrate run
```

5. Start all services:
```bash
# Using Docker Compose
docker-compose up -d

# Or manually
cargo build --release
# Start each service on its respective port
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## API Endpoints

### Authentication (auth-service:3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/otp/send` | Send OTP to mobile |
| POST | `/auth/otp/verify` | Verify OTP and get JWT |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate session |

### Payments (payment-service:3002)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/initiate` | Initiate bill payment |
| GET | `/payments/status/:id` | Get payment status |
| POST | `/webhooks/upi/callback` | UPI payment callback |

### Utilities (utility-service:3003)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bills/fetch` | Fetch bills by consumer ID |
| GET | `/bills/:bill_id` | Get bill details |
| GET | `/services` | List available services |

### Grievances (grievance-service:3004)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/grievances` | File new grievance |
| GET | `/grievances` | List user grievances |
| GET | `/grievances/:id` | Get grievance details |
| PATCH | `/grievances/:id/update` | Update grievance status |

### Documents (document-service:3005)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/apply` | Apply for certificate |
| GET | `/documents` | List user documents |
| GET | `/documents/:id` | Get document status |

### Notifications (notification-service:3006)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/notifications/send` | Send notification |

### Sessions (session-service:3007)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sessions/create` | Create session |
| POST | `/sessions/refresh` | Refresh session |
| GET | `/sessions/:id` | Get session |
| DELETE | `/sessions/:id` | Delete session |

### Kiosks (kiosk-service:3008)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/kiosks/register` | Register kiosk |
| GET | `/kiosks` | List kiosks |
| GET | `/kiosks/:id` | Get kiosk details |
| POST | `/kiosks/:id/heartbeat` | Kiosk heartbeat |
| GET | `/kiosks/:id/config` | Get kiosk config |

## Technology Stack

- **Runtime**: Rust with Tokio async runtime
- **Web Framework**: Axum 0.7
- **Database**: PostgreSQL 16 with SQLx
- **Cache**: Redis 7
- **Authentication**: JWT (RS256)
- **API Documentation**: OpenAPI 3.1 with Utoipa
- **Observability**: OpenTelemetry, Prometheus, Tracing

## Project Structure

```
suvidha-one-backend/
├── Cargo.toml                 # Workspace definition
├── docker-compose.yml         # Docker orchestration
├── nginx.conf                 # API Gateway config
├── migrations/                # Database migrations
├── keys/                      # JWT key pairs
├── shared/                    # Shared crate
│   └── src/
│       ├── lib.rs
│       ├── error.rs          # Error types
│       ├── jwt.rs            # JWT utilities
│       ├── models.rs         # Data models
│       ├── config.rs         # Configuration
│       ├── response.rs       # Response wrappers
│       ├── middleware.rs     # Tower middleware
│       └── tracing.rs        # Logging setup
├── auth-service/             # Authentication service
├── payment-service/          # Payment service
├── utility-service/          # Utility billing service
├── grievance-service/       # Grievance management
├── document-service/         # Document service
├── notification-service/     # Notification service
├── session-service/         # Session management
└── kiosk-service/           # Kiosk management
```

## Security Features

- JWT with RS256 asymmetric encryption
- OTP stored as HMAC-SHA256 hash (never plaintext)
- Rate limiting on all endpoints
- SQL injection prevention via SQLx compile-time checks
- Security headers (CSP, HSTS, X-Frame-Options)
- Input validation with validator crate

## Testing

```bash
# Run all tests
cargo test

# Run specific service tests
cargo test -p auth-service

# Run with coverage
cargo tarpaulin --out Xml
```

## License

Proprietary - SUVIDHA ONE Project
