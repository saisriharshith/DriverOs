import { useState, useRef, useEffect } from "react";
import { Bot, Mic, Send, X, Sparkles, Volume2 } from "lucide-react";
import { useLang } from "../LanguageContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const MOCK_RESPONSES: Record<string, string> = {
  insurance: "📋 Your insurance has expired. Here's what to do immediately:\n\n1. Do NOT drive until renewed — fine ₹2,000–₹4,000\n2. Contact your insurance agent or visit insurancedekho.com\n3. Documents needed: RC, previous policy, Aadhaar, PAN\n4. New policy can be issued same day online\n5. Upload new policy to Document Vault\n\n⚠️ Driving without insurance is illegal under MV Act Section 146.",
  license: "🪪 To renew your HMV driving license:\n\n1. Visit your nearest RTO or go to parivahan.gov.in\n2. Apply 1 year before expiry\n3. Documents: Old license, Aadhaar, medical Form 1-A, passport photo\n4. Fee: ₹200–₹400 · Takes 7–15 working days\n\n💡 Apply online at sarathi.parivahan.gov.in to save time!",
  puc: "💨 PUC fine:\n\n• First offense: ₹10,000\n• Second: ₹10,000 + up to 6 months imprisonment\n\n✅ Renewal:\n1. Visit nearest authorized PUC center\n2. Takes 15–20 minutes · Cost: ₹60–₹100\n3. Valid 6 months or 1 year",
  fitness: "🔧 Fitness Certificate is required for all commercial vehicles:\n\n• New vehicles: Valid 2 years\n• After 2 years: Annual renewal required\n• Required docs: RC, Insurance, PUC, Emission test\n• Cost: ₹200–₹1,500 · Penalty without FC: ₹5,000",
  eway: "📦 E-Way Bill required for goods worth more than ₹50,000:\n\n• Generate at ewaybillgst.gov.in\n• Valid 48 hours for under 100 km\n• For 100–300 km: 72 hours\n\n⚠️ No E-Way Bill penalty: ₹10,000 or 100% of tax",
};

function getResponse(input: string): string {
  const l = input.toLowerCase();
  if (l.includes("insurance") || l.includes("bima") || l.includes("insura")) return MOCK_RESPONSES.insurance;
  if (l.includes("license") || l.includes("licence") || l.includes("dl") || l.includes("lisence")) return MOCK_RESPONSES.license;
  if (l.includes("puc") || l.includes("pollution")) return MOCK_RESPONSES.puc;
  if (l.includes("fitness")) return MOCK_RESPONSES.fitness;
  if (l.includes("e-way") || l.includes("eway") || l.includes("way bill")) return MOCK_RESPONSES.eway;
  return "मुझे समझ नहीं आया। Please ask about:\n\n• Document renewal (DL, Insurance, PUC, Fitness)\n• Fines and penalties\n• E-Way Bill rules\n• Breakdown support\n• Government regulations\n\nYou can type in Hindi, Telugu, Tamil, or English! 🙏";
}

const QUICK_QUESTIONS = [
  "My insurance expired, what to do?",
  "How to renew driving license?",
  "What is e-way bill?",
  "Fine for PUC expiry?",
  "What is fitness certificate?",
  "Nearest RTO office?",
];

export function AIAssistant() {
  const { t } = useLang();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      text: "नमस्ते! 🙏 I'm DriverOS Assistant.\n\nI help with:\n• Document rules & renewals\n• Fine & penalty guidance\n• Breakdown support\n• Compliance questions\n\nAsk in Hindi, Telugu, Tamil or English!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", text }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", text: getResponse(text) }]);
      setLoading(false);
    }, 1200);
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col pb-24">
      <div className="bg-[#1a4999] px-4 pt-10 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold">{t.aiAssistant}</h1>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/60 text-xs">{t.onlineHindi}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="px-4 pt-3 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {QUICK_QUESTIONS.map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              className="shrink-0 bg-white border border-[#dce6f0] text-[#0f1c35] text-xs px-3 py-1.5 rounded-xl whitespace-nowrap">
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 bg-[#1a4999] rounded-xl flex items-center justify-center shrink-0 mt-1">
                <Sparkles size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-[#1a4999] text-white rounded-tr-sm" : "bg-white text-[#0f1c35] rounded-tl-sm"}`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              {msg.role === "assistant" && (
                <button className="flex items-center gap-1 mt-2 text-[#4a5f7a] text-xs">
                  <Volume2 size={12} /> {t.listen}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-[#1a4999] rounded-xl flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-2 h-2 bg-[#1a4999] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-[#dce6f0] shrink-0 mb-16">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[#f0f4f8] rounded-2xl px-4 py-3 flex items-center gap-2">
            <input
              className="flex-1 bg-transparent text-[#0f1c35] text-sm outline-none"
              placeholder={t.typeMessage}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage(input)}
            />
            {input && <button onClick={() => setInput("")}><X size={16} className="text-[#4a5f7a]" /></button>}
          </div>
          <button className="w-11 h-11 bg-orange-500 rounded-2xl flex items-center justify-center shrink-0">
            <Mic size={20} className="text-white" />
          </button>
          <button onClick={() => sendMessage(input)} className="w-11 h-11 bg-[#1a4999] rounded-2xl flex items-center justify-center shrink-0">
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
