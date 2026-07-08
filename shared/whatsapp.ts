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
  bodyParamCount: z.number().int().min(0).default(0),
  headerParamCount: z.number().int().min(0).default(0),
  buttonParamCount: z.number().int().min(0).default(0),
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

/** Count {{1}}, {{2}}, … placeholders in template text. */
export function countTemplateVariables(text?: string | null): number {
  if (!text) return 0;
  const matches = text.match(/\{\{\d+\}\}/g);
  if (!matches?.length) return 0;
  const nums = matches.map((m) => parseInt(m.replace(/\D/g, ""), 10)).filter((n) => Number.isFinite(n));
  return nums.length ? Math.max(...nums) : 0;
}

type MetaTemplateComponent = {
  type?: string;
  format?: string;
  text?: string;
  buttons?: Array<{ type?: string; url?: string; text?: string }>;
};

export function parseTemplateParamCounts(components: unknown): {
  bodyParamCount: number;
  headerParamCount: number;
  buttonParamCount: number;
} {
  let bodyParamCount = 0;
  let headerParamCount = 0;
  let buttonParamCount = 0;

  if (!Array.isArray(components)) {
    return { bodyParamCount, headerParamCount, buttonParamCount };
  }

  for (const raw of components) {
    const comp = raw as MetaTemplateComponent;
    const type = (comp.type || "").toUpperCase();
    if (type === "BODY") {
      bodyParamCount = Math.max(bodyParamCount, countTemplateVariables(comp.text));
    } else if (type === "HEADER" && (comp.format || "TEXT").toUpperCase() === "TEXT") {
      headerParamCount = Math.max(headerParamCount, countTemplateVariables(comp.text));
    } else if (type === "BUTTONS" && Array.isArray(comp.buttons)) {
      for (const btn of comp.buttons) {
        if ((btn.type || "").toUpperCase() === "URL" && btn.url) {
          buttonParamCount = Math.max(buttonParamCount, countTemplateVariables(btn.url));
        }
      }
    }
  }

  return { bodyParamCount, headerParamCount, buttonParamCount };
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
  headerParams?: string[];
  bodyParams?: string[];
  buttonParams?: string[];
}): Array<Record<string, unknown>> | undefined {
  const components: Array<Record<string, unknown>> = [];

  const header = (input.headerParams || []).map((s) => s.trim()).filter(Boolean);
  if (header.length) {
    components.push({
      type: "header",
      parameters: header.map((text) => ({ type: "text", text })),
    });
  }

  const body = (input.bodyParams || []).map((s) => s.trim()).filter(Boolean);
  if (body.length) {
    components.push({
      type: "body",
      parameters: body.map((text) => ({ type: "text", text })),
    });
  }

  const buttons = (input.buttonParams || []).map((s) => s.trim()).filter(Boolean);
  if (buttons.length) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: buttons.map((text) => ({ type: "text", text })),
    });
  }

  return components.length ? components : undefined;
}

export function templateParamsFilled(
  counts: { bodyParamCount: number; headerParamCount: number; buttonParamCount: number },
  values: { bodyParams: string[]; headerParams: string[]; buttonParams: string[] },
): boolean {
  const bodyOk =
    counts.bodyParamCount === 0 ||
    (values.bodyParams.length >= counts.bodyParamCount &&
      values.bodyParams.slice(0, counts.bodyParamCount).every((v) => v.trim()));
  const headerOk =
    counts.headerParamCount === 0 ||
    (values.headerParams.length >= counts.headerParamCount &&
      values.headerParams.slice(0, counts.headerParamCount).every((v) => v.trim()));
  const buttonOk =
    counts.buttonParamCount === 0 ||
    (values.buttonParams.length >= counts.buttonParamCount &&
      values.buttonParams.slice(0, counts.buttonParamCount).every((v) => v.trim()));
  return bodyOk && headerOk && buttonOk;
}
