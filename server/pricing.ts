import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import type { CourierPartner, InsertTariffRateRow } from "@shared/schema";

export type ParsedTariffRow = {
  partnerCode: string;
  serviceType: "air" | "surface";
  originPincode?: string;
  destinationPincode?: string;
  originZone?: string;
  destinationZone?: string;
  weightMin: number;
  weightMax: number;
  tariffAmount: number;
};

const HEADER_ALIASES: Record<string, string[]> = {
  partnerCode: ["partner_code", "partner", "courier", "courier_code", "code"],
  serviceType: ["service_type", "service", "mode"],
  originPincode: ["origin_pincode", "from_pincode", "origin", "from", "sender_pincode"],
  destinationPincode: ["destination_pincode", "to_pincode", "destination", "to", "receiver_pincode", "dest_pincode"],
  originZone: ["origin_zone", "from_zone", "zone_from"],
  destinationZone: ["destination_zone", "to_zone", "zone_to", "dest_zone"],
  weightMin: ["weight_min", "min_weight", "from_weight"],
  weightMax: ["weight_max", "max_weight", "to_weight"],
  weightKg: ["weight_kg", "weight", "slab"],
  tariffAmount: ["tariff_amount", "rate", "amount", "price", "tariff", "freight"],
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

export function parseTariffSheetRows(
  filePath: string,
  defaultPartnerCode?: string,
): ParsedTariffRow[] {
  const ext = path.extname(filePath).toLowerCase();
  let sheetRows: unknown[][];

  if (ext === ".csv") {
    const text = fs.readFileSync(filePath, "utf-8");
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
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    sheetRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
  }

  if (sheetRows.length < 2) return [];

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
      originPincode: cellStr(row, col.originPincode) || undefined,
      destinationPincode: cellStr(row, col.destinationPincode) || undefined,
      originZone: cellStr(row, col.originZone) || undefined,
      destinationZone: cellStr(row, col.destinationZone) || undefined,
      weightMin: wMin,
      weightMax: wMax,
      tariffAmount: amount,
    });
  }

  return results;
}

export function resolvePartnerId(
  code: string,
  partners: CourierPartner[],
): string | undefined {
  const upper = code.toUpperCase();
  const match = partners.find(
    (p) => p.code.toUpperCase() === upper || p.name.toUpperCase().includes(upper),
  );
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
    rows.push({
      tariffVersionId,
      officeId,
      courierPartnerId: partnerId,
      serviceType: p.serviceType,
      originPincode: p.originPincode || null,
      destinationPincode: p.destinationPincode || null,
      originZone: p.originZone || null,
      destinationZone: p.destinationZone || null,
      weightMin: String(p.weightMin),
      weightMax: String(p.weightMax),
      tariffAmount: String(p.tariffAmount),
    });
  }

  return { rows, errors };
}
