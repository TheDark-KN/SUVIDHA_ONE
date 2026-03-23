/**
 * AuthScreen - OTP Authentication
 * 
 * Complete OTP-based authentication flow:
 * 1. Phone number entry
 * 2. OTP verification
 * 3. Success state
 * 
 * Connected to backend auth service APIs.
 */

'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

type AuthStep = 'phone' | 'otp' | 'success';

interface AuthScreenProps {
  onSuccess?: (mobile: string, token: string) => void;
  kioskId?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  kioskId = 'KIOSK001',
}) => {
  const [step, setStep] = useState<AuthStep>('phone');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);

  // Send OTP Mutation
  const sendOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await api.auth.sendOtp({ mobile: phone, kiosk_id: kioskId });
      if (!response.success) {
        throw new Error(response.error || 'Failed to send OTP');
      }
      return response.data;
    },
    onSuccess: () => {
      setStep('otp');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Verify OTP Mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (otpValue: string) => {
      const otpString = otpValue.toString().padStart(6, '0');
      const response = await api.auth.verifyOtp({
        mobile,
        otp: otpString,
        kiosk_id: kioskId,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to verify OTP');
      }
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.access_token) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        setStep('success');
        setError(null);
        setTimeout(() => {
          onSuccess?.(mobile, data.access_token);
        }, 1500);
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length !== 10 || !/^[6-9]\d{9}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    const fullMobile = `+91${mobile}`;
    sendOtpMutation.mutate(fullMobile);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all digits are entered
    if (index === 5 && value) {
      const otpValue = newOtp.join('');
      if (otpValue.length === 6) {
        verifyOtpMutation.mutate(otpValue);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResendOtp = () => {
    setOtp(['', '', '', '', '', '']);
    setError(null);
    sendOtpMutation.mutate(`+91${mobile}`);
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtp(['', '', '', '', '', '']);
      setError(null);
    }
  };

  // Success Screen
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-2xl text-center max-w-md w-full"
        >
          <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            >
              <Icon name="checkCircle" size={48} color="#22C55E" />
            </motion.div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Authentication Successful!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Redirecting to dashboard...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl font-bold text-white">स</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            SUVIDHA ONE
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Citizen Service Portal
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Phone Number Step */}
          {step === 'phone' && (
            <motion.form
              key="phone-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handlePhoneSubmit}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <span className="text-2xl">🇮🇳</span>
                    <span className="text-gray-400">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setMobile(value);
                      setError(null);
                    }}
                    placeholder="9876543210"
                    className="w-full pl-24 pr-4 py-4 text-xl rounded-xl border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                             text-center tracking-wider"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl"
                >
                  <Icon name="alertCircle" size={20} />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={sendOtpMutation.isPending || mobile.length !== 10}
                className="w-full bg-gradient-primary text-white py-4 rounded-xl font-bold text-xl
                         hover:shadow-lg transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center space-x-2"
              >
                {sendOtpMutation.isPending ? (
                  <>
                    <Icon name="refresh" size={24} className="animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <Icon name="lock" size={24} />
                    <span>Send OTP</span>
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                By continuing, you agree to our Terms of Service
              </p>
            </motion.form>
          )}

          {/* OTP Verification Step */}
          {step === 'otp' && (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Enter the OTP sent to
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  +91 {mobile}
                </p>
              </div>

              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-2xl text-center rounded-xl border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl"
                >
                  <Icon name="alertCircle" size={20} />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-4 rounded-xl font-bold
                           hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    const otpValue = otp.join('');
                    if (otpValue.length === 6) {
                      verifyOtpMutation.mutate(otpValue);
                    }
                  }}
                  disabled={verifyOtpMutation.isPending || otp.join('').length !== 6}
                  className="flex-1 bg-gradient-primary text-white py-4 rounded-xl font-bold
                           hover:shadow-lg transition-all duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center space-x-2"
                >
                  {verifyOtpMutation.isPending ? (
                    <>
                      <Icon name="refresh" size={24} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="check" size={24} />
                      <span>Verify</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={handleResendOtp}
                  disabled={sendOtpMutation.isPending}
                  className="text-primary hover:text-primary-dark font-medium text-sm
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend OTP
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthScreen;
