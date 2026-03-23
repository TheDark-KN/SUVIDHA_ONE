#!/bin/bash

# SUVIDHA ONE - OTP SMS Testing Script
# Fast2SMS Integration with Auth Service

BASE_URL="${1:-http://localhost:3001}"
PHONE="${2:-+919876543210}"
KIOSK_ID="KIOSK_DEL_001"

echo "🚀 Testing SUVIDHA ONE OTP SMS Integration"
echo "📍 Base URL: $BASE_URL"
echo "📱 Phone: $PHONE"
echo "🏪 Kiosk ID: $KIOSK_ID"
echo

# 1. Health Check
echo "1️⃣ Health Check"
curl -s "$BASE_URL/health" | jq . || echo "Health check failed"
echo -e "\n"

# 2. Send OTP
echo "2️⃣ Sending OTP to $PHONE"
SEND_RESPONSE=$(curl -s -X POST "$BASE_URL/otp/send" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"kiosk_id\": \"$KIOSK_ID\"
  }")

echo "Response: $SEND_RESPONSE"

# Check if OTP was sent successfully
if echo "$SEND_RESPONSE" | jq -e '.data.message' > /dev/null 2>&1; then
    echo "✅ OTP sent successfully!"
    SMS_REQUEST_ID=$(echo "$SEND_RESPONSE" | jq -r '.data.sms_request_id // "unknown"')
    echo "📬 SMS Request ID: $SMS_REQUEST_ID"
else
    echo "❌ Failed to send OTP"
    exit 1
fi

echo -e "\n"

# 3. Prompt for OTP verification
echo "3️⃣ OTP Verification"
echo "📱 Check your phone for the OTP SMS"
read -p "Enter the 6-digit OTP: " OTP

if [ -z "$OTP" ]; then
    echo "❌ No OTP entered"
    exit 1
fi

# 4. Verify OTP
echo "🔐 Verifying OTP: $OTP"
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/otp/verify" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"otp\": \"$OTP\",
    \"kiosk_id\": \"$KIOSK_ID\"
  }")

echo "Response: $VERIFY_RESPONSE"

# Check verification result
if echo "$VERIFY_RESPONSE" | jq -e '.data.access_token' > /dev/null 2>&1; then
    echo "✅ OTP verified successfully!"
    ACCESS_TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.data.access_token')
    USER_ID=$(echo "$VERIFY_RESPONSE" | jq -r '.data.user_id')
    EXPIRES_IN=$(echo "$VERIFY_RESPONSE" | jq -r '.data.expires_in')
    
    echo "👤 User ID: $USER_ID"
    echo "🔑 Access Token: ${ACCESS_TOKEN:0:50}..."
    echo "⏰ Expires in: $EXPIRES_IN seconds"
    
    # Save token for further testing
    echo "$ACCESS_TOKEN" > /tmp/suvidha_access_token.txt
    echo "💾 Token saved to /tmp/suvidha_access_token.txt"
else
    echo "❌ OTP verification failed"
    exit 1
fi

echo -e "\n"

# 5. Test authenticated request (if other services are available)
echo "4️⃣ Testing authenticated request"
if [ -f "/tmp/suvidha_access_token.txt" ]; then
    TOKEN=$(cat /tmp/suvidha_access_token.txt)
    
    # Try to access a protected endpoint (this might fail if service is not running)
    AUTH_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/auth/profile" 2>/dev/null || echo "Service not available")
    
    if [ "$AUTH_TEST" = "Service not available" ]; then
        echo "ℹ️ Protected endpoint test skipped (service not running)"
    else
        echo "🔒 Protected endpoint response: $AUTH_TEST"
    fi
fi

echo -e "\n✨ OTP SMS Integration test completed!"

# Rate limiting test
echo -e "\n5️⃣ Testing rate limiting (optional)"
read -p "Test rate limiting by sending multiple OTPs? (y/N): " TEST_RATE_LIMIT

if [ "$TEST_RATE_LIMIT" = "y" ] || [ "$TEST_RATE_LIMIT" = "Y" ]; then
    echo "🚦 Testing rate limiting..."
    for i in {1..5}; do
        echo "Attempt $i/5:"
        curl -s -X POST "$BASE_URL/otp/send" \
          -H "Content-Type: application/json" \
          -d "{\"phone\": \"$PHONE\", \"kiosk_id\": \"$KIOSK_ID\"}" | \
          jq '.message // .error // "Unknown response"'
        sleep 1
    done
fi

echo -e "\n🎉 All tests completed!"