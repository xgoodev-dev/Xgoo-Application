import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { pickupApi } from '@/lib/api';

type PendingPoint = {
  lat: number;
  lng: number;
  accuracy?: number;
  recordedAt: string;
};

let token: string | null = null;
let watch: Location.LocationSubscription | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let appSub: { remove: () => void } | null = null;
let pending: PendingPoint[] = [];
let starting = false;

function queuePoint(coords: Location.LocationObjectCoords) {
  pending.push({
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: coords.accuracy ?? undefined,
    recordedAt: new Date().toISOString(),
  });
  if (pending.length >= 8) void flush();
}

async function flush() {
  if (!token || pending.length === 0) return;
  const batch = pending.splice(0, 40);
  try {
    await pickupApi.pingDuty(token, batch);
  } catch {
    pending = [...batch, ...pending].slice(-80);
  }
}

async function captureOnce() {
  if (!token) return;
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    queuePoint(position.coords);
    await flush();
  } catch {
    // Permission or GPS can fail while the partner is indoors.
  }
}

export async function startDutyTracking(sessionToken: string) {
  if (starting) return;
  starting = true;
  token = sessionToken;
  try {
    await pickupApi.startDuty(sessionToken).catch(() => undefined);
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return;
    await captureOnce();
    if (!watch) {
      watch = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 20_000,
          distanceInterval: 25,
        },
        (position) => queuePoint(position.coords),
      );
    }
    if (!flushTimer) {
      flushTimer = setInterval(() => void flush(), 25_000);
    }
    if (!appSub) {
      appSub = AppState.addEventListener('change', (state) => {
        if (state === 'active') void captureOnce();
        else void flush();
      });
    }
  } finally {
    starting = false;
  }
}

export async function stopDutyTracking() {
  const session = token;
  token = null;
  watch?.remove();
  watch = null;
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  appSub?.remove();
  appSub = null;
  const leftover = pending.splice(0, pending.length);
  if (!session) return;
  try {
    if (leftover.length > 0) await pickupApi.pingDuty(session, leftover);
    const last = leftover[leftover.length - 1];
    await pickupApi.stopDuty(
      session,
      last ? { lat: last.lat, lng: last.lng } : undefined,
    );
  } catch {
    // Logout still continues if the last GPS ping fails.
  }
}
