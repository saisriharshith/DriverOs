import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLang } from "../LanguageContext";
import { LANGUAGE_OPTIONS } from "../translations";
import { Truck, Shield, FileText, AlertTriangle, Globe, CheckCircle, ArrowLeft } from "lucide-react";
import { authService } from "../api/auth.service";

interface LoginPageProps {
  onLogin: () => void;
  onBack?: () => void;
}

type Step = "lang" | "phone" | "otp";

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const { lang, setLang, t } = useLang();
  const [step, setStep] = useState<Step>("lang");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "otp") {
      setTimer(30);
      setCanResend(false);
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step]);

  async function handleSendOTP() {
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      setError(t.invalidPhone);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.sendOTP(phone);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.every((d) => d !== "")) {
      await handleVerify(next.join(""));
    }
  }

  function handleOtpKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  }

  async function handleVerify(code?: string) {
    const otpCode = code || otp.join("");
    if (otpCode.length !== 6) {
      setError(t.invalidOTP);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.verifyOTP(phone, otpCode, "DRIVER", lang.toUpperCase());
      onLogin();
    } catch (err: any) {
      setError(err.response?.data?.error || t.invalidOTP);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend) return;
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setLoading(true);
    try {
      await authService.sendOTP(phone);
      setTimer(30);
      setCanResend(false);
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) { clearInterval(interval); setCanResend(true); return 0; }
          return prev - 1;
        });
      }, 1000);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  }

  const brandFeatures = [
    { icon: <FileText className="w-5 h-5" />, text: "Digital Document Vault" },
    { icon: <Shield className="w-5 h-5" />, text: "Compliance Tracking" },
    { icon: <AlertTriangle className="w-5 h-5" />, text: "Emergency SOS" },
    { icon: <Globe className="w-5 h-5" />, text: "8 Indian Languages" },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel — desktop only */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-gradient-to-br from-[#1a4999] via-[#1e56b5] to-[#2563eb] flex-col justify-between p-10 text-white">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-blue-200 hover:text-white text-sm mb-10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          )}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.4rem" }}>DriverOS <span className="text-[#f07c1e]">India</span></div>
              <div className="text-blue-200 text-xs">Digital OS for Truck Drivers</div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={lang}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <h2 className="text-white mb-3" style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", lineHeight: 1.3 }}>
                {t.welcomeTo}
              </h2>
              <p className="text-blue-100 text-base mb-10">{t.tagline}</p>
            </motion.div>
          </AnimatePresence>

          <div className="space-y-4">
            {brandFeatures.map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-blue-100">
                <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <span className="text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-blue-300 text-xs">
          Trusted by 5 lakh+ truck drivers across India
        </div>
      </div>

      {/* Right panel / full screen on mobile */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {onBack && (
              <button onClick={onBack} className="p-1.5 text-gray-500">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-8 h-8 bg-[#1a4999] rounded-xl flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-[#1a4999]" style={{ fontWeight: 700 }}>DriverOS India</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-md mx-auto w-full">
          <AnimatePresence mode="wait">
            {step === "lang" && (
              <motion.div
                key="lang"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-gray-900 mb-1">{t.selectLanguage}</h2>
                <p className="text-gray-400 text-sm mb-7">Choose your preferred language to continue</p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => setLang(opt.code)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        lang === opt.code
                          ? "border-[#1a4999] bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-xl">{opt.flag}</span>
                      <div className="text-left min-w-0">
                        <div className={`text-sm truncate ${lang === opt.code ? "text-[#1a4999]" : "text-gray-700"}`} style={{ fontWeight: 600 }}>
                          {opt.native}
                        </div>
                        <div className="text-xs text-gray-400">{opt.name}</div>
                      </div>
                      {lang === opt.code && <CheckCircle className="w-4 h-4 text-[#1a4999] ml-auto flex-shrink-0" />}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep("phone")}
                  className="w-full bg-[#1a4999] hover:bg-[#163d80] text-white py-4 rounded-xl transition-colors"
                >
                  Continue in {LANGUAGE_OPTIONS.find((o) => o.code === lang)?.native} →
                </button>
              </motion.div>
            )}

            {step === "phone" && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={() => setStep("lang")}
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.selectLanguage}
                </button>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={lang + "phone"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <h2 className="text-gray-900 mb-1">{t.enterPhone}</h2>
                    <p className="text-gray-400 text-sm mb-7">{t.tagline}</p>
                  </motion.div>
                </AnimatePresence>

                <div className="mb-4">
                  <div className="flex border-2 rounded-xl overflow-hidden focus-within:border-[#1a4999] border-gray-200 transition-colors">
                    <div className="flex items-center px-4 bg-gray-50 border-r border-gray-200">
                      <span className="text-gray-500 text-sm">🇮🇳 +91</span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError(""); }}
                      placeholder={t.phonePlaceholder}
                      className="flex-1 px-4 py-4 outline-none text-gray-900 bg-white placeholder-gray-300"
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={phone.length !== 10}
                  className="w-full bg-[#1a4999] hover:bg-[#163d80] disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-xl transition-colors mb-4"
                >
                  {t.sendOTP}
                </button>

                <p className="text-center text-gray-400 text-xs">
                  {t.termsText}{" "}
                  <span className="text-[#1a4999] underline cursor-pointer">{t.termsLink}</span>
                </p>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.changeNumber}
                </button>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={lang + "otp"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <h2 className="text-gray-900 mb-1">{t.enterOTP}</h2>
                    <p className="text-gray-400 text-sm mb-7">
                      {t.otpSentTo} +91 {phone}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Timer bar */}
                <div className="mb-6">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className="h-full bg-[#1a4999] rounded-full"
                      initial={{ width: "100%" }}
                      animate={{ width: `${(timer / 30) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-right">
                    {canResend ? (
                      <button onClick={handleResend} className="text-[#1a4999] underline">{t.resendOTP}</button>
                    ) : (
                      <>{t.resendIn} {timer}s</>
                    )}
                  </p>
                </div>

                <div className="flex gap-2 justify-between mb-6">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      className={`w-12 h-14 text-center border-2 rounded-xl outline-none transition-all text-gray-900 ${
                        digit ? "border-[#1a4999] bg-blue-50" : "border-gray-200 focus:border-[#1a4999]"
                      }`}
                      style={{ fontSize: "1.3rem", fontWeight: 700 }}
                    />
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-blue-600 text-xs text-center mb-5">
                  {t.otpHint}
                </div>

                {error && <p className="text-red-500 text-xs mb-3 text-center">{error}</p>}

                <button
                  onClick={handleVerify}
                  disabled={loading || otp.some((d) => !d)}
                  className="w-full bg-[#1a4999] hover:bg-[#163d80] disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-xl transition-colors"
                >
                  {loading ? t.loggingIn : t.verifyOTP}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
