/**
 * Comprehensive Load Test Runner for Suvidha One Backend
 * 
 * This script runs load tests across all backend services with configurable scenarios:
 * - Smoke Test: Quick health check
 * - Load Test: Normal expected load
 * - Stress Test: Breaking point identification
 * - Spike Test: Sudden traffic bursts
 * - Soak Test: Sustained load over time
 * 
 * Usage:
 *   k6 run --scenario smoke load-test-runner.js
 *   k6 run --scenario load load-test-runner.js
 *   k6 run --scenario stress load-test-runner.js
 *   k6 run --scenario spike load-test-runner.js
 *   k6 run --scenario soak load-test-runner.js
 * 
 * Or with environment variables:
 *   K6_SCENARIO=stress k6 run load-test-runner.js
 */

import { group, sleep, check } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter } from 'k6/metrics';

// Import service test modules
import { testAllAuthEndpoints } from './auth-service.js';
import { testAllPaymentEndpoints } from './payment-service.js';
import { testAllUtilityEndpoints } from './utility-service.js';
import { testAllGrievanceEndpoints } from './grievance-service.js';
import { testAllDocumentEndpoints } from './document-service.js';
import { testAllNotificationEndpoints } from './notification-service.js';
import { testAllSessionEndpoints } from './session-service.js';
import { testAllKioskEndpoints } from './kiosk-service.js';
import { BASE_URLS } from './shared.js';

// Custom metrics
const successRate = new Rate('success_rate');
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const requestsPerService = new Counter('requests_per_service');
const breakingPoint = new Trend('breaking_point_vus');

// Test scenario configuration from environment or defaults
const SCENARIO = __ENV.K6_SCENARIO || __ENV.SCENARIO || 'load';

// Configuration for different scenarios
export const options = {
  scenarios: {
    // Quick smoke test - 10 seconds
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '10s',
      gracefulStop: '5s',
      tags: { test_type: 'smoke' },
    },
    
    // Load test - 2 minutes, normal expected load
    load: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 50 },   // Ramp up to 50 VUs
        { duration: '30s', target: 50 },   // Stay at 50 VUs
        { duration: '30s', target: 100 },  // Ramp up to 100 VUs
        { duration: '30s', target: 100 },  // Stay at 100 VUs
        { duration: '30s', target: 0 },    // Ramp down
      ],
      gracefulStop: '10s',
      tags: { test_type: 'load' },
    },
    
    // Stress test - find breaking point
    stress: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 100 },   // Ramp to 100
        { duration: '1m', target: 100 },   // Hold at 100
        { duration: '1m', target: 200 },   // Ramp to 200
        { duration: '1m', target: 200 },   // Hold at 200
        { duration: '1m', target: 300 },   // Ramp to 300
        { duration: '1m', target: 300 },   // Hold at 300
        { duration: '1m', target: 500 },   // Ramp to 500
        { duration: '1m', target: 500 },   // Hold at 500
        { duration: '1m', target: 0 },     // Ramp down
      ],
      gracefulStop: '30s',
      tags: { test_type: 'stress' },
    },
    
    // Spike test - sudden traffic burst
    spike: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 10 },   // Normal load
        { duration: '10s', target: 300 },  // Sudden spike to 300 VUs
        { duration: '30s', target: 300 },  // Hold spike
        { duration: '10s', target: 10 },   // Sudden drop
        { duration: '30s', target: 10 },   // Recovery
      ],
      gracefulStop: '10s',
      tags: { test_type: 'spike' },
    },
    
    // Soak test - sustained load over time
    soak: {
      executor: 'constant-vus',
      vus: 100,
      duration: '10m',
      gracefulStop: '30s',
      tags: { test_type: 'soak' },
    },
  },
  
  thresholds: {
    http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
    success_rate: ['rate>0.95'],
    error_rate: ['rate<0.05'],
  },
  
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Service configuration
const SERVICES = {
  auth: { name: 'Auth Service', testFn: testAllAuthEndpoints, weight: 3 },
  payment: { name: 'Payment Service', testFn: testAllPaymentEndpoints, weight: 2 },
  utility: { name: 'Utility Service', testFn: testAllUtilityEndpoints, weight: 2 },
  grievance: { name: 'Grievance Service', testFn: testAllGrievanceEndpoints, weight: 1 },
  document: { name: 'Document Service', testFn: testAllDocumentEndpoints, weight: 1 },
  notification: { name: 'Notification Service', testFn: testAllNotificationEndpoints, weight: 1 },
  session: { name: 'Session Service', testFn: testAllSessionEndpoints, weight: 2 },
  kiosk: { name: 'Kiosk Service', testFn: testAllKioskEndpoints, weight: 2 },
};

// Weighted service selection for realistic traffic simulation
function selectService() {
  const totalWeight = Object.values(SERVICES).reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const [key, service] of Object.entries(SERVICES)) {
    random -= service.weight;
    if (random <= 0) return key;
  }
  
  return 'auth';
}

// Main test function
export default function () {
  const startTime = Date.now();
  let allResults = [];
  let totalRequests = 0;
  let totalErrors = 0;
  
  // Select service based on weighted distribution
  const serviceName = selectService();
  const service = SERVICES[serviceName];
  
  group(`Testing ${service.name}`, function () {
    try {
      const results = service.testFn();
      allResults = results.endpoints || [];
      
      // Count requests and errors
      totalRequests = allResults.length;
      totalErrors = allResults.filter(r => !r.passed).length;
      
      // Record metrics
      requestsPerService.add(totalRequests, { service: serviceName });
      
      // Calculate success rate
      const successCount = allResults.filter(r => r.passed).length;
      const success = successCount / Math.max(totalRequests, 1);
      successRate.add(success, { service: serviceName });
      errorRate.add(1 - success, { service: serviceName });
      
      // Record response times
      for (const result of allResults) {
        if (result.timings) {
          responseTime.add(result.timings.response_time || 0, { 
            service: serviceName,
            endpoint: result.test 
          });
        }
      }
      
      // Log failures for debugging
      if (totalErrors > 0) {
        console.log(`[${serviceName}] ${totalErrors}/${totalRequests} requests failed`);
        for (const result of allResults.filter(r => !r.passed)) {
          console.log(`  - ${result.test}: status=${result.status}`);
        }
      }
      
      // Check for breaking point (high error rate under load)
      if (errorRate.rate > 0.5 && __VU % 10 === 0) {
        breakingPoint.add(__VU);
        console.log(`Potential breaking point detected at ${__VU} VUs for ${serviceName}`);
      }
      
    } catch (error) {
      totalErrors++;
      errorRate.add(1, { service: serviceName });
      console.error(`[${serviceName}] Error: ${error.message}`);
    }
  });
  
  // Record overall response time
  const totalTime = Date.now() - startTime;
  responseTime.add(totalTime, { service: serviceName, type: 'total_iteration' });
  
  // Small delay between iterations
  sleep(0.5);
}

// Handle summary for reporting
export function handleSummary(data) {
  const scenario = SCENARIO;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Calculate service-level metrics
  const serviceMetrics = {};
  for (const [serviceName, service] of Object.entries(SERVICES)) {
    serviceMetrics[serviceName] = {
      name: service.name,
      requests: data.metrics[`requests_per_service{service:${serviceName}}`]?.values?.count || 0,
      success_rate: data.metrics[`success_rate{service:${serviceName}}`]?.values?.rate || 0,
      error_rate: data.metrics[`error_rate{service:${serviceName}}`]?.values?.rate || 0,
    };
  }
  
  // Create summary object
  const summary = {
    test_info: {
      scenario: scenario,
      timestamp: timestamp,
      duration: data.state?.testRunDurationMs || 0,
      max_vus: data.state?.estMaxVus || 0,
    },
    overall_metrics: {
      total_requests: data.metrics.requests_per_service?.values?.count || 0,
      success_rate: data.metrics.success_rate?.values?.rate || 0,
      error_rate: data.metrics.error_rate?.values?.rate || 0,
      http_req_duration: {
        avg: data.metrics.http_req_duration?.values?.avg || 0,
        min: data.metrics.http_req_duration?.values?.min || 0,
        max: data.metrics.http_req_duration?.values?.max || 0,
        p90: data.metrics.http_req_duration?.values?.['p(90)'] || 0,
        p95: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
        p99: data.metrics.http_req_duration?.values?.['p(99)'] || 0,
      },
      http_reqs: data.metrics.http_reqs?.values?.count || 0,
      http_req_failed: data.metrics.http_req_failed?.values?.rate || 0,
    },
    service_metrics: serviceMetrics,
    thresholds: data.metrics,
    breaking_point_vus: data.metrics.breaking_point_vus?.values?.avg || null,
  };
  
  return {
    stdout: textSummary(summary),
    [`results/load-test-${scenario}-${timestamp}.json`]: JSON.stringify(summary, null, 2),
  };
}

// Text summary for console output
function textSummary(summary) {
  const m = summary.overall_metrics;
  const t = summary.test_info;
  
  return `
╔══════════════════════════════════════════════════════════════╗
║         K6 LOAD TEST RESULTS - ${t.scenario.toUpperCase().padEnd(30)}         ║
╠══════════════════════════════════════════════════════════════╣
║ Test Duration: ${(t.duration / 1000).toFixed(2)}s                                    ║
║ Max VUs: ${t.max_vus.toString().padEnd(51)}║
╠══════════════════════════════════════════════════════════════╣
║ OVERALL METRICS:                                             ║
║   Success Rate: ${(m.success_rate * 100).toFixed(2)}%${' '.repeat(40)}║
║   Error Rate: ${(m.error_rate * 100).toFixed(2)}%${' '.repeat(42)}║
║   Total Requests: ${m.total_requests.toString().padEnd(42)}║
║   HTTP Requests: ${m.http_reqs.toString().padEnd(43)}║
╠══════════════════════════════════════════════════════════════╣
║ RESPONSE TIMES (ms):                                         ║
║   Average: ${m.http_req_duration.avg.toFixed(2).padEnd(49)}║
║   Min: ${m.http_req_duration.min.toFixed(2).padEnd(53)}║
║   Max: ${m.http_req_duration.max.toFixed(2).padEnd(53)}║
║   P90: ${m.http_req_duration.p90.toFixed(2).padEnd(53)}║
║   P95: ${m.http_req_duration.p95.toFixed(2).padEnd(53)}║
║   P99: ${m.http_req_duration.p99.toFixed(2).padEnd(53)}║
╚══════════════════════════════════════════════════════════════╝
`;
}
