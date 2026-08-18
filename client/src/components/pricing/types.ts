import type { TariffRateRow } from "@shared/schema";
import { calculateCustomerPrice, formatWeightSlab } from "@shared/tariff-pricing";

export type EnrichedTariffRow = TariffRateRow & {
  partnerName?: string;
  partnerCode?: string;
};

export type TariffGridRow = EnrichedTariffRow & {
  weight: string;
  courierPartner: string;
  service: string;
  customerPriceCalc: number;
};

export function toGridRow(row: EnrichedTariffRow): TariffGridRow {
  const customerPriceCalc = calculateCustomerPrice({
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
  return {
    ...row,
    weight: formatWeightSlab(row),
    courierPartner: row.partnerName || row.partnerCode || row.courierPartnerId,
    service: row.serviceType,
    customerPriceCalc,
    customerPrice: String(customerPriceCalc),
  };
}

export function gridRowToPatch(row: TariffGridRow): Record<string, unknown> {
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
  return {
    id: row.id,
    courierPartnerId: row.courierPartnerId,
    serviceType: row.serviceType,
    shipmentType: row.shipmentType,
    originCountry: row.originCountry,
    destinationCountry: row.destinationCountry,
    originPincode: row.originPincode,
    destinationPincode: row.destinationPincode,
    originZone: row.originZone,
    destinationZone: row.destinationZone,
    weightMin: "0",
    weightMax: row.weightMax,
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
    customerPrice: String(customerPrice),
    transitDays: row.transitDays,
    isActive: row.isActive,
    notes: row.notes,
  };
}

export const DEFAULT_COLUMN_FIELDS = [
  "weightMax",
  "shipmentType",
  "originCountry",
  "destinationCountry",
  "courierPartner",
  "service",
  "tariffAmount",
  "fixedMargin",
  "percentageMargin",
  "affiliateMargin",
  "offerDiscount",
  "fuelCharge",
  "handlingCharge",
  "insuranceCharge",
  "remoteAreaCharge",
  "gst",
  "customerPriceCalc",
  "transitDays",
  "isActive",
  "notes",
] as const;

export type ImportPreviewItem = {
  index: number;
  status: "new" | "updated" | "deleted" | "duplicate" | "unchanged";
  fingerprint: string;
  oldPrice?: number;
  newPrice?: number;
};

export type VersionCompareRow = {
  weight: string;
  oldPrice: number;
  newPrice: number;
  diff: number;
  pctDiff: number;
};
