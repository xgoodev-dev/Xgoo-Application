import { isDelhiveryPartner } from "./delhivery";
import { isErpPortalCourier, isTirupatiCourier } from "./erp-courier";
import { matchHubBookingCourier } from "./hub-booking-couriers";
import { isWorldFirstPartner } from "./world-first";

export const BOOKING_METHODS = [
  "api",
  "browser_automation",
  "email",
  "manual",
  "disabled",
] as const;

export type BookingMethod = (typeof BOOKING_METHODS)[number];

export const BOOKING_JOB_STATUSES = [
  "draft",
  "validating",
  "ready_to_book",
  "booking",
  "action_required",
  "booked",
  "booking_failed",
  "cancelled",
] as const;

export type BookingJobStatus = (typeof BOOKING_JOB_STATUSES)[number];

export const BOOKING_EVENT_LEVELS = ["info", "warn", "error"] as const;
export type BookingEventLevel = (typeof BOOKING_EVENT_LEVELS)[number];

export const BOOKING_METHOD_LABELS: Record<BookingMethod, string> = {
  api: "API",
  browser_automation: "Browser assist",
  email: "Email",
  manual: "Manual",
  disabled: "Disabled",
};

export const BOOKING_JOB_STATUS_LABELS: Record<BookingJobStatus, string> = {
  draft: "Draft",
  validating: "Validating",
  ready_to_book: "Ready to book",
  booking: "Booking",
  action_required: "Action required",
  booked: "Booked",
  booking_failed: "Booking failed",
  cancelled: "Cancelled",
};

export type BookingValidationIssue = {
  code: string;
  message: string;
  field?: string;
};

export function isBookingMethod(value: unknown): value is BookingMethod {
  return typeof value === "string" && (BOOKING_METHODS as readonly string[]).includes(value);
}

export function isBookingJobStatus(value: unknown): value is BookingJobStatus {
  return typeof value === "string" && (BOOKING_JOB_STATUSES as readonly string[]).includes(value);
}

/**
 * Stored method wins, except Delhivery browser-assist rows now use the API connector.
 * Manual / disabled / email remain available if an operator sets them.
 */
export function resolveBookingMethod(partner: {
  bookingMethod?: string | null;
  code?: string | null;
  name?: string | null;
}): BookingMethod {
  if (isDelhiveryPartner(partner.code, partner.name) || isWorldFirstPartner(partner.code, partner.name) || isErpPortalCourier(partner.code, partner.name)) {
    if (partner.bookingMethod === "manual" || partner.bookingMethod === "disabled" || partner.bookingMethod === "email") {
      return partner.bookingMethod;
    }
    return "api";
  }
  if (isTirupatiCourier(partner.code, partner.name)) {
    if (partner.bookingMethod === "disabled") return "disabled";
    return "manual";
  }
  if (isBookingMethod(partner.bookingMethod)) return partner.bookingMethod;
  return "browser_automation";
}

export function defaultBookingMethodForPartner(code?: string | null, name?: string | null): BookingMethod {
  if (isDelhiveryPartner(code, name) || isWorldFirstPartner(code, name) || isErpPortalCourier(code, name)) return "api";
  if (isTirupatiCourier(code, name)) return "manual";
  return "browser_automation";
}

export function bookingPartnerKey(partner: { code?: string | null; name?: string | null }): string {
  return matchHubBookingCourier(partner)?.key || (partner.code || partner.name || "").trim().toUpperCase() || "other";
}

const METHOD_RANK: Record<BookingMethod, number> = {
  api: 0,
  browser_automation: 1,
  email: 2,
  manual: 3,
  disabled: 4,
};

/** One tab per courier brand. Duplicate office rows collapse; API connectors win. */
export function uniqueBookingPartners<T extends {
  id: string;
  code?: string | null;
  name?: string | null;
  isActive?: boolean | null;
  bookingMethod?: string | null;
}>(partners: T[]): T[] {
  const chosen = new Map<string, T>();
  for (const partner of partners) {
    if (partner.isActive === false) continue;
    const key = bookingPartnerKey(partner);
    const existing = chosen.get(key);
    if (!existing) {
      chosen.set(key, partner);
      continue;
    }
    if (METHOD_RANK[resolveBookingMethod(partner)] < METHOD_RANK[resolveBookingMethod(existing)]) {
      chosen.set(key, partner);
    }
  }
  const rank = (partner: T) => {
    if (isWorldFirstPartner(partner.code, partner.name)) return 0;
    if (isDelhiveryPartner(partner.code, partner.name)) return 1;
    return 2;
  };
  return [...chosen.values()].sort((a, b) => {
    const byKind = rank(a) - rank(b);
    if (byKind !== 0) return byKind;
    return (a.name || "").localeCompare(b.name || "");
  });
}
