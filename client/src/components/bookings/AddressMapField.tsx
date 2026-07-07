import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AddressMapValue {
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
}

interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface AddressMapFieldProps {
  label?: string;
  testIdPrefix: string;
  value: AddressMapValue;
  onChange: (value: AddressMapValue) => void;
  className?: string;
}

function createLeafletIcon(L: typeof import("leaflet")) {
  return L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

export function AddressMapField({ label, testIdPrefix, value, onChange, className }: AddressMapFieldProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pinnedLabel, setPinnedLabel] = useState("");

  const applyGeocodeResult = useCallback(
    (result: GeocodeResult) => {
      setPinnedLabel(result.displayName);
      setSearchQuery(result.displayName);
      onChange({
        address: result.address || result.displayName,
        city: result.city || value.city,
        state: result.state || value.state,
        pincode: result.pincode || value.pincode,
        lat: result.lat,
        lng: result.lng,
      });
    },
    [onChange, value.city, value.pincode, value.state],
  );

  const placeMarker = useCallback(
    async (lat: number, lng: number, fly = true) => {
      const map = leafletMapRef.current;
      const L = leafletRef.current;
      if (!map || !L) return;

      if (fly) {
        map.setView([lat, lng], 16);
      }

      const icon = createLeafletIcon(L);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
        markerRef.current.on("dragend", async () => {
          const pos = markerRef.current!.getLatLng();
          try {
            const res = await fetch(`/api/geocode/reverse?lat=${pos.lat}&lng=${pos.lng}`);
            if (res.ok) {
              const data = (await res.json()) as GeocodeResult;
              applyGeocodeResult(data);
            }
          } catch {
            onChange({ ...value, lat: pos.lat, lng: pos.lng });
          }
        });
      }
    },
    [applyGeocodeResult, onChange, value],
  );

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapRef.current) return;

      leafletRef.current = L;
      const defaultLat = value.lat ?? 20.5937;
      const defaultLng = value.lng ?? 78.9629;
      const zoom = value.lat != null ? 16 : 5;

      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        await placeMarker(lat, lng, false);
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
          if (res.ok) {
            const data = (await res.json()) as GeocodeResult;
            applyGeocodeResult(data);
          } else {
            onChange({ ...value, lat, lng });
          }
        } catch {
          onChange({ ...value, lat, lng });
        }
      });

      leafletMapRef.current = map;

      if (value.lat != null && value.lng != null) {
        await placeMarker(value.lat, value.lng, false);
      }
    })();

    return () => {
      cancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value.lat != null && value.lng != null && leafletMapRef.current) {
      placeMarker(value.lat, value.lng, true);
    }
  }, [value.lat, value.lng, placeMarker]);

  const runSearch = async (query: string) => {
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = (await res.json()) as GeocodeResult[];
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = (text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => runSearch(text), 450);
  };

  const selectSuggestion = async (item: GeocodeResult) => {
    setShowSuggestions(false);
    applyGeocodeResult(item);
    await placeMarker(item.lat, item.lng);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await placeMarker(latitude, longitude);
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`);
          if (res.ok) {
            const data = (await res.json()) as GeocodeResult;
            applyGeocodeResult(data);
          }
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true },
    );
  };

  return (
    <div className={cn("space-y-2 rounded-lg border border-dashed p-3 bg-muted/20", className)}>
      {label && (
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {label}
        </p>
      )}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search address, area, or pincode…"
            data-testid={`input-${testIdPrefix}-map-search`}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => runSearch(searchQuery)}
            data-testid={`button-${testIdPrefix}-map-search`}
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={detectLocation}
            disabled={isLocating}
            data-testid={`button-${testIdPrefix}-detect-location`}
          >
            {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          </Button>
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <ul
            className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-auto"
            data-testid={`list-${testIdPrefix}-suggestions`}
          >
            {suggestions.map((item, i) => (
              <li key={`${item.lat}-${item.lng}-${i}`}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(item)}
                >
                  {item.displayName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div
        ref={mapRef}
        className="h-[200px] rounded-md border bg-muted"
        data-testid={`map-${testIdPrefix}`}
      />
      {pinnedLabel && (
        <p className="text-xs text-muted-foreground flex items-start gap-1">
          <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
          <span data-testid={`text-${testIdPrefix}-pinned`}>{pinnedLabel}</span>
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        Search an address or click the map to pin the location. City, state, and pincode autofill when found.
      </p>
    </div>
  );
}
