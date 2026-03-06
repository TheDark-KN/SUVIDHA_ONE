# SUVIDHA ONE - Technical Documentation File

## Comprehensive Technical Information for Project Evaluation

---

> **Document Purpose**: This file consolidates all technical details required for project evaluation, covering development status, features, UI/UX design, deployment feasibility, accessibility, and security architecture.

---

# 1. PROJECT MATURITY & DEVELOPMENT STATUS

## 1.1 Current Development Stage

| Parameter | Status |
|-----------|--------|
| **Current Stage** | MVP (Minimum Viable Product) Developed |
| **Prototype Status** | Ready for Testing |
| **Demo Availability** | Available (Video Walkthrough) |

## 1.2 Repository & Demo Information

| Resource | Details |
|----------|---------|
| **GitHub Repository** | Available upon request |
| **Video Demo Link** | Available upon request |
| **Demo Environment** | Staging environment configured |
| **Documentation** | Complete (PRD, Architecture, UI Specs, Wireframes) |

---

# 2. DEPARTMENT-WISE FEATURES IN KIOSK TOUCH INTERFACE

## 2.1 Gas Services Module

| Feature | Description | Priority |
|---------|-------------|----------|
| **Cylinder Booking** | Book new LPG cylinder | P0 |
| **Refill Status** | Check delivery status | P0 |
| **KYC Update** | Update KYC documents | P1 |
| **Leak Complaint** | Report gas leak | P0 |
| **Subsidy Status** | Check LPG subsidy status | P1 |
| **Connection New** | New gas connection application | P1 |
| **Payment History** | View past transactions | P2 |

## 2.2 Electricity Services Module

| Feature | Description | Priority |
|---------|-------------|----------|
| **Bill Payment** | Pay electricity bills | P0 |
| **New Connection** | Apply for new connection | P0 |
| **Complaint Filing** | Report power issues | P0 |
| **Status Check** | Track application/complaint | P0 |
| **Load Enhancement** | Request load increase | P1 |
| **Bill History** | View past bills | P1 |
| **Outage Information** | View scheduled outages | P2 |
| **Solar Net Metering** | Apply for net metering | P2 |

## 2.3 Municipal Cooperation Services Module

| Feature | Description | Priority |
|---------|-------------|----------|
| **Property Tax** | Pay property tax | P0 |
| **Trade License** | Apply/renew trade license | P0 |
| **Birth Certificate** | Apply for birth certificate | P0 |
| **Death Certificate** | Apply for death certificate | P0 |
| **Marriage Certificate** | Apply for marriage certificate | P1 |
| **Water Bill Payment** | Pay water utility bills | P0 |
| **Waste Management** | File waste complaint | P1 |
| **Building Permission** | Apply for building plan approval | P2 |
| **Mutation Request** | Property mutation application | P1 |
| **NOC Application** | Get No Objection Certificates | P1 |

## 2.4 Additional Services

| Feature | Description | Priority |
|---------|-------------|----------|
| **Grievance/Complaint** | File and track complaints | P0 |
| **Certificate Services** | Income, Caste, Residence | P1 |
| **DigiLocker Integration** | Access digital documents | P1 |
| **Government Schemes** | Check eligible schemes | P2 |
| **Public Information** | View government notices | P2 |

---

# 3. UI/UX SUITABILITY FOR TOUCH-BASED KIOSK INTERFACE

## 3.1 Touch-Optimized Design

### Yes - The UI is Specifically Designed for Touch-Based Kiosk Usage

The SUVIDHA ONE interface is purpose-built for kiosk deployment with the following design considerations:

## 3.2 Kiosk & Touch Interaction Constraints

### 3.2.1 Touch Target Specifications

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TOUCH TARGET REQUIREMENTS                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MINIMUM TOUCH TARGET SIZE: 60x60mm (equivalent to ~88x88px at       │
│  standard kiosk resolution)                                            │
│                                                                         │
│  RECOMMENDED TARGET SIZE: 80x80mm for primary actions                 │
│                                                                         │
│  SPACING BETWEEN TARGETS: 15mm minimum to prevent mis-taps          │
│                                                                         │
│  Button Height: Minimum 100px (approx 70mm)                           │
│  Service Icons: 150-180px in main grid                                │
│  Navigation Icons: 80px in bottom nav bar                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2.2 Screen Size Optimization

| Kiosk Screen Size | Grid Layout | Services Visible |
|-------------------|-------------|------------------|
| 32-inch | 3x2 grid | 6 services |
| 43-inch | 3x3 grid | 9 services |
| 55-inch | 4x3 grid | 12 services |

### 3.2.3 Visual Design for Kiosk

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VISUAL DESIGN PRINCIPLES                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ✓ ICON-FIRST LAYOUT                                                  │
│    - Icons placed ABOVE text labels                                    │
│    - Icons dominate (120-180px) with short label below                │
│    - Enables navigation without reading                                │
│                                                                         │
│  ✓ HIGH CONTRAST MODE                                                 │
│    - WCAG AA ≥ 4.5:1 contrast ratio                                   │
│    - Dark text on light background                                    │
│    - Toggle for high-contrast (black bg, white text)                  │
│                                                                         │
│  ✓ MINIMAL COGNITIVE LOAD                                             │
│    - Maximum 4-6 options per screen                                   │
│    - Pagination for service lists                                     │
│    - Clear visual hierarchy                                           │
│                                                                         │
│  ✓ LARGE FORMAT TYPOGRAPHY                                            │
│    - Minimum 48px for body text                                       │
│    - Screen titles: 72-96px                                           │
│    - Visible from 2-meter distance                                    │
│                                                                         │
│  ✓ VOICE GUIDANCE (MANDATORY)                                         │
│    - Auto-play on all screens                                         │
│    - TTS in selected language                                         │
│    - Skip option available                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2.4 Interaction Design

| Constraint | Implementation |
|------------|----------------|
| **Inactivity Timeout** | 3-minute warning, 30-second countdown |
| **Touch Feedback** | Visual + haptic (where available) |
| **Error Prevention** | Confirmation dialogs for payments |
| **Recovery Paths** | Never dead-end; always provide back/retry/help |
| **Session Management** | Auto-logout clears all data from memory |

---

# 4. DEPLOYMENT & PRACTICAL FEASIBILITY

## 4.1 Target Deployment Environment

### Recommended: Hybrid Deployment Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HYBRID DEPLOYMENT ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                    CLOUD COMPONENTS                            │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │   │
│   │  │   API       │  │  Payment    │  │ Notification│          │   │
│   │  │   Gateway   │  │  Gateway    │  │  Service    │          │   │
│   │  │  (Kong)     │  │  (NPCI)     │  │  (SMS/WA)   │          │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘          │   │
│   │         │                 │                 │                │   │
│   │         └─────────────────┼─────────────────┘                │   │
│   │                           ▼                                      │   │
│   │              ┌─────────────────────────┐                       │   │
│   │              │     Kubernetes Cluster   │                       │   │
│   │              │   (Microservices Mesh)    │                       │   │
│   │              └─────────────────────────┘                       │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                    │                                   │
│                                    │ HTTPS                             │
│                                    ▼                                   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                    ON-PREMISE COMPONENTS                       │   │
│   │  ┌─────────────────────────────────────────────────────────┐   │   │
│   │  │              KIOSK UNITS (Edge Devices)                 │   │   │
│   │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐          │   │   │
│   │  │  │  Kiosk 1  │  │  Kiosk 2  │  │  Kiosk N  │          │   │   │
│   │  │  │ (React UI)│  │ (React UI)│  │ (React UI)│          │   │   │
│   │  │  └───────────┘  └───────────┘  └───────────┘          │   │   │
│   │  └─────────────────────────────────────────────────────────┘   │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Infrastructure Requirements

### Per Kiosk Unit

| Component | Specification |
|-----------|---------------|
| **Display** | 32-55" touchscreen, 1000+ nit brightness |
| **Touch Technology** | Projected Capacitive (PCAP) or Infrared, 10-point multi-touch |
| **Processor** | Intel Core i5 / ARM Cortex-A72 equivalent |
| **RAM** | 8GB minimum |
| **Storage** | 128GB SSD |
| **Connectivity** | 4G LTE (primary), Wi-Fi 6 (secondary), Ethernet (fallback) |
| **Camera** | 2MP with QR/barcode scanner |
| **Printer** | 80mm thermal receipt printer |
| **Audio** | 10W stereo speakers, noise-canceling microphone |
| **Enclosure** | IP54 rated, vandal-proof, wheelchair accessible height |

### Backend Infrastructure (Per 100 Kiosks)

| Resource | Requirement |
|----------|-------------|
| **API Gateway** | 3-node Kong cluster |
| **Application Servers** | 6-10 pods (Kubernetes) |
| **Database** | PostgreSQL 16 with 3-node cluster |
| **Cache** | Redis 7.x cluster (3 nodes) |
| **Object Storage** | MinIO cluster (3 nodes) |
| **CDN** | Cloudflare/AWS CloudFront |

## 4.3 Internet Dependency Assessment

| Mode | Dependency Level | Description |
|------|-----------------|-------------|
| **Authentication** | HIGH | Requires real-time UIDAI/NPCI verification |
| **Bill Payment** | HIGH | Real-time payment gateway communication |
| **Bill Fetch** | MEDIUM | Can cache bills for offline viewing |
| **Certificate Status** | MEDIUM | Can show cached status |
| **Grievance Filing** | MEDIUM | Queued offline, synced when online |
| **Information Display** | LOW | Cached from last sync |

### Internet Dependency Mitigation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INTERNET DEPENDENCY MITIGATION                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  HIGH DEPENDENCY SERVICES:                                             │
│  ├── Authentication (OTP/Aadhaar) - Requires online                    │
│  ├── Payment Processing - Requires online                             │
│  └── Real-time Bill Fetch - Requires online                            │
│                                                                         │
│  MEDIUM DEPENDENCY SERVICES:                                           │
│  ├── Certificate Applications - Queued, synced later                  │
│  ├── Grievance Filing - Queued, synced later                         │
│  └── Status Checks - Cached data shown                                │
│                                                                         │
│  LOW DEPENDENCY SERVICES:                                              │
│  ├── Service Information - Cached locally                             │
│  ├── Static Content - Served from CDN                                 │
│  └── Offline Forms - Available without internet                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 4.4 Offline Mode Support

### Yes - Offline Mode is Fully Supported

| Feature | Offline Capability |
|---------|-------------------|
| **Service List** | Full offline - cached |
| **Form Entry** | Full offline - queued |
| **Document Upload** | Full offline - queued |
| **Payment** | Not available offline |
| **Authentication** | Limited - uses cached session |
| **Receipt Printing** | Full offline - printed locally |

### Offline Sync Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    OFFLINE SYNC ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   KI OSK DEVICE                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  IndexedDB (Local Database)                                     │  │
│   │  ├── Pending Transactions Queue                                │  │
│   │  ├── Service Definitions Cache                                 │  │
│   │  ├── User Session (if active)                                  │  │
│   │  └── Last Sync Timestamp                                       │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│            │                                                           │
│            │ Auto-sync on connectivity restore                        │
│            ▼                                                           │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  Background Sync API                                           │  │
│   │  ├── Detect connectivity change                                │  │
│   │  ├── Process pending queue (FIFO)                              │  │
│   │  ├── Handle conflicts (server wins)                            │  │
│   │  └── Update local cache                                        │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   USER NOTIFICATION:                                                   │
│   ├── "Offline Mode" badge displayed                                  │
│   ├── Cached services available                                      │
│   ├── Transactions queued with confirmation                          │
│   └── Real-time sync status indicator                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 5. ACCESSIBILITY & INCLUSION DETAILS

## 5.1 Support for Visually Impaired Users

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VISUALLY IMPAIRED ACCESSIBILITY                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ✓ VOICE GUIDANCE (PRIMARY)                                            │
│    ├── Auto-play on every screen in selected language                 │
│    ├── Text-to-Speech (TTS) reads all content                         │
│    ├── Voice command recognition: "Bill Pay", "Help", "Back"         │
│    └── Adjustable speech speed (0.8x default)                         │
│                                                                         │
│  ✓ FONT SCALING                                                        │
│    ├── Normal Mode: 100% (default)                                     │
│    ├── Large Mode: 130%                                                │
│    └── Extra-Large Mode: 150%                                         │
│                                                                         │
│  ✓ HIGH CONTRAST MODE                                                  │
│    ├── Black background (#000000)                                      │
│    ├── White text (#FFFFFF)                                           │
│    ├── Yellow icons (#FFD700)                                         │
│    └── Toggle accessible from any screen                              │
│                                                                         │
│  ✓ SCREEN READER COMPATIBILITY                                         │
│    ├── ARIA labels on all interactive elements                        │
│    ├── Proper heading hierarchy                                       │
│    └── Focus indicators for keyboard navigation                       │
│                                                                         │
│  ✓ TACTILE FEEDBACK                                                   │
│    ├── Haptic feedback on touch                                       │
│    ├── Audio feedback for actions                                     │
│    └── Distinct sounds for success/error                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Support for Senior Citizens

| Feature | Implementation |
|---------|----------------|
| **Large Touch Targets** | Minimum 80x80mm buttons |
| **Simplified Mode** | Reduces to top 3 services |
| **High Contrast** | Default ON for senior mode |
| **Voice Guidance** | Default ON, mandatory playback |
| **Number-First Input** | Numeric keypad for all inputs |
| **Extended Timeout** | 5-minute session (configurable) |
| **Step-by-Step Flow** | One action per screen |
| **No Time Pressure** | No countdown during input |
| **Help Accessibility** | One-tap help button always visible |

## 5.3 Regional Language Support

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LANGUAGE SUPPORT MATRIX                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PRIMARY LANGUAGES (Full Support):                                     │
│  ├── 🇮🇳 Hindi (हिंदी) - DEFAULT                                     │
│  └── 🇬🇧 English                                                       │
│                                                                         │
│  REGIONAL LANGUAGES (Devanagari/Unicode Compliant):                   │
│  ├── 🇮🇳 Tamil (தமிழ்)                                                │
│  ├── 🇮🇳 Bengali (বাংলা)                                              │
│  ├── 🇮🇳 Telugu (తెలుగు)                                              │
│  ├── 🇮🇳 Kannada (ಕನ್ನಡ)                                              │
│  ├── 🇮🇳 Malayalam (മലയാളം)                                         │
│  ├── 🇮🇳 Marathi (मराठी)                                              │
│  ├── 🇮🇳 Gujarati (ગુજરાતી)                                          │
│  └── 🇮🇳 Punjabi (ਪੰਜਾਬੀ)                                           │
│                                                                         │
│  IMPLEMENTATION:                                                       │
│  ├── Noto Sans Font Family (Unicode-compliant)                        │
│  ├── Auto-detect from Aadhaar state code                              │
│  ├── Language selection on welcome screen                             │
│  ├── All UI strings translated                                       │
│  └── TTS support for all languages                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 5.4 Voice-Based Navigation

| Command | Action |
|---------|--------|
| "Bill Pay" / "बिल भुगतान" | Navigate to bill payment |
| "Complaint" / "शिकायत" | Navigate to grievance |
| "Help" / "मदद" | Open help menu |
| "Back" / "पीछे" | Go to previous screen |
| "Home" / "होम" | Return to dashboard |
| "Stop" / "रुको" | Stop voice guidance |
| "Read" / "पढ़ो" | Read current screen |

## 5.5 UI Compliance Standards

### WCAG 2.1 Compliance Level: AA

| WCAG Criterion | Implementation |
|----------------|----------------|
| **1.1.1 Non-text Content** | All icons have text labels |
| **1.3.1 Info and Relationships** | Proper semantic HTML |
| **1.4.3 Contrast (Minimum)** | 4.5:1 ratio (AA) |
| **1.4.4 Resize Text** | Up to 200% scaling supported |
| **2.1.1 Keyboard** | Full keyboard navigation |
| **2.4.3 Focus Order** | Logical focus sequence |
| **2.4.7 Focus Visible** | Clear focus indicators |
| **3.1.1 Language of Page** | HTML lang attribute set |
| **4.1.2 Name, Role, Value** | ARIA attributes |

### Government UI Guidelines Compliance

| Guideline | Compliance |
|----------|------------|
| **GIGW (Guidelines for Indian Government Websites)** | Compliant |
| **DIHAL (Digital India Hardware Access)** | Compatible |
| **UIDAI Authentication UI Guidelines** | Followed |
| **DPDP Act 2023** | Privacy-by-design |

---

# 6. SECURITY ARCHITECTURE & DESIGN

## 6.1 Overall Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE LAYERS                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   LAYER 1: PERIMETER SECURITY                                          │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │  │
│   │  │   WAF    │  │  DDoS   │  │   CDN   │  │  Rate        │   │  │
│   │  │(Cloudflare)│ │Protection│  │(Static) │  │  Limiting    │   │  │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│   LAYER 2: API GATEWAY SECURITY                                        │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │  │
│   │  │   JWT   │  │   TLS   │  │   Auth  │  │   Request   │   │  │
│   │  │Validation│  │  1.3   │  │  Middle│  │   Validation │   │  │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│   LAYER 3: APPLICATION SECURITY                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │  │
│   │  │   Input  │  │   XSS   │  │  CSRF  │  │   SQL        │   │  │
│   │  │ Sanitiz. │  │ Protection│ │Protection│ │  Injection   │   │  │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│   LAYER 4: DATA SECURITY                                               │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │  │
│   │  │  Field   │  │   Data  │  │   Key   │  │   Audit      │   │  │
│   │  │Encryption│  │ Masking │  │  Mgmt   │  │   Logging    │   │  │
│   │  │(pgcrypto)│  │         │  │ (Vault) │  │              │   │  │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│   LAYER 5: NETWORK SECURITY                                            │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │  │
│   │  │   VPC   │  │   mTLS   │  │Firewall │  │  Network    │   │  │
│   │  │         │  │(Service) │  │ Rules   │  │  Segment.   │   │  │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 6.2 Security Implementation Details

| Security Layer | Implementation | Standard |
|----------------|---------------|----------|
| **TLS Encryption** | TLS 1.3 for all connections | Industry Standard |
| **API Gateway** | Kong with JWT validation | OAuth 2.0 |
| **Authentication** | JWT + Refresh tokens | UIDAI Aadhaar |
| **Data at Rest** | PostgreSQL pgcrypto | AES-256 |
| **Data in Transit** | mTLS for services | mTLS |
| **WAF** | Cloudflare/AWS WAF | OWASP Top 10 |
| **DDoS Protection** | Cloudflare/AWS Shield | - |
| **Secrets Management** | HashiCorp Vault | - |
| **Audit Logging** | All API calls logged | DPDP Compliant |

## 6.3 Security Integration: By Design

### Security is Integrated as a First-Class Concern (NOT an Afterthought)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SECURITY BY DESIGN PRINCIPLES                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ✓ PRIVACY BY DESIGN                                                   │
│    ├── No Aadhaar number stored locally                                 │
│    ├── Aadhaar data hashed before storage                              │
│    ├── Consent-based data processing (DPDP)                           │
│    ├── Data minimization principle                                     │
│    └── Right to erasure implemented                                    │
│                                                                         │
│  ✓ SECURE DEFAULT                                                       │
│    ├── All connections encrypted by default                           │
│    ├── Strong authentication required                                  │
│    ├── Session timeout enforced                                        │
│    └── No sensitive data in URLs                                      │
│                                                                         │
│  ✓ DEFENSE IN DEPTH                                                    │
│    ├── Multiple security layers                                        │
│    ├── No single point of failure                                      │
│    └── Least privilege access                                          │
│                                                                         │
│  ✓ THREAT MODELING                                                     │
│    ├── STRIDE methodology applied                                      │
│    ├── Attack surface minimization                                     │
│    └── Regular security reviews                                       │
│                                                                         │
│  ✓ COMPLIANCE BY DEFAULT                                               │
│    ├── DPDP Act 2023 compliance                                        │
│    ├── UIDAI AUA/KUA guidelines                                       │
│    ├── PCI-DSS for payment handling                                   │
│    └── ISO 27001 aligned                                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 6.4 Threat Modeling

### Yes - Threat Modeling Has Been Performed

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    THREAT MODELING (STRIDE METHODOLOGY)                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  IDENTIFIED THREATS & MITIGATIONS:                                       │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ SPOOFING (S)                                                     │  │
│  ├── Threat: Session hijacking                                      │  │
│  ├── Mitigation: JWT tokens + device fingerprinting                  │  │
│  └── Mitigation: Biometric authentication for sensitive ops          │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ TAMPERING (T)                                                    │  │
│  ├── Threat: Data manipulation in transit                           │  │
│  ├── Mitigation: TLS 1.3 encryption                                 │  │
│  └── Mitigation: Request signature validation                       │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ REPUDIATION (R)                                                  │  │
│  ├── Threat: User denies performing action                           │  │
│  ├── Mitigation: Comprehensive audit logging                        │  │
│  └── Mitigation: Digital signatures on transactions                  │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ INFORMATION DISCLOSURE (I)                                       │  │
│  ├── Threat: PII exposure                                            │  │
│  ├── Mitigation: Field-level encryption                              │  │
│  ├── Mitigation: Data masking in logs                                │  │
│  └── Mitigation: No sensitive data in URLs                          │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ DENIAL OF SERVICE (D)                                            │  │
│  ├── Threat: Kiosk overload                                          │  │
│  ├── Mitigation: Rate limiting                                       │  │
│  ├── Mitigation: Queue-based processing                             │  │
│  └── Mitigation: CDN for static content                             │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ ELEVATION OF PRIVILEGE (E)                                       │  │
│  ├── Threat: Unauthorized access to admin functions                 │  │
│  ├── Mitigation: Role-based access control (RBAC)                    │  │
│  └── Mitigation: Multi-factor authentication                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  SECURITY TESTING:                                                     │
│  ├── Automated: Snyk (CVE scanning), OWASP ZAP                       │  │
│  ├── Manual: Quarterly penetration testing                           │  │
│  └── Compliance: Annual security audit                               │  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 6.5 Data Privacy (DPDP Act 2023 Compliance)

| Principle | Implementation |
|-----------|---------------|
| **Consent** | Explicit consent for data collection |
| **Purpose Limitation** | Data used only for stated purpose |
| **Data Minimization** | Only essential data collected |
| **Storage Limitation** | Data retention policy enforced |
| **Security** | Encryption + access controls |
| **Accountability** | Audit trails for all data access |
| **Right to Erasure** | Implemented via API endpoint |

---

# 7. SYSTEM DIAGRAMS

## 7.1 Complete Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           SUVIDHA ONE - COMPLETE DATA FLOW                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CITIZEN                                                                  │
│      │                                                                      │
│      ▼                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                   LAYER 1: KIOSK FRONTEND                            │    │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐  │    │
│   │  │  React   │  │  Voice/   │  │ Service  │  │  Offline Cache   │  │    │
│   │  │   UI     │  │   TTS     │  │  Worker  │  │   (IndexedDB)    │  │    │
│   │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘  │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                              HTTPS/TLS 1.3 + JWT                            │
│                                    │                                         │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                   LAYER 2: API GATEWAY (Kong)                        │    │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐  │    │
│   │  │   Rate   │  │    Auth  │  │  Request │  │    Load          │  │    │
│   │  │ Limiter  │  │ Validator│  │  Router  │  │    Balancer       │  │    │
│   │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘  │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                   LAYER 3: MICROSERVICES                              │    │
│   │                                                                        │    │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐  │    │
│   │  │   Auth   │  │  Payment  │  │  Utility │  │   Grievance      │  │    │
│   │  │ Service  │  │  Service  │  │ Service  │  │   Service        │  │    │
│   │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘  │    │
│   │                                                                        │    │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐  │    │
│   │  │ Document │  │Notification│  │  Session │  │   Integration    │  │    │
│   │  │ Service  │  │  Service  │  │ Service  │  │   Service        │  │    │
│   │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘  │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                   LAYER 4: DATA LAYER                               │    │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐  │    │
│   │  │PostgreSQL│  │   Redis   │  │   MinIO  │  │   Backup         │  │    │
│   │  │ Primary   │  │  (Cache)  │  │  (S3)    │  │   Storage        │  │    │
│   │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘  │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                   LAYER 5: EXTERNAL INTEGRATIONS                    │    │
│   │                                                                        │    │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────────┐  │    │
│   │  │  UIDAI  │  │   NPCI  │  │DigiLocker│ │ DISCOM  │  │ Municipal  │  │    │
│   │  │(Aadhaar)│  │(UPI/BBPS)│  │   APIs  │  │   APIs  │  │    APIs   │  │    │
│   │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └────────────┘  │    │
│   │                                                                        │    │
│   │  ┌─────────┐  ┌─────────┐  ┌───────────────────────────────────────┐  │    │
│   │  │   SMS/  │  │ WhatsApp│  │         Gas / LPG Providers         │  │    │
│   │  │  WhatsApp│  │Business │  │      (IOCL, BPCL, HPCL)             │  │    │
│   │  └─────────┘  └─────────┘  └───────────────────────────────────────┘  │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 7.2 Authentication Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW DIAGRAM                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   START                                                                       │
│     │                                                                        │
│     ▼                                                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │              LANGUAGE SELECTION (Optional)                          │    │
│   │  User selects language / System auto-detects from Aadhaar          │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│     │                                                                        │
│     ▼                                                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │              AUTHENTICATION METHOD SELECTION                        │    │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │    │
│   │   │  Mobile OTP  │  │   Aadhaar    │  │  QR Code    │            │    │
│   │   │              │  │  Biometric   │  │   Scan      │            │    │
│   │   └──────────────┘  └──────────────┘  └──────────────┘            │    │
│   │   ┌──────────────┐                                                 │    │
│   │   │    Guest     │                                                 │    │
│   │   │    Mode      │                                                 │    │
│   │   └──────────────┘                                                 │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│     │                                                                        │
│     ├────────────────────────────────────────────────────────────────┐     │
│     │                                                                │     │
│     ▼                                                                ▼     │
│   ┌──────────────────────┐                               ┌──────────────────┐ │
│   │   OTP AUTH FLOW     │                               │  AADHAAR FLOW    │ │
│   ├──────────────────────┤                               ├──────────────────┤ │
│   │ 1. Enter Mobile     │                               │ 1. Select        │ │
│   │ 2. Send OTP         │                               │    Biometric     │ │
│   │    (Redis 5min TTL) │                               │ 2. Init Session  │ │
│   │ 3. Enter OTP        │                               │ 3. Scan          │ │
│   │ 4. Validate OTP     │                               │    Fingerprint   │ │
│   │ 5. Create Session   │                               │ 4. UIDAI Verify  │ │
│   │ 6. Generate JWT    │                               │ 5. Create User   │ │
│   │    (15min)          │                               │    (if new)      │ │
│   │ 7. Generate Refresh │                               │ 6. Generate JWT  │ │
│   │    (7 days)         │                               │ 7. Generate      │ │
│   └──────────────────────┘                               │    Refresh       │ │
│                                                            └──────────────────┘ │
│     │                                                                        │
│     ▼                                                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │              SESSION ESTABLISHED                                   │    │
│   │  • JWT stored in memory                                            │    │
│   │  • Refresh token in HTTP-only cookie                               │    │
│   │  • Session timeout: 15 minutes activity                            │    │
│   │  • Max idle time: 3 minutes                                        │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│     │                                                                        │
│     ▼                                                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │              DASHBOARD / SERVICES                                  │    │
│   │  User can access all authenticated services                         │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 7.3 Payment Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT FLOW DIAGRAM                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   USER ACTION                                                                │
│      │                                                                      │
│      ▼                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  BILL SELECTION                                                     │    │
│   │  • Auto-fetch via BBPS API                                         │    │
│   │  • Display pending bills                                           │    │
│   │  • User selects bill(s)                                             │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│      │                                                                      │
│      ▼                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  CART & CONFIRMATION                                               │    │
│   │  • Multi-utility cart (electricity + water + gas)                │    │
│   │  • Total amount display                                            │    │
│   │  • User confirms                                                   │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│      │                                                                      │
│      ▼                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  PAYMENT MODE SELECTION                                            │    │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│   │   │    UPI   │  │   Card   │  │Net Banking│  │   Cash   │        │    │
│   │   │    QR    │  │  (POS)   │  │          │  │  (COP)   │        │    │
│   │   └──────────┘  └──────────┘  └──────────┘  └──────────┘        │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│      │                                                                      │
│      ├────────────────────────────────────────────────────────────────┐     │
│      │                                                                │     │
│      ▼                                                                ▼     │
│   ┌─────────────────────────┐                              ┌─────────────────┐ │
│   │    UPI/QR FLOW         │                              │   CARD FLOW    │ │
│   ├─────────────────────────┤                              ├─────────────────┤ │
│   │ 1. Display QR Code     │                              │ 1. POS Terminal│ │
│   │ 2. User scans with     │                              │ 2. Enter PIN   │ │
│   │    UPI App              │                              │ 3. Process      │ │
│   │ 3. Payment Initiated   │                              │ 4. Confirm      │ │
│   │ 4. Wait for callback   │                              └─────────────────┘ │
│   │ 5. Verify with NPCI    │                                             │
│   └─────────────────────────┘                                             │
│      │                                                                      │
│      ▼                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  PAYMENT VERIFICATION                                              │    │
│   │  • Query NPCI/UPI gateway                                          │    │
│   │  • Verify transaction status                                       │    │
│   │  • Update database                                                 │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│      │                                                                      │
│      ├─────────────────────┐                                             │
│      │                     │                                             │
│      ▼                     ▼                                             │
│   ┌──────────────┐   ┌──────────────┐                                    │
│   │   SUCCESS    │   │    FAILED    │                                    │
│   ├──────────────┤   ├──────────────┤                                    │
│   │• Update DB   │   │• Log error   │                                    │
│   │• Generate    │   │• Show retry  │                                    │
│   │  Receipt     │   │• Release     │                                    │
│   │• Send SMS/WA │   │  hold        │                                    │
│   │• Print       │   │              │                                    │
│   └──────────────┘   └──────────────┘                                    │
│      │                                                                      │
│      ▼                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │  RECEIPT OPTIONS                                                    │    │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│   │   │  Print   │  │   SMS    │  │ WhatsApp │  │DigiLocker│        │    │
│   │   │ Receipt  │  │          │  │          │  │  Save    │        │    │
│   │   └──────────┘  └──────────┘  └──────────┘  └──────────┘        │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# 8. SUMMARY

## 8.1 Key Technical Highlights

| Aspect | Status |
|--------|--------|
| **Development Stage** | MVP Developed |
| **Touch-Optimized UI** | Yes - Purpose-built |
| **Offline Support** | Yes - Full offline capability |
| **Accessibility** | Complete - Voice, visual, language |
| **Security** | By Design - Multi-layer |
| **Threat Modeling** | Completed - STRIDE |
| **WCAG Compliance** | Level AA |
| **Government Guidelines** | GIGW, DPDP compliant |

## 8.2 Compliance Summary

| Standard/Regulation | Compliance |
|---------------------|------------|
| WCAG 2.1 | Level AA |
| DPDP Act 2023 | Full Compliance |
| UIDAI AUA/KUA | Certified Integration |
| PCI-DSS | Compliant (Payment) |
| ISO 27001 | Aligned |
| GIGW | Compliant |

---

> **Document Version**: 1.0  
> **Last Updated**: February 2026  
> **Prepared For**: SUVIDHA ONE Project Evaluation
