export const XGOO_GO_SCHEME = "xgoo";
export const XGOO_GO_ANDROID_PACKAGE = "com.murthyenterprises.xgoo";

const GENERIC_TRACK_REFS = new Set([
  "xgoo",
  "open",
  "track",
  "menu",
  "welcome",
  "hi",
  "hello",
  "help",
]);

export function isGenericTrackRef(ref?: string | null): boolean {
  const value = (ref || "").trim().toLowerCase();
  return !value || GENERIC_TRACK_REFS.has(value);
}

export function websiteTrackPath(ref?: string | null): string {
  if (isGenericTrackRef(ref)) return "/track";
  return `/track/${encodeURIComponent(ref!.trim())}`;
}

export function xgooGoTrackHref(ref?: string | null): string {
  if (isGenericTrackRef(ref)) return `${XGOO_GO_SCHEME}://track`;
  return `${XGOO_GO_SCHEME}://track?q=${encodeURIComponent(ref!.trim())}`;
}

export function androidTrackIntentHref(ref?: string | null, fallbackHttps?: string): string {
  const path = isGenericTrackRef(ref)
    ? "track"
    : `track?q=${encodeURIComponent(ref!.trim())}`;
  const fallback = fallbackHttps || `https://www.xgoo.in${websiteTrackPath(ref)}`;
  return `intent://${path}#Intent;scheme=${XGOO_GO_SCHEME};package=${XGOO_GO_ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(fallback)};end`;
}
