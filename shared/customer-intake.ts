export const CUSTOMER_SERVICE_OPTED = [
  { value: "domestic_surface", label: "Domestic Surface" },
  { value: "domestic_air", label: "Domestic Air" },
  { value: "international", label: "International" },
  { value: "pickup_delivery", label: "Pickup & Delivery" },
  { value: "not_specified", label: "Not specified" },
] as const;

export const CUSTOMER_LEAD_SOURCES = [
  { value: "google", label: "Google" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "referral", label: "Referral" },
  { value: "walk_in", label: "Walk-in" },
  { value: "other", label: "Other" },
] as const;

export const CUSTOMER_REQUEST_METHODS = [
  { value: "mobile_app", label: "Mobile app" },
  { value: "website", label: "Website" },
  { value: "walk_in", label: "Walk-in" },
  { value: "phone_call", label: "Phone call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
] as const;

export type CustomerServiceOpted = (typeof CUSTOMER_SERVICE_OPTED)[number]["value"];
export type CustomerLeadSource = (typeof CUSTOMER_LEAD_SOURCES)[number]["value"];
export type CustomerRequestMethod = (typeof CUSTOMER_REQUEST_METHODS)[number]["value"];

export function labelForCustomerOption<T extends { value: string; label: string }>(
  options: readonly T[],
  value?: string | null,
): string {
  if (!value) return "—";
  return options.find((option) => option.value === value)?.label || value;
}
