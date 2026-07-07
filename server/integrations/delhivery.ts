import {
  buildDelhiveryShipmentBody,
  DELHIVERY_DEFAULT_BASE_URL,
  type DelhiveryCreateInput,
} from "@shared/delhivery";

export interface DelhiveryConfig {
  apiToken: string;
  pickupLocation: string;
  baseUrl: string;
}

export function getDelhiveryConfigFromEnv(): DelhiveryConfig | null {
  const apiToken = process.env.DELHIVERY_API_TOKEN?.trim();
  const pickupLocation = process.env.DELHIVERY_PICKUP_LOCATION?.trim();
  if (!apiToken || !pickupLocation) return null;

  const baseUrl = (process.env.DELHIVERY_API_BASE_URL?.trim() || DELHIVERY_DEFAULT_BASE_URL).replace(
    /\/$/,
    "",
  );

  return { apiToken, pickupLocation, baseUrl };
}

export interface DelhiveryCreateResult {
  waybill: string;
  raw: unknown;
}

export async function createDelhiveryShipment(
  config: DelhiveryConfig,
  input: DelhiveryCreateInput,
): Promise<DelhiveryCreateResult> {
  const body = buildDelhiveryShipmentBody(input);
  const data = JSON.stringify(body);

  const res = await fetch(`${config.baseUrl}/api/cmu/create.json`, {
    method: "POST",
    headers: {
      Authorization: `Token ${config.apiToken}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ format: "json", data }).toString(),
  });

  const text = await res.text();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`Delhivery returned invalid JSON (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    const msg =
      (parsed.remark as string) ||
      (parsed.error as string) ||
      (parsed.message as string) ||
      text.slice(0, 200);
    throw new Error(`Delhivery API error (${res.status}): ${msg}`);
  }

  const packages = parsed.packages as Array<Record<string, unknown>> | undefined;
  const pkg = packages?.[0];
  const waybill = (pkg?.waybill as string) || (parsed.waybill as string);

  if (!waybill) {
    const err =
      (pkg?.remarks as string) ||
      (parsed.rmk as string) ||
      JSON.stringify(parsed).slice(0, 300);
    throw new Error(`Delhivery did not return AWB: ${err}`);
  }

  return { waybill: String(waybill), raw: parsed };
}
