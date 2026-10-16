export const KIOSK_LANGUAGES = ["en", "hi", "te"] as const;
export type KioskLanguage = (typeof KIOSK_LANGUAGES)[number];

export const ROBOT_MOODS = [
  "idle",
  "greeting",
  "listening",
  "thinking",
  "speaking",
  "success",
  "warning",
  "error",
  "sleep",
] as const;
export type RobotMood = (typeof ROBOT_MOODS)[number];

export const KIOSK_SCREENS = [
  "home",
  "send",
  "track",
  "rates",
  "business",
  "help",
  "staff",
  "handover",
] as const;
export type KioskScreen = (typeof KIOSK_SCREENS)[number];

export const SEND_STEPS = [
  "intent",
  "sender",
  "receiver",
  "parcel",
  "rates",
  "review",
  "submitting",
  "complete",
  "failed",
] as const;
export type SendStep = (typeof SEND_STEPS)[number];

export const KIOSK_INTENTS = [
  "send",
  "track",
  "rates",
  "business",
  "help",
  "staff",
  "cancel",
  "unknown",
] as const;
export type KioskIntent = (typeof KIOSK_INTENTS)[number];

export type ShipmentKind = "domestic" | "international";
export type PackageKind = "document" | "non_document";
export type ServiceKind = "air" | "surface";

export type KioskShipmentDraft = {
  shipmentType: ShipmentKind | "";
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  senderState: string;
  senderPincode: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity: string;
  receiverState: string;
  receiverPincode: string;
  destinationCountry: string;
  packageType: PackageKind | "";
  contentDescription: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  declaredValue: string;
  serviceType: ServiceKind;
  selectedQuoteKey: string;
};

export type KioskQuoteCard = {
  key: string;
  partnerName: string;
  partnerCode: string;
  serviceType: ServiceKind;
  sellPrice: number;
  transitDays: number | null;
  chargeableWeight: number;
  source: "tariff" | "legacy" | "api" | "demo";
  isLive: boolean;
  message?: string;
};

export type KioskSubmitResult = {
  success: boolean;
  kind: "booking_request" | "demo";
  requestNumber: string | null;
  booked: false;
  paid: false;
  labelReady: false;
  message: string;
};

export type KioskTrackResult = {
  kind: "shipment" | "booking_request";
  reference: string;
  status: string;
  statusPlain: string;
  senderCity?: string | null;
  receiverCity?: string | null;
  booked?: boolean;
  awbNumber?: string | null;
  bookingNumber?: string | null;
  requestNumber?: string | null;
  estimatedDelivery?: string | null;
  message?: string;
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  body: string;
  tags: string[];
};

export const emptyKioskDraft = (): KioskShipmentDraft => ({
  shipmentType: "",
  senderName: "",
  senderPhone: "",
  senderAddress: "",
  senderCity: "",
  senderState: "",
  senderPincode: "",
  receiverName: "",
  receiverPhone: "",
  receiverAddress: "",
  receiverCity: "",
  receiverState: "",
  receiverPincode: "",
  destinationCountry: "India",
  packageType: "",
  contentDescription: "",
  weight: "",
  length: "",
  width: "",
  height: "",
  declaredValue: "",
  serviceType: "surface",
  selectedQuoteKey: "",
});

export function isKioskLanguage(value: string): value is KioskLanguage {
  return (KIOSK_LANGUAGES as readonly string[]).includes(value);
}

export function speechLocale(language: KioskLanguage): string {
  switch (language) {
    case "en":
      return "en-IN";
    case "hi":
      return "hi-IN";
    case "te":
      return "te-IN";
    default: {
      const _never: never = language;
      return _never;
    }
  }
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidIndianMobile(value: string): boolean {
  const d = digitsOnly(value);
  const local = d.length === 12 && d.startsWith("91") ? d.slice(2) : d;
  return /^[6-9]\d{9}$/.test(local);
}

export function isValidIndianPincode(value: string): boolean {
  return /^[1-9][0-9]{5}$/.test(value.trim());
}

export function parsePositiveWeight(value: string): number | null {
  const n = parseFloat(value.replace(",", ".").trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function detectKioskIntent(utterance: string): KioskIntent {
  const t = utterance.toLowerCase().trim();
  if (!t) return "unknown";
  if (
    /\b(cancel|stop|start over|restart|home|go back)\b/.test(t) ||
    /रद्द|वापस|మానేయండి|ఇంటికి/.test(t)
  ) {
    return "cancel";
  }
  if (
    /\b(staff|human|person|manager|agent|someone)\b/.test(t) ||
    /स्टाफ|व्यक्ति|మనిషి|స్టాఫ్/.test(t)
  ) {
    return "staff";
  }
  if (
    /\b(track|tracking|awb|where is|status)\b/.test(t) ||
    /ट्रैक|ट्रैकिंग|ట్రాక్/.test(t)
  ) {
    return "track";
  }
  if (
    /\b(rate|price|quote|cost|how much|delivery time|tat)\b/.test(t) ||
    /रेट|कीमत|ధర|రేట్/.test(t)
  ) {
    return "rates";
  }
  if (
    /\b(business|bulk|pro|pickup|ecommerce|shop|tectangle)\b/.test(t) ||
    /बिज़नेस|बल्क|వ్యాపారం/.test(t)
  ) {
    return "business";
  }
  if (
    /\b(send|ship|parcel|courier|book|drop)\b/.test(t) ||
    /भेज|पार्सल|పంపు|పార్సెల్/.test(t)
  ) {
    return "send";
  }
  if (
    /\b(help|info|hours|prohibited|packaging|international|payment)\b/.test(t) ||
    /मदद|जानकारी|సహాయం/.test(t)
  ) {
    return "help";
  }
  return "unknown";
}

export function intentToScreen(intent: KioskIntent): KioskScreen | null {
  switch (intent) {
    case "send":
      return "send";
    case "track":
      return "track";
    case "rates":
      return "rates";
    case "business":
      return "business";
    case "help":
      return "help";
    case "staff":
      return "staff";
    case "cancel":
      return "home";
    case "unknown":
      return null;
    default: {
      const _never: never = intent;
      return _never;
    }
  }
}

const STEP_FIELDS: Record<SendStep, Array<keyof KioskShipmentDraft>> = {
  intent: ["shipmentType"],
  sender: ["senderName", "senderPhone", "senderAddress", "senderPincode"],
  receiver: ["receiverName", "receiverPhone", "receiverAddress", "receiverPincode"],
  parcel: ["packageType", "contentDescription", "weight"],
  rates: ["selectedQuoteKey"],
  review: [],
  submitting: [],
  complete: [],
  failed: [],
};

export function missingFieldsForStep(
  draft: KioskShipmentDraft,
  step: SendStep,
): Array<keyof KioskShipmentDraft> {
  const extra: Array<keyof KioskShipmentDraft> =
    step === "receiver" && draft.shipmentType === "international"
      ? ["destinationCountry"]
      : [];
  return [...STEP_FIELDS[step], ...extra].filter((field) => {
    const value = String(draft[field] ?? "").trim();
    return value.length === 0;
  });
}

export type DraftValidation = {
  ok: boolean;
  errors: string[];
};

export function validateKioskDraft(draft: KioskShipmentDraft): DraftValidation {
  const errors: string[] = [];
  if (draft.shipmentType !== "domestic" && draft.shipmentType !== "international") {
    errors.push("Choose domestic or international.");
  }
  if (!draft.senderName.trim()) errors.push("Sender name is required.");
  if (!isValidIndianMobile(draft.senderPhone)) errors.push("Enter a valid 10-digit sender mobile.");
  if (!draft.senderAddress.trim()) errors.push("Sender address is required.");
  if (draft.shipmentType !== "international" && !isValidIndianPincode(draft.senderPincode)) {
    errors.push("Enter a valid 6-digit sender PIN code.");
  }
  if (!draft.receiverName.trim()) errors.push("Receiver name is required.");
  if (!isValidIndianMobile(draft.receiverPhone)) {
    errors.push("Enter a valid 10-digit receiver mobile.");
  }
  if (!draft.receiverAddress.trim()) errors.push("Receiver address is required.");
  if (draft.shipmentType === "international") {
    if (!draft.destinationCountry.trim() || /^india$/i.test(draft.destinationCountry.trim())) {
      errors.push("Enter the destination country for international shipping.");
    }
  } else if (!isValidIndianPincode(draft.receiverPincode)) {
    errors.push("Enter a valid 6-digit receiver PIN code.");
  }
  if (draft.packageType !== "document" && draft.packageType !== "non_document") {
    errors.push("Choose document or non-document.");
  }
  if (!draft.contentDescription.trim()) errors.push("Describe the parcel contents.");
  if (parsePositiveWeight(draft.weight) == null) errors.push("Enter a weight greater than 0 kg.");
  return { ok: errors.length === 0, errors };
}

export function canSubmitKioskDraft(draft: KioskShipmentDraft): boolean {
  return validateKioskDraft(draft).ok;
}

export function nextSendStep(step: SendStep): SendStep {
  switch (step) {
    case "intent":
      return "sender";
    case "sender":
      return "receiver";
    case "receiver":
      return "parcel";
    case "parcel":
      return "rates";
    case "rates":
      return "review";
    case "review":
      return "submitting";
    case "submitting":
      return "complete";
    case "complete":
      return "complete";
    case "failed":
      return "review";
    default: {
      const _never: never = step;
      return _never;
    }
  }
}

export function bookingRequestBodyFromDraft(
  draft: KioskShipmentDraft,
  hubBranchId: string | null,
): Record<string, unknown> {
  const weight = parsePositiveWeight(draft.weight);
  return {
    senderName: draft.senderName.trim(),
    senderPhone: digitsOnly(draft.senderPhone).slice(-10),
    senderAddress: draft.senderAddress.trim(),
    senderCity: draft.senderCity.trim(),
    senderState: draft.senderState.trim(),
    senderPincode: draft.senderPincode.trim(),
    receiverName: draft.receiverName.trim(),
    receiverPhone: digitsOnly(draft.receiverPhone).slice(-10),
    receiverAddress: draft.receiverAddress.trim(),
    receiverCity: draft.receiverCity.trim(),
    receiverState: draft.receiverState.trim(),
    receiverPincode: draft.receiverPincode.trim(),
    weight: weight != null ? String(weight) : "",
    numberOfPieces: 1,
    contentDescription: draft.contentDescription.trim(),
    declaredValue: draft.declaredValue.trim() || undefined,
    serviceType: draft.serviceType,
    shipmentType: draft.shipmentType || "domestic",
    destinationCountry:
      draft.shipmentType === "international" ? draft.destinationCountry.trim() : undefined,
    packageLength: draft.length.trim() || undefined,
    packageWidth: draft.width.trim() || undefined,
    packageHeight: draft.height.trim() || undefined,
    notes: "Submitted by XGoo Bot Assistant at the store counter.",
    source: "hub_kiosk",
    hub: hubBranchId || undefined,
  };
}

export function statusToPlainLanguage(status: string): string {
  const key = status.trim().toLowerCase().replace(/\s+/g, "_");
  switch (key) {
    case "pending":
    case "reviewed":
      return "Your request is with the store. It is not a booked shipment yet.";
    case "converted":
    case "booked":
      return "The store has created a shipment. Tracking updates follow courier scans.";
    case "picked_up":
      return "The parcel has been collected.";
    case "in_transit":
      return "The parcel is on the way.";
    case "out_for_delivery":
      return "The parcel is out for delivery.";
    case "delivered":
      return "The parcel has been delivered.";
    case "cancelled":
    case "rejected":
      return "This booking is not moving forward. Please speak with store staff.";
    default:
      return status.replace(/_/g, " ");
  }
}

export const KIOSK_KNOWLEDGE: KnowledgeArticle[] = [
  {
    id: "services",
    title: "Services available",
    tags: ["services", "domestic", "international", "air", "surface"],
    body: "XGoo Hub stores help walk-in customers send domestic and selected international parcels through partner networks. Air and surface options depend on pincode, weight, and partner availability. Staff complete payment and booking in Hub.",
  },
  {
    id: "domestic-international",
    title: "Domestic and international shipping",
    tags: ["domestic", "international", "country"],
    body: "Choose Domestic for India PIN-to-PIN movement. Choose International when the destination is outside India. Coverage depends on pincode or destination country and partner availability. Estimated delivery dates are indicative, not guaranteed, unless a premium service says otherwise.",
  },
  {
    id: "packaging",
    title: "Packaging guidelines",
    tags: ["packaging", "packing", "box"],
    body: "Use a sturdy carton, cushion fragile items, and seal all flaps. You are responsible for packing that can withstand courier handling, unless the store packs the parcel after a quoted packing service.",
  },
  {
    id: "prohibited",
    title: "Prohibited or restricted items",
    tags: ["prohibited", "restricted", "hazardous", "illegal"],
    body: "Do not book prohibited, illegal, hazardous, or restricted items, including hazardous materials, currency, and illegal goods. If you are unsure, ask a staff member. The Bot will not accept restricted shipments.",
  },
  {
    id: "international-docs",
    title: "Documents for international shipping",
    tags: ["international", "documents", "invoice", "kyc", "customs"],
    body: "International movement may need KYC, a commercial or gift invoice, contents description, and declared value. Required papers depend on the destination and courier partner. Staff will confirm documents before booking. The Bot does not invent customs paperwork.",
  },
  {
    id: "timelines",
    title: "Delivery timelines",
    tags: ["delivery", "tat", "time", "days"],
    body: "Shown delivery days are estimates from the rate engine or partner, not a guarantee, unless a service expressly says so. Live quotes come from this store’s pricing when available.",
  },
  {
    id: "payments",
    title: "Payment methods",
    tags: ["payment", "pay", "upi", "cash"],
    body: "Walk-in payment is collected by store staff after they review the parcel. The Bot does not take card or UPI itself and will not mark a shipment paid because a customer says they paid.",
  },
  {
    id: "pickup-drop",
    title: "Pickup and drop-off",
    tags: ["pickup", "drop", "counter", "walk-in"],
    body: "At this Hub you can drop a parcel at the counter. Doorstep pickup is booked in XGoo Go or XGoo Pro. Walk-in drop-offs stay with Hub staff and are not assigned to the Pickup app.",
  },
  {
    id: "hours",
    title: "Store hours and contact",
    tags: ["hours", "contact", "phone", "open"],
    body: "Typical support hours are Mon – Sat, 9:00 AM – 7:00 PM IST. Use the hours and phone shown on this kiosk for this store. If a detail is missing, please ask staff.",
  },
];

export function searchKnowledgeBase(query: string): KnowledgeArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return KIOSK_KNOWLEDGE;
  const scored = KIOSK_KNOWLEDGE.map((article) => {
    const hay = `${article.title} ${article.body} ${article.tags.join(" ")}`.toLowerCase();
    const words = q.split(/\s+/).filter((w) => w.length > 2);
    const hits = words.filter((w) => hay.includes(w)).length;
    const tagHit = article.tags.some((tag) => q.includes(tag) || tag.includes(q));
    return { article, score: hits + (tagHit ? 2 : 0) };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((row) => row.article);
}

export function quoteKey(partnerCode: string, serviceType: string): string {
  return `${partnerCode}:${serviceType}`;
}

export function demoQuotes(weightKg: number): KioskQuoteCard[] {
  const billed = Math.max(0.5, weightKg);
  return [
    {
      key: quoteKey("DEMO", "surface"),
      partnerName: "Demo Surface",
      partnerCode: "DEMO",
      serviceType: "surface",
      sellPrice: Math.round(80 + billed * 35),
      transitDays: 4,
      chargeableWeight: billed,
      source: "demo",
      isLive: false,
      message: "Demo estimate only — not a live XGoo tariff.",
    },
    {
      key: quoteKey("DEMO", "air"),
      partnerName: "Demo Air",
      partnerCode: "DEMO",
      serviceType: "air",
      sellPrice: Math.round(140 + billed * 55),
      transitDays: 2,
      chargeableWeight: billed,
      source: "demo",
      isLive: false,
      message: "Demo estimate only — not a live XGoo tariff.",
    },
  ];
}

export function demoSubmitResult(): KioskSubmitResult {
  const n = `DEMO-BR-${Date.now().toString(36).toUpperCase()}`;
  return {
    success: true,
    kind: "demo",
    requestNumber: n,
    booked: false,
    paid: false,
    labelReady: false,
    message:
      "Demo request recorded on this tablet only. This is not a real booking, payment, or AWB.",
  };
}

export function successFromBookingResponse(body: {
  success?: boolean;
  requestNumber?: string;
  message?: string;
}): KioskSubmitResult {
  const requestNumber = body.requestNumber?.trim() || null;
  const ok = body.success === true && Boolean(requestNumber);
  return {
    success: ok,
    kind: "booking_request",
    requestNumber,
    booked: false,
    paid: false,
    labelReady: false,
    message: ok
      ? `Your request ${requestNumber} is with this store. Staff will weigh, quote, take payment, and book the shipment. This is not a confirmed booking yet.`
      : body.message || "The store could not accept this request. Please ask staff.",
  };
}

export function extractSpokenSlots(utterance: string): Partial<KioskShipmentDraft> {
  const patch: Partial<KioskShipmentDraft> = {};
  const pin = utterance.match(/\b([1-9][0-9]{5})\b/);
  if (pin) patch.receiverPincode = pin[1];
  const phone = utterance.match(/\b([6-9]\d{9})\b/);
  if (phone) patch.receiverPhone = phone[1];
  const kg = utterance.match(/\b(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilo)/i);
  if (kg) patch.weight = kg[1];
  if (/\binternational\b|विदेश|విదేశ/.test(utterance.toLowerCase())) {
    patch.shipmentType = "international";
  } else if (/\bdomestic\b|भारत|దేశీయ/.test(utterance.toLowerCase())) {
    patch.shipmentType = "domestic";
  }
  if (/\bdocument\b|दस्तावेज|డాక్యుమెంట్/.test(utterance.toLowerCase())) {
    patch.packageType = "document";
  } else if (/\bparcel\b|\bnon[- ]?document\b|पार्सल/.test(utterance.toLowerCase())) {
    patch.packageType = "non_document";
  }
  return patch;
}
