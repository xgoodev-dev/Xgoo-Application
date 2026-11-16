import fs from "fs";
import path from "path";
import type { Shipment } from "@shared/schema";
import type { ErpCourierBrand } from "@shared/erp-courier";

export type ErpCourierConfig = {
  brand: ErpCourierBrand;
  name: string;
  origin: string;
  loginUrl: string;
  username: string;
  password: string;
  appCode: string;
};

type CookieJar = {
  header: () => string;
  absorb: (res: Response) => void;
  load: (cookie: string) => void;
};

type PortalSession = {
  cookie: string;
  expiresAt: number;
};

const sessions = new Map<ErpCourierBrand, PortalSession>();

function uploadDir(): string {
  const dir = process.env.VERCEL ? path.join("/tmp", "uploads") : path.join(process.cwd(), "uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function originFrom(url: string): string {
  return new URL(url).origin;
}

function loginUrlFrom(url: string, fallbackPath: string): string {
  const parsed = new URL(url);
  if (!parsed.pathname || parsed.pathname === "/") {
    parsed.pathname = fallbackPath;
  }
  return parsed.toString();
}

export function getErpCourierConfig(brand: ErpCourierBrand): ErpCourierConfig | null {
  if (brand === "st") {
    const username = process.env.ST_COURIER_USERNAME?.trim();
    const password = process.env.ST_COURIER_PASSWORD?.trim();
    const portal = process.env.ST_COURIER_PORTAL_URL?.trim();
    if (!username || !password || !portal) return null;
    return {
      brand,
      name: "ST Couriers",
      origin: originFrom(portal),
      loginUrl: loginUrlFrom(portal, "/indexnew.php"),
      username,
      password,
      appCode: "ST",
    };
  }
  const username = process.env.FRANCH_COURIER_USERNAME?.trim();
  const password = process.env.FRANCH_COURIER_PASSWORD?.trim();
  const portal = process.env.FRANCH_COURIER_PORTAL_URL?.trim();
  if (!username || !password || !portal) return null;
  return {
    brand,
    name: "Franch Couriers",
    origin: originFrom(portal),
    loginUrl: loginUrlFrom(portal, "/indexnew.php"),
    username,
    password,
    appCode: "FN",
  };
}

export function erpCourierPublicStatus() {
  const st = getErpCourierConfig("st");
  const franch = getErpCourierConfig("franch");
  return {
    st: { configured: !!st, origin: st?.origin ?? null },
    franch: { configured: !!franch, origin: franch?.origin ?? null },
  };
}

function cookieJar(): CookieJar {
  const jar = new Map<string, string>();
  const put = (cookie: string) => {
    for (const part of cookie.split("; ")) {
      const i = part.indexOf("=");
      if (i > 0) jar.set(part.slice(0, i), part.slice(i + 1));
    }
  };
  return {
    header() {
      return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    absorb(res: Response) {
      const setter = (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() || [];
      for (const row of setter) put(row.split(";")[0]);
    },
    load(cookie: string) {
      put(cookie);
    },
  };
}

function inputValue(html: string, name: string): string {
  const named = html.match(new RegExp(`<input[^>]*name=["']${name}["'][^>]*>`, "i"))?.[0];
  if (!named) return "";
  return (named.match(/value=["']([^"']*)["']/i) || [])[1] || "";
}

function digits(value: string | null | undefined): string {
  return (value || "").replace(/\D/g, "");
}

function phone10(value: string | null | undefined): string {
  return digits(value).slice(-10);
}

function money(value: string | number | null | undefined): string {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value || "0"));
  if (!Number.isFinite(n) || n < 0) return "0";
  return n.toFixed(2);
}

function todayDmy(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

function splitAddress(shipment: Shipment, side: "sender" | "receiver") {
  const primary = side === "sender" ? shipment.senderAddress : shipment.receiverAddress;
  const line2 = side === "sender" ? shipment.senderAddressLine2 : shipment.receiverAddressLine2;
  const landmark = side === "sender" ? shipment.senderLandmark : shipment.receiverLandmark;
  const parts = [primary, line2, landmark].map((row) => (row || "").trim()).filter(Boolean);
  return {
    add1: parts[0] || "",
    add2: parts[1] || "",
    add3: parts[2] || "",
  };
}

async function portalFetch(
  config: ErpCourierConfig,
  jar: CookieJar,
  pathOrUrl: string,
  init: { method?: string; body?: BodyInit; contentType?: string; referer?: string } = {},
): Promise<{ status: number; location: string | null; url: string; text: string }> {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${config.origin}${pathOrUrl}`;
  const headers: Record<string, string> = {
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    Cookie: jar.header(),
    Origin: config.origin,
    Referer: init.referer || config.loginUrl,
  };
  if (init.contentType) headers["Content-Type"] = init.contentType;
  const res = await fetch(url, {
    method: init.method || "GET",
    body: init.body,
    redirect: "manual",
    headers,
    signal: AbortSignal.timeout(45_000),
  });
  jar.absorb(res);
  const text = await res.text();
  return {
    status: res.status,
    location: res.headers.get("location"),
    url: res.url,
    text,
  };
}

async function loginPortal(config: ErpCourierConfig): Promise<CookieJar> {
  const jar = cookieJar();
  await portalFetch(config, jar, config.loginUrl, { referer: config.loginUrl });
  const login = await portalFetch(config, jar, config.loginUrl, {
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    referer: config.loginUrl,
    body: new URLSearchParams({
      username: config.username,
      password: config.password,
      LOGIN: "Log In",
    }).toString(),
  });
  if (login.status >= 400 && login.status !== 302) {
    throw new Error(`${config.name} portal login failed.`);
  }
  const next = login.location ? new URL(login.location, config.origin).toString() : `${config.origin}/home.php`;
  const home = await portalFetch(config, jar, next, { referer: config.loginUrl });
  if (/name=["']password["']/i.test(home.text) || /loginform/i.test(home.text)) {
    throw new Error(`${config.name} portal login was rejected. Check the username and password.`);
  }
  return jar;
}

async function withPortal<T>(config: ErpCourierConfig, fn: (jar: CookieJar) => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = sessions.get(config.brand);
  let jar = cookieJar();
  if (cached && cached.expiresAt > now) {
    jar.load(cached.cookie);
  } else {
    jar = await loginPortal(config);
    sessions.set(config.brand, {
      cookie: jar.header(),
      expiresAt: now + 8 * 60 * 1000,
    });
  }
  try {
    return await fn(jar);
  } catch (error) {
    sessions.delete(config.brand);
    throw error;
  }
}

async function readPhoto(objectPath: string | undefined): Promise<{ bytes: Buffer; filename: string; type: string } | null> {
  if (!objectPath) return null;
  const name = objectPath.replace(/^\/objects\//, "").split("?")[0];
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) return null;
  const filePath = path.join(uploadDir(), name);
  try {
    const bytes = await fs.promises.readFile(filePath);
    if (!bytes.length) return null;
    const ext = path.extname(name).toLowerCase();
    const type = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return { bytes, filename: name, type };
  } catch {
    return null;
  }
}

function parseTilde(text: string): string[] {
  return text.split("~").map((part) => part.trim());
}

export async function pingErpCourier(brand: ErpCourierBrand): Promise<{ ok: boolean; message: string }> {
  const config = getErpCourierConfig(brand);
  if (!config) {
    return {
      ok: false,
      message: `${brand === "st" ? "ST Couriers" : "Franch Couriers"} portal is not configured. Set the portal URL, username, and password in env, then restart Hub.`,
    };
  }
  try {
    await withPortal(config, async (jar) => {
      const home = await portalFetch(config, jar, "/home.php");
      if (/name=["']password["']/i.test(home.text)) {
        throw new Error("Session did not reach the dashboard.");
      }
    });
    return { ok: true, message: `${config.name} portal login succeeded at ${config.origin}.` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : `${config.name} portal login failed.`,
    };
  }
}

export async function createErpCourierBooking(
  brand: ErpCourierBrand,
  shipment: Shipment,
): Promise<{ awb: string }> {
  const config = getErpCourierConfig(brand);
  if (!config) {
    throw new Error(
      `${brand === "st" ? "ST Couriers" : "Franch Couriers"} portal credentials are missing. Add them to env and restart Hub.`,
    );
  }
  const awb = (shipment.awbNumber || shipment.externalAwb || "").trim();
  if (!awb) {
    throw new Error(`Enter the physical ${config.name} AWB from the shipper before booking.`);
  }
  const destPin = (shipment.receiverPincode || "").trim();
  if (!/^\d{6}$/.test(destPin)) {
    throw new Error(`${config.name} booking needs a 6-digit destination pincode.`);
  }

  const photos = shipment.packagePhotoUrls || [];
  const invoice = (await readPhoto(photos[0])) || (await readPhoto(photos[1]));
  const goods = (await readPhoto(photos[1])) || invoice;
  if (!invoice || !goods) {
    throw new Error(`${config.name} needs parcel photos (invoice copy and goods image) before Hub can save the AWB on their portal.`);
  }

  const base = Number.parseFloat(String(shipment.baseAmount || "0")) || 0;
  const gst = Number.parseFloat(String(shipment.gstAmount || "0")) || 0;
  const total = Number.parseFloat(String(shipment.totalAmount || "0")) || base + gst;
  const amount = base > 0 ? base : total;
  const gstValue = gst > 0 ? gst : Math.max(0, total - amount);
  const gstRate = amount > 0 && gstValue > 0 ? Math.round((gstValue / amount) * 100) : 18;
  const weight = String(shipment.chargeableWeight || shipment.weight || "0");
  const pieces = String(shipment.numberOfPieces || 1);
  const from = splitAddress(shipment, "sender");
  const to = splitAddress(shipment, "receiver");
  const docType = (shipment.contentDescription || "").trim() ? "N" : "D";
  const transMode = shipment.serviceType === "air" ? "A" : "S";

  return withPortal(config, async (jar) => {
    const page = await portalFetch(config, jar, "/ba_booking.php", { referer: `${config.origin}/home.php` });
    if (/name=["']password["']/i.test(page.text)) {
      throw new Error(`${config.name} session expired before AWB entry.`);
    }
    const appCode = inputValue(page.text, "app_code") || config.appCode;
    const frmState = inputValue(page.text, "frm_state");
    const frmHub = inputValue(page.text, "frm_hub_id");
    const frmSc = inputValue(page.text, "frm_sc_id");
    const bkDate = inputValue(page.text, "bk_date") || todayDmy();

    const awbCheck = await portalFetch(config, jar, "/inc/pdo_ajax/jquery_check_awbno.php", {
      method: "POST",
      contentType: "application/x-www-form-urlencoded",
      referer: `${config.origin}/ba_booking.php`,
      body: new URLSearchParams({
        app_code: appCode,
        awb_no: awb,
        mode: "CHECKWITHISSUE",
      }).toString(),
    });
    const awbParts = parseTilde(awbCheck.text);
    if (!(Number.parseInt(awbParts[1] || "0", 10) > 0)) {
      throw new Error(awbParts[2] || `${config.name} rejected AWB ${awb}. Use a shipper issued to this store.`);
    }

    const pinCheck = await portalFetch(config, jar, "/inc/cis_ajax/jquery_get_pincode.php", {
      method: "POST",
      contentType: "application/x-www-form-urlencoded",
      referer: `${config.origin}/ba_booking.php`,
      body: new URLSearchParams({ pincode: destPin }).toString(),
    });
    const pinParts = parseTilde(pinCheck.text);
    if (!(Number.parseInt(pinParts[1] || "0", 10) > 0)) {
      throw new Error(`${config.name} does not service pincode ${destPin}.`);
    }

    const form = new FormData();
    const fields: Record<string, string> = {
      frm_state: frmState,
      frm_hub_id: frmHub,
      frm_sc_id: frmSc,
      app_code: appCode,
      sms_booking: inputValue(page.text, "sms_booking") || "0",
      fn_slno: inputValue(page.text, "fn_slno"),
      mcr_weight: "",
      cust_type: "1",
      cust_refno: shipment.bookingNumber || "",
      cust_id: "",
      cust_division: "",
      frm_phone: phone10(shipment.senderPhone),
      frm_add_id: "0",
      frm_add_update: "1",
      frm_name: shipment.senderName || "",
      frm_add1: from.add1,
      frm_add2: from.add2,
      frm_add3: from.add3,
      frm_pincode: (shipment.senderPincode || "").trim(),
      to_phone: phone10(shipment.receiverPhone),
      to_add_id: "0",
      to_add_update: "1",
      to_name: shipment.receiverName || "",
      to_add1: to.add1,
      to_add2: to.add2,
      to_add3: to.add3,
      to_pincode: destPin,
      to_area: pinParts[7] || shipment.receiverCity || "",
      to_sec_type: shipment.shipmentType === "international" ? "I" : "D",
      to_state: pinParts[2] || "",
      current_state: "",
      to_country: "",
      to_hub_id: pinParts[3] || "",
      current_hub: "",
      to_sc_id: pinParts[4] || "",
      current_sc: "",
      coc_id: "",
      goods_id: "",
      goods_name: shipment.contentDescription || "PARCEL",
      goods_value: money(shipment.declaredValue),
      hide_img_invoice: "",
      hide_img_items: "",
      awb_type: "P",
      awb_no: awb,
      awb_no_next: "",
      awb_status: "1",
      logical_awbno: "0",
      bk_date: bkDate,
      doc_type: docType,
      trans_mode: transMode,
      bk_qty: pieces,
      bk_weight: weight,
      mc_wht: weight,
      add_vol_weight: "",
      bk_vol_weight: shipment.volumetricWeight || "",
      bk_amt: money(amount),
      bk_fuel_add: "0",
      bk_fuel: "0",
      fuel_amt: "0",
      fuel_per: "0",
      bk_other_amt: "0",
      bk_gst_val: money(gstValue),
      bk_gst_rate: String(gstRate || 18),
      bk_total: money(total || amount + gstValue),
      txtHid: "0",
      added_qty: "0",
      SAVE: "SAVE",
    };
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value ?? "");
    }
    form.append("img_invoice", new Blob([invoice.bytes], { type: invoice.type }), invoice.filename);
    form.append("img_items", new Blob([goods.bytes], { type: goods.type }), goods.filename);

    const saved = await portalFetch(config, jar, "/ba_booking.php", {
      method: "POST",
      referer: `${config.origin}/ba_booking.php`,
      body: form,
    });
    const html = saved.text || "";
    if (/name=["']password["']/i.test(html)) {
      throw new Error(`${config.name} asked for login again. Booking was not saved.`);
    }
    const lowered = html.toLowerCase();
    if (lowered.includes("invalid awb") || lowered.includes("awb stock not available")) {
      throw new Error(`${config.name} did not accept AWB ${awb}.`);
    }
    if (
      lowered.includes("success") ||
      lowered.includes("saved") ||
      saved.status === 302 ||
      /ba_booking\.php/i.test(saved.location || "")
    ) {
      return { awb };
    }
    return { awb };
  });
}
