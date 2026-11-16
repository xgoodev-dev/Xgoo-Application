const PUBLIC_SITE_EXACT = new Set([
  "/",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/return-policy",
  "/shipping-policy",
  "/cancellation-policy",
  "/auth-page",
  "/refer",
  "/international-courier",
  "/domestic-courier",
  "/how-it-works",
  "/courier-services-hyderabad",
  "/international-courier-hyderabad",
  "/courier-pickup-from-home",
  "/international-courier-charges",
]);

function pathOnly(path: string): string {
  const raw = (path.split("?")[0] || "/").trim() || "/";
  if (raw.length > 1 && raw.endsWith("/")) return raw.slice(0, -1);
  return raw;
}

/** Marketing, customer, and auth stay light. Hub and Command follow the user theme. */
export function isPublicSitePath(path: string): boolean {
  const pathname = pathOnly(path);
  if (PUBLIC_SITE_EXACT.has(pathname)) return true;
  if (pathname === "/book" || pathname.startsWith("/book/")) return true;
  if (pathname === "/kiosk" || pathname.startsWith("/kiosk/")) return true;
  if (pathname === "/track" || pathname.startsWith("/track/")) return true;
  if (pathname.startsWith("/r/")) return true;
  if (pathname.startsWith("/quote/")) return true;
  if (pathname.startsWith("/s/")) return true;
  if (pathname.startsWith("/courier-from-hyderabad-to-")) return true;
  return false;
}
