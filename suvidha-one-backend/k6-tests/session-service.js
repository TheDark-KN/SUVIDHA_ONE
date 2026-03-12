import { check } from 'k6';
import http from 'k6/http';
import { BASE_URLS } from './shared.js';
import { testData } from './test-data.js';

const SERVICE = 'session';
const BASE_URL = BASE_URLS[SERVICE];

export function testCreateSession() {
  const scenarios = [];
  
  const resValid = http.post(
    `${BASE_URL}/sessions/create`,
    JSON.stringify(testData.session.create.valid),
    { 
      headers: { 
        'Content-Type': 'application/json',
      } 
    }
  );
  
  const validCheck = check(resValid, {
    'createSession valid - status 200 or 400': (r) => [200, 400].includes(r.status),
    'createSession valid - has proper structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.data !== undefined || body.error !== undefined);
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'createSession_valid', status: resValid.status, passed: validCheck, response: resValid.body });

  const resMissingUser = http.post(
    `${BASE_URL}/sessions/create`,
    JSON.stringify(testData.session.create.missingUser),
    { 
      headers: { 
        'Content-Type': 'application/json',
      } 
    }
  );
  
  const missingUserCheck = check(resMissingUser, {
    'createSession missingUser - status 400': (r) => r.status === 400,
  });
  scenarios.push({ test: 'createSession_missingUser', status: resMissingUser.status, passed: missingUserCheck, response: resMissingUser.body });

  const resMissingKiosk = http.post(
    `${BASE_URL}/sessions/create`,
    JSON.stringify(testData.session.create.missingKiosk),
    { 
      headers: { 
        'Content-Type': 'application/json',
      } 
    }
  );
  
  const missingKioskCheck = check(resMissingKiosk, {
    'createSession missingKiosk - status 400': (r) => r.status === 400,
  });
  scenarios.push({ test: 'createSession_missingKiosk', status: resMissingKiosk.status, passed: missingKioskCheck, response: resMissingKiosk.body });

  return scenarios;
}

export function testRefreshSession() {
  const scenarios = [];
  
  const resValid = http.post(
    `${BASE_URL}/sessions/refresh`,
    JSON.stringify(testData.session.refresh.valid),
    { 
      headers: { 
        'Content-Type': 'application/json',
      } 
    }
  );
  
  const validCheck = check(resValid, {
    'refreshSession valid - status 200 or 404': (r) => [200, 404].includes(r.status),
  });
  scenarios.push({ test: 'refreshSession_valid', status: resValid.status, passed: validCheck, response: resValid.body });

  const resInvalid = http.post(
    `${BASE_URL}/sessions/refresh`,
    JSON.stringify(testData.session.refresh.invalid),
    { 
      headers: { 
        'Content-Type': 'application/json',
      } 
    }
  );
  
  const invalidCheck = check(resInvalid, {
    'refreshSession invalid - status 404': (r) => r.status === 404,
  });
  scenarios.push({ test: 'refreshSession_invalid', status: resInvalid.status, passed: invalidCheck, response: resInvalid.body });

  return scenarios;
}

export function testGetSession() {
  const scenarios = [];
  
  const res = http.get(
    `${BASE_URL}/sessions/session-001`
  );
  
  const getCheck = check(res, {
    'getSession - status 200 or 404': (r) => [200, 404].includes(r.status),
  });
  scenarios.push({ test: 'getSession', status: res.status, passed: getCheck, response: res.body });

  return scenarios;
}

export function testDeleteSession() {
  const scenarios = [];
  
  const res = http.del(
    `${BASE_URL}/sessions/session-001`
  );
  
  const deleteCheck = check(res, {
    'deleteSession - status 200 or 404': (r) => [200, 404].includes(r.status),
  });
  scenarios.push({ test: 'deleteSession', status: res.status, passed: deleteCheck, response: res.body });

  return scenarios;
}

export function testHealth() {
  const scenarios = [];
  
  const res = http.get(`${BASE_URL}/health`);
  
  const healthCheck = check(res, {
    'sessionHealth - status 200': (r) => r.status === 200,
  });
  scenarios.push({ test: 'health', status: res.status, passed: healthCheck, response: res.body });

  return scenarios;
}

export function testAllSessionEndpoints() {
  const results = {
    service: SERVICE,
    baseUrl: BASE_URL,
    endpoints: [],
    errors: [],
    warnings: [],
  };

  try {
    results.endpoints.push(...testCreateSession());
  } catch (e) {
    results.errors.push({ test: 'createSession', error: e.message });
  }

  try {
    results.endpoints.push(...testRefreshSession());
  } catch (e) {
    results.errors.push({ test: 'refreshSession', error: e.message });
  }

  try {
    results.endpoints.push(...testGetSession());
  } catch (e) {
    results.errors.push({ test: 'getSession', error: e.message });
  }

  try {
    results.endpoints.push(...testDeleteSession());
  } catch (e) {
    results.errors.push({ test: 'deleteSession', error: e.message });
  }

  try {
    results.endpoints.push(...testHealth());
  } catch (e) {
    results.errors.push({ test: 'health', error: e.message });
  }

  return results;
}
