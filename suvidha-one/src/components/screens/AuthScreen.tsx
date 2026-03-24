"use client";

/**
 * Authentication Screen - SCREEN-03
 * 
 * Based on Wireframe_Specification.md:
 * - Auth options: Mobile OTP, Aadhaar, QR, Guest
 * - Phone input with numeric keypad
 * - 6-digit OTP boxes
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Smartphone, Fingerprint, QrCode, User, Phone } from "lucide-react";
import { useAppStore } from "@/store";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { OtpInput, NumericKeypad } from "@/components/ui/Input";

type AuthMode = "select" | "phone" | "otp" | "biometric" | "qr" | "guest";

export interface AuthScreenProps {
  onBack?: () => void;
  onSuccess: () => void;
  onGuest?: () => void;
}

export function AuthScreen({ onBack, onSuccess, onGuest }: AuthScreenProps) {
  const { language, fontScale, highContrast, login } = useAppStore();
  
  const [mode, setMode] = useState<AuthMode>("select");
  const [phoneNumber, setPhoneNumber] = useState("+91 ");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const bgClass = highContrast 
    ? "bg-black" 
    : "bg-gradient-to-br from-white via-blue-50 to-orange-50";
  
  const textClass = highContrast ? "text-white" : "text-text-primary";
  const subtextClass = highContrast ? "text-gray-300" : "text-text-secondary";

  const handlePhoneInput = (digit: string) => {
    if (phoneNumber.length < 14) { // +91 + 10 digits
      setPhoneNumber(prev => prev + digit);
    }
  };

  const handlePhoneBackspace = () => {
    if (phoneNumber.length > 4) { // Keep "+91 "
      setPhoneNumber(prev => prev.slice(0, -1));
    }
  };

  const handleSendOtp = async () => {
    if (phoneNumber.length < 14) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    
    setLoading(true);
    setError("");
    
    // Simulate OTP send
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoading(false);
    setMode("otp");
    setCountdown(60);
    
    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter 6-digit OTP");
      return;
    }
    
    setLoading(true);
    setError("");
    
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock successful login
    login("otp", {
      id: "user-123",
      name: "राम सिंह",
      mobile: phoneNumber,
    });
    
    setLoading(false);
    onSuccess();
  };

  const handleGuestContinue = () => {
    login("guest", {
      id: "guest-" + Date.now(),
      name: "Guest",
      mobile: "",
    });
    onGuest?.();
  };

  // Auth Option Card
  const AuthOptionCard = ({ 
    icon, 
    title, 
    titleHindi, 
    description, 
    onClick,
    muted = false 
  }: {
    icon: React.ReactNode;
    title: string;
    titleHindi: string;
    description?: string;
    onClick: () => void;
    muted?: boolean;
  }) => (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01, x: 8 }}
      whileTap={{ scale: 0.99 }}
      className={`
        w-full p-8 rounded-2xl text-left
        flex items-center gap-8
        transition-all duration-200
        ${muted 
          ? highContrast ? "bg-white/5" : "bg-[#F5F5F5]"
          : highContrast ? "bg-white/10" : "bg-white shadow-md hover:shadow-lg"
        }
      `}
    >
      <div className={`w-[80px] h-[80px] flex items-center justify-center ${muted ? subtextClass : "text-primary"}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h4 
          className={`font-semibold ${muted ? subtextClass : textClass}`}
          style={{ fontSize: 36 * fontScale }}
        >
          {title}
        </h4>
        <p 
          className={subtextClass}
          style={{ fontSize: 28 * fontScale }}
        >
          {titleHindi}
        </p>
        {description && (
          <p 
            className={subtextClass}
            style={{ fontSize: 24 * fontScale }}
          >
            {description}
          </p>
        )}
      </div>
    </motion.button>
  );

  return (
    <div className={`min-h-screen flex flex-col ${bgClass}`}>
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <motion.button
          onClick={() => mode === "select" ? onBack?.() : setMode("select")}
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
          className={`font-bold ${textClass}`}
          style={{ fontSize: 36 * fontScale }}
        >
          {t("authenticate", language)} / पहचान
        </h1>

        {mode === "select" && (
          <motion.button
            onClick={handleGuestContinue}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              px-6 py-3 rounded-xl flex items-center gap-2
              ${highContrast ? "bg-white/10 text-white" : "bg-[#F5F5F5] text-text-secondary"}
            `}
            style={{ fontSize: 24 * fontScale }}
          >
            <User size={24} />
            Guest
          </motion.button>
        )}
        
        {mode !== "select" && <div className="w-[80px]" />}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 py-6 max-w-3xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* Auth Method Selection */}
          {mode === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-12">
                <h2 
                  className={`font-semibold ${textClass}`}
                  style={{ fontSize: 48 * fontScale }}
                >
                  {t("how_to_verify", language)}
                </h2>
              </div>

              <div className="space-y-4">
                <AuthOptionCard
                  icon={<Smartphone size={48} />}
                  title={t("mobile_otp", "en")}
                  titleHindi={t("mobile_otp", "hi")}
                  onClick={() => setMode("phone")}
                />
                <AuthOptionCard
                  icon={<Fingerprint size={48} />}
                  title={t("aadhaar_biometric", "en")}
                  titleHindi={t("aadhaar_biometric", "hi")}
                  onClick={() => setMode("biometric")}
                />
                <AuthOptionCard
                  icon={<QrCode size={48} />}
                  title={t("scan_qr", "en")}
                  titleHindi={t("scan_qr", "hi")}
                  onClick={() => setMode("qr")}
                />
                <AuthOptionCard
                  icon={<User size={48} />}
                  title={t("continue_guest", "en")}
                  titleHindi={t("continue_guest", "hi")}
                  onClick={handleGuestContinue}
                  muted
                />
              </div>
            </motion.div>
          )}

          {/* Phone Number Input */}
          {mode === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone size={40} className="text-primary" />
                </div>
                <h2 
                  className={`font-semibold ${textClass}`}
                  style={{ fontSize: 48 * fontScale }}
                >
                  {t("enter_mobile", language)}
                </h2>
              </div>

              {/* Phone Display */}
              <div 
                className={`
                  text-center p-6 rounded-2xl
                  ${highContrast ? "bg-white/10" : "bg-white shadow-md"}
                `}
              >
                <p 
                  className={`font-bold ${textClass}`}
                  style={{ fontSize: 56 * fontScale, letterSpacing: "0.15em" }}
                >
                  {phoneNumber}
                </p>
              </div>

              {/* Error */}
              {error && (
                <p 
                  className="text-center text-error font-medium"
                  style={{ fontSize: 28 * fontScale }}
                >
                  ⚠️ {error}
                </p>
              )}

              {/* Numeric Keypad */}
              <NumericKeypad
                onKeyPress={handlePhoneInput}
                onBackspace={handlePhoneBackspace}
                onClear={() => setPhoneNumber("+91 ")}
                disabled={loading}
              />

              {/* Send OTP Button */}
              <Button
                onClick={handleSendOtp}
                loading={loading}
                disabled={phoneNumber.length < 14}
                fullWidth
                size="xl"
              >
                {t("send_otp", language)}
              </Button>
            </motion.div>
          )}

          {/* OTP Input */}
          {mode === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 
                  className={`font-semibold mb-2 ${textClass}`}
                  style={{ fontSize: 48 * fontScale }}
                >
                  {t("enter_otp", language)}
                </h2>
                <p 
                  className={subtextClass}
                  style={{ fontSize: 28 * fontScale }}
                >
                  OTP sent to {phoneNumber.slice(-4).padStart(phoneNumber.length, "*")}
                </p>
              </div>

              {/* OTP Boxes */}
              <OtpInput
                value={otp}
                onChange={setOtp}
                error={!!error}
                disabled={loading}
              />

              {/* Error */}
              {error && (
                <p 
                  className="text-center text-error font-medium"
                  style={{ fontSize: 28 * fontScale }}
                >
                  ⚠️ {error}
                </p>
              )}

              {/* Resend */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p 
                    className={subtextClass}
                    style={{ fontSize: 24 * fontScale }}
                  >
                    {t("didnt_receive", language)} Resend in {countdown}s
                  </p>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCountdown(60);
                      // Restart timer
                    }}
                    size="sm"
                  >
                    {t("resend_otp", language)}
                  </Button>
                )}
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerifyOtp}
                loading={loading}
                disabled={otp.length !== 6}
                fullWidth
                size="xl"
              >
                {t("verify", language)}
              </Button>
            </motion.div>
          )}

          {/* Biometric Placeholder */}
          {mode === "biometric" && (
            <motion.div
              key="biometric"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-20"
            >
              <Fingerprint size={120} className="mx-auto mb-8 text-primary" />
              <h2 
                className={`font-semibold mb-4 ${textClass}`}
                style={{ fontSize: 48 * fontScale }}
              >
                Place your finger on the scanner
              </h2>
              <p 
                className={subtextClass}
                style={{ fontSize: 32 * fontScale }}
              >
                स्कैनर पर अपनी उंगली रखें
              </p>
            </motion.div>
          )}

          {/* QR Placeholder */}
          {mode === "qr" && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-20"
            >
              <div className="w-64 h-64 mx-auto mb-8 border-4 border-dashed border-primary/30 rounded-2xl flex items-center justify-center">
                <QrCode size={120} className="text-primary" />
              </div>
              <h2 
                className={`font-semibold mb-4 ${textClass}`}
                style={{ fontSize: 48 * fontScale }}
              >
                Scan QR from DigiLocker App
              </h2>
              <p 
                className={subtextClass}
                style={{ fontSize: 32 * fontScale }}
              >
                डिजीलॉकर ऐप से क्यूआर स्कैन करें
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default AuthScreen;
