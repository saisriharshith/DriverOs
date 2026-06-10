import { useState } from "react";
import {
  LayoutDashboard, FolderLock, ShieldCheck, Navigation,
  Truck, Fuel, Heart, FileText, Bot, Menu, X,
  ChevronRight, Zap, LogOut, User, Wallet
} from "lucide-react";

import { LanguageProvider, useLang } from "./LanguageContext";
import { LANGUAGE_OPTIONS } from "./translations";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { DocumentVault } from "./components/DocumentVault";
import { ComplianceCenter } from "./components/ComplianceCenter";
import { TripManagement } from "./components/TripManagement";
import { VehicleManagement } from "./components/VehicleManagement";
import { FuelRest } from "./components/FuelRest";
import { HealthEmergency } from "./components/HealthEmergency";
import { PolicyUpdates } from "./components/PolicyUpdates";
import { AIAssistant } from "./components/AIAssistant";
import { FinanceTracker } from "./components/FinanceTracker";

type Screen =
  | "dashboard" | "documents" | "compliance" | "trips"
  | "vehicle" | "fuel" | "health" | "policy" | "ai" | "finance";

type AppStage = "landing" | "login" | "app";

function AppShell() {
  const { t, lang } = useLang();
  const [stage, setStage] = useState<AppStage>("landing");
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const BOTTOM_NAV = [
    { key: "dashboard" as Screen, label: t.home, icon: LayoutDashboard },
    { key: "documents" as Screen, label: t.docs, icon: FolderLock },
    { key: "finance" as Screen, label: "Finance", icon: Wallet },
    { key: "trips" as Screen, label: t.trips, icon: Navigation },
    { key: "ai" as Screen, label: t.assistant, icon: Bot },
  ];

  const SIDEBAR_SCREENS = [
    { key: "dashboard" as Screen, label: t.home, icon: LayoutDashboard, color: "text-[#1a4999]" },
    { key: "documents" as Screen, label: t.documentVault, icon: FolderLock, color: "text-purple-600" },
    { key: "compliance" as Screen, label: t.complianceCenter, icon: ShieldCheck, color: "text-green-600" },
    { key: "finance" as Screen, label: "Finance Tracker", icon: Wallet, color: "text-emerald-600" },
    { key: "trips" as Screen, label: t.tripManagement, icon: Navigation, color: "text-blue-500" },
    { key: "vehicle" as Screen, label: t.vehicleManagement, icon: Truck, color: "text-[#1a4999]" },
    { key: "fuel" as Screen, label: t.fuelRest, icon: Fuel, color: "text-orange-500" },
    { key: "health" as Screen, label: t.healthEmergency, icon: Heart, color: "text-red-600" },
    { key: "policy" as Screen, label: t.policyUpdates, icon: FileText, color: "text-amber-600" },
    { key: "ai" as Screen, label: t.aiAssistant, icon: Bot, color: "text-teal-600" },
  ];

  function navigate(s: Screen) {
    setScreen(s);
    setMenuOpen(false);
  }

  if (stage === "landing") {
    return <LandingPage onGetStarted={() => setStage("login")} />;
  }

  if (stage === "login") {
    return (
      <LoginPage
        onLogin={() => setStage("app")}
        onBack={() => setStage("landing")}
      />
    );
  }

  const selectedLang = LANGUAGE_OPTIONS.find(l => l.code === lang);

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white flex-col fixed top-0 bottom-0 left-0 shadow-md z-20 border-r border-gray-100">
        {/* Sidebar header */}
        <div className="bg-[#1a4999] px-5 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-orange-400 rounded-xl flex items-center justify-center">
              <Truck size={18} className="text-white" />
            </div>
            <div>
              <span className="text-white" style={{ fontWeight: 700 }}>DriverOS</span>
              <span className="text-orange-300 text-xs ml-1">India</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm" style={{ fontWeight: 600 }}>Rajesh Kumar</p>
              <p className="text-orange-300 text-xs">MH-04-AB-1234</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {SIDEBAR_SCREENS.map(item => (
            <button
              key={item.key}
              onClick={() => setScreen(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-0.5 text-left transition-colors ${
                screen === item.key
                  ? "bg-[#1a4999] text-white"
                  : "hover:bg-[#f0f4f8] text-[#0f1c35]"
              }`}
            >
              <item.icon size={18} className={screen === item.key ? "text-white" : item.color} />
              <span className="text-sm" style={{ fontWeight: 600 }}>{item.label}</span>
              {item.key === "compliance" && screen !== "compliance" && (
                <span className="ml-auto w-5 h-5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center">1</span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 pb-5 border-t border-gray-100 pt-3 space-y-2">
          <button
            onClick={() => navigate("health")}
            className="w-full bg-red-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 text-sm"
            style={{ fontWeight: 700 }}
          >
            <Zap size={16} />{t.emergencySOS}
          </button>
          <button
            onClick={() => { setStage("landing"); setScreen("dashboard"); }}
            className="w-full text-red-500 hover:bg-red-50 rounded-xl py-2 flex items-center justify-center gap-2 text-sm transition-colors"
          >
            <LogOut size={15} />{t.logout}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#1a4999] z-30 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-400 rounded-lg flex items-center justify-center">
              <Truck size={14} className="text-white" />
            </div>
            <span className="text-white" style={{ fontWeight: 700, fontSize: "0.9rem" }}>DriverOS</span>
            <span className="text-orange-300 text-xs" style={{ fontWeight: 600 }}>India</span>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center"
          >
            <Menu size={18} className="text-white" />
          </button>
        </div>

        {/* Desktop top bar */}
        <div className="hidden lg:flex sticky top-0 bg-white border-b border-gray-100 z-10 items-center justify-between px-6 py-3 shadow-sm">
          <h2 className="text-[#0f1c35]" style={{ fontWeight: 700 }}>
            {screen === "finance" ? "Finance Tracker" : SIDEBAR_SCREENS.find(s => s.key === screen)?.label || t.home}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{selectedLang?.flag} {selectedLang?.native}</span>
            <div className="w-9 h-9 bg-[#1a4999] rounded-xl flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
          </div>
        </div>

        <div className="flex-1 pt-14 lg:pt-0 pb-20 lg:pb-0">
          {screen === "dashboard" && <Dashboard onNavigate={navigate} />}
          {screen === "documents"  && <DocumentVault />}
          {screen === "compliance" && <ComplianceCenter />}
          {screen === "finance"    && <FinanceTracker />}
          {screen === "trips"      && <TripManagement />}
          {screen === "vehicle"    && <VehicleManagement />}
          {screen === "fuel"       && <FuelRest />}
          {screen === "health"     && <HealthEmergency />}
          {screen === "policy"     && <PolicyUpdates />}
          {screen === "ai"         && <AIAssistant />}
        </div>
      </div>

      {/* Mobile Slide-out Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl">
            <div className="bg-[#1a4999] px-5 pt-12 pb-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-400 rounded-xl flex items-center justify-center">
                    <Truck size={16} className="text-white" />
                  </div>
                  <span className="text-white" style={{ fontWeight: 700 }}>DriverOS <span className="text-orange-300">India</span></span>
                </div>
                <button onClick={() => setMenuOpen(false)}>
                  <X size={22} className="text-white/70" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <User size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-white text-sm" style={{ fontWeight: 600 }}>Rajesh Kumar</p>
                  <p className="text-orange-300 text-xs">MH-04-AB-1234</p>
                  <p className="text-white/60 text-xs">{selectedLang?.flag} {selectedLang?.native}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3 px-3">
              {SIDEBAR_SCREENS.map(item => (
                <button
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl mb-1 text-left transition-colors ${
                    screen === item.key ? "bg-[#1a4999]/10" : "hover:bg-[#f0f4f8]"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#f0f4f8] flex items-center justify-center">
                    <item.icon size={18} className={item.color} />
                  </div>
                  <span className={`text-sm flex-1 ${screen === item.key ? "text-[#1a4999]" : "text-[#0f1c35]"}`} style={{ fontWeight: 600 }}>
                    {item.label}
                  </span>
                  <ChevronRight size={15} className="text-[#4a5f7a]" />
                </button>
              ))}
            </div>

            <div className="px-3 pb-6 border-t border-[#f0f4f8] pt-3 flex flex-col gap-2">
              <button
                onClick={() => navigate("health")}
                className="w-full bg-red-600 text-white rounded-2xl py-3.5 flex items-center justify-center gap-2"
                style={{ fontWeight: 700 }}
              >
                <Zap size={20} />{t.emergencySOS}
              </button>
              <button
                onClick={() => { setMenuOpen(false); setStage("landing"); setScreen("dashboard"); }}
                className="w-full bg-[#f0f4f8] text-red-600 rounded-2xl py-3 flex items-center justify-center gap-2 text-sm"
                style={{ fontWeight: 600 }}
              >
                <LogOut size={16} />{t.logout}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#dce6f0] z-20 flex items-center">
        {BOTTOM_NAV.map(nav => (
          <button
            key={nav.key}
            onClick={() => navigate(nav.key)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 relative transition-colors ${
              screen === nav.key ? "text-[#1a4999]" : "text-[#4a5f7a]"
            }`}
          >
            <nav.icon
              size={22}
              strokeWidth={screen === nav.key ? 2.5 : 1.8}
              className={screen === nav.key ? "text-[#1a4999]" : "text-[#4a5f7a]"}
            />
            <span className="text-[10px] truncate max-w-[56px] text-center" style={{ fontWeight: 600 }}>{nav.label}</span>
            {screen === nav.key && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#1a4999] rounded-full" />
            )}
            {nav.key === "compliance" && (
              <span className="absolute top-1.5 right-3 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center" style={{ fontWeight: 700 }}>1</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppShell />
    </LanguageProvider>
  );
}
