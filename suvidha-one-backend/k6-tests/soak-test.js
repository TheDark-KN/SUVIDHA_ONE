/**
 * Soak Test (Endurance Test) for Suvidha One Backend
 * 
 * Tests system stability under sustained load over extended period
 * - Memory leak detection
 * - Database connection pool stability
 * - Garbage collection issues
 * - Resource exhaustion
 * 
 * Usage:
 *   k6 run soak-test.js
 *   k6 run -e SOAK_VUS=100 -e SOAK_DURATION=30m soak-test.js
 */

import { check, sleep, group } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { randomItem, randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Import shared test data
import { testData } from './test-data.js';

// Custom metrics
const successRate = new Rate('success_rate');
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const requestsCounter = new Counter('requests_total');
const errorsOverTime = new Counter('errors_over_time');
const memoryPressure = new Gauge('memory_pressure_indicator');
const degradationRate = new Rate('degradation_rate');

// Configuration
const SOAK_VUS = parseInt(__ENV.SOAK_VUS) || 100;
const SOAK_DURATION = __ENV.SOAK_DURATION || '10m';
const BASE_URL = __ENV.BASE_URL || 'http://localhost';

// Service URLs
const SERVICE_URLS = {
  auth: __ENV.AUTH_URL || `${BASE_URL}:3001`,
  payment: __ENV.PAYMENT_URL || `${BASE_URL}:3002`,
  utility: __ENV.UTILITY_URL || `${BASE_URL}:3003`,
  grievance: __ENV.GRIEVANCE_URL || `${BASE_URL}:3004`,
  document: __ENV.DOCUMENT_URL || `${BASE_URL}:3005`,
  notification: __ENV.NOTIFICATION_URL || `${BASE_URL}:3006`,
  session: __ENV.SESSION_URL || `${BASE_URL}:3007`,
  kiosk: __ENV.KIOSK_URL || `${BASE_URL}:3008`,
};

// Test endpoints with realistic distribution
const ENDPOINTS = [
  { service: 'auth', method: 'POST', path: '/auth/otp/send', payload: () => testData.auth.sendOtp.valid, weight: 3 },
  { service: 'auth', method: 'POST', path: '/auth/otp/verify', payload: () => testData.auth.verifyOtp.valid, weight: 3 },
  { service: 'session', method: 'POST', path: '/sessions/create', payload: () => testData.session.create.valid, weight: 2 },
  { service: 'session', method: 'POST', path: '/sessions/refresh', payload: () => testData.session.refresh.valid, weight: 1 },
  { service: 'utility', method: 'POST', path: '/bills/fetch', payload: () => testData.utility.fetchBills.valid, headers: { 'Authorization': 'Bearer test-token' }, weight: 2 },
  { service: 'payment', method: 'POST', path: '/payments/initiate', payload: () => testData.payment.initiate.valid, headers: { 'Authorization': 'Bearer test-token' }, weight: 2 },
  { service: 'grievance', method: 'POST', path: '/grievances', payload: () => testData.grievance.create.valid, headers: { 'Authorization': 'Bearer test-token' }, weight: 1 },
  { service: 'document', method: 'POST', path: '/documents/apply', payload: () => testData.document.apply.valid, headers: { 'Authorization': 'Bearer test-token' }, weight: 1 },
  { service: 'notification', method: 'POST', path: '/notifications/send', payload: () => testData.notification.send.valid, weight: 1 },
  { service: 'kiosk', method: 'POST', path: '/kiosks/KIOSK001/heartbeat', payload: () => ({}), weight: 2 },
];

// Weighted endpoint selection
function selectEndpoint() {
  const totalWeight = ENDPOINTS.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const endpoint of ENDPOINTS) {
    random -= endpoint.weight;
    if (random <= 0) return endpoint;
  }
  
  return ENDPOINTS[0];
}

// Test configuration
export const options = {
  scenarios: {
    soak: {
      executor: 'constant-vus',
      vus: SOAK_VUS,
      duration: SOAK_DURATION,
      gracefulStop: '30s',
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.05'],
    success_rate: ['rate>0.95'],
    error_rate: ['rate<0.05'],
  },
  
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Track response times over test duration for degradation detection
let responseTimeSamples = [];
let errorSamples = [];

// Main test function
export default function () {
  const endpoint = selectEndpoint();
  const url = `${SERVICE_URLS[endpoint.service]}${endpoint.path}`;
  const startTime = Date.now();
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      ...(endpoint.headers || {}),
    },
  };
  
  let response;
  const payload = endpoint.payload ? JSON.stringify(endpoint.payload()) : null;
  
  switch (endpoint.method) {
    case 'POST':
      response = http.post(url, payload, params);
      break;
    case 'GET':
      response = http.get(url, params);
      break;
    case 'PUT':
      response = http.put(url, payload, params);
      break;
    case 'PATCH':
      response = http.patch(url, payload, params);
      break;
    case 'DELETE':
      response = http.del(url, null, params);
      break;
  }
  
  const rt = Date.now() - startTime;
  responseTime.add(rt, { service: endpoint.service });
  requestsCounter.add(1, { service: endpoint.service });
  
  // Sample response times for degradation detection
  if (__ITER % 10 === 0) {
    responseTimeSamples.push({ time: Date.now(), rt, vu: __VU });
    if (responseTimeSamples.length > 1000) {
      responseTimeSamples.shift();
    }
  }
  
  const success = check(response, {
    'status < 500': (r) => r.status < 500,
    'response time < 2s': (r) => rt < 2000,
  });
  
  successRate.add(success ? 1 : 0, { service: endpoint.service });
  errorRate.add(success ? 0 : 1, { service: endpoint.service });
  
  if (!success) {
    errorsOverTime.add(1);
    errorSamples.push({ time: Date.now(), error: true });
  }
  
  // Memory pressure indicator (based on response time growth)
  if (rt > 1000) {
    memoryPressure.add(1);
  }
  
  // Detect degradation (compare recent samples to early samples)
  if (responseTimeSamples.length > 500) {
    const earlyAvg = responseTimeSamples.slice(0, 100).reduce((s, x) => s + x.rt, 0) / 100;
    const recentAvg = responseTimeSamples.slice(-100).reduce((s, x) => s + x.rt, 0) / 100;
    const degradation = (recentAvg - earlyAvg) / earlyAvg;
    degradationRate.add(degradation > 0.5 ? 1 : 0);
  }
  
  sleep(0.3);
}

// Summary
export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Calculate degradation
  const degradationRateValue = data.metrics.degradation_rate?.values?.rate || 0;
  const degradationDetected = degradationRateValue > 0.1;
  
  const summary = {
    test_type: 'soak_test',
    timestamp: timestamp,
    configuration: {
      vus: SOAK_VUS,
      duration: SOAK_DURATION,
    },
    results: {
      total_requests: data.metrics.requests_total?.values?.count || 0,
      success_rate: data.metrics.success_rate?.values?.rate || 0,
      error_rate: data.metrics.error_rate?.values?.rate || 0,
      degradation_rate: degradationRateValue,
      degradation_detected: degradationDetected,
      memory_pressure_events: data.metrics.memory_pressure?.values?.count || 0,
      response_times: {
        avg: data.metrics.http_req_duration?.values?.avg || 0,
        p95: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
        p99: data.metrics.http_req_duration?.values?.['p(99)'] || 0,
        max: data.metrics.http_req_duration?.values?.max || 0,
      },
    },
    stability_analysis: {
      stable: !degradationDetected && (data.metrics.error_rate?.values?.rate || 0) < 0.05,
      issues: [],
    },
  };
  
  // Add stability issues
  if (degradationDetected) {
    summary.stability_analysis.issues.push('Performance degradation detected over time');
  }
  if ((data.metrics.error_rate?.values?.rate || 0) > 0.05) {
    summary.stability_analysis.issues.push('Error rate above 5% threshold');
  }
  if ((data.metrics.memory_pressure?.values?.count || 0) > 100) {
    summary.stability_analysis.issues.push('High memory pressure detected');
  }
  
  return {
    stdout: `
╔══════════════════════════════════════════════════════════════╗
║              SOAK TEST RESULTS                                ║
╠══════════════════════════════════════════════════════════════╣
║ VUs: ${SOAK_VUS.toString().padEnd(55)}║
║ Duration: ${SOAK_DURATION.toString().padEnd(50)}║
╠══════════════════════════════════════════════════════════════╣
║ Total Requests: ${data.metrics.requests_total?.values?.count || 0}${' '.repeat(42)}║
║ Success Rate: ${(summary.results.success_rate * 100).toFixed(2)}%${' '.repeat(40)}║
║ Error Rate: ${(summary.results.error_rate * 100).toFixed(2)}%${' '.repeat(42)}║
╠══════════════════════════════════════════════════════════════╣
║ Response Times (ms):                                         ║
║   Average: ${summary.results.response_times.avg.toFixed(2).padEnd(49)}║
║   P95: ${summary.results.response_times.p95.toFixed(2).padEnd(53)}║
║   P99: ${summary.results.response_times.p99.toFixed(2).padEnd(53)}║
╠══════════════════════════════════════════════════════════════╣
║ STABILITY ANALYSIS:                                          ║
║   ${summary.stability_analysis.stable ? '✓ System STABLE under sustained load'.padEnd(55) : '✗ System UNSTABLE - Issues detected'.padEnd(55)}║
║   Degradation: ${degradationDetected ? 'DETECTED' : 'None'}${' '.repeat(43)}║
║   Memory Pressure: ${data.metrics.memory_pressure?.values?.count || 0} events${' '.repeat(35)}║
╚══════════════════════════════════════════════════════════════╝
`,
    [`results/soak-test-${timestamp}.json`]: JSON.stringify(summary, null, 2),
  };
}
