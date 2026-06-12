import { useState, useEffect } from "react";
import { Fuel, Coffee, Wrench, ParkingCircle, Phone, Star, Clock, MapPin, Navigation, Mic, Plus } from "lucide-react";
import { useLang } from "../LanguageContext";
import { FuelExpenseVoice } from "./FuelExpenseVoice";
import { locationService } from "../api/location.service";

type Category = "fuel" | "dhaba" | "mechanic" | "parking";

const PLACES = [
  { id: "1", name: "HPCL Fuel Station", distance: "1.2 km", rating: 4.2, isOpen: true, is24x7: true, address: "NH-44, Nagpur bypass", phone: "+91-9821001234", category: "fuel" as Category, tag: "Adblue available" },
  { id: "2", name: "Bharat Petroleum", distance: "3.8 km", rating: 4.0, isOpen: true, is24x7: true, address: "NH-44, near Toll Plaza 4", phone: "+91-9821005678", category: "fuel" as Category, tag: "CNG available" },
  { id: "3", name: "Indian Oil Pump", distance: "6.1 km", rating: 3.8, isOpen: false, is24x7: false, address: "Wardha Road exit", phone: "+91-9821009012", category: "fuel" as Category },
  { id: "4", name: "Shanti Dhaba", distance: "0.8 km", rating: 4.5, isOpen: true, is24x7: true, address: "NH-44 side, near Butibori", phone: "+91-9765001234", category: "dhaba" as Category, tag: "Popular with truckers" },
  { id: "5", name: "Punjabi Dhaba", distance: "2.3 km", rating: 4.3, isOpen: true, is24x7: false, address: "Kamptee Road junction", phone: "+91-9765005678", category: "dhaba" as Category, tag: "Hot meals, shower" },
  { id: "6", name: "Highway Hotel", distance: "4.5 km", rating: 3.9, isOpen: true, is24x7: false, address: "Hingna toll area", phone: "+91-9765009012", category: "dhaba" as Category },
  { id: "7", name: "Ramesh Motor Works", distance: "1.5 km", rating: 4.1, isOpen: true, is24x7: false, address: "MIDC, Butibori industrial", phone: "+91-9876001234", category: "mechanic" as Category, tag: "Tata specialist" },
  { id: "8", name: "Highway Truck Repair", distance: "5.0 km", rating: 3.7, isOpen: true, is24x7: true, address: "NH-44 service lane km 42", phone: "+91-9876005678", category: "mechanic" as Category, tag: "24hr emergency" },
  { id: "9", name: "NHAI Truck Parking", distance: "0.5 km", rating: 4.0, isOpen: true, is24x7: true, address: "NH-44, designated parking zone", phone: "+91-9654001234", category: "parking" as Category, tag: "CCTV • 200 trucks" },
  { id: "10", name: "Logistic Park", distance: "3.2 km", rating: 4.4, isOpen: true, is24x7: true, address: "Butibori logistic hub", phone: "+91-9654005678", category: "parking" as Category, tag: "Secured • Canteen" },
];

export function FuelRest() {
  const { t } = useLang();
  const [activeCategory, setActiveCategory] = useState<Category>("fuel");
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [address, setAddress] = useState<string>("");
  const filtered = PLACES.filter(p => p.category === activeCategory);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lng: longitude });
          const addr = await locationService.getAddress(latitude, longitude);
          setAddress(addr);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const CATEGORIES = [
    { key: "fuel" as Category, label: t.fuelStations, icon: Fuel, color: "text-orange-500", activeBg: "bg-orange-500" },
    { key: "dhaba" as Category, label: t.dhabas, icon: Coffee, color: "text-amber-600", activeBg: "bg-amber-500" },
    { key: "mechanic" as Category, label: t.mechanics, icon: Wrench, color: "text-purple-600", activeBg: "bg-purple-600" },
    { key: "parking" as Category, label: t.parking, icon: ParkingCircle, color: "text-[#1a4999]", activeBg: "bg-[#1a4999]" },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <div className="bg-[#1a4999] px-4 pt-10 pb-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-white text-xl font-semibold">Nearby Places</h1>
            <p className="text-white/60 text-sm mt-0.5">{t.nearbyFacilities}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 bg-white/10 rounded-xl px-3 py-2">
          <MapPin size={14} className="text-orange-300" />
          <span className="text-white/80 text-sm">
            {address || (coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Searching for location...")}
          </span>
          <span className="text-white/40 text-xs ml-auto">Live</span>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all ${activeCategory === cat.key ? `${cat.activeBg} shadow-md` : "bg-white"}`}>
              <cat.icon size={20} className={activeCategory === cat.key ? "text-white" : cat.color} />
              <span className={`text-xs font-semibold leading-tight text-center ${activeCategory === cat.key ? "text-white" : "text-[#4a5f7a]"}`}>
                {cat.label.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 flex items-center justify-between">
        <p className="text-[#0f1c35] font-semibold">{filtered.length} {t.placesNearby}</p>
        <p className="text-[#4a5f7a] text-sm">{t.sortedByDistance}</p>
      </div>

      <div className="px-4 mt-3 flex flex-col gap-3">
        {filtered.map(place => (
          <div key={place.id} className="bg-white rounded-2xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[#0f1c35] font-semibold text-sm">{place.name}</p>
                  {place.is24x7 && <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">{t.open24x7}</span>}
                  {!place.isOpen && <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">{t.closed}</span>}
                </div>
                <p className="text-[#4a5f7a] text-xs mt-0.5">{place.address}</p>
                {place.tag && <p className="text-[#1a4999] text-xs mt-1 font-semibold">★ {place.tag}</p>}
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-[#1a4999] font-semibold text-sm">{place.distance}</p>
                <div className="flex items-center gap-0.5 justify-end">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="text-[#4a5f7a] text-xs">{place.rating}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <a href={`tel:${place.phone}`} className="flex-1 bg-[#1a4999] text-white rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-sm font-semibold">
                <Phone size={15} />{t.call}
              </a>
              <button className="flex-1 bg-[#f0f4f8] text-[#0f1c35] rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-sm">
                <Navigation size={15} />{t.navigate}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 mt-4 mb-2">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2">
          <Clock size={16} className="text-red-600 shrink-0" />
          <p className="text-red-700 text-xs">For breakdowns: Call highway helpline <span className="font-bold">1033</span> (NHAI 24/7)</p>
        </div>
      </div>
    </div>
  );
}
