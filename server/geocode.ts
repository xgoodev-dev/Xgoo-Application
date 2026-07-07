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
  return pincode.replace(/\D/g, "").slice(0, 6);
}

const NOMINATIM_HEADERS = { "User-Agent": "XGoo-Courier-SaaS/1.0", "Accept-Language": "en" };

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

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
  const addressLine = street || row.display_name.split(",")[0] || row.display_name;

  return {
    lat: parseFloat(row.lat),
    lng: parseFloat(row.lon),
    displayName: row.display_name,
    address: street ? `${street}${locality ? `, ${locality}` : ""}` : row.display_name,
    city: addr.city || addr.town || addr.village || addr.suburb || addr.county || "",
    state: addr.state || "",
    pincode: normalizePincode(addr.postcode || ""),
  };
}

export async function searchIndianAddresses(query: string, limit = 5): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=${limit}&countrycodes=in&addressdetails=1`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
      address?: NominatimAddress;
    }>;
    return data.map(parseNominatimRow);
  } catch {
    return [];
  }
}

export async function reverseGeocodeLatLng(lat: number, lng: number): Promise<GeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      lat: string;
      lon: string;
      display_name: string;
      address?: NominatimAddress;
    };
    return parseNominatimRow(data);
  } catch {
    return null;
  }
}

export async function geocodeIndianPincode(
  pincode: string,
): Promise<{ lat: number; lng: number } | null> {
  const normalized = normalizePincode(pincode);
  if (normalized.length !== 6) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${normalized}&country=India&format=json&limit=1`;
    const res = await fetch(url, {
      headers: NOMINATIM_HEADERS,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
