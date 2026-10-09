export const HUB_QR_QUERY_PARAM = "hub";

export function parseHubIdFromSearch(search: string): string | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const id = new URLSearchParams(raw).get(HUB_QR_QUERY_PARAM)?.trim() || "";
  return id.length > 0 && id.length <= 80 ? id : null;
}

export function buildHubCounterBookingUrl(
  origin: string,
  officeSlug: string | null | undefined,
  branchId: string,
): string {
  const root = origin.replace(/\/$/, "");
  const path = officeSlug ? `/book/${officeSlug}` : "/book";
  return `${root}${path}?${HUB_QR_QUERY_PARAM}=${encodeURIComponent(branchId)}`;
}
