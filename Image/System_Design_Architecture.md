# SUVIDHA ONE - System Design & Architecture

## 1. High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SUVIDHA ONE SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                        LAYER 1: KIOSK FRONTEND                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │ │
│  │  │  React UI   │ │  Voice/TTS   │ │  Service    │ │  Offline Cache     │ │ │
│  │  │  (Next.js)  │ │  Module      │ │  Worker     │ │  (IndexedDB)       │ │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                         │
│                                       ▼ HTTPS/TLS 1.3 + JWT                   │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                     LAYER 2: API GATEWAY                                 │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │ │
│  │  │   NGINX     │ │  Rate       │ │   Auth     │ │   Load             │ │ │
│  │  │  Reverse    │ │  Limiter    │ │  Validator │ │   Balancer         │ │ │
│  │  │  Proxy      │ │  (Redis)    │ │  (JWT)     │ │                     │ │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                         │
│                                       ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                   LAYER 3: MICROSERVICES                                 │ │
│  │                                                                           │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐  │ │
│  │  │   Auth     │ │  Payment   │ │  Utility   │ │ Grievance │ │Document│  │ │
│  │  │  Service   │ │  Service   │ │  Service   │ │  Service  │ │Service │  │ │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └─────────┘  │ │
│  │                                                                           │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────────┐  │ │
│  │  │Notification│ │  Session   │ │  Kiosk     │ │   Integration        │  │ │
│  │  │  Service   │ │  Service   │ │  Service   │ │   Service            │  │ │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                         │
│                                       ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                      LAYER 4: DATA LAYER                                  │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │ │
│  │  │ PostgreSQL  │ │    Redis    │ │    MinIO    │ │   Backup Storage   │  │ │
│  │  │  (Primary)  │ │  (Cache)    │ │  (S3 Docs) │ │   (Cold Storage)   │  │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                         │
│                                       ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                  LAYER 5: EXTERNAL INTEGRATIONS                          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐    │ │
│  │  │  UIDAI   │ │   NPCI    │ │DigiLocker│ │ DISCOM   │ │  Municipal    │    │ │
│  │  │(Aadhaar) │ │(UPI/BBPS) │ │   APIs   │ │   APIs   │ │    APIs       │    │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────────┘    │ │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────────────────────────────────┐   │ │
│  │  │  SMS/    │ │ WhatsApp │ │       Gas / LPG Providers              │   │ │
│  │  │  WhatsApp│ │ Business │ │   (IOCL, BPCL, HPCL)                   │   │ │
│  │  └──────────┘ └──────────┘ └─────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. API Routes Structure

### 2.1 Base URL Configuration
```
Production:  https://api.suvidhaone.gov.in/v1
Staging:    https://staging-api.suvidhaone.gov.in/v1
Development: http://localhost:8080/v1
```

### 2.2 Authentication Routes (`/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/otp/send` | Send OTP to mobile | No |
| POST | `/auth/otp/verify` | Verify OTP & create session | No |
| POST | `/auth/aadhaar/init` | Initialize Aadhaar auth | No |
| POST | `/auth/aadhaar/verify` | Verify Aadhaar biometric | No |
| POST | `/auth/qr/scan` | QR code authentication | No |
| POST | `/auth/refresh` | Refresh JWT token | Yes |
| POST | `/auth/logout` | Invalidate session | Yes |
| GET | `/auth/status` | Check auth status | Yes |

### 2.3 User Routes (`/user`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/user/profile` | Get user profile | Yes |
| PUT | `/user/profile` | Update user profile | Yes |
| GET | `/user/preferences` | Get user preferences | Yes |
| PUT | `/user/preferences` | Save language/font settings | Yes |
| GET | `/user/history` | Get transaction history | Yes |
| GET | `/user/bills` | Get pending bills | Yes |

### 2.4 Bill Payment Routes (`/bills`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/bills/fetch` | Fetch bills via BBPS | Yes |
| GET | `/bills/:id` | Get bill details | Yes |
| POST | `/bills/pay` | Initiate bill payment | Yes |
| POST | `/bills/verify` | Verify payment status | Yes |
| GET | `/bills/history` | Payment history | Yes |
| GET | `/bills/receipt/:id` | Get receipt PDF | Yes |

### 2.5 Payment Routes (`/payment`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/payment/upi/init` | Initialize UPI payment | Yes |
| POST | `/payment/upi/verify` | Verify UPI transaction | Yes |
| POST | `/payment/card/init` | Initialize card payment | Yes |
| POST | `/payment/card/verify` | Verify card transaction | Yes |
| POST | `/payment/cash/init` | Initialize cash payment | Yes |
| GET | `/payment/status/:id` | Get payment status | Yes |
| POST | `/payment/refund` | Initiate refund | Yes |

### 2.6 Grievance Routes (`/grievance`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/grievance/file` | File new complaint | Yes |
| GET | `/grievance/:id` | Get complaint details | Yes |
| GET | `/grievance/list` | List user complaints | Yes |
| PUT | `/grievance/:id/escalate` | Escalate complaint | Yes |
| POST | `/grievance/:id/feedback` | Submit feedback | Yes |
| POST | `/grievance/:id/evidence` | Upload evidence | Yes |

### 2.7 Certificate Routes (`/certificate`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/certificate/types` | Available certificate types | No |
| POST | `/certificate/apply` | Apply for certificate | Yes |
| GET | `/certificate/:id` | Get certificate status | Yes |
| GET | `/certificate/download/:id` | Download from DigiLocker | Yes |
| POST | `/certificate/upload` | Upload supporting document | Yes |

### 2.8 Utility Routes (`/utility`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/utility/electricity/status` | Check electricity status | Yes |
| GET | `/utility/water/status` | Check water connection | Yes |
| POST | `/utility/gas/book` | Book LPG cylinder | Yes |
| GET | `/utility/municipal/tax` | Property tax details | Yes |

### 2.9 Kiosk Routes (`/kiosk`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/kiosk/register` | Register new kiosk | Admin |
| GET | `/kiosk/:id/status` | Get kiosk status | Admin |
| POST | `/kiosk/heartbeat` | Kiosk health check | No |
| GET | `/kiosk/config` | Get kiosk configuration | No |
| POST | `/kiosk/sync` | Sync offline data | Yes |

### 2.10 Service Routes (`/services`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/services` | List all services | No |
| GET | `/services/:id` | Get service details | No |
| GET | `/services/categories` | Service categories | No |

---

## 3. Database Schema

### 3.1 PostgreSQL Database Design

#### Users Table
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aadhaar_id_hash VARCHAR(255) UNIQUE,  -- Hashed Aadhaar
    mobile_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    state_code VARCHAR(2),
    district VARCHAR(100),
    preferred_language VARCHAR(10) DEFAULT 'hi',
    accessibility_settings JSONB DEFAULT '{"fontScale": 1, "highContrast": false, "voiceEnabled": true}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_aadhaar ON users(aadhaar_id_hash);
CREATE INDEX idx_users_mobile ON users(mobile_hash);
```

#### Sessions Table
```sql
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    kiosk_id VARCHAR(100),
    jwt_token TEXT NOT NULL,
    refresh_token TEXT,
    ip_address INET,
    user_agent TEXT,
    auth_method VARCHAR(20) NOT NULL,  -- 'otp', 'aadhaar', 'qr'
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(jwt_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

#### Bills Table
```sql
CREATE TABLE bills (
    bill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    utility_type VARCHAR(50) NOT NULL,  -- 'electricity', 'water', 'gas'
    provider_id VARCHAR(100) NOT NULL,  -- DISCOM ID, Water Board ID
    consumer_number VARCHAR(100) NOT NULL,
    bill_number VARCHAR(100),
    amount DECIMAL(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    billing_period_start DATE,
    billing_period_end DATE,
    bill_details JSONB,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'paid', 'overdue'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bills_user ON bills(user_id);
CREATE INDEX idx_bills_consumer ON bills(consumer_number);
CREATE INDEX idx_bills_status ON bills(status);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    session_id UUID REFERENCES sessions(session_id),
    bill_id UUID REFERENCES bills(bill_id),
    transaction_type VARCHAR(50) NOT NULL,  -- 'bill_payment', 'certificate', 'grievance'
    amount DECIMAL(12, 2),
    currency VARCHAR(3) DEFAULT 'INR',
    payment_method VARCHAR(50) NOT NULL,  -- 'upi', 'card', 'cash'
    payment_status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'success', 'failed', 'refunded'
    gateway_transaction_id VARCHAR(255),
    utility_reference VARCHAR(255),
    receipt_url TEXT,
    receipt_printed BOOLEAN DEFAULT false,
    receipt_sent_sms BOOLEAN DEFAULT false,
    receipt_sent_whatsapp BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_bill ON transactions(bill_id);
CREATE INDEX idx_transactions_status ON transactions(payment_status);
CREATE INDEX idx_transactions_date ON transactions(created_at);
```

#### Grievances Table
```sql
CREATE TABLE grievances (
    grievance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    session_id UUID REFERENCES sessions(session_id),
    category VARCHAR(50) NOT NULL,  -- 'electricity', 'water', 'gas', 'municipal'
    sub_category VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'normal',  -- 'low', 'normal', 'high', 'urgent'
    status VARCHAR(20) DEFAULT 'open',  -- 'open', 'in_progress', 'resolved', 'closed', 'escalated'
    assigned_department VARCHAR(100),
    sla_deadline TIMESTAMP,
    resolution_notes TEXT,
    citizen_rating INTEGER,  -- 1-5 stars
    citizen_feedback TEXT,
    external_reference_id VARCHAR(255),  -- CPGRAMS ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_grievances_user ON grievances(user_id);
CREATE INDEX idx_grievances_status ON grievances(status);
CREATE INDEX idx_grievances_category ON grievances(category);
```

#### Grievance Evidence Table
```sql
CREATE TABLE grievance_evidence (
    evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID REFERENCES grievances(grievance_id),
    file_type VARCHAR(20) NOT NULL,  -- 'image', 'video', 'document'
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Certificates Table
```sql
CREATE TABLE certificates (
    certificate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    certificate_type VARCHAR(100) NOT NULL,  -- 'birth', 'death', 'income', 'caste'
    application_number VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'processing', 'approved', 'rejected', 'issued'
    application_data JSONB NOT NULL,
    supporting_documents JSONB,
    digilocker_id VARCHAR(255),
    verification_url TEXT,
    issued_date DATE,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_type ON certificates(certificate_type);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_app ON certificates(application_number);
```

#### Kiosks Table
```sql
CREATE TABLE kiosks (
    kiosk_id VARCHAR(100) PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL,
    address TEXT,
    state_code VARCHAR(2),
    district VARCHAR(100),
    pincode VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    kiosk_type VARCHAR(50) DEFAULT 'standard',  -- 'standard', 'premium', 'basic'
    hardware_specs JSONB,
    status VARCHAR(20) DEFAULT 'online',  -- 'online', 'offline', 'maintenance'
    last_heartbeat TIMESTAMP,
    software_version VARCHAR(50),
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kiosks_state ON kiosks(state_code);
CREATE INDEX idx_kiosks_status ON kiosks(status);
```

#### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id UUID,
    kiosk_id VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    request_data JSONB,
    response_data JSONB,
    status VARCHAR(20),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

### 3.2 Redis Data Structures

#### Session Cache
```
Key:        session:{session_id}
Type:       Hash
TTL:        15 minutes
Fields:     user_id, kiosk_id, auth_method, created_at, last_activity
```

#### Rate Limiting
```
Key:        rate_limit:{ip_address}:{endpoint}
Type:       String (counter)
TTL:        1 minute
Value:      Request count
```

#### OTP Cache
```
Key:        otp:{mobile_number}
Type:       String
TTL:        5 minutes
Value:      OTP value
```

#### Bill Cache
```
Key:        bill:{consumer_number}:{utility_type}
Type:       String (JSON)
TTL:        30 minutes
Value:      Cached bill data
```

#### Payment Status Cache
```
Key:        payment:{transaction_id}
Type:       Hash
TTL:        24 hours
Fields:     status, amount, gateway_ref, updated_at
```

### 3.3 MinIO/S3 Buckets

| Bucket Name | Purpose | Access | Retention |
|-------------|---------|--------|-----------|
| `suvidha-receipts` | Payment receipts PDFs | Private | 7 years |
| `suvidha-certificates` | Issued certificates | Private | Permanent |
| `suvidha-evidence` | Grievance evidence | Private | 5 years |
| `suvidha-logs` | System logs | Private | 90 days |
| `suvidha-public` | Static assets | Public | N/A |

---

## 4. Authentication & Token Flow

### 4.1 Authentication Methods

#### OTP Authentication Flow
```
1. User enters mobile number on kiosk
2. POST /auth/otp/send
   - Server validates mobile format
   - Generate 6-digit OTP
   - Store in Redis (TTL: 5 min)
   - Send via SMS gateway
3. User enters OTP
4. POST /auth/otp/verify
   - Validate OTP from Redis
   - Create JWT access token (15 min)
   - Create refresh token (7 days)
   - Store session in PostgreSQL
5. Return tokens in response
```

#### Aadhaar Authentication Flow
```
1. User selects Aadhaar auth
2. POST /auth/aadhaar/init
   - Generate transaction ID
   - Return to biometric device
3. User scans fingerprint/iris
4. POST /auth/aadhaar/verify
   - Send to UIDAI API
   - Receive Aadhaar hash
   - Lookup/create user
   - Generate tokens
```

#### QR Code Authentication Flow
```
1. User scans QR from DigiLocker/Aadhaar app
2. POST /auth/qr/scan
   - Decode QR payload
   - Validate JWT from QR
   - Extract Aadhaar reference
   - Generate session tokens
```

### 4.2 Token Structure

#### Access Token (JWT)
```json
{
  "alg": "RS256",
  "typ": "JWT"
}
{
  "sub": "user_id",
  "session_id": "session_id",
  "kiosk_id": "kiosk_001",
  "auth_method": "otp",
  "exp": 1709000000,
  "iat": 1708999200,
  "iss": "suvidha-one-auth-service"
}
```

#### Refresh Token
- Format: UUID stored in database
- Linked to user_id and session_id
- Single-use (rotated on refresh)
- TTL: 7 days

### 4.3 Token Endpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐    OTP/Scan    ┌─────────────┐                  │
│   │  Kiosk   │ ─────────────►│  API Gateway │                  │
│   │   UI     │                │  (Validate)  │                  │
│   └──────────┘                └──────┬───────┘                  │
│                                     │                           │
│                                     ▼                           │
│                              ┌─────────────┐                   │
│                              │ Auth Service │                   │
│                              │  - Validate  │                   │
│                              │  - Generate  │                   │
│                              └──────┬───────┘                   │
│                                     │                           │
│    ┌───────────────────────────────┼───────────────────────┐  │
│    │                               ▼                       │  │
│    │  ┌─────────────────────────────────────────────────┐  │  │
│    │  │  JWT Access Token (15 min)                      │  │  │
│    │  │  { sub, session_id, kiosk_id, auth_method, exp } │  │  │
│    │  └─────────────────────────────────────────────────┘  │  │
│    │                                                       │  │
│    │  ┌─────────────────────────────────────────────────┐  │  │
│    │  │  Refresh Token (7 days)                         │  │  │
│    │  │  UUID stored in DB + Redis                      │  │  │
│    │  └─────────────────────────────────────────────────┘  │  │
│    │                                                       │  │
│    └───────────────────────────────────────────────────────┘  │
│                                     │                           │
│                                     ▼                           │
│                              ┌─────────────┐                   │
│                              │   Redis     │                   │
│                              │  Session    │                   │
│                              │  Cache      │                   │
│                              └─────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Service Communication

### 5.1 Inter-Service Communication

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVICE-TO-SERVICE COMMUNICATION               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐                                                   │
│  │  API Gateway │                                                   │
│  │   (Kong)     │                                                   │
│  └──────┬───────┘                                                   │
│         │                                                            │
│  ┌──────┴───────┐                                                   │
│  │  Service     │                                                   │
│  │  Mesh        │                                                   │
│  │  (Internal)  │                                                   │
│  └──────┬───────┘                                                   │
│         │                                                            │
│    ┌────┴────┐ ┌─────┴────┐ ┌─────┴────┐ ┌─────┴────┐              │
│    │  Auth   │ │ Payment  │ │ Utility  │ │Grievance│              │
│    │ Service │ │ Service  │ │ Service  │ │ Service │              │
│    └────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘              │
│         │            │            │            │                   │
│         └────────────┴─────┬───────┴────────────┘                   │
│                            │                                        │
│                     ┌──────┴───────┐                                 │
│                     │    Redis     │                                 │
│                     │   (Shared)   │                                 │
│                     └──────────────┘                                 │
│                            │                                         │
│                     ┌──────┴───────┐                                 │
│                     │  PostgreSQL  │                                 │
│                     │   (Primary)  │                                 │
│                     └──────────────┘                                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2 Event-Driven Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      EVENT-DRIVEN ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────┐     ┌────────────┐     ┌────────────┐              │
│  │  Payment   │     │ Notification│    │  Audit     │              │
│  │  Service   │────►│  Service    │────│  Logger    │              │
│  └────────────┘     └────────────┘     └────────────┘              │
│         │                  │                   │                   │
│         │    Payment       │    Send SMS/      │   Log action     │
│         │    Success       │    WhatsApp        │   to database   │
│         │                  │                   │                   │
│         ▼                  ▼                   ▼                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    KAFKA / REDIS PUBSUB                     │   │
│  │  Topic: payment.success, payment.failed, grievance.created │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 6. Network & Security Architecture

### 6.1 Network Topology
```
┌──────────────────────────────────────────────────────────────────────────┐
│                         NETWORK ARCHITECTURE                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │                        INTERNET                                 │    │
│   └──────────────────────────┬────────────────────────────────────┘    │
│                              │                                             │
│                              ▼                                             │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │                    AWS CLOUD / ON-PREM                         │    │
│   │  ┌─────────────────────────────────────────────────────────┐   │    │
│   │  │                  DMZ LAYER                              │   │    │
│   │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │    │
│   │  │  │  WAF        │  │  CDN        │  │  DDoS       │    │   │    │
│   │  │  │  (Cloudflare)│  │  (Static)  │  │  Protection │    │   │    │
│   │  │  └─────────────┘  └─────────────┘  └─────────────┘    │   │    │
│   │  └─────────────────────────────────────────────────────────┘   │    │
│   │                              │                                  │    │
│   │                              ▼                                  │    │
│   │  ┌─────────────────────────────────────────────────────────┐   │    │
│   │  │               API GATEWAY CLUSTER                      │   │    │
│   │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │   │    │
│   │  │  │ Kong #1 │ │ Kong #2 │ │ Kong #3 │  (Load Balanced)  │   │    │
│   │  │  └─────────┘ └─────────┘ └─────────┘                   │   │    │
│   │  └─────────────────────────────────────────────────────────┘   │    │
│   │                              │                                  │    │
│   │                              ▼                                  │    │
│   │  ┌─────────────────────────────────────────────────────────┐   │    │
│   │  │            KUBERNETES CLUSTER (K3s)                     │   │    │
│   │  │                                                       │   │    │
│   │  │  ┌───────────┐ ┌───────────┐ ┌───────────┐          │   │    │
│   │  │  │ Auth Svc   │ │ Payment   │ │ Utility   │          │   │    │
│   │  │  │ (Node.js)  │ │ Service   │ │ Service   │          │   │    │
│   │  │  │            │ │ (Rust)    │ │ (Node.js) │          │   │    │
│   │  │  └───────────┘ └───────────┘ └───────────┘          │   │    │
│   │  │                                                       │   │    │
│   │  │  ┌───────────┐ ┌───────────┐ ┌───────────┐          │   │    │
│   │  │  │Grievance  │ │ Document  │ │Notification│          │   │    │
│   │  │  │ Service   │ │ Service   │ │ Service   │          │   │    │
│   │  │  │ (Node.js) │ │ (Node.js) │ │ (Node.js) │          │   │    │
│   │  │  └───────────┘ └───────────┘ └───────────┘          │   │    │
│   │  └─────────────────────────────────────────────────────────┘   │    │
│   │                              │                                  │    │
│   │                              ▼                                  │    │
│   │  ┌─────────────────────────────────────────────────────────┐   │    │
│   │  │                  DATA LAYER                             │   │    │
│   │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │    │
│   │  │  │PostgreSQL│  │  Redis   │  │  MinIO   │              │   │    │
│   │  │  │ Primary  │  │ Cluster  │  │ Cluster  │              │   │    │
│   │  │  └──────────┘  └──────────┘  └──────────┘              │   │    │
│   │  └─────────────────────────────────────────────────────────┘   │    │
│   │                                                                  │    │
│   │  ┌─────────────────────────────────────────────────────────┐   │    │
│   │  │              GOV NETWORK (VPN/mTLS)                    │   │    │
│   │  │  UIDAI ◄─────► NPCI ◄─────► DigiLocker ◄─────► DISCOM │   │    │
│   │  └─────────────────────────────────────────────────────────┘   │    │
│   │                                                                  │    │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │                    KIOSK (EDGE)                                 │    │
│   │  ┌──────────────────────────────────────────────────────────┐  │    │
│   │  │  Kiosk OS (Ubuntu/Android)                               │  │    │
│   │  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐   │  │    │
│   │  │  │  React UI  │ │ Service    │ │  Local Cache       │   │  │    │
│   │  │  │  (PWA)     │ │ Worker     │ │  (IndexedDB)       │   │  │    │
│   │  │  └────────────┘ └────────────┘ └────────────────────┘   │  │    │
│   │  └──────────────────────────────────────────────────────────┘  │    │
│   │                              │                                  │    │
│   │                4G LTE / WiFi / Ethernet                       │    │
│   └──────────────────────────────┬─────────────────────────────────┘    │
│                                  │                                      │
│                                  └──────────────────────────────────────►│
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Security Implementation

| Security Layer | Implementation |
|----------------|---------------|
| TLS | TLS 1.3 for all connections |
| API Gateway | Kong with JWT validation, rate limiting |
| Authentication | JWT + Refresh tokens, Aadhaar biometric |
| Data at Rest | PostgreSQL pgcrypto encryption |
| Data in Transit | mTLS for service-to-service |
| WAF | Cloudflare/AWS WAF rules |
| DDoS | Cloudflare/AWS Shield |
| Secrets | HashiCorp Vault |
| Audit | All API calls logged to audit_logs |

---

## 7. Data Flow Diagrams

### 7.1 Payment Flow
```
User → Kiosk UI → API Gateway → Auth Service → Payment Service
                                                    │
                                                    ▼
                                            NPCI/UPI Gateway
                                                    │
                                                    ▼
                                            Payment Success
                                                    │
                                        ┌───────────┴───────────┐
                                        ▼                       ▼
                               ┌─────────────┐         ┌─────────────┐
                               │ Notification│         │  Database   │
                               │ Service     │         │  (Postgres) │
                               │ (SMS/WA)   │         │  (Update)   │
                               └─────────────┘         └─────────────┘
                                        │                       │
                                        ▼                       ▼
                               ┌─────────────────────────────────┐
                               │         Receipt Generation      │
                               │    (PDF + Print + DigiLocker)   │
                               └─────────────────────────────────┘
```

### 7.2 Grievance Flow
```
User → Select Category → Enter Details → Upload Evidence → Submit
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Grievance Service   │
                    │   - Create ticket     │
                    │   - Generate ID       │
                    │   - Set SLA           │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            ┌──────────────┐      ┌──────────────────┐
            │ External     │      │ Notification     │
            │ (CPGRAMS)    │      │ Service (SMS)    │
            └──────────────┘      └──────────────────┘
                    │                       │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │    Status Update      │
                    │    (User can track)   │
                    └───────────────────────┘
```

---

## 8. Deployment Architecture

### 8.1 Kubernetes Resources

```yaml
# Service Deployment Example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: suvidha-one
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
        - name: auth-service
          image: suvidhaone/auth-service:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: suvidha-db-secret
                  key: url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: suvidha-jwt-secret
                  key: secret
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: suvidha-one
spec:
  selector:
    app: auth-service
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

### 8.2 Service Scaling

| Service | Replicas (Dev) | Replicas (Prod) | Auto-scale |
|---------|---------------|-----------------|------------|
| Auth Service | 1 | 3-10 | CPU > 70% |
| Payment Service | 1 | 5-20 | CPU > 60% |
| Utility Service | 1 | 3-10 | CPU > 70% |
| Grievance Service | 1 | 2-8 | CPU > 75% |
| Document Service | 1 | 2-5 | CPU > 80% |
| Notification Service | 1 | 2-8 | Queue depth |

---

## 9. Caching Strategy

| Cache Layer | Technology | TTL | Purpose |
|-------------|-----------|-----|---------|
| API Response | Redis | 5-30 min | Bill data, user profile |
| Sessions | Redis | 15 min | Active user sessions |
| Rate Limits | Redis | 1 min | API rate limiting |
| OTP | Redis | 5 min | OTP verification |
| Static Assets | CDN | 24 hours | JS, CSS, images |
| Service Definitions | IndexedDB | Persistent | Offline service list |
| User Preferences | LocalStorage | Session | Font size, language |

---

## 10. Error Handling & Recovery

### 10.1 Error Codes

| Code Range | Category |
|------------|----------|
| 1000-1999 | Authentication errors |
| 2000-2999 | Payment errors |
| 3000-3999 | Bill/Utility errors |
| 4000-4999 | Grievance errors |
| 5000-5999 | Certificate errors |
| 9000-9999 | System errors |

### 10.2 Retry Strategy

| Scenario | Retry Count | Backoff |
|----------|-------------|---------|
| Network timeout | 3 | Exponential |
| Payment gateway | 2 | Linear |
| External API (UIDAI) | 3 | Exponential |
| Database connection | 5 | Exponential |

---

## 11. Monitoring & Observability

### 11.1 Metrics

| Metric | Type | Target |
|--------|------|--------|
| API Latency (p95) | Histogram | < 500ms |
| Payment Success Rate | Gauge | > 99.5% |
| Auth Success Rate | Gauge | > 98% |
| Kiosk Uptime | Gauge | > 99.9% |
| Error Rate | Counter | < 0.1% |

### 11.2 Alert Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | Error rate > 5% for 5 min | Critical |
| Payment Failure | > 10% failures | High |
| Kiosk Offline | > 20 kiosks offline | High |
| Database Connection | > 80% max connections | Critical |
| API Latency | p95 > 2s for 10 min | Medium |

---

## 12. File Structure

```
suvidha-one/
├── frontend/                    # Kiosk UI (React/Next.js)
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── screens/             # Screen components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API service calls
│   │   ├── stores/              # Zustand state stores
│   │   ├── utils/               # Utility functions
│   │   ├── i18n/                # Internationalization
│   │   └── styles/              # Global styles
│   └── public/
│       └── icons/               # Static icons
│
├── backend/                     # Backend services
│   ├── auth-service/           # Authentication service
│   ├── payment-service/        # Payment processing
│   ├── utility-service/        # Bill/Utility operations
│   ├── grievance-service/     # Complaint management
│   ├── document-service/      # Certificate handling
│   ├── notification-service/  # SMS/WhatsApp
│   └── api-gateway/           # Kong configuration
│
├── infrastructure/             # Infrastructure as Code
│   ├── kubernetes/             # K8s manifests
│   ├── terraform/              # Terraform configs
│   └── docker/                # Dockerfiles
│
├── database/                   # Database migrations
│   └── migrations/
│
└── docs/                       # Documentation
    ├── PRD_file.md
    ├── UI_Typography_Spec.md
    └── System_Design_Architecture.md
```

---

## 13. Quick Reference

### Environment Variables
```
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/suvidha
REDIS_URL=redis://host:6379
JWT_SECRET=<jwt-secret>
UIDAI_API_KEY=<aua-key>
NPCI_MERCHANT_ID=<merchant-id>
DIGILOCKER_CLIENT_ID=<client-id>

# Frontend
NEXT_PUBLIC_API_URL=https://api.suvidhaone.gov.in/v1
NEXT_PUBLIC_KIOSK_ID=<kiosk-id>
```

### Common Ports
| Service | Port |
|---------|------|
| API Gateway | 80, 443 |
| Auth Service | 3001 |
| Payment Service | 3002 |
| Utility Service | 3003 |
| Grievance Service | 3004 |
| Document Service | 3005 |
| Notification Service | 3006 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| MinIO | 9000 |
| Prometheus | 9090 |
| Grafana | 3000 |
