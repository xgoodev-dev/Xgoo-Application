import { useEffect, useState, type ComponentType } from 'react';
import { GoogleStaticBookingMap } from '@/components/booking-map-static';
import { OpenStreetMap } from '@/components/open-street-map';
import { isExpoGoClient } from '@/lib/notifications';

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  markerColor?: string;
  onMapPress: (latitude: number, longitude: number) => void;
};

const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

export function BookingMap({
  latitude = null,
  longitude = null,
  markerColor,
  onMapPress,
}: Props) {
  const [GoogleMap, setGoogleMap] = useState<ComponentType<Props> | null>(null);
  const [staticFailed, setStaticFailed] = useState(false);
  const canUseGoogle = !isExpoGoClient() && Boolean(googleMapsKey);

  useEffect(() => {
    if (!canUseGoogle) return;
    let active = true;
    void import('./booking-map-google')
      .then((mod) => {
        if (active) setGoogleMap(() => mod.GoogleBookingMap);
      })
      .catch((error) => {
        console.warn('Google Maps native SDK unavailable, using Static Maps', error);
      });
    return () => {
      active = false;
    };
  }, [canUseGoogle]);

  if (GoogleMap) {
    return (
      <GoogleMap
        latitude={latitude}
        longitude={longitude}
        markerColor={markerColor}
        onMapPress={onMapPress}
      />
    );
  }

  if (staticFailed) {
    return (
      <OpenStreetMap
        latitude={latitude}
        longitude={longitude}
        onMapPress={onMapPress}
      />
    );
  }

  return (
    <GoogleStaticBookingMap
      latitude={latitude}
      longitude={longitude}
      onMapPress={onMapPress}
      onUnavailable={() => setStaticFailed(true)}
    />
  );
}
