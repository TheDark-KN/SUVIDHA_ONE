/**
 * High Input Stress Test for Suvidha One Backend
 * 
 * This script tests the backend with high input volumes to find:
 * - Maximum concurrent requests handling
 * - Memory and CPU bottlenecks
 * - Database connection pool limits
 * - Rate limiting effectiveness
 * 
 * Usage:
 *   k6 run stress-test.js
 *   k6 run -e MAX_VUS=1000 stress-test.js
 *   k6 run -e TEST_DURATION=5m stress-test.js
 */

import { check, sleep, group } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { randomItem, randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Custom metrics
const successRate = new Rate('success_rate');
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const requestsCounter = new Counter('requests_total');
const errorsByType = new Counter('errors_by_type');
const maxConcurrentRequests = new Gauge('max_concurrent_requests');
const throughput = new Rate('throughput');

// Configuration from environment
const MAX_VUS = parseInt(__ENV.MAX_VUS) || 500;
const TEST_DURATION = __ENV.TEST_DURATION || '3m';
const RAMP_UP_TIME = __ENV.RAMP_UP_TIME || '1m';
const BASE_URL = __ENV.BASE_URL || 'http://localhost';

// Service endpoints with realistic payloads
const ENDPOINTS = [
  {
    service: 'auth',
    method: 'POST',
    path: '/auth/otp/send',
    payload: () => ({
      mobile: `${randomItem(['9876543210', '8765432109', '7654321098'])}`,
      kiosk_id: `KIOSK${randomString(3, '0123456789').toUpperCase()}`,
    }),
    weight: 3,
  },
  {
    service: 'auth',
    method: 'POST',
    path: '/auth/otp/verify',
    payload: () => ({
      mobile: '9876543210',
      otp: `${randomString(6, '0123456789')}`,
      kiosk_id: 'KIOSK001',
    }),
    weight: 3,
  },
  {
    service: 'session',
    method: 'POST',
    path: '/sessions/create',
    payload: () => ({
      user_id: `user-${randomString(5, '0123456789')}`,
      kiosk_id: `KIOSK${randomString(3, '0123456789').toUpperCase()}`,
    }),
    weight: 2,
  },
  {
    service: 'utility',
    method: 'POST',
    path: '/bills/fetch',
    payload: () => ({
      consumer_id: `CONSUMER${randomString(3, '0123456789').toUpperCase()}`,
      department: randomItem(['electricity', 'water', 'gas']),
    }),
    headers: { 'Authorization': 'Bearer test-token' },
    weight: 2,
  },
  {
    service: 'payment',
    method: 'POST',
    path: '/payments/initiate',
    payload: () => ({
      bill_ids: [`bill-${randomString(5, '0123456789')}`],
      method: randomItem(['upi', 'card', 'netbanking']),
      idempotency_key: `idem-${randomString(10, 'abcdefghijklmnopqrstuvwxyz0123456789')}`,
    }),
    headers: { 'Authorization': 'Bearer test-token' },
    weight: 2,
  },
  {
    service: 'grievance',
    method: 'POST',
    path: '/grievances',
    payload: () => ({
      category: randomItem(['billing', 'service', 'technical']),
      department: randomItem(['electricity', 'water', 'gas']),
      subject: `Test grievance ${randomString(5)}`,
      description: `Description ${randomString(20)}`,
    }),
    headers: { 'Authorization': 'Bearer test-token' },
    weight: 1,
  },
  {
    service: 'document',
    method: 'POST',
    path: '/documents/apply',
    payload: () => ({
      doc_type: randomItem(['birth_certificate', 'aadhaar', 'pan']),
      name: `Document ${randomString(10)}`,
    }),
    headers: { 'Authorization': 'Bearer test-token' },
    weight: 1,
  },
  {
    service: 'notification',
    method: 'POST',
    path: '/notifications/send',
    payload: () => ({
      user_id: `user-${randomString(5)}`,
      notification_type: 'otp',
      channel: randomItem(['sms', 'email', 'whatsapp']),
      recipient: '+919876543210',
      message: `Your OTP is ${randomString(6, '0123456789')}`,
    }),
    weight: 1,
  },
  {
    service: 'kiosk',
    method: 'POST',
    path: `/kiosks/KIOSK${randomString(3, '0123456789').toUpperCase()}/heartbeat`,
    payload: () => ({}),
    weight: 2,
  },
];

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
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: RAMP_UP_TIME, target: MAX_VUS },
        { duration: TEST_DURATION, target: MAX_VUS },
        { duration: '1m', target: 0 },
      ],
      gracefulStop: '30s',
    },
  },
  
  thresholds: {
    http_req_duration: ['p(50)<300', 'p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.1'],
    success_rate: ['rate>0.90'],
    error_rate: ['rate<0.10'],
  },
  
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
};

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
  
  const payload = endpoint.payload ? JSON.stringify(endpoint.payload()) : null;
  
  let response;
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
  
  const responseTime = Date.now() - startTime;
  
  // Record metrics
  requestsCounter.add(1, { service: endpoint.service });
  responseTime.add(responseTime, { service: endpoint.service });
  maxConcurrentRequests.add(__VU);
  
  // Check response
  const success = check(response, {
    'status is 2xx or 4xx': (r) => r.status >= 200 && r.status < 500,
    'response time < 2s': (r) => r.timings.response_time < 2000,
  });
  
  successRate.add(success ? 1 : 0, { service: endpoint.service });
  errorRate.add(success ? 0 : 1, { service: endpoint.service });
  throughput.add(1);
  
  // Track error types
  if (!success) {
    const statusClass = Math.floor(response.status / 100);
    errorsByType.add(1, { type: `${statusClass}xx`, service: endpoint.service });
  }
  
  // Log slow responses
  if (responseTime > 1000) {
    console.log(`Slow response: ${endpoint.service} ${endpoint.method} ${endpoint.path} took ${responseTime}ms`);
  }
  
  // Small delay to prevent overwhelming
  sleep(0.1);
}

// Summary handler
export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Calculate breaking point indicators
  const errorRate95 = data.metrics.http_req_failed?.values?.rate || 0;
  const p99Latency = data.metrics.http_req_duration?.values?.['p(99)'] || 0;
  const maxVUsReached = data.state?.estMaxVus || 0;
  
  // Determine breaking point
  let breakingPoint = null;
  let breakingReason = null;
  
  if (errorRate95 > 0.5) {
    breakingPoint = maxVUsReached;
    breakingReason = 'High error rate (>50%)';
  } else if (p99Latency > 5000) {
    breakingPoint = maxVUsReached;
    breakingReason = 'P99 latency > 5s';
  }
  
  const summary = {
    test_type: 'stress_test',
    timestamp: timestamp,
    configuration: {
      max_vus: MAX_VUS,
      test_duration: TEST_DURATION,
      ramp_up_time: RAMP_UP_TIME,
    },
    results: {
      max_vus_reached: maxVUsReached,
      total_requests: data.metrics.requests_total?.values?.count || 0,
      success_rate: data.metrics.success_rate?.values?.rate || 0,
      error_rate: data.metrics.error_rate?.values?.rate || 0,
      http_reqs: data.metrics.http_reqs?.values?.count || 0,
      http_req_failed: data.metrics.http_req_failed?.values?.rate || 0,
      response_times: {
        avg: data.metrics.http_req_duration?.values?.avg || 0,
        min: data.metrics.http_req_duration?.values?.min || 0,
        max: data.metrics.http_req_duration?.values?.max || 0,
        p90: data.metrics.http_req_duration?.values?.['p(90)'] || 0,
        p95: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
        p99: data.metrics.http_req_duration?.values?.['p(99)'] || 0,
      },
    },
    breaking_point: breakingPoint,
    breaking_reason: breakingReason,
    service_breakdown: getServiceBreakdown(data),
  };
  
  return {
    stdout: formatSummary(summary),
    [`results/stress-test-${timestamp}.json`]: JSON.stringify(summary, null, 2),
  };
}

function getServiceBreakdown(data) {
  const services = ['auth', 'payment', 'utility', 'grievance', 'document', 'notification', 'session', 'kiosk'];
  const breakdown = {};
  
  for (const service of services) {
    breakdown[service] = {
      requests: data.metrics[`requests_total{service:${service}}`]?.values?.count || 0,
      success_rate: data.metrics[`success_rate{service:${service}}`]?.values?.rate || 0,
      avg_response: data.metrics[`response_time{service:${service}}`]?.values?.avg || 0,
    };
  }
  
  return breakdown;
}

function formatSummary(summary) {
  const r = summary.results;
  
  return `
╔══════════════════════════════════════════════════════════════╗
║              STRESS TEST RESULTS                              ║
╠══════════════════════════════════════════════════════════════╣
║ Configuration:                                               ║
║   Max VUs: ${summary.configuration.max_vus.toString().padEnd(51)}║
║   Duration: ${summary.configuration.test_duration.toString().padEnd(50)}║
╠══════════════════════════════════════════════════════════════╣
║ Results:                                                     ║
║   Max VUs Reached: ${summary.results.max_vus_reached.toString().padEnd(41)}║
║   Total Requests: ${r.total_requests.toString().padEnd(42)}║
║   Success Rate: ${(r.success_rate * 100).toFixed(2)}%${' '.repeat(40)}║
║   Error Rate: ${(r.error_rate * 100).toFixed(2)}%${' '.repeat(42)}║
╠══════════════════════════════════════════════════════════════╣
║ Response Times (ms):                                         ║
║   Average: ${r.response_times.avg.toFixed(2).padEnd(49)}║
║   P95: ${r.response_times.p95.toFixed(2).padEnd(53)}║
║   P99: ${r.response_times.p99.toFixed(2).padEnd(53)}║
║   Max: ${r.response_times.max.toFixed(2).padEnd(53)}║
╠══════════════════════════════════════════════════════════════╣
║ BREAKING POINT ANALYSIS:                                     ║
║   ${summary.breaking_point ? `Breaking Point: ${summary.breaking_point} VUs`.padEnd(55) : 'No breaking point detected'.padEnd(55)}║
║   ${summary.breaking_reason ? `Reason: ${summary.breaking_reason}`.padEnd(55) : 'System handled maximum load'.padEnd(55)}║
╚══════════════════════════════════════════════════════════════╝
`;
}
