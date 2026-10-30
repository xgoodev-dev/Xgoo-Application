import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";
import type { Shipment } from "@shared/schema";
import {
  WORLD_FIRST_API_DEFAULT_BASE_URL,
  WORLD_FIRST_API_PATHS,
} from "@shared/world-first";
import { normalizeWorldFirstHsn, searchWorldFirstCatalog } from "@shared/world-first-hsn";
import {
  findWorldFirstMaster,
  worldFirstMasterCode,
  worldFirstMasterName,
  WORLD_FIRST_DESTINATIONS,
  WORLD_FIRST_PRODUCTS,
  WORLD_FIRST_SERVICES,
  WORLD_FIRST_STATIONS,
  WORLD_FIRST_VENDORS,
} from "@shared/world-first-masters";
import { db } from "../db";

export interface WorldFirstConfig {
  baseUrl: string;
  userId: string;
  password: string;
  product: string;
  vendor: string;
  service: string;
}

export function getWorldFirstConfigFromEnv(): WorldFirstConfig | null {
  const userId = process.env.WORLD_FIRST_API_USERNAME?.trim();
  const password = process.env.WORLD_FIRST_API_PASSWORD?.trim();
  if (!userId || !password) return null;
  return {
    baseUrl: (process.env.WORLD_FIRST_API_BASE_URL?.trim() || WORLD_FIRST_API_DEFAULT_BASE_URL).replace(
      /\/$/,
      "",
    ),
    userId,
    password,
    product: process.env.WORLD_FIRST_PRODUCT?.trim() || "",
    vendor: process.env.WORLD_FIRST_VENDOR?.trim() || "",
    service: process.env.WORLD_FIRST_SERVICE?.trim() || "",
  };
}

export function worldFirstConfigPublicStatus() {
  const config = getWorldFirstConfigFromEnv();
  return {
    configured: !!config,
    baseUrl: config?.baseUrl ?? null,
    hasProduct: Boolean(config?.product),
    hasVendor: Boolean(config?.vendor),
    hasService: Boolean(config?.service),
    product: config?.product || null,
    vendor: config?.vendor || null,
    service: config?.service || null,
    clientId: config?.userId || null,
  };
}

let columnsReady: Promise<void> | null = null;

export function ensureWorldFirstShipmentColumns(): Promise<void> {
  if (!columnsReady) {
    columnsReady = (async () => {
      await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS partner_product varchar(100)`);
      await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS partner_vendor varchar(100)`);
      await db.execute(sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS partner_service varchar(100)`);
    })().catch((error) => {
      columnsReady = null;
      throw error;
    });
  }
  return columnsReady;
}

function digits(value: string | null | undefined): string {
  return (value || "").replace(/\D/g, "");
}

function phone10(value: string | null | undefined): string {
  const d = digits(value);
  return d.slice(-10);
}

function splitAddress(address: string | null | undefined): { line1: string; line2: string } {
  const raw = (address || "").trim();
  if (!raw) return { line1: "", line2: "" };
  const comma = raw.indexOf(",");
  if (comma > 8 && comma < 80) {
    return { line1: raw.slice(0, comma).trim(), line2: raw.slice(comma + 1).trim() };
  }
  if (raw.length > 80) {
    return { line1: raw.slice(0, 80).trim(), line2: raw.slice(80).trim() };
  }
  return { line1: raw, line2: "" };
}

function num(value: unknown, fallback = "0"): string {
  const n = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? String(n) : fallback;
}

function countryCode(value: string | null | undefined, fallback = "IN"): string {
  const v = (value || "").trim().toUpperCase();
  if (!v) return fallback;
  if (/^[A-Z]{2}$/.test(v)) return v;
  const map: Record<string, string> = {
    INDIA: "IN",
    USA: "US",
    "UNITED STATES": "US",
    UK: "GB",
    "UNITED KINGDOM": "GB",
    CANADA: "CA",
    AUSTRALIA: "AU",
    UAE: "AE",
    GERMANY: "DE",
    FRANCE: "FR",
    SINGAPORE: "SG",
    "SAUDI ARABIA": "SA",
    QATAR: "QA",
    KUWAIT: "KW",
    OMAN: "OM",
    "NEW ZEALAND": "NZ",
    ITALY: "IT",
    NETHERLANDS: "NL",
    IRELAND: "IE",
    MALAYSIA: "MY",
    JAPAN: "JP",
    "SOUTH AFRICA": "ZA",
    "HONG KONG": "HK",
    CHINA: "CN",
    BANGLADESH: "BD",
    NEPAL: "NP",
    "SRI LANKA": "LK",
  };
  return map[v] || fallback;
}

function portalDate(value: string | null | undefined): string {
  const raw = (value || "").trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [yyyy, mm, dd] = raw.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }
  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
}

function partyPayload(kind: "shipper" | "consignee", shipment: Shipment) {
  const isShipper = kind === "shipper";
  const name = (isShipper ? shipment.senderName : shipment.receiverName) || "";
  const address = isShipper ? shipment.senderAddress : shipment.receiverAddress;
  const line2Extra = isShipper ? shipment.senderAddressLine2 : shipment.receiverAddressLine2;
  const lines = splitAddress(address);
  const line2 = [lines.line2, line2Extra].filter((part) => (part || "").trim()).join(", ");
  const city = (isShipper ? shipment.senderCity : shipment.receiverCity) || "";
  const state = (isShipper ? shipment.senderState : shipment.receiverState) || "";
  const pin =
    (isShipper ? shipment.senderPincode : shipment.receiverPincode) ||
    (!isShipper ? shipment.receiverAddressLine2 : "") ||
    "";
  const phone = phone10(isShipper ? shipment.senderPhone : shipment.receiverPhone);
  const email = (isShipper ? shipment.senderEmail : shipment.receiverEmail) || "";
  const country = (
    isShipper ? shipment.senderCountry : shipment.receiverCountry || shipment.destinationCountry
  ) || "INDIA";
  return {
    Name: name,
    ContactName: name,
    CompanyName: name,
    Company: name,
    Address1: lines.line1 || address || "",
    Address2: line2,
    City: city,
    State: state,
    Pincode: pin,
    Pin: pin,
    Mobile: phone,
    Telephone: phone,
    Phone: phone,
    Email: email,
    Country: country.toUpperCase(),
    GSTIN: shipment.gstin || "",
  };
}

export function buildWorldFirstAwbBody(shipment: Shipment, config: WorldFirstConfig): Record<string, unknown> {
  const shipper = partyPayload("shipper", shipment);
  const consignee = partyPayload("consignee", shipment);
  const pieces = Math.max(1, shipment.numberOfPieces ?? 1);
  const weight = num(shipment.chargeableWeight ?? shipment.weight, "0.5");
  const actual = num(shipment.weight, weight);
  const length = num(shipment.length, "10");
  const width = num(shipment.width, "10");
  const height = num(shipment.height, "10");
  const value = num(shipment.declaredValue, "0");
  const productRows = performaLines(shipment, value, actual);
  const contents = (
    shipment.contentDescription ||
    productRows.map((row) => row.Description).filter(Boolean).join(", ") ||
    "General goods"
  ).trim();
  const product = worldFirstMasterCode(WORLD_FIRST_PRODUCTS, shipment.partnerProduct || config.product);
  const vendor = worldFirstMasterCode(WORLD_FIRST_VENDORS, shipment.partnerVendor || config.vendor);
  const service =
    worldFirstMasterName(WORLD_FIRST_SERVICES, shipment.partnerService || config.service) ||
    (shipment.serviceType === "air" ? "AIR" : "SURFACE");
  const originMatch = findWorldFirstMaster(WORLD_FIRST_STATIONS, shipment.senderCity);
  const originName = originMatch?.name || (shipment.senderCity || "").trim();
  const originCode = originMatch?.code || "";
  const destinationMatch =
    findWorldFirstMaster(WORLD_FIRST_DESTINATIONS, shipment.receiverCity) ||
    findWorldFirstMaster(WORLD_FIRST_STATIONS, shipment.receiverCity);
  const destinationName =
    destinationMatch?.name ||
    (shipment.receiverCity || shipment.destinationCountry || "").trim();
  const destinationCode = destinationMatch?.code || "";
  const destCountry = countryCode(shipment.destinationCountry || consignee.Country, "IN");
  const isIntl = shipment.shipmentType === "international" || destCountry !== "IN";
  const gstin = (shipment.gstin || "").trim();
  const documentType = gstin ? "GSTIN (Normal)" : "Aadhaar Number";
  const documentNumber = gstin || (shipment.isDemo ? "123456789012" : "");
  const csbType =
    (shipment.customsDocumentType || "").toLowerCase() === "csb5" ? "CSB 5" : "CSB 4";
  const weight3 = Number.parseFloat(actual);
  const weightFmt = Number.isFinite(weight3) ? weight3.toFixed(3) : "0.500";
  const performa = (productRows.length > 0 ? productRows : [
    {
      Description: contents,
      Quantity: String(pieces),
      Weight: actual,
      HSN: firstProductHsn(shipment) || searchWorldFirstCatalog(contents, 1)[0]?.hsn || "98049000",
      Rate: value,
      Amount: value,
    },
  ]).map((row, index) => ({
    BoxNo: `Box-${index + 1}`,
    Description: row.Description,
    HSNCode: row.HSN || row.hsn || "98049000",
    Quantity: row.Quantity || "1",
    Unit: "PCS",
    Rate: row.Rate || row.Amount || value,
    Amount: row.Amount || value,
    Weight: row.Weight || actual,
    PerformaIGST: "0",
    PerformaIGSTAmount: "0",
  }));

  return {
    UserID: config.userId,
    Password: config.password,
    CustomerCode: config.userId,
    CustomerRefNo: shipment.bookingNumber,
    OriginName: originCode || originName || "HYD",
    DestinationName: isIntl ? destCountry : destinationCode || destinationName,
    ShipperName: shipper.Name,
    ShipperContact: shipper.ContactName,
    ShipperAdd1: shipper.Address1,
    ShipperAdd2: shipper.Address2,
    ShipperCity: shipper.City,
    ShipperState: shipper.State,
    ShipperPin: shipper.Pincode,
    ShipperTelno: shipper.Telephone,
    ShipperMobile: shipper.Mobile,
    ShipperEmail: shipper.Email,
    DocumentType: documentType,
    DocumentNumber: documentNumber,
    ConsigneeName: consignee.Name,
    ConsigneeContact: consignee.ContactName,
    ConsigneeAdd1: consignee.Address1,
    ConsigneeAdd2: consignee.Address2,
    ConsigneeCity: consignee.City,
    ConsigneeState: consignee.State,
    ConsigneePin: consignee.Pincode,
    ConsigneeTelno: consignee.Telephone,
    ConsigneeMobile: consignee.Mobile,
    ConsigneeEmail: consignee.Email,
    ConsigneeDocumentType: shipment.isDemo ? "Pan Number" : "",
    ConsigneeDocumentNumber: shipment.isDemo ? "1234567890" : "",
    Instruction: shipment.isDemo ? "XGoo test booking — do not dispatch" : "",
    VendorName: vendor,
    ServiceName: service,
    ProductCode: product,
    Dox_Spx: product === "DOX" ? "DOX" : "SPX",
    Pieces: String(pieces),
    Weight: weightFmt,
    Content: contents,
    Currency: shipment.currency || "INR",
    ShipmentValue: value,
    CODAmount: "0.00",
    CSBType: csbType,
    TermofInvoice: shipment.incoTerms || "DAP",
    InvoiceNo: shipment.invoiceNumber || shipment.bookingNumber,
    InvoiceDate: portalDate(shipment.invoiceDate || shipment.orderDate),
    CompanyCode: vendor || config.userId,
    IsCommercial: 0,
    IsMedical: 0,
    OTP: "123456",
    LSPType: isIntl ? "I" : "D",
    RequiredPerforma: "y",
    RequiredLable: "y",
    KYCDocumentType: documentType,
    KYCImage: "",
    ImageType: "PDF",
    ExportReason: shipment.shipmentPurpose || "UNSOLICITED GIFT - NOT FOR SALE",
    KYCImage1: "",
    ImageType1: "PDF",
    EAWBNO: "",
    EAWBDate: "",
    EAWBExpDate: "",
    Dimensions: [
      {
        ActualWeight: weightFmt,
        Vol_WeightL: length,
        Vol_WeightW: width,
        Vol_WeightH: height,
      },
    ],
    Performa: performa,
    additionalInfo: {
      discount: "0.00",
      Freight_Charges: num(shipment.shippingCharges, "0"),
      Insurance: "0.00",
      Other_charges: num(shipment.giftwrapCharges, "0"),
      SpecifyCharges: "0",
    },
    Buyerdetails: {
      DestinationCode: destCountry,
      Name: consignee.Name,
      Person: consignee.Name,
      Address1: consignee.Address1,
      Address2: consignee.Address2,
      PinCode: consignee.Pincode,
      City: consignee.City,
      State: consignee.State,
      Telephone: consignee.Telephone,
      Mobile: consignee.Mobile,
      Email: consignee.Email,
      countryCode: destCountry,
      IECNo: shipment.iec || "",
    },
    ManifestGstDetails: {
      GST_Invoice: "0",
      LUTIGST: "N",
      TotalIGST: "0.00",
      BankADCode: "",
      BankAccount: "",
      BankIFSC: "",
      LUTNumber: "",
      ExchangeRate: "0.00",
      Firm: "NG",
      NFEI: "1",
      PayofIGST: "0",
      ECommerce: "0",
      MEISScheme: "0",
      Format: "C2C",
      IECNo: shipment.iec || "",
      LUTIssueDate: "",
      LUTTillDate: "",
    },
  };
}

function firstProductHsn(shipment: Shipment): string | null {
  const products = Array.isArray(shipment.products) ? shipment.products : [];
  for (const row of products) {
    if (!row || typeof row !== "object") continue;
    const hsn = normalizeWorldFirstHsn(String((row as { hsn?: string }).hsn ?? ""));
    if (hsn) return hsn;
  }
  return null;
}

function performaLines(shipment: Shipment, fallbackValue: string, fallbackWeight: string) {
  const products = Array.isArray(shipment.products) ? shipment.products : [];
  const lines: Array<Record<string, string>> = [];
  for (const row of products) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const name = String(rec.name || "").trim();
    if (!name) continue;
    const qty = Math.max(1, Number.parseFloat(String(rec.units ?? "1")) || 1);
    const price = Number.parseFloat(String(rec.unitPrice ?? "0")) || 0;
    const discount = Number.parseFloat(String(rec.discount ?? "0")) || 0;
    const amount = Math.max(0, qty * price - discount);
    const weight = Number.parseFloat(String(rec.weight ?? "0")) || 0;
    lines.push({
      Description: name,
      Quantity: String(qty),
      Weight: String(weight || fallbackWeight),
      Packages: String(qty),
      HSN:
        normalizeWorldFirstHsn(String(rec.hsn || "")) ||
        firstProductHsn(shipment) ||
        searchWorldFirstCatalog(name, 1)[0]?.hsn ||
        "98049000",
      Rate: String(price),
      Amount: String(amount || fallbackValue),
      InvoiceValue: String(amount || fallbackValue),
    });
  }
  return lines;
}

async function worldFirstPost(
  config: WorldFirstConfig,
  apiPath: string,
  body: Record<string, unknown>,
): Promise<{ status: number; parsed: Record<string, unknown> }> {
  const res = await fetch(`${config.baseUrl}${apiPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  try {
    return { status: res.status, parsed: JSON.parse(text) as Record<string, unknown> };
  } catch {
    throw new Error(`World First returned invalid JSON (${res.status}): ${text.slice(0, 200)}`);
  }
}

function responseBag(parsed: Record<string, unknown>): Record<string, unknown> {
  const inner = parsed.Response;
  if (inner && typeof inner === "object") return inner as Record<string, unknown>;
  return parsed;
}

function errorList(bag: Record<string, unknown>): string {
  const errors = bag.Error;
  if (Array.isArray(errors)) {
    return errors
      .map((row) =>
        typeof row === "string"
          ? row
          : String((row as { Description?: string })?.Description || ""),
      )
      .filter(Boolean)
      .join(" • ");
  }
  return String(bag.ExceptionMessage || bag.ErrorDisc || bag.APIError || bag.Message || "").trim();
}

function isSuccess(bag: Record<string, unknown>): boolean {
  const status = String(bag.Status || "").toLowerCase();
  const code = String(bag.ResponseCode || "");
  const errorCode = String(bag.ErrorCode ?? bag.StatusCode ?? "");
  return status === "success" || code === "RT01" || errorCode === "0";
}

function extractAwb(bag: Record<string, unknown>): string {
  return String(bag.AWBNo || bag.ForwardingNo || bag.ForwardingNo1 || "").trim();
}

export async function checkWorldFirstDestination(
  config: WorldFirstConfig,
  query: string,
): Promise<{ ok: boolean; label: string | null; message: string }> {
  const q = query.trim();
  if (!q) return { ok: false, label: null, message: "Choose a destination country." };
  try {
    const { parsed } = await worldFirstPost(config, WORLD_FIRST_API_PATHS.destination, {
      UserID: config.userId,
      Password: config.password,
      DestinationName: q,
      SearchText: q,
      Prefix: q,
    });
    const bag = responseBag(parsed);
    const rows = (
      Array.isArray(bag.Data)
        ? bag.Data
        : Array.isArray(bag.Destination)
          ? bag.Destination
          : Array.isArray(parsed)
            ? parsed
            : []
    ) as Array<Record<string, unknown>>;
    const labels = rows
      .map((row) =>
        String(row.DestinationName || row.Name || row.DestinationCode || row.Code || "").trim(),
      )
      .filter(Boolean);
    const hit =
      labels.find((name) => name.toUpperCase() === q.toUpperCase()) ||
      labels.find((name) => name.toUpperCase().includes(q.toUpperCase())) ||
      labels[0];
    if (hit) {
      return { ok: true, label: hit, message: `World First destination ${hit}` };
    }
  } catch {
    /* fall through to portal master */
  }
  const local =
    findWorldFirstMaster(WORLD_FIRST_DESTINATIONS, q) ||
    WORLD_FIRST_DESTINATIONS.find((row) => row.code.toUpperCase() === q.toUpperCase());
  if (local) {
    return {
      ok: true,
      label: `${local.name} (${local.code})`,
      message: `World First destination ${local.name} (${local.code})`,
    };
  }
  return { ok: false, label: null, message: `World First has no destination for ${q}.` };
}

export async function pingWorldFirstApi(
  config: WorldFirstConfig,
): Promise<{ ok: boolean; message: string }> {
  try {
    const { parsed } = await worldFirstPost(config, WORLD_FIRST_API_PATHS.tracking, {
      UserID: config.userId,
      Password: config.password,
      AWBNo: "XGOO-PING",
    });
    const bag = responseBag(parsed);
    const message = errorList(bag);
    if (/invalid userid and password/i.test(message)) {
      return { ok: false, message: "World First rejected the UserID or password in .env." };
    }
    return {
      ok: true,
      message: `World First API reachable at ${config.baseUrl}. Tracking accepted the credentials.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not reach World First.",
    };
  }
}

export interface WorldFirstCreateResult {
  awb: string;
  forwardingNo: string | null;
  labelUrl?: string;
  raw: unknown;
}

export async function createWorldFirstShipment(
  config: WorldFirstConfig,
  shipment: Shipment,
): Promise<WorldFirstCreateResult> {
  const body = buildWorldFirstAwbBody(shipment, config);
  const { status, parsed } = await worldFirstPost(config, WORLD_FIRST_API_PATHS.awbEntry, body);
  const bag = responseBag(parsed);
  const awb = extractAwb(bag);
  if (status >= 500 || !isSuccess(bag) || !awb) {
    const detail = errorList(bag) || `HTTP ${status}`;
    throw new Error(
      `World First did not create the AWB: ${detail}. Check Product, Vendor and Service match Xpresion AWB Entry.`,
    );
  }

  let labelUrl: string | undefined;
  const embedded = String(bag.Pdfdownload || bag.Label || "").trim();
  if (embedded) {
    labelUrl = (await saveWorldFirstPdf(awb, embedded)) || undefined;
    const invoiceB64 = String(bag.Performa || "").trim();
    if (invoiceB64 && invoiceB64 !== embedded) {
      await saveWorldFirstPdf(awb, invoiceB64, "-invoice");
    }
  } else {
    try {
      const printed = await printWorldFirstAwb(config, awb);
      labelUrl = printed.labelUrl;
    } catch {
      /* print is retried from Partner sync */
    }
  }

  return {
    awb,
    forwardingNo: String(bag.ForwardingNo || bag.ForwardingNo1 || "").trim() || null,
    labelUrl,
    raw: parsed,
  };
}

export interface WorldFirstTrackScan {
  status: string;
  location: string | null;
  at: string | null;
}

export interface WorldFirstTrackResult {
  awb: string;
  status: string;
  origin: string | null;
  destination: string | null;
  vendor: string | null;
  scans: WorldFirstTrackScan[];
  raw: unknown;
}

export async function trackWorldFirstShipment(
  config: WorldFirstConfig,
  awb: string,
): Promise<WorldFirstTrackResult> {
  const { parsed } = await worldFirstPost(config, WORLD_FIRST_API_PATHS.tracking, {
    UserID: config.userId,
    Password: config.password,
    AWBNo: awb.trim(),
  });
  const bag = responseBag(parsed);
  if (!isSuccess(bag)) {
    throw new Error(errorList(bag) || "World First tracking failed.");
  }
  const rows = (bag.Tracking as Array<Record<string, unknown>> | undefined) ?? [];
  const head = rows[0] ?? {};
  const events = (bag.Events as Array<Record<string, unknown>> | undefined) ?? [];
  return {
    awb: String(head.AWBNo || awb),
    status: String(head.Status || "Unknown"),
    origin: (head.Origin as string) || null,
    destination: (head.Destination as string) || null,
    vendor: (head.VendorName as string) || (head.Vendor_Code as string) || null,
    scans: events.map((event) => ({
      status: String(event.Status || ""),
      location: (event.Location as string) || null,
      at: [event.EventDate1 || event.EventDate, event.EventTime1 || event.EventTime]
        .filter(Boolean)
        .join(" "),
    })),
    raw: parsed,
  };
}

export async function cancelWorldFirstAwb(config: WorldFirstConfig, awb: string): Promise<void> {
  const { parsed } = await worldFirstPost(config, WORLD_FIRST_API_PATHS.cancelAwb, {
    UserID: config.userId,
    Password: config.password,
    AWBNo: awb.trim(),
  });
  const bag = responseBag(parsed);
  const message = errorList(bag) || String(bag.Message || "");
  if (/already/i.test(message) && /cancel/i.test(message)) return;
  const statusCode = String(bag.StatusCode ?? bag.ErrorCode ?? "");
  if (statusCode === "0" || /success/i.test(String(bag.Status || message))) return;
  if (/data not found/i.test(message)) {
    throw new Error(`World First has no AWB ${awb} to cancel.`);
  }
  if (message && !isSuccess(bag)) {
    throw new Error(message);
  }
}

export interface WorldFirstPrintResult {
  awb: string;
  forwardingNo: string | null;
  pdfBase64: string;
  labelUrl: string;
  invoiceUrl: string | null;
  boxLabelUrl: string | null;
}

function uploadDir(): string {
  const dir = process.env.VERCEL ? path.join("/tmp", "uploads") : path.join(process.cwd(), "uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function awbFileSafe(awb: string): string {
  return awb.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40) || "awb";
}

async function saveWorldFirstPdf(awb: string, base64: string, suffix = ""): Promise<string | null> {
  const cleaned = base64.replace(/^data:application\/pdf;base64,/i, "").trim();
  if (!cleaned) return null;
  const buf = Buffer.from(cleaned, "base64");
  if (buf.length < 20 || buf.subarray(0, 4).toString() !== "%PDF") return null;
  const filename = `wf-${awbFileSafe(awb)}${suffix}.pdf`;
  await fs.promises.writeFile(path.join(uploadDir(), filename), buf);
  return `/objects/${filename}`;
}

export async function printWorldFirstAwb(
  config: WorldFirstConfig,
  awb: string,
): Promise<WorldFirstPrintResult> {
  const { parsed } = await worldFirstPost(config, WORLD_FIRST_API_PATHS.printAwb, {
    UserID: config.userId,
    Password: config.password,
    AWBNo: awb.trim(),
  });
  const bag = responseBag(parsed);
  if (!isSuccess(bag)) {
    throw new Error(errorList(bag) || "World First Print AWB failed.");
  }
  const printedAwb = String(bag.AWBNo || awb).trim() || awb.trim();
  const labelB64 = String(bag.Pdfdownload || bag.Label || "").trim();
  const invoiceB64 = String(bag.Performa || bag.Invoice || "").trim();
  const boxB64 = String(bag.boxlbl || bag.AuxLbl || "").trim();
  const labelUrl = await saveWorldFirstPdf(printedAwb, labelB64);
  if (!labelUrl) {
    throw new Error("World First Print AWB returned no PDF.");
  }
  const invoiceUrl = invoiceB64 && invoiceB64 !== labelB64 ? await saveWorldFirstPdf(printedAwb, invoiceB64, "-invoice") : null;
  const boxLabelUrl = boxB64 && boxB64 !== labelB64 ? await saveWorldFirstPdf(printedAwb, boxB64, "-box") : null;
  return {
    awb: printedAwb,
    forwardingNo: String(bag.ForwardingNo || bag.ForwardingNo1 || "").trim() || null,
    pdfBase64: labelB64,
    labelUrl,
    invoiceUrl,
    boxLabelUrl,
  };
}
