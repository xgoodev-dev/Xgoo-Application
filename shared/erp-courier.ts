import { matchHubBookingCourier } from "./hub-booking-couriers";

export type ErpCourierBrand = "st" | "franch";

export function isStCourier(code?: string | null, name?: string | null): boolean {
  return matchHubBookingCourier({ code, name })?.key === "st";
}

export function isFranchCourier(code?: string | null, name?: string | null): boolean {
  return matchHubBookingCourier({ code, name })?.key === "franch";
}

export function isTirupatiCourier(code?: string | null, name?: string | null): boolean {
  return matchHubBookingCourier({ code, name })?.key === "tirupati";
}

export function isErpPortalCourier(code?: string | null, name?: string | null): boolean {
  return isStCourier(code, name) || isFranchCourier(code, name);
}

export function isPaperShipperCourier(code?: string | null, name?: string | null): boolean {
  return isErpPortalCourier(code, name) || isTirupatiCourier(code, name);
}

export function erpCourierBrand(code?: string | null, name?: string | null): ErpCourierBrand | null {
  if (isStCourier(code, name)) return "st";
  if (isFranchCourier(code, name)) return "franch";
  return null;
}
