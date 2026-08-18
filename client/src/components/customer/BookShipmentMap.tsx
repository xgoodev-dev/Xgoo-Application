import { useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ShipmentMapPoint = {
  lat: number;
  lng: number;
  label: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
};

export type AddressScope = "domestic" | "international";
export type ActivePin = "pickup" | "destination";

export type BookShipmentMapProps = {
  scope: AddressScope;
  activePin: ActivePin;
  pickup: ShipmentMapPoint | null;
  destination: ShipmentMapPoint | null;
  onPickupChange: (p: ShipmentMapPoint) => void;
  onDestinationChange: (p: ShipmentMapPoint) => void;
  className?: string;
};

const INDIA_CENTER: [number, number] = [20.59, 78.96];
const WORLD_CENTER: [number, number] = [20, 0];
const PICKUP_COLOR = "#FF4907";
const DESTINATION_COLOR = "#16A34A";
const ROUTE_COLOR = "#166534";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

const NOMINATIM_HEADERS: HeadersInit = {
  Accept: "application/json",
  "Accept-Language": "en",
};

/** Simple polite Nominatim gate (~1 req/sec). */
let nominatimChain: Promise<void> = Promise.resolve();
let lastNominatimAt = 0;

async function withNominatimRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  const run = nominatimChain.then(async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastNominatimAt));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastNominatimAt = Date.now();
    return fn();
  });
  nominatimChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  country?: string;
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  house_number?: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name?: string;
  address?: NominatimAddress;
};

function parseNominatimResult(data: NominatimResult, lat: number, lng: number): ShipmentMapPoint {
  const addr = data.address ?? {};
  const city =
    addr.city || addr.town || addr.village || addr.municipality || addr.county || undefined;
  const roadParts = [addr.house_number, addr.road, addr.suburb || addr.neighbourhood].filter(
    Boolean,
  );
  const address = roadParts.length > 0 ? roadParts.join(", ") : data.display_name || undefined;

  return {
    lat,
    lng,
    label: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    address,
    city,
    state: addr.state || addr.state_district || undefined,
    pincode: addr.postcode || undefined,
    country: addr.country || undefined,
  };
}

export async function reverseGeocodePoint(lat: number, lng: number): Promise<ShipmentMapPoint> {
  try {
    const data = await withNominatimRateLimit(async () => {
      const res = await fetch(
        `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: NOMINATIM_HEADERS },
      );
      if (!res.ok) throw new Error(`Nominatim reverse failed: ${res.status}`);
      return (await res.json()) as NominatimResult;
    });
    return parseNominatimResult(data, lat, lng);
  } catch {
    return {
      lat,
      lng,
      label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    };
  }
}

export async function searchAddresses(
  query: string,
  scope: AddressScope,
): Promise<ShipmentMapPoint[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const countryParam = scope === "domestic" ? "&countrycodes=in" : "";
    const results = await withNominatimRateLimit(async () => {
      const res = await fetch(
        `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(q)}&limit=8&addressdetails=1${countryParam}`,
        { headers: NOMINATIM_HEADERS },
      );
      if (!res.ok) throw new Error(`Nominatim search failed: ${res.status}`);
      return (await res.json()) as NominatimResult[];
    });

    return (results ?? []).map((item) => {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      return parseNominatimResult(item, lat, lng);
    });
  } catch {
    return [];
  }
}

function createPinIcon(
  L: typeof import("leaflet"),
  color: string,
  letter: string,
): import("leaflet").DivIcon {
  return L.divIcon({
    className: "book-shipment-pin",
    html: `<div style="
      width:36px;height:36px;border-radius:9999px;
      background:${color};color:#fff;font-weight:700;font-size:14px;
      display:flex;align-items:center;justify-content:center;
      border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);
      font-family:system-ui,sans-serif;line-height:1;
    ">${letter}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

function samePoint(
  a: ShipmentMapPoint | null | undefined,
  lat: number,
  lng: number,
  epsilon = 1e-6,
): boolean {
  if (!a) return false;
  return Math.abs(a.lat - lat) < epsilon && Math.abs(a.lng - lng) < epsilon;
}

function defaultViewForScope(scope: AddressScope): { center: [number, number]; zoom: number } {
  return scope === "domestic"
    ? { center: INDIA_CENTER, zoom: 5 }
    : { center: WORLD_CENTER, zoom: 2 };
}

async function fetchOsrmRoute(
  pickup: ShipmentMapPoint,
  destination: ShipmentMapPoint,
): Promise<[number, number][] | null> {
  try {
    const url = `${OSRM_BASE}/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
    };
    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (!coords?.length) return null;
    // GeoJSON is [lng, lat] → Leaflet wants [lat, lng]
    return coords.map(([lng, lat]) => [lat, lng] as [number, number]);
  } catch {
    return null;
  }
}

export function BookShipmentMap({
  scope,
  activePin,
  pickup,
  destination,
  onPickupChange,
  onDestinationChange,
  className,
}: BookShipmentMapProps) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const pickupMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const destinationMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const routeLineRef = useRef<import("leaflet").Polyline | null>(null);
  const routeRequestIdRef = useRef(0);

  const activePinRef = useRef(activePin);
  const pickupRef = useRef(pickup);
  const destinationRef = useRef(destination);
  const onPickupChangeRef = useRef(onPickupChange);
  const onDestinationChangeRef = useRef(onDestinationChange);
  const scopeRef = useRef(scope);

  activePinRef.current = activePin;
  pickupRef.current = pickup;
  destinationRef.current = destination;
  onPickupChangeRef.current = onPickupChange;
  onDestinationChangeRef.current = onDestinationChange;
  scopeRef.current = scope;

  const fitOrFly = (
    map: import("leaflet").Map,
    nextPickup: ShipmentMapPoint | null,
    nextDest: ShipmentMapPoint | null,
  ) => {
    const L = LRef.current;
    if (nextPickup && nextDest && L) {
      const bounds = L.latLngBounds([
        [nextPickup.lat, nextPickup.lng],
        [nextDest.lat, nextDest.lng],
      ]);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
      return;
    }
    const alone = nextPickup || nextDest;
    if (alone) {
      map.flyTo([alone.lat, alone.lng], 15, { duration: 0.6 });
      return;
    }
    const view = defaultViewForScope(scopeRef.current);
    map.setView(view.center, view.zoom);
  };

  const clearRoute = () => {
    const map = mapRef.current;
    if (map && routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
  };

  const updateRoute = async (
    nextPickup: ShipmentMapPoint | null,
    nextDest: ShipmentMapPoint | null,
  ) => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    if (!nextPickup || !nextDest) {
      clearRoute();
      return;
    }

    const requestId = ++routeRequestIdRef.current;
    const osrmLatLngs = await fetchOsrmRoute(nextPickup, nextDest);
    if (requestId !== routeRequestIdRef.current || !mapRef.current || !LRef.current) return;

    const latlngs: [number, number][] = osrmLatLngs ?? [
      [nextPickup.lat, nextPickup.lng],
      [nextDest.lat, nextDest.lng],
    ];

    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs(latlngs);
    } else {
      routeLineRef.current = L.polyline(latlngs, {
        color: ROUTE_COLOR,
        weight: 4,
        opacity: 0.85,
        lineJoin: "round",
      }).addTo(map);
    }

    map.fitBounds(routeLineRef.current.getBounds(), { padding: [48, 48], maxZoom: 15 });
  };

  const ensureMarker = (
    kind: ActivePin,
    point: ShipmentMapPoint,
    { reverseOnDrag = true }: { reverseOnDrag?: boolean } = {},
  ) => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    const isPickup = kind === "pickup";
    const markerRef = isPickup ? pickupMarkerRef : destinationMarkerRef;
    const color = isPickup ? PICKUP_COLOR : DESTINATION_COLOR;
    const letter = isPickup ? "P" : "D";
    const icon = createPinIcon(L, color, letter);

    if (markerRef.current) {
      markerRef.current.setLatLng([point.lat, point.lng]);
      markerRef.current.setIcon(icon);
    } else {
      const marker = L.marker([point.lat, point.lng], {
        icon,
        draggable: true,
        autoPan: true,
      }).addTo(map);

      marker.on("dragend", async () => {
        const pos = marker.getLatLng();
        const geocoded = reverseOnDrag
          ? await reverseGeocodePoint(pos.lat, pos.lng)
          : {
              lat: pos.lat,
              lng: pos.lng,
              label: `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`,
            };
        if (isPickup) onPickupChangeRef.current(geocoded);
        else onDestinationChangeRef.current(geocoded);
      });

      markerRef.current = marker;
    }
  };

  const removeMarker = (kind: ActivePin) => {
    const map = mapRef.current;
    const markerRef = kind === "pickup" ? pickupMarkerRef : destinationMarkerRef;
    if (map && markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  };

  // Init map once
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapElRef.current) return;

      LRef.current = L;
      const view = defaultViewForScope(scopeRef.current);
      const map = L.map(mapElRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView(view.center, view.zoom);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      map.on("click", async (e: import("leaflet").LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const point = await reverseGeocodePoint(lat, lng);
        if (activePinRef.current === "pickup") onPickupChangeRef.current(point);
        else onDestinationChangeRef.current(point);
      });

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 80);

      const p = pickupRef.current;
      const d = destinationRef.current;
      if (p) ensureMarker("pickup", p);
      if (d) ensureMarker("destination", d);
      if (p || d) {
        void updateRoute(p, d);
        if (!(p && d)) fitOrFly(map, p, d);
      }
    })();

    return () => {
      cancelled = true;
      clearRoute();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      pickupMarkerRef.current = null;
      destinationMarkerRef.current = null;
      LRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scope change: reset view only when neither pin is set
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (pickup || destination) return;
    const view = defaultViewForScope(scope);
    map.setView(view.center, view.zoom);
  }, [scope, pickup, destination]);

  // Sync markers + route from props
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !LRef.current) return;

    if (pickup) {
      const existing = pickupMarkerRef.current?.getLatLng();
      if (!existing || !samePoint(pickup, existing.lat, existing.lng)) {
        ensureMarker("pickup", pickup);
      }
    } else {
      removeMarker("pickup");
    }

    if (destination) {
      const existing = destinationMarkerRef.current?.getLatLng();
      if (!existing || !samePoint(destination, existing.lat, existing.lng)) {
        ensureMarker("destination", destination);
      }
    } else {
      removeMarker("destination");
    }

    void updateRoute(pickup, destination);

    if (pickup && destination) {
      // updateRoute already fitBounds when route is ready; still fit points promptly
      const bounds = LRef.current.latLngBounds([
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng],
      ]);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    } else if (pickup || destination) {
      const alone = pickup || destination!;
      map.flyTo([alone.lat, alone.lng], 15, { duration: 0.55 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);

  const handleRefresh = () => {
    const map = mapRef.current;
    if (!map) return;
    map.invalidateSize();
    const p = pickupRef.current;
    const d = destinationRef.current;
    if (p && d && routeLineRef.current) {
      map.fitBounds(routeLineRef.current.getBounds(), { padding: [48, 48], maxZoom: 15 });
    } else {
      fitOrFly(map, p, d);
    }
    void updateRoute(p, d);
  };

  return (
    <div className={cn("relative h-full min-h-0 w-full overflow-hidden bg-muted/30", className)}>
      <div
        ref={mapElRef}
        className="leaflet-map-contained absolute inset-0 h-full w-full"
        data-testid="book-shipment-map"
      />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute right-3 top-3 z-[1000] h-9 w-9 shadow-md"
        onClick={handleRefresh}
        title="Refresh map"
        data-testid="button-book-shipment-map-refresh"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <style>{`
        .book-shipment-pin {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
