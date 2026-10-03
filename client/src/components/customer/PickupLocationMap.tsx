import { useCallback, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { GoogleMapCanvas, type MapCoordinate } from "@/components/maps/GoogleMapCanvas";
import {
  GooglePlacesAutocomplete,
  type GeocodeAddress,
} from "@/components/maps/GooglePlacesAutocomplete";

export function PickupLocationMap({
  onLocationSelect,
  initialLat,
  initialLng,
  autoDetectOnMount,
  serviceRadiusKm,
}: {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  initialLat?: number;
  initialLng?: number;
  autoDetectOnMount?: boolean;
  serviceRadiusKm?: number;
}) {
  const [selectedLat, setSelectedLat] = useState<number | undefined>(initialLat);
  const [selectedLng, setSelectedLng] = useState<number | undefined>(initialLng);
  const [locationName, setLocationName] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (initialLat !== undefined && initialLng !== undefined) {
      setSelectedLat(initialLat);
      setSelectedLng(initialLng);
    }
  }, [initialLat, initialLng]);

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = (await res.json()) as GeocodeAddress;
          const name = data.displayName || data.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setLocationName(name);
          onLocationSelect(lat, lng, name);
          return;
        }
      } catch (err) {
        console.warn("Reverse geocode failed:", err);
      }
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setLocationName(fallback);
      onLocationSelect(lat, lng, fallback);
    },
    [onLocationSelect],
  );

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setSelectedLat(latitude);
        setSelectedLng(longitude);
        await reverseGeocode(latitude, longitude);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, [reverseGeocode]);

  useEffect(() => {
    if (autoDetectOnMount && (!initialLat || !initialLng)) {
      detectLocation();
    }
  }, [autoDetectOnMount, initialLat, initialLng, detectLocation]);

  const handleSelectAutocomplete = (item: GeocodeAddress) => {
    setSelectedLat(item.lat);
    setSelectedLng(item.lng);
    const name = item.displayName || item.address;
    setLocationName(name);
    onLocationSelect(item.lat, item.lng, name);
  };

  const handleMapClick = async ({ lat, lng }: { lat: number; lng: number }) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    await reverseGeocode(lat, lng);
  };

  const handleMarkerDragEnd = async ({ lat, lng }: { lat: number; lng: number }) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    await reverseGeocode(lat, lng);
  };

  const marker: MapCoordinate | null =
    selectedLat != null && selectedLng != null
      ? { lat: selectedLat, lng: selectedLng, label: locationName }
      : null;

  return (
    <div className="space-y-3">
      <GooglePlacesAutocomplete
        value={locationName}
        placeholder="Search location, area, or pincode…"
        onSelect={handleSelectAutocomplete}
        onLocateMe={detectLocation}
        isLocating={isLocating}
        testIdPrefix="pickup-map"
      />

      <div className="h-[220px] w-full rounded-md overflow-hidden border">
        <GoogleMapCanvas
          marker={marker}
          markerColor="#FF4907"
          markerLetter="P"
          markerDraggable={true}
          circleRadiusKm={serviceRadiusKm}
          circleCenter={marker}
          onMapClick={handleMapClick}
          onMarkerDragEnd={handleMarkerDragEnd}
          minHeight="100%"
          testId="pickup-location-map"
        />
      </div>

      {locationName ? (
        <div className="flex items-start gap-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground border">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="font-medium text-foreground">{locationName}</span>
        </div>
      ) : null}
    </div>
  );
}
