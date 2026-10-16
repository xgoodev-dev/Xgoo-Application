import {
  bookingRequestBodyFromDraft,
  demoQuotes,
  demoSubmitResult,
  parsePositiveWeight,
  searchKnowledgeBase,
  statusToPlainLanguage,
  successFromBookingResponse,
  type KioskQuoteCard,
  type KioskShipmentDraft,
  type KioskSubmitResult,
  type KioskTrackResult,
  type KnowledgeArticle,
  type ServiceKind,
} from "@shared/kiosk";
import { XGOO_CONTACT } from "@/components/marketing/site-info";

export type KioskStoreConfig = {
  demoMode: boolean;
  unavailable?: boolean;
  office: {
    id: string;
    name: string;
    slug: string | null;
    city: string | null;
    state: string | null;
    phone: string | null;
    email: string | null;
  };
  hub: { id: string; name: string; city: string | null; address: string | null } | null;
  hours: string;
  cutoffNote?: string;
  languages: string[];
};

export const DEMO_KIOSK_CONFIG: KioskStoreConfig = {
  demoMode: true,
  office: {
    id: "demo",
    name: "XGoo Demo Store",
    slug: "demo",
    city: "Hyderabad",
    state: "Telangana",
    phone: XGOO_CONTACT.phone,
    email: XGOO_CONTACT.email,
  },
  hub: null,
  hours: XGOO_CONTACT.hours,
  languages: ["en", "hi", "te"],
};

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T;
  return data;
}

export async function loadKioskConfig(
  slug: string | undefined,
  hubId: string | null,
): Promise<KioskStoreConfig> {
  if (!slug || slug === "demo") return DEMO_KIOSK_CONFIG;
  const qs = hubId ? `?hub=${encodeURIComponent(hubId)}` : "";
  try {
    const res = await fetch(`/api/public/office/${encodeURIComponent(slug)}/kiosk${qs}`);
    if (res.status === 404) {
      return { ...DEMO_KIOSK_CONFIG, unavailable: true };
    }
    if (!res.ok) return DEMO_KIOSK_CONFIG;
    const data = await readJson<KioskStoreConfig>(res);
    return { ...data, demoMode: false };
  } catch {
    return DEMO_KIOSK_CONFIG;
  }
}

export async function fetchKioskQuotes(input: {
  slug: string | undefined;
  demoMode: boolean;
  draft: Pick<
    KioskShipmentDraft,
    | "shipmentType"
    | "senderPincode"
    | "receiverPincode"
    | "destinationCountry"
    | "packageType"
    | "weight"
    | "length"
    | "width"
    | "height"
    | "serviceType"
  >;
  bothServices?: boolean;
}): Promise<{ quotes: KioskQuoteCard[]; message: string; isLive: boolean }> {
  const weight = parsePositiveWeight(input.draft.weight) ?? 0;
  if (input.demoMode || !input.slug || input.slug === "demo") {
    return {
      quotes: demoQuotes(weight || 1),
      message: "Demo estimates only — not live XGoo tariffs.",
      isLive: false,
    };
  }
  const body = {
    shipmentType: input.draft.shipmentType || "domestic",
    packageType: input.draft.packageType === "document" ? "document" : "package",
    senderPincode: input.draft.senderPincode || undefined,
    receiverPincode: input.draft.receiverPincode || undefined,
    destinationCountry:
      input.draft.shipmentType === "international"
        ? input.draft.destinationCountry || undefined
        : undefined,
    weight,
    length: input.draft.length || undefined,
    width: input.draft.width || undefined,
    height: input.draft.height || undefined,
  };
  const res = await fetch(`/api/public/office/${encodeURIComponent(input.slug)}/kiosk/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input.bothServices ? body : { ...body, serviceType: input.draft.serviceType }),
  });
  const data = await readJson<{
    quotes?: KioskQuoteCard[];
    message?: string;
    isLive?: boolean;
  }>(res);
  if (!res.ok) {
    throw new Error((data as { message?: string }).message || "Could not fetch rates");
  }
  return {
    quotes: data.quotes || [],
    message:
      data.message ||
      "Prices and days are estimates from this store’s rate engine, not a delivery guarantee.",
    isLive: data.isLive === true,
  };
}

export async function submitKioskShipment(input: {
  slug: string | undefined;
  demoMode: boolean;
  draft: KioskShipmentDraft;
  hubId: string | null;
}): Promise<KioskSubmitResult> {
  if (input.demoMode || !input.slug || input.slug === "demo") {
    return demoSubmitResult();
  }
  const res = await fetch(
    `/api/public/office/${encodeURIComponent(input.slug)}/booking-request`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingRequestBodyFromDraft(input.draft, input.hubId)),
    },
  );
  const data = await readJson<{
    success?: boolean;
    requestNumber?: string;
    message?: string;
  }>(res);
  if (!res.ok) {
    return successFromBookingResponse({
      success: false,
      message: data.message || "The store could not accept this request.",
    });
  }
  return successFromBookingResponse(data);
}

export async function trackKioskParcel(input: {
  slug: string | undefined;
  demoMode: boolean;
  query: string;
}): Promise<KioskTrackResult | { notFound: true; message: string } | { error: string }> {
  const query = input.query.trim();
  if (!query) return { error: "Enter a tracking number." };
  if (input.demoMode || !input.slug || input.slug === "demo") {
    return {
      error: "Demo mode cannot look up live tracking. Open Bot Assistant from a Hub store.",
    };
  }
  const path = `/api/public/office/${encodeURIComponent(input.slug)}/track/${encodeURIComponent(query)}`;
  try {
    const res = await fetch(path);
    const data = await readJson<{
      kind?: "shipment" | "booking_request";
      bookingNumber?: string;
      awbNumber?: string | null;
      requestNumber?: string;
      status?: string;
      senderCity?: string | null;
      receiverCity?: string | null;
      message?: string;
    }>(res);
    if (res.status === 404) {
      return { notFound: true, message: data.message || "No booking or shipment found with this number." };
    }
    if (!res.ok) return { error: data.message || "Tracking is unavailable right now." };
    const status = data.status || "";
    return {
      kind: data.kind === "shipment" ? "shipment" : "booking_request",
      reference: data.awbNumber || data.bookingNumber || data.requestNumber || query,
      status,
      statusPlain: statusToPlainLanguage(status),
      senderCity: data.senderCity,
      receiverCity: data.receiverCity,
      booked: data.kind === "shipment",
      awbNumber: data.awbNumber,
      bookingNumber: data.bookingNumber,
      requestNumber: data.requestNumber,
      estimatedDelivery: null,
      message: data.message,
    };
  } catch {
    return { error: "Network error. Tracking is unavailable until the connection returns." };
  }
}

export function localKnowledge(query: string): KnowledgeArticle[] {
  return searchKnowledgeBase(query);
}

export function selectedQuote(
  quotes: KioskQuoteCard[],
  key: string,
  serviceType: ServiceKind,
): KioskQuoteCard | undefined {
  return quotes.find((q) => q.key === key) || quotes.find((q) => q.serviceType === serviceType);
}
