# K6 Load Tests for Suvidha One Backend

This directory contains comprehensive load testing scripts for the Suvidha One backend services using [k6](https://k6.io/).

## 📋 Overview

| Test Type | Purpose | Duration | Max VUs | Use Case |
|-----------|---------|----------|---------|----------|
| **Smoke** | Health check | 10s | 5 | Quick validation |
| **Load** | Normal load | 2.5m | 100 | Expected traffic |
| **Stress** | Breaking point | 8m | 500+ | Capacity planning |
| **Spike** | Traffic bursts | 2m | 300+ | Sudden traffic |
| **Soak** | Stability | 10m+ | 100 | Memory leaks |

## 🚀 Quick Start

### Prerequisites

1. **Install k6**
   ```bash
   # macOS
   brew install k6
   
   # Windows
   winget install k6
   
   # Linux (Debian/Ubuntu)
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1269
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update && sudo apt-get install k6
   
   # Docker
   docker run --rm grafana/k6 version
   ```

2. **Start Backend Services**
   ```bash
   docker-compose up -d
   ```

3. **Check Services**
   ```bash
   ./run-tests.sh check
   ```

### Running Tests

```bash
# Quick smoke test
./run-tests.sh smoke

# Standard load test
./run-tests.sh load

# Stress test (find breaking point)
./run-tests.sh stress

# Stress test with custom VUs
./run-tests.sh stress -v 1000

# Spike test
./run-tests.sh spike

# Soak test (10 minutes)
./run-tests.sh soak

# Soak test (30 minutes)
./run-tests.sh soak -d 30m

# Run all tests
./run-tests.sh all
```

## 📁 Test Files

| File | Description |
|------|-------------|
| `load-test-runner.js` | Multi-scenario test runner (smoke, load, stress, spike, soak) |
| `stress-test.js` | Dedicated stress test with high input handling |
| `spike-test.js` | Traffic burst simulation |
| `soak-test.js` | Long-running stability test |
| `run-tests.sh` | Bash script for easy test execution |
| `LOAD_TEST_RESULTS.md` | Template for recording test results |
| `*-service.js` | Individual service test modules |
| `test-data.js` | Shared test data |
| `shared.js` | Shared utilities and configurations |

## 📊 Test Scenarios

### 1. Smoke Test
Quick health check of all services.

```bash
k6 run --scenario smoke load-test-runner.js
```

**Configuration:**
- VUs: 5 (constant)
- Duration: 10 seconds
- Purpose: Verify all services are running

### 2. Load Test
Tests under normal expected production load.

```bash
k6 run --scenario load load-test-runner.js
```

**Configuration:**
```
0:00 ────── 30s ────── 60s ────── 90s ────── 120s ────── 150s
10 VUs ────→ 50 VUs ────→ 100 VUs ────→ 0 VUs
```

### 3. Stress Test
Finds the breaking point of the system.

```bash
# Using load-test-runner.js
k6 run --scenario stress load-test-runner.js

# Using dedicated stress test
MAX_VUS=1000 k6 run stress-test.js
```

**Configuration:**
```
0:00 ──→ 1:00 ──→ 2:00 ──→ 3:00 ──→ 4:00 ──→ 5:00 ──→ 6:00 ──→ 7:00 ──→ 8:00
10 ────→ 100 ────→ 200 ────→ 300 ────→ 500 ────→ 0
```

**What it measures:**
- Maximum concurrent requests
- Database connection pool limits
- Memory and CPU bottlenecks
- Rate limiting effectiveness

### 4. Spike Test
Tests system behavior under sudden traffic bursts.

```bash
SPIKE_VUS=500 k6 run spike-test.js
```

**Configuration:**
```
0:00 ──→ 0:30 ──→ 0:40 ──→ 1:10 ──→ 1:20 ──→ 1:50
10 ────→ 300 ────→ 10 ────→ (recovery)
```

**What it measures:**
- Auto-scaling response time
- System recovery after spike
- Circuit breaker behavior

### 5. Soak Test
Tests for memory leaks and stability under sustained load.

```bash
SOAK_VUS=100 SOAK_DURATION=30m k6 run soak-test.js
```

**Configuration:**
- VUs: 100 (constant)
- Duration: 10 minutes (configurable)

**What it measures:**
- Memory leaks
- Database connection pool stability
- Garbage collection issues
- Performance degradation over time

## 🎯 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_URL` | `http://localhost:3001` | Auth service URL |
| `PAYMENT_URL` | `http://localhost:3002` | Payment service URL |
| `UTILITY_URL` | `http://localhost:3003` | Utility service URL |
| `GRIEVANCE_URL` | `http://localhost:3004` | Grievance service URL |
| `DOCUMENT_URL` | `http://localhost:3005` | Document service URL |
| `NOTIFICATION_URL` | `http://localhost:3006` | Notification service URL |
| `SESSION_URL` | `http://localhost:3007` | Session service URL |
| `KIOSK_URL` | `http://localhost:3008` | Kiosk service URL |
| `MAX_VUS` | `500` | Max VUs for stress test |
| `SOAK_VUS` | `100` | VUs for soak test |
| `SOAK_DURATION` | `10m` | Duration for soak test |
| `SPIKE_VUS` | `300` | VUs for spike test |

## 📈 Results and Reporting

### Output Files

Tests generate JSON results in the `results/` directory:

```
results/
├── stress-test-2026-03-11T12-00-00-000Z.json
├── spike-test-2026-03-11T12-10-00-000Z.json
├── soak-test-2026-03-11T12-15-00-000Z.json
└── load-test-load-2026-03-11T12-30-00-000Z.json
```

### Viewing Results

```bash
# View latest results
cat results/*.json | jq

# View specific test result
cat results/stress-test-*.json | jq '.results'
```

### Recording Results

1. Open `LOAD_TEST_RESULTS.md`
2. Fill in the test results tables
3. Document breaking points
4. Add performance trends
5. Note recommendations

## 🔍 Identifying Breaking Points

### What to Look For

1. **HTTP 500 Errors**
   ```bash
   # In k6 output, look for:
   http_req_failed: 0.5 (50% failure rate)
   ```

2. **High Response Times**
   ```bash
   # P99 latency spikes
   p(99): 5000ms (threshold: 1000ms)
   ```

3. **Error Rate Increase**
   ```bash
   # Error rate threshold breached
   error_rate: 0.15 (15% errors)
   ```

4. **Memory Pressure**
   ```bash
   # In soak test
   memory_pressure_events: 500
   degradation_detected: true
   ```

### Common Breaking Points

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| HTTP 500 at high VUs | Database pool exhausted | Increase `max_connections` |
| P99 > 5s | CPU saturation | Scale horizontally |
| Timeouts | Network bottleneck | Optimize queries, add caching |
| Memory growth | Memory leak | Profile application |
| Error rate spike | Rate limiting | Adjust limits, add queuing |

## 📝 Example Test Run

```bash
# Run stress test to find breaking point
$ ./run-tests.sh stress -v 800

╔══════════════════════════════════════════════════════════════╗
║         Suvidha One Backend - Load Testing                   ║
╚══════════════════════════════════════════════════════════════╝

[INFO] k6 found: k6 v0.45.0
[INFO] Results will be saved to: results/
[INFO] Running Stress Test...

Configuration:
  Max VUs: 800
  Duration: 8m

     ✓ success_rate: 95.2%
     ✓ error_rate: 4.8%
     ✓ http_req_duration: p(95)=450ms

[SUCCESS] Stress test completed successfully

Results saved to: results/stress-test-2026-03-11T12-00-00-000Z.json
```

## 🎛️ Advanced Usage

### Custom Thresholds

```javascript
// In test file, modify thresholds
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of requests < 300ms
    http_req_failed: ['rate<0.01'],   // < 1% errors
  },
};
```

### Distributed Testing

```bash
# Run on multiple machines for higher load
# Machine 1
k6 run --out influxdb=http://localhost:8086/k6 stress-test.js

# Machine 2
k6 run --out influxdb=http://localhost:8086/k6 stress-test.js
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run Load Tests
  run: |
    docker-compose up -d
    ./k6-tests/run-tests.sh smoke
    ./k6-tests/run-tests.sh load
```

## 🐛 Troubleshooting

### Tests Fail Immediately

```bash
# Check if services are running
./run-tests.sh check

# Check environment variables
echo $AUTH_URL
echo $PAYMENT_URL

# Test manually
curl http://localhost:3001/health
```

### k6 Memory Issues

```bash
# Limit k6 memory usage
export GOGC=50
k6 run stress-test.js
```

### Slow Response Times

1. Check database performance
2. Monitor system resources
3. Review application logs
4. Check network latency

## 📚 Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 JavaScript API](https://k6.io/docs/javascript-api/)
- [Load Testing Best Practices](https://k6.io/blog/load-testing-best-practices/)
- [Performance Testing Guide](https://github.com/k6io/performance-testing-guide)

## 📊 Service Coverage

| Service | Endpoints Tested | Test File |
|---------|-----------------|-----------|
| Auth | 5 | `auth-service.js` |
| Payment | 4 | `payment-service.js` |
| Utility | 4 | `utility-service.js` |
| Grievance | 5 | `grievance-service.js` |
| Document | 4 | `document-service.js` |
| Notification | 2 | `notification-service.js` |
| Session | 5 | `session-service.js` |
| Kiosk | 6 | `kiosk-service.js` |

---

**Last Updated**: March 11, 2026  
**k6 Version**: v0.45.0+  
**Backend Version**: See main README
