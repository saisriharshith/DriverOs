import { useState, useEffect } from "react";
import {
  LayoutDashboard, FolderLock, ShieldCheck, Navigation,
  Truck, Fuel, Heart, FileText, Bot, Menu, X,
  ChevronRight, Zap, LogOut, User, Wallet, CircleGauge
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
import { authService } from "./api/auth.service";
import { locationService } from "./api/location.service";

type Screen =
  | "dashboard" | "documents" | "compliance" | "trips"
  | "vehicle" | "fuel" | "health" | "policy" | "ai" | "finance";

type AppStage = "landing" | "login" | "app";

function AppShell() {
  const { t, lang } = useLang();
  const [stage, setStage] = useState<AppStage>("landing");
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setStage("app");
      authService.getProfile().then(setUserData).catch(() => {
        authService.logout();
        setStage("landing");
      });
    }
  }, []);

  useEffect(() => {
    if (stage !== "app") return;
    const trackLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            locationService.updateLocation(
              position.coords.latitude,
              position.coords.longitude
            ).catch(() => {});
          },
          () => {},
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
        );
      }
    };
    trackLocation();
    const interval = setInterval(trackLocation, 60000);
    return () => clearInterval(interval);
  }, [stage]);

  const BOTTOM_NAV = [
    { key: "dashboard" as Screen, label: t.home, icon: LayoutDashboard },
    { key: "finance" as Screen, label: "Finance", icon: Wallet },
    { key: "trips" as Screen, label: t.trips, icon: Navigation },
    { key: "documents" as Screen, label: t.docs, icon: FolderLock },
    { key: "vehicle" as Screen, label: "Vehicle", icon: Truck },
  ];

  const SIDEBAR_SCREENS = [
    { key: "dashboard" as Screen, label: t.home, icon: LayoutDashboard },
    { key: "finance" as Screen, label: "Finance Tracker", icon: Wallet },
    { key: "trips" as Screen, label: t.tripManagement, icon: Navigation },
    { key: "documents" as Screen, label: t.documentVault, icon: FolderLock },
    { key: "compliance" as Screen, label: t.complianceCenter, icon: ShieldCheck },
    { key: "vehicle" as Screen, label: t.vehicleManagement, icon: Truck },
    { key: "fuel" as Screen, label: t.fuelRest, icon: Fuel },
    { key: "health" as Screen, label: t.healthEmergency, icon: Heart },
    { key: "policy" as Screen, label: t.policyUpdates, icon: FileText },
    { key: "ai" as Screen, label: t.aiAssistant, icon: Bot },
  ];

  function navigate(s: Screen) {
    setScreen(s);
    setMenuOpen(false);
  }

  function handleLogout() {
    authService.logout();
    setStage("landing");
    setScreen("dashboard");
    setUserData(null);
  }

  if (stage === "landing") {
    return <LandingPage onGetStarted={() => setStage("login")} />;
  }

  if (stage === "login") {
    return (
      <LoginPage
        onLogin={() => {
          setStage("app");
          authService.getProfile().then(setUserData);
        }}
        onBack={() => setStage("landing")}
      />
    );
  }

  const selectedLang = LANGUAGE_OPTIONS.find(l => l.code === lang);
  const currentScreenMeta = SIDEBAR_SCREENS.find(s => s.key === screen);
  const CurrentIcon = currentScreenMeta?.icon || LayoutDashboard;

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white flex-col fixed top-0 bottom-0 left-0 shadow-lg z-20 border-r border-gray-200/60"
        style={{ boxShadow: "4px 0 12px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
            style={{ background: "linear-gradient(135deg, #f07c1e, #ea580c)" }}>
            <Truck size={18} className="text-white" />
          </div>
          <div>
            <span className="text-[#0f1c35] text-sm font-bold">DriverOS</span>
            <span className="text-[#f07c1e] text-xs font-semibold ml-1">India</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {SIDEBAR_SCREENS.map(item => {
            const active = screen === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setScreen(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  active
                    ? "text-white font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
                style={active ? { background: "linear-gradient(135deg, #1a4999, #2563eb)", boxShadow: "0 2px 8px rgba(26,73,153,0.25)" } : {}}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  active ? "bg-white/15" : "bg-gray-100"
                }`}>
                  <item.icon size={16} className={active ? "text-white" : "text-gray-500"} />
                </div>
                <span className="text-sm flex-1">{item.label}</span>
                {item.key === "compliance" && !active && (
                  <span className="w-5 h-5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">1</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-2">
          <button
            onClick={() => navigate("health")}
            className="w-full flex items-center justify-center gap-2 text-white rounded-xl py-2.5 text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}
          >
            <Zap size={16} />{t.emergencySOS}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 rounded-xl py-2 text-sm font-semibold transition-colors"
          >
            <LogOut size={15} />{t.logout}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3"
          style={{ background: "linear-gradient(135deg, #1a4999, #2563eb)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #f07c1e, #ea580c)" }}>
              <Truck size={14} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm">DriverOS</span>
            <span className="text-orange-300 text-xs font-semibold">India</span>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center"
          >
            <Menu size={18} className="text-white" />
          </button>
        </div>

        {/* Desktop top bar */}
        <div className="hidden lg:flex sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10 items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <CurrentIcon size={16} className="text-primary" />
            </div>
            <h2 className="text-gray-900 font-bold text-base">
              {currentScreenMeta?.label || t.home}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{selectedLang?.flag} {selectedLang?.native}</span>
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700">{userData?.name || "Driver"}</span>
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
            <div className="px-5 pt-14 pb-5"
              style={{ background: "linear-gradient(135deg, #1a4999, #2563eb)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #f07c1e, #ea580c)" }}>
                    <Truck size={16} className="text-white" />
                  </div>
                  <span className="text-white font-bold">DriverOS <span className="text-orange-300">India</span></span>
                </div>
                <button onClick={() => setMenuOpen(false)}>
                  <X size={22} className="text-white/70" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <User size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{userData?.name || "Driver"}</p>
                  <p className="text-orange-300 text-xs">{userData?.phone}</p>
                  <p className="text-white/60 text-xs">{selectedLang?.flag} {selectedLang?.native}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3 px-3">
              {SIDEBAR_SCREENS.map(item => {
                const active = screen === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-0.5 text-left transition-all ${
                      active ? "bg-primary/10 text-primary font-semibold" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      active ? "bg-primary/15 text-primary" : "bg-gray-100 text-gray-500"
                    }`}>
                      <item.icon size={18} />
                    </div>
                    <span className="text-sm flex-1">{item.label}</span>
                    <ChevronRight size={15} className="text-gray-300" />
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-gray-100 flex flex-col gap-2">
              <button
                onClick={() => navigate("health")}
                className="w-full flex items-center justify-center gap-2 text-white rounded-2xl py-3 font-bold"
                style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}
              >
                <Zap size={20} />{t.emergencySOS}
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-gray-100 text-red-500 rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-semibold"
              >
                <LogOut size={16} />{t.logout}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 z-20 flex items-center safe-area-bottom"
        style={{ boxShadow: "0 -2px 8px rgba(0,0,0,0.04)" }}>
        {BOTTOM_NAV.map(nav => {
          const active = screen === nav.key;
          return (
            <button
              key={nav.key}
              onClick={() => navigate(nav.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 relative transition-all`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                active ? "scale-105" : ""
              }`}
                style={active ? { background: "rgba(26,73,153,0.1)" } : {}}>
                <nav.icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? "#1a4999" : "#94a3b8" }}
                />
              </div>
              <span className="text-[9px] truncate max-w-[60px] text-center leading-tight font-semibold"
                style={{ color: active ? "#1a4999" : "#94a3b8" }}>
                {nav.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
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
