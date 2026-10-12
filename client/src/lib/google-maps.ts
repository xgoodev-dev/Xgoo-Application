/// <reference types="@types/google.maps" />

/**
 * Google Maps JavaScript API singleton loader.
 */

const MAPS_SCRIPT_ID = "google-maps-js-sdk";
const MAPS_CALLBACK = "__xgooInitGoogleMaps";

let loadPromise: Promise<typeof google.maps> | null = null;
let keyResolvePromise: Promise<string> | null = null;

declare global {
  interface Window {
    __APP_CONFIG__?: {
      VITE_GOOGLE_MAPS_API_KEY?: string;
      VITE_GOOGLE_CLIENT_ID?: string;
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      VITE_DEFAULT_OFFICE_SLUG?: string;
      VITE_SITE_URL?: string;
      VITE_META_PIXEL_ID?: string;
      VITE_WHATSAPP_NUMBER?: string;
    };
    __xgooInitGoogleMaps?: () => void;
  }
}

function readViteMapsKey(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return (env.VITE_GOOGLE_MAPS_API_KEY || env.GOOGLE_MAPS_API_KEY || "").trim();
}

export function getClientGoogleMapsApiKey(): string {
  if (typeof window !== "undefined") {
    const fromRuntime = window.__APP_CONFIG__?.VITE_GOOGLE_MAPS_API_KEY?.trim();
    if (fromRuntime) return fromRuntime;
  }
  return readViteMapsKey();
}

export function isGoogleMapsKeyConfigured(): boolean {
  return Boolean(getClientGoogleMapsApiKey());
}

export async function resolveClientGoogleMapsApiKey(): Promise<string> {
  const existing = getClientGoogleMapsApiKey();
  if (existing) return existing;
  if (typeof window === "undefined") return "";
  if (!keyResolvePromise) {
    keyResolvePromise = fetch("/api/public/maps-config")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const existingAfterFetch = getClientGoogleMapsApiKey();
        if (existingAfterFetch) return existingAfterFetch;
        return data?.configured ? existingAfterFetch : "";
      })
      .catch(() => getClientGoogleMapsApiKey());
  }
  return keyResolvePromise;
}

/** Convert a click on a Google Static Map image into lat/lng (Web Mercator). */
export function pixelToLatLng(
  x: number,
  y: number,
  width: number,
  height: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
): { lat: number; lng: number } {
  const scale = 256 * 2 ** zoom;
  const worldX = ((centerLng + 180) / 360) * scale;
  const sinLat = Math.sin((centerLat * Math.PI) / 180);
  const worldY = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  const clickX = worldX + (x - width / 2);
  const clickY = worldY + (y - height / 2);
  const lng = (clickX / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * clickY) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat, lng };
}

function mapsNamespace(): typeof google.maps | null {
  return (window as unknown as { google?: { maps?: typeof google.maps } }).google?.maps ?? null;
}

/**
 * Dynamically loads the Google Maps JavaScript API once.
 * `loading=async` requires a global callback — script.onload is not enough.
 */
function attachGoogleMapsScript(apiKey: string): Promise<typeof google.maps> {
  return new Promise((resolve, reject) => {
    const finish = () => {
      const maps = mapsNamespace();
      if (maps) {
        resolve(maps);
        return true;
      }
      return false;
    };

    const previousCallback = window.__xgooInitGoogleMaps;
    window.__xgooInitGoogleMaps = () => {
      if (typeof previousCallback === "function") previousCallback();
      if (!finish()) {
        loadPromise = null;
        reject(new Error("Google Maps loaded but window.google.maps is undefined"));
      }
    };

    if (document.getElementById(MAPS_SCRIPT_ID)) {
      if (finish()) return;
      const started = Date.now();
      const poll = window.setInterval(() => {
        if (finish() || Date.now() - started > 15000) {
          window.clearInterval(poll);
          if (!mapsNamespace()) {
            loadPromise = null;
            reject(new Error("Timed out waiting for Google Maps"));
          }
        }
      }, 50);
      return;
    }

    const script = document.createElement("script");
    script.id = MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${MAPS_CALLBACK}`;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Google Maps JS SDK"));
    };
    document.head.appendChild(script);
  });
}

export function loadGoogleMapsScript(): Promise<typeof google.maps> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Cannot load Google Maps in a non-browser environment"));
  }

  const already = mapsNamespace();
  if (already) return Promise.resolve(already);
  if (loadPromise) return loadPromise;

  loadPromise = resolveClientGoogleMapsApiKey()
    .then((apiKey) => {
      if (!apiKey) {
        throw new Error("Missing Google Maps API key");
      }
      return attachGoogleMapsScript(apiKey);
    })
    .catch((error) => {
      loadPromise = null;
      throw error;
    });

  return loadPromise;
}

/**
 * Creates custom SVG data URL marker icons for Google Maps markers.
 */
export function createGoogleMapPinSvg({
  color = "#FF4907",
  letter = "",
  size = 36,
}: {
  color?: string;
  letter?: string;
  size?: number;
}): google.maps.Icon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 36 36">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <circle cx="18" cy="18" r="16" fill="${color}" stroke="#FFFFFF" stroke-width="2.5" filter="url(#shadow)" />
      ${
        letter
          ? `<text x="18" y="23" font-size="14" font-family="system-ui, -apple-system, sans-serif" font-weight="700" fill="#FFFFFF" text-anchor="middle">${letter}</text>`
          : `<circle cx="18" cy="18" r="5" fill="#FFFFFF" />`
      }
    </svg>
  `.trim();

  const g = (window as unknown as { google?: typeof google }).google;
  const sizeObj = g?.maps ? new g.maps.Size(size, size) : undefined;
  const pointObj = g?.maps ? new g.maps.Point(size / 2, size / 2) : undefined;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: sizeObj,
    anchor: pointObj,
  };
}
