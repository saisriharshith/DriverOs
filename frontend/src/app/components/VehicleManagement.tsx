import { useState } from "react";
import { Truck, Wrench, Fuel, AlertTriangle, CheckCircle, Clock, Plus, ChevronRight, X, CircleGauge } from "lucide-react";
import { useLang } from "../LanguageContext";

const SERVICE_HISTORY = [
  { id: 1, date: "15 Mar 2025", type: "Regular Service", odometer: "1,24,500 km", cost: 8500, workshop: "Tata Motors Service, Pune", notes: "Oil change, filter replaced" },
  { id: 2, date: "10 Dec 2024", type: "Tyre Replacement", odometer: "1,18,200 km", cost: 32000, workshop: "MRF Authorised, Mumbai", notes: "All 6 tyres replaced" },
  { id: 3, date: "05 Sep 2024", type: "Brake Service", odometer: "1,10,000 km", cost: 12000, workshop: "Highway Garage, Nashik", notes: "Brake pads and drums serviced" },
];

const VEHICLE_HEALTH = [
  { name: "Engine", score: 85, status: "good" as const, detail: "Last serviced 15 Mar 2025" },
  { name: "Tyres", score: 72, status: "fair" as const, detail: "Front tyres wear — inspect soon" },
  { name: "Brakes", score: 90, status: "good" as const, detail: "Checked 5 Sep 2024" },
  { name: "Battery", score: 45, status: "poor" as const, detail: "Weak — may need replacement" },
  { name: "Lights", score: 95, status: "good" as const, detail: "All lights functional" },
  { name: "AC/Cooling", score: 60, status: "fair" as const, detail: "AC gas refill due" },
];

export function VehicleManagement() {
  const { t } = useLang();
  const [showAddService, setShowAddService] = useState(false);
  const [selectedService, setSelectedService] = useState<typeof SERVICE_HISTORY[0] | null>(null);

  const overallScore = Math.round(VEHICLE_HEALTH.reduce((a, h) => a + h.score, 0) / VEHICLE_HEALTH.length);

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <div className="bg-[#1a4999] px-4 pt-10 pb-5">
        <h1 className="text-white text-xl font-semibold">{t.vehicleManagement}</h1>
        <p className="text-white/60 text-sm mt-1">{t.truckProfile}</p>
      </div>

      {/* Truck Profile */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-[#1a4999] rounded-2xl flex items-center justify-center">
              <Truck size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-[#0f1c35] font-semibold text-lg">Tata Prima 4928.S</h2>
              <p className="text-orange-500 font-semibold">MH-04-AB-1234</p>
              <p className="text-[#4a5f7a] text-xs mt-0.5">Heavy Commercial Vehicle · 2019</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t.odometer.split(" ")[0], value: "1,26,842 km" },
              { label: "Engine", value: "380 HP" },
              { label: "GVW", value: "49,000 kg" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#f0f4f8] rounded-xl p-2.5 text-center">
                <p className="text-[#0f1c35] text-sm font-semibold">{value}</p>
                <p className="text-[#4a5f7a] text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vehicle Health */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#0f1c35] font-semibold">{t.vehicleHealth}</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              overallScore >= 75 ? "bg-green-100 text-green-700" :
              overallScore >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
            }`}>
              {overallScore}/100
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {VEHICLE_HEALTH.map(item => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {item.status === "poor" && <AlertTriangle size={13} className="text-red-500" />}
                    {item.status === "fair" && <Clock size={13} className="text-amber-500" />}
                    {item.status === "good" && <CheckCircle size={13} className="text-green-500" />}
                    <span className="text-[#0f1c35] text-sm">{item.name}</span>
                  </div>
                  <span className={`text-xs font-semibold ${
                    item.status === "good" ? "text-green-600" :
                    item.status === "fair" ? "text-amber-600" : "text-red-600"
                  }`}>{item.score}%</span>
                </div>
                <div className="h-2 bg-[#dce6f0] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${
                    item.status === "good" ? "bg-green-500" :
                    item.status === "fair" ? "bg-amber-500" : "bg-red-500"
                  }`} style={{ width: `${item.score}%` }} />
                </div>
                <p className="text-[#4a5f7a] text-xs mt-1">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next Service */}
      <div className="px-4 mt-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Wrench size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[#0f1c35] text-sm font-semibold">{t.nextServiceDue}</p>
              <p className="text-[#4a5f7a] text-xs">15 Jul 2025 or 1,30,000 km</p>
            </div>
          </div>
          <span className="text-amber-600 text-sm font-semibold">37 {t.daysLeft}</span>
        </div>
      </div>

      {/* Fuel Efficiency */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Fuel size={18} className="text-[#1a4999]" />
          </div>
          <div className="flex-1">
            <p className="text-[#0f1c35] text-sm font-semibold">{t.fuelEfficiency}</p>
            <p className="text-[#4a5f7a] text-xs">Avg 3.8 km/L · Last fill: 180L @ ₹6,840</p>
          </div>
          <CircleGauge size={20} className="text-[#1a4999]" />
        </div>
      </div>

      {/* Service History */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#0f1c35] font-semibold">{t.serviceHistory}</h3>
          <button onClick={() => setShowAddService(true)} className="bg-[#1a4999] text-white rounded-xl px-3 py-1.5 text-xs flex items-center gap-1">
            <Plus size={13} /> {t.addRecord}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {SERVICE_HISTORY.map(service => (
            <button key={service.id} onClick={() => setSelectedService(service)} className="bg-white rounded-2xl p-4 flex items-center gap-3 text-left w-full">
              <div className="w-10 h-10 bg-[#f0f4f8] rounded-xl flex items-center justify-center shrink-0">
                <Wrench size={18} className="text-[#1a4999]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#0f1c35] text-sm font-semibold">{service.type}</p>
                <p className="text-[#4a5f7a] text-xs">{service.date} · {service.odometer}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[#0f1c35] text-sm font-semibold">₹{service.cost.toLocaleString()}</p>
                <ChevronRight size={14} className="text-[#4a5f7a] ml-auto mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#0f1c35] text-lg font-semibold">{selectedService.type}</h3>
              <button onClick={() => setSelectedService(null)}><X size={22} className="text-[#4a5f7a]" /></button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: t.date, value: selectedService.date },
                { label: t.odometer, value: selectedService.odometer },
                { label: t.cost, value: `₹${selectedService.cost.toLocaleString()}` },
                { label: t.workshop, value: selectedService.workshop },
                { label: t.notes, value: selectedService.notes },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#f0f4f8] rounded-xl px-4 py-3">
                  <p className="text-[#4a5f7a] text-xs">{label}</p>
                  <p className="text-[#0f1c35] text-sm font-semibold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddService && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#0f1c35] text-lg font-semibold">{t.addRecord}</h3>
              <button onClick={() => setShowAddService(false)}><X size={22} className="text-[#4a5f7a]" /></button>
            </div>
            <div className="flex flex-col gap-3 mb-4">
              {[t.serviceType, t.date, t.odometer, t.cost, t.workshop, t.notes].map(field => (
                <div key={field} className="bg-[#f0f4f8] rounded-xl px-4 py-3">
                  <p className="text-[#4a5f7a] text-xs mb-1">{field}</p>
                  <input className="w-full bg-transparent text-[#0f1c35] text-sm outline-none" placeholder={field} />
                </div>
              ))}
            </div>
            <button onClick={() => setShowAddService(false)} className="w-full bg-[#1a4999] text-white rounded-2xl py-4 font-semibold">
              {t.saveRecord}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
