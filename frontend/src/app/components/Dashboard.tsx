import { useState } from "react";
import {
  AlertTriangle, CheckCircle, Clock, Truck, MapPin,
  Fuel, Coffee, Wrench, Phone, Upload, Navigation,
  ChevronRight, Bell, Zap, FileText, X,
  Shield, TrendingUp, Radio
} from "lucide-react";
import { useLang } from "../LanguageContext";
import { LANGUAGE_OPTIONS, LangCode } from "../translations";

interface AlertItem {
  labelKey: string;
  expiry: string;
  daysLeft: number;
  status: "safe" | "warning" | "danger";
}

const ALERTS: AlertItem[] = [
  { labelKey: "Driving License", expiry: "15 Aug 2025", daysLeft: 68, status: "warning" },
  { labelKey: "Vehicle Insurance", expiry: "30 Jun 2025", daysLeft: 22, status: "danger" },
  { labelKey: "PUC Certificate", expiry: "10 Jul 2025", daysLeft: 32, status: "warning" },
  { labelKey: "Fitness Certificate", expiry: "12 Oct 2025", daysLeft: 126, status: "safe" },
  { labelKey: "National Permit", expiry: "01 Dec 2025", daysLeft: 176, status: "safe" },
  { labelKey: "Next Service Due", expiry: "15 Jul 2025", daysLeft: 37, status: "warning" },
];

const GOV_UPDATES = [
  { id: 1, title: "New Toll Rate Revision on NH-44", summary: "Toll charges increased by 5% on NH-44 from Nagpur to Hyderabad section effective June 15.", impact: "High", time: "2 hours ago", icon: TrendingUp },
  { id: 2, title: "HSRP Mandatory for All Trucks", summary: "High Security Registration Plates mandatory for all commercial vehicles from July 1. Penalty ₹10,000.", impact: "High", time: "1 day ago", icon: Shield },
  { id: 3, title: "E-Way Bill Update", summary: "E-Way bill validity extended to 48 hours for distances under 100 km.", impact: "Medium", time: "2 days ago", icon: FileText },
  { id: 4, title: "AIS-140 GPS Tracker Compliance", summary: "All heavy vehicles must have AIS-140 compliant GPS installed. Verification drive begins July.", impact: "High", time: "3 days ago", icon: Radio },
];

export function Dashboard({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { lang, setLang, t } = useLang();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [sosActive, setSosActive] = useState(false);

  const dangerCount = ALERTS.filter(a => a.status === "danger").length;
  const warnCount = ALERTS.filter(a => a.status === "warning").length;

  const QUICK_ACTIONS = [
    { label: t.uploadDoc, icon: Upload, color: "bg-blue-600", action: "upload" },
    { label: t.startTrip, icon: Navigation, color: "bg-green-600", action: "trip" },
    { label: t.emergencySOS, icon: Zap, color: "bg-red-600", action: "sos" },
    { label: t.findFuel, icon: Fuel, color: "bg-orange-500", action: "fuel" },
    { label: t.findDhaba, icon: Coffee, color: "bg-amber-600", action: "dhaba" },
    { label: t.findMechanic, icon: Wrench, color: "bg-purple-600", action: "mechanic" },
    { label: t.callOwner, icon: Phone, color: "bg-teal-600", action: "call" },
    { label: t.viewDocs, icon: FileText, color: "bg-indigo-600", action: "docs" },
  ];

  function StatusBadge({ status }: { status: AlertItem["status"] }) {
    if (status === "danger") return (
      <span className="flex items-center gap-1 text-red-600 text-xs font-semibold">
        <AlertTriangle size={12} /> {t.urgent}
      </span>
    );
    if (status === "warning") return (
      <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
        <Clock size={12} /> {t.upcoming}
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
        <CheckCircle size={12} /> {t.safe}
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <div className="bg-[#1a4999] px-4 pt-10 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white border-2 border-orange-400 overflow-hidden flex items-center justify-center">
              <Truck size={28} className="text-[#1a4999]" />
            </div>
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wider">{t.welcomeBack}</p>
              <h2 className="text-white text-lg leading-tight">Rajesh Kumar</h2>
              <div className="flex items-center gap-1 mt-0.5">
                <Truck size={12} className="text-orange-300" />
                <span className="text-orange-300 text-xs">MH-04-AB-1234</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangPicker(!showLangPicker)}
                className="bg-white/15 rounded-xl px-2.5 py-2 flex items-center gap-1 text-white text-sm"
              >
                <span className="text-base">{LANGUAGE_OPTIONS.find(l => l.code === lang)?.flag}</span>
                <span className="text-xs">{LANGUAGE_OPTIONS.find(l => l.code === lang)?.native}</span>
              </button>
              {showLangPicker && (
                <div className="absolute top-10 right-0 bg-white rounded-2xl shadow-xl z-50 py-2 min-w-44 border border-[#dce6f0]">
                  {LANGUAGE_OPTIONS.map(option => (
                    <button
                      key={option.code}
                      onClick={() => { setLang(option.code as LangCode); setShowLangPicker(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left ${option.code === lang ? "bg-[#1a4999]/10 text-[#1a4999]" : "text-[#0f1c35] hover:bg-[#f0f4f8]"}`}
                    >
                      <span className="text-base">{option.flag}</span>
                      <div>
                        <p className="text-sm font-semibold">{option.native}</p>
                        <p className="text-xs text-[#4a5f7a]">{option.name}</p>
                      </div>
                      {option.code === lang && <CheckCircle size={14} className="ml-auto text-[#1a4999]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="relative bg-white/15 rounded-xl p-2">
              <Bell size={18} className="text-white" />
              {dangerCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">{dangerCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Trip Status */}
        <div className="bg-white/15 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <div>
              <p className="text-white text-xs opacity-70">{t.currentTrip}</p>
              <p className="text-white text-sm">Mumbai → Pune (92 km left)</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-orange-300 text-xs">
            <MapPin size={12} />
            <span>{t.onRoute}</span>
          </div>
        </div>
      </div>

      {/* Alert Strip */}
      {(dangerCount > 0 || warnCount > 0) && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-600 shrink-0" />
          <p className="text-red-700 text-sm flex-1">
            <span className="font-semibold">{dangerCount} {t.urgentAlerts}</span> {t.renewalsNeedAttention}
          </p>
          <button onClick={() => onNavigate("compliance")} className="text-red-600 text-xs font-semibold">{t.viewAll} →</button>
        </div>
      )}

      {/* Document Status */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#0f1c35] font-semibold">{t.documentStatus}</h3>
          <button onClick={() => onNavigate("compliance")} className="text-[#1a4999] text-sm flex items-center gap-1">
            {t.viewAll} <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {ALERTS.map((alert) => (
            <div key={alert.labelKey} className={`bg-white rounded-2xl px-4 py-3 flex items-center justify-between border-l-4 ${
              alert.status === "danger" ? "border-red-500" : alert.status === "warning" ? "border-amber-500" : "border-green-500"
            }`}>
              <div>
                <p className="text-[#0f1c35] text-sm font-semibold">{alert.labelKey}</p>
                <p className="text-[#4a5f7a] text-xs mt-0.5">{t.expires}: {alert.expiry}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={alert.status} />
                <p className={`text-xs mt-1 ${alert.status === "danger" ? "text-red-600" : alert.status === "warning" ? "text-amber-600" : "text-green-600"}`}>
                  {alert.daysLeft} {t.daysLeft}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-6">
        <h3 className="text-[#0f1c35] font-semibold mb-3">{t.quickActions}</h3>
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
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center shadow-md active:scale-95 transition-transform`}>
                <action.icon size={24} className="text-white" />
              </div>
              <span className="text-[#0f1c35] text-xs text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Government Updates */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#0f1c35] font-semibold">{t.govUpdates}</h3>
          <button onClick={() => onNavigate("policy")} className="text-[#1a4999] text-sm flex items-center gap-1">
            {t.all} <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {GOV_UPDATES.map((update) => (
            <div key={update.id} className="bg-white rounded-2xl p-4 flex gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${update.impact === "High" ? "bg-red-100" : "bg-amber-100"}`}>
                <update.icon size={18} className={update.impact === "High" ? "text-red-600" : "text-amber-600"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[#0f1c35] text-sm font-semibold leading-tight">{update.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-semibold ${update.impact === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {update.impact}
                  </span>
                </div>
                <p className="text-[#4a5f7a] text-xs mt-1 leading-relaxed">{update.summary}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[#4a5f7a] text-xs">{update.time}</span>
                  <button className="text-[#1a4999] text-xs font-semibold">{t.readInHindi} →</button>
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
              <h3 className="text-[#0f1c35] text-lg font-semibold">{t.emergencySOS}</h3>
              <button onClick={() => setSosActive(false)}><X size={22} className="text-[#4a5f7a]" /></button>
            </div>
            <p className="text-[#4a5f7a] text-sm mb-4">Current Location: NH-4, 15km from Pune</p>
            <div className="grid grid-cols-1 gap-3">
              <a href="tel:108" className="bg-red-600 text-white rounded-2xl py-4 flex items-center justify-center gap-3">
                <Phone size={22} /><span className="text-lg font-semibold">Call Ambulance (108)</span>
              </a>
              <a href="tel:100" className="bg-blue-700 text-white rounded-2xl py-4 flex items-center justify-center gap-3">
                <Phone size={22} /><span className="text-lg font-semibold">Call Police (100)</span>
              </a>
              <button className="bg-orange-500 text-white rounded-2xl py-4 flex items-center justify-center gap-3">
                <MapPin size={22} /><span className="text-lg font-semibold">{t.locationShared}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
