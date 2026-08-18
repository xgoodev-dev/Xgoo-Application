import { z } from "zod";
import OpenAI from "openai";
import type { Shipment } from "@shared/schema";
import { storage } from "../storage";
import { isOpenAiConfigured, resolveOpenAiApiKey } from "../openai-config";
import { BookingEngineError } from "./service";
import { verifyAutofillToken } from "./autofill-token";

export const scrapedFieldSchema = z.object({
  id: z.string().min(1).max(48),
  label: z.string().max(160).optional().default(""),
  name: z.string().max(80).optional().default(""),
  htmlId: z.string().max(80).optional().default(""),
  section: z.string().max(40).optional().default(""),
  tag: z.string().max(20).optional().default("input"),
  type: z.string().max(20).optional().default("text"),
  value: z.string().max(160).optional().default(""),
  options: z.array(z.string().max(80)).max(25).optional().default([]),
});

export const mapFieldsRequestSchema = z.object({
  token: z.string().min(10).max(800),
  shipmentId: z.string().uuid(),
  partnerCode: z.string().max(40).optional(),
  fields: z.array(scrapedFieldSchema).max(160),
});

export type ScrapedField = z.infer<typeof scrapedFieldSchema>;
export type FieldMapping = { fieldId: string; value: string };

function normalizeLabel(value: string): string {
  return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function fmt(value: unknown): string {
  if (value == null || value === "") return "";
  return String(value).trim();
}

function splitAddress(address: string): { line1: string; line2: string } {
  const raw = (address || "").trim();
  if (!raw) return { line1: "", line2: "" };
  const comma = raw.indexOf(",");
  if (comma > 8 && comma < 80) {
    return { line1: raw.slice(0, comma).trim(), line2: raw.slice(comma + 1).trim() };
  }
  if (raw.length > 80) {
    return { line1: raw.slice(0, 80).trim(), line2: raw.slice(80).trim() };
  }
  return { line1: raw, line2: "" };
}

function isForbiddenLabel(label: string): boolean {
  const n = normalizeLabel(label);
  if (!n) return false;
  if (
    /\b(awb|waybill|client name|client id|book date|iec|gstin|document no|document type|hsn|igst|cgst|sgst|surcharge|contract charges|other charges|item fuel|tax on fuel|item amount|item total|csb type|term of invoice|export reason|department)\b/.test(
      n,
    )
  ) {
    return true;
  }
  if (n === "product" || n.startsWith("product ")) return true;
  if (n === "vendor" || n.startsWith("vendor ")) return true;
  if (n === "service" || n.startsWith("service ")) return true;
  if (n.includes("gst invoice") || n.includes("invoice date") || n.includes("invoice no")) return true;
  return false;
}

function labelHas(label: string, includes: string[], rejects: string[] = []): boolean {
  const n = normalizeLabel(label);
  if (!n) return false;
  if (rejects.some((reject) => n.includes(reject))) return false;
  return includes.some((needle) => n.includes(needle));
}

function takeField(
  remaining: ScrapedField[],
  includes: string[],
  rejects: string[] = [],
  section?: string,
): ScrapedField | undefined {
  const idx = remaining.findIndex((field) => {
    if (isForbiddenLabel(field.label)) return false;
    if (section && field.section && field.section !== section) {
      return false;
    }
    return labelHas(field.label, includes, rejects);
  });
  if (idx < 0) return undefined;
  const [field] = remaining.splice(idx, 1);
  return field;
}

function pushMapping(out: FieldMapping[], field: ScrapedField | undefined, value: unknown) {
  const text = fmt(value);
  if (!field || !text) return;
  if (isForbiddenLabel(field.label)) return;
  out.push({ fieldId: field.id, value: text.slice(0, 200) });
}

function shipmentFacts(shipment: Shipment) {
  const senderLines = splitAddress(shipment.senderAddress);
  const receiverLines = splitAddress(shipment.receiverAddress);
  return {
    shipper: {
      name: shipment.senderName,
      phone: shipment.senderPhone,
      address: shipment.senderAddress,
      address1: senderLines.line1 || shipment.senderAddress,
      address2: senderLines.line2,
      city: shipment.senderCity || "",
      state: shipment.senderState || "",
      pincode: shipment.senderPincode || "",
      country: "INDIA",
    },
    consignee: {
      name: shipment.receiverName,
      phone: shipment.receiverPhone,
      address: shipment.receiverAddress,
      address1: receiverLines.line1 || shipment.receiverAddress,
      address2: receiverLines.line2,
      city: shipment.receiverCity || "",
      state: shipment.receiverState || "",
      pincode: shipment.receiverPincode || "",
      country: "INDIA",
    },
    package: {
      pieces: shipment.numberOfPieces ?? 1,
      weightKg: fmt(shipment.weight),
      chargeableWeight: fmt(shipment.chargeableWeight || shipment.weight),
      volumetricWeight: fmt(shipment.volumetricWeight),
      length: fmt(shipment.length),
      width: fmt(shipment.width),
      height: fmt(shipment.height),
      contents: shipment.contentDescription || "",
      declaredValueInr: fmt(shipment.declaredValue),
      bookingNumber: shipment.bookingNumber,
      serviceType: shipment.serviceType,
    },
  };
}

function heuristicMap(facts: ReturnType<typeof shipmentFacts>, fields: ScrapedField[]): FieldMapping[] {
  const remaining = [...fields];
  const out: FieldMapping[] = [];
  const { shipper, consignee, package: pkg } = facts;

  pushMapping(out, takeField(remaining, ["destination"], ["origin"], "consignee"), consignee.city);
  pushMapping(out, takeField(remaining, ["company name", "company"], ["client"], "consignee"), consignee.name);
  pushMapping(
    out,
    takeField(remaining, ["contact name"], ["address", "company", "telephone", "mobile"], "consignee"),
    consignee.name,
  );
  pushMapping(
    out,
    takeField(remaining, ["address 1", "address1", "addr 1"], ["address 2", "address2"], "consignee"),
    consignee.address1,
  );
  pushMapping(
    out,
    takeField(remaining, ["address 2", "address2", "addr 2"], ["address 1", "address1"], "consignee"),
    consignee.address2,
  );
  pushMapping(out, takeField(remaining, ["pincode", "pin code"], ["origin"], "consignee"), consignee.pincode);
  pushMapping(out, takeField(remaining, ["city"], ["pincode", "state", "origin"], "consignee"), consignee.city);
  pushMapping(out, takeField(remaining, ["state"], ["statement", "origin"], "consignee"), consignee.state);
  pushMapping(out, takeField(remaining, ["mobile no", "mobile"], ["telephone"], "consignee"), consignee.phone);
  pushMapping(out, takeField(remaining, ["telephone", "tel"], ["mobile"], "consignee"), consignee.phone);
  pushMapping(out, takeField(remaining, ["country"], ["iec", "document", "gst"], "consignee"), consignee.country);

  pushMapping(out, takeField(remaining, ["origin"], ["destination"], "shipper"), shipper.city);
  pushMapping(
    out,
    takeField(remaining, ["contact name"], ["address", "company", "telephone", "mobile", "client"], "shipper"),
    shipper.name,
  );
  pushMapping(
    out,
    takeField(remaining, ["address 1", "address1", "addr 1"], ["address 2", "address2"], "shipper"),
    shipper.address1,
  );
  pushMapping(
    out,
    takeField(remaining, ["address 2", "address2", "addr 2"], ["address 1", "address1"], "shipper"),
    shipper.address2,
  );
  pushMapping(out, takeField(remaining, ["pincode", "pin code"], ["destination"], "shipper"), shipper.pincode);
  pushMapping(out, takeField(remaining, ["city"], ["pincode", "state", "destination"], "shipper"), shipper.city);
  pushMapping(out, takeField(remaining, ["state"], ["statement", "destination"], "shipper"), shipper.state);
  pushMapping(out, takeField(remaining, ["mobile no", "mobile"], ["telephone"], "shipper"), shipper.phone);
  pushMapping(out, takeField(remaining, ["telephone", "tel"], ["mobile"], "shipper"), shipper.phone);

  pushMapping(
    out,
    takeField(remaining, ["shipment value", "invoice value", "declared value"], ["gst invoice"], "services"),
    pkg.declaredValueInr,
  );
  pushMapping(out, takeField(remaining, ["pieces"], ["no. of pieces", "no of pieces"], "services"), pkg.pieces);
  pushMapping(out, takeField(remaining, ["actual weight"], ["volumetric", "charge"], "services"), pkg.weightKg);
  pushMapping(out, takeField(remaining, ["charge weight", "chrg weight"], ["volumetric"], "services"), pkg.chargeableWeight);
  pushMapping(out, takeField(remaining, ["volumetric weight"], ["discount"], "services"), pkg.volumetricWeight);

  pushMapping(out, takeField(remaining, ["measurement unit"], [], "pieces"), "Centimeter");
  pushMapping(
    out,
    takeField(remaining, ["actl weight", "actual weight"], ["volumetric", "charge"], "pieces"),
    pkg.weightKg,
  );
  pushMapping(out, takeField(remaining, ["no. of pieces", "no of pieces", "number of pieces"], [], "pieces"), pkg.pieces);
  pushMapping(out, takeField(remaining, ["length"], ["telephone"], "pieces"), pkg.length);
  pushMapping(out, takeField(remaining, ["width", "breadth"], [], "pieces"), pkg.width);
  pushMapping(out, takeField(remaining, ["height"], [], "pieces"), pkg.height);

  pushMapping(
    out,
    takeField(remaining, ["description"], ["export reason", "charge", "item amount"], "performa"),
    pkg.contents,
  );
  pushMapping(out, takeField(remaining, ["quantity"], ["weight"], "performa"), pkg.pieces);
  pushMapping(out, takeField(remaining, ["weight"], ["volumetric", "charge", "actl"], "performa"), pkg.weightKg);
  pushMapping(out, takeField(remaining, ["packages", "package"], ["description"], "performa"), pkg.pieces);

  pushMapping(out, takeField(remaining, ["reference"], ["invoice"], "shipment"), pkg.bookingNumber);
  pushMapping(out, takeField(remaining, ["content"], ["instruction"], "shipment"), pkg.contents);

  return out;
}

function mergeMappings(base: FieldMapping[], overlay: FieldMapping[]): FieldMapping[] {
  const byId = new Map<string, string>();
  for (const row of base) byId.set(row.fieldId, row.value);
  for (const row of overlay) {
    if (row.fieldId && row.value) byId.set(row.fieldId, row.value);
  }
  return [...byId.entries()].map(([fieldId, value]) => ({ fieldId, value }));
}

async function aiMap(
  facts: ReturnType<typeof shipmentFacts>,
  fields: ScrapedField[],
): Promise<FieldMapping[]> {
  if (!isOpenAiConfigured()) return [];
  const compactFields = fields.map((field) => ({
    id: field.id,
    label: field.label,
    section: field.section,
    options: field.options?.slice(0, 12) || [],
    current: field.value || "",
  }));

  const client = new OpenAI({
    apiKey: resolveOpenAiApiKey(),
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim() || undefined,
  });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You map an XGoo shipment onto a live courier booking form (often World First Xpresion AWB Entry).
Return JSON: { "mappings": [ { "fieldId": string, "value": string } ] }

Rules:
- Use only fieldId values from the scraped field list.
- Shipper/from = sender. Consignee/to = receiver. Never mix columns.
- Contact Name is a person or company contact, never a street locality.
- Address 1 is the first street line. Address 2 is the remainder. Do not duplicate Address 1 into Address 2.
- Consignee state must match the consignee city (Bengaluru = Karnataka). Never copy the shipper state into consignee.
- Country is INDIA only on a field labelled Country. Never put INDIA or a country into IEC, Document No, GSTIN, or HSN.
- Fill pieces details: actual weight, number of pieces, length, width, height. Measurement unit = Centimeter when that option exists.
- Fill shipment value, charge weight, content, and reference number (XGoo booking number).
- Performa Description/Quantity/Weight/Packages may use contents and piece/weight. Do not invent HSN, invoice numbers, GST, or charge amounts.
- Skip Product, Vendor, Service lookup boxes unless options clearly contain an exact match.
- Skip AWB, Client Name, Client ID, Book Date, IEC, Document Type/No, charges, tax, fuel, CSB, and invoice metadata.
- Do not invent catalog codes. Leave empty when unsure.
- You may replace a current value when it is clearly the wrong shipment field (address fragment in Contact Name, shipper state on consignee, country in IEC — in the IEC case leave it empty).`,
      },
      {
        role: "user",
        content: JSON.stringify({ shipment: facts, fields: compactFields }),
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 1800,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  let parsed: { mappings?: Array<{ fieldId?: string; value?: unknown }> };
  try {
    parsed = JSON.parse(raw) as { mappings?: Array<{ fieldId?: string; value?: unknown }> };
  } catch {
    return [];
  }
  const allowed = new Set(fields.map((field) => field.id));
  const labelById = new Map(fields.map((field) => [field.id, field.label]));
  const mappings: FieldMapping[] = [];
  for (const row of parsed.mappings || []) {
    const fieldId = String(row.fieldId || "");
    const value = fmt(row.value);
    if (!fieldId || !value || !allowed.has(fieldId)) continue;
    if (isForbiddenLabel(labelById.get(fieldId) || "")) continue;
    mappings.push({ fieldId, value: value.slice(0, 200) });
  }
  return mappings;
}

export async function mapPartnerFormFields(rawBody: unknown): Promise<{
  mappings: FieldMapping[];
  usedAi: boolean;
}> {
  const body = mapFieldsRequestSchema.parse(rawBody);
  if (!verifyAutofillToken(body.token, body.shipmentId)) {
    throw new BookingEngineError("Autofill token expired. Open the partner portal from XGoo again.", 401, "token");
  }
  const shipment = await storage.getShipment(body.shipmentId);
  if (!shipment) {
    throw new BookingEngineError("Shipment not found", 404, "not_found");
  }

  const facts = shipmentFacts(shipment);
  const heuristic = heuristicMap(facts, body.fields);
  let usedAi = false;
  let ai: FieldMapping[] = [];
  try {
    ai = await aiMap(facts, body.fields);
    usedAi = ai.length > 0;
  } catch (error) {
    console.error("Extension AI field map failed, using heuristic:", error);
  }

  return { mappings: mergeMappings(heuristic, ai), usedAi };
}
