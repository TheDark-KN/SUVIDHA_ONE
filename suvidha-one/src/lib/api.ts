/**
 * SUVIDHA ONE - Comprehensive API Client
 * 
 * Connects to all backend microservices:
 * - Auth Service (3001)
 * - Payment Service (3002)
 * - Utility Service (3003)
 * - Grievance Service (3004)
 * - Document Service (3005)
 * - Notification Service (3006)
 * - Session Service (3007)
 * - Kiosk Service (3008)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Service ports for direct access (if needed)
const SERVICE_PORTS = {
  auth: 3001,
  payment: 3002,
  utility: 3003,
  grievance: 3004,
  document: 3005,
  notification: 3006,
  session: 3007,
  kiosk: 3008,
};

// ============== Types ==============

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
  meta?: MetaResponse;
}

export interface MetaResponse {
  request_id: string;
  timestamp: string;
  version: string;
}

export interface ApiResult<T> {
  data: T;
  meta: MetaResponse;
}

// Auth Types
export interface SendOtpRequest {
  mobile: string;
  kiosk_id?: string;
}

export interface SendOtpResponse {
  message: string;
  expires_in: number;
}

export interface VerifyOtpRequest {
  mobile: string;
  otp: string;
  kiosk_id?: string;
}

export interface VerifyOtpResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  token: string;
}

// Utility Types
export interface FetchBillsRequest {
  consumer_id: string;
  department: 'electricity' | 'water' | 'gas' | 'municipal';
}

export interface Bill {
  bill_id: string;
  consumer_id: string;
  amount: string;
  due_date: string;
  department: string;
  status: 'pending' | 'paid' | 'overdue';
  description: string;
}

export interface Service {
  id: string;
  name: string;
  department: string;
  description: string;
  icon: string;
}

// Grievance Types
export interface CreateGrievanceRequest {
  category: 'billing' | 'service' | 'infrastructure' | 'other';
  department: string;
  subject: string;
  description: string;
}

export interface Grievance {
  grievance_id: string;
  user_id: string;
  category: string;
  department: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface UpdateGrievanceRequest {
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
}

// Document Types
export interface ApplyDocumentRequest {
  doc_type: string;
  name: string;
}

export interface Document {
  document_id: string;
  doc_type: string;
  name: string;
  status: 'pending' | 'applied' | 'issued' | 'rejected';
  created_at: string;
}

// Payment Types
export interface InitiatePaymentRequest {
  bill_ids: string[];
  method: 'upi' | 'card' | 'bbps';
  idempotency_key?: string;
}

export interface PaymentResponse {
  payment_id: string;
  transaction_ref: string;
  amount: string;
  status: 'pending' | 'success' | 'failed';
  method: string;
  qr_code?: string;
}

// Session Types
export interface CreateSessionRequest {
  user_id: string;
  kiosk_id: string;
}

export interface SessionResponse {
  session_id: string;
  expires_in: number;
}

export interface RefreshSessionRequest {
  session_id: string;
}

// Kiosk Types
export interface RegisterKioskRequest {
  kiosk_id: string;
  state_code: string;
  district_code: string;
  location: string;
}

export interface Kiosk {
  kiosk_id: string;
  state_code: string;
  district_code: string;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
  last_heartbeat: string;
}

// Notification Types
export interface SendNotificationRequest {
  user_id: string;
  notification_type: 'otp' | 'payment_receipt' | 'bill_reminder' | 'grievance_update' | 'document_ready';
  channel: 'sms' | 'whatsapp' | 'push' | 'email';
  recipient: string;
  message: string;
}

export interface NotificationResponse {
  notification_id: string;
  status: 'sent' | 'delivered' | 'failed';
}

// ============== API Client ==============

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  useAuthToken = false
): Promise<ApiResponse<T>> {
  const token = useAuthToken ? localStorage.getItem('access_token') : null;
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Request failed',
      };
    }

    return {
      success: true,
      data: data.data || data,
      meta: data.meta,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============== API Services ==============

export const api = {
  // ========== Auth Service ==========
  auth: {
    sendOtp: (data: SendOtpRequest) =>
      fetchApi<SendOtpResponse>('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    verifyOtp: (data: VerifyOtpRequest) =>
      fetchApi<VerifyOtpResponse>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    refreshToken: (data: RefreshTokenRequest) =>
      fetchApi<VerifyOtpResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: (data: LogoutRequest) =>
      fetchApi<{ message: string }>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify(data),
      }, true),

    health: () => fetchApi<{ status: string; service: string }>('/auth/health'),
  },

  // ========== Utility Service ==========
  utility: {
    fetchBills: (data: FetchBillsRequest) =>
      fetchApi<Bill[]>('/bills/fetch', {
        method: 'POST',
        body: JSON.stringify(data),
      }, true),

    getBill: (billId: string) =>
      fetchApi<Bill>(`/bills/${billId}`, {}, true),

    listServices: () =>
      fetchApi<Service[]>('/services'),

    health: () => fetchApi<{ status: string; service: string }>('/utility/health'),
  },

  // ========== Grievance Service ==========
  grievance: {
    create: (data: CreateGrievanceRequest) =>
      fetchApi<Grievance>('/grievances', {
        method: 'POST',
        body: JSON.stringify(data),
      }, true),

    list: () =>
      fetchApi<Grievance[]>('/grievances', {}, true),

    get: (id: string) =>
      fetchApi<Grievance>(`/grievances/${id}`, {}, true),

    update: (id: string, data: UpdateGrievanceRequest) =>
      fetchApi<{ message: string }>(`/grievances/${id}/update`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }, true),

    health: () => fetchApi<{ status: string; service: string }>('/grievance/health'),
  },

  // ========== Document Service ==========
  document: {
    apply: (data: ApplyDocumentRequest) =>
      fetchApi<{ document_id: string; message: string }>('/documents/apply', {
        method: 'POST',
        body: JSON.stringify(data),
      }, true),

    list: () =>
      fetchApi<Document[]>('/documents', {}, true),

    get: (id: string) =>
      fetchApi<Document>(`/documents/${id}`, {}, true),

    health: () => fetchApi<{ status: string; service: string }>('/document/health'),
  },

  // ========== Payment Service ==========
  payment: {
    initiate: (data: InitiatePaymentRequest) =>
      fetchApi<PaymentResponse>('/payments/initiate', {
        method: 'POST',
        body: JSON.stringify(data),
      }, true),

    getStatus: (paymentId: string) =>
      fetchApi<PaymentResponse>(`/payments/status/${paymentId}`, {}, true),

    health: () => fetchApi<{ status: string; service: string }>('/payment/health'),
  },

  // ========== Session Service ==========
  session: {
    create: (data: CreateSessionRequest) =>
      fetchApi<SessionResponse>('/sessions/create', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    refresh: (data: RefreshSessionRequest) =>
      fetchApi<{ message: string; expires_in: number }>('/sessions/refresh', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    get: (sessionId: string) =>
      fetchApi<SessionResponse>(`/sessions/${sessionId}`),

    delete: (sessionId: string) =>
      fetchApi<{ message: string }>(`/sessions/${sessionId}`, {
        method: 'DELETE',
      }),

    health: () => fetchApi<{ status: string; service: string }>('/session/health'),
  },

  // ========== Kiosk Service ==========
  kiosk: {
    register: (data: RegisterKioskRequest) =>
      fetchApi<{ kiosk_id: string; status: string }>('/kiosks/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    list: () =>
      fetchApi<Kiosk[]>('/kiosks'),

    get: (kioskId: string) =>
      fetchApi<Kiosk>(`/kiosks/${kioskId}`),

    heartbeat: (kioskId: string) =>
      fetchApi<{ message: string }>(`/kiosks/${kioskId}/heartbeat`, {
        method: 'POST',
      }),

    health: () => fetchApi<{ status: string; service: string }>('/kiosk/health'),
  },

  // ========== Notification Service ==========
  notification: {
    send: (data: SendNotificationRequest) =>
      fetchApi<NotificationResponse>('/notifications/send', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    health: () => fetchApi<{ status: string; service: string }>('/notification/health'),
  },

  // ========== Health Check ==========
  health: {
    check: () => fetchApi<{ status: string }>('/health'),
    ready: () => fetchApi<{ status: string }>('/ready'),
  },
};

export { API_BASE_URL };
export default api;
