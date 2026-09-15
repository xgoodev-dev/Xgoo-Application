import { useCallback, useEffect, useState } from "react";
import { reverseGeocodePoint } from "@/components/customer/BookShipmentMap";

export type CurrentLocationState = {
  label: string;
  locating: boolean;
  denied: boolean;
  live: boolean;
  refresh: () => void;
};

export function useCurrentLocation(fallback?: string | null): CurrentLocationState {
  const [label, setLabel] = useState(fallback?.trim() || "");
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!live && fallback?.trim()) {
      setLabel(fallback.trim());
    }
  }, [fallback, live]);

  const refresh = useCallback(() => {
    if (!navigator.geolocation) {
      setDenied(true);
      return;
    }

    setLocating(true);
    setDenied(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const point = await reverseGeocodePoint(position.coords.latitude, position.coords.longitude);
        setLabel(point.label || fallback?.trim() || "");
        setLive(true);
        setDenied(false);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setDenied(true);
        if (fallback?.trim()) setLabel(fallback.trim());
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }, [fallback]);

  return { label, locating, denied, live, refresh };
}
