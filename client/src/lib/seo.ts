import { XGOO_BRAND, XGOO_CONTACT, XGOO_BRAND_VOICE } from "@/components/marketing/site-info";

/** Canonical production site — override with VITE_SITE_URL when needed. */
export const SITE_URL =
  (typeof import.meta !== "undefined" &&
    String((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_SITE_URL || "").replace(
      /\/$/,
      "",
    )) ||
  `https://${XGOO_CONTACT.website}`;

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export type PageSeoConfig = {
  title: string;
  description: string;
  path: string;
  /** noindex for staff/auth or private flows */
  noIndex?: boolean;
  image?: string;
  type?: "website" | "article";
  keywords?: string[];
};

export const SEO_PAGES = {
  home: {
    path: "/",
    title: "XGoo | Book Courier Online — Send It. Delivered.",
    description:
      "Book parcel pickups online with XGoo, a Murthy Enterprises product. Doorstep pickup, live tracking, and trusted courier networks. Movement creates progress.",
    keywords: [
      "courier booking",
      "book parcel online",
      "doorstep pickup",
      "track shipment",
      "XGoo",
      "Murthy Enterprises",
      "domestic courier",
      "international courier",
    ],
  },
  about: {
    path: "/about",
    title: "About XGoo | Movement Creates Progress",
    description:
      "Learn XGoo’s brand foundation: purpose, vision, mission, and principles. We empower progress through movement and innovation.",
    keywords: ["about XGoo", "movement platform", "Murthy Enterprises", "courier company"],
  },
  contact: {
    path: "/contact",
    title: "Contact XGoo | Support & Enquiries",
    description: `Contact XGoo at ${XGOO_CONTACT.email}, phone ${XGOO_CONTACT.phone}, or WhatsApp ${XGOO_CONTACT.whatsappDisplay}. ${XGOO_CONTACT.hours}. ${XGOO_CONTACT.address}.`,
    keywords: ["contact XGoo", "courier support", "WhatsApp courier"],
  },
  book: {
    path: "/book",
    title: "Book a Parcel Online | XGoo Courier",
    description:
      "Book a courier pickup in minutes with XGoo. Enter sender, receiver, and parcel details — track your shipment with booking or AWB number.",
    keywords: ["book parcel", "courier pickup", "online booking", "XGoo book"],
  },
  terms: {
    path: "/terms",
    title: "Terms and Conditions | XGoo",
    description: "Read XGoo Terms and Conditions for courier booking, liability, payments, and acceptable use.",
    type: "article" as const,
  },
  privacy: {
    path: "/privacy",
    title: "Privacy Policy | XGoo",
    description: "How XGoo collects, uses, and protects your personal information when you book or contact us.",
    type: "article" as const,
  },
  returnPolicy: {
    path: "/return-policy",
    title: "Return Policy | XGoo",
    description: "XGoo return-to-origin (RTO) and undelivered shipment policy for courier bookings.",
    type: "article" as const,
  },
  shippingPolicy: {
    path: "/shipping-policy",
    title: "Shipping Policy | XGoo",
    description: "Pickup, transit, packaging, and delivery guidelines for shipments booked through XGoo.",
    type: "article" as const,
  },
  cancellationPolicy: {
    path: "/cancellation-policy",
    title: "Cancellation Policy | XGoo",
    description: "When you can cancel an XGoo booking and how refunds or credits are handled.",
    type: "article" as const,
  },
  auth: {
    path: "/auth-page",
    title: "Staff Login | XGoo",
    description: "Sign in to the XGoo staff dashboard for Murthy Enterprises courier operations.",
    noIndex: true,
  },
} satisfies Record<string, PageSeoConfig>;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized === "/" ? "" : normalized}` || SITE_URL;
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: XGOO_BRAND.productName,
    legalName: XGOO_BRAND.parentCompany,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
    email: XGOO_CONTACT.email,
    telephone: XGOO_CONTACT.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kondapur",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      postalCode: "500084",
      addressCountry: "IN",
    },
    sameAs: [`https://wa.me/${XGOO_CONTACT.whatsapp}`],
    slogan: XGOO_BRAND_VOICE.beliefOneLiner,
    parentOrganization: {
      "@type": "Organization",
      name: XGOO_BRAND.parentCompany,
    },
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: XGOO_BRAND.productName,
    url: SITE_URL,
    description: SEO_PAGES.home.description,
    publisher: {
      "@type": "Organization",
      name: XGOO_BRAND.parentCompany,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/book?track={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#business`,
    name: `${XGOO_BRAND.productName} Courier`,
    image: DEFAULT_OG_IMAGE,
    url: SITE_URL,
    telephone: XGOO_CONTACT.phone,
    email: XGOO_CONTACT.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kondapur",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      postalCode: "500084",
      addressCountry: "IN",
    },
    openingHours: "Mo-Sa 09:00-19:00",
    priceRange: "$$",
    parentOrganization: {
      "@type": "Organization",
      name: XGOO_BRAND.parentCompany,
    },
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildFaqJsonLd(faqs: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}
