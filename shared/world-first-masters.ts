import catalog from "./world-first-masters.json";

export type WorldFirstMasterRow = {
  name: string;
  code: string;
  vendorCode?: string;
};

export const WORLD_FIRST_PRODUCTS: WorldFirstMasterRow[] = catalog.product;
export const WORLD_FIRST_VENDORS: WorldFirstMasterRow[] = catalog.vendor;
export const WORLD_FIRST_SERVICES: WorldFirstMasterRow[] = catalog.service;
export const WORLD_FIRST_ORIGINS: WorldFirstMasterRow[] = catalog.origin;
export const WORLD_FIRST_DESTINATIONS: WorldFirstMasterRow[] = catalog.destination;

function uniq(rows: WorldFirstMasterRow[]): WorldFirstMasterRow[] {
  const seen = new Set<string>();
  const out: WorldFirstMasterRow[] = [];
  for (const row of rows) {
    const key = `${row.name}|${row.code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/** Origin hubs plus destination stations, so both HYDERABAD/HYD and A S PETA/A01 are searchable. */
export const WORLD_FIRST_STATIONS: WorldFirstMasterRow[] = uniq([
  ...WORLD_FIRST_ORIGINS,
  ...WORLD_FIRST_DESTINATIONS,
]);

export function findWorldFirstMaster(
  rows: WorldFirstMasterRow[],
  value?: string | null,
): WorldFirstMasterRow | undefined {
  const v = (value || "").trim().toLowerCase();
  if (!v) return undefined;
  return rows.find((row) => row.name.toLowerCase() === v || row.code.toLowerCase() === v);
}

export function servicesForVendor(vendorValue?: string | null): WorldFirstMasterRow[] {
  const vendor = findWorldFirstMaster(WORLD_FIRST_VENDORS, vendorValue);
  if (!vendor) return [];
  const code = vendor.code.toUpperCase();
  const exact = WORLD_FIRST_SERVICES.filter(
    (row) => (row.vendorCode || "").toUpperCase() === code,
  );
  if (exact.length > 0) return exact;
  if (code.startsWith("DHL")) {
    return WORLD_FIRST_SERVICES.filter((row) =>
      (row.vendorCode || "").toUpperCase().startsWith("DHL"),
    );
  }
  return [];
}

export function searchWorldFirstMasters(
  rows: WorldFirstMasterRow[],
  query: string,
  vendorCode?: string,
): WorldFirstMasterRow[] {
  const scoped = vendorCode
    ? rows.filter((row) => (row.vendorCode || "").toUpperCase() === vendorCode.toUpperCase())
    : rows;
  const q = query.trim().toLowerCase();
  if (!q) return scoped;
  return scoped.filter(
    (row) =>
      row.name.toLowerCase().includes(q) ||
      row.code.toLowerCase().includes(q) ||
      (row.vendorCode || "").toLowerCase().includes(q),
  );
}

export function worldFirstMasterCode(
  rows: WorldFirstMasterRow[],
  value?: string | null,
): string {
  return findWorldFirstMaster(rows, value)?.code || (value || "").trim();
}

export function worldFirstMasterName(
  rows: WorldFirstMasterRow[],
  value?: string | null,
): string {
  return findWorldFirstMaster(rows, value)?.name || (value || "").trim();
}
