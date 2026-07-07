import type { Shipment, CourierPartner } from "./schema";

export const PARTNER_SYNC_STATUSES = [
  "pending",
  "opened",
  "submitted",
  "synced",
  "failed",
] as const;

export type PartnerSyncStatus = (typeof PARTNER_SYNC_STATUSES)[number];

/** Default booking portal URLs keyed by normalized partner code */
export const DEFAULT_PARTNER_PORTALS: Record<string, string> = {
  DEL: "https://one.delhivery.com/",
  DELHIVERY: "https://one.delhivery.com/",
  DL: "https://one.delhivery.com/",
  ICL: "https://www.indiancourier.net/",
  ST: "https://stcourier.com/",
  STC: "https://stcourier.com/",
  FRANCH: "https://www.franchcourier.com/",
  DTDC: "https://www.dtdc.in/",
  BD: "https://www.bluedart.com/",
};

export const XGOO_EXTENSION_MESSAGE_TYPE = "XGOO_PARTNER_SYNC_V1";
export const XGOO_EXTENSION_PING = "XGOO_EXTENSION_PING";
export const XGOO_EXTENSION_PONG = "XGOO_EXTENSION_PONG";
export const XGOO_EXTENSION_STORED = "XGOO_EXTENSION_STORED";

export interface PartnerPayloadAddress {
  name: string;
  phone: string;
  address: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
}

export interface PartnerSyncPayload {
  version: 1;
  shipmentId: string;
  bookingNumber: string;
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  portalUrl: string | null;
  sender: PartnerPayloadAddress;
  receiver: PartnerPayloadAddress;
  weight: string;
  length: string | null;
  width: string | null;
  height: string | null;
  chargeableWeight: string | null;
  numberOfPieces: number;
  contentDescription: string | null;
  declaredValue: string | null;
  serviceType: string;
  awbNumber: string | null;
  externalAwb: string | null;
  syncStatus: PartnerSyncStatus;
}

export function normalizePartnerCode(code: string): string {
  return code.trim().toUpperCase();
}

export function resolvePartnerPortalUrl(partner: CourierPartner | null | undefined): string | null {
  if (!partner) return null;
  if (partner.portalUrl?.trim()) return partner.portalUrl.trim();

  const code = normalizePartnerCode(partner.code);
  if (DEFAULT_PARTNER_PORTALS[code]) return DEFAULT_PARTNER_PORTALS[code];

  const nameKey = normalizePartnerCode(partner.name);
  if (DEFAULT_PARTNER_PORTALS[nameKey]) return DEFAULT_PARTNER_PORTALS[nameKey];

  const nameLower = (partner.name || "").toLowerCase();
  if (nameLower.includes("delhivery")) return DEFAULT_PARTNER_PORTALS.DEL;
  if (nameLower.includes("indiancourier") || nameLower.includes("indian courier") || nameLower === "icl") {
    return DEFAULT_PARTNER_PORTALS.ICL;
  }
  if (nameLower.includes("st courier") || nameLower.includes("stcourier")) return DEFAULT_PARTNER_PORTALS.ST;
  if (nameLower.includes("franch")) return DEFAULT_PARTNER_PORTALS.FRANCH;
  if (nameLower.includes("dtdc")) return DEFAULT_PARTNER_PORTALS.DTDC;
  if (nameLower.includes("bluedart") || nameLower.includes("blue dart")) return DEFAULT_PARTNER_PORTALS.BD;

  return null;
}

function toAddress(
  name: string,
  phone: string,
  address: string,
  city: string | null | undefined,
  state: string | null | undefined,
  pincode: string | null | undefined,
): PartnerPayloadAddress {
  return {
    name,
    phone,
    address,
    city: city ?? null,
    state: state ?? null,
    pincode: pincode ?? null,
  };
}

export function buildPartnerSyncPayload(
  shipment: Shipment,
  partner: CourierPartner | null | undefined,
): PartnerSyncPayload {
  const syncStatus = (shipment.partnerSyncStatus ?? "pending") as PartnerSyncStatus;

  return {
    version: 1,
    shipmentId: shipment.id,
    bookingNumber: shipment.bookingNumber,
    partnerId: partner?.id ?? shipment.courierPartnerId ?? "",
    partnerCode: partner?.code ?? "",
    partnerName: partner?.name ?? "",
    portalUrl: resolvePartnerPortalUrl(partner ?? undefined),
    sender: toAddress(
      shipment.senderName,
      shipment.senderPhone,
      shipment.senderAddress,
      shipment.senderCity,
      shipment.senderState,
      shipment.senderPincode,
    ),
    receiver: toAddress(
      shipment.receiverName,
      shipment.receiverPhone,
      shipment.receiverAddress,
      shipment.receiverCity,
      shipment.receiverState,
      shipment.receiverPincode,
    ),
    weight: String(shipment.weight),
    length: shipment.length != null ? String(shipment.length) : null,
    width: shipment.width != null ? String(shipment.width) : null,
    height: shipment.height != null ? String(shipment.height) : null,
    chargeableWeight:
      shipment.chargeableWeight != null ? String(shipment.chargeableWeight) : null,
    numberOfPieces: shipment.numberOfPieces ?? 1,
    contentDescription: shipment.contentDescription ?? null,
    declaredValue: shipment.declaredValue != null ? String(shipment.declaredValue) : null,
    serviceType: shipment.serviceType,
    awbNumber: shipment.awbNumber ?? null,
    externalAwb: shipment.externalAwb ?? null,
    syncStatus,
  };
}

export const PARTNER_SYNC_STATUS_LABELS: Record<PartnerSyncStatus, string> = {
  pending: "Pending",
  opened: "Portal opened",
  submitted: "Submitted on partner",
  synced: "Synced",
  failed: "Failed",
};
