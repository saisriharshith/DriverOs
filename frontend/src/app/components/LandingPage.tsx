import { useState } from "react";
import { motion } from "motion/react";
import { useLang } from "../LanguageContext";
import { LANGUAGE_OPTIONS } from "../translations";
import { Shield, FileText, Truck, AlertTriangle, Globe, ChevronRight, Star, Users, CheckCircle } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    {
      icon: <FileText className="w-7 h-7" />,
      title: "Document Vault",
      desc: "Store License, RC, Insurance, PUC & Permit digitally. Share via WhatsApp in seconds.",
      color: "bg-blue-50 text-blue-700",
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: "Compliance Score",
      desc: "Real-time legal readiness score. Never get fined for expired documents again.",
      color: "bg-green-50 text-green-700",
    },
    {
      icon: <Truck className="w-7 h-7" />,
      title: "Trip Management",
      desc: "Start & end trips, track routes, log fuel costs, and review your earnings history.",
      color: "bg-orange-50 text-orange-700",
    },
    {
      icon: <AlertTriangle className="w-7 h-7" />,
      title: "Emergency SOS",
      desc: "One-press SOS that shares your live location with family, fleet owner, and emergency services.",
      color: "bg-red-50 text-red-700",
    },
    {
      icon: <Globe className="w-7 h-7" />,
      title: "8 Indian Languages",
      desc: "Full UI in English, Hindi, Telugu, Tamil, Kannada, Marathi, Bengali & Malayalam.",
      color: "bg-purple-50 text-purple-700",
    },
    {
      icon: <Star className="w-7 h-7" />,
      title: "AI Assistant",
      desc: "Ask in your language — get answers about fines, documents, breakdowns, and routes.",
      color: "bg-yellow-50 text-yellow-700",
    },
  ];

  const stats = [
    { value: "5L+", label: "Truck Drivers" },
    { value: "₹0", label: "Penalty Avoided" },
    { value: "8", label: "Indian Languages" },
    { value: "24/7", label: "Emergency Support" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1a4999] flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-[#1a4999]" style={{ fontWeight: 700, fontSize: "1.15rem" }}>
              DriverOS <span className="text-[#f07c1e]">India</span>
            </span>
          </div>

          {/* Language selector — desktop */}
          <div className="hidden md:flex items-center gap-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                onClick={() => setLang(opt.code)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  lang === opt.code
                    ? "bg-[#1a4999] text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {opt.native}
              </button>
            ))}
          </div>

          <button
            onClick={onGetStarted}
            className="bg-[#1a4999] text-white px-5 py-2 rounded-lg text-sm hover:bg-[#163d80] transition-colors"
          >
            {t.sendOTP === "OTP அனுப்பு" ? "உள்நுழைய" : "Login / Get Started"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a4999] via-[#1e56b5] to-[#2563eb] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            key={lang}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              India's #1 Truck Driver Platform
            </div>
            <h1 className="text-white mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.2 }}>
              DriverOS India
            </h1>
            <p className="text-blue-100 mb-3" style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)" }}>
              Digital Operating System for Indian Truck Drivers
            </p>
            <p className="text-blue-200 text-base mb-8 max-w-lg">
              Manage your documents, track compliance, handle trips, and access emergency support — all in one app, in your language.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onGetStarted}
                className="flex items-center justify-center gap-2 bg-[#f07c1e] hover:bg-[#d96b15] text-white px-8 py-4 rounded-xl transition-colors"
                style={{ fontSize: "1.05rem" }}
              >
                Get Started Free
                <ChevronRight className="w-5 h-5" />
              </button>
              <button className="flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white/60 text-white px-8 py-4 rounded-xl transition-colors text-base">
                Watch Demo
              </button>
            </div>
          </motion.div>

          <div className="hidden md:flex justify-center">
            <div className="relative w-72">
              {/* Phone mockup */}
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white/20">
                <div className="bg-[#1a4999] px-4 pt-6 pb-4">
                  <div className="flex items-center justify-between text-white text-xs mb-3">
                    <span>DriverOS India</span>
                    <span>9:41</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 mb-3">
                    <div className="text-white text-xs mb-1">Compliance Score</div>
                    <div className="text-3xl text-white" style={{ fontWeight: 700 }}>87</div>
                    <div className="mt-2 bg-white/20 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{ width: "87%" }} />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 space-y-2">
                  {[
                    { label: "Driving License", days: 142, color: "bg-green-500" },
                    { label: "Insurance", days: 12, color: "bg-yellow-500" },
                    { label: "PUC Certificate", days: -3, color: "bg-red-500" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm">
                      <span className="text-gray-700 text-xs">{item.label}</span>
                      <span className={`text-white text-xs px-2 py-0.5 rounded-full ${item.color}`}>
                        {item.days < 0 ? "Expired" : `${item.days}d`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-[#f07c1e] text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
                🚨 PUC Expired!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#f0f4f8] py-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-[#1a4999]" style={{ fontSize: "1.8rem", fontWeight: 700 }}>{s.value}</div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem statement */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block bg-red-50 text-red-700 text-sm px-4 py-1.5 rounded-full mb-4">The Problem</div>
          <h2 className="text-gray-900 mb-4">Truck drivers lose lakhs to paperwork chaos</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Every year, thousands of drivers are fined, detained, or lose work due to expired documents, missed renewals, and compliance failures.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "📄", title: "Unorganized Papers", desc: "Physical documents get lost, damaged, or forgotten during long highway trips" },
            { icon: "⏰", title: "Missed Renewals", desc: "License, insurance, PUC deadlines are missed without any digital reminders" },
            { icon: "💰", title: "Heavy Penalties", desc: "Fines from ₹500 to ₹10,000+ for non-compliance during checkposts" },
          ].map((p) => (
            <div key={p.title} className="bg-red-50 border border-red-100 rounded-2xl p-6">
              <div className="text-4xl mb-3">{p.icon}</div>
              <h3 className="text-gray-900 mb-2">{p.title}</h3>
              <p className="text-gray-500 text-sm">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-[#f0f4f8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-50 text-blue-700 text-sm px-4 py-1.5 rounded-full mb-4">The Solution</div>
            <h2 className="text-gray-900 mb-4">Everything a truck driver needs</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              One unified digital platform that replaces the glove-box full of papers.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Language support */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-block bg-purple-50 text-purple-700 text-sm px-4 py-1.5 rounded-full mb-4">India-First</div>
        <h2 className="text-gray-900 mb-4">Your language, your platform</h2>
        <p className="text-gray-500 max-w-xl mx-auto mb-10">
          DriverOS speaks 8 Indian languages. Switch instantly — every button, alert, and message translates in real time.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              onClick={() => setLang(opt.code)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all ${
                lang === opt.code
                  ? "border-[#1a4999] bg-[#1a4999] text-white shadow-md"
                  : "border-gray-200 bg-white text-gray-700 hover:border-[#1a4999]/40"
              }`}
            >
              <span>{opt.flag}</span>
              <span>{opt.native}</span>
              {lang === opt.code && <CheckCircle className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-[#1a4999] to-[#2563eb] text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-200" />
            <span className="text-blue-200 text-sm">Join 5 lakh+ truck drivers</span>
          </div>
          <h2 className="text-white mb-4" style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}>
            Start your digital journey today
          </h2>
          <p className="text-blue-200 mb-8">
            Free to sign up. Login with your mobile number — no paperwork required.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-[#f07c1e] hover:bg-[#d96b15] text-white px-10 py-4 rounded-xl transition-colors"
            style={{ fontSize: "1.1rem" }}
          >
            Get Started — It's Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1a4999] flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-white" style={{ fontWeight: 600 }}>DriverOS India</span>
          </div>
          <div className="text-sm">© 2026 DriverOS India. All rights reserved.</div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
