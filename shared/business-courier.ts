import { z } from "zod";

export const BUSINESS_STORE_TYPES = [
  { id: "cloth_store", label: "Cloth store" },
  { id: "gift_shop", label: "Gift shop" },
  { id: "social_media_store", label: "Social media store" },
  { id: "it_office", label: "IT / office" },
  { id: "pharmacy", label: "Pharmacy" },
  { id: "restaurant", label: "Restaurant" },
  { id: "other", label: "Other" },
] as const;

export type BusinessStoreTypeId = (typeof BUSINESS_STORE_TYPES)[number]["id"];

export const BUSINESS_WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type BusinessWeekdayKey = (typeof BUSINESS_WEEKDAY_KEYS)[number];

export type BusinessWeekdays = Record<BusinessWeekdayKey, boolean>;

export const DEFAULT_BUSINESS_WEEKDAYS: BusinessWeekdays = {
  sun: false,
  mon: true,
  tue: true,
  wed: true,
  thu: true,
  fri: true,
  sat: true,
};

export const businessWeekdaysSchema = z.object({
  sun: z.boolean(),
  mon: z.boolean(),
  tue: z.boolean(),
  wed: z.boolean(),
  thu: z.boolean(),
  fri: z.boolean(),
  sat: z.boolean(),
});

export const businessStoreTypeSchema = z.enum([
  "cloth_store",
  "gift_shop",
  "social_media_store",
  "it_office",
  "pharmacy",
  "restaurant",
  "other",
]);

export const BUSINESS_ORDER_CHANNELS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "call", label: "Call" },
  { id: "instagram", label: "Instagram / DM" },
  { id: "other", label: "Other" },
] as const;

export type BusinessOrderChannelId = (typeof BUSINESS_ORDER_CHANNELS)[number]["id"];

export const businessOrderChannelSchema = z.enum(["whatsapp", "call", "instagram", "other"]);

export const BUSINESS_PICKUP_STYLES = [
  { id: "standing", label: "Daily standing pickup" },
  { id: "on_demand", label: "Pickup only when I have orders" },
] as const;

export const businessPickupStyleSchema = z.enum(["standing", "on_demand"]);

export const BUSINESS_SHIPMENT_SCOPES = [
  { id: "domestic", label: "Domestic" },
  { id: "international", label: "International" },
] as const;

export type BusinessShipmentScope = (typeof BUSINESS_SHIPMENT_SCOPES)[number]["id"];

export const businessShipmentScopeSchema = z.enum(["domestic", "international"]);

export function shipmentScopeLabel(id: string | null | undefined): string {
  const match = BUSINESS_SHIPMENT_SCOPES.find((scope) => scope.id === id);
  return match?.label || BUSINESS_SHIPMENT_SCOPES[0].label;
}

export function joinAddressLines(line1?: string | null, line2?: string | null) {
  return [line1, line2].map((value) => value?.trim()).filter(Boolean).join(", ");
}

export const businessOrderSchema = z.object({
  channel: businessOrderChannelSchema.default("whatsapp"),
  destinationId: z.string().min(1).optional(),
  name: z.string().trim().min(1, "Customer name is required").max(255).optional(),
  phone: z.string().trim().min(10, "Valid phone required").max(20).optional(),
  address: z.string().trim().min(1, "Address is required").max(2000).optional(),
  addressLine2: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  pincode: z.string().trim().max(20).optional().nullable(),
  shipmentType: businessShipmentScopeSchema.optional(),
  destinationCountry: z.string().trim().max(100).optional().nullable(),
  contentDescription: z.string().trim().max(1000).optional(),
  weight: z.string().trim().optional(),
  numberOfPieces: z.number().int().positive().optional(),
  notes: z.string().trim().max(500).optional().nullable(),
  saveCustomer: z.boolean().optional(),
});

export const BUSINESS_VERIFICATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type BusinessVerificationStatus = (typeof BUSINESS_VERIFICATION_STATUSES)[number];

export const gstinSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase().replace(/\s+/g, ""))
  .refine((value) => /^[0-9A-Z]{15}$/.test(value), {
    message: "Enter a valid 15-character GSTIN",
  });

export const BUSINESS_BILLING_CYCLES = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
] as const;

export type BusinessBillingCycle = (typeof BUSINESS_BILLING_CYCLES)[number]["id"];

export const businessBillingCycleSchema = z.enum(["daily", "weekly", "monthly"]);

export const businessApplicationSchema = z.object({
  companyName: z.string().trim().min(1, "Business name is required").max(255),
  storeName: z.string().trim().min(1, "Store name is required").max(255),
  storeType: businessStoreTypeSchema,
  gstNumber: gstinSchema,
  pickupAddress: z.string().trim().min(1, "Store address is required").max(2000),
  pickupCity: z.string().trim().max(100).optional().nullable(),
  pickupState: z.string().trim().max(100).optional().nullable(),
  pickupPincode: z.string().trim().max(10).optional().nullable(),
});

export const businessProfilePatchSchema = z.object({
  companyName: z.string().trim().min(1).max(255).optional(),
  storeName: z.string().trim().min(1).max(255).optional(),
  storeType: businessStoreTypeSchema.optional(),
  gstNumber: z.string().trim().max(20).optional().nullable(),
  pickupAddress: z.string().trim().max(2000).optional(),
  pickupCity: z.string().trim().max(100).optional().nullable(),
  pickupState: z.string().trim().max(100).optional().nullable(),
  pickupPincode: z.string().trim().max(10).optional().nullable(),
  pickupLat: z.string().trim().optional().nullable(),
  pickupLng: z.string().trim().optional().nullable(),
  pickupTimeSlot: z.string().trim().max(40).optional().nullable(),
  pickupPhone: z.string().trim().max(20).optional().nullable(),
  pickupStyle: businessPickupStyleSchema.optional(),
  weekdays: businessWeekdaysSchema.optional(),
  billingCycle: businessBillingCycleSchema.optional(),
});

export const BUSINESS_SETTLEMENT_MODES = [
  { id: "upi", label: "UPI" },
  { id: "bank_transfer", label: "Bank transfer" },
  { id: "cash", label: "Cash" },
] as const;

export type BusinessSettlementMode = (typeof BUSINESS_SETTLEMENT_MODES)[number]["id"];

export const businessSettleBillsSchema = z.object({
  paymentMode: z.enum(["upi", "bank_transfer", "cash"]),
  reference: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export function normalizeBillingCycle(value: unknown): BusinessBillingCycle {
  const parsed = businessBillingCycleSchema.safeParse(value);
  return parsed.success ? parsed.data : "weekly";
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDayLabel(date: Date) {
  return `${date.getDate()} ${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

export function billingPeriodBounds(cycle: BusinessBillingCycle, now = new Date()) {
  const start = startOfLocalDay(now);
  let end: Date;
  let label: string;

  switch (cycle) {
    case "daily":
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      label = formatDayLabel(start);
      break;
    case "weekly": {
      const weekday = start.getDay();
      const mondayOffset = weekday === 0 ? 6 : weekday - 1;
      start.setDate(start.getDate() - mondayOffset);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      const lastDay = new Date(end);
      lastDay.setDate(lastDay.getDate() - 1);
      label = `${formatDayLabel(start)} – ${formatDayLabel(lastDay)}`;
      break;
    }
    case "monthly":
      start.setDate(1);
      end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      label = `${MONTH_LABELS[start.getMonth()]} ${start.getFullYear()}`;
      break;
    default: {
      const _never: never = cycle;
      throw new Error(`Unhandled billing cycle: ${_never}`);
    }
  }

  return {
    cycle,
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label,
  };
}

export function isDateInBillingPeriod(value: Date | string | null | undefined, cycle: BusinessBillingCycle, now = new Date()) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const period = billingPeriodBounds(cycle, now);
  const time = date.getTime();
  return time >= period.start.getTime() && time < period.end.getTime();
}

export function billingCycleLabel(id: string | null | undefined): string {
  const match = BUSINESS_BILLING_CYCLES.find((cycle) => cycle.id === id);
  return match?.label || BUSINESS_BILLING_CYCLES[1].label;
}

export function settlementModeLabel(id: string | null | undefined): string {
  const match = BUSINESS_SETTLEMENT_MODES.find((mode) => mode.id === id);
  return match?.label || "Payment";
}

export const businessReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(1000).optional().nullable(),
});

export const businessDestinationSchema = z.object({
  name: z.string().trim().min(1, "Receiver name is required").max(255),
  phone: z.string().trim().min(10, "Valid phone required").max(20),
  address: z.string().trim().min(1, "Address 1 is required").max(2000),
  addressLine2: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  pincode: z.string().trim().max(20).optional().nullable(),
  shipmentType: businessShipmentScopeSchema.optional(),
  destinationCountry: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  recurring: z.boolean().default(true),
});

export const businessDailyJobPatchSchema = z.object({
  status: z.enum(["planned", "skipped"]).optional(),
  weight: z.string().trim().optional(),
  numberOfPieces: z.number().int().positive().optional(),
  contentDescription: z.string().trim().max(1000).optional(),
});

export const businessAddTodayJobSchema = z
  .object({
    destinationId: z.string().min(1).optional(),
    newCustomer: businessDestinationSchema.omit({ recurring: true }).optional(),
    saveCustomer: z.boolean().optional(),
    weight: z.string().trim().optional(),
    numberOfPieces: z.number().int().positive().optional(),
    contentDescription: z.string().trim().max(1000).optional(),
  })
  .refine((data) => Boolean(data.destinationId || data.newCustomer), {
    message: "Choose an existing customer or enter a new customer.",
  });

export function mergeBusinessWeekdays(raw: unknown): BusinessWeekdays {
  const parsed = businessWeekdaysSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return { ...DEFAULT_BUSINESS_WEEKDAYS };
}

export function weekdayKeyFromDate(isoDate: string): BusinessWeekdayKey {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return BUSINESS_WEEKDAY_KEYS[date.getDay()];
}

export function isBusinessPickupDay(weekdays: BusinessWeekdays, isoDate: string): boolean {
  return Boolean(weekdays[weekdayKeyFromDate(isoDate)]);
}

export function isBusinessApplicationComplete(profile: {
  companyName?: string | null;
  storeName?: string | null;
  storeType?: string | null;
  gstNumber?: string | null;
  pickupAddress?: string | null;
}): boolean {
  return Boolean(
    profile.companyName?.trim() &&
      profile.storeName?.trim() &&
      profile.storeType?.trim() &&
      profile.gstNumber?.trim() &&
      profile.pickupAddress?.trim(),
  );
}

export function isBusinessVerified(profile: { verificationStatus?: string | null }): boolean {
  return profile.verificationStatus === "approved";
}

export function isBusinessProfileReady(profile: {
  companyName?: string | null;
  storeName?: string | null;
  storeType?: string | null;
  pickupAddress?: string | null;
  pickupTimeSlot?: string | null;
}): boolean {
  return Boolean(
    profile.companyName?.trim() &&
      (profile.storeName?.trim() || profile.companyName?.trim()) &&
      profile.storeType?.trim() &&
      profile.pickupAddress?.trim() &&
      profile.pickupTimeSlot?.trim(),
  );
}

export function todayIsoDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function storeTypeLabel(id: string | null | undefined): string {
  const match = BUSINESS_STORE_TYPES.find((type) => type.id === id);
  return match?.label || "Business";
}

export function pickupStyleLabel(id: string | null | undefined): string {
  const match = BUSINESS_PICKUP_STYLES.find((style) => style.id === id);
  return match?.label || BUSINESS_PICKUP_STYLES[0].label;
}

export const BUSINESS_WEEKDAY_LABELS: Record<BusinessWeekdayKey, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};
