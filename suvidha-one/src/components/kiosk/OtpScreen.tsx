"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Key, AlertTriangle, RefreshCw, Smartphone } from "lucide-react";
import { OtpInput } from "./IconInput";
import { KioskButton } from "./KioskButton";

interface OtpScreenProps {
  phone: string;
  onOtpVerify: (otp: string) => Promise<void>;
  onOtpResend: () => Promise<void>;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
  highContrast?: boolean;
  resendCooldown?: number;
}

export function OtpScreen({
  phone,
  onOtpVerify,
  onOtpResend,
  onBack,
  loading = false,
  error = null,
  highContrast = false,
  resendCooldown = 60,
}: OtpScreenProps) {
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(resendCooldown);
  const [otpError, setOtpError] = useState(false);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleVerify = useCallback(async () => {
    if (otp.length === 6 && !loading) {
      try {
        await onOtpVerify(otp);
      } catch (err) {
        setOtpError(true);
        setTimeout(() => setOtpError(false), 2000);
      }
    }
  }, [otp, loading, onOtpVerify]);

  const handleResend = useCallback(async () => {
    if (cooldown === 0 && !loading) {
      setOtp("");
      setOtpError(false);
      setCooldown(resendCooldown);
      await onOtpResend();
    }
  }, [cooldown, loading, resendCooldown, onOtpResend]);

  const bgColor = highContrast ? "bg-black" : "bg-gradient-to-br from-blue-50 via-white to-orange-50";

  return (
    <div className={`${bgColor} min-h-screen flex flex-col`}>
      {/* Header with back button */}
      <header className="p-6 flex items-center justify-between">
        <KioskButton
          onClick={onBack}
          variant="ghost"
          size="large"
          disabled={loading}
          ariaLabel="Go Back"
          className="!min-h-[80px] !min-w-[80px]"
        >
          <ArrowLeft size={48} className={highContrast ? "text-white" : "text-gray-800"} />
        </KioskButton>

        {/* Phone number display */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-center gap-3 px-6 py-3 rounded-full ${
            highContrast ? "bg-gray-800" : "bg-white shadow-md"
          }`}
        >
          <Smartphone size={32} className={highContrast ? "text-yellow-400" : "text-primary"} />
          <span className={`text-2xl font-bold ${highContrast ? "text-white" : "text-gray-800"}`}>
            +91 {phone}
          </span>
        </motion.div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Key icon animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: -50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="mb-8"
        >
          <div className={`relative ${highContrast ? "text-yellow-400" : "text-primary"}`}>
            <Key size={120} strokeWidth={1.5} />
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="absolute -top-4 -right-4"
            >
              <RefreshCw size={40} className={highContrast ? "text-white" : "text-blue-400"} />
            </motion.div>
          </div>
        </motion.div>

        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className={`mb-6 p-6 rounded-2xl flex items-center gap-4 ${
                highContrast ? "bg-red-900/50 border-2 border-red-500" : "bg-red-100"
              }`}
            >
              <AlertTriangle size={48} className="text-error" />
              <span className={`text-2xl font-bold ${highContrast ? "text-white" : "text-red-800"}`}>
                {error}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OTP input component */}
        <OtpInput
          value={otp}
          onChange={setOtp}
          onSubmit={handleVerify}
          onResend={handleResend}
          disabled={loading}
          highContrast={highContrast}
          error={otpError}
          loading={loading}
        />

        {/* Cooldown timer */}
        {cooldown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex items-center gap-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw size={32} className={highContrast ? "text-gray-400" : "text-gray-500"} />
            </motion.div>
            <span className={`text-2xl ${highContrast ? "text-gray-400" : "text-gray-600"}`}>
              Resend in {cooldown}s
            </span>
          </motion.div>
        )}

        {/* Resend available */}
        {cooldown === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6"
          >
            <KioskButton
              onClick={handleResend}
              variant="secondary"
              size="large"
              disabled={loading}
              ariaLabel="Resend OTP"
            >
              <div className="flex items-center gap-3">
                <RefreshCw size={36} />
                <span className="text-2xl font-bold">RESEND OTP</span>
              </div>
            </KioskButton>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-6 flex justify-center">
        <div className={`flex items-center gap-3 px-6 py-3 rounded-full ${
          highContrast ? "bg-gray-800" : "bg-white shadow-md"
        }`}>
          <Key size={24} className={highContrast ? "text-yellow-400" : "text-primary"} />
          <span className={`text-xl ${highContrast ? "text-gray-400" : "text-gray-600"}`}>
            Enter 6-digit OTP sent to your mobile
          </span>
        </div>
      </footer>
    </div>
  );
}
