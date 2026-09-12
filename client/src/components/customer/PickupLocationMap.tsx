import { useEffect, useRef, useState } from "react";
import { LocateFixed, Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PickupLocationMap({
  onLocationSelect,
  initialLat,
  initialLng,
  autoDetectOnMount,
}: {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  initialLat?: number;
  initialLng?: number;
  autoDetectOnMount?: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationName, setLocationName] = useState("");
  const autoDetectRef = useRef(false);

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  async function detectLocation() {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (leafletMapRef.current) {
          leafletMapRef.current.setView([latitude, longitude], 16);
          const L = await import("leaflet");
          const defaultIcon = L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            markerRef.current = L.marker([latitude, longitude], { icon: defaultIcon, draggable: true }).addTo(leafletMapRef.current);
            markerRef.current.on("dragend", async () => {
              const pos = markerRef.current.getLatLng();
              const name = await reverseGeocode(pos.lat, pos.lng);
              setLocationName(name);
              onLocationSelect(pos.lat, pos.lng, name);
            });
          }
        }
        const name = await reverseGeocode(latitude, longitude);
        setLocationName(name);
        onLocationSelect(latitude, longitude, name);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true },
    );
  }

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const loadLeaflet = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      const defaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const lat = initialLat || 20.5937;
      const lng = initialLng || 78.9629;
      const zoom = initialLat ? 15 : 5;

      const map = L.map(mapRef.current!, { zoomControl: true }).setView([lat, lng], zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      if (initialLat && initialLng) {
        markerRef.current = L.marker([initialLat, initialLng], { icon: defaultIcon, draggable: true }).addTo(map);
        markerRef.current.on("dragend", async () => {
          const pos = markerRef.current.getLatLng();
          const name = await reverseGeocode(pos.lat, pos.lng);
          setLocationName(name);
          onLocationSelect(pos.lat, pos.lng, name);
        });
      }

      map.on("click", async (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: defaultIcon, draggable: true }).addTo(map);
          markerRef.current.on("dragend", async () => {
            const pos = markerRef.current.getLatLng();
            const name = await reverseGeocode(pos.lat, pos.lng);
            setLocationName(name);
            onLocationSelect(pos.lat, pos.lng, name);
          });
        }
        const name = await reverseGeocode(lat, lng);
        setLocationName(name);
        onLocationSelect(lat, lng, name);
      });

      leafletMapRef.current = map;

      if (autoDetectOnMount && !initialLat && !autoDetectRef.current) {
        autoDetectRef.current = true;
        setTimeout(() => detectLocation(), 500);
      }
    };

    void loadLeaflet();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  async function searchLocation() {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=in`,
        { headers: { "Accept-Language": "en" } },
      );
      const results = await res.json();
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lon);
        if (leafletMapRef.current) {
          leafletMapRef.current.setView([latNum, lngNum], 16);
          const L = await import("leaflet");
          const defaultIcon = L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });
          if (markerRef.current) {
            markerRef.current.setLatLng([latNum, lngNum]);
          } else {
            markerRef.current = L.marker([latNum, lngNum], { icon: defaultIcon, draggable: true }).addTo(leafletMapRef.current);
            markerRef.current.on("dragend", async () => {
              const pos = markerRef.current.getLatLng();
              const name = await reverseGeocode(pos.lat, pos.lng);
              setLocationName(name);
              onLocationSelect(pos.lat, pos.lng, name);
            });
          }
        }
        setLocationName(display_name);
        onLocationSelect(latNum, lngNum, display_name);
      }
    } catch {
      // ignore search failures
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search location..."
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchLocation())}
          data-testid="input-map-search"
        />
        <Button type="button" variant="outline" size="icon" onClick={() => void searchLocation()} data-testid="button-map-search">
          <Search className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={() => void detectLocation()} disabled={isLocating} data-testid="button-detect-location">
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        </Button>
      </div>
      <div ref={mapRef} className="leaflet-map-contained h-[250px] rounded-md border" data-testid="map-container" />
      {locationName && (
        <p className="flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
          <span data-testid="text-location-name">{locationName}</span>
        </p>
      )}
    </div>
  );
}
