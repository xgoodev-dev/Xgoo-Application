import {
  buildDelhiveryShipmentBody,
  DELHIVERY_DEFAULT_BASE_URL,
  DELHIVERY_PRODUCTION_BASE_URL,
  DELHIVERY_STAGING_BASE_URL,
  type DelhiveryCreateInput,
} from "@shared/delhivery";

export interface DelhiveryConfig {
  apiToken: string;
  pickupLocation: string;
  baseUrl: string;
  clientName: string | null;
  sellerGstTin: string | null;
  hsnCode: string | null;
  pickupTime: string;
  skipPickup: boolean;
}

function envFlag(value: string | undefined): boolean {
  const v = (value ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function getDelhiveryConfigFromEnv(): DelhiveryConfig | null {
  const apiToken = process.env.DELHIVERY_API_TOKEN?.trim();
  const pickupLocation = process.env.DELHIVERY_PICKUP_LOCATION?.trim();
  if (!apiToken || !pickupLocation) return null;

  const baseUrl = (process.env.DELHIVERY_API_BASE_URL?.trim() || DELHIVERY_DEFAULT_BASE_URL).replace(
    /\/$/,
    "",
  );

  return {
    apiToken,
    pickupLocation,
    baseUrl,
    clientName: process.env.DELHIVERY_CLIENT_NAME?.trim() || null,
    sellerGstTin: process.env.DELHIVERY_SELLER_GST_TIN?.trim() || null,
    hsnCode: process.env.DELHIVERY_HSN_CODE?.trim() || "999799",
    pickupTime: process.env.DELHIVERY_PICKUP_TIME?.trim() || "16:00:00",
    skipPickup: envFlag(process.env.DELHIVERY_SKIP_PICKUP),
  };
}

export function delhiveryConfigPublicStatus() {
  const config = getDelhiveryConfigFromEnv();
  return {
    configured: !!config,
    baseUrl: config?.baseUrl ?? null,
    pickupLocation: config?.pickupLocation ?? null,
    clientName: config?.clientName ?? null,
    skipPickup: config?.skipPickup ?? false,
    environment: config?.baseUrl?.includes("track.delhivery.com") ? "production" : "staging",
  };
}

function authHeaders(config: DelhiveryConfig, json = false): HeadersInit {
  return {
    Authorization: `Token ${config.apiToken}`,
    Accept: "application/json",
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

function formatNetworkError(error: unknown): string {
  if (!(error instanceof Error)) return "Network error";
  const parts: string[] = [];
  let current: unknown = error;
  const seen = new Set<unknown>();
  while (current && !seen.has(current) && seen.size < 5) {
    seen.add(current);
    if (current instanceof Error) {
      const extra = current as Error & { code?: string; syscall?: string };
      const detail = [extra.message, extra.code, extra.syscall].filter(Boolean).join(" ");
      if (detail && !parts.includes(detail)) parts.push(detail);
      current = extra.cause;
      continue;
    }
    break;
  }
  return parts.join(" — ") || "Network error";
}

async function delhiveryGet(url: string, config: DelhiveryConfig): Promise<Response> {
  return fetch(url, {
    headers: authHeaders(config),
    signal: AbortSignal.timeout(20_000),
  });
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`Delhivery returned invalid JSON (${res.status}): ${text.slice(0, 200)}`);
  }
}

function delhiveryErrorMessage(parsed: Record<string, unknown>, fallback: string): string {
  const pkg = Array.isArray(parsed.packages)
    ? (parsed.packages[0] as Record<string, unknown> | undefined)
    : undefined;
  return (
    (pkg?.remarks as string) ||
    (parsed.remark as string) ||
    (parsed.rmk as string) ||
    (parsed.error as string) ||
    (parsed.message as string) ||
    (parsed.detail as string) ||
    fallback
  );
}

function formatCreateFailure(
  parsed: Record<string, unknown>,
  config: DelhiveryConfig,
  status: number,
): string {
  const rmk = delhiveryErrorMessage(parsed, `HTTP ${status}`);
  if (rmk.toLowerCase().includes("shipment list contains no data")) {
    return (
      `Delhivery still could not read this order. Open Delhivery One → Settings → Pickup Locations ` +
      `and copy the warehouse name exactly into DELHIVERY_PICKUP_LOCATION (now "${config.pickupLocation}"). ` +
      `Do not use the sender name or company legal name unless that is the warehouse name. Restart npm run dev, then retry.`
    );
  }
  return `Delhivery did not create the shipment: ${rmk}`;
}

function pinCodeUrl(baseUrl: string, pincode: string): string {
  return `${baseUrl}/c/api/pin-codes/json/?filter_codes=${encodeURIComponent(pincode)}`;
}

function alternateDelhiveryBaseUrl(baseUrl: string): string | null {
  if (baseUrl.includes("staging-express.delhivery.com")) return DELHIVERY_PRODUCTION_BASE_URL;
  if (baseUrl.includes("track.delhivery.com")) return DELHIVERY_STAGING_BASE_URL;
  return null;
}

function flagYes(value: unknown): boolean {
  return String(value ?? "").trim().toUpperCase() === "Y";
}

function flagNo(value: unknown): boolean {
  return String(value ?? "").trim().toUpperCase() === "N";
}

export async function pingDelhiveryApi(config: DelhiveryConfig): Promise<{ ok: boolean; message: string }> {
  const url = pinCodeUrl(config.baseUrl, "500049");
  try {
    const res = await delhiveryGet(url, config);
    if (res.status === 401 || res.status === 403) {
      const otherBase = alternateDelhiveryBaseUrl(config.baseUrl);
      if (otherBase) {
        const otherRes = await delhiveryGet(pinCodeUrl(otherBase, "500049"), {
          ...config,
          baseUrl: otherBase,
        });
        if (otherRes.ok) {
          return {
            ok: false,
            message: `This token works on ${otherBase}, but .env points at ${config.baseUrl}. Live tokens need https://track.delhivery.com. Staging tokens need https://staging-express.delhivery.com. Update DELHIVERY_API_BASE_URL and restart npm run dev.`,
          };
        }
      }
      return {
        ok: false,
        message:
          "Delhivery rejected the API token. A Live token only works on https://track.delhivery.com. After you click Request Live API Token, the previous token stops working — paste the new token into .env and restart npm run dev.",
      };
    }
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, message: `Delhivery ping failed (${res.status}): ${text.slice(0, 160)}` };
    }
    return {
      ok: true,
      message: `Delhivery API reachable (${config.baseUrl}, warehouse ${config.pickupLocation}).`,
    };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      return {
        ok: false,
        message: `Could not reach Delhivery at ${config.baseUrl} (timed out after 20s). Staging must be reachable from this machine.`,
      };
    }
    return { ok: false, message: `Could not reach Delhivery: ${formatNetworkError(error)}` };
  }
}

export async function checkDelhiveryPincode(
  config: DelhiveryConfig,
  pincode: string,
): Promise<{ serviceable: boolean; prepaid: boolean; message: string }> {
  const pin = pincode.trim();
  const res = await delhiveryGet(pinCodeUrl(config.baseUrl, pin), config);
  const parsed = await readJson(res);
  if (!res.ok) {
    throw new Error(`Delhivery pincode check failed (${res.status}): ${delhiveryErrorMessage(parsed, "unknown error")}`);
  }
  const codes = parsed.delivery_codes as Array<{ postal_code?: Record<string, unknown> }> | undefined;
  const postal = codes?.[0]?.postal_code;
  if (!postal) {
    return { serviceable: false, prepaid: false, message: `Delhivery does not service pincode ${pin}.` };
  }
  const prepaidFlag = postal.pre_paid ?? postal.prepaid;
  const prepaid = flagNo(prepaidFlag) ? false : flagYes(prepaidFlag) || Boolean(postal.center) || flagYes(postal.cash);
  if (!prepaid) {
    return { serviceable: false, prepaid: false, message: `Pincode ${pin} is not prepaid-serviceable on Delhivery.` };
  }
  const hub = Array.isArray(postal.center)
    ? String((postal.center[0] as { cn?: string } | undefined)?.cn || "")
    : "";
  return {
    serviceable: true,
    prepaid: true,
    message: hub ? `Pincode ${pin} is serviceable (${hub}).` : `Pincode ${pin} is serviceable.`,
  };
}

export interface DelhiveryCreateResult {
  waybill: string;
  raw: unknown;
}

export async function createDelhiveryShipment(
  config: DelhiveryConfig,
  input: DelhiveryCreateInput,
): Promise<DelhiveryCreateResult> {
  const body = buildDelhiveryShipmentBody({
    ...input,
    pickupLocation: config.pickupLocation,
    clientName: input.clientName ?? config.clientName,
    sellerGstTin: input.sellerGstTin ?? config.sellerGstTin,
    hsnCode: input.hsnCode ?? config.hsnCode,
  });
  // Delhivery splits the raw body on `data=` and JSON-parses the rest.
  // Percent-encoding or `+` for spaces makes that parse fail → "shipment list contains no data".
  const formBody = `format=json&data=${JSON.stringify(body)}`;

  const res = await fetch(`${config.baseUrl}/api/cmu/create.json`, {
    method: "POST",
    headers: {
      ...authHeaders(config),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody,
  });

  const parsed = await readJson(res);
  const packages = parsed.packages as Array<Record<string, unknown>> | undefined;
  const pkg = packages?.[0];
  const status = String(pkg?.status ?? parsed.success ?? "").toLowerCase();
  const waybill = (pkg?.waybill as string) || (parsed.waybill as string);
  const failed =
    !res.ok ||
    parsed.success === false ||
    status === "fail" ||
    status === "false" ||
    !waybill;

  if (failed) {
    console.warn("[delhivery] create failed", {
      http: res.status,
      success: parsed.success,
      rmk: parsed.rmk ?? parsed.remark ?? parsed.error,
      packageCount: parsed.package_count,
      pickup: config.pickupLocation,
    });
    throw new Error(formatCreateFailure(parsed, config, res.status));
  }

  return { waybill: String(waybill), raw: parsed };
}

export async function cancelDelhiveryShipment(config: DelhiveryConfig, waybill: string): Promise<void> {
  const wbn = waybill.trim();
  const res = await fetch(`${config.baseUrl}/api/p/edit`, {
    method: "POST",
    headers: authHeaders(config, true),
    body: JSON.stringify({
      waybill: wbn,
      cancellation: "true",
    }),
  });
  const parsed = await readJson(res);
  const rmk = delhiveryErrorMessage(parsed, "").toLowerCase();
  if (rmk.includes("already") && (rmk.includes("cancel") || rmk.includes("return"))) {
    return;
  }
  const failed =
    !res.ok ||
    parsed.success === false ||
    parsed.status === false ||
    parsed.error === true;
  if (failed) {
    throw new Error(`Delhivery did not cancel ${wbn}: ${delhiveryErrorMessage(parsed, `HTTP ${res.status}`)}`);
  }
}

export interface DelhiveryPickupResult {
  pickupId: string | null;
  raw: unknown;
}

function kolkataParts(offsetDays = 0): { date: string; hour: number } {
  const when = new Date(Date.now() + offsetDays * 86_400_000);
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(when);
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(when),
  );
  return { date, hour };
}

export function nextDelhiveryPickupSlot(pickupTime: string): { pickup_date: string; pickup_time: string } {
  const { hour } = kolkataParts(0);
  const useTomorrow = hour >= 17;
  const { date } = kolkataParts(useTomorrow ? 1 : 0);
  const time = /^\d{2}:\d{2}:\d{2}$/.test(pickupTime) ? pickupTime : "16:00:00";
  return { pickup_date: date, pickup_time: time };
}

export async function requestDelhiveryPickup(
  config: DelhiveryConfig,
  expectedPackageCount = 1,
): Promise<DelhiveryPickupResult> {
  const slot = nextDelhiveryPickupSlot(config.pickupTime);
  const res = await fetch(`${config.baseUrl}/fm/request/new/`, {
    method: "POST",
    headers: authHeaders(config, true),
    body: JSON.stringify({
      pickup_time: slot.pickup_time,
      pickup_date: slot.pickup_date,
      pickup_location: config.pickupLocation,
      expected_package_count: expectedPackageCount,
    }),
  });
  const parsed = await readJson(res);
  if (!res.ok) {
    throw new Error(
      `Delhivery pickup request failed (${res.status}): ${delhiveryErrorMessage(parsed, "unknown error")}`,
    );
  }
  const pickupId = parsed.pickup_id != null ? String(parsed.pickup_id) : null;
  return { pickupId, raw: parsed };
}

export interface DelhiveryTrackScan {
  status: string;
  location: string | null;
  at: string | null;
  instructions: string | null;
}

export interface DelhiveryTrackResult {
  waybill: string;
  status: string;
  origin: string | null;
  destination: string | null;
  scans: DelhiveryTrackScan[];
  raw: unknown;
}

export async function trackDelhiveryShipment(
  config: DelhiveryConfig,
  waybill: string,
): Promise<DelhiveryTrackResult> {
  const params = new URLSearchParams({
    token: config.apiToken,
    waybill: waybill.trim(),
  });
  const res = await fetch(`${config.baseUrl}/api/v1/packages/json/?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  const parsed = await readJson(res);
  if (!res.ok || parsed.Error) {
    throw new Error(
      `Delhivery tracking failed: ${String(parsed.Error || delhiveryErrorMessage(parsed, `HTTP ${res.status}`))}`,
    );
  }
  const rows = parsed.ShipmentData as Array<{ Shipment?: Record<string, unknown> }> | undefined;
  const shipment = rows?.[0]?.Shipment;
  if (!shipment) {
    throw new Error(`Delhivery has no tracking data for ${waybill}.`);
  }
  const statusObj = (shipment.Status as Record<string, unknown> | undefined) ?? {};
  const scansRaw = (shipment.Scans as Array<{ ScanDetail?: Record<string, unknown> }> | undefined) ?? [];
  const scans: DelhiveryTrackScan[] = scansRaw.map((row) => {
    const detail = row.ScanDetail ?? {};
    return {
      status: String(detail.Scan || detail.Instructions || ""),
      location: (detail.ScannedLocation as string) || null,
      at: (detail.ScanDateTime as string) || null,
      instructions: (detail.Instructions as string) || null,
    };
  });
  return {
    waybill: String(shipment.AWB || waybill),
    status: String(statusObj.Status || "Unknown"),
    origin: (shipment.Origin as string) || null,
    destination: (shipment.Destination as string) || null,
    scans,
    raw: parsed,
  };
}

export async function fetchDelhiveryPackingSlipUrl(
  config: DelhiveryConfig,
  waybill: string,
): Promise<string | null> {
  const res = await fetch(
    `${config.baseUrl}/api/p/packing_slip?wbns=${encodeURIComponent(waybill.trim())}`,
    { headers: authHeaders(config) },
  );
  if (!res.ok) return null;
  try {
    const parsed = await readJson(res);
    const packages = parsed.packages as Array<Record<string, unknown>> | undefined;
    const link =
      (packages?.[0]?.pdf_download_lnk as string) ||
      (packages?.[0]?.pdf_download_link as string) ||
      (parsed.pdf_download_lnk as string) ||
      null;
    return link;
  } catch {
    return null;
  }
}
