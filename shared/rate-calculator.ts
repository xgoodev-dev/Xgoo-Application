import { z } from "zod";

export const RATE_CALCULATOR_COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "US", name: "USA" },
  { code: "GB", name: "United Kingdom" },
  { code: "AE", name: "UAE" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "SG", name: "Singapore" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "MY", name: "Malaysia" },
  { code: "HK", name: "Hong Kong" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "OM", name: "Oman" },
] as const;

export type RateCalculatorCountryCode = (typeof RATE_CALCULATOR_COUNTRIES)[number]["code"];

export const rateCalculatorRequestSchema = z.object({
  shipmentType: z.enum(["domestic", "international"]).default("domestic"),
  packageType: z.enum(["document", "package"]).default("package"),
  senderPincode: z.string().trim().min(4).max(10),
  receiverPincode: z.string().trim().max(12).optional().nullable(),
  originCountry: z.string().trim().max(4).optional().nullable(),
  destinationCountry: z.string().trim().max(4).optional().nullable(),
  weight: z.coerce.number().positive(),
  weightUnit: z.enum(["kg", "gm"]).default("kg"),
  length: z.coerce.number().positive().optional().nullable(),
  width: z.coerce.number().positive().optional().nullable(),
  height: z.coerce.number().positive().optional().nullable(),
  codAmount: z.coerce.number().min(0).optional().nullable(),
  insurance: z.boolean().optional(),
});

export type RateCalculatorRequest = z.infer<typeof rateCalculatorRequestSchema>;

export type RateCalculatorLocation = {
  pincode: string | null;
  city: string | null;
  state: string | null;
  country: string;
  displayName: string;
};

export type RateCalculatorQuoteCard = {
  courierPartnerId: string;
  partnerName: string;
  partnerCode: string;
  serviceType: "air" | "surface";
  shipmentType: "domestic" | "international";
  sellPrice: number;
  tariffAmount: number;
  transitDays: number | null;
  chargeableWeight: number;
  billedWeight: number;
  actualWeight: number;
  volumetricWeight: number;
  source: "tariff" | "legacy" | "api";
  serviceable: boolean;
  estimated: boolean;
  popular: boolean;
  message?: string;
};

export type RateCalculatorResponse = {
  shipmentType: "domestic" | "international";
  pickup: RateCalculatorLocation;
  destination: RateCalculatorLocation;
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  billedWeight: number;
  quotes: RateCalculatorQuoteCard[];
  serviceableCount: number;
};

export function rateCalculatorCountryName(code: string | null | undefined): string {
  const normalized = (code || "").trim().toUpperCase();
  const match = RATE_CALCULATOR_COUNTRIES.find((country) => country.code === normalized);
  return match?.name || normalized || "—";
}

export function isIndianPincode(value: string | null | undefined): boolean {
  return /^\d{6}$/.test((value || "").replace(/\D/g, "").slice(0, 6)) && (value || "").replace(/\D/g, "").length === 6;
}
