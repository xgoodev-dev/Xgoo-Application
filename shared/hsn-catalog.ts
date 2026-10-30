export type HsnCatalogItem = {
  name: string;
  hsn: string;
  aliases?: string[];
};

/** Common courier / export descriptions with GST HSN codes (performa item list). */
export const HSN_ITEM_CATALOG: HsnCatalogItem[] = [
  { name: "Documents / printed matter", hsn: "490199", aliases: ["document", "papers", "files"] },
  { name: "Books", hsn: "490110", aliases: ["printed books"] },
  { name: "Greeting cards / prints", hsn: "490900", aliases: ["cards"] },
  { name: "Clothes / garments", hsn: "610910", aliases: ["cloth", "cloths", "clothing", "apparel", "clothes", "garments"] },
  { name: "Cotton T-shirts", hsn: "610910", aliases: ["tshirt", "t-shirt", "clothes", "garments"] },
  { name: "Shirts", hsn: "620520", aliases: ["shirt", "clothes"] },
  { name: "Trousers / jeans", hsn: "620342", aliases: ["pants", "jeans", "clothes"] },
  { name: "Dresses / ladies garments", hsn: "620443", aliases: ["dress", "kurti", "clothes"] },
  { name: "Baby garments", hsn: "611120", aliases: ["infant", "kids clothes"] },
  { name: "Sweaters / jerseys", hsn: "611030", aliases: ["sweater", "hoodie"] },
  { name: "Worn clothing", hsn: "630900", aliases: ["used clothes", "personal effects"] },
  { name: "Home textiles / bed linen", hsn: "630231", aliases: ["bedsheet", "linen"] },
  { name: "Footwear", hsn: "640419", aliases: ["shoes", "sandals"] },
  { name: "Handbags", hsn: "420221", aliases: ["purse", "hand bag"] },
  { name: "Travel bags / luggage", hsn: "420212", aliases: ["suitcase", "trolley"] },
  { name: "Mobile phones", hsn: "851713", aliases: ["phone", "smartphone", "mobile"] },
  { name: "Laptops", hsn: "847130", aliases: ["notebook computer"] },
  { name: "Tablets", hsn: "847130", aliases: ["ipad"] },
  { name: "Headphones / earphones", hsn: "851830", aliases: ["earbuds", "headset"] },
  { name: "Phone chargers / adapters", hsn: "850440", aliases: ["charger", "adapter"] },
  { name: "Power banks", hsn: "850760", aliases: ["powerbank"] },
  { name: "Cameras", hsn: "852589", aliases: ["dslr"] },
  { name: "Watches", hsn: "910211", aliases: ["wrist watch"] },
  { name: "Sunglasses", hsn: "900410", aliases: ["goggles"] },
  { name: "Imitation jewellery", hsn: "711719", aliases: ["fashion jewellery"] },
  { name: "Cosmetics", hsn: "330499", aliases: ["makeup", "cream"] },
  { name: "Perfumes", hsn: "330300", aliases: ["fragrance"] },
  { name: "Shampoo / hair products", hsn: "330510", aliases: ["hair oil"] },
  { name: "Soap", hsn: "340111", aliases: ["bath soap"] },
  { name: "Medicines", hsn: "300490", aliases: ["tablets", "pharma"] },
  { name: "Dietary supplements", hsn: "210690", aliases: ["protein", "vitamins"] },
  { name: "Tea", hsn: "090230", aliases: ["tea leaves"] },
  { name: "Coffee", hsn: "090121", aliases: ["coffee beans"] },
  { name: "Spices", hsn: "091099", aliases: ["masala"] },
  { name: "Sweets / confectionery", hsn: "170490", aliases: ["mithai", "candy"] },
  { name: "Biscuits", hsn: "190531", aliases: ["cookies"] },
  { name: "Dry fruits / nuts", hsn: "080280", aliases: ["almonds", "cashew"] },
  { name: "Toys", hsn: "950300", aliases: ["soft toy"] },
  { name: "Sports goods", hsn: "950691", aliases: ["cricket", "fitness"] },
  { name: "Stationery", hsn: "482010", aliases: ["notebooks", "pens"] },
  { name: "Kitchenware", hsn: "392410", aliases: ["utensils"] },
  { name: "Plastic articles", hsn: "392690", aliases: ["plastic items"] },
  { name: "Wooden articles", hsn: "442199", aliases: ["wood craft"] },
  { name: "Handicrafts", hsn: "442010", aliases: ["craft", "gift"] },
  { name: "Samples", hsn: "999799", aliases: ["sample"] },
  { name: "Gifts / personal effects", hsn: "999799", aliases: ["gift", "unsolicited gift"] },
  { name: "Artwork / pictures", hsn: "491191", aliases: ["painting", "photo"] },
  { name: "Auto parts", hsn: "870899", aliases: ["spare parts"] },
  { name: "Electronic accessories", hsn: "854370", aliases: ["gadgets"] },
  { name: "Medical instruments", hsn: "901890", aliases: ["medical device"] },
  { name: "Sanitary products", hsn: "961900", aliases: ["hygiene"] },
];

function norm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function searchHsnCatalog(query: string, limit = 12): HsnCatalogItem[] {
  const q = norm(query);
  if (!q) return HSN_ITEM_CATALOG.slice(0, limit);
  const scored = HSN_ITEM_CATALOG.map((item) => {
    const hay = norm([item.name, item.hsn, ...(item.aliases || [])].join(" "));
    let score = 0;
    if (hay.startsWith(q) || norm(item.name).startsWith(q)) score += 40;
    if (item.hsn.startsWith(query.trim())) score += 50;
    if (hay.includes(q)) score += 20;
    for (const token of q.split(" ")) {
      if (token && hay.includes(token)) score += 8;
    }
    return { item, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
  return scored.slice(0, limit).map((row) => row.item);
}

export function mergeHsnItems(
  extra: HsnCatalogItem[],
  query: string,
  limit = 12,
): HsnCatalogItem[] {
  const q = norm(query);
  const seen = new Set<string>();
  const out: HsnCatalogItem[] = [];
  const push = (item: HsnCatalogItem) => {
    const name = item.name.trim();
    const hsn = item.hsn.trim();
    if (!name) return;
    const key = `${norm(name)}|${hsn}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ name, hsn });
  };
  const extraMatches = q
    ? extra.filter((item) => norm(`${item.name} ${item.hsn} ${(item.aliases || []).join(" ")}`).includes(q))
    : extra;
  for (const item of extraMatches) push(item);
  for (const item of searchHsnCatalog(query, limit)) push(item);
  return out.slice(0, limit);
}
