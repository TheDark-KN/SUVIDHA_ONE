import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  scenarios: {
    compatibility_check: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '5m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URLS = {
  auth: __ENV.AUTH_URL || 'http://localhost:3001',
  payment: __ENV.PAYMENT_URL || 'http://localhost:3002',
  utility: __ENV.UTILITY_URL || 'http://localhost:3003',
  grievance: __ENV.GRIEVANCE_URL || 'http://localhost:3004',
  document: __ENV.DOCUMENT_URL || 'http://localhost:3005',
  notification: __ENV.NOTIFICATION_URL || 'http://localhost:3006',
  session: __ENV.SESSION_URL || 'http://localhost:3007',
  kiosk: __ENV.KIOSK_URL || 'http://localhost:3008',
};

export { BASE_URLS };
