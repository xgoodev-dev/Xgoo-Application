export const HUB_QR_QUERY_PARAM = "hub";
const HUB_QR_SESSION_KEY = "xgoo_hub_qr_branch_id";

export function parseHubIdFromSearch(search: string): string | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const id = new URLSearchParams(raw).get(HUB_QR_QUERY_PARAM)?.trim() || "";
  return id.length > 0 && id.length <= 80 ? id : null;
}

export function rememberHubId(id: string | null | undefined) {
  if (typeof sessionStorage === "undefined" || !id) return;
  sessionStorage.setItem(HUB_QR_SESSION_KEY, id);
}

export function rememberedHubId(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const id = sessionStorage.getItem(HUB_QR_SESSION_KEY)?.trim() || "";
  return id.length > 0 && id.length <= 80 ? id : null;
}

export function resolveHubId(search: string): string | null {
  const fromUrl = parseHubIdFromSearch(search);
  if (fromUrl) {
    rememberHubId(fromUrl);
    return fromUrl;
  }
  return rememberedHubId();
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
