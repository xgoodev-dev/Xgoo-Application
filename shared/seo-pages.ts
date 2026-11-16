/**
 * Page-wise SEO meta tags for the public XGoo website.
 *
 * Source: "XGoo Website SEO Meta Tags" brief. Shared by the React client
 * (PageSeo, runtime head updates) and the server (index.html injection so
 * crawlers and link-preview bots see the right tags without running JS).
 *
 * Canonical/og:url paths use the routes that are live in the app. Where the brief
 * proposed a different URL for an existing page, the proposal is noted next to the entry.
 */

export const SEO_SITE_URL = "https://www.xgoo.in";
export const SEO_DEFAULT_OG_IMAGE = `${SEO_SITE_URL}/og-image.jpg`;

export type SharedPageSeo = {
  path: string;
  title: string;
  description: string;
  /** Only set when og:title must differ from the <title>. */
  ogTitle?: string;
  imageAlt: string;
};

export const PUBLIC_PAGE_SEO = {
  home: {
    path: "/",
    title: "Domestic & International Courier Services in Hyderabad | XGoo",
    description:
      "Book domestic and international courier services in Hyderabad with XGoo. Explore parcel booking, request doorstep pickup and track shipments online.",
    imageAlt: "XGoo - Homepage",
  },
  book: {
    path: "/book",
    title: "Book a Courier Online | Schedule Parcel Pickup | XGoo",
    description:
      "Book your parcel shipment online with XGoo. Enter your details to request a courier pickup and explore domestic or international delivery options from India.",
    imageAlt: "XGoo - Book Shipment",
  },
  /** Brief proposed /domestic-courier-services; live route is /domestic-courier. */
  domesticCourier: {
    path: "/domestic-courier",
    title: "Domestic Courier Services in Hyderabad | Book Online | XGoo",
    ogTitle: "Domestic Courier Services in India | Book Online | XGoo",
    description:
      "Send a parcel within India using XGoo domestic courier services. Learn how to book online, arrange a courier pickup and follow your shipment along the way.",
    imageAlt: "XGoo - Domestic Courier Services",
  },
  /** Brief proposed /international-courier-services; live route is /international-courier. */
  internationalCourier: {
    path: "/international-courier",
    title: "International Courier Services from India | Online | XGoo",
    description:
      "Explore international courier services from India with XGoo. Review available destinations, book your parcel online and request pickup from your address.",
    imageAlt: "XGoo - International Courier Services",
  },
  about: {
    path: "/about",
    title: "About XGoo | Online Courier Booking & Delivery Services",
    description:
      "Learn about XGoo, an NSGroup courier booking service for domestic and international parcel delivery. Explore the online booking process and available services.",
    imageAlt: "XGoo - About Us",
  },
  contact: {
    path: "/contact",
    title: "Contact XGoo | Online Courier Booking & Shipment Support",
    description:
      "Have questions about parcel booking or a courier shipment? Contact XGoo for information about online booking, pickup requests and your shipment details.",
    imageAlt: "XGoo - Contact Us",
  },
  track: {
    path: "/track",
    title: "Track Courier Shipment Online | Parcel Tracking | XGoo",
    description:
      "Track your XGoo courier shipment online using the available tracking details. Check parcel movement and find guidance for shipment updates or support.",
    imageAlt: "XGoo - Track Shipment",
  },
  howItWorks: {
    path: "/how-it-works",
    title: "How XGoo Works | Easy Online Courier Booking in India",
    description:
      "See how courier booking works with XGoo. Enter your shipment details, request a pickup and follow your parcel after dispatch within India or abroad.",
    imageAlt: "XGoo - How It Works",
  },
  courierServicesHyderabad: {
    path: "/courier-services-hyderabad",
    title: "Courier Services in Hyderabad | Book Online | XGoo",
    description:
      "Looking for courier services in Hyderabad? Explore XGoo domestic and international parcel booking, request a doorstep pickup and track your shipment online.",
    imageAlt: "XGoo - Courier Services in Hyderabad",
  },
  internationalCourierHyderabad: {
    path: "/international-courier-hyderabad",
    title: "International Courier Services in Hyderabad | XGoo",
    description:
      "Send international parcels from Hyderabad with XGoo. Explore destinations including the USA, UK, Canada, Australia and UAE, then request courier pickup online.",
    imageAlt: "XGoo - International Courier Services in Hyderabad",
  },
  courierPickupFromHome: {
    path: "/courier-pickup-from-home",
    title: "Courier Pickup from Home | Book a Parcel Online | XGoo",
    description:
      "Arrange courier pickup from home with XGoo. Start an online parcel booking, enter your contact details and explore domestic and international shipment options.",
    imageAlt: "XGoo - Doorstep Courier Pickup",
  },
  internationalCourierCharges: {
    path: "/international-courier-charges",
    title: "International Courier Charges from India | Quote | XGoo",
    description:
      "Explore how international courier charges are calculated with XGoo. Learn about shipment details that affect pricing and request an available courier quote.",
    imageAlt: "XGoo - International Courier Charges",
  },
} satisfies Record<string, SharedPageSeo>;

/**
 * Hyderabad → country route pages, keyed by route slug.
 * Live URLs are /courier-from-hyderabad-to-{slug}; the brief proposed /hyderabad-to-{slug}-courier.
 */
export const COURIER_ROUTE_SEO: Record<string, Omit<SharedPageSeo, "path">> = {
  usa: {
    title: "Courier from Hyderabad to USA | Book Online | XGoo",
    description:
      "Sending a parcel from Hyderabad to the USA? Explore XGoo international courier booking, pickup options and shipment tracking before scheduling your parcel.",
    imageAlt: "XGoo - Hyderabad to USA Courier",
  },
  canada: {
    title: "Courier from Hyderabad to Canada | Book Online | XGoo",
    description:
      "Explore courier booking from Hyderabad to Canada with XGoo. Find out how to arrange a parcel pickup, prepare shipment details and track your delivery online.",
    imageAlt: "XGoo - Hyderabad to Canada Courier",
  },
  uk: {
    title: "Courier from Hyderabad to UK | Book Online with XGoo",
    description:
      "Need to send a parcel from Hyderabad to the UK? Explore international courier services with XGoo, enter your shipment details and request pickup online.",
    imageAlt: "XGoo - Hyderabad to UK Courier",
  },
  australia: {
    title: "Courier from Hyderabad to Australia | Book Online | XGoo",
    description:
      "Explore XGoo courier services from Hyderabad to Australia. Start your international parcel booking, request a pickup and follow your shipment after dispatch.",
    imageAlt: "XGoo - Hyderabad to Australia Courier",
  },
  uae: {
    title: "Courier from Hyderabad to UAE | Book Online | XGoo",
    description:
      "Book a courier from Hyderabad to the UAE with XGoo. Explore international parcel shipping, enter your pickup details and track the shipment after dispatch.",
    imageAlt: "XGoo - Hyderabad to UAE Courier",
  },
};

export const COURIER_ROUTE_SEO_PREFIX = "/courier-from-hyderabad-to-";


export type ResolvedPageSeo = SharedPageSeo & { noIndex?: boolean };

/** Resolve the static SEO tags for a public URL path, or null when the page manages its own. */
export function resolvePublicPageSeo(pathname: string): ResolvedPageSeo | null {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";

  for (const page of Object.values(PUBLIC_PAGE_SEO) as SharedPageSeo[]) {
    if (page.path === path) return page;
  }

  // Individual shipment results (/track/<ref>) are private — keep them out of search.
  if (path.startsWith("/track/")) {
    return { ...PUBLIC_PAGE_SEO.track, noIndex: true };
  }

  if (path.startsWith(COURIER_ROUTE_SEO_PREFIX)) {
    const slug = path.slice(COURIER_ROUTE_SEO_PREFIX.length);
    const route = COURIER_ROUTE_SEO[slug];
    if (route) return { ...route, path };
  }

  return null;
}
