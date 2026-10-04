import { useCallback, useState } from "react";
import { MapPin } from "lucide-react";
import { GoogleMapCanvas } from "@/components/maps/GoogleMapCanvas";
import {
  GooglePlacesAutocomplete,
  type GeocodeAddress,
} from "@/components/maps/GooglePlacesAutocomplete";
import { cn } from "@/lib/utils";

export interface AddressMapValue {
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
}

interface AddressMapFieldProps {
  label?: string;
  testIdPrefix: string;
  value: AddressMapValue;
  onChange: (value: AddressMapValue) => void;
  className?: string;
}

export function AddressMapField({
  label,
  testIdPrefix,
  value,
  onChange,
  className,
}: AddressMapFieldProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [pinnedLabel, setPinnedLabel] = useState(value.address || "");

  const applyGeocodeResult = useCallback(
    (result: GeocodeAddress) => {
      setPinnedLabel(result.displayName || result.address);
      onChange({
        address: result.address || result.displayName || value.address,
        city: result.city || value.city,
        state: result.state || value.state,
        pincode: result.pincode || value.pincode,
        lat: result.lat,
        lng: result.lng,
      });
    },
    [onChange, value.address, value.city, value.pincode, value.state],
  );

  const handleMarkerDragEnd = useCallback(
    async ({ lat, lng }: { lat: number; lng: number }) => {
      try {
        const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = (await res.json()) as GeocodeAddress;
          applyGeocodeResult(data);
          return;
        }
      } catch (err) {
        console.warn("Reverse geocode on drag failed:", err);
      }
      onChange({ ...value, lat, lng });
    },
    [applyGeocodeResult, onChange, value],
  );

  const handleMapClick = useCallback(
    async ({ lat, lng }: { lat: number; lng: number }) => {
      try {
        const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = (await res.json()) as GeocodeAddress;
          applyGeocodeResult(data);
          return;
        }
      } catch (err) {
        console.warn("Reverse geocode on click failed:", err);
      }
      onChange({ ...value, lat, lng });
    },
    [applyGeocodeResult, onChange, value],
  );

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`/api/maps/reverse-geocode?lat=${latitude}&lng=${longitude}`);
          if (res.ok) {
            const data = (await res.json()) as GeocodeAddress;
            applyGeocodeResult(data);
          } else {
            onChange({ ...value, lat: latitude, lng: longitude });
          }
        } catch {
          onChange({ ...value, lat: latitude, lng: longitude });
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const marker =
    value.lat != null && value.lng != null
      ? { lat: value.lat, lng: value.lng, label: pinnedLabel }
      : null;

  return (
    <div className={cn("space-y-2 rounded-lg border border-dashed p-3 bg-muted/20", className)}>
      {label && (
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {label}
        </p>
      )}

      <GooglePlacesAutocomplete
        value={value.address || ""}
        placeholder="Search address, area, or pincode…"
        onSelect={applyGeocodeResult}
        onLocateMe={detectLocation}
        isLocating={isLocating}
        testIdPrefix={testIdPrefix}
      />

      <div className="h-[200px] w-full rounded-md overflow-hidden border">
        <GoogleMapCanvas
          marker={marker}
          markerColor={testIdPrefix === "sender" ? "#FF4907" : "#16A34A"}
          markerLetter={testIdPrefix === "sender" ? "S" : "R"}
          markerDraggable={true}
          onMarkerDragEnd={handleMarkerDragEnd}
          onMapClick={handleMapClick}
          minHeight="100%"
          testId={`map-${testIdPrefix}`}
        />
      </div>

      {pinnedLabel && (
        <p className="text-xs text-muted-foreground flex items-start gap-1">
          <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
          <span data-testid={`text-${testIdPrefix}-pinned`}>{pinnedLabel}</span>
        </p>
      )}

      <p className="text-[11px] text-muted-foreground">
        Search an address or click and drag the pin on Google Maps. City, state, and pincode autofill when found.
      </p>
    </div>
  );
}
