"use client";

import { useState, useCallback } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://suvidha-one.onrender.com";

export interface OtpSendResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

export interface OtpVerifyResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    mobile?: string;
  };
}

export interface ApiError {
  message: string;
  code?: string;
}

/**
 * Send OTP to mobile number
 * POST /otp/send
 */
export async function sendOtp(phone: string): Promise<OtpSendResponse> {
  const response = await fetch(`${API_BASE_URL}/otp/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to send OTP" }));
    throw new Error(error.message || "Failed to send OTP");
  }

  return response.json();
}

/**
 * Verify OTP
 * POST /otp/verify
 */
export async function verifyOtp(
  phone: string,
  otp: string
): Promise<OtpVerifyResponse> {
  const response = await fetch(`${API_BASE_URL}/otp/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone, otp }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Invalid OTP" }));
    throw new Error(error.message || "Invalid OTP");
  }

  return response.json();
}

/**
 * Hook for OTP operations with loading and error states
 */
export function useOtpAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>("");
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const sendOtpWithPhone = useCallback(async (phoneNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      // Format phone number (remove non-digits, ensure +91 prefix)
      const digits = phoneNumber.replace(/\D/g, "");
      const formattedPhone = digits.startsWith("91")
        ? `+${digits}`
        : `+91${digits}`;

      await sendOtp(formattedPhone);
      setPhone(formattedPhone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtpAndAuthenticate = useCallback(
    async (otp: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await verifyOtp(phone, otp);
        setAuthenticated(true);
        if (result.token) {
          setToken(result.token);
          // Store token in localStorage for persistence
          localStorage.setItem("suvidha_auth_token", result.token);
        }
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid OTP");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [phone]
  );

  const resendOtp = useCallback(async () => {
    if (phone) {
      await sendOtpWithPhone(phone);
    }
  }, [phone, sendOtpWithPhone]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const logout = useCallback(() => {
    setAuthenticated(false);
    setPhone("");
    setToken(null);
    localStorage.removeItem("suvidha_auth_token");
  }, []);

  return {
    loading,
    error,
    phone,
    authenticated,
    token,
    sendOtp: sendOtpWithPhone,
    verifyOtp: verifyOtpAndAuthenticate,
    resendOtp,
    clearError,
    logout,
  };
}

/**
 * Get stored auth token
 */
export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("suvidha_auth_token");
}

/**
 * Clear stored auth token
 */
export function clearStoredAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("suvidha_auth_token");
  }
}
