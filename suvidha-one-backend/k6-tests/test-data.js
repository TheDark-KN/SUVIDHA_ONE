export const testData = {
  auth: {
    sendOtp: {
      valid: {
        mobile: '9876543210',
        kiosk_id: 'KIOSK001',
      },
      invalidMobile: {
        mobile: '123',
        kiosk_id: 'KIOSK001',
      },
      missingKiosk: {
        mobile: '9876543210',
      },
    },
    verifyOtp: {
      valid: {
        mobile: '9876543210',
        otp: '123456',
        kiosk_id: 'KIOSK001',
      },
      invalidOtp: {
        mobile: '9876543210',
        otp: '000000',
        kiosk_id: 'KIOSK001',
      },
      expiredOtp: {
        mobile: '9876543210',
        otp: '123456',
        kiosk_id: 'KIOSK001',
      },
    },
    refresh: {
      valid: {
        refresh_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNzEwMDAwMDAwfQ.test',
      },
      invalid: {
        refresh_token: 'invalid-token',
      },
    },
  },
  payment: {
    initiate: {
      valid: {
        bill_ids: ['bill-001', 'bill-002'],
        method: 'upi',
        idempotency_key: 'idem-001',
      },
      invalidMethod: {
        bill_ids: ['bill-001'],
        method: 'invalid',
        idempotency_key: 'idem-002',
      },
      emptyBills: {
        bill_ids: [],
        method: 'upi',
        idempotency_key: 'idem-003',
      },
    },
    status: {
      validPaymentId: 'pay-001',
      invalidPaymentId: 'invalid-pay-id',
    },
  },
  utility: {
    fetchBills: {
      valid: {
        consumer_id: 'CONSUMER001',
        department: 'electricity',
      },
      invalidDepartment: {
        consumer_id: 'CONSUMER001',
        department: 'invalid_dept',
      },
      missingConsumer: {
        department: 'electricity',
      },
    },
    services: {},
  },
  grievance: {
    create: {
      valid: {
        category: 'billing',
        department: 'electricity',
        subject: 'Incorrect billing amount',
        description: 'The bill amount is higher than expected.',
      },
      invalidCategory: {
        category: 'invalid_category',
        department: 'electricity',
        subject: 'Test',
        description: 'Test description',
      },
      missingFields: {
        category: 'billing',
      },
    },
    update: {
      valid: {
        status: 'in_progress',
      },
      invalidStatus: {
        status: 'invalid_status',
      },
    },
  },
  document: {
    apply: {
      valid: {
        doc_type: 'birth_certificate',
        name: 'Birth Certificate Application',
      },
      invalidDocType: {
        doc_type: 'invalid_type',
        name: 'Test',
      },
      missingFields: {
        doc_type: 'birth_certificate',
      },
    },
  },
  notification: {
    send: {
      valid: {
        user_id: 'user-001',
        notification_type: 'otp',
        channel: 'sms',
        recipient: '+919876543210',
        message: 'Your OTP is 123456',
      },
      invalidChannel: {
        user_id: 'user-001',
        notification_type: 'otp',
        channel: 'invalid_channel',
        recipient: '+919876543210',
        message: 'Test',
      },
      missingRecipient: {
        user_id: 'user-001',
        notification_type: 'otp',
        channel: 'sms',
        message: 'Test',
      },
    },
  },
  session: {
    create: {
      valid: {
        user_id: 'user-001',
        kiosk_id: 'KIOSK001',
      },
      missingUser: {
        kiosk_id: 'KIOSK001',
      },
      missingKiosk: {
        user_id: 'user-001',
      },
    },
    refresh: {
      valid: {
        session_id: 'session-001',
      },
      invalid: {
        session_id: 'invalid-session',
      },
    },
  },
  kiosk: {
    register: {
      valid: {
        kiosk_id: 'KIOSK999',
        state_code: 'UP',
        district_code: 'LKO',
        location: 'Test Location',
      },
      duplicate: {
        kiosk_id: 'KIOSK001',
        state_code: 'UP',
        district_code: 'LKO',
        location: 'Existing Location',
      },
      missingFields: {
        kiosk_id: 'KIOSK999',
      },
    },
    heartbeat: {
      validKioskId: 'KIOSK001',
      invalidKioskId: 'INVALID_KIOSK',
    },
  },
};

export const expectedResponses = {
  auth: {
    sendOtp: {
      200: ['data', 'meta'],
      400: ['error'],
      429: ['error'],
    },
    verifyOtp: {
      200: ['data.access_token', 'data.refresh_token'],
      401: ['error'],
    },
    refresh: {
      200: ['data.access_token'],
      401: ['error'],
    },
    logout: {
      200: ['data'],
      401: ['error'],
    },
  },
  payment: {
    initiate: {
      200: ['data.payment_id', 'data.status'],
      400: ['error'],
      401: ['error'],
    },
    status: {
      200: ['data.payment_id', 'data.status'],
      404: ['error'],
      401: ['error'],
    },
  },
  utility: {
    fetchBills: {
      200: ['data'],
      400: ['error'],
      401: ['error'],
    },
    billDetails: {
      200: ['data.bill_id'],
      404: ['error'],
      401: ['error'],
    },
    services: {
      200: ['data'],
      401: ['error'],
    },
  },
  grievance: {
    create: {
      201: ['data.grievance_id'],
      400: ['error'],
      401: ['error'],
    },
    list: {
      200: ['data'],
      401: ['error'],
    },
    get: {
      200: ['data.grievance_id'],
      404: ['error'],
      401: ['error'],
    },
    update: {
      200: ['data'],
      400: ['error'],
      401: ['error'],
      404: ['error'],
    },
  },
  document: {
    apply: {
      200: ['data.document_id'],
      400: ['error'],
      401: ['error'],
    },
    list: {
      200: ['data'],
      401: ['error'],
    },
    get: {
      200: ['data.document_id'],
      404: ['error'],
      401: ['error'],
    },
  },
  notification: {
    send: {
      200: ['data.notification_id'],
      400: ['error'],
      502: ['error'],
    },
  },
  session: {
    create: {
      200: ['data.session_id'],
      400: ['error'],
    },
    refresh: {
      200: ['data'],
      404: ['error'],
    },
    get: {
      200: ['data.session_id'],
      404: ['error'],
    },
    delete: {
      200: ['data'],
      404: ['error'],
    },
  },
  kiosk: {
    register: {
      200: ['data.kiosk_id'],
      400: ['error'],
      409: ['error'],
    },
    list: {
      200: ['data'],
    },
    get: {
      200: ['data.kiosk_id'],
      404: ['error'],
    },
    heartbeat: {
      200: ['data'],
      404: ['error'],
    },
    config: {
      200: ['data.version'],
      404: ['error'],
    },
  },
};
