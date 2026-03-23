"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Key, Delete, CheckCircle, XCircle } from "lucide-react";
import { KioskButton } from "./KioskButton";

interface PhoneInputProps {
  value: string;
  onChange: (phone: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  highContrast?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  highContrast = false,
}: PhoneInputProps) {
  const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  const handleKeyPress = useCallback((key: string) => {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
    } else if (value.length < 13) {
      onChange(value + key);
    }
  }, [value, onChange]);

  const isComplete = value.length >= 13;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {/* Phone display with icon */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`
          w-full p-6 rounded-3xl flex items-center gap-4
          ${highContrast ? "bg-gray-800 border-2 border-white" : "bg-white shadow-xl"}
        `}
      >
        <Smartphone
          size={56}
          className={highContrast ? "text-yellow-400" : "text-primary"}
        />
        <div className="flex-1">
          <div className={`text-4xl font-bold tracking-wider ${highContrast ? "text-white" : "text-gray-800"}`}>
            +91 {value || "___________"}
          </div>
          <div className={`text-xl ${highContrast ? "text-gray-400" : "text-gray-400"}`}>
            {value.length}/13 digits
          </div>
        </div>
        {isComplete && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            <CheckCircle size={48} className="text-success" />
          </motion.div>
        )}
      </motion.div>

      {/* Numeric keypad */}
      <div className="grid grid-cols-3 gap-4 w-full">
        {keypad.map((key, index) => {
          const isEmpty = key === "";
          const isBackspace = key === "⌫";

          return (
            <div key={index} className={isEmpty ? "invisible" : ""}>
              <KioskButton
                onClick={() => handleKeyPress(key)}
                variant={isBackspace ? "secondary" : "primary"}
                size="large"
                disabled={disabled}
                className="w-full"
                ariaLabel={isBackspace ? "Delete" : key}
              >
                {isBackspace ? (
                  <Delete size={40} />
                ) : (
                  <span className="text-5xl font-bold">{key}</span>
                )}
              </KioskButton>
            </div>
          );
        })}
      </div>

      {/* Submit button */}
      <KioskButton
        onClick={onSubmit}
        variant={isComplete ? "success" : "secondary"}
        size="xlarge"
        disabled={!isComplete || disabled}
        className="w-full mt-4"
        ariaLabel="Send OTP"
      >
        <div className="flex items-center gap-4">
          <Smartphone size={48} />
          <span className="text-3xl font-bold">SEND OTP</span>
        </div>
      </KioskButton>
    </div>
  );
}

interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  onSubmit: () => void;
  onResend?: () => void;
  disabled?: boolean;
  highContrast?: boolean;
  error?: boolean;
  loading?: boolean;
}

export function OtpInput({
  value,
  onChange,
  onSubmit,
  onResend,
  disabled = false,
  highContrast = false,
  error = false,
  loading = false,
}: OtpInputProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleKeyPress = useCallback((digit: string) => {
    if (disabled || loading) return;

    const newValue = value + digit;
    if (newValue.length <= 6) {
      onChange(newValue.slice(0, 6));
      if (newValue.length < 6) {
        setFocusedIndex(newValue.length);
      }
    }
  }, [value, onChange, disabled, loading]);

  const handleBackspace = useCallback(() => {
    if (disabled || loading) return;
    const newValue = value.slice(0, -1);
    onChange(newValue);
    setFocusedIndex(Math.max(0, newValue.length - 1));
  }, [value, onChange, disabled, loading]);

  const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      {/* OTP icon and title */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-4"
      >
        <Key
          size={72}
          className={error ? "text-error" : highContrast ? "text-yellow-400" : "text-primary"}
        />
      </motion.div>

      {/* 6-digit OTP blocks */}
      <div className="flex gap-3 justify-center">
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const digit = value[index] || "";
          const isActive = index === focusedIndex;
          const hasError = error && index === value.length;

          return (
            <motion.div
              key={index}
              ref={(el: HTMLDivElement | null) => { inputRefs.current[index] = el; }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: isActive ? 1.1 : 1,
                opacity: 1,
                borderColor: hasError
                  ? "#C0392B"
                  : isActive
                  ? highContrast
                    ? "#FACC15"
                    : "#1A3C8F"
                  : highContrast
                  ? "#4B5563"
                  : "#D1D5DB",
              }}
              className={`
                w-20 h-24 rounded-2xl flex items-center justify-center
                text-5xl font-bold
                ${highContrast ? "bg-gray-800" : "bg-white shadow-lg"}
                ${hasError ? "animate-pulse" : ""}
              `}
              style={{
                borderWidth: 4,
                borderStyle: "solid",
              }}
            >
              <AnimatePresence mode="wait">
                {digit ? (
                  <motion.span
                    key={digit}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className={hasError ? "text-error" : highContrast ? "text-white" : "text-gray-800"}
                  >
                    {digit}
                  </motion.span>
                ) : error && index === value.length ? (
                  <XCircle size={40} className="text-error" />
                ) : null}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-error"
        >
          <XCircle size={32} />
          <span className="text-2xl font-bold">Invalid OTP</span>
        </motion.div>
      )}

      {/* Numeric keypad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
        {keypad.map((key, index) => {
          const isEmpty = key === "";
          const isBackspace = key === "⌫";

          return (
            <div key={index} className={isEmpty ? "invisible" : ""}>
              <KioskButton
                onClick={() => (isBackspace ? handleBackspace() : handleKeyPress(key))}
                variant={isBackspace ? "secondary" : "primary"}
                size="large"
                disabled={disabled || loading}
                className="w-full"
                ariaLabel={isBackspace ? "Delete" : key}
              >
                {isBackspace ? (
                  <Delete size={40} />
                ) : (
                  <span className="text-5xl font-bold">{key}</span>
                )}
              </KioskButton>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 w-full max-w-lg mt-4">
        {onResend && (
          <KioskButton
            onClick={onResend}
            variant="secondary"
            size="large"
            disabled={disabled || loading}
            className="flex-1"
            ariaLabel="Resend OTP"
          >
            <div className="flex items-center gap-3">
              <Smartphone size={36} />
              <span className="text-2xl font-bold">RESEND</span>
            </div>
          </KioskButton>
        )}
        <KioskButton
          onClick={onSubmit}
          variant={error ? "secondary" : "success"}
          size="large"
          disabled={value.length !== 6 || disabled}
          loading={loading}
          className="flex-1"
          ariaLabel="Verify OTP"
        >
          <div className="flex items-center gap-3">
            <CheckCircle size={36} />
            <span className="text-2xl font-bold">VERIFY</span>
          </div>
        </KioskButton>
      </div>
    </div>
  );
}
