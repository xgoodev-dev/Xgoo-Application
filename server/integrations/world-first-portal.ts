import { WORLD_FIRST_API_DEFAULT_BASE_URL } from "@shared/world-first";
import {
  findWorldFirstMaster,
  WORLD_FIRST_DESTINATIONS,
  WORLD_FIRST_ORIGINS,
  WORLD_FIRST_PRODUCTS,
  WORLD_FIRST_SERVICES,
  WORLD_FIRST_STATIONS,
  WORLD_FIRST_VENDORS,
  worldFirstMasterCode,
  worldFirstMasterName,
} from "@shared/world-first-masters";
import { getWorldFirstConfigFromEnv } from "./world-first";

export type WorldFirstWallet = {
  limit: number;
  used: number;
  balance: number;
  unbilled: number;
};

export type WorldFirstPendingAwb = Record<string, string | number | boolean | null>;

type PortalSession = {
  cookie: string;
  expiresAt: number;
};

let portalSession: PortalSession | null = null;

function baseUrl(): string {
  const config = getWorldFirstConfigFromEnv();
  return (config?.baseUrl || WORLD_FIRST_API_DEFAULT_BASE_URL).replace(/\/$/, "");
}

function hiddenFields(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of html.matchAll(/<input[^>]*>/gi)) {
    const tag = match[0];
    const name = (tag.match(/name=["']([^"']+)["']/i) || [])[1];
    if (!name) continue;
    out[name] = (tag.match(/value=["']([^"']*)["']/i) || [])[1] || "";
  }
  return out;
}

function mergeCookies(jar: Map<string, string>, res: Response) {
  const setter = (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() || [];
  for (const row of setter) {
    const part = row.split(";")[0];
    const i = part.indexOf("=");
    if (i > 0) jar.set(part.slice(0, i), part.slice(i + 1));
  }
}

async function portalFetch(
  jar: Map<string, string>,
  path: string,
  init: { method?: string; body?: string; contentType?: string; accept?: string; referer?: string } = {},
): Promise<{ status: number; location: string | null; text: string; buffer: Buffer }> {
  const res = await fetch(`${baseUrl()}${path}`, {
    redirect: "manual",
    method: init.method || "GET",
    body: init.body,
    headers: {
      Accept: init.accept || "application/json, text/javascript, */*; q=0.01",
      Cookie: [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; "),
      Origin: baseUrl(),
      Referer: init.referer || `${baseUrl()}/DayEnd/DayEnd`,
      "X-Requested-With": "XMLHttpRequest",
      ...(init.body ? { "Content-Type": init.contentType || "application/json; charset=utf-8" } : {}),
    },
    signal: AbortSignal.timeout(45_000),
  });
  mergeCookies(jar, res);
  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    status: res.status,
    location: res.headers.get("location"),
    text: buffer.toString("utf8"),
    buffer,
  };
}

async function loginPortal(): Promise<Map<string, string>> {
  const config = getWorldFirstConfigFromEnv();
  if (!config) throw new Error("World First API is not configured on the server.");
  const jar = new Map<string, string>();
  const home = await portalFetch(jar, "/", { accept: "text/html" });
  const fields = hiddenFields(home.text);
  fields.UserName = config.userId;
  fields.Password = config.password;
  const login = await portalFetch(jar, "/Login/LoginValidate", {
    method: "POST",
    body: new URLSearchParams(fields).toString(),
    contentType: "application/x-www-form-urlencoded",
    accept: "text/html",
  });
  if (login.status >= 400 && login.status !== 302) {
    throw new Error("World First portal login failed.");
  }
  await portalFetch(jar, "/Dashboard/Dashboard", { accept: "text/html" });
  return jar;
}

async function withPortal<T>(fn: (jar: Map<string, string>) => Promise<T>): Promise<T> {
  const now = Date.now();
  let jar = new Map<string, string>();
  if (portalSession && portalSession.expiresAt > now) {
    for (const part of portalSession.cookie.split("; ")) {
      const i = part.indexOf("=");
      if (i > 0) jar.set(part.slice(0, i), part.slice(i + 1));
    }
  } else {
    jar = await loginPortal();
    portalSession = {
      cookie: [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; "),
      expiresAt: now + 8 * 60 * 1000,
    };
  }
  try {
    return await fn(jar);
  } catch (error) {
    portalSession = null;
    throw error;
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("World First portal returned a non-JSON response. Try again after login.");
  }
}

export function formatWorldFirstDay(date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export async function getWorldFirstWallet(): Promise<WorldFirstWallet> {
  return withPortal(async (jar) => {
    const res = await portalFetch(jar, "/Dashboard/GetCreditControlData", {
      method: "POST",
      body: "{}",
    });
    const data = parseJson(res.text) as Record<string, unknown>;
    return {
      limit: Number(data.creditpct ?? 0) || 0,
      used: Number(data.contAmt ?? 0) || 0,
      balance: Number(data.closBal ?? 0) || 0,
      unbilled: Number(data.UnBillAmt ?? 0) || 0,
    };
  });
}

export async function listWorldFirstPendingAwbs(input: {
  fromDate: string;
  toDate: string;
  vendorCode?: string;
}): Promise<WorldFirstPendingAwb[]> {
  return withPortal(async (jar) => {
    const res = await portalFetch(jar, "/DayEnd/AddpendingAWB", {
      method: "POST",
      body: JSON.stringify({
        txtDayEnd: input.fromDate,
        txtToEndDate: input.toDate,
        ddlBook: "",
        txtpenvendorCode: input.vendorCode || "",
      }),
    });
    if (res.status >= 400) {
      const err = parseJson(res.text) as { message?: string };
      throw new Error(err.message || "Could not load pending World First AWBs.");
    }
    const parsed = parseJson(res.text);
    return Array.isArray(parsed) ? (parsed as WorldFirstPendingAwb[]) : [];
  });
}

export async function searchWorldFirstManifests(input: {
  fromDate: string;
  toDate: string;
  vendorCode?: string;
}): Promise<{ error: string; result: WorldFirstPendingAwb[] }> {
  return withPortal(async (jar) => {
    const res = await portalFetch(jar, "/DayEnd/SearchManifestData", {
      method: "POST",
      body: JSON.stringify({
        txtfromdate: input.fromDate,
        txttodate: input.toDate,
        hdnvendcode: input.vendorCode || "",
      }),
    });
    const parsed = parseJson(res.text) as { error?: string; result?: WorldFirstPendingAwb[] };
    return {
      error: String(parsed.error || ""),
      result: Array.isArray(parsed.result) ? parsed.result : [],
    };
  });
}

export async function generateWorldFirstManifest(input: {
  awbs: string[];
  generatePickup?: boolean;
}): Promise<{ message: string }> {
  const awbs = input.awbs.map((awb) => awb.trim()).filter(Boolean);
  if (awbs.length === 0) throw new Error("Select at least one pending AWB to manifest.");
  return withPortal(async (jar) => {
    const details = JSON.stringify(awbs.map((awb, index) => ({ SrNo: index, AWBNo: awb })));
    const res = await portalFetch(jar, "/DayEnd/GenerateDayEndData", {
      method: "POST",
      body: JSON.stringify({
        AWBDetails: details,
        generatepickupchckbx: input.generatePickup ? "1" : "0",
      }),
    });
    const parsed = parseJson(res.text) as { Resp_Code?: number; Resp_Message?: string; Message?: string };
    if (Number(parsed.Resp_Code) === 1) {
      throw new Error(parsed.Resp_Message || parsed.Message || "World First could not generate the manifest.");
    }
    return { message: parsed.Resp_Message || parsed.Message || `Manifested ${awbs.length} AWB(s).` };
  });
}

export async function printWorldFirstManifest(manifestNo: string, type: "label" | "AWB" = "AWB"): Promise<Buffer> {
  return withPortal(async (jar) => {
    const click = await portalFetch(jar, "/Report/print_click", {
      method: "POST",
      body: JSON.stringify({
        awbno: "",
        Type: type,
        custmanino: manifestNo,
        newtype: "M",
      }),
    });
    const parsed = parseJson(click.text) as { error?: string };
    if (parsed.error) throw new Error(parsed.error);
    const pdf = await portalFetch(jar, `/Report/btn_printAll?Type=${encodeURIComponent(type)}&DownloadType=attachment`, {
      accept: "application/pdf,*/*",
    });
    if (pdf.buffer.length < 20) throw new Error("World First did not return a manifest PDF.");
    return pdf.buffer;
  });
}

export type WorldFirstRateQuote = {
  vendor: string;
  vendorCode: string;
  product: string;
  productCode: string;
  service: string;
  country: string;
  destination: string;
  originCode: string;
  toPinCode: string | null;
  amount: number;
  otherCharges: number;
  fuel: number;
  total: number;
  tax: number;
  grandTotal: number;
  displayDays: number | null;
  fromDate: string;
};

export type WorldFirstRateRequest = {
  originCity?: string | null;
  originCode?: string | null;
  destinationCountry: string;
  destinationName?: string | null;
  toPinCode?: string | null;
  weightKg: number;
  volumetricKg?: number | null;
  packageType?: "document" | "package";
  product?: string | null;
  vendor?: string | null;
  service?: string | null;
};

const rateCache = new Map<string, { value: WorldFirstRateQuote[]; expiresAt: number }>();

function moneyValue(value: unknown): number {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function daysValue(value: unknown): number | null {
  const n = Number.parseInt(String(value ?? "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function isRateHeader(row: Record<string, unknown>): boolean {
  return String(row.Vendor || "") === "Vendor" || String(row.Amount || "") === "Amount";
}

export function resolveWorldFirstOrigin(
  city?: string | null,
  code?: string | null,
): { name: string; code: string } | null {
  const byCode =
    findWorldFirstMaster(WORLD_FIRST_ORIGINS, code) || findWorldFirstMaster(WORLD_FIRST_STATIONS, code);
  if (byCode) return { name: byCode.name, code: byCode.code };
  const byCity =
    findWorldFirstMaster(WORLD_FIRST_ORIGINS, city) || findWorldFirstMaster(WORLD_FIRST_STATIONS, city);
  if (byCity) return { name: byCity.name, code: byCity.code };
  const query = (city || "").trim().toLowerCase();
  if (!query) return null;
  const fuzzy = WORLD_FIRST_ORIGINS.find(
    (row) => query.includes(row.name.toLowerCase()) || row.name.toLowerCase().includes(query),
  );
  return fuzzy ? { name: fuzzy.name, code: fuzzy.code } : null;
}

function resolveWorldFirstDestination(country: string, name?: string | null): { name: string; code: string } {
  const match =
    findWorldFirstMaster(WORLD_FIRST_DESTINATIONS, country) ||
    findWorldFirstMaster(WORLD_FIRST_DESTINATIONS, name);
  if (match) return { name: match.name, code: match.code };
  const code = country.trim().toUpperCase();
  return { name: name?.trim() || code, code };
}

function kgText(value: number): string {
  return (Math.round(Math.max(0, value) * 1000) / 1000).toFixed(3);
}

export async function getWorldFirstCustomerRates(
  input: WorldFirstRateRequest,
): Promise<WorldFirstRateQuote[]> {
  const config = getWorldFirstConfigFromEnv();
  if (!config) throw new Error("World First API is not configured on the server.");
  const origin = resolveWorldFirstOrigin(input.originCity, input.originCode);
  if (!origin) {
    throw new Error("World First needs an origin station (for example HYD / Hyderabad).");
  }
  const destination = resolveWorldFirstDestination(input.destinationCountry, input.destinationName);
  const productCode =
    worldFirstMasterCode(WORLD_FIRST_PRODUCTS, input.product) ||
    (input.packageType === "document" ? "DOX" : "SPX");
  const vendorCode = worldFirstMasterCode(WORLD_FIRST_VENDORS, input.vendor);
  const serviceType = worldFirstMasterName(WORLD_FIRST_SERVICES, input.service);
  const weightKg = Number.isFinite(input.weightKg) ? input.weightKg : 0;
  if (weightKg <= 0) throw new Error("Enter a weight greater than zero for World First rates.");
  const volumetricKg = input.volumetricKg && input.volumetricKg > 0 ? input.volumetricKg : 0;
  const toPinCode = (input.toPinCode || "").trim() || "";
  const cacheKey = [
    origin.code,
    destination.code,
    toPinCode,
    kgText(weightKg),
    kgText(volumetricKg),
    productCode,
    vendorCode,
    serviceType,
  ].join("|");
  const cached = rateCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const rows = await withPortal(async (jar) => {
    const res = await portalFetch(jar, "/CustomerRateCompare/GetCustomerRate", {
      method: "POST",
      body: JSON.stringify({
        searchdata: {
          CustomerCode: config.userId,
          VendorCode: vendorCode,
          ProductCode: productCode,
          DestinationCode: destination.code,
          Destination: destination.name,
          ServiceType: serviceType,
          Weight: kgText(weightKg),
          VolWeight: kgText(volumetricKg || weightKg),
          OriginCode: origin.code,
          ToPinCode: toPinCode,
        },
      }),
      referer: `${baseUrl()}/CustomerRateCompare/CustomerRateCompare`,
    });
    const parsed = parseJson(res.text) as { error?: string; result?: Array<Record<string, unknown>> };
    const error = String(parsed.error || "").trim();
    if (error && !/no record found/i.test(error)) {
      throw new Error(error);
    }
    return Array.isArray(parsed.result) ? parsed.result : [];
  });

  const quotes = rows
    .filter((row) => row && !isRateHeader(row))
    .map((row) => ({
      vendor: String(row.Vendor || "").trim(),
      vendorCode: String(row.Vendor_Code || vendorCode || "").trim(),
      product: String(row.Product || "").trim(),
      productCode: String(row.Prod_Code || productCode).trim(),
      service: String(row.Service || serviceType || "").trim(),
      country: String(row.Country || destination.name).trim(),
      destination: String(row.Destination || destination.name).trim(),
      originCode: origin.code,
      toPinCode: toPinCode || null,
      amount: moneyValue(row.Amount),
      otherCharges: moneyValue(row["Other Charges"]),
      fuel: moneyValue(row.Fuel),
      total: moneyValue(row.Total),
      tax: moneyValue(row.Tax),
      grandTotal: moneyValue(row["Grand Total"]),
      displayDays: daysValue(row["Display Days"]),
      fromDate: String(row["From Date"] || "").trim(),
    }))
    .filter((row) => row.grandTotal > 0 || row.amount > 0)
    .sort((a, b) => a.grandTotal - b.grandTotal);

  rateCache.set(cacheKey, { value: quotes, expiresAt: Date.now() + 10 * 60 * 1000 });
  return quotes;
}
