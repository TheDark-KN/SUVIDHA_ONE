"use client";

/**
 * Welcome Screen - SCREEN-01
 * 
 * Based on Wireframe_Specification.md:
 * - Full screen touch-to-start
 * - Digital India branding
 * - Language and voice toggles
 * - Subtle pulse animation on CTA
 */

import { motion } from "framer-motion";
import { Globe, Volume2, VolumeX } from "lucide-react";
import { useAppStore } from "@/store";
import { t } from "@/lib/i18n";

export interface WelcomeScreenProps {
  onStart?: () => void;
  onTouch?: () => void;
}

export function WelcomeScreen({ onStart, onTouch }: WelcomeScreenProps) {
  const { 
    language, 
    voiceEnabled, 
    setVoiceEnabled,
    fontScale,
    highContrast 
  } = useAppStore();

  const handleStart = () => {
    onStart?.();
    onTouch?.();
  };

  const bgClass = highContrast 
    ? "bg-black" 
    : "bg-gradient-to-br from-white via-blue-50 to-orange-50";
  
  const textClass = highContrast ? "text-white" : "text-text-primary";

  return (
    <div 
      className={`min-h-screen flex flex-col ${bgClass} cursor-pointer`}
      onClick={handleStart}
    >
      {/* Header Controls */}
      <header className="p-6 flex justify-between items-center">
        {/* Language Toggle */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            flex items-center gap-3 px-6 py-3 rounded-2xl
            ${highContrast ? "bg-white/10 text-white" : "bg-white/80 text-primary shadow-md"}
          `}
        >
          <Globe size={32} />
          <span className="text-[24px] font-semibold uppercase">{language}</span>
        </motion.button>

        {/* Voice Toggle */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            setVoiceEnabled(!voiceEnabled);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            w-[80px] h-[80px] rounded-2xl flex items-center justify-center
            transition-colors duration-200
            ${voiceEnabled 
              ? "bg-accent text-white" 
              : highContrast 
                ? "bg-white/10 text-white" 
                : "bg-white/80 text-text-secondary shadow-md"
            }
          `}
          aria-label={voiceEnabled ? "Disable voice" : "Enable voice"}
        >
          {voiceEnabled ? <Volume2 size={36} /> : <VolumeX size={36} />}
        </motion.button>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Logo / Branding */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          {/* Indian Flag Colors Bar */}
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-20 h-2 rounded-full bg-[#FF9933]" />
            <div className="w-20 h-2 rounded-full bg-white border border-gray-200" />
            <div className="w-20 h-2 rounded-full bg-[#138808]" />
          </div>

          {/* Main Title */}
          <h1 
            className={`font-bold mb-4 ${textClass}`}
            style={{ fontSize: 96 * fontScale, lineHeight: 1.1 }}
          >
            <span className="text-primary">SUVIDHA</span>{" "}
            <span className="text-accent">ONE</span>
          </h1>

          {/* Taglines */}
          <p 
            className={`font-semibold mb-2 ${highContrast ? "text-white" : "text-primary"}`}
            style={{ fontSize: 48 * fontScale }}
          >
            {t("welcome_subtitle", language)}
          </p>
          <p 
            className={`${highContrast ? "text-gray-300" : "text-text-secondary"}`}
            style={{ fontSize: 40 * fontScale }}
          >
            "सुविधा सबके लिए"
          </p>
        </motion.div>

        {/* Touch to Start CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="relative"
        >
          {/* Pulse animation ring */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`
              absolute inset-0 rounded-3xl
              ${highContrast ? "bg-accent" : "bg-accent/30"}
            `}
          />
          
          {/* CTA Button */}
          <div 
            className={`
              relative px-16 py-8 rounded-3xl
              ${highContrast 
                ? "bg-accent text-white" 
                : "bg-accent text-white shadow-xl shadow-accent/30"
              }
            `}
          >
            <p 
              className="font-bold text-center"
              style={{ fontSize: 56 * fontScale }}
            >
              {t("touch_to_start", language)}
            </p>
            <p 
              className="text-center mt-2 opacity-80"
              style={{ fontSize: 32 * fontScale }}
            >
              👆 Tap anywhere
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className={`p-8 text-center ${highContrast ? "text-gray-400" : "text-text-secondary"}`}>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <span style={{ fontSize: 24 * fontScale }}>Digital India</span>
          <span className="w-1 h-4 bg-gray-300" />
          <span style={{ fontSize: 24 * fontScale }}>Smart City Mission</span>
          <span className="w-1 h-4 bg-gray-300" />
          <span style={{ fontSize: 24 * fontScale }}>Ek Bharat Shreshtha Bharat</span>
        </div>
      </footer>
    </div>
  );
}

export default WelcomeScreen;
