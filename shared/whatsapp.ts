import { z } from "zod";

export const WHATSAPP_API_VERSION = "v22.0";
export const WHATSAPP_GRAPH_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

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

  return parsed.success ? parsed.data : base;
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
} {
  let bodyParamCount = 0;
  let headerParamCount = 0;
  let buttonParamCount = 0;
  let headerFormat = "TEXT";
  let headerMediaRequired = false;
  let bodyParamNames: string[] = [];
  let headerParamNames: string[] = [];
  let buttonParamIndex = 0;

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
      } else if (parameterFormat === "named") {
        bodyParamNames = extractNamedVariableNames(comp.text);
        bodyParamCount = bodyParamNames.length;
      } else {
        bodyParamCount = Math.max(bodyParamCount, extractPositionalVariableCount(comp.text));
      }
    } else if (type === "HEADER") {
      headerFormat = (comp.format || "TEXT").toUpperCase();
      if (headerFormat === "TEXT") {
        if (parameterFormat === "named" && comp.example?.header_text_named_params?.length) {
          headerParamNames = comp.example.header_text_named_params
            .map((p) => p.param_name?.trim().toLowerCase())
            .filter((name): name is string => Boolean(name));
          headerParamCount = headerParamNames.length;
        } else if (parameterFormat === "named") {
          headerParamNames = extractNamedVariableNames(comp.text);
          headerParamCount = headerParamNames.length;
        } else {
          headerParamCount = Math.max(headerParamCount, extractPositionalVariableCount(comp.text));
        }
      } else if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerFormat)) {
        // Media headers require an image/video/document parameter at send time unless the
        // asset is fully fixed in the approved template (rare — Meta returns #132012 otherwise).
        headerMediaRequired = true;
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

export function getTemplateDefinition(
  templates: WhatsAppTemplate[],
  name: string,
  language?: string,
): WhatsAppTemplate | undefined {
  if (language) {
    const exact = templates.find((t) => t.name === name && t.language === language);
    if (exact) return exact;
  }
  return templates.find((t) => t.name === name);
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
    const mediaType = headerFormat.toLowerCase();
    const link = input.headerMediaUrl.trim();
    if (mediaType === "image" || mediaType === "video" || mediaType === "document") {
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
    }
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
  },
  values: {
    bodyParams: string[];
    headerParams: string[];
    buttonParams: string[];
    headerMediaUrl?: string;
  },
): boolean {
  const headerOk = templateNeedsHeaderMedia(counts)
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
  return `Requires ${parts.join(", ")}. Language: ${template.language}. Format: ${template.parameterFormat}.`;
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
  template?: Pick<WhatsAppTemplate, "headerFormat" | "headerMediaRequired">,
): string | undefined {
  const url = settings.defaultHeaderMediaUrl?.trim();
  if (!url || !templateNeedsHeaderMedia(template)) return undefined;
  return url;
}

/** Map booking fields to template body slots by count ({{1}}, {{2}}, …). */
export function mapBodyParamsForTemplate(
  bodyParamCount: number,
  values: { name: string; requestNumber: string; route?: string; bookingNumber?: string },
): string[] {
  const slots: string[] = [];
  const pool = [
    values.name,
    values.requestNumber,
    values.bookingNumber || values.requestNumber,
    values.route || "",
  ].filter((v) => v.trim());
  for (let i = 0; i < bodyParamCount; i++) {
    slots.push(pool[i] ?? pool[pool.length - 1] ?? "");
  }
  return slots;
}

export function buildAutomationTemplateComponents(
  settings: WhatsAppSettings,
  template: WhatsAppTemplate | undefined,
  input: {
    bodyParams: string[];
    headerParams?: string[];
    buttonParams?: string[];
  },
): Array<Record<string, unknown>> | undefined {
  return buildWhatsAppTemplateComponents({
    template,
    headerMediaUrl: resolveHeaderMediaUrlForAutomation(settings, template),
    headerParams: input.headerParams,
    bodyParams: input.bodyParams,
    buttonParams: input.buttonParams,
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
