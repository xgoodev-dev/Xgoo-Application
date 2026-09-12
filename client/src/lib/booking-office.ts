export type PublicBookingOffice = {
  id?: string;
  name?: string;
  slug: string;
};

export async function resolvePublicBookingOffice(): Promise<PublicBookingOffice> {
  const defaultSlug = import.meta.env.VITE_DEFAULT_OFFICE_SLUG?.trim();
  if (defaultSlug) {
    return { slug: defaultSlug };
  }

  const res = await fetch("/api/public/booking-office");
  const data = (await res.json().catch(() => ({}))) as PublicBookingOffice & { message?: string };
  if (!res.ok || !data.slug) {
    throw new Error(data.message || "Booking is not available yet");
  }
  return data;
}
