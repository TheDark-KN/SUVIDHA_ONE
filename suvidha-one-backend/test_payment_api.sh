#!/bin/bash
# SUVIDHA ONE - Payment API Test Script
# Tests Razorpay payment integration endpoints

BASE_URL="${BASE_URL:-https://suvidha-one.onrender.com}"
PAYMENT_URL="${PAYMENT_URL:-https://suvidha-one-payment-service.onrender.com}"

echo "=============================================="
echo "  SUVIDHA ONE - Payment API Test Suite"
echo "=============================================="
echo ""
echo "Payment Service URL: $PAYMENT_URL"
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local expected_status=$2
    local actual_status=$3
    local response=$4
    
    echo -n "[$name] "
    if [ "$actual_status" == "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $actual_status)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $actual_status)"
        echo "  Response: $response"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "=============================================="
echo "  Phase 1: Health Checks"
echo "=============================================="

# Test payment service health
echo -e "\n--- Payment Service Health ---"
RESPONSE=$(/usr/bin/curl -s -w "\n%{http_code}" "$PAYMENT_URL/health" 2>/dev/null)
BODY=$(echo "$RESPONSE" | head -n -1)
STATUS=$(echo "$RESPONSE" | tail -n 1)
test_endpoint "Health Check" "200" "$STATUS" "$BODY"

echo ""
echo "=============================================="
echo "  Phase 2: Create Order Endpoint Tests"
echo "=============================================="

echo -e "\n--- Test 1: Valid Order Creation ---"
RESPONSE=$(/usr/bin/curl -s -w "\n%{http_code}" -X POST "$PAYMENT_URL/payment/create" \
    -H "Content-Type: application/json" \
    -d '{"phone":"9999999999","amount":10000,"service_type":"bill_payment","kiosk_id":"TEST"}')
BODY=$(echo "$RESPONSE" | head -n -1)
STATUS=$(echo "$RESPONSE" | tail -n 1)

if [ "$STATUS" == "200" ] || [ "$STATUS" == "201" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Order created successfully"
    ((TESTS_PASSED++))
    ORDER_ID=$(echo "$BODY" | grep -o '"order_id":"[^"]*"' | cut -d'"' -f4)
    echo "  Order ID: $ORDER_ID"
else
    echo -e "${RED}✗ FAIL${NC} - HTTP $STATUS"
    echo "  Response: $BODY"
    ((TESTS_FAILED++))
fi

echo -e "\n--- Test 2: Missing Required Fields ---"
RESPONSE=$(/usr/bin/curl -s -w "\n%{http_code}" -X POST "$PAYMENT_URL/payment/create" \
    -H "Content-Type: application/json" \
    -d '{"phone":"9999999999"}')
BODY=$(echo "$RESPONSE" | head -n -1)
STATUS=$(echo "$RESPONSE" | tail -n 1)
test_endpoint "Missing Amount" "400" "$STATUS" "$BODY"

echo -e "\n--- Test 3: Amount Below Minimum (₹5 = 500 paise) ---"
RESPONSE=$(/usr/bin/curl -s -w "\n%{http_code}" -X POST "$PAYMENT_URL/payment/create" \
    -H "Content-Type: application/json" \
    -d '{"phone":"9999999999","amount":500,"service_type":"test"}')
BODY=$(echo "$RESPONSE" | head -n -1)
STATUS=$(echo "$RESPONSE" | tail -n 1)
test_endpoint "Amount Too Low" "400" "$STATUS" "$BODY"

echo -e "\n--- Test 4: Amount Above Maximum (₹6000 = 600000 paise) ---"
RESPONSE=$(/usr/bin/curl -s -w "\n%{http_code}" -X POST "$PAYMENT_URL/payment/create" \
    -H "Content-Type: application/json" \
    -d '{"phone":"9999999999","amount":600000,"service_type":"test"}')
BODY=$(echo "$RESPONSE" | head -n -1)
STATUS=$(echo "$RESPONSE" | tail -n 1)
test_endpoint "Amount Too High" "400" "$STATUS" "$BODY"

echo -e "\n--- Test 5: Invalid Phone Format ---"
RESPONSE=$(/usr/bin/curl -s -w "\n%{http_code}" -X POST "$PAYMENT_URL/payment/create" \
    -H "Content-Type: application/json" \
    -d '{"phone":"123","amount":10000,"service_type":"test"}')
BODY=$(echo "$RESPONSE" | head -n -1)
STATUS=$(echo "$RESPONSE" | tail -n 1)
test_endpoint "Invalid Phone" "400" "$STATUS" "$BODY"

echo ""
echo "=============================================="
echo "  Phase 3: Verify Payment Endpoint Tests"
echo "=============================================="

echo -e "\n--- Test 6: Valid Payment Verification ---"
# First create an order
ORDER_RESP=$(/usr/bin/curl -s -X POST "$PAYMENT_URL/payment/create" \
    -H "Content-Type: application/json" \
    -d '{"phone":"9999999999","amount":10000,"service_type":"test","kiosk_id":"TEST"}')
ORDER_ID=$(echo "$ORDER_RESP" | grep -o '"order_id":"[^"]*"' | cut -d'"' -f4)

# Test with fake signature (will fail but tests endpoint)
RESPONSE=$(/usr/bin/curl -s -w "\n%{http_code}" -X POST "$PAYMENT_URL/payment/verify" \
    -H "Content-Type: application/json" \
    -d "{\"razorpay_order_id\":\"$ORDER_ID\",\"razorpay_payment_id\":\"pay_test123\",\"razorpay_signature\":\"invalid\"}")
BODY=$(echo "$RESPONSE" | head -n -1)
STATUS=$(echo "$RESPONSE" | tail -n 1)
# Should return 403 for invalid signature
test_endpoint "Invalid Signature" "403" "$STATUS" "$BODY"

echo -e "\n--- Test 7: Missing Signature ---"
RESPONSE=$(/usr/bin/curl -s -w "\n%{http_code}" -X POST "$PAYMENT_URL/payment/verify" \
    -H "Content-Type: application/json" \
    -d '{"razorpay_order_id":"order_test123"}')
BODY=$(echo "$RESPONSE" | head -n -1)
STATUS=$(echo "$RESPONSE" | tail -n 1)
test_endpoint "Missing Signature" "400" "$STATUS" "$BODY"

echo ""
echo "=============================================="
echo "  Phase 4: Webhook Endpoint Tests"
echo "=============================================="

echo -e "\n--- Test 8: Missing Webhook Signature ---"
RESPONSE=$(/usr/bin/curl -s -w "\n%{http_code}" -X POST "$PAYMENT_URL/webhooks/razorpay" \
    -H "Content-Type: application/json" \
    -d '{"event":"payment.captured","payload":{}}')
BODY=$(echo "$RESPONSE" | head -n -1)
STATUS=$(echo "$RESPONSE" | tail -n 1)
test_endpoint "Missing Webhook Signature" "400" "$STATUS" "$BODY"

echo -e "\n--- Test 9: Invalid Webhook Signature ---"
RESPONSE=$(/usr/bin/curl -s -w "\n%{http_code}" -X POST "$PAYMENT_URL/webhooks/razorpay" \
    -H "Content-Type: application/json" \
    -H "X-Razorpay-Signature: invalid_signature" \
    -d '{"event":"payment.captured","payload":{}}')
BODY=$(echo "$RESPONSE" | head -n -1)
STATUS=$(echo "$RESPONSE" | tail -n 1)
test_endpoint "Invalid Webhook Signature" "403" "$STATUS" "$BODY"

echo ""
echo "=============================================="
echo "  Phase 5: Rate Limiting Tests"
echo "=============================================="

echo -e "\n--- Test 10: Rate Limiting (10 rapid requests) ---"
echo "Sending 10 rapid requests..."
RATE_LIMITED=0
for i in {1..10}; do
    STATUS=$(/usr/bin/curl -s -o /dev/null -w "%{http_code}" "$PAYMENT_URL/health")
    if [ "$STATUS" == "429" ]; then
        RATE_LIMITED=1
        break
    fi
done

if [ "$RATE_LIMITED" == "1" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Rate limiting is active"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ SKIP${NC} - Rate limiting not triggered (may need more requests)"
fi

echo ""
echo "=============================================="
echo "  Phase 6: Payment History Endpoint"
echo "=============================================="

echo -e "\n--- Test 11: Get Payment History ---"
RESPONSE=$(/usr/bin/curl -s -w "\n%{http_code}" "$PAYMENT_URL/payment/history/9999999999")
BODY=$(echo "$RESPONSE" | head -n -1)
STATUS=$(echo "$RESPONSE" | tail -n 1)
# Should return 200 with array (even if empty)
if [ "$STATUS" == "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Payment history retrieved"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - HTTP $STATUS"
    ((TESTS_FAILED++))
fi

echo ""
echo "=============================================="
echo "  Test Summary"
echo "=============================================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ "$TESTS_FAILED" == "0" ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
