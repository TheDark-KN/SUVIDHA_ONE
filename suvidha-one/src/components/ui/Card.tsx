"use client";

/**
 * Card Components - SUVIDHA ONE Design System
 * 
 * Based on Wireframe_Specification.md:
 * - Service Tile: #FFFFFF, 16px radius, shadow
 * - Bill Card: #FFFFFF, 12px radius, checkbox
 * - Payment Option: #FFFFFF, 16px radius, larger
 */

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

/**
 * Service Tile - Main dashboard grid items
 */
export interface ServiceTileProps {
  icon: ReactNode;
  iconBgColor?: string;
  name: string;
  nameHindi?: string;
  description?: string;
  badge?: {
    text: string;
    variant: "due" | "paid" | "pending" | "warning";
  };
  onClick: () => void;
  disabled?: boolean;
}

const badgeColors = {
  due: "bg-error text-white",
  paid: "bg-success text-white",
  pending: "bg-accent text-white",
  warning: "bg-[#F5A623] text-white",
};

export function ServiceTile({
  icon,
  iconBgColor = "#1A3C8F",
  name,
  nameHindi,
  description,
  badge,
  onClick,
  disabled = false,
}: ServiceTileProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -4 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`
        w-full p-8 bg-white rounded-2xl
        shadow-[0_4px_12px_rgba(0,0,0,0.1)]
        hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]
        transition-shadow duration-300
        flex flex-col items-center text-center gap-4
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {/* Icon Container */}
      <div
        className="w-[160px] h-[160px] rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${iconBgColor}15` }}
      >
        <div
          className="w-[120px] h-[120px] rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: iconBgColor }}
        >
          {icon}
        </div>
      </div>

      {/* Name */}
      <div>
        {nameHindi && (
          <h3 className="text-[32px] font-bold text-text-primary mb-1">{nameHindi}</h3>
        )}
        <h4 className="text-[24px] text-text-secondary">{name}</h4>
      </div>

      {/* Description */}
      {description && (
        <p className="text-[20px] text-text-secondary line-clamp-2">{description}</p>
      )}

      {/* Badge */}
      {badge && (
        <span className={`px-4 py-2 rounded-full text-[20px] font-semibold ${badgeColors[badge.variant]}`}>
          {badge.text}
        </span>
      )}
    </motion.button>
  );
}

/**
 * Bill Card - Payment list items
 */
export interface BillCardProps {
  provider: string;
  consumerNumber: string;
  amount: number;
  dueDate: string;
  period?: string;
  selected: boolean;
  onSelect: () => void;
  overdue?: boolean;
}

export function BillCard({
  provider,
  consumerNumber,
  amount,
  dueDate,
  period,
  selected,
  onSelect,
  overdue = false,
}: BillCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full p-6 bg-white rounded-xl
        shadow-[0_2px_8px_rgba(0,0,0,0.08)]
        flex items-center gap-6
        transition-all duration-200
        ${selected ? "ring-4 ring-accent ring-opacity-50" : ""}
      `}
    >
      {/* Checkbox */}
      <div
        className={`
          w-[60px] h-[60px] rounded-xl border-2 flex items-center justify-center
          transition-colors duration-200
          ${selected ? "bg-accent border-accent" : "border-[#E0E0E0]"}
        `}
      >
        {selected && <Check className="text-white" size={32} />}
      </div>

      {/* Provider Info */}
      <div className="flex-1 text-left">
        <h4 className="text-[32px] font-semibold text-text-primary">{provider}</h4>
        <p className="text-[24px] text-text-secondary">Consumer: {consumerNumber}</p>
        {period && <p className="text-[20px] text-text-secondary">Period: {period}</p>}
      </div>

      {/* Amount & Due */}
      <div className="text-right">
        <p className="text-[36px] font-bold text-text-primary">₹{amount.toLocaleString()}</p>
        <p className={`text-[24px] font-medium ${overdue ? "text-error" : "text-text-secondary"}`}>
          Due: {dueDate}
        </p>
      </div>
    </motion.button>
  );
}

/**
 * Payment Option Card
 */
export interface PaymentOptionProps {
  icon: ReactNode;
  title: string;
  titleHindi?: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
}

export function PaymentOption({
  icon,
  title,
  titleHindi,
  description,
  onClick,
  disabled = false,
}: PaymentOptionProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        w-full p-8 bg-white rounded-2xl
        shadow-[0_4px_12px_rgba(0,0,0,0.1)]
        hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]
        flex items-center gap-8
        transition-all duration-200
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {/* Icon */}
      <div className="w-[80px] h-[80px] flex items-center justify-center text-primary">
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 text-left">
        <h4 className="text-[32px] font-semibold text-text-primary">{title}</h4>
        {titleHindi && <p className="text-[24px] text-text-secondary">{titleHindi}</p>}
        {description && <p className="text-[20px] text-text-secondary mt-1">{description}</p>}
      </div>
    </motion.button>
  );
}

/**
 * Language Card
 */
export interface LanguageCardProps {
  code: string;
  nativeName: string;
  englishName: string;
  selected: boolean;
  onClick: () => void;
}

export function LanguageCard({
  nativeName,
  englishName,
  selected,
  onClick,
}: LanguageCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full aspect-[4/3] p-6 bg-white rounded-2xl
        flex flex-col items-center justify-center gap-2
        transition-all duration-200
        ${selected 
          ? "border-4 border-accent shadow-[0_0_20px_rgba(255,102,0,0.3)]" 
          : "border-2 border-[#E0E0E0] hover:border-primary/30"
        }
      `}
    >
      {/* Native Name */}
      <span className="text-[40px] font-bold text-text-primary">{nativeName}</span>
      
      {/* English Name */}
      <span className="text-[28px] text-text-secondary">{englishName}</span>
      
      {/* Selected Indicator */}
      {selected && (
        <div className="absolute top-4 right-4 w-8 h-8 bg-success rounded-full flex items-center justify-center">
          <Check className="text-white" size={20} />
        </div>
      )}
    </motion.button>
  );
}

/**
 * Auth Option Card
 */
export interface AuthOptionProps {
  icon: ReactNode;
  title: string;
  titleHindi?: string;
  description?: string;
  onClick: () => void;
  muted?: boolean;
}

export function AuthOption({
  icon,
  title,
  titleHindi,
  description,
  onClick,
  muted = false,
}: AuthOptionProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01, x: 8 }}
      whileTap={{ scale: 0.99 }}
      className={`
        w-full p-8 rounded-2xl
        flex items-center gap-8
        transition-all duration-200
        ${muted 
          ? "bg-[#F5F5F5] text-text-secondary" 
          : "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
        }
      `}
    >
      {/* Icon */}
      <div className={`w-[80px] h-[80px] flex items-center justify-center ${muted ? "text-text-secondary" : "text-primary"}`}>
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 text-left">
        <h4 className={`text-[36px] font-semibold ${muted ? "text-text-secondary" : "text-text-primary"}`}>
          {title}
        </h4>
        {titleHindi && <p className="text-[28px] text-text-secondary">{titleHindi}</p>}
        {description && <p className="text-[24px] text-text-secondary mt-1">{description}</p>}
      </div>
    </motion.button>
  );
}

export default ServiceTile;
