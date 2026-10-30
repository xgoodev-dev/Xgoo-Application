import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const userId = process.env.WORLD_FIRST_API_USERNAME?.trim();
const password = process.env.WORLD_FIRST_API_PASSWORD?.trim();
const base = (process.env.WORLD_FIRST_API_BASE_URL?.trim() || "https://xpresion.worldfirst.in").replace(/\/$/, "");
const cookieJar = new Map();
function storeCookies(res) {
  for (const row of res.headers.getSetCookie?.() || []) {
    const part = row.split(";")[0];
    const i = part.indexOf("=");
    if (i > 0) cookieJar.set(part.slice(0, i), part.slice(i + 1));
  }
}
async function req(url, init = {}) {
  const res = await fetch(url, {
    redirect: "manual",
    method: init.method || "GET",
    body: init.body,
    headers: {
      Accept: init.accept || "application/json, text/javascript, */*; q=0.01",
      Cookie: [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join("; "),
      Origin: base,
      Referer: `${base}/Dashboard/Dashboard`,
      "X-Requested-With": "XMLHttpRequest",
      ...(init.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    signal: AbortSignal.timeout(60_000),
  });
  storeCookies(res);
  return { status: res.status, text: await res.text() };
}
function hiddenFields(html) {
  const out = {};
  for (const match of html.matchAll(/<input[^>]*>/gi)) {
    const tag = match[0];
    const name = (tag.match(/name=["']([^"']+)["']/i) || [])[1];
    if (!name) continue;
    out[name] = (tag.match(/value=["']([^"']*)["']/i) || [])[1] || "";
  }
  return out;
}
function rowsFrom(text) {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function pick(row, names) {
  for (const name of names) {
    const value = row?.[name];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return "";
}

const home = await req(`${base}/`, { accept: "text/html" });
const fields = hiddenFields(home.text);
fields.UserName = userId;
fields.Password = password;
await req(`${base}/Login/LoginValidate`, { method: "POST", body: new URLSearchParams(fields), accept: "text/html" });
await req(`${base}/Dashboard/Dashboard`, { accept: "text/html" });

async function getJson(url) {
  const res = await req(`${base}${url}`);
  return { status: res.status, rows: rowsFrom(res.text) };
}

const originRaw = (await getJson("/Help/BindLocation?ContextKey=")).rows;
const destRaw = (await getJson("/Help/BindDestTable?ContextKey=")).rows;
const vendorRaw = (await getJson("/Help/BindVendor?ContextKey=")).rows;
const productRaw = (await getJson("/Help/BindProduct?ContextKey=")).rows;

const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
async function searchAll(path) {
  const rows = [];
  for (const ch of alphabet) {
    const found = (await getJson(`${path}?ContextKey=&searchtext=${encodeURIComponent(ch)}`)).rows;
    rows.push(...found);
  }
  return rows;
}

const originSearch = await searchAll("/Help/BindLocationHelpSearch");
const destSearch = await searchAll("/Help/BindDestinationHelpSearch");
const vendorSearch = await searchAll("/Help/BindVendorHelpSearch");
const productSearch = await searchAll("/Help/BindProductHelpSearch");
const serviceSearch = await searchAll("/Help/BindServiceHelpSearch");

const serviceMap = new Map();
for (const row of serviceSearch) {
  const name = pick(row, ["serv_name", "Service", "Name", "ServiceName"]);
  const vendorCode = pick(row, ["vendor_name", "VendorCode", "Vendor"]);
  if (!name) continue;
  serviceMap.set(`${name}|${vendorCode}`, { name, code: name, vendorCode });
}

function uniq(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = `${row.name}|${row.code}|${row.vendorCode || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const catalog = {
  fetchedAt: new Date().toISOString(),
  origin: uniq(
    [...originRaw, ...originSearch]
      .map((row) => ({
        name: pick(row, ["Loc_Name", "BRANCH_NAME", "Name"]),
        code: pick(row, ["Loc_Code", "BRANCH_CODE", "Code"]),
      }))
      .filter((r) => r.name && r.code),
  ),
  destination: uniq(
    [...destRaw, ...destSearch]
      .map((row) => ({
        name: pick(row, ["BRANCH_NAME", "Loc_Name", "Name", "DEST_NAME", "Destination"]),
        code: pick(row, ["BRANCH_CODE", "Loc_Code", "Code", "DEST_CODE"]),
      }))
      .filter((r) => r.name && r.code),
  ),
  vendor: uniq(
    [...vendorRaw, ...vendorSearch]
      .map((row) => ({
        name: pick(row, ["VENDOR_NAME", "Name"]),
        code: pick(row, ["VENDOR_CODE", "Code"]),
      }))
      .filter((r) => r.name && r.code),
  ),
  product: uniq(
    [...productRaw, ...productSearch]
      .map((row) => ({
        name: pick(row, ["PRODNAME", "Name"]),
        code: pick(row, ["PRODCODE", "Code"]),
      }))
      .filter((r) => r.name && r.code),
  ),
  service: uniq([...serviceMap.values()]),
};

fs.writeFileSync(path.join(root, "shared", "world-first-masters.json"), JSON.stringify(catalog, null, 2));
console.log(JSON.stringify({
  counts: {
    origin: catalog.origin.length,
    destination: catalog.destination.length,
    vendor: catalog.vendor.length,
    product: catalog.product.length,
    service: catalog.service.length,
  },
  destSample: catalog.destination.slice(0, 3),
  destTail: catalog.destination.slice(-3),
  vendors: catalog.vendor,
  products: catalog.product,
  services: catalog.service,
  origins: catalog.origin,
}, null, 2));
