import { testAllAuthEndpoints } from './auth-service.js';
import { testAllPaymentEndpoints } from './payment-service.js';
import { testAllUtilityEndpoints } from './utility-service.js';
import { testAllGrievanceEndpoints } from './grievance-service.js';
import { testAllDocumentEndpoints } from './document-service.js';
import { testAllNotificationEndpoints } from './notification-service.js';
import { testAllSessionEndpoints } from './session-service.js';
import { testAllKioskEndpoints } from './kiosk-service.js';

export const options = {
  scenarios: {
    compatibility_check: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '10m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.5'],
  },
};

export default function () {
  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      totalEndpoints: 0,
      passedEndpoints: 0,
      failedEndpoints: 0,
      errorEndpoints: 0,
      serviceBreakdown: {},
    },
    services: [],
    breakingChanges: [],
    recommendations: [],
  };

  const services = [
    { name: 'auth', test: testAllAuthEndpoints },
    { name: 'payment', test: testAllPaymentEndpoints },
    { name: 'utility', test: testAllUtilityEndpoints },
    { name: 'grievance', test: testAllGrievanceEndpoints },
    { name: 'document', test: testAllDocumentEndpoints },
    { name: 'notification', test: testAllNotificationEndpoints },
    { name: 'session', test: testAllSessionEndpoints },
    { name: 'kiosk', test: testAllKioskEndpoints },
  ];

  services.forEach(service => {
    try {
      const serviceResult = service.test();
      results.services.push(serviceResult);
      
      results.summary.totalEndpoints += serviceResult.endpoints.length;
      results.summary.serviceBreakdown[service.name] = {
        total: serviceResult.endpoints.length,
        passed: 0,
        failed: 0,
        errors: serviceResult.errors.length,
      };

      serviceResult.endpoints.forEach(endpoint => {
        if (endpoint.status === 0 || endpoint.status >= 500 || endpoint.error) {
          results.summary.failedEndpoints++;
          results.summary.serviceBreakdown[service.name].failed++;
          results.breakingChanges.push({
            service: service.name,
            endpoint: endpoint.test,
            status: endpoint.status,
            error: endpoint.error || 'Connection error or service unavailable',
            response: endpoint.response,
          });
        } else if (!endpoint.passed) {
          results.summary.failedEndpoints++;
          results.summary.serviceBreakdown[service.name].failed++;
        } else {
          results.summary.passedEndpoints++;
          results.summary.serviceBreakdown[service.name].passed++;
        }
      });

      serviceResult.errors.forEach(err => {
        results.breakingChanges.push({
          service: service.name,
          endpoint: err.test,
          error: err.error,
          severity: 'critical',
        });
      });

      if (serviceResult.warnings.length > 0) {
        results.recommendations.push({
          service: service.name,
          warnings: serviceResult.warnings,
        });
      }

    } catch (e) {
      results.services.push({
        service: service.name,
        error: e.message,
        endpoints: [],
        errors: [{ test: 'service_test', error: e.message }],
      });
      results.summary.errorEndpoints++;
      results.breakingChanges.push({
        service: service.name,
        error: e.message,
        severity: 'critical',
      });
    }
  });

  results.summary.passRate = results.summary.totalEndpoints > 0 
    ? ((results.summary.passedEndpoints / results.summary.totalEndpoints) * 100).toFixed(2) + '%'
    : '0%';

  console.log('\n========================================');
  console.log('COMPATIBILITY TEST RESULTS');
  console.log('========================================');
  console.log(`Total Endpoints Tested: ${results.summary.totalEndpoints}`);
  console.log(`Passed: ${results.summary.passedEndpoints}`);
  console.log(`Failed: ${results.summary.failedEndpoints}`);
  console.log(`Errors: ${results.summary.errorEndpoints}`);
  console.log(`Pass Rate: ${results.summary.passRate}`);
  console.log('========================================\n');

  console.log('Service Breakdown:');
  Object.entries(results.summary.serviceBreakdown).forEach(([service, stats]) => {
    console.log(`  ${service}: ${stats.passed}/${stats.total} passed, ${stats.failed} failed, ${stats.errors} errors`);
  });

  if (results.breakingChanges.length > 0) {
    console.log('\n========================================');
    console.log('BREAKING CHANGES / FAILURES DETECTED');
    console.log('========================================');
    results.breakingChanges.forEach((change, idx) => {
      console.log(`\n${idx + 1}. Service: ${change.service}`);
      console.log(`   Endpoint: ${change.endpoint || 'N/A'}`);
      console.log(`   Status: ${change.status || 'N/A'}`);
      console.log(`   Error: ${change.error || change.response || 'N/A'}`);
    });
  }

  if (results.recommendations.length > 0) {
    console.log('\n========================================');
    console.log('RECOMMENDATIONS');
    console.log('========================================');
    results.recommendations.forEach(rec => {
      console.log(`\nService: ${rec.service}`);
      rec.warnings.forEach(w => console.log(`  - ${w}`));
    });
  }

  console.log('\n========================================');
  console.log('TEST COMPLETE');
  console.log('========================================\n');
}
