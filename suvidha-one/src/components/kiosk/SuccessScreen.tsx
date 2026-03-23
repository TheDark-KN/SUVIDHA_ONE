"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Home, Printer, MessageCircle, Share2, RefreshCw } from "lucide-react";
import { KioskButton } from "./KioskButton";

interface SuccessScreenProps {
  onSuccess: () => void;
  onPrint?: () => void;
  onSms?: () => void;
  onShare?: () => void;
  onHome: () => void;
  highContrast?: boolean;
  autoHomeDelay?: number;
}

export function SuccessScreen({
  onSuccess,
  onPrint,
  onSms,
  onShare,
  onHome,
  highContrast = false,
  autoHomeDelay = 5000,
}: SuccessScreenProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    onSuccess();
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onSuccess]);

  const bgColor = highContrast ? "bg-black" : "bg-gradient-to-br from-green-50 via-white to-blue-50";

  return (
    <div className={`${bgColor} min-h-screen flex flex-col items-center justify-center p-8`}>
      {/* Confetti effect */}
      <AnimatePresence>
        {showConfetti && (
          <>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -100, x: Math.random() * 100 - 50, opacity: 1 }}
                animate={{ y: 1000, x: Math.random() * 200 - 100, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 + Math.random() * 2, ease: "easeOut" }}
                className={`absolute w-4 h-4 rounded-full ${
                  ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500"][
                    i % 5
                  ]
                }`}
                style={{ left: `${20 + Math.random() * 60}%` }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Success animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="mb-12"
      >
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className={`w-48 h-48 rounded-full flex items-center justify-center ${
              highContrast ? "bg-green-900" : "bg-green-100"
            }`}
          >
            <CheckCircle
              size={120}
              strokeWidth={3}
              className={highContrast ? "text-green-400" : "text-success"}
            />
          </motion.div>
          {/* Ripple effect */}
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`absolute inset-0 rounded-full border-4 ${
              highContrast ? "border-green-400" : "border-success"
            }`}
          />
        </div>
      </motion.div>

      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center mb-12"
      >
        <h1
          className={`text-6xl font-extrabold mb-4 ${
            highContrast ? "text-white" : "text-gray-800"
          }`}
        >
          ✓ VERIFIED
        </h1>
        <p className={`text-3xl ${highContrast ? "text-gray-400" : "text-gray-600"}`}>
          Authentication Successful
        </p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-2 gap-6 w-full max-w-2xl"
      >
        {onPrint && (
          <KioskButton
            onClick={onPrint}
            variant="secondary"
            size="xlarge"
            ariaLabel="Print Receipt"
          >
            <div className="flex flex-col items-center gap-2">
              <Printer size={56} className={highContrast ? "text-white" : "text-gray-800"} />
              <span className={`text-xl font-bold ${highContrast ? "text-white" : "text-gray-800"}`}>
                PRINT
              </span>
            </div>
          </KioskButton>
        )}

        {onSms && (
          <KioskButton
            onClick={onSms}
            variant="secondary"
            size="xlarge"
            ariaLabel="Send SMS"
          >
            <div className="flex flex-col items-center gap-2">
              <MessageCircle size={56} className={highContrast ? "text-white" : "text-gray-800"} />
              <span className={`text-xl font-bold ${highContrast ? "text-white" : "text-gray-800"}`}>
                SMS
              </span>
            </div>
          </KioskButton>
        )}

        {onShare && (
          <KioskButton
            onClick={onShare}
            variant="secondary"
            size="xlarge"
            ariaLabel="Share"
          >
            <div className="flex flex-col items-center gap-2">
              <Share2 size={56} className={highContrast ? "text-white" : "text-gray-800"} />
              <span className={`text-xl font-bold ${highContrast ? "text-white" : "text-gray-800"}`}>
                SHARE
              </span>
            </div>
          </KioskButton>
        )}

        <KioskButton
          onClick={onHome}
          variant="success"
          size="xlarge"
          ariaLabel="Go to Dashboard"
          className="col-span-2"
        >
          <div className="flex items-center gap-4">
            <Home size={56} />
            <span className="text-3xl font-bold">CONTINUE</span>
          </div>
        </KioskButton>
      </motion.div>

      {/* Auto-home countdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 flex items-center gap-4"
      >
        <div className={`w-3 h-3 rounded-full ${highContrast ? "bg-yellow-400" : "bg-blue-500"} animate-pulse`} />
        <span className={`text-xl ${highContrast ? "text-gray-400" : "text-gray-600"}`}>
          Auto-redirect in {autoHomeDelay / 1000}s
        </span>
      </motion.div>
    </div>
  );
}

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
  onHome: () => void;
  highContrast?: boolean;
}

export function ErrorScreen({
  message,
  onRetry,
  onHome,
  highContrast = false,
}: ErrorScreenProps) {
  const bgColor = highContrast ? "bg-black" : "bg-gradient-to-br from-red-50 via-white to-orange-50";

  return (
    <div className={`${bgColor} min-h-screen flex flex-col items-center justify-center p-8`}>
      {/* Error animation */}
      <motion.div
        initial={{ scale: 0, rotate: 180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="mb-12"
      >
        <div className={`w-48 h-48 rounded-full flex items-center justify-center ${
          highContrast ? "bg-red-900" : "bg-red-100"
        }`}>
          <XCircle
            size={120}
            strokeWidth={3}
            className={highContrast ? "text-red-400" : "text-error"}
          />
        </div>
      </motion.div>

      {/* Error message */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-12"
      >
        <h1
          className={`text-6xl font-extrabold mb-4 ${
            highContrast ? "text-white" : "text-gray-800"
          }`}
        >
          ✕ ERROR
        </h1>
        <p className={`text-3xl ${highContrast ? "text-gray-400" : "text-gray-600"}`}>
          {message}
        </p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-6"
      >
        <KioskButton
          onClick={onRetry}
          variant="primary"
          size="xlarge"
          ariaLabel="Retry"
        >
          <div className="flex items-center gap-4">
            <RefreshCw size={56} />
            <span className="text-3xl font-bold">RETRY</span>
          </div>
        </KioskButton>

        <KioskButton
          onClick={onHome}
          variant="secondary"
          size="xlarge"
          ariaLabel="Go Home"
        >
          <div className="flex items-center gap-4">
            <Home size={56} />
            <span className="text-3xl font-bold">HOME</span>
          </div>
        </KioskButton>
      </motion.div>
    </div>
  );
}
