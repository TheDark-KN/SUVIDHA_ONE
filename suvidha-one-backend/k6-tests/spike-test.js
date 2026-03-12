/**
 * Spike Test for Suvidha One Backend
 * 
 * Tests system behavior under sudden traffic bursts
 * - Sudden increase from normal to peak load
 * - System recovery after spike
 * - Rate limiting and circuit breaker behavior
 * 
 * Usage:
 *   k6 run spike-test.js
 *   k6 run -e SPIKE_VUS=500 spike-test.js
 */

import { check, sleep, group } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomItem, randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Import shared test data
import { testData } from './test-data.js';

// Custom metrics
const successRate = new Rate('success_rate');
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const spikeRecovery = new Rate('spike_recovery');

// Configuration
const SPIKE_VUS = parseInt(__ENV.SPIKE_VUS) || 300;
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

// Test endpoints
const ENDPOINTS = [
  { service: 'auth', method: 'POST', path: '/auth/otp/send', payload: () => testData.auth.sendOtp.valid },
  { service: 'auth', method: 'POST', path: '/auth/otp/verify', payload: () => testData.auth.verifyOtp.valid },
  { service: 'session', method: 'POST', path: '/sessions/create', payload: () => testData.session.create.valid },
  { service: 'utility', method: 'POST', path: '/bills/fetch', payload: () => testData.utility.fetchBills.valid, headers: { 'Authorization': 'Bearer test-token' } },
  { service: 'payment', method: 'POST', path: '/payments/initiate', payload: () => testData.payment.initiate.valid, headers: { 'Authorization': 'Bearer test-token' } },
  { service: 'grievance', method: 'POST', path: '/grievances', payload: () => testData.grievance.create.valid, headers: { 'Authorization': 'Bearer test-token' } },
  { service: 'document', method: 'POST', path: '/documents/apply', payload: () => testData.document.apply.valid, headers: { 'Authorization': 'Bearer test-token' } },
  { service: 'notification', method: 'POST', path: '/notifications/send', payload: () => testData.notification.send.valid },
  { service: 'kiosk', method: 'POST', path: '/kiosks/KIOSK001/heartbeat', payload: () => ({}) },
];

// Test configuration
export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 10 },    // Normal load baseline
        { duration: '10s', target: SPIKE_VUS },  // Sudden spike
        { duration: '30s', target: SPIKE_VUS },  // Hold spike
        { duration: '10s', target: 10 },    // Sudden drop
        { duration: '50s', target: 10 },    // Recovery period
      ],
      gracefulStop: '10s',
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    http_req_failed: ['rate<0.15'],
    success_rate: ['rate>0.85'],
    spike_recovery: ['rate>0.90'],
  },
  
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Main test function
export default function () {
  const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
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
  
  const success = check(response, {
    'status < 500': (r) => r.status < 500,
    'response time < 3s': (r) => rt < 3000,
  });
  
  successRate.add(success ? 1 : 0, { service: endpoint.service });
  errorRate.add(success ? 0 : 1, { service: endpoint.service });
  
  // Track recovery (success after spike)
  if (__scenarioIter > 40) { // During recovery period
    spikeRecovery.add(success ? 1 : 0);
  }
  
  sleep(0.2);
}

// Summary
export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  const summary = {
    test_type: 'spike_test',
    timestamp: timestamp,
    configuration: {
      spike_vus: SPIKE_VUS,
      baseline_vus: 10,
    },
    results: {
      total_requests: data.metrics.http_reqs?.values?.count || 0,
      success_rate: data.metrics.success_rate?.values?.rate || 0,
      error_rate: data.metrics.error_rate?.values?.rate || 0,
      spike_recovery_rate: data.metrics.spike_recovery?.values?.rate || 0,
      response_times: {
        avg: data.metrics.http_req_duration?.values?.avg || 0,
        p95: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
        p99: data.metrics.http_req_duration?.values?.['p(99)'] || 0,
        max: data.metrics.http_req_duration?.values?.max || 0,
      },
    },
  };
  
  return {
    stdout: `
╔══════════════════════════════════════════════════════════════╗
║              SPIKE TEST RESULTS                               ║
╠══════════════════════════════════════════════════════════════╣
║ Spike VUs: ${SPIKE_VUS.toString().padEnd(49)}║
║ Baseline VUs: 10${' '.repeat(45)}║
╠══════════════════════════════════════════════════════════════╣
║ Success Rate: ${(summary.results.success_rate * 100).toFixed(2)}%${' '.repeat(40)}║
║ Recovery Rate: ${(summary.results.spike_recovery_rate * 100).toFixed(2)}%${' '.repeat(39)}║
║ P95 Response: ${summary.results.response_times.p95.toFixed(2).padEnd(45)}║
║ P99 Response: ${summary.results.response_times.p99.toFixed(2).padEnd(45)}║
╚══════════════════════════════════════════════════════════════╝
`,
    [`results/spike-test-${timestamp}.json`]: JSON.stringify(summary, null, 2),
  };
}
