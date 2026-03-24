"use client";

/**
 * Payment Screen - SCREEN-06, 07, 08
 * 
 * Based on Wireframe_Specification.md:
 * - Payment method selection
 * - Processing state
 * - Success/failure state
 * 
 * Integrated with Razorpay for real payments
 */

import { useState, useEffect } from "react";
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

// Razorpay type declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}

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
  const [paymentId, setPaymentId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const selectedBillObjects = bills.filter(b => selectedBills.includes(b.id));
  const totalAmount = selectedBillObjects.reduce((sum, b) => sum + b.amount, 0);

  const bgClass = highContrast ? "bg-black" : "bg-[#F5F5F5]";
  const cardBg = highContrast ? "bg-white/10" : "bg-white";
  const textClass = highContrast ? "text-white" : "text-text-primary";
  const subtextClass = highContrast ? "text-gray-300" : "text-text-secondary";

  // Load Razorpay script on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  // Create order via API route (avoids CORS issues)
  const createOrder = async (): Promise<{ orderId: string; keyId: string } | null> => {
    try {
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: totalAmount,
          bills: selectedBills.join(","),
          customerName: "Citizen",
          customerPhone: "9999999999",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create order");
      }

      const data = await response.json();
      return {
        orderId: data.orderId,
        keyId: data.keyId,
      };
    } catch (err) {
      console.error("Order creation error:", err);
      return null;
    }
  };

  // Open Razorpay checkout
  const openRazorpayCheckout = (orderId: string, keyId: string, method?: PaymentMethod) => {
    const options = {
      key: keyId,
      amount: totalAmount * 100,
      currency: "INR",
      order_id: orderId,
      name: "SUVIDHA ONE",
      description: `Bill Payment - ${selectedBills.length} bill(s)`,
      handler: function (response: any) {
        // Payment successful
        const txnId = response.razorpay_payment_id;
        setTransactionId(response.razorpay_order_id);
        setPaymentId(txnId);
        setCurrentTransaction({
          id: txnId,
          amount: totalAmount,
          status: "success"
        });
        setState("success");
      },
      prefill: {
        name: "Citizen",
        email: "citizen@suvidhaone.gov.in",
        contact: "9999999999",
      },
      theme: {
        color: "#FF6600",
      },
      modal: {
        ondismiss: function () {
          setState("select");
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setErrorMessage(response.error.description || "Payment failed");
        setCurrentTransaction({
          id: orderId,
          amount: totalAmount,
          status: "failed"
        });
        setState("failed");
      });
      rzp.open();
    } catch (err) {
      setErrorMessage("Failed to open payment window");
      setState("failed");
    }
  };

  const handleSelectMethod = async (method: PaymentMethod) => {
    setSelectedMethod(method);
    setErrorMessage("");
    
    // Handle cash payment differently (no Razorpay)
    if (method === "cash") {
      setState("processing");
      await new Promise(resolve => setTimeout(resolve, 2000));
      const txnId = "CASH" + Date.now().toString().slice(-10);
      setTransactionId(txnId);
      setPaymentId(txnId);
      setCurrentTransaction({
        id: txnId,
        amount: totalAmount,
        status: "success"
      });
      setState("success");
      return;
    }

    // For online payments, use Razorpay
    if (!scriptLoaded) {
      setErrorMessage("Payment system is loading. Please wait...");
      return;
    }

    setState("processing");

    // Create order via API route
    const orderData = await createOrder();
    
    if (!orderData) {
      setErrorMessage("Failed to create payment order. Please try again.");
      setState("failed");
      return;
    }

    // Open Razorpay checkout
    openRazorpayCheckout(orderData.orderId, orderData.keyId, method);
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
              {/* Test Mode Banner */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-xl p-4 text-center"
              >
                <p className="text-orange-800 dark:text-orange-200 font-semibold text-lg">
                  🧪 Test Mode - No real money will be charged
                </p>
                <p className="text-orange-700 dark:text-orange-300 text-sm mt-1">
                  Card: 4111 1111 1111 1111 | Expiry: 12/26 | CVV: 123 | OTP: 1234
                </p>
              </motion.div>

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

              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 max-w-md mx-auto mb-4">
                {paymentId && (
                  <p 
                    className={subtextClass}
                    style={{ fontSize: 20 * fontScale }}
                  >
                    Payment ID: <span className="font-mono">{paymentId}</span>
                  </p>
                )}
                <p 
                  className={subtextClass}
                  style={{ fontSize: 20 * fontScale }}
                >
                  Order ID: <span className="font-mono">{transactionId}</span>
                </p>
              </div>
              
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
                {errorMessage || "Something went wrong. Please try again."}
              </p>

              {/* Test card info for testing */}
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                  🧪 Test Mode - Use these details:
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-mono">
                  Card: 4111 1111 1111 1111<br/>
                  Expiry: 12/26 | CVV: 123 | OTP: 1234
                </p>
              </div>

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
