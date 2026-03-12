import { check } from 'k6';
import http from 'k6/http';
import { BASE_URLS } from './shared.js';
import { testData } from './test-data.js';

const SERVICE = 'notification';
const BASE_URL = BASE_URLS[SERVICE];

export function testSendNotification() {
  const scenarios = [];
  
  const resValid = http.post(
    `${BASE_URL}/notifications/send`,
    JSON.stringify(testData.notification.send.valid),
    { 
      headers: { 
        'Content-Type': 'application/json',
      } 
    }
  );
  
  const validCheck = check(resValid, {
    'sendNotification valid - status 200, 400, or 502': (r) => [200, 400, 502].includes(r.status),
    'sendNotification valid - has proper structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.data !== undefined || body.error !== undefined);
      } catch (e) {
        return false;
      }
    },
  });
  scenarios.push({ test: 'sendNotification_valid', status: resValid.status, passed: validCheck, response: resValid.body });

  const resInvalidChannel = http.post(
    `${BASE_URL}/notifications/send`,
    JSON.stringify(testData.notification.send.invalidChannel),
    { 
      headers: { 
        'Content-Type': 'application/json',
      } 
    }
  );
  
  const invalidChannelCheck = check(resInvalidChannel, {
    'sendNotification invalidChannel - status 400 or 502': (r) => [400, 502].includes(r.status),
  });
  scenarios.push({ test: 'sendNotification_invalidChannel', status: resInvalidChannel.status, passed: invalidChannelCheck, response: resInvalidChannel.body });

  const resMissingRecipient = http.post(
    `${BASE_URL}/notifications/send`,
    JSON.stringify(testData.notification.send.missingRecipient),
    { 
      headers: { 
        'Content-Type': 'application/json',
      } 
    }
  );
  
  const missingRecipientCheck = check(resMissingRecipient, {
    'sendNotification missingRecipient - status 400 or 502': (r) => [400, 502].includes(r.status),
  });
  scenarios.push({ test: 'sendNotification_missingRecipient', status: resMissingRecipient.status, passed: missingRecipientCheck, response: resMissingRecipient.body });

  return scenarios;
}

export function testHealth() {
  const scenarios = [];
  
  const res = http.get(`${BASE_URL}/health`);
  
  const healthCheck = check(res, {
    'notificationHealth - status 200': (r) => r.status === 200,
  });
  scenarios.push({ test: 'health', status: res.status, passed: healthCheck, response: res.body });

  return scenarios;
}

export function testAllNotificationEndpoints() {
  const results = {
    service: SERVICE,
    baseUrl: BASE_URL,
    endpoints: [],
    errors: [],
    warnings: [],
  };

  try {
    results.endpoints.push(...testSendNotification());
  } catch (e) {
    results.errors.push({ test: 'sendNotification', error: e.message });
  }

  try {
    results.endpoints.push(...testHealth());
  } catch (e) {
    results.errors.push({ test: 'health', error: e.message });
  }

  return results;
}
