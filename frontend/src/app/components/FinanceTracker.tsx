import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Fuel, Utensils, Wrench, ShieldCheck, IndianRupee, Plus,
  TrendingDown, TrendingUp, Trash2,
  Wallet, ReceiptText, ChartPie, CheckCircle, Mic, Truck
} from "lucide-react";
import { useLang } from "../LanguageContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { FinanceVoiceEntry, type ParsedFinanceEntry } from "./FinanceVoiceEntry";
import { expenseService } from "../api/expense.service";
import { vehicleService } from "../api/vehicle.service";

// ── Types ──────────────────────────────────────────────────────────────────

type CategoryKey = "fuel" | "food" | "toll" | "maintenance" | "insurance" | "loading" | "other" | "PARKING" | "REPAIR";
type EntryType = "expense" | "income";

interface Entry {
  id: string | number;
  type: EntryType;
  category: string;
  amount: number;
  note: string;
  date: string; // "YYYY-MM-DD"
  trip?: string;
}

// ── Constants (labels resolved inside component via t) ─────────────────────

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  fuel:        <Fuel size={16} />,
  FUEL:        <Fuel size={16} />,
  food:        <Utensils size={16} />,
  toll:        <IndianRupee size={16} />,
  TOLL:        <IndianRupee size={16} />,
  maintenance: <Wrench size={16} />,
  REPAIR:      <Wrench size={16} />,
  insurance:   <ShieldCheck size={16} />,
  loading:     <Wallet size={16} />,
  LOADING:     <Wallet size={16} />,
  other:       <ReceiptText size={16} />,
  OTHER:       <ReceiptText size={16} />,
  PARKING:     <IndianRupee size={16} />,
};

const CATEGORY_STYLE: Record<string, { color: string; bg: string }> = {
  fuel:        { color: "#f07c1e", bg: "#fff3e8" },
  FUEL:        { color: "#f07c1e", bg: "#fff3e8" },
  food:        { color: "#16a34a", bg: "#f0fdf4" },
  toll:        { color: "#9333ea", bg: "#faf5ff" },
  TOLL:        { color: "#9333ea", bg: "#faf5ff" },
  maintenance: { color: "#dc2626", bg: "#fef2f2" },
  REPAIR:      { color: "#dc2626", bg: "#fef2f2" },
  insurance:   { color: "#0ea5e9", bg: "#f0f9ff" },
  loading:     { color: "#d97706", bg: "#fffbeb" },
  LOADING:     { color: "#d97706", bg: "#fffbeb" },
  other:       { color: "#64748b", bg: "#f8fafc" },
  OTHER:       { color: "#64748b", bg: "#f8fafc" },
  PARKING:     { color: "#9333ea", bg: "#faf5ff" },
};

const today = () => new Date().toISOString().split("T")[0];

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

  const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    fuel:        { label: t.catFuel,        icon: CATEGORY_ICONS.fuel,        ...CATEGORY_STYLE.fuel },
    FUEL:        { label: t.catFuel,        icon: CATEGORY_ICONS.FUEL,        ...CATEGORY_STYLE.FUEL },
    food:        { label: t.catFood,        icon: CATEGORY_ICONS.food,        ...CATEGORY_STYLE.food },
    toll:        { label: t.catToll,        icon: CATEGORY_ICONS.toll,        ...CATEGORY_STYLE.toll },
    TOLL:        { label: t.catToll,        icon: CATEGORY_ICONS.TOLL,        ...CATEGORY_STYLE.TOLL },
    maintenance: { label: t.catMaintenance, icon: CATEGORY_ICONS.maintenance, ...CATEGORY_STYLE.maintenance },
    REPAIR:      { label: t.catMaintenance, icon: CATEGORY_ICONS.REPAIR,      ...CATEGORY_STYLE.REPAIR },
    insurance:   { label: t.catInsurance,   icon: CATEGORY_ICONS.insurance,   ...CATEGORY_STYLE.insurance },
    loading:     { label: t.catLoading,     icon: CATEGORY_ICONS.loading,     ...CATEGORY_STYLE.loading },
    LOADING:     { label: t.catLoading,     icon: CATEGORY_ICONS.LOADING,     ...CATEGORY_STYLE.LOADING },
    FREIGHT:     { label: "Freight",        icon: <TrendingUp size={16} />,   color: "#16a34a", bg: "#f0fdf4" },
    other:       { label: t.catOther,       icon: CATEGORY_ICONS.other,       ...CATEGORY_STYLE.other },
    OTHER:       { label: t.catOther,       icon: CATEGORY_ICONS.OTHER,       ...CATEGORY_STYLE.OTHER },
    PARKING:     { label: "Parking",        icon: CATEGORY_ICONS.PARKING,     ...CATEGORY_STYLE.PARKING },
  };

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [period, setPeriod] = useState<Period>("month");
  const [filterCat, setFilterCat] = useState<string | "all">("all");
  const [filterType, setFilterType] = useState<EntryType | "all">("all");
  const [showDeleteId, setShowDeleteId] = useState<string | number | null>(null);
  const [showVoice, setShowVoice] = useState(false);
  const [vehicles, setVehicles] = useState<Array<{id: number, vehicle_number: string, vehicle_type: string}>>([]);

  // ── Add form state ──
  const [form, setForm] = useState({
    type: "expense" as EntryType,
    category: "FUEL" as string,
    amount: "",
    note: "",
    date: today(),
    trip: "",
    vehicle: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchEntries();
    vehicleService.getVehicles().then(setVehicles).catch(console.error);
  }, []);

  async function fetchEntries() {
    try {
      const data = await expenseService.getExpenses();
      const mapped = data.map((e: any) => ({
        id: e.id,
        type: e.entry_type.toLowerCase(),
        category: e.category,
        amount: parseFloat(e.amount),
        note: e.description || e.category,
        date: e.expense_date,
        trip: e.trip_detail,
      }));
      setEntries(mapped);
    } catch (err) {
      console.error("Failed to fetch expenses", err);
    } finally {
      setLoading(false);
    }
  }

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
    }).sort((a, b) => b.date.toString().localeCompare(a.date.toString()));
  }, [entries, period, filterCat, filterType]);

  const totalIncome  = filtered.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpense = filtered.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const netProfit    = totalIncome - totalExpense;

  // ── Pie data ──
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(e => e.type === "expense").forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([k, v]) => ({
      name: CATEGORY_META[k]?.label || k,
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

  async function handleAdd() {
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    
    try {
      setLoading(true);
      await expenseService.addExpense({
        amount: form.amount,
        entry_type: form.type.toUpperCase(),
        category: form.category,
        expense_date: form.date,
        description: form.note,
        vehicle: form.vehicle || null
      });
      await fetchEntries();
      setForm({ type: "expense", category: "FUEL", amount: "", note: "", date: today(), trip: "", vehicle: "" });
      setSaved(true);
      setTimeout(() => { setSaved(false); setTab("entries"); }, 1200);
    } catch (err) {
      console.error("Failed to add expense", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveParsedEntry(entry: ParsedFinanceEntry) {
    const categoryMap: Record<string, string> = {
      fuel: "FUEL",
      toll: "TOLL",
      maintenance: "REPAIR",
      insurance: "OTHER",
      food: "OTHER",
      loading: "LOADING",
      other: "OTHER",
    };
    try {
      setLoading(true);
      await expenseService.addExpense({
        amount: entry.amount,
        entry_type: entry.type.toUpperCase(),
        category: categoryMap[entry.category] || "OTHER",
        expense_date: entry.date,
        description: `${entry.type === "income" ? "Income note" : "Voice entry"}: ${entry.note}`
      });
      await fetchEntries();
      setTab("entries");
    } catch (err) {
      console.error("Failed to save voice entry", err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEntry(id: string | number) {
    try {
      await expenseService.deleteExpense(id as number);
      setEntries(prev => prev.filter(e => e.id !== id));
      setShowDeleteId(null);
    } catch (err) {
      console.error("Failed to delete expense", err);
    }
  }

  function handleVoiceSave(entry: ParsedFinanceEntry) {
    saveParsedEntry(entry);
  }

  const PIE_COLORS = ["#f07c1e", "#16a34a", "#9333ea", "#dc2626", "#0ea5e9", "#d97706", "#64748b"];

  const EXPENSE_CATEGORIES = ["FUEL", "TOLL", "PARKING", "REPAIR", "OTHER"];
  const INCOME_CATEGORIES = ["FREIGHT", "LOADING", "OTHER"];

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
      <div className="gradient-header px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-bold">{t.financeTracker}</h1>
            <p className="text-white/60 text-sm mt-0.5">{t.trackIncomeExpenses}</p>
          </div>
          <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVoice(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2.5 rounded-xl transition-all font-bold backdrop-blur-sm border border-white/10"
          >
            <Mic size={16} />
            <span className="text-sm hidden sm:inline">{t.addVoiceEntry}</span>
          </button>
          <button
            onClick={() => setTab("add")}
            className="btn-primary flex items-center gap-2 px-4 py-2.5"
          >
            <Plus size={16} /> {t.addEntry}
          </button>
          </div>
        </div>

        {/* Summary pills */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-1 text-green-300 text-xs mb-1">
              <TrendingUp size={12} /> {t.income}
            </div>
            <p className="text-white font-bold text-base">{formatINR(totalIncome)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-1 text-red-300 text-xs mb-1">
              <TrendingDown size={12} /> {t.expense}
            </div>
            <p className="text-white font-bold text-base">{formatINR(totalExpense)}</p>
          </div>
          <div className={`backdrop-blur rounded-2xl p-3 border border-white/10 ${netProfit >= 0 ? "bg-green-500/20" : "bg-red-500/20"}`}>
            <div className={`text-xs mb-1 ${netProfit >= 0 ? "text-green-200" : "text-red-200"}`}>{t.net}</div>
            <p className={`font-bold text-base ${netProfit >= 0 ? "text-green-200" : "text-red-300"}`}>
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
            className={`px-4 py-2 rounded-xl text-sm transition-all font-semibold ${
              period === p ? "bg-primary text-white shadow" : "bg-white text-gray-500 card-hover"
            }`}
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
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm transition-all font-semibold ${
              tab === tb.key ? "bg-primary text-white shadow" : "text-gray-500 hover:text-gray-700"
            }`}
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
              <div className="card-hover bg-white rounded-3xl p-4 shadow-sm mb-4">
                <p className="font-bold text-dark mb-3">{t.expenseBreakdown}</p>
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
              <div className="card-hover bg-white rounded-3xl p-4 shadow-sm mb-4">
                <p className="font-bold text-dark mb-3">{t.last7Days}</p>
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
              <div className="card-hover bg-white rounded-3xl p-4 shadow-sm mb-4">
                <p className="font-bold text-dark mb-3">{t.byCategory}</p>
                {(Object.keys(CATEGORY_META) as string[]).map(cat => {
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
                  onChange={e => setFilterCat(e.target.value as string | "all")}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none text-[#0f1c35] flex-shrink-0"
                  style={{ fontWeight: 600 }}
                >
                  <option value="all">{t.allCategories}</option>
                  {(Object.keys(CATEGORY_META) as string[]).map(k => (
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
                    const meta = CATEGORY_META[e.category] || CATEGORY_META["OTHER"];
                    return (
                      <motion.div
                        key={e.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="card-hover bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg, color: meta.color }}>
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-dark text-sm font-semibold truncate">{e.note}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-gray-400 text-xs">{fmtDate(e.date)}</span>
                            {e.trip && <span className="text-xs text-primary bg-blue-50 px-2 py-0.5 rounded-full truncate max-w-[120px]">{e.trip}</span>}
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
                    onClick={() => setForm(f => ({ ...f, type: "expense", category: "FUEL" }))}
                    className={`flex-1 py-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${
                      form.type === "expense" ? "bg-red-500 text-white shadow" : "text-gray-500"
                    }`}
                    style={{ fontWeight: 700 }}
                  >
                    <TrendingDown size={16} /> {t.expense}
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, type: "income", category: "LOADING" }))}
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
                          active ? "border-primary bg-primary/5" : "border-gray-100 bg-gray-50"
                        }`}
                      >
                        <div style={{ color: active ? "var(--color-primary)" : meta?.color }}>{meta?.icon}</div>
                        <span className="text-[10px] text-center leading-tight font-semibold" style={{ color: active ? "var(--color-primary)" : "#4a5f7a" }}>
                          {meta?.label.split("/")[0] || cat}
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
                  placeholder={`e.g. ${CATEGORY_META[form.category]?.label || form.category} at highway`}
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

                {/* Vehicle selection (for fuel expenses) */}
                {(form.type === "expense" && form.category === "FUEL") && (
                  <div className="mb-5">
                    <p className="text-xs text-gray-400 mb-2" style={{ fontWeight: 600 }}>Vehicle *</p>
                    <select
                      value={form.vehicle}
                      onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))}
                      className="w-full border-2 border-gray-200 focus:border-[#1a4999] rounded-xl px-3 py-3 text-sm outline-none transition-colors bg-white"
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.vehicle_number} ({v.vehicle_type})</option>
                      ))}
                    </select>
                  </div>
                )}

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
                      disabled={loading || !form.amount || parseFloat(form.amount) <= 0}
                      className={`w-full rounded-xl py-4 flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-40 ${
                        form.type === "income" ? "bg-green-500 hover:bg-green-600 text-white" : "btn-primary"
                      }`}
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
                <button onClick={() => setShowDeleteId(null)} className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-gray-600 font-semibold">
                  {t.cancel}
                </button>
                <button onClick={() => deleteEntry(showDeleteId)} className="flex-1 bg-red-500 text-white rounded-xl py-3 font-bold">
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
