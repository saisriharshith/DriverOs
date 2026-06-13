import axiosInstance from './axiosConfig';

// ── Cached coords so we only ask the browser / IP once ─────────────────────
let _cachedCoords: { lat: number; lng: number; source: 'gps' | 'ip' } | null = null;

// ── 1. IP-based geolocation (free, no API key, works always) ───────────────
async function getLocationByIP(): Promise<{ lat: number; lng: number; city: string; region: string }> {
  // Try ip-api.com first (free, no key needed)
  try {
    const res = await fetch('http://ip-api.com/json/?fields=status,city,regionName,lat,lon');
    if (res.ok) {
      const d = await res.json();
      if (d.status === 'success') {
        return { lat: d.lat, lng: d.lon, city: d.city || '', region: d.regionName || '' };
      }
    }
  } catch { /* fall through */ }

  // Try ipapi.co as second option (free tier, no key needed)
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const d = await res.json();
      if (d.latitude) {
        return { lat: d.latitude, lng: d.longitude, city: d.city || '', region: d.region || '' };
      }
    }
  } catch { /* fall through */ }

  throw new Error('IP geolocation failed');
}

// ── 2. GPS via browser ─────────────────────────────────────────────────────
function getBrowserGPS(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

// ── 3. Reverse geocode lat/lng → "City, State" ─────────────────────────────
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // BigDataCloud (free, no key)
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (res.ok) {
      const d = await res.json();
      const city = d.locality || d.city || '';
      const state = d.principalSubdivision || d.administrativeLevel2 || '';
      const result = [city, state].filter(Boolean).join(', ');
      if (result && result !== ',') return result;
    }
  } catch { /* fall through */ }

  // OpenStreetMap Nominatim fallback (free, no key)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'DriverOS-India/1.0' } }
    );
    if (res.ok) {
      const d = await res.json();
      const a = d.address || {};
      const city = a.city || a.town || a.village || a.county || a.suburb || '';
      const state = a.state || '';
      const result = [city, state].filter(Boolean).join(', ');
      if (result) return result;
    }
  } catch { /* fall through */ }

  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// ── Google Maps URL helpers ─────────────────────────────────────────────────
export function getMapsSearchUrl(lat: number, lng: number, query: string): string {
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},14z`;
}

export function getMapsNavigateUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// ── Main export: get best available location ────────────────────────────────
export const locationService = {
  /** Push coordinates to backend (silent fail) */
  updateLocation: async (lat: number, lng: number) => {
    try {
      await axiosInstance.post('locations/', { latitude: lat, longitude: lng });
    } catch { /* silent */ }
  },

  /**
   * Returns real location using:
   *  1. Cached result (instant)
   *  2. Browser GPS (most accurate — needs user permission)
   *  3. IP geolocation fallback (always works, ~city level accuracy)
   */
  getAddressFromBrowser: async (): Promise<{
    address: string;
    lat: number;
    lng: number;
    source: 'gps' | 'ip' | 'none';
  }> => {
    // Return cache if available
    if (_cachedCoords) {
      const address = await reverseGeocode(_cachedCoords.lat, _cachedCoords.lng);
      return { address, lat: _cachedCoords.lat, lng: _cachedCoords.lng, source: _cachedCoords.source };
    }

    // Try GPS first (most accurate)
    try {
      const { lat, lng } = await getBrowserGPS();
      _cachedCoords = { lat, lng, source: 'gps' };
      const address = await reverseGeocode(lat, lng);
      // Push to backend silently
      locationService.updateLocation(lat, lng);
      return { address, lat, lng, source: 'gps' };
    } catch (gpsErr) {
      console.warn('GPS unavailable, falling back to IP geolocation:', gpsErr);
    }

    // Fallback: IP-based location (works without any permission)
    try {
      const { lat, lng, city, region } = await getLocationByIP();
      _cachedCoords = { lat, lng, source: 'ip' };
      // Build address from IP API response directly (faster than extra geocode call)
      const address = [city, region].filter(Boolean).join(', ') || await reverseGeocode(lat, lng);
      return { address, lat, lng, source: 'ip' };
    } catch (ipErr) {
      console.error('IP geolocation also failed:', ipErr);
    }

    return { address: 'Location unavailable', lat: 0, lng: 0, source: 'none' };
  },

  /** Legacy compat */
  getAddress: (lat: number, lng: number) => reverseGeocode(lat, lng),
};
