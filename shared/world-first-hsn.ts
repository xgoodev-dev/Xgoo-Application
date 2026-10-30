import { searchHsnCatalog, type HsnCatalogItem } from "./hsn-catalog";

/**
 * World First Xpresion Performa Description master (Gooddesc autocomplete).
 * Names and 8-digit HS codes match CSB-IV / CSB-V items used on AWB Entry.
 */
export const WORLD_FIRST_ITEM_CATALOG: HsnCatalogItem[] = [
  { name: "ARTIFICIAL FLOWERS", hsn: "67029000" },
  { name: "ARTIFICIAL JEWELLERY", hsn: "71179090" },
  { name: "BABY GARMENTS", hsn: "61112000" },
  { name: "BAGS", hsn: "42021290" },
  { name: "BED SHEETS", hsn: "63023100" },
  { name: "BELTS", hsn: "42033000" },
  { name: "BOOKS", hsn: "49011010" },
  { name: "CANDLES", hsn: "34060010" },
  { name: "CARPETS", hsn: "57050029" },
  { name: "CHOCOLATES", hsn: "18069000" },
  { name: "COFFEE", hsn: "09012100" },
  { name: "COSMETICS", hsn: "33049990" },
  { name: "COTTON T.SHIRTS", hsn: "61091000" },
  { name: "CURTAINS", hsn: "63039200" },
  { name: "DOCUMENTS", hsn: "49019900" },
  { name: "DRY FRUITS", hsn: "08028090" },
  { name: "ELECTRONIC GOODS", hsn: "85437099" },
  { name: "FESTIVE ARTICLES", hsn: "95059090" },
  { name: "FOOD STUFF", hsn: "21069099" },
  { name: "FOOTWEAR", hsn: "64041990" },
  { name: "GARMENTS", hsn: "61091000" },
  { name: "GIFT ITEMS", hsn: "98049000" },
  { name: "GLASSWARE", hsn: "70139900" },
  { name: "HAIR ACCESSORIES", hsn: "96151100" },
  { name: "HANDICRAFTS", hsn: "44219990" },
  { name: "HEADPHONES", hsn: "85183000" },
  { name: "HOME TEXTILES", hsn: "63023100" },
  { name: "IMITATION JEWELLERY", hsn: "71171990" },
  { name: "INCENSE STICKS", hsn: "33074100" },
  { name: "KITCHENWARE", hsn: "73239390" },
  { name: "LADIES GARMENTS", hsn: "62044490" },
  { name: "LAPTOPS", hsn: "84713010" },
  { name: "LEATHER GOODS", hsn: "42022190" },
  { name: "MARBLE ITEMS", hsn: "68022190" },
  { name: "MEDICINES", hsn: "30049099" },
  { name: "MOBILE ACCESSORIES", hsn: "85177090" },
  { name: "MOBILE PHONES", hsn: "85171300" },
  { name: "PAINTINGS", hsn: "97019100" },
  { name: "PAPER ARTICLES", hsn: "48239013" },
  { name: "PERFUMES", hsn: "33030090" },
  { name: "PERSONAL EFFECTS", hsn: "98049000" },
  { name: "PHOTO FRAME", hsn: "44149000" },
  { name: "PLASTIC ARTICLES", hsn: "39269099" },
  { name: "READYMADE GARMENTS", hsn: "61091000" },
  { name: "RELIGIOUS ITEMS", hsn: "74198030" },
  { name: "SAMPLES", hsn: "49111090" },
  { name: "SAREES", hsn: "50072010" },
  { name: "SCARVES", hsn: "62143000" },
  { name: "SHIRTS", hsn: "62052000" },
  { name: "SPICES", hsn: "09109929" },
  { name: "STATIONERY", hsn: "48201000" },
  { name: "STATUES", hsn: "83062110" },
  { name: "SWEETS / CONFECTIONERY", hsn: "17049090" },
  { name: "TEA", hsn: "09023020" },
  { name: "TEXTILES", hsn: "52085190" },
  { name: "TOYS", hsn: "95030091" },
  { name: "TRAVEL BAGS", hsn: "42021290" },
  { name: "TROUSERS / JEANS", hsn: "62034200" },
  { name: "UTENSILS", hsn: "73239390" },
  { name: "WALL HANGINGS", hsn: "58050020" },
  { name: "WATCHES", hsn: "91021100" },
  { name: "WOODEN ARTICLES", hsn: "44219990" },
  { name: "WOOLLEN GARMENTS", hsn: "61101110" },
  { name: "WORN CLOTHING", hsn: "63090000" },
];

export const WORLD_FIRST_CITIES: { city: string; code: string }[] = [
  { city: "HYDERABAD", code: "HYD" },
  { city: "BANGALORE", code: "BLR" },
  { city: "BENGALURU", code: "BLR" },
  { city: "MUMBAI", code: "BOM" },
  { city: "DELHI", code: "DEL" },
  { city: "NEW DELHI", code: "DEL" },
  { city: "CHENNAI", code: "MAA" },
  { city: "KOLKATA", code: "CCU" },
  { city: "AHMEDABAD", code: "AMD" },
  { city: "PUNE", code: "PNQ" },
  { city: "COCHIN", code: "COK" },
  { city: "KOCHI", code: "COK" },
  { city: "COIMBATORE", code: "CJB" },
  { city: "JAIPUR", code: "JAI" },
  { city: "LUCKNOW", code: "LKO" },
  { city: "CHANDIGARH", code: "IXC" },
  { city: "GOA", code: "GOI" },
  { city: "VISAKHAPATNAM", code: "VTZ" },
  { city: "VIJAYAWADA", code: "VGA" },
  { city: "TIRUPATI", code: "TIR" },
  { city: "KURNOOL", code: "KJB" },
  { city: "NAGPUR", code: "NAG" },
  { city: "INDORE", code: "IDR" },
  { city: "BHOPAL", code: "BHO" },
  { city: "SURAT", code: "STV" },
  { city: "RAJKOT", code: "RAJ" },
  { city: "PATNA", code: "PAT" },
  { city: "BHUBANESWAR", code: "BBI" },
  { city: "GUWAHATI", code: "GAU" },
  { city: "TRIVANDRUM", code: "TRV" },
  { city: "CALICUT", code: "CCJ" },
  { city: "MADURAI", code: "IXM" },
  { city: "TRICHY", code: "TRZ" },
  { city: "VARANASI", code: "VNS" },
  { city: "AMRITSAR", code: "ATQ" },
  { city: "LONDON", code: "LHR" },
  { city: "NEW YORK", code: "JFK" },
  { city: "DUBAI", code: "DXB" },
  { city: "SINGAPORE", code: "SIN" },
  { city: "SYDNEY", code: "SYD" },
  { city: "TORONTO", code: "YYZ" },
  { city: "MELBOURNE", code: "MEL" },
];

export const WORLD_FIRST_EXPORT_REASONS = [
  "UNSOLICITED GIFT - NOT FOR SALE",
  "SAMPLE",
  "DOCUMENTS",
  "COMMERCIAL",
  "PERSONAL EFFECTS",
  "RETURN / REPAIR",
] as const;

export const WORLD_FIRST_DOCUMENT_TYPES = [
  "GSTIN (Normal)",
  "GSTIN (SEZ)",
  "Aadhaar",
  "Passport",
  "IEC",
  "Other",
] as const;

function tokens(value: string): string[] {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
}

/** Same behaviour as Xpresion Gooddesc: match typed text inside the item name or HSN. */
export function searchWorldFirstCatalog(query: string, limit = 12): HsnCatalogItem[] {
  const q = query.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!q) return WORLD_FIRST_ITEM_CATALOG.slice(0, limit).map((item) => ({ name: item.name, hsn: item.hsn }));
  const scored = WORLD_FIRST_ITEM_CATALOG.map((item) => {
    const name = item.name.toLowerCase();
    const hsn = item.hsn;
    const words = tokens(item.name);
    let score = 0;
    if (name === q) score += 100;
    if (name.startsWith(q)) score += 50;
    if (words.some((word) => word.startsWith(q))) score += 40;
    if (name.includes(q)) score += 20;
    if (hsn.startsWith(query.replace(/\D/g, "")) && query.replace(/\D/g, "").length >= 4) score += 60;
    return { item, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
  return scored.slice(0, limit).map((row) => ({ name: row.item.name, hsn: row.item.hsn }));
}

export function searchWorldFirstItems(query: string, extra: HsnCatalogItem[] = [], limit = 12): HsnCatalogItem[] {
  const seen = new Set<string>();
  const out: HsnCatalogItem[] = [];
  const push = (item: HsnCatalogItem) => {
    const name = item.name.trim();
    const hsn = normalizeWorldFirstHsn(item.hsn);
    if (!name || !isPlausibleWorldFirstHsn(hsn)) return;
    const key = `${name.toLowerCase()}|${hsn}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ name, hsn });
  };
  for (const item of searchWorldFirstCatalog(query, Math.max(limit, 20))) push(item);
  const q = query.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  for (const item of extra) {
    const name = item.name.trim();
    const hsn = normalizeWorldFirstHsn(item.hsn);
    if (!name || !isPlausibleWorldFirstHsn(hsn)) continue;
    if (q && !name.toLowerCase().includes(q) && !hsn.includes(q.replace(/\D/g, ""))) continue;
    push({ name, hsn });
  }
  return out.slice(0, limit);
}

export function matchWorldFirstItem(value?: string | null): HsnCatalogItem | undefined {
  const q = (value || "").trim().toLowerCase();
  if (!q) return undefined;
  return WORLD_FIRST_ITEM_CATALOG.find((item) => item.name.toLowerCase() === q);
}

export function isPlausibleWorldFirstHsn(value?: string | null): boolean {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits || digits.startsWith("999")) return false;
  return digits.length === 4 || digits.length === 6 || digits.length === 8;
}

export function normalizeWorldFirstHsn(value?: string | null): string {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits || digits.startsWith("999")) return "";
  if (digits.length >= 8) return digits.slice(0, 8);
  if (digits.length === 6) return `${digits}00`;
  if (digits.length === 4) {
    const match = WORLD_FIRST_ITEM_CATALOG.find((item) => item.hsn.startsWith(digits));
    return match?.hsn || `${digits}0000`;
  }
  return "";
}

export function lookupWorldFirstCity(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return WORLD_FIRST_CITIES.slice(0, 12);
  return WORLD_FIRST_CITIES.filter(
    (row) => row.city.toLowerCase().includes(q) || row.code.toLowerCase().includes(q),
  ).slice(0, 12);
}

export function volumetricKg(length: number, width: number, height: number, pieces = 1, division = 5000) {
  if (!(length > 0 && width > 0 && height > 0 && division > 0)) return 0;
  return (length * width * height * Math.max(1, pieces)) / division;
}

/** Keep TypeScript aware this helper is used by catalog merge fallbacks. */
export function worldFirstOrGenericHsn(name: string): string {
  return matchWorldFirstItem(name)?.hsn || searchWorldFirstCatalog(name, 1)[0]?.hsn || searchHsnCatalog(name, 1)[0]?.hsn || "";
}
