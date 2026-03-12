import { check } from 'k6';
import http from 'k6/http';
import { BASE_URLS } from './shared.js';
import { testData } from './test-data.js';

const SERVICE = 'kiosk';
const BASE_URL = BASE_URLS[SERVICE];

export function testRegisterKiosk() {
  const scenarios = [];
  
  const resValid = http.post(
    `${BASE_URL}/kiosks/register`,
    JSON.stringify(testData.kiosk.register.valid),
    { 
      headers: { 
        'Content-Type': 'application/json',
      } 
    }
  );
  
  const validCheck = check(resValid, {
    'registerKiosk valid - status 200, 400, or 409': (r) => [200, 400, 409].includes(r.status),
    'registerKiosk valid - has proper structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.data !== undefined || body.error !== undefined);
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'registerKiosk_valid', status: resValid.status, passed: validCheck, response: resValid.body });

  const resMissingFields = http.post(
    `${BASE_URL}/kiosks/register`,
    JSON.stringify(testData.kiosk.register.missingFields),
    { 
      headers: { 
        'Content-Type': 'application/json',
      } 
    }
  );
  
  const missingFieldsCheck = check(resMissingFields, {
    'registerKiosk missingFields - status 400': (r) => r.status === 400,
  });
  scenarios.push({ test: 'registerKiosk_missingFields', status: resMissingFields.status, passed: missingFieldsCheck, response: resMissingFields.body });

  return scenarios;
}

export function testListKiosks() {
  const scenarios = [];
  
  const res = http.get(`${BASE_URL}/kiosks`);
  
  const listCheck = check(res, {
    'listKiosks - status 200': (r) => r.status === 200,
    'listKiosks - has proper structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.data !== undefined || body.error !== undefined);
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'listKiosks', status: res.status, passed: listCheck, response: res.body });

  return scenarios;
}

export function testGetKiosk() {
  const scenarios = [];
  
  const res = http.get(`${BASE_URL}/kiosks/KIOSK001`);
  
  const getCheck = check(res, {
    'getKiosk - status 200 or 404': (r) => [200, 404].includes(r.status),
  });
  scenarios.push({ test: 'getKiosk', status: res.status, passed: getCheck, response: res.body });

  return scenarios;
}

export function testHeartbeat() {
  const scenarios = [];
  
  const resValid = http.post(
    `${BASE_URL}/kiosks/${testData.kiosk.heartbeat.validKioskId}/heartbeat`
  );
  
  const validCheck = check(resValid, {
    'heartbeat valid - status 200 or 404': (r) => [200, 404].includes(r.status),
  });
  scenarios.push({ test: 'heartbeat_valid', status: resValid.status, passed: validCheck, response: resValid.body });

  const resInvalid = http.post(
    `${BASE_URL}/kiosks/${testData.kiosk.heartbeat.invalidKioskId}/heartbeat`
  );
  
  const invalidCheck = check(resInvalid, {
    'heartbeat invalid - status 404': (r) => r.status === 404,
  });
  scenarios.push({ test: 'heartbeat_invalid', status: resInvalid.status, passed: invalidCheck, response: resInvalid.body });

  return scenarios;
}

export function testGetKioskConfig() {
  const scenarios = [];
  
  const res = http.get(`${BASE_URL}/kiosks/KIOSK001/config`);
  
  const configCheck = check(res, {
    'getKioskConfig - status 200 or 404': (r) => [200, 404].includes(r.status),
    'getKioskConfig - has proper structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.data !== undefined || body.error !== undefined);
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'getKioskConfig', status: res.status, passed: configCheck, response: res.body });

  return scenarios;
}

export function testHealth() {
  const scenarios = [];
  
  const res = http.get(`${BASE_URL}/health`);
  
  const healthCheck = check(res, {
    'kioskHealth - status 200': (r) => r.status === 200,
  });
  scenarios.push({ test: 'health', status: res.status, passed: healthCheck, response: res.body });

  return scenarios;
}

export function testAllKioskEndpoints() {
  const results = {
    service: SERVICE,
    baseUrl: BASE_URL,
    endpoints: [],
    errors: [],
    warnings: [],
  };

  try {
    results.endpoints.push(...testRegisterKiosk());
  } catch (e) {
    results.errors.push({ test: 'registerKiosk', error: e.message });
  }

  try {
    results.endpoints.push(...testListKiosks());
  } catch (e) {
    results.errors.push({ test: 'listKiosks', error: e.message });
  }

  try {
    results.endpoints.push(...testGetKiosk());
  } catch (e) {
    results.errors.push({ test: 'getKiosk', error: e.message });
  }

  try {
    results.endpoints.push(...testHeartbeat());
  } catch (e) {
    results.errors.push({ test: 'heartbeat', error: e.message });
  }

  try {
    results.endpoints.push(...testGetKioskConfig());
  } catch (e) {
    results.endpoints.push({ test: 'getKioskConfig', status: 0, passed: false, error: e.message });
  }

  try {
    results.endpoints.push(...testHealth());
  } catch (e) {
    results.errors.push({ test: 'health', error: e.message });
  }

  return results;
}
