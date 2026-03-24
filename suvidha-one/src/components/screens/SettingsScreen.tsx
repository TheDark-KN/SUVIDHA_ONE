"use client";

/**
 * Settings Screen - SCREEN-10
 * 
 * Based on Wireframe_Specification.md:
 * - Voice guidance toggle
 * - Font size selector
 * - High contrast toggle
 * - Language change button
 * - Privacy & logout buttons
 */

import { motion } from "framer-motion";
import { 
  ArrowLeft, Volume2, Type, Eye, Globe, Shield, LogOut
} from "lucide-react";
import { useAppStore } from "@/store";
import { t } from "@/lib/i18n";
import { Button, Toggle } from "@/components/ui/Button";

export interface SettingsScreenProps {
  onBack: () => void;
  onLanguageChange: () => void;
  onLogout: () => void;
}

export function SettingsScreen({ onBack, onLanguageChange, onLogout }: SettingsScreenProps) {
  const { 
    language, 
    fontScale, 
    highContrast,
    voiceEnabled,
    setFontScale,
    setHighContrast,
    setVoiceEnabled,
  } = useAppStore();

  const bgClass = highContrast ? "bg-black" : "bg-[#F5F5F5]";
  const cardBg = highContrast ? "bg-white/10" : "bg-white";
  const textClass = highContrast ? "text-white" : "text-text-primary";
  const subtextClass = highContrast ? "text-gray-300" : "text-text-secondary";

  const fontSizeOptions: { label: string; value: number }[] = [
    { label: "A", value: 1 },
    { label: "A+", value: 1.3 },
    { label: "A++", value: 1.5 },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${bgClass}`}>
      {/* Header */}
      <header className={`p-6 flex items-center justify-between ${cardBg} shadow-sm`}>
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            w-[80px] h-[80px] rounded-2xl flex items-center justify-center
            ${highContrast ? "bg-white/10 text-white" : "bg-[#F5F5F5] text-text-primary"}
          `}
        >
          <ArrowLeft size={40} />
        </motion.button>

        <h1 
          className={`font-bold ${textClass}`}
          style={{ fontSize: 40 * fontScale }}
        >
          {t("settings", language)} / सेटिंग्स
        </h1>

        <div className="w-[80px]" />
      </header>

      {/* Settings List */}
      <main className="flex-1 px-8 py-6 space-y-4">
        {/* Voice Guidance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${cardBg} rounded-2xl p-6 flex items-center justify-between shadow-sm`}
        >
          <div className="flex items-center gap-4">
            <div className="w-[64px] h-[64px] rounded-xl bg-primary/10 flex items-center justify-center">
              <Volume2 size={32} className="text-primary" />
            </div>
            <div>
              <p 
                className={`font-semibold ${textClass}`}
                style={{ fontSize: 28 * fontScale }}
              >
                {t("voice_guidance", language)}
              </p>
              <p 
                className={subtextClass}
                style={{ fontSize: 20 * fontScale }}
              >
                {t("voice_guidance_desc", language)}
              </p>
            </div>
          </div>
          <Toggle
            checked={voiceEnabled}
            onChange={setVoiceEnabled}
            size="lg"
          />
        </motion.div>

        {/* Font Size */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`${cardBg} rounded-2xl p-6 shadow-sm`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-[64px] h-[64px] rounded-xl bg-primary/10 flex items-center justify-center">
              <Type size={32} className="text-primary" />
            </div>
            <div>
              <p 
                className={`font-semibold ${textClass}`}
                style={{ fontSize: 28 * fontScale }}
              >
                {t("font_size", language)}
              </p>
              <p 
                className={subtextClass}
                style={{ fontSize: 20 * fontScale }}
              >
                {t("font_size_desc", language)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {fontSizeOptions.map(option => (
              <motion.button
                key={option.value}
                onClick={() => setFontScale(option.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  flex-1 py-4 rounded-xl font-bold transition-colors
                  ${fontScale === option.value 
                    ? "bg-primary text-white" 
                    : highContrast ? "bg-white/10 text-white" : "bg-[#F5F5F5] text-text-primary"
                  }
                `}
                style={{ fontSize: 28 * fontScale }}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* High Contrast */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${cardBg} rounded-2xl p-6 flex items-center justify-between shadow-sm`}
        >
          <div className="flex items-center gap-4">
            <div className="w-[64px] h-[64px] rounded-xl bg-primary/10 flex items-center justify-center">
              <Eye size={32} className="text-primary" />
            </div>
            <div>
              <p 
                className={`font-semibold ${textClass}`}
                style={{ fontSize: 28 * fontScale }}
              >
                {t("high_contrast", language)}
              </p>
              <p 
                className={subtextClass}
                style={{ fontSize: 20 * fontScale }}
              >
                {t("high_contrast_desc", language)}
              </p>
            </div>
          </div>
          <Toggle
            checked={highContrast}
            onChange={setHighContrast}
            size="lg"
          />
        </motion.div>

        {/* Language */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`${cardBg} rounded-2xl p-6 flex items-center justify-between shadow-sm`}
        >
          <div className="flex items-center gap-4">
            <div className="w-[64px] h-[64px] rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe size={32} className="text-primary" />
            </div>
            <div>
              <p 
                className={`font-semibold ${textClass}`}
                style={{ fontSize: 28 * fontScale }}
              >
                {t("language", language)}
              </p>
              <p 
                className={subtextClass}
                style={{ fontSize: 20 * fontScale }}
              >
                Currently: {language.toUpperCase()}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={onLanguageChange}
            size="md"
          >
            {t("change", language)}
          </Button>
        </motion.div>

        {/* Privacy Policy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${cardBg} rounded-2xl p-6 flex items-center justify-between shadow-sm`}
        >
          <div className="flex items-center gap-4">
            <div className="w-[64px] h-[64px] rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield size={32} className="text-primary" />
            </div>
            <div>
              <p 
                className={`font-semibold ${textClass}`}
                style={{ fontSize: 28 * fontScale }}
              >
                Privacy Policy
              </p>
              <p 
                className={subtextClass}
                style={{ fontSize: 20 * fontScale }}
              >
                View data & privacy info
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="md"
          >
            View
          </Button>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={`${cardBg} rounded-2xl p-6 flex items-center justify-between shadow-sm`}
        >
          <div className="flex items-center gap-4">
            <div className="w-[64px] h-[64px] rounded-xl bg-error/10 flex items-center justify-center">
              <LogOut size={32} className="text-error" />
            </div>
            <div>
              <p 
                className={`font-semibold ${textClass}`}
                style={{ fontSize: 28 * fontScale }}
              >
                {t("logout", language)}
              </p>
              <p 
                className={subtextClass}
                style={{ fontSize: 20 * fontScale }}
              >
                End session & return to welcome
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            onClick={onLogout}
            size="md"
          >
            {t("logout", language)}
          </Button>
        </motion.div>
      </main>
    </div>
  );
}

export default SettingsScreen;
