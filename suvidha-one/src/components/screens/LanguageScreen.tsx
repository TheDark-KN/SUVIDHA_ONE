"use client";

/**
 * Language Selection Screen - SCREEN-02
 * 
 * Based on Wireframe_Specification.md:
 * - 4x2 grid of language cards
 * - Card Size: 280x200px minimum
 * - Selected state with saffron border
 */

import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useAppStore } from "@/store";
import { SUPPORTED_LANGUAGES, t, LanguageCode } from "@/lib/i18n";

export interface LanguageScreenProps {
  onBack?: () => void;
  onSelect: (language?: LanguageCode) => void;
}

export function LanguageScreen({ onBack, onSelect }: LanguageScreenProps) {
  const { language, setLanguage, fontScale, highContrast } = useAppStore();

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    onSelect(code);
  };

  const handleBack = () => {
    onBack?.();
  };

  const bgClass = highContrast 
    ? "bg-black" 
    : "bg-gradient-to-br from-white via-blue-50 to-orange-50";

  return (
    <div className={`min-h-screen flex flex-col ${bgClass}`}>
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <motion.button
          onClick={handleBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            w-[80px] h-[80px] rounded-2xl flex items-center justify-center
            ${highContrast ? "bg-white/10 text-white" : "bg-white shadow-md text-text-primary"}
          `}
        >
          <ArrowLeft size={40} />
        </motion.button>

        <h1 
          className={`font-bold ${highContrast ? "text-white" : "text-text-primary"}`}
          style={{ fontSize: 36 * fontScale }}
        >
          Language / भाषा
        </h1>

        <div className="w-[80px]" /> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 py-6">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 
            className={`font-bold mb-2 ${highContrast ? "text-white" : "text-text-primary"}`}
            style={{ fontSize: 60 * fontScale }}
          >
            {t("select_language", "en")}
          </h2>
          <p 
            className={`${highContrast ? "text-gray-300" : "text-text-secondary"}`}
            style={{ fontSize: 48 * fontScale }}
          >
            अपनी भाषा चुनें
          </p>
        </div>

        {/* Language Grid - 4x2 with overflow for more */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {SUPPORTED_LANGUAGES.map((lang, index) => {
            const isSelected = language === lang.code;
            
            return (
              <motion.button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative p-8 rounded-2xl
                  flex flex-col items-center justify-center gap-3
                  min-h-[200px]
                  transition-all duration-200
                  ${isSelected 
                    ? "border-4 border-accent shadow-xl shadow-accent/20" 
                    : highContrast
                      ? "bg-white/5 border-2 border-white/20 hover:border-white/40"
                      : "bg-white border-2 border-[#E0E0E0] hover:border-primary/30 shadow-md"
                  }
                `}
              >
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-10 h-10 bg-success rounded-full flex items-center justify-center">
                    <Check className="text-white" size={24} />
                  </div>
                )}

                {/* Native Name */}
                <span 
                  className={`font-bold ${highContrast ? "text-white" : "text-text-primary"}`}
                  style={{ fontSize: 40 * fontScale }}
                >
                  {lang.native}
                </span>
                
                {/* English Name */}
                <span 
                  className={`${highContrast ? "text-gray-300" : "text-text-secondary"}`}
                  style={{ fontSize: 28 * fontScale }}
                >
                  {lang.name}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Default Language Indicator */}
        <div className="text-center mt-12">
          <p 
            className={`${highContrast ? "text-gray-400" : "text-text-secondary"}`}
            style={{ fontSize: 24 * fontScale }}
          >
            Current: {SUPPORTED_LANGUAGES.find(l => l.code === language)?.native} ({language.toUpperCase()})
          </p>
        </div>
      </main>
    </div>
  );
}

export default LanguageScreen;
