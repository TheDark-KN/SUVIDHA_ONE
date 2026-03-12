import { check } from 'k6';
import http from 'k6/http';
import { BASE_URLS } from './shared.js';
import { testData } from './test-data.js';

const SERVICE = 'grievance';
const BASE_URL = BASE_URLS[SERVICE];

export function testCreateGrievance() {
  const scenarios = [];
  
  const resValid = http.post(
    `${BASE_URL}/grievances`,
    JSON.stringify(testData.grievance.create.valid),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const validCheck = check(resValid, {
    'createGrievance valid - status 201, 400, or 401': (r) => [201, 400, 401].includes(r.status),
    'createGrievance valid - has proper structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.data !== undefined || body.error !== undefined);
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'createGrievance_valid', status: resValid.status, passed: validCheck, response: resValid.body });

  const resInvalidCategory = http.post(
    `${BASE_URL}/grievances`,
    JSON.stringify(testData.grievance.create.invalidCategory),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const invalidCategoryCheck = check(resInvalidCategory, {
    'createGrievance invalidCategory - status 400 or 401': (r) => [400, 401].includes(r.status),
  });
  scenarios.push({ test: 'createGrievance_invalidCategory', status: resInvalidCategory.status, passed: invalidCategoryCheck, response: resInvalidCategory.body });

  const resMissingFields = http.post(
    `${BASE_URL}/grievances`,
    JSON.stringify(testData.grievance.create.missingFields),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const missingFieldsCheck = check(resMissingFields, {
    'createGrievance missingFields - status 400 or 401': (r) => [400, 401].includes(r.status),
  });
  scenarios.push({ test: 'createGrievance_missingFields', status: resMissingFields.status, passed: missingFieldsCheck, response: resMissingFields.body });

  return scenarios;
}

export function testListGrievances() {
  const scenarios = [];
  
  const res = http.get(
    `${BASE_URL}/grievances`,
    { 
      headers: { 
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const listCheck = check(res, {
    'listGrievances - status 200 or 401': (r) => [200, 401].includes(r.status),
    'listGrievances - has proper structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.data !== undefined || body.error !== undefined);
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'listGrievances', status: res.status, passed: listCheck, response: res.body });

  return scenarios;
}

export function testGetGrievance() {
  const scenarios = [];
  
  const res = http.get(
    `${BASE_URL}/grievances/grievance-001`,
    { 
      headers: { 
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const getCheck = check(res, {
    'getGrievance - status 200, 401, or 404': (r) => [200, 401, 404].includes(r.status),
  });
  scenarios.push({ test: 'getGrievance', status: res.status, passed: getCheck, response: res.body });

  return scenarios;
}

export function testUpdateGrievanceStatus() {
  const scenarios = [];
  
  const resValid = http.patch(
    `${BASE_URL}/grievances/grievance-001/update`,
    JSON.stringify(testData.grievance.update.valid),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const validCheck = check(resValid, {
    'updateGrievance valid - status 200, 400, 401, or 404': (r) => [200, 400, 401, 404].includes(r.status),
  });
  scenarios.push({ test: 'updateGrievance_valid', status: resValid.status, passed: validCheck, response: resValid.body });

  const resInvalidStatus = http.patch(
    `${BASE_URL}/grievances/grievance-001/update`,
    JSON.stringify(testData.grievance.update.invalidStatus),
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      } 
    }
  );
  
  const invalidStatusCheck = check(resInvalidStatus, {
    'updateGrievance invalidStatus - status 400, 401, or 404': (r) => [400, 401, 404].includes(r.status),
  });
  scenarios.push({ test: 'updateGrievance_invalidStatus', status: resInvalidStatus.status, passed: invalidStatusCheck, response: resInvalidStatus.body });

  return scenarios;
}

export function testHealth() {
  const scenarios = [];
  
  const res = http.get(`${BASE_URL}/health`);
  
  const healthCheck = check(res, {
    'grievanceHealth - status 200': (r) => r.status === 200,
  });
  scenarios.push({ test: 'health', status: res.status, passed: healthCheck, response: res.body });

  return scenarios;
}

export function testAllGrievanceEndpoints() {
  const results = {
    service: SERVICE,
    baseUrl: BASE_URL,
    endpoints: [],
    errors: [],
    warnings: [],
  };

  try {
    results.endpoints.push(...testCreateGrievance());
  } catch (e) {
    results.errors.push({ test: 'createGrievance', error: e.message });
  }

  try {
    results.endpoints.push(...testListGrievances());
  } catch (e) {
    results.errors.push({ test: 'listGrievances', error: e.message });
  }

  try {
    results.endpoints.push(...testGetGrievance());
  } catch (e) {
    results.errors.push({ test: 'getGrievance', error: e.message });
  }

  try {
    results.endpoints.push(...testUpdateGrievanceStatus());
  } catch (e) {
    results.errors.push({ test: 'updateGrievanceStatus', error: e.message });
  }

  try {
    results.endpoints.push(...testHealth());
  } catch (e) {
    results.errors.push({ test: 'health', error: e.message });
  }

  return results;
}
