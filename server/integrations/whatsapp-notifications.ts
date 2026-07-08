import type { BookingRequest } from "@shared/schema";
import {
  buildWhatsAppTemplateComponents,
  getTemplateDefinition,
  mergeWhatsAppSettings,
} from "@shared/whatsapp";
import {
  configFromSettings,
  formatMetaGraphError,
  resolveWhatsAppApiConfig,
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
} from "./whatsapp";

function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

type BookingRequestNotify = Pick<
  BookingRequest,
  "senderName" | "senderPhone" | "requestNumber" | "senderCity" | "receiverCity" | "serviceType"
>;

export async function sendBookingRequestWhatsApp(
  whatsappSettingsRaw: unknown,
  request: BookingRequestNotify,
): Promise<void> {
  const settings = mergeWhatsAppSettings(whatsappSettingsRaw);
  if (!settings.enabled) return;

  const rule = settings.automation.booking_request;
  if (!rule?.enabled) return;

  if (!configFromSettings(settings)) return;

  const config = await resolveWhatsAppApiConfig(settings);
  if (!config) return;

  const to = normalizeWhatsAppPhone(request.senderPhone);
  if (to.length < 10) return;

  const route =
    [request.senderCity, request.receiverCity].filter(Boolean).join(" → ") || "your route";
  const serviceLabel = request.serviceType === "air" ? "Air Express" : "Surface";
  const bodyParams = [request.senderName, request.requestNumber, route];

  if (rule.templateName?.trim()) {
    const meta = getTemplateDefinition(
      settings.templates,
      rule.templateName.trim(),
      rule.languageCode,
    );
    const components = buildWhatsAppTemplateComponents({
      headerParams:
        meta && meta.headerParamCount > 0 ? [request.requestNumber] : undefined,
      bodyParams: bodyParams.slice(0, meta?.bodyParamCount || bodyParams.length),
    });
    await sendWhatsAppTemplateMessage(config, {
      to,
      templateName: rule.templateName.trim(),
      languageCode: rule.languageCode || "en",
      components,
    });
    return;
  }

  await sendWhatsAppTextMessage(config, {
    to,
    text: `Hi ${request.senderName}, your booking request ${request.requestNumber} has been received (${serviceLabel}: ${route}). We will contact you shortly. Thank you!`,
  });
}

export function triggerBookingRequestWhatsApp(
  whatsappSettingsRaw: unknown,
  request: BookingRequestNotify,
): void {
  void sendBookingRequestWhatsApp(whatsappSettingsRaw, request).catch((error) => {
    console.error("[WhatsApp booking_request] Failed", formatMetaGraphError(error));
  });
}
