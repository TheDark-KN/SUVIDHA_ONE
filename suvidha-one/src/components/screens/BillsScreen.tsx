"use client";

/**
 * Bill Payment Screen - SCREEN-05
 * 
 * Based on Wireframe_Specification.md:
 * - Bill cards with checkbox
 * - Cart with total
 * - Proceed to pay button
 */

import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, CheckSquare } from "lucide-react";
import { useAppStore } from "@/store";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { BillCard } from "@/components/ui/Card";

export interface BillsScreenProps {
  onBack: () => void;
  onProceed: () => void;
}

export function BillsScreen({ onBack, onProceed }: BillsScreenProps) {
  const { 
    language, 
    fontScale, 
    highContrast,
    bills,
    selectedBills,
    toggleBillSelection,
    selectAllBills,
  } = useAppStore();

  const selectedBillObjects = bills.filter(b => selectedBills.includes(b.id));
  const totalAmount = selectedBillObjects.reduce((sum, b) => sum + b.amount, 0);

  const bgClass = highContrast ? "bg-black" : "bg-[#F5F5F5]";
  const cardBg = highContrast ? "bg-white/10" : "bg-white";
  const textClass = highContrast ? "text-white" : "text-text-primary";
  const subtextClass = highContrast ? "text-gray-300" : "text-text-secondary";

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
          style={{ fontSize: 36 * fontScale }}
        >
          {t("bill_payment", language)} / बिल भुगतान
        </h1>

        <div className="flex items-center gap-2">
          <ShoppingCart size={28} className="text-accent" />
          <span 
            className="bg-accent text-white px-3 py-1 rounded-full font-bold"
            style={{ fontSize: 24 * fontScale }}
          >
            {selectedBills.length}
          </span>
        </div>
      </header>

      {/* Bill List */}
      <main className="flex-1 px-8 py-6 space-y-4 overflow-y-auto">
        {bills.filter(b => b.status === "pending").map((bill, index) => (
          <motion.div
            key={bill.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <BillCard
              provider={bill.provider}
              consumerNumber={bill.consumerNumber}
              amount={bill.amount}
              dueDate={bill.dueDate}
              period={bill.period}
              selected={selectedBills.includes(bill.id)}
              onSelect={() => toggleBillSelection(bill.id)}
              overdue={new Date(bill.dueDate) < new Date()}
            />
          </motion.div>
        ))}
      </main>

      {/* Summary Footer */}
      <div className={`p-6 ${cardBg} border-t border-[#E0E0E0]`}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p 
                className={subtextClass}
                style={{ fontSize: 28 * fontScale }}
              >
                Selected Bills: {selectedBills.length}
              </p>
              <p 
                className={`font-bold ${textClass}`}
                style={{ fontSize: 40 * fontScale }}
              >
                Total: ₹{totalAmount.toLocaleString()}
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={selectAllBills}
              icon={<CheckSquare size={28} />}
              size="md"
            >
              {t("select_all", language)}
            </Button>
          </div>

          <Button
            onClick={onProceed}
            disabled={selectedBills.length === 0}
            fullWidth
            size="xl"
          >
            {t("proceed_to_pay", language)} →
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BillsScreen;
