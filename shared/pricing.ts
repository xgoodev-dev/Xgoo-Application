import type { CourierPartner, TariffRateRow } from "./schema";

export type PricingQuoteInput = {
  courierPartnerId: string;
  serviceType: "air" | "surface";
  senderPincode?: string | null;
  receiverPincode?: string | null;
  weight: number;
  length?: number | null;
  width?: number | null;
  height?: number | null;
};

export type PricingQuoteResult = {
  courierPartnerId: string;
  serviceType: string;
  chargeableWeight: number;
  tariffAmount: number;
  marginAmount: number;
  marginPercent: number;
  marginTotal: number;
  sellPrice: number;
  source: "tariff" | "legacy";
  matchedRowId?: string;
  message?: string;
};

export function pincodeToZone(pincode?: string | null): string | null {
  const p = (pincode || "").replace(/\D/g, "");
  if (p.length >= 3) return p.slice(0, 3);
  return null;
}

export function chargeableWeight(
  actualKg: number,
  length?: number | null,
  width?: number | null,
  height?: number | null,
): number {
  const l = length || 0;
  const w = width || 0;
  const h = height || 0;
  const volumetric = l > 0 && w > 0 && h > 0 ? (l * w * h) / 5000 : 0;
  return Math.max(actualKg, volumetric);
}

export function applyMargin(tariffAmount: number, partner: Pick<CourierPartner, "marginAmount" | "marginPercent">): {
  marginAmount: number;
  marginPercent: number;
  marginTotal: number;
  sellPrice: number;
} {
  const fixed = parseFloat(partner.marginAmount || "0") || 0;
  const pct = parseFloat(partner.marginPercent || "0") || 0;
  const percentPart = Math.round((tariffAmount * pct) / 100 * 100) / 100;
  const marginTotal = Math.round((fixed + percentPart) * 100) / 100;
  const sellPrice = Math.round((tariffAmount + marginTotal) * 100) / 100;
  return { marginAmount: fixed, marginPercent: pct, marginTotal, sellPrice };
}

export function legacyTariffAmount(
  partner: CourierPartner,
  serviceType: "air" | "surface",
  weight: number,
): number {
  const baseRate =
    serviceType === "air"
      ? parseFloat(partner.baseRateAir || "0")
      : parseFloat(partner.baseRateSurface || "0");
  const ratePerKg =
    serviceType === "air"
      ? parseFloat(partner.ratePerKgAir || "0")
      : parseFloat(partner.ratePerKgSurface || "0");
  return Math.round((baseRate + weight * ratePerKg) * 100) / 100;
}

function rowMatchesLocation(
  row: TariffRateRow,
  senderPincode?: string | null,
  receiverPincode?: string | null,
): number {
  const fromPin = (senderPincode || "").replace(/\D/g, "");
  const toPin = (receiverPincode || "").replace(/\D/g, "");
  const fromZone = pincodeToZone(fromPin);
  const toZone = pincodeToZone(toPin);

  const rowFromPin = (row.originPincode || "").replace(/\D/g, "");
  const rowToPin = (row.destinationPincode || "").replace(/\D/g, "");
  const rowFromZone = (row.originZone || "").toUpperCase();
  const rowToZone = (row.destinationZone || "").toUpperCase();

  let score = 0;

  if (rowFromPin && rowToPin) {
    if (rowFromPin === fromPin && rowToPin === toPin) score += 100;
    else if (rowFromPin === fromPin && (rowToPin === "*" || !rowToPin)) score += 80;
    else if ((rowFromPin === "*" || !rowFromPin) && rowToPin === toPin) score += 80;
    else return -1;
  } else if (rowFromZone && rowToZone) {
    const fz = rowFromZone === "*" ? fromZone : rowFromZone;
    const tz = rowToZone === "*" ? toZone : rowToZone;
    if (fz && fromZone && fz === fromZone && tz && toZone && tz === toZone) score += 60;
    else if (fz && fromZone && fz === fromZone && rowToZone === "*") score += 50;
    else if (rowFromZone === "*" && tz && toZone && tz === toZone) score += 50;
    else if (rowFromZone === "*" && rowToZone === "*") score += 40;
    else return -1;
  } else if (!rowFromPin && !rowToPin && !rowFromZone && !rowToZone) {
    score += 10;
  } else {
    return -1;
  }

  return score;
}

export function findBestTariffRow(
  rows: TariffRateRow[],
  input: PricingQuoteInput,
): TariffRateRow | undefined {
  const weight = chargeableWeight(
    input.weight,
    input.length,
    input.width,
    input.height,
  );

  let best: { row: TariffRateRow; score: number } | undefined;

  for (const row of rows) {
    if (row.serviceType !== input.serviceType) continue;

    const wMin = parseFloat(row.weightMin || "0");
    const wMax = parseFloat(row.weightMax || "999");
    if (weight < wMin || weight > wMax) continue;

    const locScore = rowMatchesLocation(row, input.senderPincode, input.receiverPincode);
    if (locScore < 0) continue;

    const totalScore = locScore + (wMax - wMin < 0.5 ? 5 : 0);
    if (!best || totalScore > best.score) {
      best = { row, score: totalScore };
    }
  }

  return best?.row;
}

export function buildQuote(
  partner: CourierPartner,
  rows: TariffRateRow[],
  input: PricingQuoteInput,
): PricingQuoteResult {
  const cw = chargeableWeight(input.weight, input.length, input.width, input.height);
  const useTariff = partner.useTariffPricing !== false;

  if (useTariff && rows.length > 0) {
    const matched = findBestTariffRow(rows, { ...input, weight: cw });
    if (matched) {
      const tariffAmount = parseFloat(matched.tariffAmount || "0");
      const margin = applyMargin(tariffAmount, partner);
      return {
        courierPartnerId: input.courierPartnerId,
        serviceType: input.serviceType,
        chargeableWeight: cw,
        tariffAmount,
        ...margin,
        source: "tariff",
        matchedRowId: matched.id,
      };
    }
  }

  const tariffAmount = legacyTariffAmount(partner, input.serviceType, cw);
  const margin = applyMargin(tariffAmount, partner);
  return {
    courierPartnerId: input.courierPartnerId,
    serviceType: input.serviceType,
    chargeableWeight: cw,
    tariffAmount,
    ...margin,
    source: "legacy",
    message: useTariff && rows.length > 0 ? "No matching tariff row; used fallback rate card" : undefined,
  };
}

export const TARIFF_CSV_TEMPLATE = `partner_code,service_type,origin_pincode,destination_pincode,origin_zone,destination_zone,weight_min,weight_max,tariff_amount
FEDEX,surface,110001,400001,,,0,0.5,120
FEDEX,surface,110001,400001,,,0.5,1,150
FEDEX,air,110001,400001,,,0,0.5,250
ICL,surface,,,110,400,0,1,90
UPS,surface,*,*,,,0,5,200`;
