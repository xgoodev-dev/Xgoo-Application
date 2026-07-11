import {
  normalizeWhatsAppPhone,
  parseTemplateParamCounts,
  resolveWhatsAppGraphBase,
  type WhatsAppSettings,
  type WhatsAppTemplate,
} from "@shared/whatsapp";

export interface WhatsAppApiConfig {
  accessToken: string;
  wabaId: string;
  phoneNumberId: string;
  apiVersion?: string;
}

export interface MetaGraphErrorDetails {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
  httpStatus?: number;
  requestPath?: string;
  raw?: unknown;
}

export class MetaGraphApiError extends Error {
  readonly details: MetaGraphErrorDetails;

  constructor(details: MetaGraphErrorDetails) {
    super(details.message);
    this.name = "MetaGraphApiError";
    this.details = details;
  }
}

export function formatMetaGraphError(error: unknown): MetaGraphErrorDetails {
  if (error instanceof MetaGraphApiError) {
    return error.details;
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: String(error) };
}

/** Actionable hints for common Meta WhatsApp errors shown in the staff UI. */
const META_ERROR_HINTS: Record<number, string> = {
  190:
    " Your access token has expired. In Meta Developer Console → WhatsApp → API Setup, click Generate access token, paste the new token into Access Token here, then Save. Temporary tokens last about 1 hour — for production use a permanent System User token.",
  131037:
    " Your WhatsApp business display name is not approved yet. In Meta Business Suite → WhatsApp → Phone numbers, check Display Name status (must be Approved, not Pending or Rejected). Review usually takes 24–48 hours.",
  132012:
    " Template parameters do not match the approved template. Re-sync templates and fill all required fields (including image header URL if applicable).",
  132000:
    " Wrong number of template parameters. Re-sync templates and fill every placeholder.",
  132001:
    " That template name/language is not on your WhatsApp account. Sync templates from Meta and use the exact language code shown (e.g. en, not en_US). hello_world only exists on Meta's default test setup — use welcome_message on your own WABA.",
};

function withMetaErrorHint(code: number | undefined, message: string): string {
  if (!code) return message;
  const hint = META_ERROR_HINTS[code];
  return hint ? `${message}${hint}` : message;
}

/** Minimum credentials needed before we can call Meta (WABA is resolved from phone number). */
export function configFromSettings(settings: WhatsAppSettings): WhatsAppApiConfig | null {
  const accessToken = settings.accessToken?.trim();
  const phoneNumberId = settings.phoneNumberId?.trim();
  if (!accessToken || !phoneNumberId) return null;

  return {
    accessToken,
    wabaId: settings.wabaId?.trim() || "",
    phoneNumberId,
    apiVersion: settings.apiVersion,
  };
}

function redactToken(url: string): string {
  return url.replace(/access_token=[^&]+/gi, "access_token=***");
}

async function graphRequest<T>(
  pathOrUrl: string,
  accessToken: string,
  options?: { useFullUrl?: boolean; apiVersion?: string },
): Promise<T> {
  const isAbsolute = options?.useFullUrl || pathOrUrl.startsWith("http");
  const graphBase = resolveWhatsAppGraphBase(options?.apiVersion);
  const url = isAbsolute
    ? pathOrUrl
    : `${graphBase}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  const text = await res.text();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new MetaGraphApiError({
      message: `Meta API returned invalid JSON (HTTP ${res.status})`,
      httpStatus: res.status,
      requestPath: redactToken(url),
      raw: text.slice(0, 500),
    });
  }

  if (!res.ok) {
    const err = parsed.error as {
      message?: string;
      error_user_msg?: string;
      error_data?: { details?: string };
      type?: string;
      code?: number;
      error_subcode?: number;
      fbtrace_id?: string;
    } | undefined;
    const detail = err?.error_data?.details?.trim();
    const message =
      (detail ? `${err?.message || "Meta API error"} — ${detail}` : null) ||
      err?.error_user_msg ||
      err?.message ||
      `Meta API request failed (HTTP ${res.status})`;

    throw new MetaGraphApiError({
      message: withMetaErrorHint(
        err?.code,
        `Meta API error (${res.status}): ${message}`,
      ),
      type: err?.type,
      code: err?.code,
      error_subcode: err?.error_subcode,
      fbtrace_id: err?.fbtrace_id,
      httpStatus: res.status,
      requestPath: redactToken(url),
      raw: parsed,
    });
  }

  return parsed as T;
}

async function graphGet<T>(
  path: string,
  accessToken: string,
  apiVersion?: string,
): Promise<T> {
  return graphRequest<T>(path, accessToken, { apiVersion });
}

type PhoneNumberDetails = {
  id?: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
};

async function fetchPhoneNumberDetails(
  phoneNumberId: string,
  accessToken: string,
  apiVersion?: string,
): Promise<PhoneNumberDetails> {
  return graphGet<PhoneNumberDetails>(
    `/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`,
    accessToken,
    apiVersion,
  );
}

async function verifyPhoneNumberOnWaba(
  wabaId: string,
  phoneNumberId: string,
  accessToken: string,
): Promise<boolean> {
  try {
    const page = await graphGet<{ data?: Array<{ id?: string }> }>(
      `/${wabaId}/phone_numbers?fields=id`,
      accessToken,
    );
    return (page.data || []).some((row) => row.id === phoneNumberId);
  } catch {
    return false;
  }
}

async function fetchWabaCandidatesFromBusinessPortfolio(
  businessOrPortfolioId: string,
  accessToken: string,
): Promise<string[]> {
  const ids: string[] = [];
  const endpoints = [
    `/${businessOrPortfolioId}/owned_whatsapp_business_accounts?fields=id,name`,
    `/${businessOrPortfolioId}/client_whatsapp_business_accounts?fields=id,name`,
  ];

  for (const path of endpoints) {
    try {
      const page = await graphGet<{ data?: Array<{ id?: string }> }>(path, accessToken);
      for (const row of page.data || []) {
        if (row.id?.trim()) ids.push(row.id.trim());
      }
    } catch {
      // Not a business portfolio node or missing permission.
    }
  }

  return ids;
}

async function fetchWabaCandidatesFromToken(accessToken: string): Promise<string[]> {
  const ids = new Set<string>();
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  const debugBearer = appId && appSecret ? `${appId}|${appSecret}` : accessToken;

  try {
    const data = await graphGet<{
      data?: {
        granular_scopes?: Array<{ scope?: string; target_ids?: string[] }>;
      };
    }>(`/debug_token?input_token=${encodeURIComponent(accessToken)}`, debugBearer);

    for (const scope of data.data?.granular_scopes || []) {
      const name = scope.scope || "";
      if (
        name === "whatsapp_business_management" ||
        name === "whatsapp_business_messaging"
      ) {
        for (const id of scope.target_ids || []) {
          if (id?.trim()) ids.add(id.trim());
        }
      }
    }

    console.info("[WhatsApp] debug_token WABA candidates", {
      count: ids.size,
      candidateIds: Array.from(ids),
    });
  } catch (error) {
    console.warn("[WhatsApp] debug_token WABA lookup failed", formatMetaGraphError(error));
  }

  return Array.from(ids);
}

async function canAccessMessageTemplates(wabaId: string, accessToken: string): Promise<boolean> {
  try {
    await graphGet<{ data?: unknown[] }>(`/${wabaId}/message_templates?limit=1`, accessToken);
    return true;
  } catch {
    return false;
  }
}

async function isWhatsAppBusinessAccount(wabaId: string, accessToken: string): Promise<boolean> {
  try {
    const data = await graphGet<{ id?: string; message_template_namespace?: string }>(
      `/${wabaId}?fields=id,message_template_namespace`,
      accessToken,
    );
    return Boolean(data.id && data.message_template_namespace);
  } catch {
    return false;
  }
}

async function probeWabaCandidate(
  wabaId: string,
  phoneNumberId: string,
  accessToken: string,
): Promise<boolean> {
  if (!(await isWhatsAppBusinessAccount(wabaId, accessToken))) return false;
  if (await verifyPhoneNumberOnWaba(wabaId, phoneNumberId, accessToken)) return true;
  return canAccessMessageTemplates(wabaId, accessToken);
}

async function discoverWabaForPhoneNumber(
  accessToken: string,
  phoneNumberId: string,
  preferredWabaId?: string,
): Promise<string> {
  const candidates: string[] = [];
  const seen = new Set<string>();

  const addCandidate = (id?: string) => {
    const trimmed = id?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    candidates.push(trimmed);
  };

  addCandidate(preferredWabaId);
  if (preferredWabaId) {
    for (const id of await fetchWabaCandidatesFromBusinessPortfolio(preferredWabaId, accessToken)) {
      addCandidate(id);
    }
  }
  for (const id of await fetchWabaCandidatesFromToken(accessToken)) {
    addCandidate(id);
  }

  for (const wabaId of candidates) {
    if (await probeWabaCandidate(wabaId, phoneNumberId, accessToken)) {
      console.info("[WhatsApp] Discovered WABA for phone number", { phoneNumberId, wabaId });
      return wabaId;
    }
  }

  for (const wabaId of candidates) {
    if ((await isWhatsAppBusinessAccount(wabaId, accessToken)) && (await canAccessMessageTemplates(wabaId, accessToken))) {
      console.info("[WhatsApp] Using WABA with template access (phone not listed)", {
        phoneNumberId,
        wabaId,
      });
      return wabaId;
    }
  }

  throw new MetaGraphApiError({
    message:
      "Could not find a WhatsApp Business Account that owns this phone number and supports templates. In Meta Developer Console → WhatsApp → API Setup, copy the WhatsApp Business Account ID (not the Business Portfolio ID), save it, and retry.",
    requestPath: "/discover_waba",
    raw: { candidates, phoneNumberId },
  });
}

export async function resolveWabaId(
  settings: WhatsAppSettings,
  accessToken: string,
  phoneNumberId: string,
): Promise<string> {
  return discoverWabaForPhoneNumber(accessToken, phoneNumberId, settings.wabaId?.trim());
}

/** @deprecated Meta phone-number nodes do not expose whatsapp_business_account — use resolveWabaId. */
export async function fetchWabaIdFromPhoneNumber(
  phoneNumberId: string,
  accessToken: string,
): Promise<string> {
  return resolveWabaId({ wabaId: "" } as WhatsAppSettings, accessToken, phoneNumberId);
}

export async function verifyWabaAccount(
  wabaId: string,
  accessToken: string,
): Promise<{ id: string; name?: string }> {
  const data = await graphGet<{
    id?: string;
    name?: string;
    message_template_namespace?: string;
  }>(`/${wabaId}?fields=id,name,message_template_namespace`, accessToken);

  if (!data.id || !data.message_template_namespace) {
    throw new MetaGraphApiError({
      message: `ID ${wabaId} is not a WhatsApp Business Account (missing message templates). Use the WhatsApp Business Account ID from Meta API Setup — not the Business Portfolio ID or Phone Number ID.`,
      requestPath: `/${wabaId}?fields=id,name,message_template_namespace`,
      raw: data,
    });
  }

  return { id: data.id, name: data.name };
}

/** Build API config, resolving WABA ID from saved settings or token scopes. */
export async function resolveWhatsAppApiConfig(
  settings: WhatsAppSettings,
): Promise<WhatsAppApiConfig | null> {
  const base = configFromSettings(settings);
  if (!base) return null;

  const wabaId = await resolveWabaId(settings, base.accessToken, base.phoneNumberId);
  await verifyWabaAccount(wabaId, base.accessToken);
  return { ...base, wabaId };
}

export interface WhatsAppConnectionTestResult {
  phoneNumberId: string;
  wabaId?: string;
  wabaName?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
}

export async function testWhatsAppConnection(
  config: WhatsAppApiConfig,
  settings?: WhatsAppSettings,
): Promise<WhatsAppConnectionTestResult> {
  const data = await fetchPhoneNumberDetails(
    config.phoneNumberId,
    config.accessToken,
    config.apiVersion,
  );

  let wabaId = config.wabaId?.trim();
  let wabaName: string | undefined;

  if (settings) {
    try {
      wabaId = await resolveWabaId(settings, config.accessToken, config.phoneNumberId);
      const waba = await verifyWabaAccount(wabaId, config.accessToken);
      wabaName = waba.name;
    } catch (error) {
      console.warn("[WhatsApp] WABA resolve during connection test failed", formatMetaGraphError(error));
    }
  }

  return {
    phoneNumberId: data.id || config.phoneNumberId,
    wabaId,
    wabaName,
    displayPhoneNumber: data.display_phone_number,
    verifiedName: data.verified_name,
    qualityRating: data.quality_rating,
  };
}

function parseTemplateLanguage(language: unknown): string {
  if (typeof language === "string") return language;
  if (language && typeof language === "object" && "code" in language) {
    return String((language as { code?: string }).code || "");
  }
  return "";
}

export async function fetchWhatsAppTemplates(config: WhatsAppApiConfig): Promise<WhatsAppTemplate[]> {
  const templates: WhatsAppTemplate[] = [];

  type TemplateRow = {
    id: string;
    name: string;
    language?: unknown;
    status: string;
    category?: string;
    parameter_format?: string;
    components?: unknown;
  };

  type TemplatePage = {
    data?: TemplateRow[];
    paging?: { next?: string };
  };

  const templatePaths = [
    `/${config.wabaId}/message_templates?limit=100&fields=id,name,language,status,category,parameter_format,components`,
    `/${config.wabaId}/message_templates?limit=100`,
  ];

  let nextUrl: string | null = null;
  let lastError: unknown;

  for (const path of templatePaths) {
    try {
      await graphGet<TemplatePage>(path, config.accessToken, config.apiVersion);
      nextUrl = path;
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!nextUrl) {
    throw lastError instanceof Error
      ? lastError
      : new MetaGraphApiError({
          message: `Cannot access message templates for WABA ${config.wabaId}. Verify the WhatsApp Business Account ID in Meta API Setup.`,
          requestPath: `/${config.wabaId}/message_templates`,
        });
  }

  console.info("[WhatsApp] Fetching message templates", {
    wabaId: config.wabaId,
    phoneNumberId: config.phoneNumberId,
    initialPath: nextUrl,
  });

  while (nextUrl) {
    const page: TemplatePage = nextUrl.startsWith("http")
      ? await graphRequest<TemplatePage>(nextUrl, config.accessToken, {
          useFullUrl: true,
          apiVersion: config.apiVersion,
        })
      : await graphGet<TemplatePage>(nextUrl, config.accessToken, config.apiVersion);

    for (const row of page.data || []) {
      const parameterFormat =
        String(row.parameter_format || "").toLowerCase() === "named" ? "named" : "positional";
      const paramMeta = parseTemplateParamCounts(row.components, parameterFormat);
      templates.push({
        id: row.id,
        name: row.name,
        language: parseTemplateLanguage(row.language) || "en",
        status: row.status,
        category: row.category,
        parameterFormat: paramMeta.parameterFormat,
        headerFormat: paramMeta.headerFormat,
        headerMediaRequired: paramMeta.headerMediaRequired,
        bodyParamCount: paramMeta.bodyParamCount,
        headerParamCount: paramMeta.headerParamCount,
        buttonParamCount: paramMeta.buttonParamCount,
        bodyParamNames: paramMeta.bodyParamNames,
        headerParamNames: paramMeta.headerParamNames,
        buttonParamIndex: paramMeta.buttonParamIndex,
        bodyParamExamples: paramMeta.bodyParamExamples,
        headerParamExamples: paramMeta.headerParamExamples,
        buttonParamExamples: paramMeta.buttonParamExamples,
        headerMediaExampleUrl: paramMeta.headerMediaExampleUrl,
        buttons: paramMeta.buttons,
      });
    }

    nextUrl = page.paging?.next ?? null;
  }

  console.info("[WhatsApp] Templates fetched", {
    wabaId: config.wabaId,
    count: templates.length,
    approved: templates.filter((t) => t.status === "APPROVED").length,
  });

  return templates;
}

export interface SendTemplateMessageInput {
  to: string;
  templateName: string;
  languageCode: string;
  components?: unknown[];
}

export interface SendTextMessageInput {
  to: string;
  text: string;
}

async function postWhatsAppMessage(
  config: WhatsAppApiConfig,
  body: Record<string, unknown>,
): Promise<{ messageId: string; raw: unknown }> {
  const graphBase = resolveWhatsAppGraphBase(config.apiVersion);
  const url = `${graphBase}/${config.phoneNumberId}/messages`;
  console.info("[WhatsApp] Sending message", {
    phoneNumberId: config.phoneNumberId,
    apiVersion: config.apiVersion || "default",
    to: body.to,
    type: body.type,
    template: (body.template as { name?: string; language?: { code?: string } } | undefined)?.name,
    language: (body.template as { language?: { code?: string } } | undefined)?.language?.code,
    componentCount: Array.isArray(
      (body.template as { components?: unknown[] } | undefined)?.components,
    )
      ? (body.template as { components: unknown[] }).components.length
      : 0,
  });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new MetaGraphApiError({
      message: `Meta API returned invalid JSON (${res.status})`,
      httpStatus: res.status,
      raw: text.slice(0, 500),
    });
  }

  if (!res.ok) {
    const err = parsed.error as {
      message?: string;
      error_data?: { details?: string };
      code?: number;
      fbtrace_id?: string;
    } | undefined;
    const detail = err?.error_data?.details?.trim();
    const message = detail
      ? `${err?.message || "Failed to send WhatsApp message"} — ${detail}`
      : err?.message || text.slice(0, 200);
    throw new MetaGraphApiError({
      message: withMetaErrorHint(
        err?.code,
        `Failed to send WhatsApp message (${res.status}): ${message}`,
      ),
      code: err?.code,
      fbtrace_id: err?.fbtrace_id,
      httpStatus: res.status,
      raw: parsed,
    });
  }

  const messages = parsed.messages as Array<{ id: string }> | undefined;
  const messageId = messages?.[0]?.id;
  if (!messageId) {
    throw new Error("Meta API did not return a message id");
  }

  return { messageId, raw: parsed };
}

export async function sendWhatsAppTextMessage(
  config: WhatsAppApiConfig,
  input: SendTextMessageInput,
): Promise<{ messageId: string; raw: unknown }> {
  const body = input.text.trim();
  if (!body) {
    throw new Error("Message text is required");
  }

  return postWhatsAppMessage(config, {
    messaging_product: "whatsapp",
    to: normalizeWhatsAppPhone(input.to),
    type: "text",
    text: { preview_url: false, body },
  });
}

export async function sendWhatsAppTemplateMessage(
  config: WhatsAppApiConfig,
  input: SendTemplateMessageInput,
): Promise<{ messageId: string; raw: unknown }> {
  const template: Record<string, unknown> = {
    name: input.templateName,
    language: { code: input.languageCode },
  };
  if (input.components?.length) {
    template.components = input.components;
  }

  return postWhatsAppMessage(config, {
    messaging_product: "whatsapp",
    to: normalizeWhatsAppPhone(input.to),
    type: "template",
    template,
  });
}
