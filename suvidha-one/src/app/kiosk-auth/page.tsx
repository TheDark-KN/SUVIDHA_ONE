"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneScreen,
  OtpScreen,
  SuccessScreen,
  ErrorScreen,
  LanguageToggle,
} from "@/components/kiosk";
import { useOtpAuth } from "@/hooks/useOtpAuth";
import { useKioskMode } from "@/hooks/useKioskMode";
import { useAppStore } from "@/store";

type AuthStep = "phone" | "otp" | "success" | "error";

export default function KioskAuthPage() {
  const [step, setStep] = useState<AuthStep>("phone");
  const [highContrast, setHighContrast] = useState(false);
  
  const {
    loading,
    error,
    phone,
    sendOtp,
    verifyOtp,
    resendOtp,
    clearError,
  } = useOtpAuth();

  const { language, setLanguage } = useAppStore();
  const { isFullscreen } = useKioskMode({
    autoFullscreen: true,
    wakeLock: true,
  });

  const { login } = useAppStore();

  // Handle phone submission
  const handlePhoneSubmit = useCallback(
    async (phoneNumber: string) => {
      try {
        await sendOtp(phoneNumber);
        setStep("otp");
      } catch (err) {
        setStep("error");
      }
    },
    [sendOtp]
  );

  // Handle OTP verification
  const handleOtpVerify = useCallback(
    async (otp: string) => {
      const result = await verifyOtp(otp);
      if (result.success && result.user) {
        login("otp", result.user);
        setStep("success");
      }
    },
    [verifyOtp, login]
  );

  // Handle OTP resend
  const handleOtpResend = useCallback(async () => {
    await resendOtp();
  }, [resendOtp]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    clearError();
    setStep("phone");
  }, [clearError]);

  // Handle success continuation
  const handleSuccess = useCallback(() => {
    // Navigate to dashboard or home
    console.log("Authentication successful");
  }, []);

  // Handle go home
  const handleHome = useCallback(() => {
    // Navigate to dashboard
    console.log("Going to dashboard");
  }, []);

  // Handle retry from error
  const handleRetry = useCallback(() => {
    clearError();
    setStep("phone");
  }, [clearError]);

  // Toggle language
  const handleToggleLanguage = useCallback(() => {
    const nextLang = language === "hi" ? "en" : "hi";
    setLanguage(nextLang);
  }, [language, setLanguage]);

  return (
    <div className={`min-h-screen ${highContrast ? "high-contrast" : ""}`}>
      {/* Language toggle - always visible */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageToggle
          currentLanguage={language}
          onToggle={handleToggleLanguage}
          highContrast={highContrast}
        />
      </div>

      {/* High contrast toggle */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => setHighContrast(!highContrast)}
          className={`p-4 rounded-full ${
            highContrast ? "bg-yellow-600" : "bg-gray-800"
          } text-white`}
          aria-label="Toggle High Contrast"
        >
          {highContrast ? "◐" : "◑"}
        </button>
      </div>

      {/* Main content */}
      <AnimatePresence mode="wait">
        {step === "phone" && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <PhoneScreen
              onPhoneSubmit={handlePhoneSubmit}
              onBack={handleBack}
              loading={loading}
              error={error}
              highContrast={highContrast}
            />
          </motion.div>
        )}

        {step === "otp" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <OtpScreen
              phone={phone.replace("+91", "")}
              onOtpVerify={handleOtpVerify}
              onOtpResend={handleOtpResend}
              onBack={handleBack}
              loading={loading}
              error={error}
              highContrast={highContrast}
              resendCooldown={60}
            />
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <SuccessScreen
              onSuccess={handleSuccess}
              onHome={handleHome}
              highContrast={highContrast}
              autoHomeDelay={5000}
            />
          </motion.div>
        )}

        {step === "error" && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <ErrorScreen
              message={error}
              onRetry={handleRetry}
              onHome={handleHome}
              highContrast={highContrast}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-r from-primary to-accent text-white">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xl">Service Online</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xl">🇮🇳 Digital India</span>
          <span className="text-xl">|</span>
          <span className="text-xl">SUVIDHA ONE</span>
        </div>
      </div>
    </div>
  );
}
