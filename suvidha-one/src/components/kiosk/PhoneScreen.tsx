"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Smartphone, AlertTriangle } from "lucide-react";
import { PhoneInput } from "./IconInput";
import { KioskButton } from "./KioskButton";

interface PhoneScreenProps {
  onPhoneSubmit: (phone: string) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
  highContrast?: boolean;
}

export function PhoneScreen({
  onPhoneSubmit,
  onBack,
  loading = false,
  error = null,
  highContrast = false,
}: PhoneScreenProps) {
  const [phone, setPhone] = useState("");

  const handleSubmit = useCallback(async () => {
    if (phone.length >= 13) {
      await onPhoneSubmit(phone);
    }
  }, [phone, onPhoneSubmit]);

  const bgColor = highContrast ? "bg-black" : "bg-gradient-to-br from-blue-50 via-white to-orange-50";

  return (
    <div className={`${bgColor} min-h-screen flex flex-col`}>
      {/* Header with back button */}
      <header className="p-6 flex items-center">
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
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Phone icon animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: -50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-8"
        >
          <div className={`relative ${highContrast ? "text-yellow-400" : "text-primary"}`}>
            <Smartphone size={120} strokeWidth={1.5} />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute inset-0 rounded-full ${highContrast ? "bg-yellow-400" : "bg-blue-500"}`}
              style={{ opacity: 0.2 }}
            />
          </div>
        </motion.div>

        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
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

        {/* Phone input component */}
        <PhoneInput
          value={phone.replace(/\D/g, "").slice(0, 10)}
          onChange={(val) => setPhone(val)}
          onSubmit={handleSubmit}
          disabled={loading}
          highContrast={highContrast}
        />
      </main>

      {/* Footer with service status */}
      <footer className="p-6 flex justify-center">
        <div className={`flex items-center gap-3 px-6 py-3 rounded-full ${
          highContrast ? "bg-gray-800" : "bg-white shadow-md"
        }`}>
          <div className="w-4 h-4 rounded-full bg-success animate-pulse" />
          <span className={`text-xl ${highContrast ? "text-gray-400" : "text-gray-600"}`}>
            Service Online
          </span>
        </div>
      </footer>
    </div>
  );
}
