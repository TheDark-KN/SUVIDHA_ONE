"use client";

/**
 * Input Components - SUVIDHA ONE Design System
 * 
 * Based on Wireframe_Specification.md:
 * - Text Input: 80px height, 2px #E0E0E0 border, 32px text
 * - OTP Box: 80x80px, 2px #1A3C8F border
 * - Textarea: 200px min height
 * - Search: 70px height, #F5F5F5 bg
 */

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Search, X, Eye, EyeOff } from "lucide-react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelHindi?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, labelHindi, error, icon, fullWidth = true, className = "", type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    
    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {(label || labelHindi) && (
          <label className="block mb-3">
            {label && <span className="text-[32px] font-semibold text-text-primary">{label}</span>}
            {labelHindi && <span className="text-[28px] text-text-secondary ml-2">/ {labelHindi}</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-secondary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={isPassword && showPassword ? "text" : type}
            className={`
              w-full h-[80px] px-6 ${icon ? "pl-16" : ""} ${isPassword ? "pr-16" : ""}
              text-[32px] text-text-primary placeholder:text-text-secondary/50
              bg-white border-2 border-[#E0E0E0] rounded-xl
              focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20
              transition-all duration-200
              ${error ? "border-error focus:border-error focus:ring-error/20" : ""}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-2"
            >
              {showPassword ? <EyeOff size={28} /> : <Eye size={28} />}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-2 text-[24px] text-error font-medium flex items-center gap-2">
            <span>⚠️</span> {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/**
 * OTP Input - 6 boxes, 80x80px each
 */
export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  error = false,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;
    
    const newValue = value.split("");
    newValue[index] = digit.slice(-1);
    const newOtp = newValue.join("");
    onChange(newOtp);
    
    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pastedData);
    
    // Focus appropriate input
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-4 justify-center">
      {Array.from({ length }).map((_, index) => (
        <motion.input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          animate={error ? { x: [-5, 5, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`
            w-[80px] h-[80px]
            text-center text-[48px] font-bold text-text-primary
            bg-white border-2 rounded-xl
            focus:outline-none focus:ring-4
            transition-all duration-200
            ${error 
              ? "border-error focus:border-error focus:ring-error/20" 
              : "border-primary focus:border-primary focus:ring-primary/20"
            }
            ${disabled ? "opacity-50 cursor-not-allowed bg-[#F5F5F5]" : ""}
          `}
        />
      ))}
    </div>
  );
}

/**
 * Search Input
 */
export interface SearchInputProps extends Omit<InputProps, "icon"> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onClear, className = "", ...props }, ref) => {
    return (
      <div className="relative w-full">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-secondary" size={32} />
        <input
          ref={ref}
          type="search"
          value={value}
          className={`
            w-full h-[70px] pl-16 pr-14
            text-[28px] text-text-primary placeholder:text-text-secondary/60
            bg-[#F5F5F5] rounded-2xl
            focus:outline-none focus:ring-4 focus:ring-primary/20
            transition-all duration-200
            ${className}
          `}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-2"
          >
            <X size={28} />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

/**
 * Textarea
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  labelHindi?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, labelHindi, error, fullWidth = true, className = "", ...props }, ref) => {
    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {(label || labelHindi) && (
          <label className="block mb-3">
            {label && <span className="text-[32px] font-semibold text-text-primary">{label}</span>}
            {labelHindi && <span className="text-[28px] text-text-secondary ml-2">/ {labelHindi}</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full min-h-[200px] p-6
            text-[28px] text-text-primary placeholder:text-text-secondary/50
            bg-white border-2 border-[#E0E0E0] rounded-xl
            focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20
            transition-all duration-200 resize-none
            ${error ? "border-error focus:border-error focus:ring-error/20" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-2 text-[24px] text-error font-medium flex items-center gap-2">
            <span>⚠️</span> {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

/**
 * Numeric Keypad for Kiosk
 */
export interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear?: () => void;
  disabled?: boolean;
}

export function NumericKeypad({
  onKeyPress,
  onBackspace,
  onClear,
  disabled = false,
}: NumericKeypadProps) {
  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [onClear ? "C" : "", "0", "⌫"],
  ];

  return (
    <div className="grid grid-cols-3 gap-4 max-w-[400px] mx-auto">
      {keys.flat().map((key, index) => {
        if (!key) return <div key={index} />;
        
        const isBackspace = key === "⌫";
        const isClear = key === "C";
        
        return (
          <motion.button
            key={index}
            whileTap={{ scale: 0.9 }}
            disabled={disabled}
            onClick={() => {
              if (isBackspace) onBackspace();
              else if (isClear) onClear?.();
              else onKeyPress(key);
            }}
            className={`
              w-[100px] h-[100px]
              text-[48px] font-semibold
              rounded-2xl
              transition-colors duration-150
              ${isBackspace || isClear
                ? "bg-[#E0E0E0] text-text-secondary hover:bg-[#D0D0D0]"
                : "bg-white border-2 border-[#E0E0E0] text-text-primary hover:bg-[#F5F5F5]"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {key}
          </motion.button>
        );
      })}
    </div>
  );
}

export default Input;
