"use client";

/**
 * Button Component - SUVIDHA ONE Design System
 * 
 * Based on Wireframe_Specification.md:
 * - Primary CTA: 100% width, 100px height, #FF6600 bg
 * - Secondary: 100% width, 100px height, transparent, 2px #1A3C8F border
 * - Icon Button: 80x80px, #F5F5F5 bg
 * - Toggle: 100x50px
 */

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

// Omit conflicting event handlers from ButtonHTMLAttributes
type ButtonBaseProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDrag' | 'onDragEnd'>;

export interface ButtonProps extends ButtonBaseProps {
  variant?: "primary" | "secondary" | "icon" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  children?: ReactNode;
}

const variants = {
  primary: "bg-accent text-white hover:bg-[#e55c00] active:bg-[#cc5200]",
  secondary: "bg-transparent text-primary border-2 border-primary hover:bg-primary/5",
  icon: "bg-[#F5F5F5] text-text-primary hover:bg-[#E0E0E0] rounded-2xl",
  ghost: "bg-transparent text-text-secondary hover:bg-[#F5F5F5]",
  danger: "bg-error text-white hover:bg-[#a82d22]",
};

const sizes = {
  sm: "min-h-[60px] px-6 text-[32px]",
  md: "min-h-[80px] px-8 text-[40px]",
  lg: "min-h-[100px] px-10 text-[48px]",
  xl: "min-h-[120px] px-12 text-[56px]",
};

const iconSizes = {
  sm: "w-[60px] h-[60px]",
  md: "w-[80px] h-[80px]",
  lg: "w-[100px] h-[100px]",
  xl: "w-[120px] h-[120px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "lg",
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = "left",
      children,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const isIconOnly = variant === "icon" || (!children && icon);
    
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-4
          font-semibold rounded-2xl
          transition-colors duration-200
          touch-manipulation select-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]}
          ${isIconOnly ? iconSizes[size] : sizes[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <span className="animate-spin rounded-full border-4 border-white/30 border-t-white w-8 h-8" />
        ) : (
          <>
            {icon && iconPosition === "left" && <span className="flex-shrink-0">{icon}</span>}
            {children && <span>{children}</span>}
            {icon && iconPosition === "right" && <span className="flex-shrink-0">{icon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

/**
 * Toggle Switch Component
 * Based on spec: 100x50px, #FF6600 when on
 */
export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  labelHindi?: string;
  size?: "sm" | "md" | "lg";
}

const toggleSizes = {
  sm: { wrapper: "w-[80px] h-[40px]", knob: "w-[32px] h-[32px]", translate: "translate-x-[40px]" },
  md: { wrapper: "w-[100px] h-[50px]", knob: "w-[42px] h-[42px]", translate: "translate-x-[50px]" },
  lg: { wrapper: "w-[120px] h-[60px]", knob: "w-[52px] h-[52px]", translate: "translate-x-[60px]" },
};

export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  labelHindi,
  size = "md",
}: ToggleProps) {
  const sizeConfig = toggleSizes[size];
  
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        ${sizeConfig.wrapper}
        rounded-full p-1
        transition-colors duration-300
        ${checked ? "bg-accent" : "bg-[#E0E0E0]"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <motion.div
        animate={{ x: checked ? 50 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`
          ${sizeConfig.knob}
          bg-white rounded-full shadow-md
        `}
      />
    </button>
  );
}

export default Button;
