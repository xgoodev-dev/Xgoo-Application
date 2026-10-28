export const PICKUP_VEHICLE_TYPES = ["bike", "scooter", "auto", "van"] as const;
export type PickupVehicleType = (typeof PICKUP_VEHICLE_TYPES)[number];

export const PICKUP_SHIFT_STATUSES = ["open", "closed"] as const;
export type PickupShiftStatus = (typeof PICKUP_SHIFT_STATUSES)[number];

export const PICKUP_FUEL_CLAIM_STATUSES = ["requested", "approved", "rejected", "paid"] as const;
export type PickupFuelClaimStatus = (typeof PICKUP_FUEL_CLAIM_STATUSES)[number];

export const DEFAULT_PICKUP_FUEL = {
  vehicleType: "bike" as PickupVehicleType,
  mileageKmPerLitre: 40,
  fuelPricePerLitre: 105,
};

export const VEHICLE_MILEAGE_KM_PER_LITRE: Record<PickupVehicleType, number> = {
  bike: 40,
  scooter: 35,
  auto: 18,
  van: 12,
};

export function fuelFromDistance(
  distanceKm: number,
  mileageKmPerLitre: number,
  fuelPricePerLitre: number,
) {
  const km = Math.max(0, Number(distanceKm) || 0);
  const mileage = Math.max(0.1, Number(mileageKmPerLitre) || DEFAULT_PICKUP_FUEL.mileageKmPerLitre);
  const price = Math.max(0, Number(fuelPricePerLitre) || 0);
  const litres = km / mileage;
  return {
    distanceKm: round3(km),
    litres: round3(litres),
    amount: round2(litres * price),
    mileageKmPerLitre: round2(mileage),
    fuelPricePerLitre: round2(price),
  };
}

export function workingHoursMinutes(startedAt: Date | string, endedAt: Date | string, breakMinutes = 0) {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.max(0, Math.round((end - start) / 60_000) - Math.max(0, breakMinutes));
}

export function formatDuration(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours <= 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

export function haversineKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function round3(value: number) {
  return Math.round(value * 1000) / 1000;
}
