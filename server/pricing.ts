import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import type { CourierPartner, InsertTariffRateRow, TariffRateRow } from "@shared/schema";
import { calculateCustomerPrice, tariffRowFingerprint } from "@shared/tariff-pricing";

export type ParsedTariffRow = {
  partnerCode: string;
  serviceType: "air" | "surface";
  shipmentType?: string;
  originCountry?: string;
  destinationCountry?: string;
  originPincode?: string;
  destinationPincode?: string;
  originZone?: string;
  destinationZone?: string;
  weightMin: number;
  weightMax: number;
  tariffAmount: number;
  fixedMargin?: number;
  percentageMargin?: number;
  affiliateMargin?: number;
  offerDiscount?: number;
  fuelCharge?: number;
  handlingCharge?: number;
  insuranceCharge?: number;
  remoteAreaCharge?: number;
  gst?: number;
  transitDays?: number;
  isActive?: boolean;
  notes?: string;
};

const HEADER_ALIASES: Record<string, string[]> = {
  partnerCode: ["partner_code", "partner", "courier", "courier_code", "code", "courier_partner"],
  serviceType: ["service_type", "service", "mode"],
  originPincode: ["origin_pincode", "from_pincode", "origin", "from", "sender_pincode"],
  destinationPincode: ["destination_pincode", "to_pincode", "destination", "to", "receiver_pincode", "dest_pincode"],
  originZone: ["origin_zone", "from_zone", "zone_from"],
  destinationZone: ["destination_zone", "to_zone", "zone_to", "dest_zone"],
  weightMin: ["weight_min", "min_weight", "from_weight"],
  weightMax: ["weight_max", "max_weight", "to_weight"],
  weightKg: ["weight_kg", "weight", "slab"],
  tariffAmount: ["tariff_amount", "rate", "amount", "price", "tariff", "freight", "partner_rate"],
  shipmentType: ["shipment_type", "shipment", "type"],
  originCountry: ["origin_country", "from_country"],
  destinationCountry: ["destination_country", "to_country", "dest_country"],
  fixedMargin: ["fixed_margin", "margin_fixed", "margin_amount"],
  percentageMargin: ["percentage_margin", "margin_percent", "margin_pct"],
  affiliateMargin: ["affiliate_margin", "affiliate"],
  offerDiscount: ["offer_discount", "discount"],
  fuelCharge: ["fuel_charge", "fuel"],
  handlingCharge: ["handling_charge", "handling"],
  insuranceCharge: ["insurance_charge", "insurance"],
  remoteAreaCharge: ["remote_area_charge", "remote_charge", "oda"],
  gst: ["gst", "tax"],
  transitDays: ["transit_days", "transit", "tat"],
  isActive: ["active", "is_active"],
  notes: ["notes", "remark", "remarks"],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

function mapHeaders(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (let i = 0; i < headers.length; i++) {
    const norm = normalizeHeader(headers[i]);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(norm) && map[field] === undefined) {
        map[field] = i;
      }
    }
  }
  return map;
}

function cellStr(row: unknown[], idx?: number): string {
  if (idx === undefined || idx < 0) return "";
  const v = row[idx];
  if (v == null) return "";
  return String(v).trim();
}

function cellNum(row: unknown[], idx?: number, fallback = 0): number {
  const s = cellStr(row, idx).replace(/[,₹]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
}

function parseServiceType(raw: string): "air" | "surface" {
  const v = raw.toLowerCase();
  if (v.includes("air") || v.includes("express") || v === "a") return "air";
  return "surface";
}

const COUNTRY_CODES: Record<string, string> = {
  australia: "AU",
  canada: "CA",
  china: "CN",
  france: "FR",
  germany: "DE",
  india: "IN",
  italy: "IT",
  japan: "JP",
  singapore: "SG",
  spain: "ES",
  uae: "AE",
  "united arab emirates": "AE",
  uk: "GB",
  "united kingdom": "GB",
  usa: "US",
  us: "US",
  "united states": "US",
};

function destinationCode(header: string): string {
  const cleaned = header
    .replace(/\([^)]*(?:₹|rs\.?|inr)[^)]*\)/gi, "")
    .replace(/[₹]/g, "")
    .trim();
  const normalized = cleaned.toLowerCase().replace(/\s+/g, " ");
  return COUNTRY_CODES[normalized] || (cleaned.length === 2 ? cleaned.toUpperCase() : cleaned);
}

function parseWeightSlab(value: unknown): {
  min: number;
  max: number;
  perKg: boolean;
} | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return { min: 0, max: value, perKg: false };
  }

  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const perKg = /per\s*kg/i.test(raw);
  const numbers = raw.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  if (numbers.length >= 2) {
    return { min: numbers[0], max: numbers[1], perKg };
  }
  if (numbers.length === 1 && numbers[0] > 0) {
    return { min: 0, max: numbers[0], perKg };
  }
  return null;
}

function parseWideDestinationRateSheet(
  sheetRows: unknown[][],
  partnerCode: string,
  serviceType: "air" | "surface",
): ParsedTariffRow[] | null {
  const headers = (sheetRows[0] || []).map((value) => String(value).trim());
  const shipmentTypeIndex = headers.findIndex((header) =>
    /^shipment[\s_-]*type$/i.test(header),
  );
  const weightIndex = headers.findIndex((header) => /^weight(?:\s*\(kg\))?$/i.test(header));
  if (shipmentTypeIndex < 0 || weightIndex < 0 || headers.length < 3) return null;

  const rateColumns = headers
    .map((header, index) => ({ header, index }))
    .filter(({ index, header }) =>
      index !== shipmentTypeIndex &&
      index !== weightIndex &&
      header.length > 0,
    );
  if (rateColumns.length === 0) return null;

  const results: ParsedTariffRow[] = [];
  for (let rowIndex = 1; rowIndex < sheetRows.length; rowIndex++) {
    const row = sheetRows[rowIndex] || [];
    const weight = parseWeightSlab(row[weightIndex]);
    if (!weight) continue;
    const shipmentType = cellStr(row, shipmentTypeIndex) || "Package";

    for (const { header, index } of rateColumns) {
      const amount = cellNum(row, index, NaN);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      results.push({
        partnerCode,
        serviceType,
        shipmentType,
        originCountry: "IN",
        destinationCountry: destinationCode(header),
        weightMin: weight.min,
        weightMax: weight.max,
        tariffAmount: amount,
        isActive: true,
        notes: weight.perKg ? "rate_type=per_kg" : undefined,
      });
    }
  }
  return results;
}

export function parseTariffSheetRows(
  filePath: string,
  defaultPartnerCode?: string,
): ParsedTariffRow[] {
  const buffer = fs.readFileSync(filePath);
  return parseTariffSheetBuffer(buffer, path.basename(filePath), defaultPartnerCode);
}

export function parseTariffSheetBuffer(
  buffer: Buffer,
  originalName: string,
  defaultPartnerCode?: string,
): ParsedTariffRow[] {
  const ext = path.extname(originalName).toLowerCase();
  let sheetRows: unknown[][];

  if (ext === ".csv") {
    const text = buffer.toString("utf-8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    sheetRows = lines.map((line) => {
      const parts: string[] = [];
      let cur = "";
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuote = !inQuote;
        } else if (ch === "," && !inQuote) {
          parts.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
      parts.push(cur);
      return parts;
    });
  } else {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    sheetRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
    const inferredPartner =
      defaultPartnerCode ||
      (/ups/i.test(`${originalName} ${sheetName}`) ? "UPS" : "");
    const wideRows = parseWideDestinationRateSheet(
      sheetRows,
      inferredPartner,
      parseServiceType(sheetName),
    );
    if (wideRows) return wideRows;
  }

  return parseSheetRows(sheetRows, defaultPartnerCode);
}

function parseSheetRows(
  sheetRows: unknown[][],
  defaultPartnerCode?: string,
): ParsedTariffRow[] {

  const headers = (sheetRows[0] as string[]).map((h) => String(h));
  const col = mapHeaders(headers);
  const results: ParsedTariffRow[] = [];

  for (let r = 1; r < sheetRows.length; r++) {
    const row = sheetRows[r] as unknown[];
    if (!row || row.every((c) => c == null || String(c).trim() === "")) continue;

    const partnerCode = cellStr(row, col.partnerCode) || defaultPartnerCode || "";
    const amount = cellNum(row, col.tariffAmount);
    if (!partnerCode || amount <= 0) continue;

    let wMin = cellNum(row, col.weightMin, NaN);
    let wMax = cellNum(row, col.weightMax, NaN);
    const singleW = cellNum(row, col.weightKg, NaN);

    if (!Number.isFinite(wMin) && Number.isFinite(singleW)) wMin = 0;
    if (!Number.isFinite(wMax) && Number.isFinite(singleW)) wMax = singleW;
    if (!Number.isFinite(wMin)) wMin = 0;
    if (!Number.isFinite(wMax)) wMax = 999;

    results.push({
      partnerCode: partnerCode.toUpperCase(),
      serviceType: parseServiceType(cellStr(row, col.serviceType) || "surface"),
      shipmentType: cellStr(row, col.shipmentType) || "domestic",
      originCountry: cellStr(row, col.originCountry) || "IN",
      destinationCountry: cellStr(row, col.destinationCountry) || undefined,
      originPincode: cellStr(row, col.originPincode) || undefined,
      destinationPincode: cellStr(row, col.destinationPincode) || undefined,
      originZone: cellStr(row, col.originZone) || undefined,
      destinationZone: cellStr(row, col.destinationZone) || undefined,
      weightMin: wMin,
      weightMax: wMax,
      tariffAmount: amount,
      fixedMargin: cellNum(row, col.fixedMargin, 0),
      percentageMargin: cellNum(row, col.percentageMargin, 0),
      affiliateMargin: cellNum(row, col.affiliateMargin, 0),
      offerDiscount: cellNum(row, col.offerDiscount, 0),
      fuelCharge: cellNum(row, col.fuelCharge, 0),
      handlingCharge: cellNum(row, col.handlingCharge, 0),
      insuranceCharge: cellNum(row, col.insuranceCharge, 0),
      remoteAreaCharge: cellNum(row, col.remoteAreaCharge, 0),
      gst: cellNum(row, col.gst, 0),
      transitDays: cellNum(row, col.transitDays, NaN) || undefined,
      isActive: col.isActive !== undefined ? !["0", "false", "no", "inactive"].includes(cellStr(row, col.isActive).toLowerCase()) : true,
      notes: cellStr(row, col.notes) || undefined,
    });
  }

  return results;
}

export function resolvePartnerId(
  code: string,
  partners: CourierPartner[],
): string | undefined {
  const upper = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = partners.find((p) => {
    const pCode = p.code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const pName = p.name.toUpperCase();
    return pCode === upper || pName === upper || pName.includes(upper) || upper.includes(pCode);
  });
  return match?.id;
}

export function parsedRowsToInsert(
  parsed: ParsedTariffRow[],
  partners: CourierPartner[],
  tariffVersionId: string,
  officeId: string,
  defaultPartnerId?: string,
): { rows: InsertTariffRateRow[]; errors: string[] } {
  const rows: InsertTariffRateRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i];
    const partnerId =
      resolvePartnerId(p.partnerCode, partners) || defaultPartnerId;
    if (!partnerId) {
      errors.push(`Row ${i + 2}: unknown partner code "${p.partnerCode}"`);
      continue;
    }
    const customerPrice = calculateCustomerPrice({
      tariffAmount: p.tariffAmount,
      fixedMargin: p.fixedMargin,
      percentageMargin: p.percentageMargin,
      affiliateMargin: p.affiliateMargin,
      offerDiscount: p.offerDiscount,
      fuelCharge: p.fuelCharge,
      handlingCharge: p.handlingCharge,
      insuranceCharge: p.insuranceCharge,
      remoteAreaCharge: p.remoteAreaCharge,
      gst: p.gst,
    });
    rows.push({
      tariffVersionId,
      officeId,
      courierPartnerId: partnerId,
      serviceType: p.serviceType,
      shipmentType: p.shipmentType || "domestic",
      originCountry: p.originCountry || "IN",
      destinationCountry: p.destinationCountry || null,
      originPincode: p.originPincode || null,
      destinationPincode: p.destinationPincode || null,
      originZone: p.originZone || null,
      destinationZone: p.destinationZone || null,
      weightMin: String(p.weightMin),
      weightMax: String(p.weightMax),
      tariffAmount: String(p.tariffAmount),
      fixedMargin: String(p.fixedMargin ?? 0),
      percentageMargin: String(p.percentageMargin ?? 0),
      affiliateMargin: String(p.affiliateMargin ?? 0),
      offerDiscount: String(p.offerDiscount ?? 0),
      fuelCharge: String(p.fuelCharge ?? 0),
      handlingCharge: String(p.handlingCharge ?? 0),
      insuranceCharge: String(p.insuranceCharge ?? 0),
      remoteAreaCharge: String(p.remoteAreaCharge ?? 0),
      gst: String(p.gst ?? 0),
      customerPrice: String(customerPrice),
      transitDays: p.transitDays ?? null,
      isActive: p.isActive !== false,
      notes: p.notes || null,
    });
  }

  return { rows, errors };
}

export type ImportPreviewRow = {
  index: number;
  status: "new" | "updated" | "deleted" | "duplicate" | "unchanged";
  fingerprint: string;
  data: Record<string, unknown>;
  existingId?: string;
  oldPrice?: number;
  newPrice?: number;
};

export function buildImportPreview(
  incoming: InsertTariffRateRow[],
  existing: TariffRateRow[],
): { rows: ImportPreviewRow[]; summary: Record<string, number> } {
  const existingByFp = new Map<string, TariffRateRow>();
  const seenIncoming = new Set<string>();
  const summary = { new: 0, updated: 0, deleted: 0, duplicate: 0, unchanged: 0 };

  for (const row of existing) {
    existingByFp.set(
      tariffRowFingerprint({
        courierPartnerId: row.courierPartnerId,
        serviceType: row.serviceType,
        shipmentType: row.shipmentType,
        originCountry: row.originCountry,
        destinationCountry: row.destinationCountry,
        weightMin: row.weightMin,
        weightMax: row.weightMax,
        originPincode: row.originPincode,
        destinationPincode: row.destinationPincode,
        originZone: row.originZone,
        destinationZone: row.destinationZone,
      }),
      row,
    );
  }

  const preview: ImportPreviewRow[] = [];

  for (let i = 0; i < incoming.length; i++) {
    const row = incoming[i];
    const fp = tariffRowFingerprint({
      courierPartnerId: row.courierPartnerId,
      serviceType: row.serviceType || "surface",
      shipmentType: row.shipmentType,
      originCountry: row.originCountry,
      destinationCountry: row.destinationCountry,
      weightMin: row.weightMin || "0",
      weightMax: row.weightMax || "999",
      originPincode: row.originPincode,
      destinationPincode: row.destinationPincode,
      originZone: row.originZone,
      destinationZone: row.destinationZone,
    });
    if (seenIncoming.has(fp)) {
      summary.duplicate++;
      preview.push({
        index: i + 2,
        status: "duplicate",
        fingerprint: fp,
        data: row as unknown as Record<string, unknown>,
        newPrice: parseFloat(row.customerPrice || row.tariffAmount || "0"),
      });
      continue;
    }
    seenIncoming.add(fp);

    const match = existingByFp.get(fp);
    const newPrice = parseFloat(row.customerPrice || row.tariffAmount || "0");
    if (!match) {
      summary.new++;
      preview.push({ index: i + 2, status: "new", fingerprint: fp, data: row as unknown as Record<string, unknown>, newPrice });
    } else {
      const oldPrice = parseFloat(match.customerPrice || match.tariffAmount || "0");
      if (Math.abs(oldPrice - newPrice) > 0.009 || match.tariffAmount !== row.tariffAmount) {
        summary.updated++;
        preview.push({
          index: i + 2,
          status: "updated",
          fingerprint: fp,
          data: row as unknown as Record<string, unknown>,
          existingId: match.id,
          oldPrice,
          newPrice,
        });
      } else {
        summary.unchanged++;
        preview.push({
          index: i + 2,
          status: "unchanged",
          fingerprint: fp,
          data: row as unknown as Record<string, unknown>,
          existingId: match.id,
          oldPrice,
          newPrice,
        });
      }
      existingByFp.delete(fp);
    }
  }

  for (const [, row] of Array.from(existingByFp.entries())) {
    summary.deleted++;
    preview.push({
      index: 0,
      status: "deleted",
      fingerprint: tariffRowFingerprint({
        courierPartnerId: row.courierPartnerId,
        serviceType: row.serviceType,
        shipmentType: row.shipmentType,
        originCountry: row.originCountry,
        destinationCountry: row.destinationCountry,
        weightMin: row.weightMin,
        weightMax: row.weightMax,
        originPincode: row.originPincode,
        destinationPincode: row.destinationPincode,
        originZone: row.originZone,
        destinationZone: row.destinationZone,
      }),
      data: row as unknown as Record<string, unknown>,
      existingId: row.id,
      oldPrice: parseFloat(row.customerPrice || row.tariffAmount || "0"),
    });
  }

  return { rows: preview, summary };
}

export function rowsToCsv(rows: Array<TariffRateRow & { partnerCode?: string; partnerName?: string }>): string {
  const headers = [
    "partner_code", "service_type", "shipment_type", "origin_country", "destination_country",
    "origin_pincode", "destination_pincode", "origin_zone", "destination_zone",
    "weight_min", "weight_max", "tariff_amount", "fixed_margin", "percentage_margin",
    "affiliate_margin", "offer_discount", "fuel_charge", "handling_charge",
    "insurance_charge", "remote_area_charge", "gst", "customer_price", "transit_days", "active", "notes",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      r.partnerCode || "",
      r.serviceType,
      r.shipmentType || "",
      r.originCountry || "",
      r.destinationCountry || "",
      r.originPincode || "",
      r.destinationPincode || "",
      r.originZone || "",
      r.destinationZone || "",
      r.weightMin,
      r.weightMax,
      r.tariffAmount,
      r.fixedMargin || "0",
      r.percentageMargin || "0",
      r.affiliateMargin || "0",
      r.offerDiscount || "0",
      r.fuelCharge || "0",
      r.handlingCharge || "0",
      r.insuranceCharge || "0",
      r.remoteAreaCharge || "0",
      r.gst || "0",
      r.customerPrice || "0",
      r.transitDays ?? "",
      r.isActive === false ? "false" : "true",
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ].join(","));
  }
  return lines.join("\n");
}
