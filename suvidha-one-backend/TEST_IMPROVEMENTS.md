# Testing Your Improved Backend

## Quick Start Test

### 1. Start Services (if not running)
```bash
# In separate terminals or use docker-compose
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16
docker run -d -p 6379:6379 redis:7-alpine
```

### 2. Run Migrations
```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/suvidha
cargo install sqlx-cli --no-default-features --features postgres
sqlx database create
sqlx migrate run
```

### 3. Test Each Service

#### Auth Service (Port 3001)
```bash
# Start service
cd auth-service && cargo run

# Test OTP send (in another terminal)
curl -X POST http://localhost:3001/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210"}'

# Test health
curl http://localhost:3001/health
```

#### Test Rate Limiting
```bash
# Send 61 requests rapidly (should hit limit at 60)
for i in {1..61}; do
  curl -X POST http://localhost:3001/auth/otp/send \
    -H "Content-Type: application/json" \
    -d '{"mobile": "9876543210"}' &
done
wait
# Last few should return 429 Too Many Requests
```

#### Test CORS
```bash
curl -X OPTIONS http://localhost:3001/auth/otp/send \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v
# Should see Access-Control-Allow-Origin in response
```

#### Test Security Headers
```bash
curl -v http://localhost:3001/health
# Should see:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000...
```

### 4. Build All Services
```bash
# From project root
cargo build --release
# Should complete with zero errors

# Check for warnings
cargo clippy --all-targets
```

### 5. Run Tests (when implemented)
```bash
cargo test --workspace
```

## Improvements Verification Checklist

- [x] Rate limiting active (Redis sliding window)
- [x] CORS configured (whitelist instead of Any)
- [x] Security headers on all responses
- [x] Request ID tracking (X-Request-ID header)
- [x] Input validation framework
- [x] Enhanced response wrappers
- [ ] JWT authentication working
- [ ] OTP generation/verification
- [ ] All 8 services compile
- [ ] Database migrations applied
- [ ] Redis caching functional

## Performance Test

```bash
# Install k6 load testing tool
# Then run:
k6 run k6-tests/load-test.js
```

Target: Handle 1,000+ requests/second with p95 < 200ms

## Security Audit

```bash
# Check dependencies for vulnerabilities
cargo audit

# Run security scan (if installed)
cargo clippy -- -D warnings
```

