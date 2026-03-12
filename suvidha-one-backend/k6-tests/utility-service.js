import { check } from 'k6';
import http from 'k6/http';
import { BASE_URLS } from './shared.js';
import { testData } from './test-data.js';

const SERVICE = 'utility';
const BASE_URL = BASE_URLS[SERVICE];

export function testFetchBills() {
  const scenarios = [];
  
  const resValid = http.post(
    `${BASE_URL}/bills/fetch`,
    JSON.stringify(testData.utility.fetchBills.valid),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const validCheck = check(resValid, {
    'fetchBills valid - status 200, 400, or 401': (r) => [200, 400, 401].includes(r.status),
    'fetchBills valid - has proper structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.data !== undefined || body.error !== undefined);
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'fetchBills_valid', status: resValid.status, passed: validCheck, response: resValid.body });

  const resInvalidDept = http.post(
    `${BASE_URL}/bills/fetch`,
    JSON.stringify(testData.utility.fetchBills.invalidDepartment),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const invalidDeptCheck = check(resInvalidDept, {
    'fetchBills invalidDept - status 400 or 401': (r) => [400, 401].includes(r.status),
  });
  scenarios.push({ test: 'fetchBills_invalidDept', status: resInvalidDept.status, passed: invalidDeptCheck, response: resInvalidDept.body });

  const resMissingConsumer = http.post(
    `${BASE_URL}/bills/fetch`,
    JSON.stringify(testData.utility.fetchBills.missingConsumer),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const missingConsumerCheck = check(resMissingConsumer, {
    'fetchBills missingConsumer - status 400 or 401': (r) => [400, 401].includes(r.status),
  });
  scenarios.push({ test: 'fetchBills_missingConsumer', status: resMissingConsumer.status, passed: missingConsumerCheck, response: resMissingConsumer.body });

  return scenarios;
}

export function testBillDetails() {
  const scenarios = [];
  
  const res = http.get(
    `${BASE_URL}/bills/bill-001`,
    { 
      headers: { 
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const billDetailsCheck = check(res, {
    'billDetails - status 200, 401, or 404': (r) => [200, 401, 404].includes(r.status),
  });
  scenarios.push({ test: 'billDetails', status: res.status, passed: billDetailsCheck, response: res.body });

  return scenarios;
}

export function testListServices() {
  const scenarios = [];
  
  const res = http.get(
    `${BASE_URL}/services`,
    { 
      headers: { 
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const servicesCheck = check(res, {
    'listServices - status 200 or 401': (r) => [200, 401].includes(r.status),
    'listServices - has proper structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.data !== undefined || body.error !== undefined);
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'listServices', status: res.status, passed: servicesCheck, response: res.body });

  return scenarios;
}

export function testHealth() {
  const scenarios = [];
  
  const res = http.get(`${BASE_URL}/health`);
  
  const healthCheck = check(res, {
    'utilityHealth - status 200': (r) => r.status === 200,
  });
  scenarios.push({ test: 'health', status: res.status, passed: healthCheck, response: res.body });

  return scenarios;
}

export function testAllUtilityEndpoints() {
  const results = {
    service: SERVICE,
    baseUrl: BASE_URL,
    endpoints: [],
    errors: [],
    warnings: [],
  };

  try {
    results.endpoints.push(...testFetchBills());
  } catch (e) {
    results.errors.push({ test: 'fetchBills', error: e.message });
  }

  try {
    results.endpoints.push(...testBillDetails());
  } catch (e) {
    results.errors.push({ test: 'billDetails', error: e.message });
  }

  try {
    results.endpoints.push(...testListServices());
  } catch (e) {
    results.errors.push({ test: 'listServices', error: e.message });
  }

  try {
    results.endpoints.push(...testHealth());
  } catch (e) {
    results.errors.push({ test: 'health', error: e.message });
  }

  return results;
}
