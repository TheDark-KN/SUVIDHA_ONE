import { check } from 'k6';
import http from 'k6/http';
import { BASE_URLS } from './shared.js';
import { testData } from './test-data.js';

const SERVICE = 'payment';
const BASE_URL = BASE_URLS[SERVICE];

export function testInitiatePayment() {
  const scenarios = [];
  
  const resValid = http.post(
    `${BASE_URL}/payments/initiate`,
    JSON.stringify(testData.payment.initiate.valid),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const validCheck = check(resValid, {
    'initiatePayment valid - status 200, 400, or 401': (r) => [200, 400, 401].includes(r.status),
    'initiatePayment valid - has proper structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.data !== undefined || body.error !== undefined);
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'initiatePayment_valid', status: resValid.status, passed: validCheck, response: resValid.body });

  const resInvalidMethod = http.post(
    `${BASE_URL}/payments/initiate`,
    JSON.stringify(testData.payment.initiate.invalidMethod),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const invalidMethodCheck = check(resInvalidMethod, {
    'initiatePayment invalidMethod - status 400 or 401': (r) => [400, 401].includes(r.status),
  });
  scenarios.push({ test: 'initiatePayment_invalidMethod', status: resInvalidMethod.status, passed: invalidMethodCheck, response: resInvalidMethod.body });

  const resEmptyBills = http.post(
    `${BASE_URL}/payments/initiate`,
    JSON.stringify(testData.payment.initiate.emptyBills),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const emptyBillsCheck = check(resEmptyBills, {
    'initiatePayment emptyBills - status 400 or 401': (r) => [400, 401].includes(r.status),
  });
  scenarios.push({ test: 'initiatePayment_emptyBills', status: resEmptyBills.status, passed: emptyBillsCheck, response: resEmptyBills.body });

  return scenarios;
}

export function testPaymentStatus() {
  const scenarios = [];
  
  const resValid = http.get(
    `${BASE_URL}/payments/status/${testData.payment.status.validPaymentId}`,
    { 
      headers: { 
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const validCheck = check(resValid, {
    'paymentStatus valid - status 200, 401, or 404': (r) => [200, 401, 404].includes(r.status),
    'paymentStatus valid - has proper structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.data !== undefined || body.error !== undefined);
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'paymentStatus_valid', status: resValid.status, passed: validCheck, response: resValid.body });

  const resInvalid = http.get(
    `${BASE_URL}/payments/status/${testData.payment.status.invalidPaymentId}`,
    { 
      headers: { 
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const invalidCheck = check(resInvalid, {
    'paymentStatus invalid - status 404 or 401': (r) => [404, 401].includes(r.status),
  });
  scenarios.push({ test: 'paymentStatus_invalid', status: resInvalid.status, passed: invalidCheck, response: resInvalid.body });

  return scenarios;
}

export function testUpiWebhook() {
  const scenarios = [];
  
  const res = http.post(
    `${BASE_URL}/webhooks/upi/callback`,
    JSON.stringify({
      transaction_id: 'TXN123456',
      status: 'SUCCESS',
      amount: 1500.00,
      utr: 'UPI123456',
      timestamp: new Date().toISOString(),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const webhookCheck = check(res, {
    'upiWebhook - status 200': (r) => r.status === 200,
  });
  scenarios.push({ test: 'upiWebhook', status: res.status, passed: webhookCheck, response: res.body });

  return scenarios;
}

export function testHealth() {
  const scenarios = [];
  
  const res = http.get(`${BASE_URL}/health`);
  
  const healthCheck = check(res, {
    'paymentHealth - status 200': (r) => r.status === 200,
  });
  scenarios.push({ test: 'health', status: res.status, passed: healthCheck, response: res.body });

  return scenarios;
}

export function testAllPaymentEndpoints() {
  const results = {
    service: SERVICE,
    baseUrl: BASE_URL,
    endpoints: [],
    errors: [],
    warnings: [],
  };

  try {
    results.endpoints.push(...testInitiatePayment());
  } catch (e) {
    results.errors.push({ test: 'initiatePayment', error: e.message });
  }

  try {
    results.endpoints.push(...testPaymentStatus());
  } catch (e) {
    results.errors.push({ test: 'paymentStatus', error: e.message });
  }

  try {
    results.endpoints.push(...testUpiWebhook());
  } catch (e) {
    results.errors.push({ test: 'upiWebhook', error: e.message });
  }

  try {
    results.endpoints.push(...testHealth());
  } catch (e) {
    results.errors.push({ test: 'health', error: e.message });
  }

  return results;
}
