import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Check, X, Fuel, Plus, Pencil, Camera } from "lucide-react";
import { useLang } from "../LanguageContext";
import { aiService } from "../api/ai.service";

interface FuelEntry {
  id: string;
  date: string;
  litres: number;
  pricePerLitre: number;
  totalCost: number;
  fuelType: string;
  station: string;
  odometer: string;
}

const SPEECH_LANG: Record<string, string> = {
  en: "en-IN", hi: "hi-IN", te: "te-IN",
  ta: "ta-IN", kn: "kn-IN", mr: "mr-IN",
  bn: "bn-IN", ml: "ml-IN",
};

const FUEL_PROMPTS: Record<string, string> = {
  en: 'Say: "50 litre diesel, 4600 rupees at HPCL"',
  hi: 'बोलें: "50 लीटर डीजल, 4600 रुपये HPCL में"',
  te: 'చెప్పండి: "50 లీటర్ డీజిల్, 4600 రూపాయలు HPCL లో"',
  ta: 'சொல்லுங்கள்: "50 லிட்டர் டீசல், 4600 ரூபாய் HPCL-ல்"',
  kn: 'ಹೇಳಿ: "50 ಲೀಟರ್ ಡೀಸೆಲ್, 4600 ರೂಪಾಯಿ HPCL ನಲ್ಲಿ"',
  mr: 'सांगा: "50 लिटर डिझेल, 4600 रुपये HPCL मध्ये"',
  bn: 'বলুন: "50 লিটার ডিজেল, 4600 টাকা HPCL-এ"',
  ml: 'പറയൂ: "50 ലിറ്റർ ഡീസൽ, 4600 രൂപ HPCL-ൽ"',
};


const INITIAL_ENTRIES: FuelEntry[] = [
  { id: "1", date: "07 Jun 2026", litres: 120, pricePerLitre: 89.5, totalCost: 10740, fuelType: "Diesel", station: "HPCL, Nagpur bypass", odometer: "1,26,842" },
  { id: "2", date: "02 Jun 2026", litres: 80, pricePerLitre: 89.2, totalCost: 7136, fuelType: "Diesel", station: "Bharat Petroleum, Wardha", odometer: "1,23,200" },
];

function parseSpeech(text: string): Partial<FuelEntry> {
  const t = text.toLowerCase();
  const result: Partial<FuelEntry> = {};

  // Extract litres
  const litreMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:litr|ltr|liter|लीटर|লিটার|లీటర్|லிட்டர்|ಲೀಟರ್|लिटर|ലിറ്റർ)/i);
  if (litreMatch) result.litres = parseFloat(litreMatch[1]);

  // Extract total cost / rupees
  const costMatch = t.match(/(\d[\d,]*)\s*(?:rupee|rupay|rupe|rs|₹|रुपये?|রুপি|రూపాయ|ரூபாய்|ರೂಪಾಯಿ|रुपया|रुपए|रूपये|രൂപ)/i);
  if (costMatch) result.totalCost = parseInt(costMatch[1].replace(/,/g, ""));

  // Derive price per litre
  if (result.litres && result.totalCost) {
    result.pricePerLitre = parseFloat((result.totalCost / result.litres).toFixed(2));
  }

  // Extract fuel type
  if (/diesel|डीजल|डिझेल|ডিজেল|డీజిల్|டீசல்|ಡೀಸೆಲ್|ഡീസൽ/i.test(t)) result.fuelType = "Diesel";
  else if (/petrol|पेट्रोल|পেট্রোল|పెట్రోల్|பெட்ரோல்|ಪೆಟ್ರೋಲ್|പെട്രോൾ/i.test(t)) result.fuelType = "Petrol";
  else if (/cng|सीएनजी/i.test(t)) result.fuelType = "CNG";

  // Extract station name — text after "at" / "on" / "में" etc.
  const stationMatch = text.match(/(?:at|on|in|at the|में|पर|नगर|স্টেশন|లో|ல்|ನಲ್ಲಿ|ൽ)\s+([A-Z][a-zA-Z\s]+?)(?:\s*$|,|\.|at)/i);
  if (stationMatch) result.station = stationMatch[1].trim();

  return result;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function FuelExpenseVoice({ isOpen, onClose }: Props) {
  const { lang, t } = useLang();
  const [mode, setMode] = useState<"voice" | "manual">("voice");
  const [listening, setListening] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState<Partial<FuelEntry> | null>(null);
  const [entries, setEntries] = useState<FuelEntry[]>(INITIAL_ENTRIES);
  const [showLog, setShowLog] = useState(false);
  const [waveActive, setWaveActive] = useState(false);

  // Manual form state
  const [form, setForm] = useState({ litres: "", totalCost: "", pricePerLitre: "", fuelType: "Diesel", station: "", odometer: "" });

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  async function handlePhotoOCR(file: File) {
    setAnalyzing(true);
    setTranscript("Analyzing receipt photo...");
    try {
      const result = await aiService.analyzeReceipt(file);
      if (result.ocr_result) {
        const o = result.ocr_result;
        setParsed({
          litres: o.litres || 0,
          totalCost: o.amount || 0,
          pricePerLitre: o.price_per_litre || 0,
          fuelType: o.fuel_type || "Diesel",
          station: o.fuel_station || "OCR Station",
          date: o.date || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        });
        setTranscript("Receipt analyzed successfully!");
      }
    } catch (err) {
      console.error("OCR analysis failed", err);
      setTranscript("Failed to analyze receipt.");
    } finally {
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setParsed(null);
      setTranscript("");
      setMode("voice");
      setShowLog(false);
    }
  }, [isOpen]);

  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input not supported in this browser. Please use Chrome.");
      return;
    }
    const rec = new SR() as SpeechRecognition;
    rec.lang = SPEECH_LANG[lang] || "en-IN";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      const p = parseSpeech(text);
      setParsed({ ...p, date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) });
      setListening(false);
      setWaveActive(false);
    };
    rec.onerror = () => { setListening(false); setWaveActive(false); };
    rec.onend = () => { setListening(false); setWaveActive(false); };
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

  function saveVoiceEntry() {
    if (!parsed) return;
    const entry: FuelEntry = {
      id: Date.now().toString(),
      date: parsed.date || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      litres: parsed.litres || 0,
      pricePerLitre: parsed.pricePerLitre || 0,
      totalCost: parsed.totalCost || 0,
      fuelType: parsed.fuelType || "Diesel",
      station: parsed.station || "—",
      odometer: "—",
    };
    setEntries(prev => [entry, ...prev]);
    setParsed(null);
    setTranscript("");
    setShowLog(true);
  }

  function saveManualEntry() {
    const entry: FuelEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      litres: parseFloat(form.litres) || 0,
      pricePerLitre: form.pricePerLitre ? parseFloat(form.pricePerLitre) : (parseFloat(form.totalCost) / parseFloat(form.litres)),
      totalCost: parseFloat(form.totalCost) || 0,
      fuelType: form.fuelType,
      station: form.station || "—",
      odometer: form.odometer || "—",
    };
    setEntries(prev => [entry, ...prev]);
    setForm({ litres: "", totalCost: "", pricePerLitre: "", fuelType: "Diesel", station: "", odometer: "" });
    setShowLog(true);
  }

  const totalSpent = entries.reduce((s, e) => s + e.totalCost, 0);
  const totalLitres = entries.reduce((s, e) => s + e.litres, 0);

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
        style={{ maxHeight: "90vh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Fuel size={20} className="text-[#1a4999]" />
            <span className="text-[#0f1c35]" style={{ fontWeight: 700 }}>{t.fuelExpense}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLog(!showLog)}
              className="text-xs text-[#1a4999] underline"
            >
              {t.fuelLog} ({entries.length})
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 80px)" }}>
          {/* Mode tabs */}
          <div className="flex mx-5 mt-4 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setMode("voice")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${mode === "voice" ? "bg-white shadow text-[#1a4999]" : "text-gray-500"}`}
              style={{ fontWeight: 600 }}
            >
              <Mic size={15} />
              {t.tapToSpeak.split(" ")[0]}
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${mode === "manual" ? "bg-white shadow text-[#1a4999]" : "text-gray-500"}`}
              style={{ fontWeight: 600 }}
            >
              <Pencil size={15} />
              {t.addManually.split(" ").slice(-1)[0]}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* ── VOICE MODE ── */}
            {mode === "voice" && !showLog && (
              <motion.div
                key="voice"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-5 pb-6"
              >
                {/* Prompt hint */}
                <p className="text-gray-400 text-xs text-center mt-4 mb-6 px-4">
                  {FUEL_PROMPTS[lang] || FUEL_PROMPTS.en}
                </p>

                {/* Mic & Photo buttons */}
                <div className="flex flex-col items-center mb-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      {/* Wave rings */}
                      {waveActive && [1, 2, 3].map(i => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 rounded-full border-2 border-[#1a4999]/30"
                          initial={{ scale: 1, opacity: 0.6 }}
                          animate={{ scale: 1 + i * 0.35, opacity: 0 }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3, ease: "easeOut" }}
                        />
                      ))}
                      <button
                        onClick={listening ? stopListening : startListening}
                        className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all ${
                          listening
                            ? "bg-red-500 scale-110"
                            : "bg-[#1a4999] hover:bg-[#163d80]"
                        }`}
                      >
                        {listening
                          ? <MicOff size={36} className="text-white" />
                          : <Mic size={36} className="text-white" />
                        }
                      </button>
                    </div>
                    
                    <label className={`w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg transition-all cursor-pointer ${analyzing ? "bg-gray-100" : "bg-orange-500 hover:bg-orange-600"}`}>
                      {analyzing ? (
                        <div className="w-8 h-8 border-3 border-[#1a4999] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Camera size={28} className="text-white" />
                          <span className="text-[10px] text-white font-bold mt-1">PHOTO</span>
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files?.[0] && handlePhotoOCR(e.target.files[0])} />
                        </>
                      )}
                    </label>
                  </div>
                  
                  <p className="mt-4 text-sm text-center" style={{ fontWeight: 600, color: listening ? "#ef4444" : "#1a4999" }}>
                    {listening ? t.listening : analyzing ? "AI analyzing photo..." : "Tap Mic to Speak or Camera for Photo"}
                  </p>
                </div>

                {/* Transcript */}
                {transcript && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 text-sm text-[#1a4999] text-center italic">
                    "{transcript}"
                  </div>
                )}

                {/* Parsed result */}
                {parsed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-[#1a4999]/20 rounded-2xl p-4 mb-4"
                  >
                    <p className="text-xs text-gray-400 mb-3" style={{ fontWeight: 600 }}>{t.detectedEntry}</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <EditableField
                        label="Litres"
                        value={parsed.litres?.toString() || ""}
                        onChange={v => setParsed(p => ({ ...p, litres: parseFloat(v) || 0 }))}
                        suffix="L"
                      />
                      <EditableField
                        label="Total Cost"
                        value={parsed.totalCost?.toString() || ""}
                        onChange={v => setParsed(p => ({ ...p, totalCost: parseFloat(v) || 0 }))}
                        prefix="₹"
                      />
                      <EditableField
                        label="Price/Litre"
                        value={parsed.pricePerLitre?.toFixed(2) || ""}
                        onChange={v => setParsed(p => ({ ...p, pricePerLitre: parseFloat(v) || 0 }))}
                        prefix="₹"
                      />
                      <EditableField
                        label="Fuel Type"
                        value={parsed.fuelType || "Diesel"}
                        onChange={v => setParsed(p => ({ ...p, fuelType: v }))}
                      />
                    </div>
                    <EditableField
                      label="Station"
                      value={parsed.station || ""}
                      onChange={v => setParsed(p => ({ ...p, station: v }))}
                      full
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => { setParsed(null); setTranscript(""); }}
                        className="flex-1 border-2 border-gray-200 text-gray-500 rounded-xl py-3 text-sm"
                        style={{ fontWeight: 600 }}
                      >
                        {t.retake}
                      </button>
                      <button
                        onClick={saveVoiceEntry}
                        className="flex-1 bg-[#1a4999] text-white rounded-xl py-3 flex items-center justify-center gap-2 text-sm"
                        style={{ fontWeight: 600 }}
                      >
                        <Check size={16} />
                        {t.saveEntry}
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── MANUAL MODE ── */}
            {mode === "manual" && !showLog && (
              <motion.div
                key="manual"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-5 pb-6 pt-4"
              >
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Litres *</label>
                    <input
                      type="number"
                      value={form.litres}
                      onChange={e => setForm(f => ({ ...f, litres: e.target.value }))}
                      placeholder="e.g. 80"
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-[#1a4999] text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Total Cost (₹) *</label>
                    <input
                      type="number"
                      value={form.totalCost}
                      onChange={e => setForm(f => ({ ...f, totalCost: e.target.value }))}
                      placeholder="e.g. 7200"
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-[#1a4999] text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Price/Litre (₹)</label>
                    <input
                      type="number"
                      value={form.pricePerLitre}
                      onChange={e => setForm(f => ({ ...f, pricePerLitre: e.target.value }))}
                      placeholder="Auto-calc"
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-[#1a4999] text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Fuel Type</label>
                    <select
                      value={form.fuelType}
                      onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-[#1a4999] text-sm bg-white"
                    >
                      <option>Diesel</option>
                      <option>Petrol</option>
                      <option>CNG</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-gray-500 mb-1 block">Station Name</label>
                  <input
                    type="text"
                    value={form.station}
                    onChange={e => setForm(f => ({ ...f, station: e.target.value }))}
                    placeholder="e.g. HPCL, Nagpur bypass"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-[#1a4999] text-sm"
                  />
                </div>
                <div className="mb-5">
                  <label className="text-xs text-gray-500 mb-1 block">Odometer (km)</label>
                  <input
                    type="text"
                    value={form.odometer}
                    onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))}
                    placeholder="e.g. 1,26,842"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-[#1a4999] text-sm"
                  />
                </div>
                <button
                  onClick={saveManualEntry}
                  disabled={!form.litres || !form.totalCost}
                  className="w-full bg-[#1a4999] hover:bg-[#163d80] disabled:opacity-40 text-white rounded-xl py-3.5 flex items-center justify-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  <Plus size={18} />
                  {t.saveEntry}
                </button>
              </motion.div>
            )}

            {/* ── FUEL LOG ── */}
            {showLog && (
              <motion.div
                key="log"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-5 pb-6"
              >
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
                  <div className="bg-[#1a4999] rounded-2xl p-4 text-white">
                    <p className="text-blue-200 text-xs mb-1">{t.totalSpentLabel}</p>
                    <p style={{ fontWeight: 700, fontSize: "1.3rem" }}>₹{totalSpent.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                    <p className="text-orange-400 text-xs mb-1">{t.totalFilledLabel}</p>
                    <p className="text-orange-600" style={{ fontWeight: 700, fontSize: "1.3rem" }}>{totalLitres} L</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontWeight: 700 }} className="text-[#0f1c35]">{t.fuelLog}</p>
                  <button
                    onClick={() => setShowLog(false)}
                    className="text-xs text-[#1a4999]"
                    style={{ fontWeight: 600 }}
                  >
                    + {t.addNew}
                  </button>
                </div>

                <div className="space-y-3">
                  {entries.map(e => (
                    <div key={e.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[#0f1c35] text-sm" style={{ fontWeight: 600 }}>{e.fuelType} · {e.litres} L</p>
                          <p className="text-gray-400 text-xs">{e.station}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#1a4999]" style={{ fontWeight: 700 }}>₹{e.totalCost.toLocaleString("en-IN")}</p>
                          <p className="text-gray-400 text-xs">₹{e.pricePerLitre.toFixed(1)}/L</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <span className="text-gray-400 text-xs">{e.date}</span>
                        {e.odometer !== "—" && (
                          <span className="text-gray-400 text-xs">{e.odometer} km</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function EditableField({
  label, value, onChange, prefix, suffix, full
}: {
  label: string; value: string; onChange: (v: string) => void;
  prefix?: string; suffix?: string; full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <div className="flex items-center border-2 border-[#1a4999]/30 focus-within:border-[#1a4999] rounded-lg overflow-hidden transition-colors">
        {prefix && <span className="px-2 text-sm text-gray-400">{prefix}</span>}
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-2 py-2 text-sm outline-none text-[#0f1c35] bg-white"
          style={{ fontWeight: 600 }}
        />
        {suffix && <span className="px-2 text-sm text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}
