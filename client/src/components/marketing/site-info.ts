export const XGOO_CONTACT = {
  email: "connect@xgoo.in",
  /** Voice / support phone (India) */
  phone: "+91 93471 38235",
  /** Display label for WhatsApp Business */
  whatsappDisplay: "+1 555-952-9213",
  /** Digits only with country code — used for wa.me chat widget */
  whatsapp: "15559529213",
  website: "www.xgoo.in",
  address: "Kondapur, Hyderabad, Telangana 500084, India",
  hours: "Mon – Sat, 9:00 AM – 7:00 PM IST",
} as const;

export const XGOO_MODULES = {
  go: {
    id: "go",
    name: "XGoo Go",
    shortName: "Go",
    meaning: "Book. Track. Repeat.",
    path: "/book?mode=login&account=go",
  },
  pro: {
    id: "pro",
    name: "XGoo Pro",
    shortName: "Pro",
    meaning: "Standing pickup for your store",
    path: "/book?mode=login&account=pro",
  },
  hub: {
    id: "hub",
    name: "XGoo Hub",
    shortName: "Hub",
    meaning: "Your store’s bookings, customers, and staff",
    path: "/auth-page?module=hub",
  },
  command: {
    id: "command",
    name: "XGoo Command",
    shortName: "Command",
    meaning: "Super Admin control of every XGoo app and store",
    path: "/auth-page?module=command",
  },
  pickup: {
    id: "pickup",
    name: "XGoo Pickup",
    shortName: "Pickup",
    meaning: "Collect at the door",
    path: "/auth-page?module=pickup",
  },
} as const;

export type XgooModuleId = keyof typeof XGOO_MODULES;

export const XGOO_CUSTOMER_MODULES = [XGOO_MODULES.go, XGOO_MODULES.pro] as const;
export const XGOO_OPS_MODULES = [XGOO_MODULES.hub, XGOO_MODULES.command] as const;

/** In-store kiosk receptionist — a Hub store feature, not a separate login product. */
export const XGOO_HUB_BOT = {
  name: "XGoo Bot Assistant",
  shortName: "Bot",
  meaning: "Walk-in receptionist for this Hub store",
  path: "/bot-assistant",
  kioskPath: "/kiosk",
} as const;

/** Company origin — historical facts for About and landing. Keep brand slogans in brand-foundation.ts. */
export const XGOO_ORIGIN = {
  foundedYear: 2021,
  storeName: "Courier Point",
  founderName: "S Krishna Murthy",
  founderRole: "Founder",
  neighbourhood: "Kondapur",
  city: "Hyderabad",
  eyebrow: "Our story",
  heading: "From a small Kondapur store to XGoo",
  teaser:
    "XGoo began in 2021 as Courier Point, a small courier store in Kondapur, Hyderabad, under the leadership of founder S Krishna Murthy.",
  paragraphs: [
    "The foundation of XGoo was laid in 2021. We started as Courier Point — a small store in Kondapur, Hyderabad — helping people and businesses move parcels from the neighbourhood outward.",
    "Under the management and leadership of S Krishna Murthy, founder of Courier Point (now XGoo), the store was built through daily effort, hardship, and care for every shipment. Trust was earned one booking at a time.",
    "That local foundation still guides us. Today we are growing the venture with technology that makes movement simpler, faster, and more dependable — so more people and businesses can move with purpose.",
  ],
  milestones: [
    {
      year: "2021",
      title: "Courier Point opens",
      detail: "A small store in Kondapur, Hyderabad, begins serving local courier bookings.",
    },
    {
      year: "Today",
      title: "Growing as XGoo",
      detail: "The same leadership and local trust, now building technology to move the venture forward faster.",
    },
  ],
} as const;

/** Parent company and product attribution — use across marketing, portal, and staff UI. */
export const XGOO_BRAND = {
  productName: "XGoo",
  parentCompany: "NSGroup",
  /** Short line for footers and compact UI */
  attributionShort: "XGoo — a product from NSGroup",
  /** Inline mention for hero / about copy */
  attributionInline: "XGoo is a product from NSGroup",
  copyright: (year = new Date().getFullYear()) =>
    `© ${year} NSGroup. XGoo is a product of NSGroup.`,
} as const;

/** Technology partner credited in website footer and the mobile app. */
export const XGOO_TECH_PARTNER = {
  name: "Tectangle",
  credit: "Designed and developed by",
  website: "www.tectangle.com",
  url: "https://www.tectangle.com",
  shops: {
    name: "Tectangle Shops",
    url: "https://www.tectangle.com/shops",
    eyebrow: "For XGoo Pro businesses",
    title: "Create your ecommerce store in minutes",
    body: "Go live this afternoon. Add products, pick a theme, and start taking UPI, card, and cash-on-delivery orders.",
    cta: "Open Tectangle Shops",
  },
} as const;

export {
  XGOO_BRAND_FOUNDATION,
  XGOO_BRAND_VOICE,
} from "./brand-foundation";
