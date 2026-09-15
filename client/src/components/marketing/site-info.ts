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
    meaning: "Send something and go",
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
} as const;

export {
  XGOO_BRAND_FOUNDATION,
  XGOO_BRAND_VOICE,
} from "./brand-foundation";
