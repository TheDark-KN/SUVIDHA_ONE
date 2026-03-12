# SUVIDHA ONE Backend - Complete API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Services Overview](#services-overview)
4. [API Collection](#api-collection)
5. [Error Codes Reference](#error-codes-reference)
6. [Data Models](#data-models)
7. [Authentication & Authorization](#authentication--authorization)
8. [Known Issues & Build Errors](#known-issues--build-errors)

---

## Overview

SUVIDHA ONE is a unified citizen service kiosk backend built with Rust and Axum framework. It provides multiple microservices for authentication, payments, utility bill management, grievance redressal, document management, notifications, session management, and kiosk registration.

**Version:** 1.0.0  
**Framework:** Axum 0.7 + Tokio  
**Database:** PostgreSQL 16  
**Cache:** Redis 7  
**Authentication:** JWT (RS256)

---

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

---

## Services Overview

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

---

## API Collection

### Authentication Service (Port: 3001)

#### 1. Send OTP

**Endpoint:** `POST /auth/otp/send`

**Description:** Sends an OTP to the user's mobile number for authentication.

**Request Body:**
```json
{
  "mobile": "9876543210",
  "kiosk_id": "KIOSK001"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "message": "OTP sent successfully",
    "expires_in": 300
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-03-10T10:00:00Z",
    "version": "1.0.0"
  }
}
```

**Rate Limiting:** Maximum 3 OTP requests per 10 minutes per mobile number.

---

#### 2. Verify OTP

**Endpoint:** `POST /auth/otp/verify`

**Description:** Verifies the OTP and returns JWT access and refresh tokens.

**Request Body:**
```json
{
  "mobile": "9876543210",
  "otp": "123456",
  "kiosk_id": "KIOSK001"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440001",
    "timestamp": "2026-03-10T10:05:00Z",
    "version": "1.0.0"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid OTP (Error Code: 1003)
- `401 Unauthorized` - OTP Expired (Error Code: 1004)
- `429 Too Many Requests` - Maximum OTP attempts exceeded (Error Code: 1010)

---

#### 3. Refresh Token

**Endpoint:** `POST /auth/refresh`

**Description:** Refreshes access token using a valid refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440002",
    "timestamp": "2026-03-10T10:20:00Z",
    "version": "1.0.0"
  }
}
```

**Security:** Implements refresh token rotation. Reusing a refresh token invalidates the entire token family.

---

#### 4. Logout

**Endpoint:** `POST /auth/logout`

**Description:** Invalidates the user session and logs them out.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "data": {
    "message": "Logged out successfully"
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440003",
    "timestamp": "2026-03-10T10:30:00Z",
    "version": "1.0.0"
  }
}
```

---

#### 5. Health Check

**Endpoint:** `GET /health` or `GET /ready`

**Description:** Returns the health status of the auth service.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "auth-service",
  "version": "1.0.0"
}
```

---

### Payment Service (Port: 3002)

#### 1. Initiate Payment

**Endpoint:** `POST /payments/initiate`

**Description:** Initiates a payment for one or more bills.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "bill_ids": ["550e8400-e29b-41d4-a716-446655440000"],
  "method": "upi",
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "payment_id": "550e8400-e29b-41d4-a716-446655440002",
    "transaction_ref": "TXN1234567890123",
    "amount": "1500.00",
    "status": "pending",
    "method": "upi",
    "qr_code": "upi://pay?pa=suvidha@bank&pn=SUVIDHA ONE&tn=TXN1234567890123&am=1500.00"
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440003",
    "timestamp": "2026-03-10T11:00:00Z",
    "version": "1.0.0"
  }
}
```

**Payment Methods:** `upi`, `card`, `bbps`

---

#### 2. Get Payment Status

**Endpoint:** `GET /payments/status/:payment_id`

**Description:** Retrieves the status of a payment.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "data": {
    "payment_id": "550e8400-e29b-41d4-a716-446655440002",
    "status": "success",
    "tx_ref": "TXN1234567890123",
    "amount": "1500.00",
    "paid_at": "2026-03-10T11:05:00Z"
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440004",
    "timestamp": "2026-03-10T11:06:00Z",
    "version": "1.0.0"
  }
}
```

---

#### 3. UPI Webhook Callback

**Endpoint:** `POST /webhooks/upi/callback`

**Description:** NPCI webhook callback for UPI payment status updates.

**Headers:**
```
X-NPCI-Signature: <signature>
```

**Request Body:**
```json
{
  "transaction_id": "TXN1234567890123",
  "status": "SUCCESS",
  "amount": 1500.00,
  "utr": "UPI123456789012",
  "timestamp": "2026-03-10T11:05:00Z"
}
```

**Response (200 OK):**
```
(empty response with 200 status)
```

---

### Utility Service (Port: 3003)

#### 1. Fetch Bills

**Endpoint:** `POST /bills/fetch`

**Description:** Fetches pending bills for a consumer.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "consumer_id": "CONSUMER001",
  "department": "electricity"
}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "bill_id": "550e8400-e29b-41d4-a716-446655440000",
      "consumer_id": "CONSUMER001",
      "amount": "1500.00",
      "due_date": "2026-04-15",
      "department": "electricity",
      "status": "pending",
      "description": "Monthly bill"
    }
  ],
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440005",
    "timestamp": "2026-03-10T12:00:00Z",
    "version": "1.0.0"
  }
}
```

**Departments:** `electricity`, `water`, `gas`, `municipal`

---

#### 2. Get Bill Details

**Endpoint:** `GET /bills/:bill_id`

**Description:** Retrieves detailed information about a specific bill.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "data": {
    "bill_id": "550e8400-e29b-41d4-a716-446655440000",
    "consumer_id": "CONSUMER001",
    "amount": "1500.00",
    "due_date": "2026-04-15",
    "department": "electricity",
    "status": "pending",
    "description": "Monthly bill"
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440006",
    "timestamp": "2026-03-10T12:05:00Z",
    "version": "1.0.0"
  }
}
```

---

#### 3. List Services

**Endpoint:** `GET /services`

**Description:** Lists all available utility services.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "electricity",
      "name": "Electricity Bill",
      "department": "DISCOM",
      "description": "Pay electricity bills",
      "icon": "bolt"
    },
    {
      "id": "water",
      "name": "Water Bill",
      "department": "Municipal",
      "description": "Pay water bills",
      "icon": "droplet"
    },
    {
      "id": "gas",
      "name": "Gas Bill",
      "department": "PNGRB",
      "description": "Pay gas bills",
      "icon": "flame"
    },
    {
      "id": "property_tax",
      "name": "Property Tax",
      "department": "Municipal",
      "description": "Pay property tax",
      "icon": "home"
    }
  ],
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440007",
    "timestamp": "2026-03-10T12:10:00Z",
    "version": "1.0.0"
  }
}
```

---

### Grievance Service (Port: 3004)

#### 1. Create Grievance

**Endpoint:** `POST /grievances`

**Description:** Files a new grievance/complaint.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "category": "billing",
  "department": "electricity",
  "subject": "Incorrect billing amount",
  "description": "The bill amount is higher than expected based on consumption."
}
```

**Response (201 Created):**
```json
{
  "data": {
    "grievance_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "category": "billing",
    "department": "electricity",
    "subject": "Incorrect billing amount",
    "description": "The bill amount is higher than expected based on consumption.",
    "status": "open",
    "priority": "medium",
    "created_at": "2026-03-10T13:00:00Z",
    "updated_at": "2026-03-10T13:00:00Z",
    "resolved_at": null
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440002",
    "timestamp": "2026-03-10T13:00:00Z",
    "version": "1.0.0"
  }
}
```

**Categories:** `billing`, `service`, `infrastructure`, `other`  
**Priorities:** `low`, `medium`, `high`, `critical`

---

#### 2. List Grievances

**Endpoint:** `GET /grievances`

**Description:** Lists all grievances for the authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "grievance_id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "category": "billing",
      "department": "electricity",
      "subject": "Incorrect billing amount",
      "description": "The bill amount is higher than expected based on consumption.",
      "status": "open",
      "priority": "medium",
      "created_at": "2026-03-10T13:00:00Z",
      "updated_at": "2026-03-10T13:00:00Z",
      "resolved_at": null
    }
  ],
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440003",
    "timestamp": "2026-03-10T13:05:00Z",
    "version": "1.0.0"
  }
}
```

---

#### 3. Get Grievance Details

**Endpoint:** `GET /grievances/:id`

**Description:** Retrieves detailed information about a specific grievance.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "data": {
    "grievance_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "category": "billing",
    "department": "electricity",
    "subject": "Incorrect billing amount",
    "description": "The bill amount is higher than expected based on consumption.",
    "status": "in_progress",
    "priority": "medium",
    "created_at": "2026-03-10T13:00:00Z",
    "updated_at": "2026-03-10T13:10:00Z",
    "resolved_at": null
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440004",
    "timestamp": "2026-03-10T13:15:00Z",
    "version": "1.0.0"
  }
}
```

---

#### 4. Update Grievance Status

**Endpoint:** `PATCH /grievances/:id/update`

**Description:** Updates the status of a grievance (admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "message": "Grievance updated successfully"
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440005",
    "timestamp": "2026-03-10T13:20:00Z",
    "version": "1.0.0"
  }
}
```

**Status Values:** `open`, `in_progress`, `resolved`, `closed`

---

### Document Service (Port: 3005)

#### 1. Apply for Document

**Endpoint:** `POST /documents/apply`

**Description:** Applies for a new certificate or document.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "doc_type": "birth_certificate",
  "name": "Birth Certificate Application"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "document_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Application submitted"
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440001",
    "timestamp": "2026-03-10T14:00:00Z",
    "version": "1.0.0"
  }
}
```

**Document Types:** `birth_certificate`, `caste_certificate`, `income_certificate`, `residence_certificate`, `aadhaar_card`, `voter_id`

---

#### 2. List Documents

**Endpoint:** `GET /documents`

**Description:** Lists all documents for the authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "document_id": "550e8400-e29b-41d4-a716-446655440000",
      "doc_type": "birth_certificate",
      "name": "Birth Certificate Application",
      "status": "pending",
      "created_at": "2026-03-10T14:00:00Z"
    }
  ],
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440002",
    "timestamp": "2026-03-10T14:05:00Z",
    "version": "1.0.0"
  }
}
```

---

#### 3. Get Document Status

**Endpoint:** `GET /documents/:id`

**Description:** Retrieves the status of a document application.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "data": {
    "document_id": "550e8400-e29b-41d4-a716-446655440000",
    "doc_type": "birth_certificate",
    "name": "Birth Certificate Application",
    "status": "applied",
    "created_at": "2026-03-10T14:00:00Z"
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440003",
    "timestamp": "2026-03-10T14:10:00Z",
    "version": "1.0.0"
  }
}
```

**Document Status:** `pending`, `applied`, `issued`, `rejected`

---

### Notification Service (Port: 3006)

#### 1. Send Notification

**Endpoint:** `POST /notifications/send`

**Description:** Sends a notification via SMS, WhatsApp, or push.

**Request Body:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "notification_type": "otp",
  "channel": "sms",
  "recipient": "+919876543210",
  "message": "Your OTP is 123456"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "notification_id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "sent"
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440002",
    "timestamp": "2026-03-10T15:00:00Z",
    "version": "1.0.0"
  }
}
```

**Notification Types:** `otp`, `payment_receipt`, `bill_reminder`, `grievance_update`, `document_ready`  
**Channels:** `sms`, `whatsapp`, `push`, `email`

---

### Session Service (Port: 3007)

#### 1. Create Session

**Endpoint:** `POST /sessions/create`

**Description:** Creates a new kiosk session.

**Request Body:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "kiosk_id": "KIOSK001"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440001",
    "expires_in": 900
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440002",
    "timestamp": "2026-03-10T16:00:00Z",
    "version": "1.0.0"
  }
}
```

---

#### 2. Refresh Session

**Endpoint:** `POST /sessions/refresh`

**Description:** Extends the session timeout.

**Request Body:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "message": "Session refreshed",
    "expires_in": 900
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440003",
    "timestamp": "2026-03-10T16:05:00Z",
    "version": "1.0.0"
  }
}
```

---

#### 3. Get Session

**Endpoint:** `GET /sessions/:session_id`

**Description:** Retrieves session details.

**Response (200 OK):**
```json
{
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "kiosk_id": "KIOSK001",
    "created_at": "2026-03-10T16:00:00Z",
    "last_active": "2026-03-10T16:05:00Z"
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440004",
    "timestamp": "2026-03-10T16:06:00Z",
    "version": "1.0.0"
  }
}
```

---

#### 4. Delete Session

**Endpoint:** `DELETE /sessions/:session_id`

**Description:** Terminates a session.

**Response (200 OK):**
```json
{
  "data": {
    "message": "Session deleted"
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440005",
    "timestamp": "2026-03-10T16:10:00Z",
    "version": "1.0.0"
  }
}
```

---

### Kiosk Service (Port: 3008)

#### 1. Register Kiosk

**Endpoint:** `POST /kiosks/register`

**Description:** Registers a new kiosk.

**Request Body:**
```json
{
  "kiosk_id": "KIOSK001",
  "state_code": "UP",
  "district_code": "LKO",
  "location": "Lucknow Main Office"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "kiosk_id": "KIOSK001",
    "status": "registered"
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440001",
    "timestamp": "2026-03-10T17:00:00Z",
    "version": "1.0.0"
  }
}
```

---

#### 2. List Kiosks

**Endpoint:** `GET /kiosks`

**Description:** Lists all registered kiosks (limited to 100).

**Response (200 OK):**
```json
{
  "data": [
    {
      "kiosk_id": "KIOSK001",
      "state_code": "UP",
      "district_code": "LKO",
      "location": "Lucknow Main Office",
      "status": "active",
      "last_heartbeat": "2026-03-10T17:05:00Z"
    }
  ],
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440002",
    "timestamp": "2026-03-10T17:06:00Z",
    "version": "1.0.0"
  }
}
```

---

#### 3. Get Kiosk Details

**Endpoint:** `GET /kiosks/:kiosk_id`

**Description:** Retrieves details of a specific kiosk.

**Response (200 OK):**
```json
{
  "data": {
    "kiosk_id": "KIOSK001",
    "state_code": "UP",
    "district_code": "LKO",
    "location": "Lucknow Main Office",
    "status": "active",
    "last_heartbeat": "2026-03-10T17:05:00Z"
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440003",
    "timestamp": "2026-03-10T17:07:00Z",
    "version": "1.0.0"
  }
}
```

---

#### 4. Send Heartbeat

**Endpoint:** `POST /kiosks/:kiosk_id/heartbeat`

**Description:** Updates kiosk heartbeat timestamp.

**Response (200 OK):**
```json
{
  "data": {
    "message": "Heartbeat received"
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440004",
    "timestamp": "2026-03-10T17:08:00Z",
    "version": "1.0.0"
  }
}
```

---

#### 5. Get Kiosk Config

**Endpoint:** `GET /kiosks/:kiosk_id/config`

**Description:** Retrieves kiosk configuration.

**Response (200 OK):**
```json
{
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
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440005",
    "timestamp": "2026-03-10T17:09:00Z",
    "version": "1.0.0"
  }
}
```

---

## Error Codes Reference

### Authentication Errors (1000-1099)

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| 1001 | 401 | Missing authentication token |
| 1002 | 401 | Token expired |
| 1003 | 401 | Invalid OTP |
| 1004 | 401 | OTP expired |
| 1005 | 401 | Session invalidated |
| 1006 | 401 | Refresh token replay detected |
| 1007 | 401 | Invalid authentication token |
| 1008 | 401 | Aadhaar verification failed |
| 1009 | 401 | QR code invalid |
| 1010 | 429 | Maximum OTP attempts exceeded |

### Payment Errors (2000-2099)

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| 2001 | 409 | Bill already paid |
| 2002 | 403 | Unauthorized payment |
| 2003 | 502 | Payment gateway error |
| 2004 | 400 | Invalid payment amount |
| 2005 | 504 | Payment timeout |

### Utility Errors (3000-3099)

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| 3001 | 404 | Bill not found |
| 3002 | 502 | BBPS error |
| 3003 | 404 | Consumer not found |

### Grievance Errors (4000-4099)

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| 4001 | 404 | Grievance not found |
| 4002 | 409 | Grievance already closed |
| 4003 | 400 | Invalid grievance status |

### Document Errors (5000-5099)

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| 5001 | 404 | Document not found |
| 5002 | 502 | DigiLocker error |
| 5003 | 403 | Not eligible for certificate |

### Notification Errors (6000-6099)

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| 6001 | 502 | SMS gateway error |
| 6002 | 502 | WhatsApp error |

### General Errors (9000-9999)

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| 9001 | 400 | Validation error |
| 9002 | 404 | Resource not found |
| 9003 | 403 | Forbidden |
| 9004 | 429 | Rate limit exceeded |
| 9005 | 502 | External service unavailable |
| 9006 | 503 | Cache service unavailable |
| 9999 | 500 | Internal server error |

---

## Data Models

### User
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "aadhaar_id_hash": "abc123...",
  "mobile_hash": "def456...",
  "full_name": "John Doe",
  "state_code": "UP",
  "preferred_language": "en",
  "created_at": "2026-03-10T10:00:00Z",
  "updated_at": "2026-03-10T10:00:00Z",
  "is_active": true
}
```

### Session
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "kiosk_id": "KIOSK001",
  "auth_method": "otp",
  "created_at": "2026-03-10T10:00:00Z",
  "last_active": "2026-03-10T10:05:00Z",
  "idle_timeout": 180,
  "hard_timeout": 900
}
```

### PaymentRecord
```json
{
  "payment_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "amount": "1500.00",
  "tx_ref": "TXN1234567890123",
  "status": "success",
  "method": "upi",
  "created_at": "2026-03-10T11:00:00Z"
}
```

### Grievance
```json
{
  "grievance_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "category": "billing",
  "department": "electricity",
  "subject": "Incorrect billing amount",
  "description": "The bill amount is higher than expected.",
  "status": "open",
  "priority": "medium",
  "created_at": "2026-03-10T13:00:00Z",
  "updated_at": "2026-03-10T13:00:00Z",
  "resolved_at": null
}
```

### Document
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "doc_type": "birth_certificate",
  "name": "Birth Certificate Application",
  "digilocker_id": null,
  "status": "pending",
  "created_at": "2026-03-10T14:00:00Z",
  "updated_at": "2026-03-10T14:00:00Z"
}
```

### Kiosk
```json
{
  "kiosk_id": "KIOSK001",
  "state_code": "UP",
  "district_code": "LKO",
  "location": "Lucknow Main Office",
  "status": "active",
  "last_heartbeat": "2026-03-10T17:05:00Z",
  "config_version": "1.0.0",
  "created_at": "2026-03-10T09:00:00Z"
}
```

---

## Authentication & Authorization

### JWT Token Structure

**Access Token Claims:**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "jti": "550e8400-e29b-41d4-a716-446655440001",
  "iat": 1710072000,
  "exp": 1710072900,
  "iss": "suvidha-one-auth",
  "aud": ["suvidha-one-api"],
  "kiosk": "KIOSK001",
  "roles": ["citizen"],
  "lang": "en"
}
```

**Refresh Token Claims:**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "jti": "550e8400-e29b-41d4-a716-446655440001",
  "iat": 1710072000,
  "exp": 1710676800,
  "family": "550e8400-e29b-41d4-a716-446655440002"
}
```

### User Roles

| Role | Description |
|------|-------------|
| `citizen` | Regular citizen user |
| `kiosk_admin` | Kiosk administrator |
| `dept_officer` | Department officer |
| `system_admin` | System administrator |
| `service_account` | Service-to-service communication |

### Token Lifetimes

| Token Type | Lifetime |
|------------|----------|
| Access Token | 15 minutes (900 seconds) |
| Refresh Token | 7 days (604800 seconds) |
| OTP | 5 minutes (300 seconds) |
| Session | 15 minutes idle, 15 minutes hard timeout |

---

## Known Issues & Build Errors

### Current Build Status: ❌ Compilation Errors

The following issues were identified during the build process:

#### 1. Redis Version Conflict
**Error:** `the trait bound 'deadpool_redis::redis::aio::Connection: redis::aio::ConnectionLike' is not satisfied`

**Cause:** Version mismatch between `deadpool-redis` (uses redis 0.23) and direct `redis` dependency (0.24).

**Affected Services:** All services using Redis (auth-service, session-service, payment-service, utility-service)

**Workaround:** Rate limiting middleware temporarily disabled.

#### 2. Missing Handlers Module
**Error:** `file not found for module 'handlers'` in grievance-service

**Cause:** Missing `handlers/mod.rs` file structure.

**Affected Services:** grievance-service

#### 3. SQLx Offline Mode
**Error:** `set 'DATABASE_URL' to use query macros online, or run 'cargo sqlx prepare'`

**Cause:** SQLx requires database connection for query validation or pre-compiled query cache.

**Affected Services:** document-service, notification-service, kiosk-service, payment-service, grievance-service

**Solution:** 
```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/suvidha
cargo sqlx prepare
```

#### 4. Axum Version Conflict
**Error:** `the trait 'Handler<_, _>' is not implemented`

**Cause:** Mixed usage of axum 0.6 and 0.7 versions in dependencies.

**Affected Services:** payment-service

#### 5. Duplicate Imports
**Error:** `'get' reimported here`

**Cause:** Multiple import statements for the same item.

**Affected Services:** kiosk-service, session-service

### Resolution Steps

1. **Set up environment:**
```bash
cp .env.example .env
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/suvidha
export REDIS_URL=redis://localhost:6379
```

2. **Start dependencies:**
```bash
docker-compose up -d postgres redis
```

3. **Run migrations:**
```bash
sqlx migrate run
```

4. **Prepare SQLx cache:**
```bash
cargo sqlx prepare
```

5. **Build:**
```bash
cargo build --release
```

---

## Security Features

- **JWT with RS256:** Asymmetric encryption for tokens
- **OTP Hashing:** HMAC-SHA256 hashed OTPs (never stored in plaintext)
- **Rate Limiting:** Configurable rate limits on endpoints
- **SQL Injection Prevention:** SQLx compile-time query validation
- **Security Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Input Validation:** Validator crate for request validation
- **Refresh Token Rotation:** Prevents token replay attacks

---

## Testing

```bash
# Run all tests
cargo test

# Run specific service tests
cargo test -p auth-service

# Run with coverage
cargo tarpaulin --out Xml
```

---

## License

Proprietary - SUVIDHA ONE Project

---

## Support

For issues and queries, please refer to the project documentation or contact the development team.
