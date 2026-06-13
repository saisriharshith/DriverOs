import { useState, useEffect } from "react";
import { Navigation, MapPin, Fuel, IndianRupee, ChevronRight, X, Play, Square, Clock, TrendingUp, CircleGauge, Truck } from "lucide-react";
import { useLang } from "../LanguageContext";
import { tripService } from "../api/trip.service";
import { vehicleService } from "../api/vehicle.service";

interface Trip {
  id: number;
  start_location: string;
  end_location: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  total_fuel_cost: string;
  total_toll_cost: string;
  total_other_expenses: string;
  net_profit: string;
  freight_amount: string;
  advance_amount: string;
  balance_amount: string;
  start_time: string;
  end_time: string;
  distance_km: string;
  mileage_achieved: string;
  vehicle: number;
  vehicle_detail?: { id: number; vehicle_number: string; vehicle_type: string };
}

const fmtINR = (n: number) => "₹" + n.toLocaleString("en-IN");

const getLocalISOString = () => {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
  return localISOTime;
};

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="stat-card text-center">
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
    </div>
  );
}

export function TripManagement() {
  const { t } = useLang();
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [freightAmount, setFreightAmount] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [startTime, setStartTime] = useState(getLocalISOString());
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [endTripOdometer, setEndTripOdometer] = useState("");
  const [showEndTrip, setShowEndTrip] = useState(false);
  const [endTripId, setEndTripId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    fetchTrips();
    fetchVehicles();
  }, []);

  async function fetchTrips() {
    try {
      const data = await tripService.getTrips();
      setTrips(data || []);
    } catch (err) {
      console.error("Failed to fetch trips", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchVehicles() {
    try {
      const v = await vehicleService.getVehicles();
      setVehicles(v);
      if (v.length > 0) setVehicleId(v[0].id);
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
        freight_amount: freightAmount || 0,
        advance_amount: advanceAmount || 0,
        start_time: startTime ? new Date(startTime).toISOString() : undefined,
        status: "ACTIVE"
      });
      await fetchTrips();
      setShowNewTrip(false);
      setFrom(""); setTo(""); setFreightAmount(""); setAdvanceAmount("");
      setStartTime(getLocalISOString());
    } catch (err) {
      console.error("Failed to start trip", err);
    } finally {
      setLoading(false);
    }
  }

  function handleEndTrip(id: number) {
    setEndTripId(id);
    setEndTripOdometer("");
    setShowEndTrip(true);
  }

  async function confirmEndTrip() {
    if (!endTripId) return;
    try {
      setLoading(true);
      const payload: any = { end_time: new Date().toISOString() };
      if (endTripOdometer) payload.end_odometer = parseInt(endTripOdometer);
      await tripService.completeTrip(endTripId, payload);
      await fetchTrips();
      setShowEndTrip(false);
      setEndTripId(null);
    } catch (err) {
      console.error("Failed to end trip", err);
    } finally {
      setLoading(false);
    }
  }

  const active = trips.find(t => t.status === "ACTIVE");
  const completed = trips.filter(t => t.status === "COMPLETED");
  const totalFreight = completed.reduce((a, t) => a + (parseFloat(t.freight_amount) || 0), 0);
  const totalExpenses = completed.reduce((a, t) => a +
    (parseFloat(t.total_fuel_cost) || 0) +
    (parseFloat(t.total_toll_cost) || 0) +
    (parseFloat(t.total_other_expenses) || 0), 0);
  const totalProfit = completed.reduce((a, t) => a + (parseFloat(t.net_profit) || 0), 0);

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <div className="gradient-header px-4 pt-12 pb-6">
        <h1 className="text-white text-xl font-bold">{t.tripManagement}</h1>
        <p className="text-white/60 text-sm mt-1">{t.trackRoutes}</p>
      </div>

      {active && (
        <div className="mx-4 mt-4"
          style={{ background: "linear-gradient(135deg, #059669, #10b981)", borderRadius: "1rem", padding: "1rem" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-green-300 rounded-full animate-pulse" />
              <span className="text-white text-sm font-bold">{t.tripInProgress}</span>
            </div>
            <button onClick={() => handleEndTrip(active.id)}
              className="bg-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1 backdrop-blur">
              <Square size={12} /> {t.endTrip}
            </button>
          </div>
          <div className="flex items-center gap-2 text-white">
            <MapPin size={14} className="text-green-200" />
            <span className="text-sm font-semibold">{active.start_location}</span>
            <ChevronRight size={14} className="text-green-200" />
            <MapPin size={14} className="text-green-200" />
            <span className="text-sm font-semibold">{active.end_location}</span>
          </div>
          <p className="text-green-200 text-xs mt-1">Started: {new Date(active.start_time).toLocaleString()}</p>
        </div>
      )}

      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <StatBox label="Total Trips" value={completed.length.toString()} color="#1a4999" />
        <StatBox label="Active" value={active ? "1" : "0"} color="#059669" />
        <StatBox label="Total Freight" value={fmtINR(totalFreight)} color="#16a34a" />
        <StatBox label="Net Profit" value={fmtINR(totalProfit)} color={totalProfit >= 0 ? "#16a34a" : "#dc2626"} />
      </div>

      {!active && (
        <div className="px-4 mt-4">
          <button onClick={() => { setStartTime(getLocalISOString()); setShowNewTrip(true); }}
            className="w-full text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold shadow-md"
            style={{ background: "linear-gradient(135deg, #1a4999, #2563eb)" }}>
            <Play size={20} />{t.startNewTrip}
          </button>
        </div>
      )}

      <div className="px-4 mt-5">
        <h3 className="text-gray-800 font-bold mb-3">{t.tripHistory}</h3>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-sm" />)}
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <Navigation size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No trips yet</p>
            <p className="text-gray-300 text-sm mt-1">Start your first trip to see it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map(trip => (
              <button key={trip.id} onClick={() => setSelectedTrip(trip)}
                className="bg-white rounded-2xl p-4 text-left w-full card-hover shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800 font-bold truncate">{trip.start_location}</span>
                      <ChevronRight size={14} className="text-gray-300 shrink-0" />
                      <span className="text-gray-800 font-bold truncate">{trip.end_location}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-gray-400 text-xs">{new Date(trip.start_time).toLocaleDateString()}</span>
                      {trip.total_fuel_cost && trip.status === "COMPLETED" && (
                        <span className={`text-xs font-bold ${parseFloat(trip.net_profit) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {fmtINR(parseFloat(trip.net_profit))}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold shrink-0 ${
                    trip.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-blue-100 text-primary"
                  }`}>
                    {trip.status === "ACTIVE" ? "● Live" : "✓ Done"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Trip Detail Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-gray-800 text-lg font-bold">{selectedTrip.start_location} → {selectedTrip.end_location}</h3>
                <p className="text-gray-400 text-sm">{new Date(selectedTrip.start_time).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedTrip(null)}><X size={22} className="text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Distance", value: selectedTrip.distance_km ? `${selectedTrip.distance_km} km` : "N/A", icon: Navigation },
                { label: "Freight", value: fmtINR(parseFloat(selectedTrip.freight_amount || "0")), icon: IndianRupee },
                { label: "Fuel Cost", value: fmtINR(parseFloat(selectedTrip.total_fuel_cost || "0")), icon: Fuel },
                { label: "Toll Cost", value: fmtINR(parseFloat(selectedTrip.total_toll_cost || "0")), icon: IndianRupee },
                { label: "Other Exp.", value: fmtINR(parseFloat(selectedTrip.total_other_expenses || "0")), icon: Fuel },
                { label: "Net Profit", value: fmtINR(parseFloat(selectedTrip.net_profit || "0")), icon: TrendingUp },
                { label: "Mileage", value: selectedTrip.mileage_achieved ? `${selectedTrip.mileage_achieved} km/L` : "N/A", icon: CircleGauge },
                { label: "Status", value: selectedTrip.status, icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} className="text-primary" />
                    <p className="text-gray-500 text-xs">{label}</p>
                  </div>
                  <p className="text-gray-800 text-sm font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* End Trip Modal */}
      {showEndTrip && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-gray-800 text-lg font-bold">End Trip</h3>
              <button onClick={() => setShowEndTrip(false)}><X size={22} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
                <Navigation size={18} className="text-primary" />
                <input type="number" className="flex-1 bg-transparent text-gray-800 outline-none text-sm font-medium"
                  placeholder="End Odometer (km)" value={endTripOdometer} onChange={e => setEndTripOdometer(e.target.value)} />
              </div>
            </div>
            <button onClick={confirmEndTrip}
              className="w-full text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold"
              style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
              <Square size={20} /> Complete Trip
            </button>
          </div>
        </div>
      )}

      {/* New Trip Modal */}
      {showNewTrip && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-gray-800 text-lg font-bold">{t.startNewTrip}</h3>
              <button onClick={() => setShowNewTrip(false)}><X size={22} className="text-gray-400" /></button>
            </div>
            {!vehicleId && <p className="text-red-500 text-xs mb-3 font-medium">Please add a vehicle first in Vehicle Management</p>}

            {vehicles.length > 1 && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3 mb-3">
                <Truck size={18} className="text-primary" />
                <select className="flex-1 bg-transparent text-gray-800 outline-none text-sm font-medium"
                  value={vehicleId || ""} onChange={e => setVehicleId(parseInt(e.target.value))}>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
                <MapPin size={18} className="text-green-500" />
                <input className="flex-1 bg-transparent text-gray-800 outline-none text-sm font-medium"
                  placeholder={t.from} value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
                <MapPin size={18} className="text-red-500" />
                <input className="flex-1 bg-transparent text-gray-800 outline-none text-sm font-medium"
                  placeholder={t.to} value={to} onChange={e => setTo(e.target.value)} />
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">{t.startTimeLabel}</label>
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-primary animate-pulse" />
                  <input type="datetime-local" className="flex-1 bg-transparent text-gray-800 outline-none text-sm font-medium"
                    value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
                  <IndianRupee size={18} className="text-emerald-500" />
                  <input type="number" className="flex-1 bg-transparent text-gray-800 outline-none text-sm font-medium"
                    placeholder="Freight ₹" value={freightAmount} onChange={e => setFreightAmount(e.target.value)} />
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
                  <IndianRupee size={18} className="text-amber-500" />
                  <input type="number" className="flex-1 bg-transparent text-gray-800 outline-none text-sm font-medium"
                    placeholder="Advance ₹" value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} />
                </div>
              </div>
            </div>
            <button onClick={handleStartTrip} disabled={!vehicleId || !from || !to}
              className="w-full text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold disabled:opacity-50 shadow-md"
              style={{ background: "linear-gradient(135deg, #1a4999, #2563eb)" }}>
              <Play size={20} />{t.startTrip}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
