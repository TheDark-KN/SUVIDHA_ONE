"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";

interface KioskButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "error" | "ghost";
  size?: "large" | "xlarge" | "xxlarge";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function KioskButton({
  onClick,
  children,
  variant = "primary",
  size = "large",
  disabled = false,
  loading = false,
  className = "",
  ariaLabel,
}: KioskButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  // Haptic feedback for touch devices
  const handleTouchStart = useCallback(() => {
    if ("navigator" in window && "vibrate" in navigator) {
      navigator.vibrate?.(10);
    }
    setIsPressed(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && !loading) {
      // Haptic feedback on click
      if ("navigator" in window && "vibrate" in navigator) {
        navigator.vibrate?.(20);
      }
      onClick();
    }
  }, [onClick, disabled, loading]);

  // Size configurations (80px+ touch targets)
  const sizeClasses = {
    large: "min-h-[120px] min-w-[120px] px-8",
    xlarge: "min-h-[160px] min-w-[160px] px-10",
    xxlarge: "min-h-[200px] min-w-[200px] px-12",
  };

  // Variant configurations with high contrast support
  const variantClasses = {
    primary: "bg-primary hover:bg-blue-700 active:bg-blue-800 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800",
    success: "bg-success hover:bg-green-700 active:bg-green-800 text-white",
    error: "bg-error hover:bg-red-700 active:bg-red-800 text-white",
    ghost: "bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-800",
  };

  const disabledClasses = disabled || loading
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer transform transition-all duration-150";

  const pressedScale = isPressed && !disabled && !loading ? "scale-95" : "scale-100";

  return (
    <motion.button
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabledClasses}
        ${pressedScale}
        rounded-2xl shadow-lg flex items-center justify-center
        focus:outline-none focus:ring-4 focus:ring-blue-400
        ${className}
      `}
      aria-label={ariaLabel}
      disabled={disabled || loading}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full"
        />
      ) : (
        children
      )}
    </motion.button>
  );
}
