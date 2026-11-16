import path from "path";
import OpenAI from "openai";
import { isOpenAiConfigured, resolveOpenAiApiKey } from "./openai-config";
import { parseTariffSheetBuffer, type ParsedTariffRow } from "./pricing";

const IMAGE_EXTS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".heic",
  ".heif",
  ".tif",
  ".tiff",
]);

const PARTNER_ALIASES: Record<string, string> = {
  st: "ST",
  stc: "ST",
  stcourier: "ST",
  stcouriers: "ST",
  "st courier": "ST",
  "st couriers": "ST",
  franch: "FRANCH",
  franchise: "FRANCH",
  franchexpress: "FRANCH",
  "franch express": "FRANCH",
  tirupati: "TIRUPATI",
  tpc: "TIRUPATI",
  delhivery: "DEL",
  del: "DEL",
  dl: "DEL",
  worldfirst: "WF",
  "world first": "WF",
  wf: "WF",
  wfc: "WF",
  bluedart: "BD",
  "blue dart": "BD",
  bd: "BD",
  dtdc: "DTDC",
  fedex: "FEDEX",
  ups: "UPS",
  atlantic: "ATLANTIC",
  icl: "ICL",
};

export type TariffUploadSource = "image" | "sheet";

export type TariffUploadParseResult = {
  rows: ParsedTariffRow[];
  source: TariffUploadSource;
};

export function isTariffImageFile(fileName?: string | null, mime?: string | null): boolean {
  if (mime && mime.toLowerCase().startsWith("image/")) return true;
  const ext = path.extname(fileName || "").toLowerCase();
  return IMAGE_EXTS.has(ext);
}

export function looksLikeImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return true;
  if (buffer.toString("ascii", 0, 3) === "GIF") return true;
  return false;
}

function imageMime(fileName: string, buffer: Buffer): string {
  const ext = path.extname(fileName || "").toLowerCase();
  if (ext === ".png" || buffer[0] === 0x89) return "image/png";
  if (ext === ".webp" || (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP")) {
    return "image/webp";
  }
  if (ext === ".gif" || buffer.toString("ascii", 0, 3) === "GIF") return "image/gif";
  return "image/jpeg";
}

function getOpenAi(): OpenAI {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) {
    throw new Error(
      "Photo import needs an OpenAI key. Add OPENAI_API_KEY or AI_INTEGRATIONS_OPENAI_API_KEY to .env and restart, or upload CSV/Excel instead.",
    );
  }
  const base = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim();
  return new OpenAI({
    apiKey,
    baseURL: base || undefined,
  });
}

function parseJsonObject(raw: string | null | undefined): Record<string, unknown> {
  const text = (raw || "").trim();
  if (!text) return {};
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const slice = start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
  try {
    return JSON.parse(slice) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function asNumber(value: unknown, fallback = NaN): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = String(value ?? "").replace(/[,₹]|rs\.?|inr/gi, "").trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
}

function asString(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function parseServiceType(raw: string): "air" | "surface" {
  const v = raw.toLowerCase();
  if (v.includes("air") || v.includes("express") || v === "a") return "air";
  return "surface";
}

function parseWeight(raw: unknown): { min: number; max: number; perKg: boolean } | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return { min: 0, max: raw, perKg: false };
  }
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const perKg = /per\s*kg/i.test(text);
  const numbers = text.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  if (numbers.length >= 2) return { min: numbers[0], max: numbers[1], perKg };
  if (numbers.length === 1 && numbers[0] > 0) return { min: 0, max: numbers[0], perKg };
  return null;
}

function normalizePartnerCode(raw: string, fallback?: string): string {
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (cleaned && PARTNER_ALIASES[cleaned]) return PARTNER_ALIASES[cleaned];
  const compact = cleaned.replace(/\s+/g, "");
  if (compact && PARTNER_ALIASES[compact]) return PARTNER_ALIASES[compact];
  if (raw.trim()) return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
  return (fallback || "").toUpperCase();
}

function countryCode(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (v.length === 2) return v.toUpperCase();
  const map: Record<string, string> = {
    india: "IN",
    usa: "US",
    us: "US",
    "united states": "US",
    uk: "GB",
    "united kingdom": "GB",
    uae: "AE",
    "united arab emirates": "AE",
    singapore: "SG",
    canada: "CA",
    australia: "AU",
  };
  return map[v.toLowerCase()] || v.toUpperCase().slice(0, 8);
}

function toParsedRow(raw: Record<string, unknown>, defaultPartnerCode?: string): ParsedTariffRow | null {
  const amount = asNumber(raw.tariffAmount ?? raw.rate ?? raw.amount ?? raw.price ?? raw.partner_rate, NaN);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const slab =
    parseWeight(raw.weightSlab ?? raw.weight_kg ?? raw.weight) ||
    null;
  let weightMin = asNumber(raw.weightMin ?? raw.weight_min, NaN);
  let weightMax = asNumber(raw.weightMax ?? raw.weight_max, NaN);
  if (!Number.isFinite(weightMin) || !Number.isFinite(weightMax)) {
    if (slab) {
      weightMin = slab.min;
      weightMax = slab.max;
    }
  }
  if (!Number.isFinite(weightMin)) weightMin = 0;
  if (!Number.isFinite(weightMax)) weightMax = 999;

  const partnerCode = normalizePartnerCode(
    asString(raw.partnerCode ?? raw.partner_code ?? raw.courier),
    defaultPartnerCode,
  );
  if (!partnerCode) return null;

  const notesParts = [asString(raw.notes)];
  const perKg =
    slab?.perKg ||
    /per\s*kg/i.test(asString(raw.weightSlab)) ||
    /per\s*kg/i.test(asString(raw.notes));
  if (perKg && !notesParts.some((n) => /rate_type=per_kg/i.test(n))) {
    notesParts.push("rate_type=per_kg");
  }

  return {
    partnerCode,
    serviceType: parseServiceType(asString(raw.serviceType ?? raw.service_type ?? raw.mode) || "surface"),
    shipmentType: asString(raw.shipmentType ?? raw.shipment_type) || "domestic",
    originCountry: countryCode(asString(raw.originCountry ?? raw.origin_country) || "IN") || "IN",
    destinationCountry: countryCode(asString(raw.destinationCountry ?? raw.destination_country)) || undefined,
    originPincode: asString(raw.originPincode ?? raw.origin_pincode) || undefined,
    destinationPincode: asString(raw.destinationPincode ?? raw.destination_pincode) || undefined,
    originZone: asString(raw.originZone ?? raw.origin_zone) || undefined,
    destinationZone: asString(raw.destinationZone ?? raw.destination_zone) || undefined,
    weightMin,
    weightMax,
    tariffAmount: amount,
    fixedMargin: asNumber(raw.fixedMargin ?? raw.fixed_margin, 0) || 0,
    percentageMargin: asNumber(raw.percentageMargin ?? raw.percentage_margin, 0) || 0,
    affiliateMargin: asNumber(raw.affiliateMargin ?? raw.affiliate_margin, 0) || 0,
    offerDiscount: asNumber(raw.offerDiscount ?? raw.offer_discount, 0) || 0,
    fuelCharge: asNumber(raw.fuelCharge ?? raw.fuel_charge, 0) || 0,
    handlingCharge: asNumber(raw.handlingCharge ?? raw.handling_charge, 0) || 0,
    insuranceCharge: asNumber(raw.insuranceCharge ?? raw.insurance_charge, 0) || 0,
    remoteAreaCharge: asNumber(raw.remoteAreaCharge ?? raw.remote_area_charge, 0) || 0,
    gst: asNumber(raw.gst, 0) || 0,
    transitDays: asNumber(raw.transitDays ?? raw.transit_days, NaN) || undefined,
    isActive: true,
    notes: notesParts.filter(Boolean).join("; ") || undefined,
  };
}

function openAiErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") return String(err);
  const e = err as Record<string, unknown> & {
    error?: { message?: string; code?: string };
    code?: string;
    message?: string;
  };
  const inner = e.error;
  const innerMsg = inner && typeof inner === "object" ? inner.message : undefined;
  const msg = innerMsg || (typeof e.message === "string" ? e.message : "OpenAI request failed");
  const code = (inner && typeof inner === "object" ? inner.code : undefined) || e.code;
  if (code === "insufficient_quota" || /insufficient_quota|exceeded your current quota|billing/i.test(msg)) {
    return "OpenAI quota or billing limit reached. Add credits, then try the photo again — or upload CSV/Excel.";
  }
  if (code === "invalid_api_key" || /invalid.?api|incorrect api key/i.test(msg)) {
    return "OpenAI rejected the API key. Check OPENAI_API_KEY in .env and restart, or upload CSV/Excel.";
  }
  if (code === "rate_limit_exceeded" || /rate.?limit/i.test(msg)) {
    return "OpenAI rate limit exceeded. Wait a minute and try the photo again.";
  }
  return msg;
}

export async function extractTariffRowsFromImages(
  files: Array<{ buffer: Buffer; fileName: string }>,
  defaultPartnerCode?: string,
): Promise<ParsedTariffRow[]> {
  if (!isOpenAiConfigured()) {
    throw new Error(
      "Photo import needs an OpenAI key. Add OPENAI_API_KEY or AI_INTEGRATIONS_OPENAI_API_KEY to .env and restart, or upload CSV/Excel instead.",
    );
  }
  if (files.length === 0) return [];

  const openai = getOpenAi();
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: "text",
      text:
        "Extract every courier rate / tariff from this rate-card photo (or photos). " +
        "Return JSON only. If destinations are columns, emit one row per destination per weight slab. " +
        "Do not invent rates that are not visible. Skip totals, headers, and empty cells. " +
        (defaultPartnerCode ? `Default partner_code if missing: ${defaultPartnerCode}. ` : "") +
        "Partner codes: ST, FRANCH, TIRUPATI, DEL, WF, BD, DTDC, FEDEX, UPS, ATLANTIC.",
    },
  ];

  for (const file of files.slice(0, 4)) {
    const mime = imageMime(file.fileName, file.buffer);
    if (mime !== "image/jpeg" && mime !== "image/png" && mime !== "image/webp" && mime !== "image/gif") {
      throw new Error("Use a JPG, PNG, WEBP, or GIF of the rate card. HEIC/TIFF photos should be saved as JPG first.");
    }
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${mime};base64,${file.buffer.toString("base64")}`,
      },
    });
  }

  let response: OpenAI.Chat.Completions.ChatCompletion;
  try {
    response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You read courier tariff / rate-card photos and convert them into structured rows.

Return JSON:
{
  "inferredPartner": "ST",
  "rows": [
    {
      "partnerCode": "ST",
      "serviceType": "surface",
      "shipmentType": "domestic",
      "originCountry": "IN",
      "destinationCountry": "IN",
      "originPincode": "",
      "destinationPincode": "",
      "originZone": "",
      "destinationZone": "",
      "weightMin": 0,
      "weightMax": 0.5,
      "weightSlab": "0-0.5",
      "tariffAmount": 120,
      "fuelCharge": 0,
      "handlingCharge": 0,
      "gst": 0,
      "transitDays": 3,
      "notes": ""
    }
  ]
}

Rules:
- tariffAmount is the printed partner rate as a number (INR unless another currency is labeled).
- Weights are kilograms. "Upto 1 kg" → weightMin 0, weightMax 1. "1-2" → 1 and 2. "Per kg" → notes include rate_type=per_kg.
- serviceType is "air" for air/express/priority, otherwise "surface".
- shipmentType is domestic or international (or Package/Document if printed).
- Destination country columns: ISO2 codes (USA→US, UK→GB, UAE→AE, India→IN).
- Zones/pincodes: copy if visible; otherwise leave empty.
- If GST/tax is printed as a percent (e.g. GST 18%), set gst to that number on each row.
- Infer the courier from logos/letterhead when partnerCode is missing.
- Never guess a missing rate. Omit unreadable cells.`,
        },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8000,
    });
  } catch (err) {
    throw new Error(openAiErrorMessage(err));
  }

  const parsed = parseJsonObject(response.choices[0]?.message?.content);
  const inferred = normalizePartnerCode(asString(parsed.inferredPartner), defaultPartnerCode);
  const rawRows = Array.isArray(parsed.rows) ? parsed.rows : [];
  const rows: ParsedTariffRow[] = [];
  for (const item of rawRows) {
    if (!item || typeof item !== "object") continue;
    const row = toParsedRow(item as Record<string, unknown>, inferred || defaultPartnerCode);
    if (row) rows.push(row);
  }
  return rows;
}

export async function parseTariffUploadBuffer(
  buffer: Buffer,
  fileName: string,
  defaultPartnerCode?: string,
  extraFiles?: Array<{ buffer: Buffer; fileName: string }>,
): Promise<TariffUploadParseResult> {
  const primaryIsImage = isTariffImageFile(fileName) || looksLikeImageBuffer(buffer);
  if (primaryIsImage) {
    const images = [{ buffer, fileName }, ...(extraFiles || [])].filter(
      (f) => isTariffImageFile(f.fileName) || looksLikeImageBuffer(f.buffer),
    );
    const rows = await extractTariffRowsFromImages(images, defaultPartnerCode);
    return { rows, source: "image" };
  }
  return {
    rows: parseTariffSheetBuffer(buffer, fileName, defaultPartnerCode),
    source: "sheet",
  };
}
