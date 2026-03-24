"use client";

/**
 * Test Payment Page - Razorpay Integration Test
 * 
 * This page allows testing Razorpay payments with test credentials.
 * Access at: /test-payment
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, IndianRupee, CheckCircle, XCircle, 
  RefreshCw, Copy, Check, AlertCircle, Wallet
} from "lucide-react";

// Razorpay script loader
declare global {
  interface Window {
    Razorpay: any;
  }
}

type PaymentStatus = "idle" | "loading" | "success" | "failed";

interface PaymentResult {
  paymentId: string;
  orderId: string;
  signature?: string;
}

const TEST_CARDS = [
  { name: "Visa (Success)", number: "4111 1111 1111 1111", cvv: "123", expiry: "12/26" },
  { name: "Mastercard (Success)", number: "5267 3181 8797 5449", cvv: "123", expiry: "12/26" },
  { name: "RuPay (Success)", number: "6073 8497 7320 8019", cvv: "123", expiry: "12/26" },
];

const PRESET_AMOUNTS = [100, 500, 1000, 2000];

export default function TestPaymentPage() {
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string>("");
  const [copiedCard, setCopiedCard] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Razorpay script
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

  const copyToClipboard = (text: string, cardName: string) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ""));
    setCopiedCard(cardName);
    setTimeout(() => setCopiedCard(null), 2000);
  };

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setCustomAmount("");
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    const num = parseInt(value);
    if (!isNaN(num) && num >= 10 && num <= 5000) {
      setAmount(num);
    }
  };

  const createOrder = async (): Promise<{ orderId: string; keyId: string } | null> => {
    try {
      // Direct Razorpay order creation for testing
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + btoa("rzp_test_SUudTNZw53zapl:IVUVTIg3K0J2tps1uLXf3A3g"),
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency: "INR",
          receipt: `test_${Date.now()}`,
          notes: {
            purpose: "test_payment",
            source: "suvidha_one_frontend"
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const order = await response.json();
      return {
        orderId: order.id,
        keyId: "rzp_test_SUudTNZw53zapl"
      };
    } catch (err) {
      console.error("Order creation error:", err);
      return null;
    }
  };

  const handlePayment = async () => {
    if (!scriptLoaded) {
      setError("Razorpay is still loading. Please wait...");
      return;
    }

    setStatus("loading");
    setError("");
    setResult(null);

    const orderData = await createOrder();
    
    if (!orderData) {
      setStatus("failed");
      setError("Failed to create payment order. Please try again.");
      return;
    }

    const options = {
      key: orderData.keyId,
      amount: amount * 100,
      currency: "INR",
      order_id: orderData.orderId,
      name: "SUVIDHA ONE",
      description: `Test Payment - ₹${amount}`,
      image: "/logo.png",
      handler: function (response: any) {
        setStatus("success");
        setResult({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
        });
      },
      prefill: {
        name: "Test User",
        email: "test@suvidhaone.com",
        contact: "9999999999",
      },
      notes: {
        test_mode: "true",
      },
      theme: {
        color: "#FF6600",
      },
      modal: {
        ondismiss: function () {
          if (status === "loading") {
            setStatus("idle");
          }
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setStatus("failed");
        setError(response.error.description || "Payment failed");
      });
      rzp.open();
    } catch (err) {
      setStatus("failed");
      setError("Failed to open payment modal");
    }
  };

  const resetPayment = () => {
    setStatus("idle");
    setResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <AlertCircle size={16} />
            Test Mode - No real money will be charged
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🧪 Razorpay Test Payment
          </h1>
          <p className="text-gray-600">
            Test the payment integration with sandbox credentials
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Payment Form */}
          {status === "idle" || status === "loading" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Amount Selection */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <IndianRupee size={20} className="text-orange-500" />
                  Select Amount
                </h2>
                
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {PRESET_AMOUNTS.map((preset) => (
                    <motion.button
                      key={preset}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAmountSelect(preset)}
                      className={`
                        py-3 px-4 rounded-xl font-semibold text-lg transition-all
                        ${amount === preset && !customAmount
                          ? "bg-orange-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }
                      `}
                    >
                      ₹{preset}
                    </motion.button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">₹</span>
                  <input
                    type="number"
                    placeholder="Custom amount (₹10 - ₹5000)"
                    value={customAmount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-orange-500 focus:outline-none transition-colors"
                    min={10}
                    max={5000}
                  />
                </div>

                <div className="mt-4 text-center">
                  <span className="text-3xl font-bold text-gray-800">₹{amount}</span>
                  <span className="text-gray-500 ml-2">will be charged</span>
                </div>
              </div>

              {/* Test Cards Info */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-blue-500" />
                  Test Card Details
                </h2>
                
                <div className="space-y-3">
                  {TEST_CARDS.map((card) => (
                    <div
                      key={card.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{card.name}</p>
                        <p className="text-sm text-gray-500 font-mono">{card.number}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm text-gray-500">
                          <p>CVV: {card.cvv}</p>
                          <p>Exp: {card.expiry}</p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => copyToClipboard(card.number, card.name)}
                          className="p-2 bg-white rounded-lg shadow-sm hover:shadow transition-shadow"
                        >
                          {copiedCard === card.name ? (
                            <Check size={18} className="text-green-500" />
                          ) : (
                            <Copy size={18} className="text-gray-400" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-800">
                    <strong>OTP:</strong> Use <code className="bg-blue-100 px-2 py-0.5 rounded">1234</code> for all test transactions
                  </p>
                </div>
              </div>

              {/* Pay Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment}
                disabled={status === "loading" || !scriptLoaded}
                className={`
                  w-full py-5 rounded-2xl font-bold text-xl text-white
                  flex items-center justify-center gap-3 shadow-lg
                  transition-all disabled:opacity-70
                  ${status === "loading" 
                    ? "bg-gray-400" 
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  }
                `}
              >
                {status === "loading" ? (
                  <>
                    <RefreshCw size={24} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet size={24} />
                    Pay ₹{amount} Now
                  </>
                )}
              </motion.button>
            </motion.div>
          ) : null}

          {/* Success State */}
          {status === "success" && result && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle size={80} className="mx-auto text-green-500 mb-4" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-green-600 mb-2">
                Payment Successful! 🎉
              </h2>
              <p className="text-3xl font-bold text-gray-800 mb-6">₹{amount}</p>

              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment ID:</span>
                  <span className="font-mono text-sm">{result.paymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-mono text-sm">{result.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time:</span>
                  <span>{new Date().toLocaleString("en-IN")}</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetPayment}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                Make Another Payment
              </motion.button>
            </motion.div>
          )}

          {/* Failed State */}
          {status === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <XCircle size={80} className="mx-auto text-red-500 mb-4" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Payment Failed
              </h2>
              <p className="text-gray-600 mb-6">{error || "Something went wrong. Please try again."}</p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetPayment}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                Try Again
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          <p>Powered by Razorpay Test Mode</p>
          <p className="mt-1">Key: rzp_test_SUudTNZw53zapl</p>
        </motion.div>
      </div>
    </div>
  );
}
