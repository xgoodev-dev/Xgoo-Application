import { useCallback, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { GoogleMapCanvas } from "@/components/maps/GoogleMapCanvas";
import {
  GooglePlacesAutocomplete,
  type GeocodeAddress,
} from "@/components/maps/GooglePlacesAutocomplete";
import { useToast } from "@/hooks/use-toast";
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

function locationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "Allow location access in the browser to drop the pin on your current place.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Could not read GPS. Try again, or search the address.";
  }
  if (error.code === error.TIMEOUT) {
    return "Location timed out. Try again, or search the address.";
  }
  return "Could not read your current location. Try again, or search the address.";
}

function requestCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        if (error.code !== error.TIMEOUT) {
          reject(error);
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60_000,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

export function AddressMapField({
  label,
  testIdPrefix,
  value,
  onChange,
  className,
}: AddressMapFieldProps) {
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);
  const [pinnedLabel, setPinnedLabel] = useState(value.address || "");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    value.lat != null && value.lng != null ? { lat: value.lat, lng: value.lng } : null,
  );

  useEffect(() => {
    if (value.lat != null && value.lng != null) {
      setPin({ lat: value.lat, lng: value.lng });
    }
  }, [value.lat, value.lng]);

  useEffect(() => {
    if (value.address && value.address !== pinnedLabel) {
      setPinnedLabel(value.address);
    }
  }, [value.address, pinnedLabel]);

  const applyGeocodeResult = useCallback(
    (result: GeocodeAddress) => {
      setPinnedLabel(result.displayName || result.address);
      setPin({ lat: result.lat, lng: result.lng });
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

  const dropPin = useCallback(
    async (lat: number, lng: number) => {
      setPin({ lat, lng });
      try {
        const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = (await res.json()) as GeocodeAddress;
          applyGeocodeResult(data);
          return;
        }
      } catch (err) {
        console.warn("Reverse geocode failed:", err);
      }
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setPinnedLabel(fallback);
      onChange({ ...value, lat, lng, address: value.address || fallback });
    },
    [applyGeocodeResult, onChange, value],
  );

  const detectLocation = async () => {
    setIsLocating(true);
    try {
      const position = await requestCurrentPosition();
      await dropPin(position.coords.latitude, position.coords.longitude);
    } catch (error) {
      const geoError =
        typeof error === "object" && error !== null && "code" in error
          ? (error as GeolocationPositionError)
          : null;
      toast({
        title: "Could not find your location",
        description: geoError
          ? locationErrorMessage(geoError)
          : error instanceof Error
            ? error.message
            : "Try again, or search the address.",
        variant: "destructive",
      });
    } finally {
      setIsLocating(false);
    }
  };

  const marker =
    pin != null ? { lat: pin.lat, lng: pin.lng, label: pinnedLabel } : null;

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
        onLocateMe={() => void detectLocation()}
        isLocating={isLocating}
        testIdPrefix={testIdPrefix}
      />

      <div className="h-[200px] w-full rounded-md overflow-hidden border">
        <GoogleMapCanvas
          marker={marker}
          markerColor={testIdPrefix === "sender" ? "#FF4907" : "#16A34A"}
          markerLetter={testIdPrefix === "sender" ? "S" : "R"}
          markerDraggable={true}
          onMarkerDragEnd={({ lat, lng }) => void dropPin(lat, lng)}
          onMapClick={({ lat, lng }) => void dropPin(lat, lng)}
          zoom={16}
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
