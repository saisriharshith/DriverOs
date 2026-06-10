import { useState } from "react";
import { Navigation, MapPin, Clock, Fuel, IndianRupee, Package, ChevronRight, X, CheckCircle, Play, Square } from "lucide-react";
import { useLang } from "../LanguageContext";

const TRIPS = [
  { id: "t1", date: "08 Jun 2025", from: "Mumbai", to: "Pune", distance: "148 km", duration: "3h 20m", earnings: 8500, expenses: 3200, status: "active", toll: 480, fuel: 2720, stops: ["Khopoli Toll", "Khandala"] },
  { id: "t2", date: "05 Jun 2025", from: "Pune", to: "Nashik", distance: "211 km", duration: "4h 45m", earnings: 12000, expenses: 4800, status: "completed", toll: 720, fuel: 4080, stops: ["Shirdi", "Igatpuri"] },
  { id: "t3", date: "02 Jun 2025", from: "Mumbai", to: "Surat", distance: "286 km", duration: "5h 30m", earnings: 15000, expenses: 6200, status: "completed", toll: 1100, fuel: 5100, stops: ["Vapi", "Navsari"] },
] as const;

type Trip = typeof TRIPS[number];

export function TripManagement() {
  const { t } = useLang();
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripActive, setTripActive] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const active = TRIPS.find(t => t.status === "active");
  const completed = TRIPS.filter(t => t.status === "completed");
  const totalEarnings = completed.reduce((a, t) => a + t.earnings, 0);
  const totalExpenses = completed.reduce((a, t) => a + t.expenses, 0);

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <div className="bg-[#1a4999] px-4 pt-10 pb-5">
        <h1 className="text-white text-xl font-semibold">{t.tripManagement}</h1>
        <p className="text-white/60 text-sm mt-1">{t.trackRoutes}</p>
      </div>

      {active && tripActive && (
        <div className="mx-4 mt-4 bg-green-600 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-green-300 rounded-full animate-pulse" /><span className="text-white text-sm font-semibold">{t.tripInProgress}</span></div>
            <button onClick={() => setTripActive(false)} className="bg-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1"><Square size={12} /> {t.endTrip}</button>
          </div>
          <div className="flex items-center gap-2 text-white">
            <MapPin size={14} className="text-green-200" /><span className="text-sm">{active.from}</span>
            <ChevronRight size={14} className="text-green-200" />
            <MapPin size={14} className="text-green-200" /><span className="text-sm">{active.to}</span>
          </div>
          <p className="text-green-200 text-xs mt-1">{active.distance} · Est. {active.duration}</p>
        </div>
      )}

      <div className="px-4 mt-4 grid grid-cols-3 gap-3">
        {[
          { label: t.tripsDone, value: completed.length.toString(), icon: Navigation, color: "text-[#1a4999]", bg: "bg-blue-50" },
          { label: t.totalEarned, value: `₹${(totalEarnings / 1000).toFixed(0)}K`, icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" },
          { label: t.totalSpent, value: `₹${(totalExpenses / 1000).toFixed(0)}K`, icon: Fuel, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
            <s.icon size={18} className={`${s.color} mx-auto mb-1`} />
            <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#4a5f7a]">{s.label}</p>
          </div>
        ))}
      </div>

      {!tripActive && (
        <div className="px-4 mt-4">
          <button onClick={() => setShowNewTrip(true)} className="w-full bg-[#1a4999] text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-semibold shadow-md">
            <Play size={20} />{t.startNewTrip}
          </button>
        </div>
      )}

      <div className="px-4 mt-5">
        <h3 className="text-[#0f1c35] font-semibold mb-3">{t.tripHistory}</h3>
        <div className="flex flex-col gap-3">
          {TRIPS.map(trip => (
            <button key={trip.id} onClick={() => setSelectedTrip(trip)} className="bg-white rounded-2xl p-4 text-left w-full">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#0f1c35] font-semibold">{trip.from}</span>
                    <ChevronRight size={16} className="text-[#4a5f7a]" />
                    <span className="text-[#0f1c35] font-semibold">{trip.to}</span>
                  </div>
                  <p className="text-[#4a5f7a] text-xs mt-0.5">{trip.date} · {trip.distance} · {trip.duration}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${trip.status === "active" ? "bg-green-100 text-green-700" : "bg-blue-100 text-[#1a4999]"}`}>
                  {trip.status === "active" ? "● Live" : "✓ Done"}
                </span>
              </div>
              <div className="flex gap-3 mt-3 border-t border-[#f0f4f8] pt-3">
                <div className="flex-1 flex items-center gap-1.5"><IndianRupee size={14} className="text-green-600" /><div><p className="text-green-600 text-sm font-semibold">₹{trip.earnings.toLocaleString()}</p><p className="text-[#4a5f7a] text-xs">{t.earnings}</p></div></div>
                <div className="flex-1 flex items-center gap-1.5"><Fuel size={14} className="text-amber-600" /><div><p className="text-amber-600 text-sm font-semibold">₹{trip.expenses.toLocaleString()}</p><p className="text-[#4a5f7a] text-xs">{t.expenses}</p></div></div>
                <div className="flex-1 flex items-center gap-1.5"><IndianRupee size={14} className="text-[#1a4999]" /><div><p className="text-[#1a4999] text-sm font-semibold">₹{(trip.earnings - trip.expenses).toLocaleString()}</p><p className="text-[#4a5f7a] text-xs">{t.profit}</p></div></div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedTrip && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div><h3 className="text-[#0f1c35] text-lg font-semibold">{selectedTrip.from} → {selectedTrip.to}</h3><p className="text-[#4a5f7a] text-sm">{selectedTrip.date}</p></div>
              <button onClick={() => setSelectedTrip(null)}><X size={22} className="text-[#4a5f7a]" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: t.distance, value: selectedTrip.distance, icon: Navigation },
                { label: t.duration, value: selectedTrip.duration, icon: Clock },
                { label: t.tollCost, value: `₹${selectedTrip.toll}`, icon: IndianRupee },
                { label: t.fuelCost, value: `₹${selectedTrip.fuel}`, icon: Fuel },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-[#f0f4f8] rounded-xl p-3 flex items-center gap-2">
                  <Icon size={16} className="text-[#1a4999]" />
                  <div><p className="text-[#4a5f7a] text-xs">{label}</p><p className="text-[#0f1c35] text-sm font-semibold">{value}</p></div>
                </div>
              ))}
            </div>
            <div className="bg-[#f0f4f8] rounded-2xl p-4 mb-4">
              <p className="text-[#4a5f7a] text-xs mb-2 font-semibold">{t.stops.toUpperCase()}</p>
              {selectedTrip.stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5"><MapPin size={14} className="text-orange-500" /><span className="text-[#0f1c35] text-sm">{stop}</span></div>
              ))}
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex justify-between items-center">
              <div><p className="text-green-600 text-xs font-semibold">{t.profit.toUpperCase()}</p><p className="text-green-700 text-2xl font-bold">₹{(selectedTrip.earnings - selectedTrip.expenses).toLocaleString()}</p></div>
              <CheckCircle size={32} className="text-green-500" />
            </div>
          </div>
        </div>
      )}

      {showNewTrip && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#0f1c35] text-lg font-semibold">{t.startNewTrip}</h3>
              <button onClick={() => setShowNewTrip(false)}><X size={22} className="text-[#4a5f7a]" /></button>
            </div>
            <div className="flex flex-col gap-3 mb-4">
              <div className="bg-[#f0f4f8] rounded-xl px-4 py-3 flex items-center gap-3">
                <MapPin size={18} className="text-green-500" />
                <input className="flex-1 bg-transparent text-[#0f1c35] outline-none text-sm" placeholder={t.from} value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div className="bg-[#f0f4f8] rounded-xl px-4 py-3 flex items-center gap-3">
                <MapPin size={18} className="text-red-500" />
                <input className="flex-1 bg-transparent text-[#0f1c35] outline-none text-sm" placeholder={t.to} value={to} onChange={e => setTo(e.target.value)} />
              </div>
              <div className="bg-[#f0f4f8] rounded-xl px-4 py-3 flex items-center gap-3">
                <Package size={18} className="text-[#1a4999]" />
                <input className="flex-1 bg-transparent text-[#0f1c35] outline-none text-sm" placeholder={t.loadDescription} />
              </div>
            </div>
            <button onClick={() => { setShowNewTrip(false); setTripActive(true); }} className="w-full bg-[#1a4999] text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-semibold">
              <Play size={20} />{t.startTrip}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
