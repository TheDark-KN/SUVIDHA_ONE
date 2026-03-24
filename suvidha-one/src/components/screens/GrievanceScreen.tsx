"use client";

/**
 * Grievance Screen - SCREEN-09
 * 
 * Based on Wireframe_Specification.md:
 * - Category selection grid
 * - Form with description input
 * - Submit with tracking ID generation
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Zap, Droplets, Trash2, Shield, HelpCircle,
  Camera, Send, CheckCircle
} from "lucide-react";
import { useAppStore } from "@/store";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

type GrievanceState = "category" | "form" | "submitted";
type GrievanceCategory = "electricity" | "water" | "sanitation" | "safety" | "other";

export interface GrievanceScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

const categories: { id: GrievanceCategory; icon: React.ReactNode; label: string; labelHindi: string }[] = [
  { id: "electricity", icon: <Zap size={48} />, label: "Electricity", labelHindi: "बिजली" },
  { id: "water", icon: <Droplets size={48} />, label: "Water", labelHindi: "पानी" },
  { id: "sanitation", icon: <Trash2 size={48} />, label: "Sanitation", labelHindi: "स्वच्छता" },
  { id: "safety", icon: <Shield size={48} />, label: "Safety", labelHindi: "सुरक्षा" },
  { id: "other", icon: <HelpCircle size={48} />, label: "Other", labelHindi: "अन्य" },
];

export function GrievanceScreen({ onBack, onComplete }: GrievanceScreenProps) {
  const { language, fontScale, highContrast } = useAppStore();

  const [state, setState] = useState<GrievanceState>("category");
  const [selectedCategory, setSelectedCategory] = useState<GrievanceCategory | null>(null);
  const [description, setDescription] = useState("");
  const [ticketId, setTicketId] = useState("");

  const bgClass = highContrast ? "bg-black" : "bg-[#F5F5F5]";
  const cardBg = highContrast ? "bg-white/10" : "bg-white";
  const textClass = highContrast ? "text-white" : "text-text-primary";
  const subtextClass = highContrast ? "text-gray-300" : "text-text-secondary";

  const handleCategorySelect = (category: GrievanceCategory) => {
    setSelectedCategory(category);
    setState("form");
  };

  const handleSubmit = async () => {
    // Generate ticket ID
    const id = "GRV" + Date.now().toString().slice(-8);
    setTicketId(id);
    setState("submitted");
  };

  return (
    <div className={`min-h-screen flex flex-col ${bgClass}`}>
      {/* Header */}
      <header className={`p-6 flex items-center justify-between ${cardBg} shadow-sm`}>
        <motion.button
          onClick={state === "form" ? () => setState("category") : onBack}
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
          style={{ fontSize: 36 * fontScale }}
        >
          {t("grievance", language)} / शिकायत
        </h1>

        <div className="w-[80px]" />
      </header>

      <main className="flex-1 flex items-center justify-center px-8">
        <AnimatePresence mode="wait">
          {/* Category Selection */}
          {state === "category" && (
            <motion.div
              key="category"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <p 
                className={`text-center mb-8 ${textClass}`}
                style={{ fontSize: 32 * fontScale }}
              >
                Select Category / श्रेणी चुनें
              </p>

              <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
                {categories.map((cat, index) => (
                  <motion.button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      ${cardBg} rounded-2xl p-6 flex flex-col items-center justify-center
                      min-h-[180px] shadow-md transition-all
                      hover:shadow-lg
                    `}
                  >
                    <div className="w-[80px] h-[80px] rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <div className="text-primary">{cat.icon}</div>
                    </div>
                    <p 
                      className={`font-semibold ${textClass}`}
                      style={{ fontSize: 24 * fontScale }}
                    >
                      {cat.label}
                    </p>
                    <p 
                      className={subtextClass}
                      style={{ fontSize: 20 * fontScale }}
                    >
                      {cat.labelHindi}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Form */}
          {state === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl"
            >
              <div className={`${cardBg} rounded-2xl p-8 shadow-md`}>
                <p 
                  className={`mb-6 ${subtextClass}`}
                  style={{ fontSize: 24 * fontScale }}
                >
                  Category: {categories.find(c => c.id === selectedCategory)?.label}
                </p>

                <Textarea
                  label={t("describe_issue", language)}
                  placeholder="Describe your issue in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                />

                <Button
                  variant="secondary"
                  size="md"
                  className="mt-4"
                  icon={<Camera size={24} />}
                >
                  Attach Photo (Optional)
                </Button>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={description.length < 10}
                fullWidth
                size="xl"
                className="mt-8"
                icon={<Send size={32} />}
              >
                {t("submit", language)}
              </Button>
            </motion.div>
          )}

          {/* Submitted */}
          {state === "submitted" && (
            <motion.div
              key="submitted"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle size={150} className="mx-auto text-success mb-8" />
              </motion.div>

              <h2 
                className="font-bold text-success mb-4"
                style={{ fontSize: 48 * fontScale }}
              >
                Grievance Submitted!
              </h2>

              <p 
                className={`font-bold ${textClass} mb-4`}
                style={{ fontSize: 40 * fontScale }}
              >
                Ticket ID: {ticketId}
              </p>

              <p 
                className={subtextClass}
                style={{ fontSize: 24 * fontScale }}
              >
                You will receive updates via SMS
              </p>

              <Button
                onClick={onComplete}
                fullWidth
                size="xl"
                className="mt-12 max-w-md mx-auto"
              >
                {t("return_home", language)}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default GrievanceScreen;
