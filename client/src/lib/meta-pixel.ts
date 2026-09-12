declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
  }
}

type FbqFunction = {
  (command: "init" | "track" | "trackCustom", eventOrPixelId: string, params?: Record<string, string>): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: FbqFunction;
  loaded: boolean;
  version: string;
};

/** Staff dashboard routes — no Meta Pixel after login. */
const STAFF_PATH_PREFIXES = [
  "/dashboard",
  "/bookings",
  "/shipments",
  "/documents",
  "/quotations",
  "/booking-requests",
  "/customers",
  "/partners",
  "/pricing",
  "/reports",
  "/settings",
] as const;

const FALLBACK_PIXEL_ID = "1654482905665528";

let initializedPixelId: string | null = null;

export function isStaffRoute(path: string): boolean {
  const pathOnly = path.split("?")[0] || "/";
  return STAFF_PATH_PREFIXES.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`),
  );
}

export function getMetaPixelId(): string | undefined {
  const id = import.meta.env.VITE_META_PIXEL_ID?.trim();
  return id || FALLBACK_PIXEL_ID;
}

/**
 * Website pages get the pixel; staff application (dashboard) after login does not.
 */
export function shouldEnableMetaPixel(
  path: string,
  isStaffAuthenticated: boolean,
  authLoading = false,
): boolean {
  if (authLoading) return false;
  if (isStaffRoute(path)) return false;
  // Logged-in staff hitting / are redirected to dashboard — skip tracking there.
  if (isStaffAuthenticated && path.split("?")[0] === "/") return false;
  return true;
}

export function isMetaPixelReady(): boolean {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

export function initMetaPixel(pixelId: string): void {
  if (typeof window === "undefined") return;

  if (window.fbq) {
    if (initializedPixelId !== pixelId) {
      window.fbq("init", pixelId);
      initializedPixelId = pixelId;
    }
    return;
  }

  (function (f: Window, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n = function (this: unknown, ...args: unknown[]) {
      if (n.callMethod) {
        n.callMethod.apply(n, args);
      } else {
        n.queue.push(args);
      }
    } as FbqFunction;
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    f.fbq = n;
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s?.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq!("init", pixelId);
  initializedPixelId = pixelId;
}

export function trackMetaPageView(): void {
  if (!isMetaPixelReady()) return;
  window.fbq!("track", "PageView");
}

export function trackMetaLead(payload?: Record<string, string>): void {
  if (!isMetaPixelReady()) return;
  window.fbq!("track", "Lead", {
    content_name: "Booking Request",
    ...payload,
  });
}

export function trackMetaContact(payload?: Record<string, string>): void {
  if (!isMetaPixelReady()) return;
  window.fbq!("track", "Contact", payload);
}

export function trackMetaCustom(eventName: string, payload?: Record<string, string>): void {
  if (!isMetaPixelReady()) return;
  window.fbq!("trackCustom", eventName, payload);
}
