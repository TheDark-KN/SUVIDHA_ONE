"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { useTranslation } from "./useTranslation";
import { Loader2, CheckCircle, XCircle, Download, Share2, History, Home, Printer, MessageCircle } from "lucide-react";
import { useRazorpay } from "@/hooks/useRazorpay";

export function PaymentProcessingScreen() {
  const { bills, selectedBills, setCurrentScreen, setCurrentTransaction, paymentMode, fontScale } = useAppStore();
  const { t } = useTranslation();
  const highContrast = useAppStore((state) => state.highContrast);
  const [status, setStatus] = useState<"processing" | "success" | "failed" | "initializing">("initializing");
  const [progress, setProgress] = useState(0);
  const { openPaymentModal } = useRazorpay();

  const bgColor = highContrast ? "bg-black" : "bg-gradient-to-br from-slate-50 via-white to-blue-50";
  const textColor = highContrast ? "text-white" : "text-text-primary";
  const subTextColor = highContrast ? "text-gray-400" : "text-text-secondary";

  const selectedTotal = bills
    .filter(b => selectedBills.includes(b.id))
    .reduce((sum, b) => sum + b.amount, 0);

  const convenienceFee = Math.round(selectedTotal * 0.02);
  const grandTotal = selectedTotal + convenienceFee;

  useEffect(() => {
    const initiatePayment = async () => {
      try {
        setProgress(30);
        
        // Create order on backend
        const response = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: grandTotal,
            description: `Bill Payment - ${selectedBills.length} bills`,
            customerName: "SUVIDHA User",
            customerEmail: "user@suvidha.local",
            customerPhone: "9876543210",
            service_type: "bill_payment",
            kiosk_id: "WEB",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to create payment order");
        }

        const orderData = await response.json();
        setProgress(60);

        // Open Razorpay payment modal
        openPaymentModal({
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          orderId: orderData.orderId,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          description: `Bill Payment - ${selectedBills.length} bills`,
          onSuccess: (paymentResponse) => {
            setStatus("success");
            setCurrentTransaction({
              id: paymentResponse.paymentId,
              amount: grandTotal,
              status: "success"
            });
          },
          onError: (error) => {
            console.error("Payment error:", error);
            setStatus("failed");
            setCurrentTransaction({
              id: `TXN${Date.now()}`,
              amount: grandTotal,
              status: "failed"
            });
          },
        });
      } catch (error) {
        console.error("Payment initiation error:", error);
        setStatus("failed");
      }
    };

    initiatePayment();
  }, [grandTotal, selectedBills.length, openPaymentModal, setCurrentTransaction]);

  if (status === "success") {
    return <PaymentSuccessScreen />;
  }

  if (status === "failed") {
    return <PaymentFailedScreen />;
  }

  return (
    <div className={`${bgColor} min-h-screen flex flex-col items-center justify-center p-8`}>
      {/* Processing Animation */}
      <div className="relative mb-8">
        {/* Outer ring */}
        <div className={`w-40 h-40 rounded-full border-8 ${highContrast ? "border-gray-700" : "border-gray-200"} flex items-center justify-center`}>
          {/* Inner spinning ring */}
          <div className="absolute inset-0 w-40 h-40 rounded-full border-8 border-transparent border-t-accent border-r-accent animate-spin" />
        </div>
        {/* Center icon */}
        <div className={`absolute inset-0 w-40 h-40 rounded-full flex items-center justify-center ${
          highContrast ? "bg-gray-800" : "bg-white"
        }`}>
          <IndianRupee size={48} className={highContrast ? "text-yellow-400" : "text-accent"} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className={`w-full max-w-md h-3 rounded-full ${highContrast ? "bg-gray-800" : "bg-gray-200"} mb-6 overflow-hidden`}>
        <div 
          className="h-full bg-gradient-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status Text */}
      <h1 className={`${textColor} font-bold mb-4 text-center`} style={{ fontSize: 40 * fontScale }}>
        {t("processingPayment")}
      </h1>
      <p className={`${subTextColor} text-center mb-4`} style={{ fontSize: 28 * fontScale }}>
        {t("pleaseWait")}...
      </p>

      {/* Amount */}
      <div className={`${highContrast ? "bg-gray-800" : "bg-white"} rounded-2xl p-6 shadow-lg mb-8`}>
        <p className={`${subTextColor} text-center mb-2`} style={{ fontSize: 20 * fontScale }}>
          Processing Amount
        </p>
        <p className={`text-gradient font-extrabold text-center`} style={{ fontSize: 56 * fontScale }}>
          ₹{grandTotal.toLocaleString()}
        </p>
      </div>

      {/* Payment Method */}
      <div className="flex items-center gap-3 mb-8">
        <span className={subTextColor} style={{ fontSize: 22 * fontScale }}>
          Payment via:
        </span>
        <span className={`${highContrast ? "bg-yellow-600" : "bg-accent"} text-white px-4 py-2 rounded-lg font-bold`}>
          RAZORPAY
        </span>
      </div>

      {/* Cancel Button */}
      <button
        onClick={() => setCurrentScreen("bills")}
        className={`${subTextColor} underline hover:text-primary transition-colors`}
        style={{ fontSize: 24 * fontScale }}
      >
        {t("cancel")}
      </button>

      {/* Security Note */}
      <p className={`mt-8 ${subTextColor} text-center`} style={{ fontSize: 18 * fontScale }}>
        🔒 Your payment is secured with 256-bit SSL encryption
      </p>
    </div>
  );
}

export function PaymentSuccessScreen() {
  const { bills, selectedBills, setCurrentScreen, currentTransaction, fontScale, logout } = useAppStore();
  const { t } = useTranslation();
  const highContrast = useAppStore((state) => state.highContrast);

  const bgColor = highContrast ? "bg-black" : "bg-gradient-to-br from-green-50 via-white to-blue-50";
  const textColor = highContrast ? "text-white" : "text-text-primary";
  const subTextColor = highContrast ? "text-gray-400" : "text-text-secondary";

  const selectedTotal = bills
    .filter(b => selectedBills.includes(b.id))
    .reduce((sum, b) => sum + b.amount, 0);

  const handleDownloadReceipt = () => {
    alert("Receipt downloaded!");
  };

  const handleShareWhatsapp = () => {
    alert("Sharing via WhatsApp...");
  };

  const handleShareSms = () => {
    alert("Sending SMS...");
  };

  const handleDone = () => {
    logout();
  };

  return (
    <div className={`${bgColor} min-h-screen flex flex-col items-center justify-center p-6`}>
      {/* Success Animation */}
      <div className="mb-6 animate-scale-in">
        <div className="w-36 h-36 rounded-full bg-gradient-success flex items-center justify-center shadow-2xl">
          <CheckCircle size={100} className="text-white animate-bounce-slow" />
        </div>
      </div>

      {/* Success Message */}
      <h1 className="text-success font-extrabold mb-2 text-center animate-slide-up" style={{ fontSize: 44 * fontScale }}>
        {t("paymentSuccessful")}
      </h1>
      <p className={`${subTextColor} text-center mb-6`} style={{ fontSize: 28 * fontScale }}>
        भुगतान सफल! Payment Successful!
      </p>

      {/* Amount Card */}
      <div className={`${highContrast ? "bg-gray-800" : "bg-white"} rounded-2xl p-6 shadow-xl mb-6 w-full max-w-md animate-slide-up`} style={{ animationDelay: '0.1s' }}>
        <p className={`${subTextColor} text-center mb-2`} style={{ fontSize: 20 * fontScale }}>
          Amount Paid
        </p>
        <p className={`text-gradient font-extrabold text-center`} style={{ fontSize: 56 * fontScale }}>
          ₹{selectedTotal.toLocaleString()}
        </p>
      </div>

      {/* Transaction Details */}
      <div className={`${highContrast ? "bg-gray-800" : "bg-white"} rounded-xl p-5 shadow-lg mb-8 w-full max-w-md animate-slide-up`} style={{ animationDelay: '0.2s' }}>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className={subTextColor} style={{ fontSize: 20 * fontScale }}>{t("transactionId")}</span>
            <span className={textColor} style={{ fontSize: 20 * fontScale, fontWeight: 600 }}>{currentTransaction?.id || `TXN${Date.now()}`}</span>
          </div>
          <div className="flex justify-between">
            <span className={subTextColor} style={{ fontSize: 20 * fontScale }}>Date & Time</span>
            <span className={textColor} style={{ fontSize: 20 * fontScale, fontWeight: 600 }}>
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={subTextColor} style={{ fontSize: 20 * fontScale }}>Payment Mode</span>
            <span className={`${highContrast ? "bg-yellow-600" : "bg-accent"} text-white px-3 py-1 rounded-lg font-bold`}>
              RAZORPAY
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-200">
            <span className={subTextColor} style={{ fontSize: 20 * fontScale }}>Status</span>
            <span className="text-success font-bold" style={{ fontSize: 20 * fontScale }}>✓ {t("success")}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-md animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <button
          onClick={handleDownloadReceipt}
          className={`${highContrast ? "bg-gray-800" : "bg-white"} p-4 rounded-xl shadow-card hover:shadow-lg transition-all flex flex-col items-center gap-2`}
        >
          <Download size={32} className={highContrast ? "text-yellow-400" : "text-primary"} />
          <span className={textColor} style={{ fontSize: 16 * fontScale }}>{t("downloadReceipt")}</span>
        </button>
        <button
          onClick={handleShareWhatsapp}
          className={`${highContrast ? "bg-gray-800" : "bg-white"} p-4 rounded-xl shadow-card hover:shadow-lg transition-all flex flex-col items-center gap-2`}
        >
          <MessageCircle size={32} className="text-green-600" />
          <span className={textColor} style={{ fontSize: 16 * fontScale }}>WhatsApp</span>
        </button>
        <button
          onClick={handleShareSms}
          className={`${highContrast ? "bg-gray-800" : "bg-white"} p-4 rounded-xl shadow-card hover:shadow-lg transition-all flex flex-col items-center gap-2`}
        >
          <MessageCircle size={32} className={highContrast ? "text-yellow-400" : "text-primary"} />
          <span className={textColor} style={{ fontSize: 16 * fontScale }}>{t("sendSms")}</span>
        </button>
      </div>

      {/* Primary Actions */}
      <div className="flex gap-4 w-full max-w-md animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <button
          onClick={() => setCurrentScreen("history")}
          className={`flex-1 py-5 rounded-xl font-bold border-2 ${
            highContrast
              ? "border-gray-600 text-white"
              : "border-primary text-primary"
          }`}
          style={{ fontSize: 22 * fontScale }}
        >
          <span className="flex items-center justify-center gap-2">
            <History size={24} />
            {t("viewHistory")}
          </span>
        </button>
        <button
          onClick={handleDone}
          className={`flex-1 py-5 rounded-xl font-bold text-white ${
            highContrast ? "bg-yellow-600" : "bg-gradient-accent"
          } hover:shadow-xl transition-all`}
          style={{ fontSize: 22 * fontScale }}
        >
          <span className="flex items-center justify-center gap-2">
            <Home size={24} />
            {t("done")}
          </span>
        </button>
      </div>
    </div>
  );
}

export function PaymentFailedScreen() {
  const { setCurrentScreen, fontScale } = useAppStore();
  const { t } = useTranslation();
  const highContrast = useAppStore((state) => state.highContrast);

  const bgColor = highContrast ? "bg-black" : "bg-gradient-to-br from-red-50 via-white to-orange-50";
  const textColor = highContrast ? "text-white" : "text-text-primary";
  const subTextColor = highContrast ? "text-gray-400" : "text-text-secondary";

  const handleRetry = () => {
    setCurrentScreen("payment-mode");
  };

  const handleBackToBills = () => {
    setCurrentScreen("bills");
  };

  return (
    <div className={`${bgColor} min-h-screen flex flex-col items-center justify-center p-6`}>
      {/* Failed Animation */}
      <div className="mb-6 animate-scale-in">
        <div className="w-36 h-36 rounded-full bg-gradient-to-br from-error to-error-light flex items-center justify-center shadow-2xl">
          <XCircle size={100} className="text-white" />
        </div>
      </div>

      {/* Error Message */}
      <h1 className="text-error font-extrabold mb-2 text-center animate-slide-up" style={{ fontSize: 44 * fontScale }}>
        {t("paymentFailed")}
      </h1>
      <p className={`${subTextColor} text-center mb-8`} style={{ fontSize: 28 * fontScale }}>
        Oops! Something went wrong. Please try again.
      </p>

      {/* Error Details Card */}
      <div className={`${highContrast ? "bg-gray-800" : "bg-white"} rounded-2xl p-6 shadow-xl mb-8 w-full max-w-md animate-slide-up`} style={{ animationDelay: '0.1s' }}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
            <XCircle size={32} className="text-error" />
            <div>
              <p className={textColor} style={{ fontSize: 20 * fontScale, fontWeight: 600 }}>Payment Failed</p>
              <p className={subTextColor} style={{ fontSize: 16 * fontScale }}>Transaction could not be completed</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className={subTextColor} style={{ fontSize: 18 * fontScale }}>Possible reasons:</p>
            <ul className={`space-y-2 ${textColor}`} style={{ fontSize: 18 * fontScale }}>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Insufficient balance</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Network connectivity issue</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Incorrect payment details</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 w-full max-w-md animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={handleBackToBills}
          className={`flex-1 py-5 rounded-xl font-bold border-2 ${
            highContrast
              ? "border-gray-600 text-white"
              : "border-primary text-primary"
          }`}
          style={{ fontSize: 22 * fontScale }}
        >
          {t("back")}
        </button>
        <button
          onClick={handleRetry}
          className={`flex-1 py-5 rounded-xl font-bold text-white ${
            highContrast ? "bg-yellow-600" : "bg-gradient-accent"
          } hover:shadow-xl transition-all transform hover:scale-105`}
          style={{ fontSize: 22 * fontScale }}
        >
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={24} />
            {t("tryAgain")}
          </span>
        </button>
      </div>

      {/* Help Text */}
      <p className={`mt-8 ${subTextColor} text-center`} style={{ fontSize: 20 * fontScale }}>
        Need help? Contact support at 1800-XXX-XXXX
      </p>
    </div>
  );
}

function IndianRupee({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="m6 13 8.5-10" />
      <path d="M6 13h3" />
      <path d="M9 13c6.627 0 6.627-10 13-10" />
    </svg>
  );
}
