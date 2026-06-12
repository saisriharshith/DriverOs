import { useState, useEffect } from "react";
import {
  AlertTriangle, CheckCircle, Clock, Truck, MapPin,
  Fuel, Coffee, Wrench, Phone, Upload, Navigation,
  ChevronRight, Bell, Zap, FileText, X,
  Shield, TrendingUp, Radio, IndianRupee, CircleGauge,
  Wallet, ReceiptText
} from "lucide-react";
import { useLang } from "../LanguageContext";
import { LANGUAGE_OPTIONS, LangCode } from "../translations";
import { analyticsService } from "../api/analytics.service";
import { authService } from "../api/auth.service";
import { locationService } from "../api/location.service";

interface DashboardStats {
  total_expenses: number;
  total_income: number;
  total_trips: number;
  active_trips: number;
  compliance_score: number;
  risk_level: string;
  total_documents: number;
  expired_documents: number;
  total_vehicles: number;
}

const GOV_UPDATES = [
  { id: 1, title: "New Toll Rate Revision on NH-44", summary: "Toll charges increased by 5% on NH-44 from Nagpur to Hyderabad section.", impact: "High", time: "2 hours ago", icon: TrendingUp },
  { id: 2, title: "HSRP Mandatory for All Trucks", summary: "High Security Registration Plates mandatory for all commercial vehicles from July 1.", impact: "High", time: "1 day ago", icon: Shield },
  { id: 3, title: "E-Way Bill Update", summary: "E-Way bill validity extended to 48 hours for distances under 100 km.", impact: "Medium", time: "2 days ago", icon: FileText },
];

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string; color: string; bg: string }) {
  return (
    <div className="stat-card flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon size={20} className={color} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

const fmtINR = (n: number) => "₹" + n.toLocaleString("en-IN");

export function Dashboard({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { lang, setLang, t } = useLang();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string>("Searching...");

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, profileData] = await Promise.all([
          analyticsService.getDashboardStats(),
          authService.getProfile()
        ]);
        setStats(statsData);
        setUser(profileData);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const addr = await locationService.getAddress(pos.coords.latitude, pos.coords.longitude);
        setAddress(addr);
      });
    }
  }, []);

  const dangerCount = stats?.expired_documents || 0;
  const netIncome = (stats?.total_income || 0) - (stats?.total_expenses || 0);

  const QUICK_ACTIONS = [
    { label: t.uploadDoc, icon: Upload, color: "from-blue-500 to-blue-600", action: "upload" },
    { label: t.startTrip, icon: Navigation, color: "from-emerald-500 to-emerald-600", action: "trip" },
    { label: t.emergencySOS, icon: Zap, color: "from-red-500 to-red-600", action: "sos" },
    { label: t.findFuel, icon: Fuel, color: "from-orange-500 to-orange-600", action: "fuel" },
    { label: t.findDhaba, icon: Coffee, color: "from-amber-500 to-amber-600", action: "dhaba" },
    { label: t.findMechanic, icon: Wrench, color: "from-purple-500 to-purple-600", action: "mechanic" },
    { label: t.callOwner, icon: Phone, color: "from-teal-500 to-teal-600", action: "call" },
    { label: t.viewDocs, icon: FileText, color: "from-indigo-500 to-indigo-600", action: "docs" },
  ];

  function StatusBadge({ status }: { status: string }) {
    if (status === "danger") return <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><AlertTriangle size={12} /> {t.urgent}</span>;
    if (status === "warning") return <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold"><Clock size={12} /> {t.upcoming}</span>;
    return <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle size={12} /> {t.safe}</span>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] pb-24">
        <div className="gradient-header px-4 pt-12 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-white/20 animate-pulse" />
            <div className="space-y-2">
              <div className="w-20 h-3 bg-white/20 rounded animate-pulse" />
              <div className="w-32 h-5 bg-white/20 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-16 bg-white/10 rounded-2xl animate-pulse" />
        </div>
        <div className="px-4 -mt-4 space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-xl shadow-sm animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      {/* Header */}
      <div className="gradient-header px-4 pt-12 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center backdrop-blur">
              <Truck size={28} className="text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider font-semibold">{t.welcomeBack}</p>
              <h2 className="text-white text-lg leading-tight font-bold">{user?.name || "Driver"}</h2>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} className="text-orange-300" />
                <span className="text-orange-300 text-xs">{address}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowLangPicker(!showLangPicker)}
                className="bg-white/15 rounded-xl px-2.5 py-2 flex items-center gap-1 text-white text-sm backdrop-blur"
              >
                <span className="text-base">{LANGUAGE_OPTIONS.find(l => l.code === lang)?.flag}</span>
                <span className="text-xs">{LANGUAGE_OPTIONS.find(l => l.code === lang)?.native}</span>
              </button>
              {showLangPicker && (
                <div className="absolute top-10 right-0 bg-white rounded-2xl shadow-xl z-50 py-2 min-w-44 border border-gray-100">
                  {LANGUAGE_OPTIONS.map(option => (
                    <button key={option.code}
                      onClick={() => { setLang(option.code as LangCode); setShowLangPicker(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left ${option.code === lang ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-50"}`}>
                      <span className="text-base">{option.flag}</span>
                      <div>
                        <p className="text-sm font-semibold">{option.native}</p>
                        <p className="text-xs text-gray-400">{option.name}</p>
                      </div>
                      {option.code === lang && <CheckCircle size={14} className="ml-auto text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="relative bg-white/15 rounded-xl p-2 backdrop-blur">
              <Bell size={18} className="text-white" />
              {dangerCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">{dangerCount}</span>}
            </button>
          </div>
        </div>

        {/* Trip Status */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
            <div>
              <p className="text-white/60 text-xs">{t.currentTrip}</p>
              <p className="text-white text-sm font-semibold">{stats?.active_trips ? "Mumbai → Nagpur · Active" : "No Active Trip"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-orange-300 text-xs font-semibold">
            <MapPin size={12} />
            <span>{t.onRoute}</span>
          </div>
        </div>
      </div>

      {/* Alert Strip */}
      {dangerCount > 0 && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-600 shrink-0" />
          <p className="text-red-700 text-sm flex-1 font-medium">
            <span className="font-bold">{dangerCount} {t.urgentAlerts}</span> {t.renewalsNeedAttention}
          </p>
          <button onClick={() => onNavigate("compliance")} className="text-red-600 text-xs font-bold bg-red-100 px-3 py-1.5 rounded-lg">View →</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Income</p>
                <p className="text-lg font-bold text-emerald-700">{fmtINR(stats?.total_income || 0)}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-red-500 rotate-180" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Expenses</p>
                <p className="text-lg font-bold text-red-600">{fmtINR(stats?.total_expenses || 0)}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Navigation size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Trips</p>
                <p className="text-lg font-bold text-blue-700">{stats?.total_trips || 0}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Truck size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Vehicles</p>
                <p className="text-lg font-bold text-purple-700">{stats?.total_vehicles || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance + Documents Row */}
      <div className="px-4 mt-3">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onNavigate("compliance")} className="stat-card flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="24" cy="24" r="20" fill="none" stroke="#f0f4f8" strokeWidth="4" />
                <circle cx="24" cy="24" r="20" fill="none" stroke={stats?.compliance_score && stats.compliance_score > 80 ? "#22c55e" : "#f59e0b"} strokeWidth="4" strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * (stats?.compliance_score || 100)) / 100} strokeLinecap="round" />
              </svg>
              <span className="absolute text-sm font-bold text-primary">{stats?.compliance_score || 0}</span>
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500 font-medium">Compliance</p>
              <p className="text-sm font-bold text-gray-800">{stats?.risk_level || "SAFE"}</p>
            </div>
          </button>
          <button onClick={() => onNavigate("documents")} className="stat-card flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${dangerCount > 0 ? "bg-red-100" : "bg-green-100"}`}>
              <FileText size={22} className={dangerCount > 0 ? "text-red-600" : "text-green-600"} />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500 font-medium">Documents</p>
              <p className="text-sm font-bold text-gray-800">{dangerCount > 0 ? `${dangerCount} Expired` : "All Valid"}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-4">
        <h3 className="text-gray-800 font-bold mb-3">{t.quickActions}</h3>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.action}
              onClick={() => {
                if (action.action === "sos") setSosActive(true);
                else if (["fuel", "dhaba", "mechanic"].includes(action.action)) onNavigate("fuel");
                else if (action.action === "docs") onNavigate("documents");
                else if (action.action === "trip") onNavigate("trips");
              }}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md card-hover group-active:scale-90`}>
                <action.icon size={24} className="text-white" />
              </div>
              <span className="text-gray-700 text-[10px] text-center leading-tight font-semibold">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Government Updates */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-800 font-bold">{t.govUpdates}</h3>
          <button onClick={() => onNavigate("policy")} className="text-primary text-sm font-semibold flex items-center gap-1">
            {t.all} <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {GOV_UPDATES.map((update) => (
            <div key={update.id} className="bg-white rounded-2xl p-4 flex gap-3 card-hover shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${update.impact === "High" ? "bg-red-100" : "bg-amber-100"}`}>
                <update.icon size={18} className={update.impact === "High" ? "text-red-600" : "text-amber-600"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-gray-800 text-sm font-bold leading-tight">{update.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-bold ${update.impact === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {update.impact}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">{update.summary}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-400 text-xs">{update.time}</span>
                  <button className="text-primary text-xs font-bold">Read in Hindi →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SOS Modal */}
      {sosActive && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 text-lg font-bold">{t.emergencySOS}</h3>
              <button onClick={() => setSosActive(false)}><X size={22} className="text-gray-400" /></button>
            </div>
            <p className="text-gray-500 text-sm mb-4">Current Location: {address}</p>
            <div className="space-y-3">
              <a href="tel:108" className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-bold">
                <Phone size={22} /> Call Ambulance (108)
              </a>
              <a href="tel:100" className="w-full bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-bold">
                <Phone size={22} /> Call Police (100)
              </a>
              <button className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-bold">
                <MapPin size={22} /> {t.locationShared}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
