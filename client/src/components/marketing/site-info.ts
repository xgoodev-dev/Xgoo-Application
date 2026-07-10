export const XGOO_CONTACT = {
  email: "connect@xgoo.in",
  phone: "+91 98765 43210",
  website: "www.xgoo.in",
  address: "Kondapur, Hyderabad, Telangana 500084, India",
  hours: "Mon – Sat, 9:00 AM – 7:00 PM IST",
} as const;

/** Parent company and product attribution — use across marketing, portal, and staff UI. */
export const XGOO_BRAND = {
  productName: "XGoo",
  parentCompany: "Murthy Enterprises",
  /** Short line for footers and compact UI */
  attributionShort: "XGoo — a product from Murthy Enterprises",
  /** Inline mention for hero / about copy */
  attributionInline: "XGoo is a product from Murthy Enterprises",
  copyright: (year = new Date().getFullYear()) =>
    `© ${year} Murthy Enterprises. XGoo is a product of Murthy Enterprises.`,
} as const;
