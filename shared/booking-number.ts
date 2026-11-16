import { matchHubBookingCourier } from "./hub-booking-couriers";

export const BOOKING_CHANNELS = ["PO", "GO", "SR"] as const;
export type BookingChannel = (typeof BOOKING_CHANNELS)[number];
export type BookingScope = "D" | "I";

/** Two-letter courier codes used inside the XGoo booking ID. */
const COURIER_ID_CODES: Record<string, string> = {
  "world-first": "WF",
  delhivery: "DL",
  st: "ST",
  franch: "FR",
  tirupati: "TP",
  atlantic: "AT",
  bluedart: "BD",
  dtdc: "DT",
  fedex: "FX",
};

/** XGPODDL10260001 — XG + PO/GO/SR + D/I + partner + MM + YY + 0001 */
export const STRUCTURED_BOOKING_NUMBER_RE = /^XG(PO|GO|SR)[DI][A-Z0-9]{2}\d{8}$/;
export const LEGACY_BOOKING_NUMBER_RE = /^XG[A-Z0-9]{6,24}$/;

export function parseBookingChannel(value?: string | null): BookingChannel | null {
  const raw = (value || "").trim().toUpperCase();
  if (raw === "PO" || raw === "PRO") return "PO";
  if (raw === "GO") return "GO";
  if (raw === "SR" || raw === "STORE" || raw === "HUB") return "SR";
  return null;
}

export function bookingChannelFromSource(source?: string | null): BookingChannel {
  switch ((source || "").trim().toLowerCase()) {
    case "b2b_daily":
      return "PO";
    case "mobile_android":
    case "mobile_ios":
    case "mobile_app":
    case "customer_portal":
    case "website":
    case "whatsapp":
      return "GO";
    default:
      return "SR";
  }
}

export function bookingPartnerIdCode(
  partner?: { code?: string | null; name?: string | null } | null,
): string {
  const matched = partner ? matchHubBookingCourier(partner) : null;
  if (matched && COURIER_ID_CODES[matched.key]) return COURIER_ID_CODES[matched.key];
  const code = (partner?.code || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (code.length >= 2) return code.slice(0, 2);
  if (code.length === 1) return `${code}X`;
  const name = (partner?.name || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (name.length >= 2) return name.slice(0, 2);
  return "XX";
}

export function bookingScope(shipmentType?: string | null): BookingScope {
  return (shipmentType || "").toLowerCase() === "international" ? "I" : "D";
}

export function bookingNumberMonthYear(now = new Date()): { mm: string; yy: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    month: "2-digit",
    year: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "00";
  return { mm: value("month"), yy: value("year") };
}

export function xgooBookingNumberPrefix(input: {
  channel?: string | null;
  shipmentType?: string | null;
  partnerCode?: string | null;
  partnerName?: string | null;
  now?: Date;
}): string {
  const channel = parseBookingChannel(input.channel) || "SR";
  const scope = bookingScope(input.shipmentType);
  const partner = bookingPartnerIdCode({ code: input.partnerCode, name: input.partnerName });
  const { mm, yy } = bookingNumberMonthYear(input.now);
  return `XG${channel}${scope}${partner}${mm}${yy}`;
}

export function formatXgooBookingNumber(prefix: string, sequence: number): string {
  const seq = Math.max(1, Math.floor(Number(sequence) || 1));
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export function isStructuredXgooBookingNumber(value?: string | null): boolean {
  return STRUCTURED_BOOKING_NUMBER_RE.test((value || "").trim().toUpperCase());
}

export function isXgooBookingNumber(value?: string | null): boolean {
  const raw = (value || "").trim().toUpperCase();
  return STRUCTURED_BOOKING_NUMBER_RE.test(raw) || LEGACY_BOOKING_NUMBER_RE.test(raw);
}

export function bookingNumberSequence(value: string | null | undefined, prefix: string): number {
  const raw = (value || "").trim().toUpperCase();
  const head = prefix.trim().toUpperCase();
  if (!head || !raw.startsWith(head) || raw.length !== head.length + 4) return 0;
  const n = Number(raw.slice(head.length));
  return Number.isFinite(n) ? n : 0;
}
