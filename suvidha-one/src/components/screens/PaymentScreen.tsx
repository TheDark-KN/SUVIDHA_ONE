"use client";

/**
 * Payment Screen - SCREEN-06, 07, 08
 * 
 * Based on Wireframe_Specification.md:
 * - Payment method selection
 * - Processing state
 * - Success/failure state
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Smartphone, CreditCard, Building, Banknote,
  CheckCircle, XCircle, Printer, MessageSquare, Send, Home
} from "lucide-react";
import { useAppStore } from "@/store";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { PaymentOption } from "@/components/ui/Card";
import { Spinner } from "@/components/layout/KioskLayout";

type PaymentState = "select" | "processing" | "success" | "failed";
type PaymentMethod = "upi" | "card" | "netbanking" | "cash";

export interface PaymentScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

export function PaymentScreen({ onBack, onComplete }: PaymentScreenProps) {
  const { 
    language, 
    fontScale, 
    highContrast,
    bills,
    selectedBills,
    setCurrentTransaction,
  } = useAppStore();

  const [state, setState] = useState<PaymentState>("select");
  const [, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [transactionId, setTransactionId] = useState("");

  const selectedBillObjects = bills.filter(b => selectedBills.includes(b.id));
  const totalAmount = selectedBillObjects.reduce((sum, b) => sum + b.amount, 0);

  const bgClass = highContrast ? "bg-black" : "bg-[#F5F5F5]";
  const cardBg = highContrast ? "bg-white/10" : "bg-white";
  const textClass = highContrast ? "text-white" : "text-text-primary";
  const subtextClass = highContrast ? "text-gray-300" : "text-text-secondary";

  const handleSelectMethod = async (method: PaymentMethod) => {
    setSelectedMethod(method);
    setState("processing");

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate transaction ID
    const txnId = "TXN" + Date.now().toString().slice(-10);
    setTransactionId(txnId);
    
    // 90% success rate for demo
    if (Math.random() > 0.1) {
      setCurrentTransaction({
        id: txnId,
        amount: totalAmount,
        status: "success"
      });
      setState("success");
    } else {
      setCurrentTransaction({
        id: txnId,
        amount: totalAmount,
        status: "failed"
      });
      setState("failed");
    }
  };

  const paymentMethods = [
    { id: "upi" as PaymentMethod, icon: <Smartphone size={48} />, title: "UPI / QR Code", titleHindi: "यूपीआई / क्यूआर कोड", description: "Scan & Pay instantly" },
    { id: "card" as PaymentMethod, icon: <CreditCard size={48} />, title: "Debit / Credit Card", titleHindi: "डेबिट / क्रेडिट कार्ड", description: "Visa, Mastercard, RuPay" },
    { id: "netbanking" as PaymentMethod, icon: <Building size={48} />, title: "Net Banking", titleHindi: "नेट बैंकिंग", description: "All major banks supported" },
    { id: "cash" as PaymentMethod, icon: <Banknote size={48} />, title: "Cash", titleHindi: "नकद", description: "Pay at counter" },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${bgClass}`}>
      {/* Header - only show in select state */}
      {state === "select" && (
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

          <div className="text-center">
            <h1 
              className={`font-bold ${textClass}`}
              style={{ fontSize: 36 * fontScale }}
            >
              {t("select_payment", language)}
            </h1>
            <p 
              className={`font-bold ${textClass}`}
              style={{ fontSize: 48 * fontScale }}
            >
              ₹{totalAmount.toLocaleString()}
            </p>
          </div>

          <div className="w-[80px]" />
        </header>
      )}

      <main className="flex-1 flex items-center justify-center px-8">
        <AnimatePresence mode="wait">
          {/* Payment Method Selection */}
          {state === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl space-y-4"
            >
              {paymentMethods.map((method, index) => (
                <motion.div
                  key={method.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PaymentOption
                    icon={method.icon}
                    title={method.title}
                    titleHindi={method.titleHindi}
                    description={method.description}
                    onClick={() => handleSelectMethod(method.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Processing */}
          {state === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <Spinner 
                size="xl" 
                color="accent" 
                text={t("processing", language)}
                textHindi={t("please_wait", "hi")}
              />
              <p 
                className={`mt-8 font-bold ${textClass}`}
                style={{ fontSize: 56 * fontScale }}
              >
                ₹{totalAmount.toLocaleString()}
              </p>
              
              <Button
                variant="ghost"
                onClick={() => setState("select")}
                className="mt-12"
                size="sm"
              >
                {t("cancel", language)}
              </Button>
            </motion.div>
          )}

          {/* Success */}
          {state === "success" && (
            <motion.div
              key="success"
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
                {t("payment_success", language)}
              </h2>

              <p 
                className={`font-bold ${textClass} mb-2`}
                style={{ fontSize: 56 * fontScale }}
              >
                ₹{totalAmount.toLocaleString()}
              </p>

              <p 
                className={subtextClass}
                style={{ fontSize: 24 * fontScale }}
              >
                {t("transaction_id", language)}: {transactionId}
              </p>
              <p 
                className={subtextClass}
                style={{ fontSize: 24 * fontScale }}
              >
                {new Date().toLocaleDateString("en-IN")} | {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>

              {/* Receipt Options */}
              <div className="flex items-center justify-center gap-6 mt-12">
                <Button variant="secondary" size="md" icon={<Printer size={28} />}>
                  {t("print_receipt", language)}
                </Button>
                <Button variant="secondary" size="md" icon={<MessageSquare size={28} />}>
                  SMS
                </Button>
                <Button variant="secondary" size="md" icon={<Send size={28} />}>
                  WhatsApp
                </Button>
              </div>

              <Button
                onClick={onComplete}
                fullWidth
                size="xl"
                className="mt-12 max-w-md mx-auto"
                icon={<Home size={32} />}
              >
                {t("return_home", language)}
              </Button>
            </motion.div>
          )}

          {/* Failed */}
          {state === "failed" && (
            <motion.div
              key="failed"
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
                <XCircle size={150} className="mx-auto text-error mb-8" />
              </motion.div>

              <h2 
                className="font-bold text-error mb-4"
                style={{ fontSize: 48 * fontScale }}
              >
                Payment Failed
              </h2>

              <p 
                className={subtextClass}
                style={{ fontSize: 28 * fontScale }}
              >
                Something went wrong. Please try again.
              </p>

              <div className="flex items-center justify-center gap-6 mt-12">
                <Button
                  variant="secondary"
                  onClick={onComplete}
                  size="lg"
                >
                  {t("cancel", language)}
                </Button>
                <Button
                  onClick={() => setState("select")}
                  size="lg"
                >
                  {t("retry", language)}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default PaymentScreen;
