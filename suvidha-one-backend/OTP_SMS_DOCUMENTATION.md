# SUVIDHA ONE - OTP SMS Integration with Fast2SMS

## Overview
Complete OTP via SMS authentication system using Fast2SMS (India's leading SMS gateway) integrated into the Suvidha One auth-service.

## Features
- ✅ **Fast2SMS Integration** - Real SMS delivery to Indian phone numbers
- ✅ **Rate Limiting** - 3 OTPs per hour per phone number
- ✅ **Phone Validation** - Supports +91XXXXXXXXXX format
- ✅ **Secure OTP Storage** - HMAC-SHA256 hashed OTPs in Redis
- ✅ **Attempt Limiting** - Maximum 3 verification attempts per OTP
- ✅ **JWT Authentication** - Issues access/refresh tokens on successful verification
- ✅ **Session Management** - Creates user sessions with kiosk tracking

## API Endpoints

### 1. Send OTP
**POST** `/otp/send` or `/auth/otp/send`

**Request:**
```json
{
  "phone": "+919876543210",
  "kiosk_id": "KIOSK_DEL_001"
}
```

**Response:**
```json
{
  "data": {
    "message": "OTP sent successfully",
    "expires_in": 300,
    "sms_request_id": "req_xyz123"
  },
  "meta": {
    "timestamp": "2024-03-23T10:30:00Z"
  }
}
```

**Error Responses:**
- `400` - Invalid phone number format
- `429` - Rate limit exceeded (3 OTPs/hour)
- `500` - SMS delivery failed

### 2. Verify OTP
**POST** `/otp/verify` or `/auth/otp/verify`

**Request:**
```json
{
  "phone": "+919876543210",
  "otp": "123456",
  "kiosk_id": "KIOSK_DEL_001"
}
```

**Response:**
```json
{
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
    "expires_in": 900,
    "user_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "meta": {
    "timestamp": "2024-03-23T10:35:00Z"
  }
}
```

**Error Responses:**
- `400` - Invalid phone number or OTP format
- `401` - Invalid or expired OTP
- `429` - Maximum verification attempts exceeded

## Environment Variables

### Required for Production
```bash
# Fast2SMS Configuration
FAST2SMS_API_KEY=1aIWT35S20D5RnDG0N3YkyG1SAH7N8D0asJJqdTV40gmxXG2LAcPWeISjFza
FAST2SMS_SENDER_ID=FSTSMS

# OTP Security
OTP_HMAC_SECRET=your-secure-32-character-secret-key

# Redis for OTP storage
REDIS_URL=redis://localhost:6379

# JWT for authentication
JWT_PRIVATE_KEY_PEM=-----BEGIN PRIVATE KEY-----\n...
JWT_PUBLIC_KEY_PEM=-----BEGIN PUBLIC KEY-----\n...
```

### Optional
```bash
FAST2SMS_TEMPLATE_ID=otp-template  # For branded SMS templates
```

## Render.com Deployment

### Environment Variables to Add in Render Dashboard:

| Variable | Value | Notes |
|----------|-------|-------|
| `FAST2SMS_API_KEY` | `1aIWT35S20D5RnDG0N3YkyG1SAH7N8D0asJJqdTV40gmxXG2LAcPWeISjFza` | Your Fast2SMS API key |
| `FAST2SMS_SENDER_ID` | `FSTSMS` | Sender ID for SMS |
| `OTP_HMAC_SECRET` | `your-secure-random-32-char-secret` | HMAC secret for OTP hashing |
| `REDIS_URL` | Your Redis connection URL | Required for OTP storage |
| `JWT_SECRET` | `fallback-jwt-secret` | Fallback if RSA keys not set |

### Build Commands:
```bash
# Auth Service
buildCommand: SQLX_OFFLINE=true cargo build --release --bin auth-service
startCommand: ./target/release/auth-service
```

## Fast2SMS Configuration

### Getting Started:
1. Sign up at [fast2sms.com](https://fast2sms.com)
2. Get your API key from dashboard
3. Add credits (₹0.12 per SMS for OTP route)
4. Use the API key provided above

### SMS Routes:
- **OTP Route**: Optimized for OTP delivery, higher success rate
- **Promotional**: For marketing messages
- **Transactional**: For important notifications

## Phone Number Validation

Supports multiple formats, automatically normalized:
```
Input: "9876543210"     → Output: "+919876543210"
Input: "919876543210"   → Output: "+919876543210"  
Input: "+919876543210"  → Output: "+919876543210"
Input: " 98765 43210 "  → Output: "+919876543210"
```

Invalid formats will return `400 Bad Request`.

## Redis Key Structure

```
otp:hash:{phone}         - Hashed OTP (TTL: 5 minutes)
otp:attempts:{phone}     - Verification attempts (TTL: 5 minutes)
otp:rate:{phone}         - Rate limiting counter (TTL: 1 hour)
session:{user_id}        - User session data (TTL: 15 minutes)
```

## Testing

### Local Development:
```bash
# 1. Start auth-service
cargo run --bin auth-service

# 2. Run test script
./test_otp_sms.sh http://localhost:3001 +919876543210
```

### Production Testing:
```bash
# Test against Render deployment
./test_otp_sms.sh https://suvidha-one-auth-service.onrender.com +919876543210
```

### Manual Testing with cURL:

#### Send OTP:
```bash
curl -X POST https://suvidha-one-auth-service.onrender.com/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "kiosk_id": "KIOSK_DEL_001"
  }'
```

#### Verify OTP:
```bash
curl -X POST https://suvidha-one-auth-service.onrender.com/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210", 
    "otp": "123456",
    "kiosk_id": "KIOSK_DEL_001"
  }'
```

## Security Features

1. **HMAC-SHA256 OTP Hashing** - OTPs are never stored in plain text
2. **Rate Limiting** - Prevents spam (3 OTPs/hour per phone)
3. **Attempt Limiting** - Max 3 verification attempts per OTP
4. **Automatic Cleanup** - OTPs and attempts auto-expire
5. **Phone Validation** - Only Indian phone numbers accepted
6. **Secure Session Storage** - JWT with proper expiration

## Costs

- **Fast2SMS OTP Route**: ₹0.12 per SMS
- **Typical monthly cost**: ₹100-500 for small deployments
- **Free tier**: Fast2SMS offers test credits for development

## Troubleshooting

### Common Issues:

#### "SMS delivery failed"
- Check Fast2SMS API key
- Verify account balance  
- Check phone number format
- Confirm SMS route permissions

#### "Rate limit exceeded" 
- User hit 3 OTP/hour limit
- Wait 1 hour or clear Redis key manually
- Consider increasing limit for VIP users

#### "InvalidKeyFormat" error
- JWT keys incorrectly formatted in env vars
- Check newline escaping: `\n` not actual newlines
- Fallback to JWT_SECRET if RSA keys fail

#### "Redis connection failed"
- Verify REDIS_URL in environment
- Check Redis server availability
- Ensure Redis allows connections from Render

### Debug Commands:
```bash
# Check Redis keys
redis-cli keys "otp:*"

# View OTP hash for phone
redis-cli get "otp:hash:+919876543210"

# Check rate limit
redis-cli get "otp:rate:+919876543210"

# Clear user's OTP data (admin only)
redis-cli del "otp:hash:+919876543210" "otp:attempts:+919876543210" "otp:rate:+919876543210"
```

## Integration Examples

### Frontend Integration (React):
```javascript
// Send OTP
const sendOTP = async (phone, kioskId) => {
  const response = await fetch('/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, kiosk_id: kioskId })
  });
  return response.json();
};

// Verify OTP
const verifyOTP = async (phone, otp, kioskId) => {
  const response = await fetch('/otp/verify', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp, kiosk_id: kioskId })
  });
  const data = await response.json();
  
  if (data.data?.access_token) {
    localStorage.setItem('token', data.data.access_token);
    localStorage.setItem('userId', data.data.user_id);
  }
  
  return data;
};
```

### Mobile Integration (Flutter):
```dart
// Send OTP
Future<Map<String, dynamic>> sendOTP(String phone, String kioskId) async {
  final response = await http.post(
    Uri.parse('$baseUrl/otp/send'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'phone': phone, 'kiosk_id': kioskId}),
  );
  return jsonDecode(response.body);
}

// Verify OTP  
Future<Map<String, dynamic>> verifyOTP(String phone, String otp, String kioskId) async {
  final response = await http.post(
    Uri.parse('$baseUrl/otp/verify'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'phone': phone, 'otp': otp, 'kiosk_id': kioskId}),
  );
  return jsonDecode(response.body);
}
```

## Monitoring & Analytics

### Key Metrics to Track:
- OTP delivery success rate
- Verification success rate
- Average verification time
- Rate limit violations
- SMS delivery failures

### Log Analysis:
```bash
# Search for OTP events
grep "OTP" /var/log/suvidha-auth.log

# Track SMS delivery failures
grep "Failed to send OTP SMS" /var/log/suvidha-auth.log

# Monitor rate limiting
grep "Rate limit exceeded" /var/log/suvidha-auth.log
```

---

## ✅ Status: Production Ready

The OTP SMS system is fully implemented and ready for production use with Fast2SMS integration.