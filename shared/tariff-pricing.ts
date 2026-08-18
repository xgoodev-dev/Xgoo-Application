import type { TariffRateRow } from "./schema";

export type TariffRowPricingInput = {
  tariffAmount?: string | number | null;
  fixedMargin?: string | number | null;
  percentageMargin?: string | number | null;
  affiliateMargin?: string | number | null;
  offerDiscount?: string | number | null;
  fuelCharge?: string | number | null;
  handlingCharge?: string | number | null;
  insuranceCharge?: string | number | null;
  remoteAreaCharge?: string | number | null;
  gst?: string | number | null;
};

function num(v: string | number | null | undefined): number {
  if (v == null || v === "") return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

export type TariffPricingBreakdown = {
  partnerRate: number;
  fixedMargin: number;
  percentageMargin: number;
  percentageMarginAmount: number;
  affiliateMargin: number;
  additionalCharges: number;
  offerDiscount: number;
  subtotalBeforeTax: number;
  gstPercent: number;
  gstAmount: number;
  customerPrice: number;
};

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Customer price calculation:
 * subtotal = partner rate + fixed margin + percentage margin + affiliate margin
 *            + operational charges - offer discount
 * customer price = subtotal + GST percentage on subtotal
 */
export function calculatePricingBreakdown(
  input: TariffRowPricingInput,
): TariffPricingBreakdown {
  const partnerRate = num(input.tariffAmount);
  const fixed = num(input.fixedMargin);
  const pct = num(input.percentageMargin);
  const percentPart = money((partnerRate * pct) / 100);
  const affiliateMargin = num(input.affiliateMargin);
  const additionalCharges =
    num(input.fuelCharge) +
    num(input.handlingCharge) +
    num(input.insuranceCharge) +
    num(input.remoteAreaCharge);
  const offerDiscount = num(input.offerDiscount);
  const subtotalBeforeTax = Math.max(
    0,
    partnerRate +
      fixed +
      percentPart +
      affiliateMargin +
      additionalCharges -
      offerDiscount,
  );
  const gstPercent = Math.max(0, num(input.gst));
  const gstAmount = money((subtotalBeforeTax * gstPercent) / 100);
  const customerPrice = money(subtotalBeforeTax + gstAmount);

  return {
    partnerRate: money(partnerRate),
    fixedMargin: money(fixed),
    percentageMargin: pct,
    percentageMarginAmount: percentPart,
    affiliateMargin: money(affiliateMargin),
    additionalCharges: money(additionalCharges),
    offerDiscount: money(offerDiscount),
    subtotalBeforeTax: money(subtotalBeforeTax),
    gstPercent,
    gstAmount,
    customerPrice,
  };
}

export function calculateCustomerPrice(input: TariffRowPricingInput): number {
  return calculatePricingBreakdown(input).customerPrice;
}

export function formatWeightSlab(row: Pick<TariffRateRow, "weightMin" | "weightMax">): string {
  const max = num(row.weightMax);
  return Number.isFinite(max) ? String(max) : "0";
}

export function rowToGridPricing(row: TariffRateRow) {
  const customerPrice = calculateCustomerPrice({
    tariffAmount: row.tariffAmount,
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
  return { customerPrice };
}

export type TariffRowKey = {
  courierPartnerId: string;
  serviceType: string;
  shipmentType?: string | null;
  originCountry?: string | null;
  destinationCountry?: string | null;
  weightMin: string;
  weightMax: string;
  originPincode?: string | null;
  destinationPincode?: string | null;
  originZone?: string | null;
  destinationZone?: string | null;
};

export function tariffRowFingerprint(row: TariffRowKey): string {
  return [
    row.courierPartnerId,
    row.serviceType,
    row.shipmentType || "",
    row.originCountry || "",
    row.destinationCountry || "",
    row.weightMin,
    row.weightMax,
    row.originPincode || "",
    row.destinationPincode || "",
    row.originZone || "",
    row.destinationZone || "",
  ].join("|");
}
