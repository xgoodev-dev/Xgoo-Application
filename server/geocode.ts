/**
 * Google Maps Platform Geocoding, Places, and Directions Integration.
 *
 * Provides central, cached, and robust location services for:
 * - Address search and geocoding (address -> lat/lng)
 * - Reverse geocoding (lat/lng -> address/pincode/city/state)
 * - Pincode lookup
 * - Places autocomplete
 * - Driving route calculation (directions, polylines, road distance, travel duration)
 * - Local Haversine distance calculation (zero-cost geographic distance in km)
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  placeId?: string;
}

export interface AutocompletePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface RouteResult {
  polyline: string; // Encoded polyline or coordinate list
  points: [number, number][]; // [lat, lng] array
  distanceKm: number;
  distanceText: string;
  durationSeconds: number;
  durationText: string;
}

/** Haversine distance in kilometers between two lat/lng points */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
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

export function normalizePincode(pincode: string): string {
  return (pincode || "").replace(/\D/g, "").slice(0, 6);
}

// Simple in-memory LRU cache with TTL (1 hour default) to prevent redundant Google API calls
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached<T>(key: string, value: T, ttlMs = CACHE_TTL_MS): void {
  // Bound cache size to prevent memory leaks
  if (cache.size > 2000) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function getGoogleMapsApiKey(): string | null {
  const key =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim() ||
    process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
    "";
  return key || null;
}

// ---------------------------------------------------------------------------
// Google Maps API Parsers
// ---------------------------------------------------------------------------

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleGeocodeItem = {
  place_id?: string;
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  address_components: GoogleAddressComponent[];
};

function parseGoogleGeocodeItem(item: GoogleGeocodeItem): GeocodeResult {
  const comp = (type: string, useShort = false) => {
    const found = item.address_components?.find((c) => c.types.includes(type));
    return found ? (useShort ? found.short_name : found.long_name) : "";
  };

  const premise = comp("premise") || comp("subpremise");
  const streetNumber = comp("street_number");
  const route = comp("route");
  const sublocality =
    comp("sublocality_level_1") || comp("sublocality") || comp("neighborhood");
  const locality = comp("locality") || comp("postal_town") || comp("administrative_area_level_2");
  const state = comp("administrative_area_level_1");
  const pincode = normalizePincode(comp("postal_code"));
  const country = comp("country");

  const streetParts = [premise, streetNumber, route].filter(Boolean).join(" ");
  const addressLine = [streetParts, sublocality].filter(Boolean).join(", ") || item.formatted_address;

  return {
    lat: item.geometry.location.lat,
    lng: item.geometry.location.lng,
    displayName: item.formatted_address,
    address: addressLine,
    city: locality || sublocality || "",
    state: state || "",
    pincode,
    country,
    placeId: item.place_id,
  };
}

// ---------------------------------------------------------------------------
// Nominatim Fallback (Used seamlessly when no Google API Key is configured)
// ---------------------------------------------------------------------------

const NOMINATIM_HEADERS = { "User-Agent": "XGoo-Courier-SaaS/1.0", "Accept-Language": "en" };

type NominatimAddress = {
  house_number?: string;
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

function parseNominatimRow(row: {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}): GeocodeResult {
  const addr = row.address || {};
  const street = [addr.house_number, addr.road].filter(Boolean).join(" ");
  const locality =
    addr.suburb || addr.neighbourhood || addr.city || addr.town || addr.village || addr.county || "";
  const addressLine = street ? `${street}${locality ? `, ${locality}` : ""}` : row.display_name;

  return {
    lat: parseFloat(row.lat),
    lng: parseFloat(row.lon),
    displayName: row.display_name,
    address: addressLine,
    city: addr.city || addr.town || addr.village || addr.suburb || addr.county || "",
    state: addr.state || "",
    pincode: normalizePincode(addr.postcode || ""),
    country: addr.country,
  };
}

// ---------------------------------------------------------------------------
// Public Geocoding & Address Search API
// ---------------------------------------------------------------------------

export async function searchIndianAddresses(
  query: string,
  limit = 5,
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const cacheKey = `search:${q.toLowerCase()}:${limit}`;
  const cached = getCached<GeocodeResult[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getGoogleMapsApiKey();
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        q,
      )}&components=country:IN&key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as {
          status: string;
          results?: GoogleGeocodeItem[];
        };
        if (data.status === "OK" && data.results?.length) {
          const mapped = data.results.slice(0, limit).map(parseGoogleGeocodeItem);
          setCached(cacheKey, mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn("Google Maps Geocoding search failed, trying fallback:", err);
    }
  }

  // Fallback to OSM Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q,
    )}&limit=${limit}&countrycodes=in&addressdetails=1`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
      address?: NominatimAddress;
    }>;
    const mapped = data.map(parseNominatimRow);
    setCached(cacheKey, mapped);
    return mapped;
  } catch {
    return [];
  }
}

export async function reverseGeocodeLatLng(
  lat: number,
  lng: number,
): Promise<GeocodeResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const roundedLat = Number(lat.toFixed(6));
  const roundedLng = Number(lng.toFixed(6));
  const cacheKey = `rev:${roundedLat},${roundedLng}`;
  const cached = getCached<GeocodeResult>(cacheKey);
  if (cached) return cached;

  const apiKey = getGoogleMapsApiKey();
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${roundedLat},${roundedLng}&key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as {
          status: string;
          results?: GoogleGeocodeItem[];
        };
        if (data.status === "OK" && data.results?.length) {
          const result = parseGoogleGeocodeItem(data.results[0]);
          setCached(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      console.warn("Google Maps reverse geocoding failed, trying fallback:", err);
    }
  }

  // Fallback to OSM Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      lat: string;
      lon: string;
      display_name: string;
      address?: NominatimAddress;
    };
    const result = parseNominatimRow(data);
    setCached(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

export async function geocodeIndianPincode(
  pincode: string,
): Promise<{ lat: number; lng: number } | null> {
  const normalized = normalizePincode(pincode);
  if (normalized.length !== 6) return null;

  const cacheKey = `pincode:${normalized}`;
  const cached = getCached<{ lat: number; lng: number }>(cacheKey);
  if (cached) return cached;

  const apiKey = getGoogleMapsApiKey();
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${normalized}|country:IN&key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as {
          status: string;
          results?: GoogleGeocodeItem[];
        };
        if (data.status === "OK" && data.results?.length) {
          const loc = data.results[0].geometry.location;
          const coords = { lat: loc.lat, lng: loc.lng };
          setCached(cacheKey, coords);
          return coords;
        }
      }
    } catch (err) {
      console.warn("Google Maps pincode geocode failed, trying fallback:", err);
    }
  }

  // Fallback to OSM Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${normalized}&country=India&format=json&limit=1`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    setCached(cacheKey, coords);
    return coords;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Google Places Autocomplete API
// ---------------------------------------------------------------------------

export async function getPlacesAutocomplete(
  input: string,
  country = "IN",
): Promise<AutocompletePrediction[]> {
  const q = input.trim();
  if (q.length < 2) return [];

  const cacheKey = `ac:${country}:${q.toLowerCase()}`;
  const cached = getCached<AutocompletePrediction[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    // Return empty or mapped from standard search
    const results = await searchIndianAddresses(q, 6);
    return results.map((item, idx) => ({
      placeId: item.placeId || `fallback-${idx}`,
      description: item.displayName,
      mainText: item.address,
      secondaryText: [item.city, item.state, item.pincode].filter(Boolean).join(", "),
    }));
  }

  try {
    const countryParam = country ? `&components=country:${country.toLowerCase()}` : "";
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      q,
    )}${countryParam}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = (await res.json()) as {
      status: string;
      predictions?: Array<{
        place_id: string;
        description: string;
        structured_formatting?: {
          main_text?: string;
          secondary_text?: string;
        };
      }>;
    };

    if (data.status === "OK" && data.predictions) {
      const mapped = data.predictions.map((p) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text || p.description,
        secondaryText: p.structured_formatting?.secondary_text || "",
      }));
      setCached(cacheKey, mapped, 10 * 60 * 1000); // 10 min cache
      return mapped;
    }
    return [];
  } catch (err) {
    console.warn("Places autocomplete failed:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Google Directions API & Route Polyline Decoding
// ---------------------------------------------------------------------------

function decodeGooglePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

export async function getDirectionsRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<RouteResult | null> {
  const oLat = Number(originLat.toFixed(5));
  const oLng = Number(originLng.toFixed(5));
  const dLat = Number(destLat.toFixed(5));
  const dLng = Number(destLng.toFixed(5));
  const cacheKey = `route:${oLat},${oLng}->${dLat},${dLng}`;

  const cached = getCached<RouteResult>(cacheKey);
  if (cached) return cached;

  const apiKey = getGoogleMapsApiKey();
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${oLat},${oLng}&destination=${dLat},${dLng}&mode=driving&key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as {
          status: string;
          routes?: Array<{
            overview_polyline?: { points?: string };
            legs?: Array<{
              distance?: { value: number; text: string };
              duration?: { value: number; text: string };
            }>;
          }>;
        };

        if (data.status === "OK" && data.routes?.length) {
          const route = data.routes[0];
          const polyline = route.overview_polyline?.points || "";
          const points = polyline ? decodeGooglePolyline(polyline) : [];
          const leg = route.legs?.[0];
          const distMeters = leg?.distance?.value ?? 0;
          const durationSeconds = leg?.duration?.value ?? 0;

          const result: RouteResult = {
            polyline,
            points,
            distanceKm: Math.round((distMeters / 1000) * 10) / 10,
            distanceText: leg?.distance?.text || `${(distMeters / 1000).toFixed(1)} km`,
            durationSeconds,
            durationText: leg?.duration?.text || `${Math.round(durationSeconds / 60)} mins`,
          };
          setCached(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      console.warn("Google Directions API failed, using fallback:", err);
    }
  }

  // Fallback: Haversine distance with straight line points
  const dist = distanceKm(oLat, oLng, dLat, dLng);
  const approxSpeedKmh = 45; // average road transit speed in India
  const approxDurationSec = Math.round((dist / approxSpeedKmh) * 3600);
  const fallbackResult: RouteResult = {
    polyline: "",
    points: [
      [oLat, oLng],
      [dLat, dLng],
    ],
    distanceKm: Math.round(dist * 10) / 10,
    distanceText: `${Math.round(dist * 10) / 10} km`,
    durationSeconds: approxDurationSec,
    durationText: `${Math.max(1, Math.round(approxDurationSec / 60))} mins`,
  };
  setCached(cacheKey, fallbackResult);
  return fallbackResult;
}
