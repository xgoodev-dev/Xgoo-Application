import { z } from "zod";
import { chargeableWeight } from "./pricing";

export const HUB_SHIPMENT_SCOPES = ["domestic", "international"] as const;
export type HubShipmentScope = (typeof HUB_SHIPMENT_SCOPES)[number];

export const HUB_ORDER_PAYMENT_TYPES = ["prepaid", "cod"] as const;
export type HubOrderPaymentType = (typeof HUB_ORDER_PAYMENT_TYPES)[number];

export const HUB_CUSTOMS_DOCUMENT_TYPES = ["csb4", "csb5"] as const;
export type HubCustomsDocumentType = (typeof HUB_CUSTOMS_DOCUMENT_TYPES)[number];

export const HUB_INCO_TERMS = [
  "EXW",
  "FCA",
  "FAS",
  "FOB",
  "CFR",
  "CIF",
  "CPT",
  "CIP",
  "DAP",
  "DPU",
  "DDP",
] as const;
export type HubIncoTerm = (typeof HUB_INCO_TERMS)[number];

export const HUB_SHIPMENT_PURPOSES = [
  "Gift",
  "Sample",
  "Documents",
  "Commercial",
  "Personal effects",
  "Return / repair",
] as const;

export const HUB_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "AUD", "CAD", "SGD"] as const;

export const HUB_DESTINATION_COUNTRIES = [
  "India",
  "USA",
  "United Kingdom",
  "Canada",
  "Australia",
  "UAE",
  "Germany",
  "France",
  "Singapore",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Oman",
  "New Zealand",
  "Italy",
  "Netherlands",
  "Ireland",
  "Malaysia",
  "Japan",
  "South Africa",
  "Hong Kong",
  "China",
  "Bangladesh",
  "Nepal",
  "Sri Lanka",
  "Other",
] as const;

export function emptyHubProduct() {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    sku: "",
    hsn: "",
    units: "1",
    unitPrice: "",
    discount: "",
    taxPercent: "",
    weight: "",
  };
}

export const hubProductLineSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional().default(""),
  sku: z.string().optional().default(""),
  hsn: z.string().optional().default(""),
  units: z.string().optional().default("1"),
  unitPrice: z.string().optional().default(""),
  discount: z.string().optional().default(""),
  taxPercent: z.string().optional().default(""),
  weight: z.string().optional().default(""),
});

export type HubProductLine = z.infer<typeof hubProductLineSchema>;

export function parseNum(value?: string | number | null): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = parseFloat(String(value || "").trim());
  return Number.isFinite(n) ? n : 0;
}

export function productLineValue(product: HubProductLine): number {
  const units = Math.max(1, parseNum(product.units) || 1);
  const price = parseNum(product.unitPrice);
  const discount = parseNum(product.discount);
  return Math.max(0, units * price - discount);
}

export function filledProducts(products: HubProductLine[] | null | undefined): HubProductLine[] {
  return (products || []).filter((product) => (product.name || "").trim().length > 0);
}

export function productsDeclaredValue(products: HubProductLine[] | null | undefined): number {
  return filledProducts(products).reduce((sum, product) => sum + productLineValue(product), 0);
}

export function productsDescription(products: HubProductLine[] | null | undefined): string {
  return filledProducts(products)
    .map((product) => {
      const qty = Math.max(1, parseNum(product.units) || 1);
      return qty > 1 ? `${product.name.trim()} ×${qty}` : product.name.trim();
    })
    .filter(Boolean)
    .join(", ");
}

export function packageWeightSummary(input: {
  actualKg: number;
  length?: number | null;
  width?: number | null;
  height?: number | null;
}) {
  const weights = chargeableWeight(input.actualKg, input.length, input.width, input.height);
  return {
    deadWeight: weights.actual,
    volumetricWeight: weights.volumetric,
    applicableWeight: weights.chargeable,
  };
}

export function customsDocumentLabel(type: HubCustomsDocumentType): string {
  switch (type) {
    case "csb4":
      return "CSB-IV (Commercial)";
    case "csb5":
      return "CSB-V (Gift / Sample / Documents)";
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

export function orderPaymentLabel(type: HubOrderPaymentType): string {
  switch (type) {
    case "prepaid":
      return "Prepaid";
    case "cod":
      return "COD";
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

export function shipmentScopeLabel(scope: HubShipmentScope): string {
  switch (scope) {
    case "domestic":
      return "Domestic";
    case "international":
      return "International";
    default: {
      const exhaustive: never = scope;
      return exhaustive;
    }
  }
}

export function postalCodeLabel(scope: HubShipmentScope): string {
  switch (scope) {
    case "domestic":
      return "Pincode";
    case "international":
      return "Postal code";
    default: {
      const exhaustive: never = scope;
      return exhaustive;
    }
  }
}
