import * as Location from 'expo-location';

export type MapCoords = { lat: number; lng: number };

export function coordsFrom(value?: { lat?: string | number | null; lng?: string | number | null } | null) {
  const lat = Number(value?.lat);
  const lng = Number(value?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return null;
  return { lat, lng };
}

export async function currentCoords(): Promise<MapCoords | null> {
  try {
    const existing = await Location.getForegroundPermissionsAsync();
    const granted =
      existing.granted || (await Location.requestForegroundPermissionsAsync()).granted;
    if (!granted) return null;
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    return null;
  }
}

export function distanceMeters(a: MapCoords, b: MapCoords) {
  const earth = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const ARRIVAL_RADIUS_M = 120;

export async function watchCoords(
  onChange: (coords: MapCoords) => void,
  options?: { follow?: boolean },
): Promise<() => void> {
  const first = await currentCoords();
  if (first) onChange(first);
  try {
    const follow = Boolean(options?.follow);
    const sub = await Location.watchPositionAsync(
      {
        accuracy: follow ? Location.Accuracy.High : Location.Accuracy.Balanced,
        timeInterval: follow ? 2500 : 8000,
        distanceInterval: follow ? 6 : 18,
      },
      (position) => onChange({ lat: position.coords.latitude, lng: position.coords.longitude }),
    );
    return () => sub.remove();
  } catch {
    return () => undefined;
  }
}
