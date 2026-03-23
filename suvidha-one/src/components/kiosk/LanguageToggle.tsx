"use client";

import { motion } from "framer-motion";
import { KioskButton } from "./KioskButton";
import type { Language } from "@/types";

interface LanguageToggleProps {
  currentLanguage: Language;
  onToggle: () => void;
  highContrast?: boolean;
}

export function LanguageToggle({
  currentLanguage,
  onToggle,
  highContrast = false,
}: LanguageToggleProps) {
  const isHindi = currentLanguage === "hi";
  return (
    <KioskButton
      onClick={onToggle}
      variant="ghost"
      size="large"
      ariaLabel="Toggle Language"
      className="!min-h-[100px] !min-w-[100px]"
    >
      <div className="relative w-20 h-20">
        {/* India flag emoji for Hindi */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: isHindi ? 1 : 0.3,
            scale: isHindi ? 1 : 0.8,
            x: isHindi ? 0 : -30,
          }}
          className="absolute inset-0 flex items-center justify-center text-5xl"
        >
          🇮🇳
        </motion.div>

        {/* US/UK flag emoji for English */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: !isHindi ? 1 : 0.3,
            scale: !isHindi ? 1 : 0.8,
            x: !isHindi ? 0 : 30,
          }}
          className="absolute inset-0 flex items-center justify-center text-5xl"
        >
          🇬🇧
        </motion.div>

        {/* Active indicator */}
        <motion.div
          initial={false}
          animate={{
            x: isHindi ? -20 : 20,
          }}
          className={`absolute -bottom-2 left-1/2 w-4 h-4 rounded-full ${
            highContrast ? "bg-yellow-400" : "bg-primary"
          }`}
        />
      </div>
    </KioskButton>
  );
}
