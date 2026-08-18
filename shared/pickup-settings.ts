import { z } from "zod";

export const pickupSlotSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  enabled: z.boolean().default(true),
});

export const pickupSettingsSchema = z.object({
  slots: z.array(pickupSlotSchema).min(1),
  sameDayCutoffHour: z.number().int().min(0).max(23).default(13),
  cutoffNote: z.string().default(
    "Parcels collected or processed before 1 PM will be connected on the same day. Further pickups will be connected on the next day.",
  ),
});

export type PickupSlot = z.infer<typeof pickupSlotSchema>;
export type PickupSettings = z.infer<typeof pickupSettingsSchema>;

function formatHourLabel(hour24: number): string {
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12} ${suffix}`;
}

function formatHourValue(hour24: number): string {
  return `${String(hour24).padStart(2, "0")}:00`;
}

/** Default hourly pickup windows from 9 AM through 7 PM. */
export function buildDefaultPickupSlots(
  startHour = 9,
  endHour = 19,
): PickupSlot[] {
  const slots: PickupSlot[] = [];
  for (let hour = startHour; hour <= endHour; hour += 1) {
    slots.push({
      value: formatHourValue(hour),
      label: formatHourLabel(hour),
      enabled: true,
    });
  }
  return slots;
}

export const DEFAULT_PICKUP_SETTINGS: PickupSettings = pickupSettingsSchema.parse({
  slots: buildDefaultPickupSlots(),
  sameDayCutoffHour: 13,
  cutoffNote:
    "Parcels collected or processed before 1 PM will be connected on the same day. Further pickups will be connected on the next day.",
});

export function mergePickupSettings(raw: unknown): PickupSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PICKUP_SETTINGS, slots: [...DEFAULT_PICKUP_SETTINGS.slots] };

  const candidate = {
    ...DEFAULT_PICKUP_SETTINGS,
    ...(raw as Record<string, unknown>),
    slots: Array.isArray((raw as { slots?: unknown }).slots)
      ? (raw as { slots: unknown[] }).slots
      : DEFAULT_PICKUP_SETTINGS.slots,
  };

  const parsed = pickupSettingsSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ...DEFAULT_PICKUP_SETTINGS, slots: [...DEFAULT_PICKUP_SETTINGS.slots] };
  }

  return {
    ...parsed.data,
    slots: parsed.data.slots.map((slot) => ({ ...slot })),
  };
}

export function enabledPickupSlots(settings: PickupSettings): PickupSlot[] {
  return settings.slots.filter((slot) => slot.enabled);
}

export function pickupSlotLabel(
  settings: PickupSettings,
  value: string | null | undefined,
): string {
  if (!value) return "Flexible";
  const match = settings.slots.find((slot) => slot.value === value);
  return match?.label || value;
}
