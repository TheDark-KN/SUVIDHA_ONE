# PPT Template Content Guide  
**For:** `PPT Template.pptx`  
**Project:** SUVIDHA ONE  

This file gives you the exact text/content to add on each slide of your template, plus what visuals to insert.

---

## Slide 1 — Title / Team
**Template title detected:** `CENTRE FOR DEVELOPMENT OF ADVANCED COMPUTING (C-DAC)`  
**Current placeholders:** `Team`, `Name`

### Replace/Add
- **Main Title:** `SUVIDHA ONE — Secure Unified Citizen Service Kiosk`
- **Subtitle:** `Multilingual Voice + Biometric + Digital Governance Platform`
- **Team Line:** `Team: TheDarkKnight (ID-21)` (or your final team name)
- **Members:** Add all member names and roles.
- **Footer small line:** `Hackathon | March 2026 | C-DAC`

### Visuals to add
- SUVIDHA ONE logo
- C-DAC logo (if required by rules)
- Optional: one-line tagline badge: `One Nation • One Kiosk • One Interface`

---

## Slide 2 — Problem Understanding
**Template title detected:** `Problem Understanding`

### Suggested content (paste-ready)
#### Problem Statement
Citizens face fragmented government services: multiple portals, language barriers, low digital literacy, poor accessibility, and weak trust in digital identity/payment processes.

#### Pain Points
- Multiple departments, no single user journey  
- Limited multilingual and voice-first support  
- Low trust in identity, records, and payment transparency  
- Rural kiosk operations suffer from connectivity and operator dependency  
- Weak auditability of critical transactions

#### Impact
- High service completion time  
- Increased grievance volume  
- Digital exclusion for senior citizens and low-literacy users

#### Goal
Build a secure, multilingual, kiosk-first platform that unifies authentication, services, and payment with strong compliance and audit trails.

### Visuals to add
- Problem flow diagram (`Citizen -> Multiple Portals -> Failure/Delay`)
- 4 icon row: Language, Identity, Payment, Accessibility

---

## Slide 3 — Proposed Solution
**Template title detected:** `Proposed Solution`

### Suggested content (paste-ready)
#### SUVIDHA ONE Solution
An integrated citizen-service stack combining:
- **Voice-first multilingual interface (Bhashini ASR/TTS/Translation)**
- **Biometric + OTP assisted authentication**
- **Unified service catalogue (bills, certificates, grievances, docs)**
- **Secure digital payment workflow (Razorpay + verification)**
- **Tamper-evident logging and auditable operations**

#### Key Design Principles
- Security by default  
- Accessibility by design  
- Offline-resilient kiosk operations  
- Modular microservices architecture  
- Compliance-ready data handling

#### Expected Outcomes
- Faster service completion  
- Reduced operator error  
- Improved citizen trust and adoption

### Visuals to add
- “Before vs After” table
- Solution block graphic with 5 blocks:
  `Voice | Auth | Services | Payments | Audit`

---

## Slide 4 — System Architecture
**Template title detected:** `System Architecture`

### Suggested content (paste-ready)
#### Architecture Layers
1. **Presentation Layer**  
   - Kiosk UI (touch-first), language selection, voice mic flow

2. **Gateway/API Layer**  
   - Utility service (health, OTP, voice, payment endpoints)

3. **Core Services (Rust/Axum Microservices)**  
   - Auth Service  
   - Utility Service  
   - Payment Service  
   - Shared library (JWT, validation, Razorpay, Bhashini)

4. **Data & Infra Layer**  
   - PostgreSQL (transactions, service state)  
   - Redis (OTP cache, rate-limits, idempotency)  
   - Render deployment + CI/CD

5. **External Integrations**
   - Bhashini (ASR/TTS/Translation)  
   - Razorpay (orders/verify/webhooks)  
   - SMS Provider (OTP)

#### Security Controls
- RS256 JWT, HMAC OTP hashing, rate limiting, CORS policy, structured logs

### Visuals to add
- Full architecture diagram with arrows:
  `Citizen -> Kiosk UI -> API -> Services -> DB/Redis -> External APIs`

---

## Slide 5 — UI/UX (Kiosk Focused Security, Scalability & Compliance)
**Template title detected:** `UI/UX (Kiosk Focused Security, Scalability & Compliance)`

### Suggested content (paste-ready)
#### Kiosk UX Decisions
- Large touch targets and simplified navigation
- Voice-triggered flow for low-literacy users
- Multilingual labels + speech prompts
- Minimal-step service completion

#### Security UX
- OTP + biometric assisted login  
- Confirmation prompts before payment  
- Signed transaction references visible to user  
- Error states with clear recovery instructions

#### Scalability
- Service-based backend allows independent scaling  
- Redis-backed rate controls and caching  
- Stateless API with token-based auth

#### Compliance
- PII minimization in logs  
- Audit trails for payment/auth operations  
- Config-driven secrets on Render env

### Visuals to add
- 2–3 kiosk screen mockups
- UX journey strip:
  `Select Language -> Authenticate -> Choose Service -> Pay -> Receipt`

---

## Slide 6 — Innovation & Future Scope
**Template title detected:** `Innovation & Future Scope`

### Suggested content (paste-ready)
#### Current Innovation
- Unified voice + biometric + payment stack in one citizen kiosk  
- End-to-end multilingual support with Bhashini  
- Real-time payment verification and secure receipts  
- Modular Rust services optimized for reliability and security

#### Near-Term Roadmap
- Auto language detection from voice sample  
- Voice confirmation for payment (Yes/No intent check)  
- Deeper grievance/document workflows  
- Stronger dashboard analytics (success rate, wait time)

#### Long-Term Scope
- Offline-first sync model for low-connectivity zones  
- Blockchain-backed service evidence for high-trust records  
- Face/fingerprint hardware integrations at kiosk edge  
- AI assistant for guided form filling and government scheme recommendations

#### Closing Line
`SUVIDHA ONE: Inclusive, Secure, and Scalable Public Service Delivery`

### Visuals to add
- Roadmap timeline (Now -> Next -> Future)
- Innovation icons: AI, Voice, Security, Blockchain, Rural Access

---

## Consistent Footer/Header Notes (all slides)
- Keep template branding line: `One Vision. One Goal…`
- Keep slide number style (`2, 3, 4...`)
- Add small footer (optional): `SUVIDHA ONE | Team TheDarkKnight | C-DAC Hackathon 2026`

---

## Presenter Notes (quick)
- **Slide 2:** explain citizen pain in plain language  
- **Slide 3:** show how each pain maps to one module  
- **Slide 4:** spend most technical time here  
- **Slide 5:** focus on kiosk usability and trust  
- **Slide 6:** close with measurable impact and deployment readiness

