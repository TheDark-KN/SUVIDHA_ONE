import { check } from 'k6';
import http from 'k6/http';
import { BASE_URLS } from './shared.js';
import { testData } from './test-data.js';

const SERVICE = 'auth';
const BASE_URL = BASE_URLS[SERVICE];

export function testSendOtp() {
  const scenarios = [];
  
  const resValid = http.post(
    `${BASE_URL}/auth/otp/send`,
    JSON.stringify(testData.auth.sendOtp.valid),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const validCheck = check(resValid, {
    'sendOtp valid - status 200': (r) => r.status === 200,
    'sendOtp valid - has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      } catch (e) {
        return false;
      }
    },
    'sendOtp valid - has meta': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.meta !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'sendOtp_valid', status: resValid.status, passed: validCheck, response: resValid.body });

  const resInvalidMobile = http.post(
    `${BASE_URL}/auth/otp/send`,
    JSON.stringify(testData.auth.sendOtp.invalidMobile),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const invalidMobileCheck = check(resInvalidMobile, {
    'sendOtp invalidMobile - status 400': (r) => r.status === 400,
    'sendOtp invalidMobile - has error': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.error !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'sendOtp_invalidMobile', status: resInvalidMobile.status, passed: invalidMobileCheck, response: resInvalidMobile.body });

  return scenarios;
}

export function testVerifyOtp() {
  const scenarios = [];
  
  const resValid = http.post(
    `${BASE_URL}/auth/otp/verify`,
    JSON.stringify(testData.auth.verifyOtp.valid),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const validCheck = check(resValid, {
    'verifyOtp valid - status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'verifyOtp valid - has proper structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.data !== undefined || body.error !== undefined);
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'verifyOtp_valid', status: resValid.status, passed: validCheck, response: resValid.body });

  const resInvalidOtp = http.post(
    `${BASE_URL}/auth/otp/verify`,
    JSON.stringify(testData.auth.verifyOtp.invalidOtp),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const invalidOtpCheck = check(resInvalidOtp, {
    'verifyOtp invalidOtp - status 401': (r) => r.status === 401,
    'verifyOtp invalidOtp - has error': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.error !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'verifyOtp_invalidOtp', status: resInvalidOtp.status, passed: invalidOtpCheck, response: resInvalidOtp.body });

  return scenarios;
}

export function testRefreshToken() {
  const scenarios = [];
  
  const resValid = http.post(
    `${BASE_URL}/auth/refresh`,
    JSON.stringify(testData.auth.refresh.valid),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const validCheck = check(resValid, {
    'refresh valid - status 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  scenarios.push({ test: 'refresh_valid', status: resValid.status, passed: validCheck, response: resValid.body });

  const resInvalid = http.post(
    `${BASE_URL}/auth/refresh`,
    JSON.stringify(testData.auth.refresh.invalid),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const invalidCheck = check(resInvalid, {
    'refresh invalid - status 401': (r) => r.status === 401,
  });
  scenarios.push({ test: 'refresh_invalid', status: resInvalid.status, passed: invalidCheck, response: resInvalid.body });

  return scenarios;
}

export function testLogout() {
  const scenarios = [];
  
  const res = http.post(
    `${BASE_URL}/auth/logout`,
    JSON.stringify({ token: 'test-token' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const logoutCheck = check(res, {
    'logout - status 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  scenarios.push({ test: 'logout', status: res.status, passed: logoutCheck, response: res.body });

  return scenarios;
}

export function testHealth() {
  const scenarios = [];
  
  const res = http.get(`${BASE_URL}/health`);
  
  const healthCheck = check(res, {
    'health - status 200': (r) => r.status === 200,
    'health - has status': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'health', status: res.status, passed: healthCheck, response: res.body });

  const resReady = http.get(`${BASE_URL}/ready`);
  scenarios.push({ test: 'ready', status: resReady.status, response: resReady.body });

  return scenarios;
}

export function testAllAuthEndpoints() {
  const results = {
    service: SERVICE,
    baseUrl: BASE_URL,
    endpoints: [],
    errors: [],
    warnings: [],
  };

  try {
    results.endpoints.push(...testSendOtp());
  } catch (e) {
    results.errors.push({ test: 'sendOtp', error: e.message });
  }

  try {
    results.endpoints.push(...testVerifyOtp());
  } catch (e) {
    results.errors.push({ test: 'verifyOtp', error: e.message });
  }

  try {
    results.endpoints.push(...testRefreshToken());
  } catch (e) {
    results.errors.push({ test: 'refreshToken', error: e.message });
  }

  try {
    results.endpoints.push(...testLogout());
  } catch (e) {
    results.errors.push({ test: 'logout', error: e.message });
  }

  try {
    results.endpoints.push(...testHealth());
  } catch (e) {
    results.errors.push({ test: 'health', error: e.message });
  }

  return results;
}
