import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Fuel, Utensils, Wrench, ShieldCheck, IndianRupee, Plus,
  TrendingDown, TrendingUp, Trash2,
  Wallet, ReceiptText, ChartPie, CheckCircle, Mic
} from "lucide-react";
import { useLang } from "../LanguageContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { FinanceVoiceEntry, type ParsedFinanceEntry } from "./FinanceVoiceEntry";

// ── Types ──────────────────────────────────────────────────────────────────

type CategoryKey = "fuel" | "food" | "toll" | "maintenance" | "insurance" | "loading" | "other";
type EntryType = "expense" | "income";

interface Entry {
  id: string;
  type: EntryType;
  category: CategoryKey;
  amount: number;
  note: string;
  date: string; // "YYYY-MM-DD"
  trip?: string;
}

// ── Constants (labels resolved inside component via t) ─────────────────────

const CATEGORY_ICONS: Record<CategoryKey, React.ReactNode> = {
  fuel:        <Fuel size={16} />,
  food:        <Utensils size={16} />,
  toll:        <IndianRupee size={16} />,
  maintenance: <Wrench size={16} />,
  insurance:   <ShieldCheck size={16} />,
  loading:     <Wallet size={16} />,
  other:       <ReceiptText size={16} />,
};

const CATEGORY_STYLE: Record<CategoryKey, { color: string; bg: string }> = {
  fuel:        { color: "#f07c1e", bg: "#fff3e8" },
  food:        { color: "#16a34a", bg: "#f0fdf4" },
  toll:        { color: "#9333ea", bg: "#faf5ff" },
  maintenance: { color: "#dc2626", bg: "#fef2f2" },
  insurance:   { color: "#0ea5e9", bg: "#f0f9ff" },
  loading:     { color: "#d97706", bg: "#fffbeb" },
  other:       { color: "#64748b", bg: "#f8fafc" },
};

const INCOME_CATEGORIES: CategoryKey[] = ["loading", "other"];
const EXPENSE_CATEGORIES: CategoryKey[] = ["fuel", "food", "toll", "maintenance", "insurance", "other"];

const PIE_COLORS = ["#f07c1e", "#16a34a", "#9333ea", "#dc2626", "#0ea5e9", "#d97706", "#64748b"];

const today = () => new Date().toISOString().split("T")[0];

const seed = (): Entry[] => {
  const d = (offset: number) => {
    const dt = new Date(); dt.setDate(dt.getDate() - offset);
    return dt.toISOString().split("T")[0];
  };
  return [
    { id: "s1", type: "expense", category: "fuel",        amount: 9200,  note: "HPCL Nagpur bypass — 100L diesel",   date: d(0), trip: "Mumbai → Nagpur" },
    { id: "s2", type: "income",  category: "loading",     amount: 42000, note: "Freight payment — steel rods",       date: d(1), trip: "Mumbai → Nagpur" },
    { id: "s3", type: "expense", category: "toll",        amount: 1240,  note: "NH-44 toll charges",                 date: d(1), trip: "Mumbai → Nagpur" },
    { id: "s4", type: "expense", category: "food",        amount: 380,   note: "Shanti Dhaba dinner",                date: d(2) },
    { id: "s5", type: "expense", category: "maintenance", amount: 3200,  note: "Tyre puncture repair × 2",           date: d(3), trip: "Pune → Hyderabad" },
    { id: "s6", type: "expense", category: "fuel",        amount: 7136,  note: "BP Wardha — 80L diesel",             date: d(5) },
    { id: "s7", type: "income",  category: "loading",     amount: 38000, note: "Freight — auto parts",               date: d(6), trip: "Pune → Hyderabad" },
    { id: "s8", type: "expense", category: "food",        amount: 420,   note: "Punjabi Dhaba, breakfast + lunch",   date: d(7) },
    { id: "s9", type: "expense", category: "insurance",   amount: 24000, note: "Annual truck insurance renewal",     date: d(10) },
    { id: "s10",type: "expense", category: "toll",        amount: 980,   note: "Hyderabad bypass toll",              date: d(11) },
  ];
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function fmtDate(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

type Tab = "overview" | "entries" | "add";
type Period = "week" | "month" | "all";

// ── Main Component ─────────────────────────────────────────────────────────

export function FinanceTracker() {
  const { lang, t } = useLang();

  const CATEGORY_META: Record<CategoryKey, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    fuel:        { label: t.catFuel,        icon: CATEGORY_ICONS.fuel,        ...CATEGORY_STYLE.fuel },
    food:        { label: t.catFood,        icon: CATEGORY_ICONS.food,        ...CATEGORY_STYLE.food },
    toll:        { label: t.catToll,        icon: CATEGORY_ICONS.toll,        ...CATEGORY_STYLE.toll },
    maintenance: { label: t.catMaintenance, icon: CATEGORY_ICONS.maintenance, ...CATEGORY_STYLE.maintenance },
    insurance:   { label: t.catInsurance,   icon: CATEGORY_ICONS.insurance,   ...CATEGORY_STYLE.insurance },
    loading:     { label: t.catLoading,     icon: CATEGORY_ICONS.loading,     ...CATEGORY_STYLE.loading },
    other:       { label: t.catOther,       icon: CATEGORY_ICONS.other,       ...CATEGORY_STYLE.other },
  };
  const [entries, setEntries] = useState<Entry[]>(seed());
  const [tab, setTab] = useState<Tab>("overview");
  const [period, setPeriod] = useState<Period>("month");
  const [filterCat, setFilterCat] = useState<CategoryKey | "all">("all");
  const [filterType, setFilterType] = useState<EntryType | "all">("all");
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null);
  const [showVoice, setShowVoice] = useState(false);

  // ── Add form state ──
  const [form, setForm] = useState({
    type: "expense" as EntryType,
    category: "fuel" as CategoryKey,
    amount: "",
    note: "",
    date: today(),
    trip: "",
  });
  const [saved, setSaved] = useState(false);

  // ── Period filter ──
  const filtered = useMemo(() => {
    const now = new Date();
    return entries.filter(e => {
      if (period === "week") {
        const diff = (now.getTime() - new Date(e.date).getTime()) / 86400000;
        if (diff > 7) return false;
      }
      if (period === "month") {
        const d = new Date(e.date);
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }
      if (filterCat !== "all" && e.category !== filterCat) return false;
      if (filterType !== "all" && e.type !== filterType) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, period, filterCat, filterType]);

  const totalIncome  = filtered.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpense = filtered.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const netProfit    = totalIncome - totalExpense;

  // ── Pie data ──
  const pieData = useMemo(() => {
    const map: Partial<Record<CategoryKey, number>> = {};
    filtered.filter(e => e.type === "expense").forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([k, v]) => ({
      name: CATEGORY_META[k as CategoryKey].label,
      value: v,
    }));
  }, [filtered]);

  // ── Bar chart (last 7 days) ──
  const barData = useMemo(() => {
    const days: { label: string; income: number; expense: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().split("T")[0];
      const label = dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      const dayEntries = entries.filter(e => e.date === key);
      days.push({
        label,
        income:  dayEntries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0),
        expense: dayEntries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0),
      });
    }
    return days;
  }, [entries]);

  function handleAdd() {
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    const entry: Entry = {
      id: Date.now().toString(),
      type: form.type,
      category: form.category,
      amount: parseFloat(form.amount),
      note: form.note || CATEGORY_META[form.category].label,
      date: form.date,
      trip: form.trip || undefined,
    };
    setEntries(prev => [entry, ...prev]);
    setForm({ type: "expense", category: "fuel", amount: "", note: "", date: today(), trip: "" });
    setSaved(true);
    setTimeout(() => { setSaved(false); setTab("entries"); }, 1200);
  }

  function deleteEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id));
    setShowDeleteId(null);
  }

  function handleVoiceSave(entry: ParsedFinanceEntry) {
    setEntries(prev => [{ ...entry, id: Date.now().toString() }, ...prev]);
    setSaved(true);
    setTab("entries");
    setTimeout(() => setSaved(false), 1200);
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-28">
      <AnimatePresence>
        {showVoice && (
          <FinanceVoiceEntry
            isOpen={showVoice}
            onClose={() => setShowVoice(false)}
            onSave={handleVoiceSave}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-[#1a4999] px-4 pt-10 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white" style={{ fontSize: "1.25rem", fontWeight: 700 }}>{t.financeTracker}</h1>
            <p className="text-blue-200 text-sm mt-0.5">{t.trackIncomeExpenses}</p>
          </div>
          <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVoice(true)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2.5 rounded-xl transition-colors"
            style={{ fontWeight: 700 }}
          >
            <Mic size={16} />
            <span className="text-sm hidden sm:inline">{t.addVoiceEntry}</span>
          </button>
          <button
            onClick={() => setTab("add")}
            className="flex items-center gap-2 bg-[#f07c1e] text-white px-4 py-2.5 rounded-xl shadow"
            style={{ fontWeight: 700 }}
          >
            <Plus size={16} /> {t.addEntry}
          </button>
          </div>
        </div>

        {/* Summary pills */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1 text-green-300 text-xs mb-1">
              <TrendingUp size={12} /> {t.income}
            </div>
            <p className="text-white" style={{ fontWeight: 700, fontSize: "1rem" }}>{formatINR(totalIncome)}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1 text-red-300 text-xs mb-1">
              <TrendingDown size={12} /> {t.expense}
            </div>
            <p className="text-white" style={{ fontWeight: 700, fontSize: "1rem" }}>{formatINR(totalExpense)}</p>
          </div>
          <div className={`rounded-2xl p-3 ${netProfit >= 0 ? "bg-green-500/20" : "bg-red-500/20"}`}>
            <div className={`text-xs mb-1 ${netProfit >= 0 ? "text-green-200" : "text-red-200"}`}>{t.net}</div>
            <p className={`${netProfit >= 0 ? "text-green-200" : "text-red-300"}`} style={{ fontWeight: 700, fontSize: "1rem" }}>
              {netProfit >= 0 ? "+" : ""}{formatINR(netProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 px-4 mt-4">
        {(["week", "month", "all"] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${
              period === p ? "bg-[#1a4999] text-white shadow" : "bg-white text-gray-500"
            }`}
            style={{ fontWeight: 600 }}
          >
            {p === "week" ? t.thisWeek : p === "month" ? t.thisMonth : t.allTime}
          </button>
        ))}
      </div>

      {/* Tab nav */}
      <div className="flex mx-4 mt-4 bg-white rounded-2xl p-1 shadow-sm">
        {([
          { key: "overview", label: t.overview, icon: <ChartPie size={15} /> },
          { key: "entries",  label: t.entries,  icon: <ReceiptText size={15} /> },
          { key: "add",      label: t.addNew,   icon: <Plus size={15} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm transition-all ${
              tab === tb.key ? "bg-[#1a4999] text-white shadow" : "text-gray-500 hover:text-gray-700"
            }`}
            style={{ fontWeight: 600 }}
          >
            {tb.icon}{tb.label}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4">
        <AnimatePresence mode="wait">

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {/* Expense by category pie */}
              <div className="bg-white rounded-3xl p-4 shadow-sm mb-4">
                <p style={{ fontWeight: 700 }} className="text-[#0f1c35] mb-3">{t.expenseBreakdown}</p>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart key={lang}>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {pieData.map((entry, i) => <Cell key={`pie-cell-${entry.name}-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatINR(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">{t.noEntriesFound}</p>
                )}
              </div>

              {/* 7-day bar chart */}
              <div className="bg-white rounded-3xl p-4 shadow-sm mb-4">
                <p style={{ fontWeight: 700 }} className="text-[#0f1c35] mb-3">{t.last7Days}</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart key={lang} data={barData} barSize={10}>
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} />
                    <Tooltip formatter={(v: number) => formatINR(v)} />
                    <Bar dataKey="income"  fill="#16a34a" radius={[4, 4, 0, 0]} name={t.income} />
                    <Bar dataKey="expense" fill="#f07c1e" radius={[4, 4, 0, 0]} name={t.expense} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category summary list */}
              <div className="bg-white rounded-3xl p-4 shadow-sm mb-4">
                <p style={{ fontWeight: 700 }} className="text-[#0f1c35] mb-3">{t.byCategory}</p>
                {(Object.keys(CATEGORY_META) as CategoryKey[]).map(cat => {
                  const total = filtered.filter(e => e.category === cat && e.type === "expense").reduce((s, e) => s + e.amount, 0);
                  if (!total) return null;
                  const pct = totalExpense ? Math.round((total / totalExpense) * 100) : 0;
                  const meta = CATEGORY_META[cat];
                  return (
                    <div key={cat} className="mb-3 last:mb-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: meta.bg, color: meta.color }}>
                            {meta.icon}
                          </div>
                          <span className="text-sm text-[#0f1c35]" style={{ fontWeight: 600 }}>{meta.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm" style={{ fontWeight: 700, color: meta.color }}>{formatINR(total)}</span>
                          <span className="text-xs text-gray-400 ml-1">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: meta.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── ENTRIES ── */}
          {tab === "entries" && (
            <motion.div key="entries" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {/* Filters */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as EntryType | "all")}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none text-[#0f1c35] flex-shrink-0"
                  style={{ fontWeight: 600 }}
                >
                  <option value="all">{t.allTypes}</option>
                  <option value="income">{t.income}</option>
                  <option value="expense">{t.expense}</option>
                </select>
                <select
                  value={filterCat}
                  onChange={e => setFilterCat(e.target.value as CategoryKey | "all")}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none text-[#0f1c35] flex-shrink-0"
                  style={{ fontWeight: 600 }}
                >
                  <option value="all">{t.allCategories}</option>
                  {(Object.keys(CATEGORY_META) as CategoryKey[]).map(k => (
                    <option key={k} value={k}>{CATEGORY_META[k].label}</option>
                  ))}
                </select>
              </div>

              {filtered.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center text-gray-400 shadow-sm">
                  <ReceiptText size={36} className="mx-auto mb-3 text-gray-200" />
                  <p>{t.noEntriesFound}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(e => {
                    const meta = CATEGORY_META[e.category];
                    return (
                      <motion.div
                        key={e.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg, color: meta.color }}>
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#0f1c35] text-sm truncate" style={{ fontWeight: 600 }}>{e.note}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-gray-400 text-xs">{fmtDate(e.date)}</span>
                            {e.trip && <span className="text-xs text-[#1a4999] bg-blue-50 px-2 py-0.5 rounded-full truncate max-w-[120px]">{e.trip}</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p style={{ fontWeight: 700, color: e.type === "income" ? "#16a34a" : "#dc2626", fontSize: "0.95rem" }}>
                            {e.type === "income" ? "+" : "-"}{formatINR(e.amount)}
                          </p>
                          <button
                            onClick={() => setShowDeleteId(e.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors mt-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── ADD ENTRY ── */}
          {tab === "add" && (
            <motion.div key="add" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="bg-white rounded-3xl p-5 shadow-sm">

                {/* Type toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
                  <button
                    onClick={() => setForm(f => ({ ...f, type: "expense", category: "fuel" }))}
                    className={`flex-1 py-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${
                      form.type === "expense" ? "bg-red-500 text-white shadow" : "text-gray-500"
                    }`}
                    style={{ fontWeight: 700 }}
                  >
                    <TrendingDown size={16} /> {t.expense}
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, type: "income", category: "loading" }))}
                    className={`flex-1 py-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${
                      form.type === "income" ? "bg-green-500 text-white shadow" : "text-gray-500"
                    }`}
                    style={{ fontWeight: 700 }}
                  >
                    <TrendingUp size={16} /> {t.income}
                  </button>
                </div>

                {/* Category grid */}
                <p className="text-xs text-gray-400 mb-2" style={{ fontWeight: 600 }}>{t.allCategories.toUpperCase()}</p>
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {(form.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => {
                    const meta = CATEGORY_META[cat];
                    const active = form.category === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setForm(f => ({ ...f, category: cat }))}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                          active ? "border-[#1a4999] bg-[#1a4999]/5" : "border-gray-100 bg-gray-50"
                        }`}
                      >
                        <div style={{ color: active ? "#1a4999" : meta.color }}>{meta.icon}</div>
                        <span className="text-[10px] text-center leading-tight" style={{ fontWeight: 600, color: active ? "#1a4999" : "#4a5f7a" }}>
                          {meta.label.split("/")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Amount */}
                <p className="text-xs text-gray-400 mb-2" style={{ fontWeight: 600 }}>{t.amountLabel}</p>
                <div className="flex items-center border-2 rounded-xl overflow-hidden focus-within:border-[#1a4999] border-gray-200 mb-4 transition-colors">
                  <span className="px-4 text-gray-400 text-lg">₹</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    className="flex-1 py-4 pr-4 outline-none text-[#0f1c35] bg-white"
                    style={{ fontWeight: 700, fontSize: "1.3rem" }}
                  />
                </div>

                {/* Note */}
                <p className="text-xs text-gray-400 mb-2" style={{ fontWeight: 600 }}>{t.noteDescription}</p>
                <input
                  type="text"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder={`e.g. ${CATEGORY_META[form.category].label} at highway`}
                  className="w-full border-2 border-gray-200 focus:border-[#1a4999] rounded-xl px-4 py-3 text-sm outline-none text-[#0f1c35] mb-4 transition-colors"
                />

                {/* Date & Trip row */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <p className="text-xs text-gray-400 mb-2" style={{ fontWeight: 600 }}>{t.date.toUpperCase()}</p>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full border-2 border-gray-200 focus:border-[#1a4999] rounded-xl px-3 py-3 text-sm outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-2" style={{ fontWeight: 600 }}>{t.tripOptional}</p>
                    <input
                      type="text"
                      value={form.trip}
                      onChange={e => setForm(f => ({ ...f, trip: e.target.value }))}
                      placeholder="e.g. Mumbai → Pune"
                      className="w-full border-2 border-gray-200 focus:border-[#1a4999] rounded-xl px-3 py-3 text-sm outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Save button */}
                <AnimatePresence mode="wait">
                  {saved ? (
                    <motion.div
                      key="saved"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full bg-green-500 text-white rounded-xl py-4 flex items-center justify-center gap-2"
                      style={{ fontWeight: 700 }}
                    >
                      <CheckCircle size={20} /> {t.entrySaved}
                    </motion.div>
                  ) : (
                    <motion.button
                      key="save"
                      onClick={handleAdd}
                      disabled={!form.amount || parseFloat(form.amount) <= 0}
                      className={`w-full rounded-xl py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${
                        form.type === "income" ? "bg-green-500 hover:bg-green-600" : "bg-[#1a4999] hover:bg-[#163d80]"
                      } text-white`}
                      style={{ fontWeight: 700 }}
                    >
                      <Plus size={20} />
                      {form.type === "income" ? t.addIncome : t.addExpense}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Delete confirm dialog */}
      <AnimatePresence>
        {showDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteId(null)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <Trash2 size={28} className="text-red-500 mx-auto mb-3" />
              <p className="text-[#0f1c35] text-center mb-1" style={{ fontWeight: 700 }}>{t.deleteEntry}</p>
              <p className="text-gray-400 text-sm text-center mb-5">{t.deleteConfirm}</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteId(null)} className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-gray-600" style={{ fontWeight: 600 }}>
                  {t.cancel}
                </button>
                <button onClick={() => deleteEntry(showDeleteId)} className="flex-1 bg-red-500 text-white rounded-xl py-3" style={{ fontWeight: 700 }}>
                  {t.deleteLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating voice button */}
      <button
        onClick={() => setShowVoice(true)}
        className="fixed bottom-24 right-4 z-30 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-xl lg:bottom-6 transition-colors"
        style={{ fontWeight: 700 }}
      >
        <Mic size={18} />
        <span className="text-sm">{t.voiceEntry}</span>
      </button>
    </div>
  );
}
