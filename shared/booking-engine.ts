import { isDelhiveryPartner } from "./delhivery";

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
 * Stored method wins. If unset, Delhivery defaults to API and everyone else to browser assist.
 */
export function resolveBookingMethod(partner: {
  bookingMethod?: string | null;
  code?: string | null;
  name?: string | null;
}): BookingMethod {
  if (isBookingMethod(partner.bookingMethod)) return partner.bookingMethod;
  if (isDelhiveryPartner(partner.code, partner.name)) return "api";
  return "browser_automation";
}

export function defaultBookingMethodForPartner(code?: string | null, name?: string | null): BookingMethod {
  return isDelhiveryPartner(code, name) ? "api" : "browser_automation";
}
