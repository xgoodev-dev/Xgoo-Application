import { z } from "zod";

export const WHATSAPP_API_VERSION = "v22.0";
export const WHATSAPP_GRAPH_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

/** Graph API base URL — honors saved settings apiVersion (e.g. v25.0 from Meta API Setup). */
export function resolveWhatsAppGraphBase(apiVersion?: string): string {
  const raw = apiVersion?.trim() || WHATSAPP_API_VERSION;
  const version = raw.startsWith("v") ? raw : `v${raw}`;
  return `https://graph.facebook.com/${version}`;
}

export const WHATSAPP_MESSAGE_TYPES = [
  {
    key: "welcome",
    label: "Welcome Message",
    description: "Sent when a new customer registers or first contacts your office.",
  },
  {
    key: "offers",
    label: "Offers & Updates",
    description: "Promotional offers and service updates for customers.",
  },
  {
    key: "booking_request",
    label: "Booking Request Received",
    description: "Sent when a customer submits a new booking request from the portal.",
  },
  {
    key: "booking_success",
    label: "Booking Success",
    description: "Confirmation after a shipment is booked successfully.",
  },
  {
    key: "tracking",
    label: "Shipment Tracking",
    description: "Tracking link and AWB details for in-transit shipments.",
  },
  {
    key: "invoice",
    label: "Invoice",
    description: "Invoice or receipt notification with payment details.",
  },
  {
    key: "shipment_status",
    label: "Shipment Status",
    description: "Status changes such as picked up, in transit, out for delivery, or delivered.",
  },
  {
    key: "pre_book",
    label: "Pre-Book",
    description: "Reminder or instructions before a scheduled pickup or booking.",
  },
  {
    key: "post_booking",
    label: "Post-Booking",
    description: "Follow-up after booking with next steps and support info.",
  },
  {
    key: "thank_you",
    label: "Thank You",
    description: "Thank-you message when service is completed or delivery is done.",
  },
] as const;

export type WhatsAppMessageTypeKey = (typeof WHATSAPP_MESSAGE_TYPES)[number]["key"];

const messageTypeKeys = WHATSAPP_MESSAGE_TYPES.map((t) => t.key) as [
  WhatsAppMessageTypeKey,
  ...WhatsAppMessageTypeKey[],
];

export const whatsAppAutomationRuleSchema = z.object({
  enabled: z.boolean().default(false),
  templateName: z.string().default(""),
  languageCode: z.string().default("en"),
});

export const whatsAppTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  language: z.string(),
  status: z.string(),
  category: z.string().optional(),
  parameterFormat: z.enum(["named", "positional"]).default("positional"),
  headerFormat: z.string().default("TEXT"),
  headerMediaRequired: z.boolean().default(false),
  bodyParamCount: z.number().int().min(0).default(0),
  headerParamCount: z.number().int().min(0).default(0),
  buttonParamCount: z.number().int().min(0).default(0),
  bodyParamNames: z.array(z.string()).default([]),
  headerParamNames: z.array(z.string()).default([]),
  buttonParamIndex: z.number().int().min(0).default(0),
  /** Example values from Meta template definition — used to auto-fill sends. */
  bodyParamExamples: z.array(z.string()).default([]),
  headerParamExamples: z.array(z.string()).default([]),
  buttonParamExamples: z.array(z.string()).default([]),
  headerMediaExampleUrl: z.string().default(""),
});

export const whatsAppSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  wabaId: z.string().default(""),
  phoneNumberId: z.string().default(""),
  accessToken: z.string().default(""),
  webhookVerifyToken: z.string().default(""),
  apiVersion: z.string().default(WHATSAPP_API_VERSION),
  templates: z.array(whatsAppTemplateSchema).default([]),
  automation: z
    .record(whatsAppAutomationRuleSchema)
    .default({}),
  /** Public HTTPS URL for template image headers (e.g. XGoo logo). Used by all automations. */
  defaultHeaderMediaUrl: z.string().default(""),
  /** Business WhatsApp number with country code (e.g. 919876543210) for wa.me return links. */
  businessWhatsAppNumber: z.string().default(""),
  lastSyncedAt: z.string().nullable().optional(),
});

export type WhatsAppSettings = z.infer<typeof whatsAppSettingsSchema>;
export type WhatsAppTemplate = z.infer<typeof whatsAppTemplateSchema>;
export type WhatsAppAutomationRule = z.infer<typeof whatsAppAutomationRuleSchema>;

export const DEFAULT_WHATSAPP_SETTINGS: WhatsAppSettings = whatsAppSettingsSchema.parse({});

const defaultAutomation = (): WhatsAppSettings["automation"] =>
  Object.fromEntries(
    messageTypeKeys.map((key) => [key, { enabled: false, templateName: "", languageCode: "en" }]),
  ) as WhatsAppSettings["automation"];

export function mergeWhatsAppSettings(raw: unknown): WhatsAppSettings {
  const base = { ...DEFAULT_WHATSAPP_SETTINGS, automation: defaultAutomation() };
  if (!raw || typeof raw !== "object") return base;

  const parsed = whatsAppSettingsSchema.safeParse({
    ...base,
    ...raw,
    automation: {
      ...defaultAutomation(),
      ...(typeof (raw as { automation?: unknown }).automation === "object"
        ? (raw as { automation: WhatsAppSettings["automation"] }).automation
        : {}),
    },
  });

  return parsed.success
    ? {
        ...parsed.data,
        templates: parsed.data.templates.map((t) => whatsAppTemplateSchema.parse(t)),
      }
    : base;
}

export const ACCESS_TOKEN_MASK = "••••••••••••••••";

export function maskAccessToken(token: string | undefined | null): string {
  if (!token) return "";
  if (token.length <= 4) return ACCESS_TOKEN_MASK;
  return `${ACCESS_TOKEN_MASK}${token.slice(-4)}`;
}

export function isMaskedAccessToken(value: string | undefined | null): boolean {
  if (!value) return true;
  return value.startsWith(ACCESS_TOKEN_MASK);
}

export function sanitizeWhatsAppSettingsForClient(settings: WhatsAppSettings): WhatsAppSettings {
  return {
    ...settings,
    accessToken: settings.accessToken ? maskAccessToken(settings.accessToken) : "",
  };
}

export function resolveAccessTokenForSave(
  incoming: string | undefined,
  existing: string | undefined,
): string {
  if (!incoming || isMaskedAccessToken(incoming)) {
    return existing || "";
  }
  return incoming.trim();
}

export function isWhatsAppConfigured(settings: WhatsAppSettings): boolean {
  return Boolean(
    settings.enabled && settings.phoneNumberId.trim() && settings.accessToken.trim(),
  );
}

type MetaTemplateComponent = {
  type?: string;
  format?: string;
  text?: string;
  example?: {
    body_text?: string[][];
    body_text_named_params?: Array<{ param_name?: string; example?: string }>;
    header_text?: string[];
    header_text_named_params?: Array<{ param_name?: string; example?: string }>;
    header_handle?: string[];
    header_url?: string[];
  };
  buttons?: Array<{ type?: string; url?: string; text?: string; example?: string[] }>;
};

function extractPositionalVariableCount(text?: string | null): number {
  if (!text) return 0;
  const matches = text.match(/\{\{\d+\}\}/g);
  if (!matches?.length) return 0;
  const nums = matches.map((m) => parseInt(m.replace(/\D/g, ""), 10)).filter((n) => Number.isFinite(n));
  return nums.length ? Math.max(...nums) : 0;
}

function extractNamedVariableNames(text?: string | null): string[] {
  if (!text) return [];
  return Array.from(text.matchAll(/\{\{([a-z_][a-z0-9_]*)\}\}/gi), (m) => m[1].toLowerCase());
}

export function parseTemplateParamCounts(
  components: unknown,
  parameterFormat: "named" | "positional" = "positional",
): {
  parameterFormat: "named" | "positional";
  headerFormat: string;
  headerMediaRequired: boolean;
  bodyParamCount: number;
  headerParamCount: number;
  buttonParamCount: number;
  bodyParamNames: string[];
  headerParamNames: string[];
  buttonParamIndex: number;
  bodyParamExamples: string[];
  headerParamExamples: string[];
  buttonParamExamples: string[];
  headerMediaExampleUrl: string;
} {
  let bodyParamCount = 0;
  let headerParamCount = 0;
  let buttonParamCount = 0;
  let headerFormat = "TEXT";
  let headerMediaRequired = false;
  let bodyParamNames: string[] = [];
  let headerParamNames: string[] = [];
  let buttonParamIndex = 0;
  let bodyParamExamples: string[] = [];
  let headerParamExamples: string[] = [];
  let buttonParamExamples: string[] = [];
  let headerMediaExampleUrl = "";

  if (!Array.isArray(components)) {
    return {
      parameterFormat,
      headerFormat,
      headerMediaRequired,
      bodyParamCount,
      headerParamCount,
      buttonParamCount,
      bodyParamNames,
      headerParamNames,
      buttonParamIndex,
      bodyParamExamples,
      headerParamExamples,
      buttonParamExamples,
      headerMediaExampleUrl,
    };
  }

  for (const raw of components) {
    const comp = raw as MetaTemplateComponent;
    const type = (comp.type || "").toUpperCase();

    if (type === "BODY") {
      if (parameterFormat === "named" && comp.example?.body_text_named_params?.length) {
        bodyParamNames = comp.example.body_text_named_params
          .map((p) => p.param_name?.trim().toLowerCase())
          .filter((name): name is string => Boolean(name));
        bodyParamCount = bodyParamNames.length;
        bodyParamExamples = comp.example.body_text_named_params
          .map((p) => p.example?.trim() || "")
          .filter(Boolean);
      } else if (parameterFormat === "named") {
        bodyParamNames = extractNamedVariableNames(comp.text);
        bodyParamCount = bodyParamNames.length;
      } else {
        bodyParamCount = Math.max(bodyParamCount, extractPositionalVariableCount(comp.text));
        const row = comp.example?.body_text?.[0];
        if (Array.isArray(row) && row.length) {
          bodyParamExamples = row.map((v) => String(v).trim()).filter(Boolean);
        }
      }
    } else if (type === "HEADER") {
      headerFormat = (comp.format || "TEXT").toUpperCase();
      if (headerFormat === "TEXT") {
        if (parameterFormat === "named" && comp.example?.header_text_named_params?.length) {
          headerParamNames = comp.example.header_text_named_params
            .map((p) => p.param_name?.trim().toLowerCase())
            .filter((name): name is string => Boolean(name));
          headerParamCount = headerParamNames.length;
          headerParamExamples = comp.example.header_text_named_params
            .map((p) => p.example?.trim() || "")
            .filter(Boolean);
        } else if (parameterFormat === "named") {
          headerParamNames = extractNamedVariableNames(comp.text);
          headerParamCount = headerParamNames.length;
        } else {
          headerParamCount = Math.max(headerParamCount, extractPositionalVariableCount(comp.text));
          const row = comp.example?.header_text?.[0];
          if (Array.isArray(row) && row.length) {
            headerParamExamples = row.map((v) => String(v).trim()).filter(Boolean);
          }
        }
      } else if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerFormat)) {
        // Media headers require an image/video/document parameter at send time unless the
        // asset is fully fixed in the approved template (rare — Meta returns #132012 otherwise).
        headerMediaRequired = true;
        const handle = comp.example?.header_handle?.[0] || comp.example?.header_url?.[0];
        if (typeof handle === "string" && handle.trim()) {
          headerMediaExampleUrl = handle.trim();
        }
      }
    } else if (type === "BUTTONS" && Array.isArray(comp.buttons)) {
      comp.buttons.forEach((btn, index) => {
        if ((btn.type || "").toUpperCase() === "URL" && btn.url) {
          const urlVarCount =
            parameterFormat === "named"
              ? extractNamedVariableNames(btn.url).length
              : extractPositionalVariableCount(btn.url);
          if (urlVarCount > 0) {
            buttonParamCount = Math.max(buttonParamCount, urlVarCount);
            buttonParamIndex = index;
            const example = btn.example?.[0];
            if (example?.trim()) {
              buttonParamExamples = [example.trim()];
            }
          }
        }
      });
    }
  }

  return {
    parameterFormat,
    headerFormat,
    headerMediaRequired,
    bodyParamCount,
    headerParamCount,
    buttonParamCount,
    bodyParamNames,
    headerParamNames,
    buttonParamIndex,
    bodyParamExamples,
    headerParamExamples,
    buttonParamExamples,
    headerMediaExampleUrl,
  };
}

/** @deprecated use extractPositionalVariableCount */
export function countTemplateVariables(text?: string | null): number {
  return extractPositionalVariableCount(text);
}

/** True when the template header is image/video/document and needs a media URL at send time. */
export function templateNeedsHeaderMedia(
  template?: Pick<WhatsAppTemplate, "headerFormat" | "headerMediaRequired"> | {
    headerFormat?: string;
    headerMediaRequired?: boolean;
  },
): boolean {
  if (!template) return false;
  return (
    Boolean(template.headerMediaRequired) ||
    ["IMAGE", "VIDEO", "DOCUMENT"].includes((template.headerFormat || "TEXT").toUpperCase())
  );
}

/** Templates known to use a dynamic image header when Meta sync metadata is incomplete. */
export const KNOWN_IMAGE_HEADER_TEMPLATES = new Set([
  "xgoo_welcome_message",
  "welcome_message",
]);

export function enrichTemplateForSend(
  template: WhatsAppTemplate | undefined,
  templateName: string,
  settings?: Pick<WhatsAppSettings, "defaultHeaderMediaUrl">,
): WhatsAppTemplate | undefined {
  const normalized = template ? whatsAppTemplateSchema.parse(template) : undefined;
  const name = templateName.trim().toLowerCase();
  const knownImage = KNOWN_IMAGE_HEADER_TEMPLATES.has(name);

  if (knownImage) {
    if (!normalized) {
      return whatsAppTemplateSchema.parse({
        id: "inferred",
        name: templateName,
        language: "en",
        status: "APPROVED",
        headerFormat: "IMAGE",
        headerMediaRequired: true,
        bodyParamCount: 1,
      });
    }
    if (!templateNeedsHeaderMedia(normalized)) {
      return { ...normalized, headerFormat: "IMAGE", headerMediaRequired: true };
    }
  }

  return normalized;
}

export function resolveMessagingHeaderMediaUrl(
  settings: Pick<WhatsAppSettings, "defaultHeaderMediaUrl">,
  template: WhatsAppTemplate | undefined,
  templateName: string,
  explicitUrl?: string,
): string | undefined {
  const explicit = explicitUrl?.trim();
  if (explicit) return explicit;
  const enriched = enrichTemplateForSend(template, templateName, settings);
  const url = settings.defaultHeaderMediaUrl?.trim();
  if (!url) return undefined;
  if (
    templateNeedsHeaderMedia(enriched) ||
    KNOWN_IMAGE_HEADER_TEMPLATES.has(templateName.trim().toLowerCase())
  ) {
    return url;
  }
  return undefined;
}

export function getTemplateDefinition(
  templates: WhatsAppTemplate[],
  name: string,
  language?: string,
): WhatsAppTemplate | undefined {
  if (language) {
    const exact = templates.find((t) => t.name === name && t.language === language);
    if (exact) return exact;
    const langBase = language.split("_")[0];
    const baseMatch = templates.find(
      (t) => t.name === name && t.language.split("_")[0] === langBase,
    );
    if (baseMatch) return baseMatch;
  }
  return templates.find((t) => t.name === name);
}

/** Pick the language code Meta expects for a synced template. */
export function resolveTemplateLanguageForSend(
  templates: WhatsAppTemplate[],
  templateName: string,
  preferredLanguage?: string,
): string {
  const name = templateName.trim();
  const approved = templates.filter((t) => t.name === name && t.status === "APPROVED");
  if (!approved.length) {
    return preferredLanguage?.trim() || "en";
  }
  if (preferredLanguage?.trim()) {
    const pref = preferredLanguage.trim();
    const exact = approved.find((t) => t.language === pref);
    if (exact) return exact.language;
    const prefBase = pref.split("_")[0];
    const baseMatch = approved.find((t) => t.language.split("_")[0] === prefBase);
    if (baseMatch) return baseMatch.language;
  }
  if (approved.length === 1) return approved[0].language;
  const enUs = approved.find((t) => t.language === "en_US");
  if (enUs) return enUs.language;
  const en = approved.find((t) => t.language === "en");
  if (en) return en.language;
  return approved[0].language;
}

/** Best template for a one-click connectivity test from synced Meta templates. */
export function pickQuickTestTemplate(
  templates: WhatsAppTemplate[],
): { name: string; language: string } | null {
  const approved = templates.filter((t) => t.status === "APPROVED");
  const hello = approved.find((t) => t.name === "hello_world");
  if (hello) return { name: hello.name, language: hello.language };

  const simple = approved
    .filter(
      (t) =>
        t.bodyParamCount === 0 &&
        t.headerParamCount === 0 &&
        t.buttonParamCount === 0 &&
        !t.headerMediaRequired,
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  if (simple[0]) return { name: simple[0].name, language: simple[0].language };

  if (approved[0]) return { name: approved[0].name, language: approved[0].language };
  return null;
}

export function buildWhatsAppTemplateComponents(input: {
  template?: Pick<
    WhatsAppTemplate,
    | "parameterFormat"
    | "headerFormat"
    | "headerMediaRequired"
    | "bodyParamCount"
    | "headerParamCount"
    | "buttonParamCount"
    | "bodyParamNames"
    | "headerParamNames"
    | "buttonParamIndex"
  >;
  headerParams?: string[];
  bodyParams?: string[];
  buttonParams?: string[];
  headerMediaUrl?: string;
}): Array<Record<string, unknown>> | undefined {
  const components: Array<Record<string, unknown>> = [];
  const template = input.template;
  const parameterFormat = template?.parameterFormat ?? "positional";
  const needsHeaderMedia = templateNeedsHeaderMedia(template);

  const headerCount = template?.headerParamCount ?? 0;
  const bodyCount = template?.bodyParamCount ?? 0;
  const buttonCount = template?.buttonParamCount ?? 0;
  const headerFormat = (template?.headerFormat || "TEXT").toUpperCase();

  if (needsHeaderMedia && input.headerMediaUrl?.trim()) {
    let mediaType = headerFormat.toLowerCase();
    if (mediaType === "text" || !["image", "video", "document"].includes(mediaType)) {
      mediaType = "image";
    }
    const link = input.headerMediaUrl.trim();
    components.push({
      type: "header",
      parameters: [
        {
          type: mediaType,
          [mediaType]:
            mediaType === "document"
              ? { link, filename: link.split("/").pop() || "document.pdf" }
              : { link },
        },
      ],
    });
  } else if (headerCount > 0 && headerFormat === "TEXT") {
    const headerValues = (input.headerParams || []).slice(0, headerCount).map((s) => s.trim());
    components.push({
      type: "header",
      parameters: headerValues.map((text, index) => {
        const param: Record<string, unknown> = { type: "text", text };
        const name = template?.headerParamNames?.[index];
        if (parameterFormat === "named" && name) {
          param.parameter_name = name;
        }
        return param;
      }),
    });
  }

  if (bodyCount > 0) {
    const bodyValues = (input.bodyParams || []).slice(0, bodyCount).map((s) => s.trim());
    components.push({
      type: "body",
      parameters: bodyValues.map((text, index) => {
        const param: Record<string, unknown> = { type: "text", text };
        const name = template?.bodyParamNames?.[index];
        if (parameterFormat === "named" && name) {
          param.parameter_name = name;
        }
        return param;
      }),
    });
  }

  if (buttonCount > 0) {
    const buttonValues = (input.buttonParams || []).slice(0, buttonCount).map((s) => s.trim());
    components.push({
      type: "button",
      sub_type: "url",
      index: String(template?.buttonParamIndex ?? 0),
      parameters: buttonValues.map((text) => ({ type: "text", text })),
    });
  }

  return components.length ? components : undefined;
}

export function templateParamsFilled(
  counts: {
    bodyParamCount: number;
    headerParamCount: number;
    buttonParamCount: number;
    headerMediaRequired?: boolean;
    headerFormat?: string;
    templateName?: string;
  },
  values: {
    bodyParams: string[];
    headerParams: string[];
    buttonParams: string[];
    headerMediaUrl?: string;
  },
): boolean {
  const needsMedia =
    templateNeedsHeaderMedia(counts) ||
    Boolean(
      counts.templateName &&
        KNOWN_IMAGE_HEADER_TEMPLATES.has(counts.templateName.trim().toLowerCase()),
    );
  const headerOk = needsMedia
    ? Boolean(values.headerMediaUrl?.trim())
    : counts.headerParamCount === 0 ||
      (values.headerParams.length >= counts.headerParamCount &&
        values.headerParams.slice(0, counts.headerParamCount).every((v) => v.trim()));
  const bodyOk =
    counts.bodyParamCount === 0 ||
    (values.bodyParams.length >= counts.bodyParamCount &&
      values.bodyParams.slice(0, counts.bodyParamCount).every((v) => v.trim()));
  const buttonOk =
    counts.buttonParamCount === 0 ||
    (values.buttonParams.length >= counts.buttonParamCount &&
      values.buttonParams.slice(0, counts.buttonParamCount).every((v) => v.trim()));
  return bodyOk && headerOk && buttonOk;
}

export function describeTemplateParameterRequirements(template?: WhatsAppTemplate): string {
  if (!template) {
    return "Re-sync templates from Meta to detect required parameters.";
  }
  const parts: string[] = [];
  if (template.headerMediaRequired || ["IMAGE", "VIDEO", "DOCUMENT"].includes(template.headerFormat)) {
    parts.push(`1 ${template.headerFormat.toLowerCase()} header URL (public HTTPS link)`);
  } else if (
    KNOWN_IMAGE_HEADER_TEMPLATES.has(template.name.trim().toLowerCase())
  ) {
    parts.push("1 image header URL (set Default header image URL in settings)");
  } else if (template.headerParamCount > 0) {
    const names =
      template.parameterFormat === "named" && template.headerParamNames.length
        ? ` (${template.headerParamNames.join(", ")})`
        : "";
    parts.push(`${template.headerParamCount} header${names}`);
  }
  if (template.bodyParamCount > 0) {
    const names =
      template.parameterFormat === "named" && template.bodyParamNames.length
        ? ` (${template.bodyParamNames.join(", ")})`
        : "";
    parts.push(`${template.bodyParamCount} body${names}`);
  }
  if (template.buttonParamCount > 0) {
    parts.push(`${template.buttonParamCount} button URL`);
  }
  if (!parts.length) return "No parameters required for this template.";
  return `Requires ${parts.join(", ")}. Language: ${template.language}. Format: ${template.parameterFormat}. Example values sync from Meta on template sync.`;
}

/** Normalize phone to digits; default India +91 for 10-digit local numbers. */
export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/** wa.me link so customers can return to WhatsApp after booking on the web. */
export function buildWhatsAppReturnUrl(
  businessNumber: string,
  requestNumber: string,
  extraText?: string,
): string {
  const digits = normalizeWhatsAppPhone(businessNumber);
  const text =
    extraText ??
    `Hi XGoo, my booking request is ${requestNumber}. Please share the status.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function resolveHeaderMediaUrlForAutomation(
  settings: Pick<WhatsAppSettings, "defaultHeaderMediaUrl">,
  template: WhatsAppTemplate | undefined,
  templateName = "",
): string | undefined {
  return resolveMessagingHeaderMediaUrl(settings, template, templateName);
}

/** Fill parameter slots from user values, Meta examples, then fallbacks. */
export function resolveTemplateParamValues(
  count: number,
  provided: string[] | undefined,
  examples: string[] | undefined,
  fallbacks: string[] = ["XGoo", "Test"],
): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const explicit = provided?.[i]?.trim();
    if (explicit) {
      result.push(explicit);
      continue;
    }
    const example = examples?.[i]?.trim();
    if (example) {
      result.push(example);
      continue;
    }
    result.push(fallbacks[i] ?? fallbacks[fallbacks.length - 1] ?? "XGoo");
  }
  return result;
}

export function resolveTemplateSendParams(
  template: WhatsAppTemplate | undefined,
  input: {
    bodyParams?: string[];
    headerParams?: string[];
    buttonParams?: string[];
    headerMediaUrl?: string;
    defaultHeaderMediaUrl?: string;
    bookingValues?: { name: string; requestNumber: string; route?: string; bookingNumber?: string };
  },
): {
  bodyParams: string[];
  headerParams: string[];
  buttonParams: string[];
  headerMediaUrl?: string;
} {
  const bodyCount = template?.bodyParamCount ?? 0;
  const headerCount = template?.headerParamCount ?? 0;
  const buttonCount = template?.buttonParamCount ?? 0;
  const bookingPool = input.bookingValues
    ? [
        input.bookingValues.name,
        input.bookingValues.requestNumber,
        input.bookingValues.bookingNumber || input.bookingValues.requestNumber,
        input.bookingValues.route || "",
      ].filter((v) => v.trim())
    : ["XGoo Customer", "BR-TEST-001", "Hyderabad → Mumbai"];

  const bodyParams = resolveTemplateParamValues(
    bodyCount,
    input.bodyParams,
    template?.bodyParamExamples,
    bookingPool,
  );
  const headerParams = resolveTemplateParamValues(
    headerCount,
    input.headerParams,
    template?.headerParamExamples,
    [input.bookingValues?.requestNumber || "XGoo", "XGoo"],
  );
  const buttonParams = resolveTemplateParamValues(
    buttonCount,
    input.buttonParams,
    template?.buttonParamExamples,
    ["xgoo"],
  );

  const headerMediaUrl =
    input.headerMediaUrl?.trim() ||
    input.defaultHeaderMediaUrl?.trim() ||
    template?.headerMediaExampleUrl?.trim() ||
    undefined;

  return { bodyParams, headerParams, buttonParams, headerMediaUrl };
}

/** Map booking fields to template body slots by count ({{1}}, {{2}}, …). */
export function mapBodyParamsForTemplate(
  bodyParamCount: number,
  values: { name: string; requestNumber: string; route?: string; bookingNumber?: string },
  examples?: string[],
): string[] {
  const pool = [
    values.name,
    values.requestNumber,
    values.bookingNumber || values.requestNumber,
    values.route || "",
  ].filter((v) => v.trim());
  return resolveTemplateParamValues(bodyParamCount, undefined, examples, pool);
}

export function buildAutomationTemplateComponents(
  settings: WhatsAppSettings,
  template: WhatsAppTemplate | undefined,
  templateName: string,
  input: {
    bodyParams: string[];
    headerParams?: string[];
    buttonParams?: string[];
  },
): Array<Record<string, unknown>> | undefined {
  const enriched = enrichTemplateForSend(template, templateName, settings);
  const resolved = resolveTemplateSendParams(enriched, {
    bodyParams: input.bodyParams,
    headerParams: input.headerParams,
    buttonParams: input.buttonParams,
    headerMediaUrl: resolveMessagingHeaderMediaUrl(settings, template, templateName),
  });
  return buildWhatsAppTemplateComponents({
    template: enriched,
    headerMediaUrl:
      resolved.headerMediaUrl ||
      resolveMessagingHeaderMediaUrl(settings, template, templateName),
    headerParams: resolved.headerParams,
    bodyParams: resolved.bodyParams,
    buttonParams: resolved.buttonParams,
  });
}

export function bookingWhatsAppExtras(
  settingsRaw: unknown,
  requestNumber: string,
): { whatsappReturnUrl?: string } {
  const settings = mergeWhatsAppSettings(settingsRaw);
  const phone = settings.businessWhatsAppNumber?.trim();
  if (!phone) return {};
  return { whatsappReturnUrl: buildWhatsAppReturnUrl(phone, requestNumber) };
}

/** User-facing hints when Meta accepts a message but delivery may still fail. */
export function buildWhatsAppDeliveryHints(input: {
  templateMeta?: Pick<WhatsAppTemplate, "category">;
  fromDisplayNumber?: string;
  messageStatus?: string;
}): string[] {
  const hints: string[] = [];
  const from = input.fromDisplayNumber || "";

  if (from.includes("555") || from.startsWith("+1 555")) {
    hints.push(
      "You are on Meta's test number (+1 555…). In Meta Developers → WhatsApp → API Setup, copy the exact Phone Number ID from that page (not a different sandbox line), add the recipient under \"To\", then send again.",
    );
  }

  if ((input.templateMeta?.category || "").toUpperCase() === "MARKETING") {
    hints.push(
      "This template is MARKETING. WhatsApp often will not deliver to numbers that have not opted in or messaged your business first.",
    );
  }

  if (input.messageStatus === "accepted") {
    hints.push(
      "Meta queued the message (accepted). If nothing arrives in 1–2 minutes, verify the recipient number, test allow-list, and template category.",
    );
  }

  return hints;
}

/** Hints when staff try to send custom (non-template) text. */
export function buildCustomTextDeliveryHints(fromDisplayNumber?: string): string[] {
  const hints = [
    "Custom text only delivers inside WhatsApp's 24-hour customer service window — after the recipient messages your business number first. For testing and outbound notifications, use an approved template instead.",
  ];
  if (fromDisplayNumber?.includes("555")) {
    hints.push(
      "On Meta's +1 555 sandbox, custom text almost never delivers unless the recipient has an open chat with that exact test number. Use a template (e.g. hello_world or welcome_message).",
    );
  }
  return hints;
}
