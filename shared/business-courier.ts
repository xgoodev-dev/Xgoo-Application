import { z } from "zod";

export const BUSINESS_STORE_TYPES = [
  { id: "cloth_store", label: "Cloth store" },
  { id: "gift_shop", label: "Gift shop" },
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
  "it_office",
  "pharmacy",
  "restaurant",
  "other",
]);

export const businessProfilePatchSchema = z.object({
  companyName: z.string().trim().min(1).max(255).optional(),
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
  weekdays: businessWeekdaysSchema.optional(),
});

export const businessDestinationSchema = z.object({
  name: z.string().trim().min(1, "Receiver name is required").max(255),
  phone: z.string().trim().min(10, "Valid phone required").max(20),
  address: z.string().trim().min(1, "Address is required").max(2000),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  pincode: z.string().trim().max(10).optional().nullable(),
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

export function isBusinessProfileReady(profile: {
  companyName?: string | null;
  storeType?: string | null;
  pickupAddress?: string | null;
  pickupTimeSlot?: string | null;
}): boolean {
  return Boolean(
    profile.companyName?.trim() &&
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

export const BUSINESS_WEEKDAY_LABELS: Record<BusinessWeekdayKey, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};
