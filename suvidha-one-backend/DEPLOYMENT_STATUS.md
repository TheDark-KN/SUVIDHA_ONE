# Payment Service Deployment Guide

## Current Status

| Service | Status | URL |
|---------|--------|-----|
| utility-service | ✅ Deployed | https://suvidha-one.onrender.com |
| payment-service | ❌ Not Deployed | https://suvidha-one-payment-service.onrender.com |
| auth-service | ❌ Not Deployed | https://suvidha-one-auth-service.onrender.com |

---

## Step 1: Deploy Payment Service on Render

### Option A: Via Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Select `render.yaml` from your GitHub repo
4. Render will detect all services in the blueprint
5. Click **"Apply"** to deploy

### Option B: Manual Deployment

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Name:** `suvidha-one-payment-service`
   - **Root Directory:** `suvidha-one-backend`
   - **Build Command:** `pip install edge-tts && SQLX_OFFLINE=true cargo build --release --bin payment-service`
   - **Start Command:** `./target/release/payment-service`
   - **Plan:** Free

5. Add Environment Variables:
   ```
   DATABASE_URL = <your PostgreSQL URL>
   REDIS_URL = <your Redis URL>
   JWT_PUBLIC_KEY_PEM = <your public key>
   JWT_PRIVATE_KEY_PEM = <your private key>
   RAZORPAY_KEY_ID = rzp_test_SUierF4v7EIEAy
   RAZORPAY_KEY_SECRET = vPhPn6pglPLKiYn1zk6k1gu2
   RAZORPAY_WEBHOOK_SECRET = <generate from Razorpay Dashboard>
   FRONTEND_URLS = https://suvidha-one-frontend.vercel.app
   SQLX_OFFLINE = true
   PORT = <auto-assigned>
   ```

---

## Step 2: Configure Razorpay Webhook

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings** → **Webhooks**
3. Click **Add Webhook**
4. Enter:
   - **URL:** `https://suvidha-one-payment-service.onrender.com/webhooks/razorpay`
   - **Secret:** Copy this secret
5. Select events:
   - ✅ `payment.captured`
   - ✅ `payment.authorized`
   - ✅ `payment.failed`
6. Click **Save**
7. Copy the **Webhook Secret** and add it to Render environment variables

---

## Step 3: Verify Deployment

Run the test script:

```bash
cd suvidha-one-backend
bash test_payment_api.sh
```

Or manual verification:

```bash
# Test health
curl https://suvidha-one-payment-service.onrender.com/health

# Test create order
curl -X POST https://suvidha-one-payment-service.onrender.com/payment/create \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","amount":10000,"service_type":"test","kiosk_id":"TEST"}'
```

---

## API Endpoints to Test

| Endpoint | Method | Description | Expected Response |
|----------|--------|-------------|-------------------|
| `/health` | GET | Health check | `{"status":"healthy"}` |
| `/payment/create` | POST | Create Razorpay order | Order ID, amount, UPI link |
| `/payment/verify` | POST | Verify payment signature | Success/Failure |
| `/payment/history/:phone` | GET | Get payment history | List of payments |
| `/webhooks/razorpay` | POST | Razorpay webhook | `{"status":"ok"}` |

---

## Rate Limiting Configuration

From `.env`:
```env
RATE_LIMIT_GLOBAL=1000      # Global requests per minute
RATE_LIMIT_AUTH=5           # Auth requests per minute
RATE_LIMIT_PAYMENT=10       # Payment requests per minute
```

---

## Test Results Template

After deployment, record results:

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Health Check | 200 | ? | ❌ |
| Create Order | 200 | ? | ❌ |
| Invalid Amount (low) | 400 | ? | ❌ |
| Invalid Amount (high) | 400 | ? | ❌ |
| Missing Signature | 400 | ? | ❌ |
| Invalid Signature | 403 | ? | ❌ |
| Webhook (no sig) | 400 | ? | ❌ |
| Webhook (bad sig) | 403 | ? | ❌ |
| Payment History | 200 | ? | ❌ |
| Rate Limit (11+ req) | 429 | ? | ❌ |

---

## Troubleshooting

### 1. Service returns 404
- Service not deployed yet
- Check Render dashboard for deployment status

### 2. Razorpay API errors
- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correct
- Check if using test vs live keys

### 3. Webhook signature verification fails
- Ensure `RAZORPAY_WEBHOOK_SECRET` is set
- Check webhook URL is accessible from internet

### 4. Database connection errors
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is accessible from Render

### 5. Redis connection errors
- Verify `REDIS_URL` is correct
- Check Redis instance is running
