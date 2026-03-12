import { check } from 'k6';
import http from 'k6/http';
import { BASE_URLS } from './shared.js';
import { testData } from './test-data.js';

const SERVICE = 'document';
const BASE_URL = BASE_URLS[SERVICE];

export function testApplyDocument() {
  const scenarios = [];
  
  const resValid = http.post(
    `${BASE_URL}/documents/apply`,
    JSON.stringify(testData.document.apply.valid),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const validCheck = check(resValid, {
    'applyDocument valid - status 200, 400, or 401': (r) => [200, 400, 401].includes(r.status),
    'applyDocument valid - has proper structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.data !== undefined || body.error !== undefined);
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'applyDocument_valid', status: resValid.status, passed: validCheck, response: resValid.body });

  const resInvalidDocType = http.post(
    `${BASE_URL}/documents/apply`,
    JSON.stringify(testData.document.apply.invalidDocType),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const invalidDocTypeCheck = check(resInvalidDocType, {
    'applyDocument invalidDocType - status 400 or 401': (r) => [400, 401].includes(r.status),
  });
  scenarios.push({ test: 'applyDocument_invalidDocType', status: resInvalidDocType.status, passed: invalidDocTypeCheck, response: resInvalidDocType.body });

  const resMissingFields = http.post(
    `${BASE_URL}/documents/apply`,
    JSON.stringify(testData.document.apply.missingFields),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const missingFieldsCheck = check(resMissingFields, {
    'applyDocument missingFields - status 400 or 401': (r) => [400, 401].includes(r.status),
  });
  scenarios.push({ test: 'applyDocument_missingFields', status: resMissingFields.status, passed: missingFieldsCheck, response: resMissingFields.body });

  return scenarios;
}

export function testListDocuments() {
  const scenarios = [];
  
  const res = http.get(
    `${BASE_URL}/documents`,
    { 
      headers: { 
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const listCheck = check(res, {
    'listDocuments - status 200 or 401': (r) => [200, 401].includes(r.status),
    'listDocuments - has proper structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.data !== undefined || body.error !== undefined);
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'listDocuments', status: res.status, passed: listCheck, response: res.body });

  return scenarios;
}

export function testGetDocument() {
  const scenarios = [];
  
  const res = http.get(
    `${BASE_URL}/documents/doc-001`,
    { 
      headers: { 
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const getCheck = check(res, {
    'getDocument - status 200, 401, or 404': (r) => [200, 401, 404].includes(r.status),
  });
  scenarios.push({ test: 'getDocument', status: res.status, passed: getCheck, response: res.body });

  return scenarios;
}

export function testHealth() {
  const scenarios = [];
  
  const res = http.get(`${BASE_URL}/health`);
  
  const healthCheck = check(res, {
    'documentHealth - status 200': (r) => r.status === 200,
  });
  scenarios.push({ test: 'health', status: res.status, passed: healthCheck, response: res.body });

  return scenarios;
}

export function testAllDocumentEndpoints() {
  const results = {
    service: SERVICE,
    baseUrl: BASE_URL,
    endpoints: [],
    errors: [],
    warnings: [],
  };

  try {
    results.endpoints.push(...testApplyDocument());
  } catch (e) {
    results.errors.push({ test: 'applyDocument', error: e.message });
  }

  try {
    results.endpoints.push(...testListDocuments());
  } catch (e) {
    results.errors.push({ test: 'listDocuments', error: e.message });
  }

  try {
    results.endpoints.push(...testGetDocument());
  } catch (e) {
    results.errors.push({ test: 'getDocument', error: e.message });
  }

  try {
    results.endpoints.push(...testHealth());
  } catch (e) {
    results.errors.push({ test: 'health', error: e.message });
  }

  return results;
}
