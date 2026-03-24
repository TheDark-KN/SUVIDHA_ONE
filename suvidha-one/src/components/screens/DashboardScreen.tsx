"use client";

/**
 * Dashboard Screen - SCREEN-04
 * 
 * Based on Wireframe_Specification.md:
 * - User greeting with pending bills summary
 * - Service grid 3x2 (32") or 4x2 (55")
 * - Bottom navigation
 */

import { motion } from "framer-motion";
import { 
  Zap, Droplets, Flame, Building, FileText, CreditCard, 
  MessageSquare, MoreHorizontal, User, AlertCircle
} from "lucide-react";
import { useAppStore } from "@/store";
import { t } from "@/lib/i18n";
import { KioskLayout, ServiceGrid } from "@/components/layout/KioskLayout";
import { ServiceTile } from "@/components/ui/Card";

type Service = "electricity" | "water" | "gas" | "municipal" | "certificates" | "bills" | "grievance" | "more";

export interface DashboardScreenProps {
  onServiceSelect: (service: Service) => void;
  onNavChange: (nav: "home" | "history" | "help" | "settings") => void;
}

const services: {
  id: Service;
  nameKey: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { id: "electricity", nameKey: "electricity", icon: <Zap size={60} />, color: "#FF6600" },
  { id: "water", nameKey: "water", icon: <Droplets size={60} />, color: "#1A6FBF" },
  { id: "gas", nameKey: "gas", icon: <Flame size={60} />, color: "#E74C3C" },
  { id: "municipal", nameKey: "municipal", icon: <Building size={60} />, color: "#217346" },
  { id: "certificates", nameKey: "certificates", icon: <FileText size={60} />, color: "#5C2D91" },
  { id: "bills", nameKey: "bill_payment", icon: <CreditCard size={60} />, color: "#1A3C8F" },
  { id: "grievance", nameKey: "grievance", icon: <MessageSquare size={60} />, color: "#C0392B" },
  { id: "more", nameKey: "more_services", icon: <MoreHorizontal size={60} />, color: "#666666" },
];

export function DashboardScreen({ onServiceSelect, onNavChange }: DashboardScreenProps) {
  const { 
    language, 
    fontScale, 
    highContrast,
    user,
    bills,
  } = useAppStore();

  // Calculate pending bills
  const pendingBills = bills.filter(b => b.status === "pending");
  const totalDue = pendingBills.reduce((sum, b) => sum + b.amount, 0);

  const bgClass = highContrast ? "bg-black" : "bg-[#F5F5F5]";
  const cardBg = highContrast ? "bg-white/10" : "bg-white";
  const textClass = highContrast ? "text-white" : "text-text-primary";
  const subtextClass = highContrast ? "text-gray-300" : "text-text-secondary";

  return (
    <KioskLayout
      showHeader={false}
      showNav={true}
      activeNav="home"
      onNavChange={onNavChange}
      bgColor={highContrast ? "white" : "light"}
    >
      <div className={`min-h-full ${bgClass} px-8 py-6`}>
        {/* User Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${cardBg} rounded-2xl p-6 mb-8 flex items-center justify-between shadow-md`}
        >
          <div>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 32 * fontScale }}>👋</span>
              <h1 
                className={`font-bold ${textClass}`}
                style={{ fontSize: 40 * fontScale }}
              >
                {t("welcome_user", language)}, {user?.name || "Guest"}
              </h1>
            </div>
            {pendingBills.length > 0 && (
              <p 
                className={`mt-2 flex items-center gap-2 ${subtextClass}`}
                style={{ fontSize: 28 * fontScale }}
              >
                <AlertCircle size={24} className="text-accent" />
                {t("pending_bills", language)}: {pendingBills.length} | {t("due_amount", language)}: ₹{totalDue.toLocaleString()}
              </p>
            )}
          </div>

          {/* Profile Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              w-[60px] h-[60px] rounded-full flex items-center justify-center
              ${highContrast ? "bg-white/20" : "bg-primary/10"}
            `}
          >
            <User size={32} className="text-primary" />
          </motion.button>
        </motion.div>

        {/* Service Grid */}
        <ServiceGrid columns={4}>
          {services.map((service, index) => {
            // Get pending count for this service type
            const servicePendingBills = bills.filter(
              b => b.status === "pending" && 
              ((service.id === "electricity" && b.utilityType === "electricity") ||
               (service.id === "water" && b.utilityType === "water") ||
               (service.id === "gas" && b.utilityType === "gas"))
            );
            const serviceDue = servicePendingBills.reduce((sum, b) => sum + b.amount, 0);

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ServiceTile
                  icon={service.icon}
                  iconBgColor={service.color}
                  name={t(service.nameKey, "en")}
                  nameHindi={t(service.nameKey, "hi")}
                  badge={serviceDue > 0 ? {
                    text: `₹${serviceDue.toLocaleString()} Due`,
                    variant: "due"
                  } : undefined}
                  onClick={() => onServiceSelect(service.id)}
                />
              </motion.div>
            );
          })}
        </ServiceGrid>
      </div>
    </KioskLayout>
  );
}

export default DashboardScreen;
