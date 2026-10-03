import { useCallback } from "react";
import { GoogleMapCanvas, type MapCoordinate } from "@/components/maps/GoogleMapCanvas";
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

export async function reverseGeocodePoint(lat: number, lng: number): Promise<ShipmentMapPoint> {
  try {
    const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const data = await res.json();
      return {
        lat: data.lat ?? lat,
        lng: data.lng ?? lng,
        label: data.displayName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        address: data.address || data.displayName,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country,
      };
    }
  } catch (err) {
    console.warn("Reverse geocoding error:", err);
  }

  return {
    lat,
    lng,
    label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  };
}

export async function searchAddresses(
  query: string,
  scope: AddressScope = "domestic",
): Promise<ShipmentMapPoint[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const country = scope === "domestic" ? "IN" : "";
    const res = await fetch(`/api/maps/geocode?q=${encodeURIComponent(q)}&limit=8`);
    if (res.ok) {
      const data = (await res.json()) as Array<{
        lat: number;
        lng: number;
        displayName: string;
        address?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
      }>;

      return (data || []).map((item) => ({
        lat: item.lat,
        lng: item.lng,
        label: item.displayName,
        address: item.address || item.displayName,
        city: item.city,
        state: item.state,
        pincode: item.pincode,
        country: item.country,
      }));
    }
  } catch (err) {
    console.warn("Address search error:", err);
  }

  return [];
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
  const handleMapClick = useCallback(
    async ({ lat, lng }: { lat: number; lng: number }) => {
      const point = await reverseGeocodePoint(lat, lng);
      if (activePin === "pickup") {
        onPickupChange(point);
      } else {
        onDestinationChange(point);
      }
    },
    [activePin, onDestinationChange, onPickupChange],
  );

  const handleMarkerDragEnd = useCallback(
    async ({ lat, lng }: { lat: number; lng: number }) => {
      const point = await reverseGeocodePoint(lat, lng);
      if (activePin === "pickup") {
        onPickupChange(point);
      } else {
        onDestinationChange(point);
      }
    },
    [activePin, onDestinationChange, onPickupChange],
  );

  const pickupCoord: MapCoordinate | null = pickup
    ? { lat: pickup.lat, lng: pickup.lng, label: pickup.label }
    : null;

  const destCoord: MapCoordinate | null = destination
    ? { lat: destination.lat, lng: destination.lng, label: destination.label }
    : null;

  return (
    <div className={cn("relative h-full min-h-0 w-full overflow-hidden bg-muted/30", className)}>
      <GoogleMapCanvas
        pickup={pickupCoord}
        destination={destCoord}
        showRoute={Boolean(pickup && destination)}
        onMapClick={handleMapClick}
        onMarkerDragEnd={handleMarkerDragEnd}
        minHeight="100%"
        className="h-full w-full rounded-none border-0"
        testId="book-shipment-map"
      />
    </div>
  );
}
