import { useState, useEffect } from "react";
import { Navigation, MapPin, Clock, Fuel, IndianRupee, Package, ChevronRight, X, CheckCircle, Play, Square } from "lucide-react";
import { useLang } from "../LanguageContext";
import { tripService } from "../api/trip.service";
import { vehicleService } from "../api/vehicle.service";

interface Trip {
  id: number;
  start_location: string;
  end_location: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  fuel_cost: number;
  start_time: string;
  end_time: string;
}

export function TripManagement() {
  const { t } = useLang();
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [vehicleId, setVehicleId] = useState<number | null>(null);

  useEffect(() => {
    fetchTrips();
    fetchVehicle();
  }, []);

  async function fetchTrips() {
    try {
      const data = await tripService.getTrips();
      setTrips(data);
    } catch (err) {
      console.error("Failed to fetch trips", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchVehicle() {
    try {
      const vehicles = await vehicleService.getVehicles();
      if (vehicles.length > 0) {
        setVehicleId(vehicles[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch vehicles", err);
    }
  }

  async function handleStartTrip() {
    if (!vehicleId) return;
    try {
      setLoading(true);
      await tripService.startTrip({
        vehicle: vehicleId,
        start_location: from,
        end_location: to,
        status: "ACTIVE"
      });
      await fetchTrips();
      setShowNewTrip(false);
      setFrom("");
      setTo("");
    } catch (err) {
      console.error("Failed to start trip", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEndTrip(id: number) {
    try {
      setLoading(true);
      await tripService.updateTrip(id, {
        status: "COMPLETED",
        end_time: new Date().toISOString()
      });
      await fetchTrips();
    } catch (err) {
      console.error("Failed to end trip", err);
    } finally {
      setLoading(false);
    }
  }

  const active = trips.find(t => t.status === "ACTIVE");
  const completed = trips.filter(t => t.status === "COMPLETED");
  const totalExpenses = completed.reduce((a, t) => a + (parseFloat(t.fuel_cost as any) || 0), 0);

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <div className="bg-[#1a4999] px-4 pt-10 pb-5">
        <h1 className="text-white text-xl font-semibold">{t.tripManagement}</h1>
        <p className="text-white/60 text-sm mt-1">{t.trackRoutes}</p>
      </div>

      {active && (
        <div className="mx-4 mt-4 bg-green-600 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-green-300 rounded-full animate-pulse" /><span className="text-white text-sm font-semibold">{t.tripInProgress}</span></div>
            <button onClick={() => handleEndTrip(active.id)} className="bg-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1"><Square size={12} /> {t.endTrip}</button>
          </div>
          <div className="flex items-center gap-2 text-white">
            <MapPin size={14} className="text-green-200" /><span className="text-sm">{active.start_location}</span>
            <ChevronRight size={14} className="text-green-200" />
            <MapPin size={14} className="text-green-200" /><span className="text-sm">{active.end_location}</span>
          </div>
          <p className="text-green-200 text-xs mt-1">Start: {new Date(active.start_time).toLocaleString()}</p>
        </div>
      )}

      <div className="px-4 mt-4 grid grid-cols-3 gap-3">
        {[
          { label: t.tripsDone, value: completed.length.toString(), icon: Navigation, color: "text-[#1a4999]", bg: "bg-blue-50" },
          { label: "Fuel Spent", value: `₹${(totalExpenses / 1000).toFixed(1)}K`, icon: Fuel, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Active", value: active ? "1" : "0", icon: Play, color: "text-green-600", bg: "bg-green-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
            <s.icon size={18} className={`${s.color} mx-auto mb-1`} />
            <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#4a5f7a]">{s.label}</p>
          </div>
        ))}
      </div>

      {!active && (
        <div className="px-4 mt-4">
          <button onClick={() => setShowNewTrip(true)} className="w-full bg-[#1a4999] text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-semibold shadow-md">
            <Play size={20} />{t.startNewTrip}
          </button>
        </div>
      )}

      <div className="px-4 mt-5">
        <h3 className="text-[#0f1c35] font-semibold mb-3">{t.tripHistory}</h3>
        {loading ? (
           <p className="text-center text-gray-500 py-10">Loading trips...</p>
        ) : trips.length === 0 ? (
           <p className="text-center text-gray-500 py-10">No trips found</p>
        ) : (
          <div className="flex flex-col gap-3">
            {trips.map(trip => (
              <button key={trip.id} onClick={() => setSelectedTrip(trip)} className="bg-white rounded-2xl p-4 text-left w-full">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#0f1c35] font-semibold">{trip.start_location}</span>
                      <ChevronRight size={16} className="text-[#4a5f7a]" />
                      <span className="text-[#0f1c35] font-semibold">{trip.end_location}</span>
                    </div>
                    <p className="text-[#4a5f7a] text-xs mt-0.5">{new Date(trip.start_time).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${trip.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-blue-100 text-[#1a4999]"}`}>
                    {trip.status === "ACTIVE" ? "● Live" : "✓ Done"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedTrip && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div><h3 className="text-[#0f1c35] text-lg font-semibold">{selectedTrip.start_location} → {selectedTrip.end_location}</h3><p className="text-[#4a5f7a] text-sm">{new Date(selectedTrip.start_time).toLocaleString()}</p></div>
              <button onClick={() => setSelectedTrip(null)}><X size={22} className="text-[#4a5f7a]" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Start Location", value: selectedTrip.start_location, icon: Navigation },
                { label: "End Location", value: selectedTrip.end_location, icon: MapPin },
                { label: t.fuelCost, value: `₹${selectedTrip.fuel_cost || 0}`, icon: Fuel },
                { label: "Status", value: selectedTrip.status, icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-[#f0f4f8] rounded-xl p-3 flex items-center gap-2">
                  <Icon size={16} className="text-[#1a4999]" />
                  <div><p className="text-[#4a5f7a] text-xs">{label}</p><p className="text-[#0f1c35] text-sm font-semibold">{value}</p></div>
                </div>
              ))}
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
            {!vehicleId && <p className="text-red-500 text-xs mb-3">Please add a vehicle first in Vehicle Management</p>}
            <div className="flex flex-col gap-3 mb-4">
              <div className="bg-[#f0f4f8] rounded-xl px-4 py-3 flex items-center gap-3">
                <MapPin size={18} className="text-green-500" />
                <input className="flex-1 bg-transparent text-[#0f1c35] outline-none text-sm" placeholder={t.from} value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div className="bg-[#f0f4f8] rounded-xl px-4 py-3 flex items-center gap-3">
                <MapPin size={18} className="text-red-500" />
                <input className="flex-1 bg-transparent text-[#0f1c35] outline-none text-sm" placeholder={t.to} value={to} onChange={e => setTo(e.target.value)} />
              </div>
            </div>
            <button onClick={handleStartTrip} disabled={!vehicleId || !from || !to} className="w-full bg-[#1a4999] text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-semibold disabled:opacity-50">
              <Play size={20} />{t.startTrip}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
