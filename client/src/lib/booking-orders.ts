import type { BookingRequest } from "@shared/schema";

const CUSTOMER_BOOKING_SOURCES = new Set([
  "mobile_android",
  "mobile_ios",
  "mobile_app",
  "customer_portal",
  "b2b_daily",
  "in_store",
  "staff_portal",
  "hub_qr",
  "hub_kiosk",
  "website",
]);

export type BookingFunnel = "go" | "pro" | "in_store" | "website";

export function isCustomerBookingOrder(request: Pick<BookingRequest, "source" | "customerUserId">): boolean {
  if (request.source === "legacy") return Boolean(request.customerUserId);
  return CUSTOMER_BOOKING_SOURCES.has(request.source || "");
}

export function bookingFunnel(request: Pick<BookingRequest, "source">): BookingFunnel {
  switch (request.source) {
    case "b2b_daily":
      return "pro";
    case "in_store":
    case "staff_portal":
    case "hub_qr":
    case "hub_kiosk":
      return "in_store";
    case "website":
      return "website";
    default:
      return "go";
  }
}

export const BOOKING_FUNNEL_LABELS: Record<BookingFunnel, string> = {
  go: "XGoo Go",
  pro: "XGoo Pro",
  in_store: "In Store",
  website: "Store link",
};

export function bookingRequestToNewBookingHref(
  request: BookingRequest,
  courierPartnerId?: string,
): string {
  const params = new URLSearchParams({
    senderName: request.senderName || "",
    senderPhone: request.senderPhone || "",
    senderEmail: request.senderEmail || "",
    senderAddress: request.senderAddress || "",
    senderCity: request.senderCity || "",
    senderState: request.senderState || "",
    senderPincode: request.senderPincode || "",
    receiverName: request.receiverName || "",
    receiverPhone: request.receiverPhone || "",
    receiverAddress: request.receiverAddress || "",
    receiverCity: request.receiverCity || "",
    receiverState: request.receiverState || "",
    receiverPincode: request.receiverPincode || "",
    weight: request.weight || "",
    numberOfPieces: String(request.numberOfPieces || 1),
    contentDescription: request.contentDescription || "",
    length: request.packageLength || "",
    width: request.packageWidth || "",
    height: request.packageHeight || "",
    declaredValue: request.declaredValue || "",
    serviceType: request.serviceType || "surface",
    bookingRequestId: request.id,
  });
  if (courierPartnerId) params.set("courierPartnerId", courierPartnerId);
  return `/bookings/new?${params.toString()}`;
}
