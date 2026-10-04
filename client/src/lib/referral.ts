import { isValidReferralCode, normalizeReferralCode } from "@shared/referral";

export const REFERRAL_STORAGE_KEY = "xgoo_referral_code";

export function rememberReferralCode(raw: string | null | undefined) {
  const code = normalizeReferralCode(raw);
  if (!isValidReferralCode(code) || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, code);
  } catch {
    // ignore storage failures
  }
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const code = normalizeReferralCode(window.localStorage.getItem(REFERRAL_STORAGE_KEY));
    return isValidReferralCode(code) ? code : null;
  } catch {
    return null;
  }
}

export function captureReferralFromSearch(search = "") {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(query || (typeof window === "undefined" ? "" : window.location.search));
  const code = params.get("ref") || params.get("referral");
  if (code) rememberReferralCode(code);
}

export function captureReferralFromLocation() {
  if (typeof window === "undefined") return;
  captureReferralFromSearch(window.location.search);
  const match = window.location.pathname.match(/^\/r\/([A-Za-z0-9]+)/i);
  if (match?.[1]) rememberReferralCode(match[1]);
}

export function referralBookingShareUrl(code: string, origin = typeof window === "undefined" ? "" : window.location.origin) {
  const normalized = normalizeReferralCode(code);
  const base = origin.replace(/\/$/, "") || "";
  return `${base}/book?ref=${encodeURIComponent(normalized)}`;
}

export function referralLandingShareUrl(code: string, origin = typeof window === "undefined" ? "" : window.location.origin) {
  const normalized = normalizeReferralCode(code);
  const base = origin.replace(/\/$/, "") || "";
  return `${base}/r/${encodeURIComponent(normalized)}`;
}
