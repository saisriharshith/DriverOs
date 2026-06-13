import { useState, useEffect, useCallback } from "react";
import { Fuel, Coffee, Wrench, ParkingCircle, Phone, Star, Clock, MapPin, Navigation, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useLang } from "../LanguageContext";
import { locationService, getMapsSearchUrl, getMapsNavigateUrl } from "../api/location.service";

type Category = "fuel" | "dhaba" | "mechanic" | "parking";

interface Place {
  id: string;
  name: string;
  distanceKm: number;
  address: string;
  phone?: string;
  category: Category;
  tag?: string;
  lat: number;
  lng: number;
  osmTags?: Record<string, string>;
}

// ── Haversine distance (km) ────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// ── Overpass API query builder ─────────────────────────────────────────────
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const RADIUS = 8000; // 8 km search radius

const OSM_FILTERS: Record<Category, string> = {
  fuel: `node["amenity"="fuel"]`,
  dhaba: `node["amenity"~"restaurant|fast_food|cafe"]`,
  mechanic: `node["shop"~"car_repair|tyres|vehicle"]`,
  parking: `node["amenity"="parking"]`,
};

async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  category: Category
): Promise<Place[]> {
  const filter = OSM_FILTERS[category];
  const query = `
    [out:json][timeout:15];
    (
      ${filter}(around:${RADIUS},${lat},${lng});
      way${filter.replace("node", "")}(around:${RADIUS},${lat},${lng});
    );
    out center 30;
  `;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
  const data = await res.json();

  return (data.elements as any[])
    .map((el: any) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (!elLat || !elLng) return null;

      const tags = el.tags || {};
      const name =
        tags.name ||
        tags["name:en"] ||
        tags.brand ||
        (category === "fuel" ? "Fuel Station" : category === "dhaba" ? "Restaurant" : category === "mechanic" ? "Auto Repair" : "Parking");

      const distanceKm = haversine(lat, lng, elLat, elLng);

      // Build a readable address from OSM tags
      const addrParts = [
        tags["addr:housename"],
        tags["addr:street"],
        tags["addr:suburb"],
        tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
      ].filter(Boolean);
      const address = addrParts.length > 0 ? addrParts.join(", ") : `${elLat.toFixed(4)}, ${elLng.toFixed(4)}`;

      // Pick a relevant tag label
      let tag: string | undefined;
      if (category === "fuel") {
        const fuels = [
          tags.fuel_cards && "Card Accepted",
          tags["fuel:adblue"] === "yes" && "AdBlue",
          tags["fuel:cng"] === "yes" && "CNG",
          tags["fuel:e85"] === "yes" && "E85",
          tags["fuel:octane_91"] && "Petrol",
          tags["fuel:diesel"] && "Diesel",
        ].filter(Boolean);
        tag = fuels.slice(0, 2).join(" • ") || undefined;
      } else if (category === "dhaba") {
        tag = tags.cuisine ? `Cuisine: ${tags.cuisine.replace(/_/g, " ")}` : undefined;
      } else if (category === "mechanic") {
        tag = tags.service ? `Service: ${tags.service}` : undefined;
      } else if (category === "parking") {
        const spots = tags.capacity ? `${tags.capacity} spots` : "";
        const fee = tags.fee === "yes" ? "Paid" : tags.fee === "no" ? "Free" : "";
        tag = [spots, fee].filter(Boolean).join(" • ") || undefined;
      }

      return {
        id: String(el.id),
        name,
        distanceKm,
        address,
        phone: tags.phone || tags["contact:phone"],
        category,
        tag,
        lat: elLat,
        lng: elLng,
        osmTags: tags,
      } as Place;
    })
    .filter(Boolean)
    .sort((a, b) => a!.distanceKm - b!.distanceKm)
    .slice(0, 15) as Place[];
}

// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_QUERIES: Record<Category, string> = {
  fuel: "petrol bunk fuel station",
  dhaba: "dhaba restaurant truck stop",
  mechanic: "car repair mechanic auto garage",
  parking: "truck parking lot",
};

const CATEGORY_META = [
  { key: "fuel" as Category, label: "Fuel", icon: Fuel, color: "text-orange-500", activeBg: "bg-orange-500" },
  { key: "dhaba" as Category, label: "Dhabas", icon: Coffee, color: "text-amber-600", activeBg: "bg-amber-500" },
  { key: "mechanic" as Category, label: "Mechanic", icon: Wrench, color: "text-purple-600", activeBg: "bg-purple-600" },
  { key: "parking" as Category, label: "Parking", icon: ParkingCircle, color: "text-[#1a4999]", activeBg: "bg-[#1a4999]" },
];

export function FuelRest() {
  const { t } = useLang();
  const [activeCategory, setActiveCategory] = useState<Category>("fuel");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch location once ────────────────────────────────────────────────────
  useEffect(() => {
    locationService.getAddressFromBrowser().then(({ address: addr, lat, lng }) => {
      if (lat !== 0) setCoords({ lat, lng });
      setAddress(addr);
    });
  }, []);

  // ── Fetch real places whenever category or coords change ───────────────────
  const loadPlaces = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    setError(null);
    try {
      const results = await fetchNearbyPlaces(coords.lat, coords.lng, activeCategory);
      setPlaces(results);
    } catch (err) {
      console.error("Overpass fetch failed:", err);
      setError("Could not load live data. Tap retry or search on Google Maps.");
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [coords, activeCategory]);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      {/* Header */}
      <div className="bg-[#1a4999] px-4 pt-10 pb-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-white text-xl font-semibold">Nearby Places</h1>
            <p className="text-white/60 text-sm mt-0.5">{t.nearbyFacilities}</p>
          </div>
          <button
            onClick={loadPlaces}
            className="bg-white/10 p-2 rounded-xl"
            title="Refresh"
          >
            <RefreshCw size={16} className="text-white" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 bg-white/10 rounded-xl px-3 py-2">
          <MapPin size={14} className="text-orange-300" />
          <span className="text-white/80 text-sm">
            {address || (coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Detecting location…")}
          </span>
          <span className="text-green-400 text-xs ml-auto font-semibold">● Live</span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-4 gap-2">
          {CATEGORY_META.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all ${
                activeCategory === cat.key ? `${cat.activeBg} shadow-md` : "bg-white"
              }`}
            >
              <cat.icon
                size={20}
                className={activeCategory === cat.key ? "text-white" : cat.color}
              />
              <span
                className={`text-xs font-semibold leading-tight text-center ${
                  activeCategory === cat.key ? "text-white" : "text-[#4a5f7a]"
                }`}
              >
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Count + Maps button */}
      <div className="px-4 mt-4 flex items-center justify-between">
        <p className="text-[#0f1c35] font-semibold">
          {loading ? "Loading…" : `${places.length} found nearby`}
        </p>
        {coords && (
          <a
            href={getMapsSearchUrl(coords.lat, coords.lng, CATEGORY_QUERIES[activeCategory])}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[#1a4999] text-white text-xs font-semibold px-3 py-1.5 rounded-xl"
          >
            <Navigation size={12} /> Google Maps
          </a>
        )}
      </div>

      {/* ── Place cards ───────────────────────────────────────────────────── */}
      <div className="px-4 mt-3 flex flex-col gap-3">

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className="text-[#1a4999] animate-spin" />
            <p className="text-[#4a5f7a] text-sm">Searching nearby on OpenStreetMap…</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={loadPlaces}
              className="bg-red-500 text-white text-sm font-semibold py-2 rounded-xl flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> Retry
            </button>
            {coords && (
              <a
                href={getMapsSearchUrl(coords.lat, coords.lng, CATEGORY_QUERIES[activeCategory])}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1a4999] text-white text-sm font-semibold py-2 rounded-xl flex items-center justify-center gap-2"
              >
                <Navigation size={14} /> Search on Google Maps
              </a>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && places.length === 0 && (
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
            <MapPin size={32} className="text-[#4a5f7a]" />
            <p className="text-[#0f1c35] font-semibold">No places found within 8 km</p>
            <p className="text-[#4a5f7a] text-xs">Try searching on Google Maps for more options</p>
            {coords && (
              <a
                href={getMapsSearchUrl(coords.lat, coords.lng, CATEGORY_QUERIES[activeCategory])}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1a4999] text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <Navigation size={14} /> Open Google Maps
              </a>
            )}
          </div>
        )}

        {/* Real place cards */}
        {!loading && !error && places.map((place) => (
          <div key={place.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[#0f1c35] font-semibold text-sm leading-snug">{place.name}</p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={10} className="text-[#4a5f7a] shrink-0" />
                  <p className="text-[#4a5f7a] text-xs leading-snug">{place.address}</p>
                </div>
                {place.tag && (
                  <p className="text-[#1a4999] text-xs mt-1 font-semibold">★ {place.tag}</p>
                )}
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-[#1a4999] font-bold text-sm">{fmtDist(place.distanceKm)}</p>
                <p className="text-[#4a5f7a] text-[10px] mt-0.5">away</p>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              {place.phone ? (
                <a
                  href={`tel:${place.phone}`}
                  className="flex-1 bg-[#1a4999] text-white rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-sm font-semibold"
                >
                  <Phone size={15} /> {t.call}
                </a>
              ) : (
                <div className="flex-1 bg-gray-100 text-gray-400 rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-sm">
                  <Phone size={15} /> No number
                </div>
              )}
              <a
                href={getMapsNavigateUrl(place.lat, place.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-sm font-semibold"
              >
                <Navigation size={15} /> Navigate
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency helpline */}
      <div className="px-4 mt-4 mb-2">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2">
          <Clock size={16} className="text-red-600 shrink-0" />
          <p className="text-red-700 text-xs">
            For breakdowns: Call highway helpline{" "}
            <a href="tel:1033" className="font-bold underline">1033</a> (NHAI 24/7)
          </p>
        </div>
      </div>
    </div>
  );
}
