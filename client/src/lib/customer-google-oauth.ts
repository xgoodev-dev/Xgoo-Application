export const CUSTOMER_GOOGLE_OAUTH_KEY = "xgoo_customer_google_oauth";

export function isCustomerGoogleOAuthPending() {
  if (typeof window === "undefined") return false;
  return Boolean(sessionStorage.getItem(CUSTOMER_GOOGLE_OAUTH_KEY));
}

/** Send Google OAuth returns (often `/` or `/dashboard`) back to XGoo Pro. */
export function customerGoogleOAuthBookPath() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  params.set("oauth", "1");
  if (!params.get("account")) params.set("account", "pro");
  const query = params.toString();
  return query ? `/book?${query}` : "/book?oauth=1&account=pro";
}

export function isCustomerBookPath(path: string) {
  const pathOnly = path.split("?")[0] || "/";
  return pathOnly === "/book" || pathOnly.startsWith("/book/");
}
