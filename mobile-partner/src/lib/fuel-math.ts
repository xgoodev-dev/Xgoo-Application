export const VEHICLE_MILEAGE_KM_PER_LITRE = {
  bike: 40,
  scooter: 35,
  auto: 18,
  van: 12,
} as const;

export function fuelFromDistance(
  distanceKm: number,
  mileageKmPerLitre: number,
  fuelPricePerLitre: number,
) {
  const km = Math.max(0, Number(distanceKm) || 0);
  const mileage = Math.max(0.1, Number(mileageKmPerLitre) || 40);
  const price = Math.max(0, Number(fuelPricePerLitre) || 0);
  const litres = km / mileage;
  return {
    litres: Math.round(litres * 1000) / 1000,
    amount: Math.round(litres * price * 100) / 100,
  };
}

export function formatDuration(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours <= 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

export function rupees(value: string | number) {
  const amount = Number(value) || 0;
  return `₹${amount.toFixed(2)}`;
}
