"use client";

/**
 * Layout Components - SUVIDHA ONE Design System
 * 
 * Based on Wireframe_Specification.md:
 * - KioskLayout: Full screen wrapper
 * - Header: Back button, title, action
 * - BottomNav: 4 icons, 100px height
 */

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, FileText, HelpCircle, Settings, ArrowLeft, Volume2, VolumeX, Globe } from "lucide-react";

/**
 * Kiosk Layout - Full screen wrapper with optional header and nav
 */
export interface KioskLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showNav?: boolean;
  title?: string;
  titleHindi?: string;
  onBack?: () => void;
  headerRight?: ReactNode;
  bgColor?: "white" | "light" | "gradient";
  activeNav?: "home" | "history" | "help" | "settings";
  onNavChange?: (nav: "home" | "history" | "help" | "settings") => void;
}

const bgColors = {
  white: "bg-white",
  light: "bg-[#F5F5F5]",
  gradient: "bg-gradient-to-br from-blue-50 via-white to-orange-50",
};

export function KioskLayout({
  children,
  showHeader = true,
  showNav = true,
  title,
  titleHindi,
  onBack,
  headerRight,
  bgColor = "white",
  activeNav = "home",
  onNavChange,
}: KioskLayoutProps) {
  return (
    <div className={`min-h-screen flex flex-col ${bgColors[bgColor]}`}>
      {/* Header */}
      {showHeader && (
        <Header
          title={title}
          titleHindi={titleHindi}
          onBack={onBack}
          rightContent={headerRight}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {showNav && (
        <BottomNav
          active={activeNav}
          onChange={onNavChange}
        />
      )}
    </div>
  );
}

/**
 * Header Component
 */
export interface HeaderProps {
  title?: string;
  titleHindi?: string;
  onBack?: () => void;
  rightContent?: ReactNode;
}

export function Header({
  title,
  titleHindi,
  onBack,
  rightContent,
}: HeaderProps) {
  return (
    <header className="w-full h-[100px] px-8 flex items-center justify-between bg-white shadow-sm">
      {/* Left: Back button */}
      <div className="w-[200px]">
        {onBack && (
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-[80px] h-[80px] flex items-center justify-center rounded-2xl bg-[#F5F5F5] hover:bg-[#E0E0E0] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={40} className="text-text-primary" />
          </motion.button>
        )}
      </div>

      {/* Center: Title */}
      <div className="flex-1 text-center">
        {title && (
          <h1 className="text-[36px] font-bold text-text-primary">
            {title}
            {titleHindi && (
              <span className="text-[28px] text-text-secondary font-normal ml-4">
                / {titleHindi}
              </span>
            )}
          </h1>
        )}
      </div>

      {/* Right: Custom content */}
      <div className="w-[200px] flex justify-end">
        {rightContent}
      </div>
    </header>
  );
}

/**
 * Bottom Navigation
 */
export interface BottomNavProps {
  active: "home" | "history" | "help" | "settings";
  onChange?: (nav: "home" | "history" | "help" | "settings") => void;
}

const navItems = [
  { id: "home" as const, icon: Home, label: "Home", labelHindi: "होम" },
  { id: "history" as const, icon: FileText, label: "History", labelHindi: "इतिहास" },
  { id: "help" as const, icon: HelpCircle, label: "Help", labelHindi: "मदद" },
  { id: "settings" as const, icon: Settings, label: "Settings", labelHindi: "सेटिंग्स" },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="w-full h-[100px] px-4 bg-white border-t border-[#E0E0E0] flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        
        return (
          <motion.button
            key={item.id}
            onClick={() => onChange?.(item.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              flex flex-col items-center justify-center gap-1
              w-[100px] h-[80px] rounded-2xl
              transition-colors duration-200
              ${isActive 
                ? "bg-primary/10 text-primary" 
                : "text-text-secondary hover:bg-[#F5F5F5]"
              }
            `}
          >
            <Icon size={32} />
            <span className="text-[16px] font-medium">{item.label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}

/**
 * Header Controls - Language and Voice toggles
 */
export interface HeaderControlsProps {
  language: string;
  voiceEnabled: boolean;
  onLanguageClick: () => void;
  onVoiceToggle: () => void;
}

export function HeaderControls({
  language,
  voiceEnabled,
  onLanguageClick,
  onVoiceToggle,
}: HeaderControlsProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Language Button */}
      <motion.button
        onClick={onLanguageClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] transition-colors"
      >
        <Globe size={24} className="text-primary" />
        <span className="text-[20px] font-medium text-text-primary uppercase">{language}</span>
      </motion.button>

      {/* Voice Toggle */}
      <motion.button
        onClick={onVoiceToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          w-[60px] h-[60px] rounded-xl flex items-center justify-center
          transition-colors duration-200
          ${voiceEnabled 
            ? "bg-accent text-white" 
            : "bg-[#F5F5F5] text-text-secondary"
          }
        `}
        aria-label={voiceEnabled ? "Disable voice" : "Enable voice"}
      >
        {voiceEnabled ? <Volume2 size={28} /> : <VolumeX size={28} />}
      </motion.button>
    </div>
  );
}

/**
 * Loading Spinner
 */
export interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "accent" | "white";
  text?: string;
  textHindi?: string;
}

const spinnerSizes = {
  sm: "w-8 h-8 border-3",
  md: "w-12 h-12 border-4",
  lg: "w-20 h-20 border-4",
  xl: "w-32 h-32 border-8",
};

const spinnerColors = {
  primary: "border-primary/30 border-t-primary",
  accent: "border-accent/30 border-t-accent",
  white: "border-white/30 border-t-white",
};

export function Spinner({
  size = "lg",
  color = "accent",
  text,
  textHindi,
}: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className={`
          rounded-full animate-spin
          ${spinnerSizes[size]}
          ${spinnerColors[color]}
        `}
      />
      {text && (
        <div className="text-center">
          <p className="text-[32px] font-semibold text-text-primary">{text}</p>
          {textHindi && <p className="text-[24px] text-text-secondary">{textHindi}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Service Grid - Responsive grid for dashboard
 */
export interface ServiceGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

export function ServiceGrid({ children, columns = 3 }: ServiceGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {children}
    </div>
  );
}

export default KioskLayout;
