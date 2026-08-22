import type { Shipment } from "./schema";

export const DELHIVERY_STAGING_BASE_URL = "https://staging-express.delhivery.com";
export const DELHIVERY_PRODUCTION_BASE_URL = "https://track.delhivery.com";
export const DELHIVERY_DEFAULT_BASE_URL = DELHIVERY_STAGING_BASE_URL;

export function isDelhiveryPartner(code?: string | null, name?: string | null): boolean {
  const c = (code ?? "").trim().toUpperCase();
  if (c === "DEL" || c === "DELHIVERY" || c === "DL" || c === "D1") return true;
  return (name ?? "").toLowerCase().includes("delhivery");
}

/** Delhivery rejects &, #, %, ; and backslash in manifestation payloads. */
export function delhiverySafeText(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/[&#%;\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const INDIAN_STATES = new Set(
  [
    "andhra pradesh",
    "arunachal pradesh",
    "assam",
    "bihar",
    "chhattisgarh",
    "delhi",
    "goa",
    "gujarat",
    "haryana",
    "himachal pradesh",
    "jharkhand",
    "karnataka",
    "kerala",
    "madhya pradesh",
    "maharashtra",
    "manipur",
    "meghalaya",
    "mizoram",
    "nagaland",
    "odisha",
    "punjab",
    "rajasthan",
    "sikkim",
    "tamil nadu",
    "telangana",
    "tripura",
    "uttar pradesh",
    "uttarakhand",
    "west bengal",
  ].map((s) => s.toLowerCase()),
);

function cityAndState(city: string, state: string): { city: string; state: string } {
  const c = delhiverySafeText(city);
  const s = delhiverySafeText(state);
  if (c && s && INDIAN_STATES.has(c.toLowerCase()) && !INDIAN_STATES.has(s.toLowerCase())) {
    return { city: s, state: c };
  }
  return { city: c, state: s };
}

export function shipmentWeightGrams(shipment: Shipment): number {
  const weightKg = Number.parseFloat(String(shipment.chargeableWeight ?? shipment.weight ?? "0.5"));
  const safeKg = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 0.5;
  return Math.max(1, Math.round(safeKg * 1000));
}

export interface DelhiveryCreateInput {
  shipment: Shipment;
  pickupLocation: string;
  clientName?: string | null;
  sellerGstTin?: string | null;
  hsnCode?: string | null;
}

export function buildDelhiveryShipmentBody(input: DelhiveryCreateInput) {
  const { shipment, pickupLocation } = input;
  const weightGm = shipmentWeightGrams(shipment);
  const length = shipment.length != null ? String(shipment.length) : undefined;
  const width = shipment.width != null ? String(shipment.width) : undefined;
  const height = shipment.height != null ? String(shipment.height) : undefined;
  const declared = shipment.declaredValue != null ? String(shipment.declaredValue) : undefined;
  const returnPin = (shipment.senderPincode ?? "").trim();

  const dest = cityAndState(shipment.receiverCity ?? "", shipment.receiverState ?? "");
  const origin = cityAndState(shipment.senderCity ?? "", shipment.senderState ?? "");

  const row: Record<string, string> = {
    name: delhiverySafeText(shipment.receiverName),
    add: delhiverySafeText(shipment.receiverAddress),
    pin: (shipment.receiverPincode ?? "").trim(),
    city: dest.city,
    state: dest.state,
    country: "India",
    phone: (shipment.receiverPhone ?? "").replace(/\D/g, "").slice(-10),
    order: delhiverySafeText(shipment.bookingNumber),
    payment_mode: "Prepaid",
    products_desc: delhiverySafeText(shipment.contentDescription) || "General goods",
    quantity: String(shipment.numberOfPieces ?? 1),
    weight: String(weightGm),
    cod_amount: "0",
    shipping_mode: shipment.serviceType === "air" ? "Express" : "Surface",
    seller_name: delhiverySafeText(shipment.senderName),
    seller_add: delhiverySafeText(shipment.senderAddress),
    return_name: delhiverySafeText(shipment.senderName),
    return_add: delhiverySafeText(shipment.senderAddress),
    return_city: origin.city,
    return_state: origin.state,
    return_country: "India",
    return_phone: (shipment.senderPhone ?? "").replace(/\D/g, "").slice(-10),
  };

  if (returnPin) row.return_pin = returnPin;
  if (length) row.shipment_length = length;
  if (width) row.shipment_width = width;
  if (height) row.shipment_height = height;
  if (declared) {
    row.total_amount = declared;
    row.shipment_value = declared;
  }
  // Do not send `client` unless it is the exact registered Delhivery client id.
  // A wrong value (company legal name, admin person, "M/S …") returns
  // "shipment list contains no data". The API token already selects the account.
  if (input.sellerGstTin?.trim()) row.seller_gst_tin = input.sellerGstTin.trim();
  row.hsn_code = input.hsnCode?.trim() || "999799";

  return {
    shipments: [row],
    pickup_location: { name: pickupLocation.trim() },
  };
}
