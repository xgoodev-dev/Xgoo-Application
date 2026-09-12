import { useEffect, useState, type ComponentType } from 'react';
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
  const canUseGoogle = !isExpoGoClient() && Boolean(googleMapsKey);

  useEffect(() => {
    if (!canUseGoogle) return;
    let active = true;
    void import('./booking-map-google')
      .then((mod) => {
        if (active) setGoogleMap(() => mod.GoogleBookingMap);
      })
      .catch((error) => {
        console.warn('Google Maps unavailable, using OpenStreetMap', error);
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

  return (
    <OpenStreetMap
      latitude={latitude}
      longitude={longitude}
      onMapPress={onMapPress}
    />
  );
}
