import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic, MicOff, Check, X, Pencil,
  TrendingDown, TrendingUp, Wallet
} from "lucide-react";
import { useLang } from "../LanguageContext";

type CategoryKey = "fuel" | "food" | "toll" | "maintenance" | "insurance" | "loading" | "other";
type EntryType = "expense" | "income";

export interface ParsedFinanceEntry {
  type: EntryType;
  category: CategoryKey;
  amount: number;
  note: string;
  date: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: ParsedFinanceEntry) => void;
}

const SPEECH_LANG: Record<string, string> = {
  en: "en-IN", hi: "hi-IN", te: "te-IN",
  ta: "ta-IN", kn: "kn-IN", mr: "mr-IN",
  bn: "bn-IN", ml: "ml-IN",
};

function today() {
  return new Date().toISOString().split("T")[0];
}

function parseFinanceSpeech(text: string): Partial<ParsedFinanceEntry> {
  const t = text.toLowerCase();
  const result: Partial<ParsedFinanceEntry> = { date: today() };

  // ── Detect type ─────────────────────────────────────────────
  const incomeWords = /earn|earned|income|received|freight|payment|माल|मिली|कमाई|ஆர்ஜித்|வருவாய்|ఆదాయ|ಆದಾಯ|उत्पन्न|আয়|വരുമാനം|loading|lade|भाड़ा|bhada|kiraya/i;
  const expenseWords = /spent|spend|paid|pay|expense|खर्च|ஆனா|செலவு|ఖర్చు|ಖರ್ಚು|खर्च|খরচ|ചെലവ്|purchase|bought/i;

  if (incomeWords.test(t)) result.type = "income";
  else result.type = "expense";

  // ── Detect amount ────────────────────────────────────────────
  const amtMatch = t.match(/(\d[\d,]*)\s*(?:rupee|rupay|rupe|rs\.?|₹|रुपये?|রুপি|రూపాయ|ரூபாய்|ರೂಪಾಯಿ|रुपया|रुपए|रूपये|രൂപ)/i)
    || t.match(/(?:rupee|rupay|rs\.?|₹|रुपये?|রুপি|రూపాయ|ரூபாய்|ರೂಪಾಯಿ|रुपया|रुपए|रूपये|രൂപ)\s*(\d[\d,]*)/i);
  if (amtMatch) result.amount = parseInt(amtMatch[1].replace(/,/g, ""));

  // ── Detect category ──────────────────────────────────────────
  if (/diesel|petrol|cng|fuel|ईंधन|डीजल|పెట్రోల్|డీజిల్|ஈ.பொருள்|டீசல்|ಇಂಧನ|ಡೀಸೆಲ್|इंधन|ডিজেল|ഇന്ധന|ഡീസൽ/i.test(t)) {
    result.category = "fuel";
  } else if (/dhaba|food|eat|meal|dinner|lunch|breakfast|ढाबा|खाना|भोजन|ஊண்|ढाबे|ঢাবা|ধাবা|ధాబా|ढाबा|ഢാബ|ഭക്ഷണ/i.test(t)) {
    result.category = "food";
  } else if (/toll|टोल|टोल|டோல்|ಟೋಲ್|टोल|টোল|ടോൾ/i.test(t)) {
    result.category = "toll";
  } else if (/repair|service|tyre|tire|mechanic|workshop|maintenance|मरम्मत|सर्विस|ரிப்பேர்|ซ่อม|రిపేర్|ದುರಸ್ತಿ|दुरुस्ती|মেরামত|അറ്റകുറ്റ/i.test(t)) {
    result.category = "maintenance";
  } else if (/insurance|बीमा|காப்பீடு|బీమా|ವಿಮೆ|विमा|বীমা|ഇൻഷുറൻസ്/i.test(t)) {
    result.category = "insurance";
  } else if (/loading|unloading|freight|load|माल|लोडिंग|சரக்கு|లోడింగ్|ಲೋಡಿಂಗ್|लोडिंग|লোডিং|ലോഡിംഗ്/i.test(t)) {
    result.category = result.type === "income" ? "loading" : "other";
  } else {
    result.category = result.type === "income" ? "loading" : "other";
  }

  // ── Build note from transcript (cleaned up) ──────────────────
  result.note = text.length > 80 ? text.slice(0, 80) + "…" : text;

  return result;
}

export function FinanceVoiceEntry({ isOpen, onClose, onSave }: Props) {
  const { lang, t } = useLang();
  const [mode, setMode] = useState<"voice" | "manual">("voice");
  const [listening, setListening] = useState(false);
  const [waveActive, setWaveActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState<Partial<ParsedFinanceEntry> | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setParsed(null);
      setTranscript("");
      setMode("voice");
    }
  }, [isOpen]);

  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input not supported. Please use Chrome.");
      return;
    }
    const rec = new SR() as SpeechRecognition;
    rec.lang = SPEECH_LANG[lang] || "en-IN";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setParsed(parseFinanceSpeech(text));
      setListening(false);
      setWaveActive(false);
    };
    rec.onerror = () => { setListening(false); setWaveActive(false); };
    rec.onend   = () => { setListening(false); setWaveActive(false); };
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
    setWaveActive(true);
    setTranscript("");
    setParsed(null);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
    setWaveActive(false);
  }

  function handleSave() {
    if (!parsed?.amount) return;
    onSave({
      type: parsed.type || "expense",
      category: parsed.category || "other",
      amount: parsed.amount,
      note: parsed.note || "",
      date: parsed.date || today(),
    });
    onClose();
  }

  // Manual form state
  const [form, setForm] = useState({
    type: "expense" as EntryType,
    category: "fuel" as CategoryKey,
    amount: "",
    note: "",
  });

  function handleManualSave() {
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    onSave({
      type: form.type,
      category: form.category,
      amount: parseFloat(form.amount),
      note: form.note || form.category,
      date: today(),
    });
    onClose();
  }

  const CATEGORY_LABELS: Record<CategoryKey, string> = {
    fuel: t.catFuel, food: t.catFood, toll: t.catToll,
    maintenance: t.catMaintenance, insurance: t.catInsurance,
    loading: t.catLoading, other: t.catOther,
  };

  const ALL_CATEGORIES: CategoryKey[] = ["fuel", "food", "toll", "maintenance", "insurance", "loading", "other"];
  const EXPENSE_CATS: CategoryKey[] = ["fuel", "food", "toll", "maintenance", "insurance", "other"];
  const INCOME_CATS: CategoryKey[]  = ["loading", "other"];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative bg-white w-full max-w-lg rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "92vh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-emerald-600" />
            <span className="text-[#0f1c35]" style={{ fontWeight: 700 }}>{t.voiceEntry}</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 80px)" }}>
          {/* Mode tabs */}
          <div className="flex mx-5 mt-4 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setMode("voice")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${mode === "voice" ? "bg-white shadow text-[#1a4999]" : "text-gray-500"}`}
              style={{ fontWeight: 600 }}
            >
              <Mic size={15} />{t.tapToSpeak.split(" ")[0]}
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${mode === "manual" ? "bg-white shadow text-[#1a4999]" : "text-gray-500"}`}
              style={{ fontWeight: 600 }}
            >
              <Pencil size={15} />{t.addManually.split(" ").slice(-1)[0]}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* ── VOICE MODE ── */}
            {mode === "voice" && (
              <motion.div
                key="voice"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-5 pb-8"
              >
                <p className="text-gray-400 text-xs text-center mt-4 mb-6 px-2">
                  {t.sayExample}
                </p>

                {/* Mic button */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    {waveActive && [1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 1 + i * 0.35, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3, ease: "easeOut" }}
                      />
                    ))}
                    <button
                      onClick={listening ? stopListening : startListening}
                      className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all ${
                        listening ? "bg-red-500 scale-110" : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {listening
                        ? <MicOff size={36} className="text-white" />
                        : <Mic size={36} className="text-white" />
                      }
                    </button>
                  </div>
                  <p className="mt-4 text-sm text-center" style={{ fontWeight: 600, color: listening ? "#ef4444" : "#059669" }}>
                    {listening ? t.listening : t.tapToSpeak}
                  </p>
                </div>

                {/* Transcript */}
                {transcript && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-4 text-sm text-emerald-700 text-center italic">
                    "{transcript}"
                  </div>
                )}

                {/* Parsed result */}
                {parsed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-emerald-200 rounded-2xl p-4 mb-4"
                  >
                    <p className="text-xs text-gray-400 mb-3" style={{ fontWeight: 600 }}>{t.detectedEntry}</p>

                    {/* Type toggle */}
                    <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                      <button
                        onClick={() => setParsed(p => ({ ...p, type: "expense", category: "fuel" }))}
                        className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-all ${parsed.type === "expense" ? "bg-red-500 text-white shadow" : "text-gray-500"}`}
                        style={{ fontWeight: 600 }}
                      >
                        <TrendingDown size={14} />{t.typeExpense}
                      </button>
                      <button
                        onClick={() => setParsed(p => ({ ...p, type: "income", category: "loading" }))}
                        className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-all ${parsed.type === "income" ? "bg-green-500 text-white shadow" : "text-gray-500"}`}
                        style={{ fontWeight: 600 }}
                      >
                        <TrendingUp size={14} />{t.typeIncome}
                      </button>
                    </div>

                    {/* Amount */}
                    <div className="mb-3">
                      <label className="text-xs text-gray-400 mb-1 block">{t.amountLabel}</label>
                      <div className="flex items-center border-2 border-emerald-200 focus-within:border-emerald-500 rounded-xl overflow-hidden transition-colors">
                        <span className="px-3 text-gray-400 text-lg">₹</span>
                        <input
                          type="number"
                          value={parsed.amount || ""}
                          onChange={e => setParsed(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                          className="flex-1 py-3 pr-3 outline-none text-[#0f1c35] bg-white"
                          style={{ fontWeight: 700, fontSize: "1.2rem" }}
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div className="mb-3">
                      <label className="text-xs text-gray-400 mb-1 block">{t.categoryLabel}</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(parsed.type === "income" ? INCOME_CATS : EXPENSE_CATS).map(cat => (
                          <button
                            key={cat}
                            onClick={() => setParsed(p => ({ ...p, category: cat }))}
                            className={`py-2 px-1 rounded-xl text-[10px] text-center transition-all border-2 ${
                              parsed.category === cat
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-gray-100 bg-gray-50 text-gray-500"
                            }`}
                            style={{ fontWeight: 600 }}
                          >
                            {CATEGORY_LABELS[cat].split("/")[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Note */}
                    <div className="mb-4">
                      <label className="text-xs text-gray-400 mb-1 block">{t.noteParsed}</label>
                      <input
                        type="text"
                        value={parsed.note || ""}
                        onChange={e => setParsed(p => ({ ...p, note: e.target.value }))}
                        className="w-full border-2 border-gray-200 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setParsed(null); setTranscript(""); }}
                        className="flex-1 border-2 border-gray-200 text-gray-500 rounded-xl py-3 text-sm"
                        style={{ fontWeight: 600 }}
                      >
                        {t.retake}
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={!parsed.amount}
                        className="flex-1 bg-emerald-600 disabled:opacity-40 text-white rounded-xl py-3 flex items-center justify-center gap-2 text-sm"
                        style={{ fontWeight: 600 }}
                      >
                        <Check size={16} />{t.saveEntry}
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── MANUAL MODE ── */}
            {mode === "manual" && (
              <motion.div
                key="manual"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-5 pb-8 pt-4"
              >
                {/* Type */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                  <button
                    onClick={() => setForm(f => ({ ...f, type: "expense", category: "fuel" }))}
                    className={`flex-1 py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-all ${form.type === "expense" ? "bg-red-500 text-white shadow" : "text-gray-500"}`}
                    style={{ fontWeight: 700 }}
                  >
                    <TrendingDown size={15} />{t.typeExpense}
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, type: "income", category: "loading" }))}
                    className={`flex-1 py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-all ${form.type === "income" ? "bg-green-500 text-white shadow" : "text-gray-500"}`}
                    style={{ fontWeight: 700 }}
                  >
                    <TrendingUp size={15} />{t.typeIncome}
                  </button>
                </div>

                {/* Category grid */}
                <label className="text-xs text-gray-400 mb-2 block">{t.categoryLabel}</label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {(form.type === "income" ? INCOME_CATS : EXPENSE_CATS).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setForm(f => ({ ...f, category: cat }))}
                      className={`py-2.5 px-1 rounded-xl text-[10px] text-center border-2 transition-all ${
                        form.category === cat
                          ? "border-[#1a4999] bg-[#1a4999]/5 text-[#1a4999]"
                          : "border-gray-100 bg-gray-50 text-gray-500"
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      {CATEGORY_LABELS[cat].split("/")[0]}
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <label className="text-xs text-gray-400 mb-1 block">{t.amountLabel}</label>
                <div className="flex items-center border-2 border-gray-200 focus-within:border-[#1a4999] rounded-xl overflow-hidden mb-4 transition-colors">
                  <span className="px-3 text-gray-400 text-lg">₹</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    className="flex-1 py-4 pr-3 outline-none text-[#0f1c35] bg-white"
                    style={{ fontWeight: 700, fontSize: "1.2rem" }}
                  />
                </div>

                {/* Note */}
                <label className="text-xs text-gray-400 mb-1 block">{t.noteParsed}</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. HPCL highway, Shanti Dhaba..."
                  className="w-full border-2 border-gray-200 focus:border-[#1a4999] rounded-xl px-3 py-3 text-sm outline-none mb-5 transition-colors"
                />

                <button
                  onClick={handleManualSave}
                  disabled={!form.amount || parseFloat(form.amount) <= 0}
                  className="w-full bg-[#1a4999] hover:bg-[#163d80] disabled:opacity-40 text-white rounded-xl py-4 flex items-center justify-center gap-2"
                  style={{ fontWeight: 700 }}
                >
                  <Check size={18} />{t.saveEntry}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
