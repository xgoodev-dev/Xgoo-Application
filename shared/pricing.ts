import type { CourierPartner, TariffRateRow } from "./schema";
import { calculateCustomerPrice } from "./tariff-pricing";

export type WeightRoundOffMode = "off" | "ceil_kg";

export type PricingQuoteInput = {
  courierPartnerId: string;
  serviceType: "air" | "surface";
  shipmentType?: string | null;
  packageType?: string | null;
  originCountry?: string | null;
  destinationCountry?: string | null;
  senderPincode?: string | null;
  receiverPincode?: string | null;
  insurance?: boolean;
  declaredValue?: number | null;
  /** When ceil_kg: 1.2 → 2 before matching Wt Max slabs */
  weightRoundOff?: WeightRoundOffMode | boolean;
  weight: number;
  length?: number | null;
  width?: number | null;
  height?: number | null;
};

export type PricingQuoteResult = {
  courierPartnerId: string;
  serviceType: string;
  chargeableWeight: number;
  /** Weight used for slab matching after optional round-off */
  billedWeight: number;
  actualWeight: number;
  volumetricWeight: number;
  tariffAmount: number;
  marginAmount: number;
  marginPercent: number;
  marginTotal: number;
  sellPrice: number;
  transitDays?: number | null;
  source: "tariff" | "legacy";
  matchedRowId?: string;
  message?: string;
  weightRoundOffApplied?: boolean;
};

function isPerKgRow(row: Pick<TariffRateRow, "notes">): boolean {
  return /(?:^|[;\s])rate_type=per_kg(?:$|[;\s])/i.test(row.notes || "");
}

/** Round chargeable weight up to the next whole kg (1.2 → 2). Exact integers stay as-is. */
export function roundWeightUpToKg(weight: number): number {
  if (!Number.isFinite(weight) || weight <= 0) return 0;
  const rounded = Math.ceil(weight * 1000) / 1000;
  if (Number.isInteger(rounded) || Math.abs(rounded - Math.round(rounded)) < 0.0001) {
    return Math.round(rounded);
  }
  return Math.ceil(rounded);
}

export function resolveBilledWeight(
  chargeable: number,
  weightRoundOff?: WeightRoundOffMode | boolean,
): { billedWeight: number; rounded: boolean } {
  const disabled = weightRoundOff === false || weightRoundOff === "off";
  if (disabled) {
    return { billedWeight: Math.round(chargeable * 1000) / 1000, rounded: false };
  }
  // Default ON when unset — round 1.2 → 2 before matching Weight (kg) slabs.
  const billedWeight = roundWeightUpToKg(chargeable);
  return {
    billedWeight,
    rounded: Math.abs(billedWeight - chargeable) > 0.0001,
  };
}

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
): { chargeable: number; volumetric: number; actual: number } {
  const l = length || 0;
  const w = width || 0;
  const h = height || 0;
  const volumetric = l > 0 && w > 0 && h > 0 ? (l * w * h) / 5000 : 0;
  const chargeable = Math.max(actualKg, volumetric);
  return { chargeable, volumetric, actual: actualKg };
}

export function applyMargin(tariffAmount: number, partner: Pick<CourierPartner, "marginAmount" | "marginPercent">, row?: Pick<TariffRateRow, "fixedMargin" | "percentageMargin" | "affiliateMargin" | "offerDiscount" | "fuelCharge" | "handlingCharge" | "insuranceCharge" | "remoteAreaCharge" | "gst" | "customerPrice">): {
  marginAmount: number;
  marginPercent: number;
  marginTotal: number;
  sellPrice: number;
} {
  if (row) {
    const sellPrice = calculateCustomerPrice({
      tariffAmount,
      fixedMargin: row.fixedMargin,
      percentageMargin: row.percentageMargin,
      affiliateMargin: row.affiliateMargin,
      offerDiscount: row.offerDiscount,
      fuelCharge: row.fuelCharge,
      handlingCharge: row.handlingCharge,
      insuranceCharge: row.insuranceCharge,
      remoteAreaCharge: row.remoteAreaCharge,
      gst: row.gst,
    });
    const fixed = parseFloat(row.fixedMargin || "0") || parseFloat(partner.marginAmount || "0") || 0;
    const pct = parseFloat(row.percentageMargin || "0") || parseFloat(partner.marginPercent || "0") || 0;
    const percentPart = Math.round((tariffAmount * pct) / 100 * 100) / 100;
    const marginTotal = Math.round((fixed + percentPart) * 100) / 100;
    return { marginAmount: fixed, marginPercent: pct, marginTotal, sellPrice };
  }

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
  const weightInfo = chargeableWeight(
    input.weight,
    input.length,
    input.width,
    input.height,
  );
  const { billedWeight } = resolveBilledWeight(weightInfo.chargeable, input.weightRoundOff);
  const weight = billedWeight;

  let best: { row: TariffRateRow; score: number } | undefined;

  for (const row of rows) {
    if (row.serviceType !== input.serviceType) continue;

    const rowOriginCountry = (row.originCountry || "").trim().toUpperCase();
    const rowDestinationCountry = (row.destinationCountry || "").trim().toUpperCase();
    const inputOriginCountry = (input.originCountry || "").trim().toUpperCase();
    const inputDestinationCountry = (input.destinationCountry || "").trim().toUpperCase();
    if (
      rowOriginCountry &&
      inputOriginCountry &&
      rowOriginCountry !== "*" &&
      rowOriginCountry !== inputOriginCountry
    ) {
      continue;
    }
    if (
      rowDestinationCountry &&
      inputDestinationCountry &&
      rowDestinationCountry !== "*" &&
      rowDestinationCountry !== inputDestinationCountry
    ) {
      continue;
    }

    const rowShipmentType = (row.shipmentType || "").trim().toLowerCase();
    const packageType = (input.packageType || "").trim().toLowerCase();
    const shipmentType = (input.shipmentType || "").trim().toLowerCase();
    if (
      ["document", "package"].includes(rowShipmentType) &&
      packageType &&
      rowShipmentType !== packageType
    ) {
      continue;
    }
    if (
      ["domestic", "international"].includes(rowShipmentType) &&
      shipmentType &&
      rowShipmentType !== shipmentType
    ) {
      continue;
    }

    const wMin = parseFloat(row.weightMin || "0");
    const wMax = parseFloat(row.weightMax || "999");
    const perKg = isPerKgRow(row);

    // Per-kg bands use inclusive min/max ranges.
    // Fixed slabs use Wt Max only: match the smallest slab that covers the billed weight.
    if (perKg) {
      if (weight < wMin || weight > wMax) continue;
    } else if (weight > wMax) {
      continue;
    }

    const locScore = rowMatchesLocation(row, input.senderPincode, input.receiverPincode);
    if (locScore < 0) continue;

    // Prefer closest covering Wt Max (next higher slab), then tighter location match.
    const slabCloseness = perKg ? 0 : Math.max(0, 1000 - (wMax - weight) * 100);
    const totalScore = locScore + slabCloseness + (perKg ? 5 : 0);
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
  const weightInfo = chargeableWeight(input.weight, input.length, input.width, input.height);
  const { billedWeight, rounded } = resolveBilledWeight(
    weightInfo.chargeable,
    input.weightRoundOff,
  );
  const useTariff = partner.useTariffPricing !== false;

  if (useTariff && rows.length > 0) {
    const activeRows = rows.filter((r) => r.isActive !== false);
    const matched = findBestTariffRow(activeRows, { ...input, weight: weightInfo.chargeable });
    if (matched) {
      const baseTariffAmount = parseFloat(matched.tariffAmount || "0");
      const isPerKg = isPerKgRow(matched);
      const tariffAmount = Math.round(
        (isPerKg ? baseTariffAmount * billedWeight : baseTariffAmount) * 100,
      ) / 100;
      const margin = applyMargin(
        tariffAmount,
        partner,
        {
          ...matched,
          customerPrice: null,
          insuranceCharge: input.insurance ? matched.insuranceCharge : "0",
        },
      );
      return {
        courierPartnerId: input.courierPartnerId,
        serviceType: input.serviceType,
        chargeableWeight: weightInfo.chargeable,
        billedWeight,
        actualWeight: weightInfo.actual,
        volumetricWeight: weightInfo.volumetric,
        tariffAmount,
        ...margin,
        transitDays: matched.transitDays,
        source: "tariff",
        matchedRowId: matched.id,
        weightRoundOffApplied: rounded,
        message: rounded
          ? `Weight rounded up from ${weightInfo.chargeable.toFixed(2)} kg to ${billedWeight} kg`
          : undefined,
      };
    }
  }

  const tariffAmount = legacyTariffAmount(partner, input.serviceType, billedWeight);
  const margin = applyMargin(tariffAmount, partner);
  return {
    courierPartnerId: input.courierPartnerId,
    serviceType: input.serviceType,
    chargeableWeight: weightInfo.chargeable,
    billedWeight,
    actualWeight: weightInfo.actual,
    volumetricWeight: weightInfo.volumetric,
    tariffAmount,
    ...margin,
    source: "legacy",
    weightRoundOffApplied: rounded,
    message:
      useTariff && rows.length > 0
        ? "No matching tariff row; used fallback rate card"
        : rounded
          ? `Weight rounded up from ${weightInfo.chargeable.toFixed(2)} kg to ${billedWeight} kg`
          : undefined,
  };
}

export const TARIFF_CSV_TEMPLATE = `partner_code,service_type,shipment_type,origin_country,destination_country,origin_pincode,destination_pincode,origin_zone,destination_zone,weight_min,weight_max,tariff_amount,fixed_margin,percentage_margin,affiliate_margin,offer_discount,fuel_charge,handling_charge,insurance_charge,remote_area_charge,gst,transit_days,active,notes
FEDEX,surface,domestic,IN,IN,110001,400001,,,0,0.5,120,10,5,0,0,5,0,0,0,18,3,true,
FEDEX,surface,domestic,IN,IN,110001,400001,,,0.5,1,150,10,5,0,0,5,0,0,0,18,3,true,
FEDEX,air,domestic,IN,IN,110001,400001,,,0,0.5,250,15,8,0,0,10,0,0,0,18,2,true,
ICL,surface,domestic,IN,IN,,,110,400,0,1,90,5,3,0,0,0,0,0,0,0,4,true,
UPS,surface,international,IN,US,*,*,,,0,5,200,20,10,0,0,15,25,0,0,0,7,true,`;
