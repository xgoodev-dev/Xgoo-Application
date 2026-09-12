import { COURIER_ROUTES } from "./destinations";
import type { CourierRoute } from "./types";

export type { CourierRoute, CourierRouteCity, CourierRouteFaq } from "./types";
export { COURIER_ROUTES } from "./destinations";

export const INTERNATIONAL_COURIER_PATH = "/international-courier";
export const DOMESTIC_COURIER_PATH = "/domestic-courier";
export const COURIER_ROUTE_PREFIX = "/courier-from-hyderabad-to-";

export function courierRoutePath(slug: string): string {
  return `${COURIER_ROUTE_PREFIX}${slug}`;
}

export function listPublishedCourierRoutes(): CourierRoute[] {
  return COURIER_ROUTES;
}

export function getCourierRoute(slug: string | undefined): CourierRoute | undefined {
  if (!slug) return undefined;
  return COURIER_ROUTES.find((route) => route.slug === slug);
}

export function parseCourierRouteSlug(pathname: string): string | undefined {
  const path = pathname.split("?")[0] || "";
  if (!path.startsWith(COURIER_ROUTE_PREFIX)) return undefined;
  const slug = path.slice(COURIER_ROUTE_PREFIX.length).replace(/\/$/, "");
  return slug || undefined;
}

export function relatedCourierRoutes(route: CourierRoute): CourierRoute[] {
  const fromConfig = route.relatedSlugs
    .map((slug) => getCourierRoute(slug))
    .filter((item): item is CourierRoute => Boolean(item) && item.slug !== route.slug);

  if (fromConfig.length >= 2) return fromConfig.slice(0, 4);

  const extras = COURIER_ROUTES.filter(
    (item) => item.slug !== route.slug && !fromConfig.some((related) => related.slug === item.slug),
  );
  return [...fromConfig, ...extras].slice(0, 4);
}

export function bookInternationalHref(): string {
  return "/book?scope=international";
}

export function whatsappQuoteHref(phoneDigits: string, route: CourierRoute): string {
  const text = `Hi, I need a courier quote from Hyderabad to ${route.countryName}.`;
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`;
}
