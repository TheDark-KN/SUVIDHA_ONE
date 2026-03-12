# Suvidha One Backend - Load Test Results

## Test Execution Summary

| Test Run | Date | Scenario | Max VUs | Duration | Status |
|----------|------|----------|---------|----------|--------|
| #1 | - | - | - | - | - |

---

## System Configuration

### Test Environment
- **Test Machine**: -
- **k6 Version**: -
- **Test Location**: -

### Backend Environment
- **Environment**: Development / Staging / Production
- **Deployment**: Docker / Bare Metal / Kubernetes
- **Database**: PostgreSQL -
- **Redis**: -
- **Date**: -

### Service URLs
| Service | URL | Port |
|---------|-----|------|
| Auth Service | - | 3001 |
| Payment Service | - | 3002 |
| Utility Service | - | 3003 |
| Grievance Service | - | 3004 |
| Document Service | - | 3005 |
| Notification Service | - | 3006 |
| Session Service | - | 3007 |
| Kiosk Service | - | 3008 |

---

## Load Test Scenarios

### 1. Smoke Test
**Purpose**: Quick health check of all services  
**Duration**: 10 seconds  
**VUs**: 5 constant

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Success Rate | -% | >95% | - |
| Error Rate | -% | <5% | - |
| Avg Response Time | -ms | <200ms | - |
| P95 Response Time | -ms | <500ms | - |
| P99 Response Time | -ms | <1000ms | - |

**Results**: -

---

### 2. Load Test (Normal Expected Load)
**Purpose**: Test under normal expected production load  
**Duration**: 2.5 minutes  
**VUs**: 10 → 50 → 100 → 0

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Success Rate | -% | >95% | - |
| Error Rate | -% | <5% | - |
| Avg Response Time | -ms | <200ms | - |
| P95 Response Time | -ms | <500ms | - |
| P99 Response Time | -ms | <1000ms | - |
| Total Requests | - | - | - |
| Requests/sec | -/s | - | - |

**VU Stages**:
```
0:00 ────── 30s ────── 60s ────── 90s ────── 120s ────── 150s
10 VUs ────→ 50 VUs ────→ 100 VUs ────→ 0 VUs
```

**Results**: -

---

### 3. Stress Test (Breaking Point)
**Purpose**: Find the maximum capacity and breaking point  
**Duration**: 8 minutes  
**VUs**: 10 → 100 → 200 → 300 → 500 → 0

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Success Rate | -% | >90% | - |
| Error Rate | -% | <10% | - |
| Avg Response Time | -ms | <300ms | - |
| P95 Response Time | -ms | <800ms | - |
| P99 Response Time | -ms | <1500ms | - |
| Total Requests | - | - | - |

**Breaking Point Analysis**:
| Breaking Point | Reason | Timestamp |
|----------------|--------|-----------|
| - VUs | - | - |

**VU Stages**:
```
0:00 ──→ 1:00 ──→ 2:00 ──→ 3:00 ──→ 4:00 ──→ 5:00 ──→ 6:00 ──→ 7:00 ──→ 8:00
10 ────→ 100 ────→ 200 ────→ 300 ────→ 500 ────→ 0
```

**Results**: -

---

### 4. Spike Test (Traffic Burst)
**Purpose**: Test system behavior under sudden traffic spikes  
**Duration**: 2 minutes  
**VUs**: 10 → 300 → 10

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Success Rate | -% | >90% | - |
| Error Rate | -% | <10% | - |
| Avg Response Time | -ms | <500ms | - |
| P95 Response Time | -ms | <1500ms | - |
| P99 Response Time | -ms | <3000ms | - |
| Recovery Time | -s | <30s | - |

**VU Stages**:
```
0:00 ──→ 0:30 ──→ 0:40 ──→ 1:10 ──→ 1:20 ──→ 1:50
10 ────→ 300 ────→ 10 ────→ (recovery)
```

**Results**: -

---

### 5. Soak Test (Sustained Load)
**Purpose**: Test for memory leaks and stability under sustained load  
**Duration**: 10 minutes  
**VUs**: 100 constant

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Success Rate | -% | >95% | - |
| Error Rate | -% | <5% | - |
| Avg Response Time | -ms | <300ms | - |
| P95 Response Time | -ms | <800ms | - |
| P99 Response Time | -ms | <1500ms | - |
| Total Requests | - | - | - |
| Memory Usage Trend | - | Stable | - |

**Results**: -

---

## Service-Specific Results

### Auth Service (Port 3001)
| Endpoint | Avg Response | P95 | P99 | Success Rate | Max Load |
|----------|--------------|-----|-----|--------------|----------|
| POST /auth/otp/send | -ms | -ms | -ms | -% | - VUs |
| POST /auth/otp/verify | -ms | -ms | -ms | -% | - VUs |
| POST /auth/refresh | -ms | -ms | -ms | -% | - VUs |
| POST /auth/logout | -ms | -ms | -ms | -% | - VUs |
| GET /health | -ms | -ms | -ms | -% | - VUs |

**Bottlenecks**: -  
**Recommendations**: -

---

### Payment Service (Port 3002)
| Endpoint | Avg Response | P95 | P99 | Success Rate | Max Load |
|----------|--------------|-----|-----|--------------|----------|
| POST /payments/initiate | -ms | -ms | -ms | -% | - VUs |
| GET /payments/status/:id | -ms | -ms | -ms | -% | - VUs |
| POST /webhooks/upi/callback | -ms | -ms | -ms | -% | - VUs |
| GET /health | -ms | -ms | -ms | -% | - VUs |

**Bottlenecks**: -  
**Recommendations**: -

---

### Utility Service (Port 3003)
| Endpoint | Avg Response | P95 | P99 | Success Rate | Max Load |
|----------|--------------|-----|-----|--------------|----------|
| POST /bills/fetch | -ms | -ms | -ms | -% | - VUs |
| GET /bills/:id | -ms | -ms | -ms | -% | - VUs |
| GET /services | -ms | -ms | -ms | -% | - VUs |
| GET /health | -ms | -ms | -ms | -% | - VUs |

**Bottlenecks**: -  
**Recommendations**: -

---

### Grievance Service (Port 3004)
| Endpoint | Avg Response | P95 | P99 | Success Rate | Max Load |
|----------|--------------|-----|-----|--------------|----------|
| POST /grievances | -ms | -ms | -ms | -% | - VUs |
| GET /grievances | -ms | -ms | -ms | -% | - VUs |
| GET /grievances/:id | -ms | -ms | -ms | -% | - VUs |
| PATCH /grievances/:id/update | -ms | -ms | -ms | -% | - VUs |
| GET /health | -ms | -ms | -ms | -% | - VUs |

**Bottlenecks**: -  
**Recommendations**: -

---

### Document Service (Port 3005)
| Endpoint | Avg Response | P95 | P99 | Success Rate | Max Load |
|----------|--------------|-----|-----|--------------|----------|
| POST /documents/apply | -ms | -ms | -ms | -% | - VUs |
| GET /documents | -ms | -ms | -ms | -% | - VUs |
| GET /documents/:id | -ms | -ms | -ms | -% | - VUs |
| GET /health | -ms | -ms | -ms | -% | - VUs |

**Bottlenecks**: -  
**Recommendations**: -

---

### Notification Service (Port 3006)
| Endpoint | Avg Response | P95 | P99 | Success Rate | Max Load |
|----------|--------------|-----|-----|--------------|----------|
| POST /notifications/send | -ms | -ms | -ms | -% | - VUs |
| GET /health | -ms | -ms | -ms | -% | - VUs |

**Bottlenecks**: -  
**Recommendations**: -

---

### Session Service (Port 3007)
| Endpoint | Avg Response | P95 | P99 | Success Rate | Max Load |
|----------|--------------|-----|-----|--------------|----------|
| POST /sessions/create | -ms | -ms | -ms | -% | - VUs |
| POST /sessions/refresh | -ms | -ms | -ms | -% | - VUs |
| GET /sessions/:id | -ms | -ms | -ms | -% | - VUs |
| DELETE /sessions/:id | -ms | -ms | -ms | -% | - VUs |
| GET /health | -ms | -ms | -ms | -% | - VUs |

**Bottlenecks**: -  
**Recommendations**: -

---

### Kiosk Service (Port 3008)
| Endpoint | Avg Response | P95 | P99 | Success Rate | Max Load |
|----------|--------------|-----|-----|--------------|----------|
| POST /kiosks/register | -ms | -ms | -ms | -% | - VUs |
| GET /kiosks | -ms | -ms | -ms | -% | - VUs |
| GET /kiosks/:id | -ms | -ms | -ms | -% | - VUs |
| POST /kiosks/:id/heartbeat | -ms | -ms | -ms | -% | - VUs |
| GET /kiosks/:id/config | -ms | -ms | -ms | -% | - VUs |
| GET /health | -ms | -ms | -ms | -% | - VUs |

**Bottlenecks**: -  
**Recommendations**: -

---

## Breaking Points Analysis

### Where the System Broke

| Test Scenario | Breaking Point (VUs) | Failure Mode | Affected Services |
|---------------|----------------------|--------------|-------------------|
| Stress Test | - | - | - |
| Spike Test | - | - | - |
| Soak Test | - | - | - |

### Failure Modes Observed

1. **HTTP 500 Errors**
   - Started at: - VUs
   - Affected endpoints: -
   - Root cause: -

2. **HTTP 502/503/504 Errors**
   - Started at: - VUs
   - Affected endpoints: -
   - Root cause: -

3. **Timeout Errors**
   - Started at: - VUs
   - Affected endpoints: -
   - Root cause: -

4. **Database Connection Pool Exhaustion**
   - Started at: - VUs
   - Affected services: -
   - Root cause: -

5. **Memory Issues**
   - Started at: - minutes into soak test
   - Affected services: -
   - Root cause: -

---

## Capacity Recommendations

### Current Capacity
| Metric | Value |
|--------|-------|
| Max Concurrent Users | - |
| Max Requests/sec | -/s |
| Recommended Safe Load | - VUs |
| Breaking Point | - VUs |

### Scaling Recommendations

#### Immediate Actions
1. -
2. -
3. -

#### Short-term Improvements
1. -
2. -
3. -

#### Long-term Architecture Changes
1. -
2. -
3. -

---

## Performance Trends

### Response Time by Load
| VUs | Avg RT | P95 RT | P99 RT | Error Rate |
|-----|--------|--------|--------|------------|
| 10 | -ms | -ms | -ms | -% |
| 50 | -ms | -ms | -ms | -% |
| 100 | -ms | -ms | -ms | -% |
| 200 | -ms | -ms | -ms | -% |
| 300 | -ms | -ms | -ms | -% |
| 500 | -ms | -ms | -ms | -% |

### Throughput Analysis
| VUs | Requests/sec | Success/sec | Failure/sec |
|-----|--------------|-------------|-------------|
| 10 | -/s | -/s | -/s |
| 50 | -/s | -/s | -/s |
| 100 | -/s | -/s | -/s |
| 200 | -/s | -/s | -/s |
| 300 | -/s | -/s | -/s |
| 500 | -/s | -/s | -/s |

---

## Test Artifacts

### Generated Files
- `results/stress-test-*.json` - Stress test detailed results
- `results/spike-test-*.json` - Spike test detailed results
- `results/soak-test-*.json` - Soak test detailed results
- `results/load-test-*.json` - Load test detailed results

### How to Run Tests

```bash
# Run all tests
./k6-tests/run-tests.sh

# Run specific test
k6 run k6-tests/load-test-runner.js --scenario stress

# Run stress test with custom VUs
MAX_VUS=1000 k6 run k6-tests/stress-test.js

# Run soak test with custom duration
TEST_DURATION=30m k6 run k6-tests/soak-test.js
```

---

## Appendix

### Test Data Used
See `k6-tests/test-data.js` for test data configuration.

### k6 Configuration
See individual test files for scenario configurations.

### Environment Variables
```bash
AUTH_URL=http://localhost:3001
PAYMENT_URL=http://localhost:3002
UTILITY_URL=http://localhost:3003
GRIEVANCE_URL=http://localhost:3004
DOCUMENT_URL=http://localhost:3005
NOTIFICATION_URL=http://localhost:3006
SESSION_URL=http://localhost:3007
KIOSK_URL=http://localhost:3008
```

---

**Last Updated**: -  
**Test Conducted By**: -  
**Report Version**: 1.0
