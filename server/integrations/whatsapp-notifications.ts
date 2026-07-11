import {
  markWelcomeSentToPhone,
  recordWhatsAppWebhookDebug,
  shouldSendWelcomeToPhone,
} from "./whatsapp-delivery";
import type { BookingRequest, Shipment } from "@shared/schema";
import {
  buildAutomationTemplateComponents,
  enrichTemplateForSend,
  getTemplateDefinition,
  isInboundGreetingMessage,
  mapBodyParamsForTemplate,
  mergeWhatsAppSettings,
  normalizeWhatsAppPhone,
  applyWelcomeTemplateDefaults,
  type WhatsAppMessageTypeKey,
  type WhatsAppSettings,
} from "@shared/whatsapp";
import {
  configFromSettings,
  formatMetaGraphError,
  resolveWhatsAppApiConfig,
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
} from "./whatsapp";

type BookingRequestNotify = Pick<
  BookingRequest,
  "senderName" | "senderPhone" | "requestNumber" | "senderCity" | "receiverCity" | "serviceType"
>;

type ShipmentNotify = Pick<
  Shipment,
  "senderName" | "senderPhone" | "bookingNumber" | "senderCity" | "receiverCity" | "serviceType"
>;

async function sendAutomatedWhatsApp(
  whatsappSettingsRaw: unknown,
  ruleKey: WhatsAppMessageTypeKey,
  toPhone: string,
  values: { name: string; requestNumber: string; route?: string; bookingNumber?: string },
  fallbackText: string,
): Promise<void> {
  const settings = mergeWhatsAppSettings(whatsappSettingsRaw);
  if (!settings.enabled) return;

  const rule = settings.automation[ruleKey];
  if (!rule?.enabled) return;
  if (!configFromSettings(settings)) return;

  const config = await resolveWhatsAppApiConfig(settings);
  if (!config) return;

  const to = normalizeWhatsAppPhone(toPhone);
  if (to.length < 10) return;

  if (rule.templateName?.trim()) {
    const templateName = rule.templateName.trim();
    const meta = enrichTemplateForSend(
      getTemplateDefinition(settings.templates, templateName, rule.languageCode),
      templateName,
      settings,
    );
    const bodyParams = mapBodyParamsForTemplate(
      meta?.bodyParamCount ?? 1,
      values,
      meta?.bodyParamExamples,
    );
    const headerParams =
      meta && meta.headerParamCount > 0 && !meta.headerMediaRequired
        ? [values.requestNumber]
        : undefined;
    const welcomeDefaults = applyWelcomeTemplateDefaults(settings, templateName, {
      bodyParams,
      customerName: values.name,
      trackingRef: values.requestNumber,
    });
    const components = buildAutomationTemplateComponents(settings, meta, templateName, {
      bodyParams: welcomeDefaults.bodyParams,
      headerParams,
      buttonParams: welcomeDefaults.buttonParams,
    });
    await sendWhatsAppTemplateMessage(config, {
      to,
      templateName,
      languageCode: meta?.language || rule.languageCode || "en",
      components,
    });
    return;
  }

  await sendWhatsAppTextMessage(config, { to, text: fallbackText });
}

export async function sendBookingRequestWhatsApp(
  whatsappSettingsRaw: unknown,
  request: BookingRequestNotify,
): Promise<void> {
  const route =
    [request.senderCity, request.receiverCity].filter(Boolean).join(" → ") || "your route";
  const serviceLabel = request.serviceType === "air" ? "Air Express" : "Surface";
  const fallback = `Hi ${request.senderName}, your booking request ${request.requestNumber} has been received (${serviceLabel}: ${route}). We will contact you shortly. Thank you!`;

  await sendAutomatedWhatsApp(
    whatsappSettingsRaw,
    "booking_request",
    request.senderPhone,
    {
      name: request.senderName,
      requestNumber: request.requestNumber,
      route,
    },
    fallback,
  );
}

export async function sendBookingSuccessWhatsApp(
  whatsappSettingsRaw: unknown,
  shipment: ShipmentNotify,
): Promise<void> {
  const route =
    [shipment.senderCity, shipment.receiverCity].filter(Boolean).join(" → ") || "your route";
  const fallback = `Hi ${shipment.senderName}, your shipment ${shipment.bookingNumber} has been booked successfully (${route}). Thank you for choosing XGoo!`;

  await sendAutomatedWhatsApp(
    whatsappSettingsRaw,
    "booking_success",
    shipment.senderPhone,
    {
      name: shipment.senderName,
      requestNumber: shipment.bookingNumber,
      bookingNumber: shipment.bookingNumber,
      route,
    },
    fallback,
  );
}

export function triggerBookingRequestWhatsApp(
  whatsappSettingsRaw: unknown,
  request: BookingRequestNotify,
): void {
  void sendBookingRequestWhatsApp(whatsappSettingsRaw, request).catch((error) => {
    console.error("[WhatsApp booking_request] Failed", formatMetaGraphError(error));
  });
}

export function triggerBookingSuccessWhatsApp(
  whatsappSettingsRaw: unknown,
  shipment: ShipmentNotify,
): void {
  void sendBookingSuccessWhatsApp(whatsappSettingsRaw, shipment).catch((error) => {
    console.error("[WhatsApp booking_success] Failed", formatMetaGraphError(error));
  });
}

export async function sendInboundWelcomeMessage(
  settings: WhatsAppSettings,
  toPhone: string,
  customerName?: string,
): Promise<boolean> {
  const rule = settings.automation.welcome;
  if (!rule?.enabled) {
    recordWhatsAppWebhookDebug({
      level: "warn",
      event: "welcome_skipped",
      from: toPhone,
      detail: "Welcome automation is disabled — enable Welcome Message → Auto-send in Settings",
    });
    return false;
  }
  if (!rule.templateName?.trim()) {
    recordWhatsAppWebhookDebug({
      level: "warn",
      event: "welcome_skipped",
      from: toPhone,
      detail: "No welcome template selected — set template to welcome_message",
    });
    return false;
  }
  if (rule.replyOnInboundGreeting === false) {
    recordWhatsAppWebhookDebug({
      level: "warn",
      event: "welcome_skipped",
      from: toPhone,
      detail: "Reply on Hi/Hello is turned off in Welcome automation settings",
    });
    return false;
  }
  if (!configFromSettings(settings)) {
    recordWhatsAppWebhookDebug({
      level: "warn",
      event: "welcome_skipped",
      from: toPhone,
      detail: "Phone Number ID or Access Token missing in WhatsApp settings",
    });
    return false;
  }

  const to = normalizeWhatsAppPhone(toPhone);
  if (to.length < 10) {
    recordWhatsAppWebhookDebug({
      level: "warn",
      event: "welcome_skipped",
      from: toPhone,
      detail: "Invalid sender phone number",
    });
    return false;
  }
  if (!shouldSendWelcomeToPhone(to)) {
    recordWhatsAppWebhookDebug({
      level: "info",
      event: "welcome_skipped",
      from: to,
      detail: "Welcome already sent to this number in the last 24 hours (cooldown)",
    });
    return false;
  }

  const config = await resolveWhatsAppApiConfig(settings);
  if (!config) {
    recordWhatsAppWebhookDebug({
      level: "warn",
      event: "welcome_skipped",
      from: to,
      detail: "Could not resolve Meta API config (check token and WABA)",
    });
    return false;
  }

  const templateName = rule.templateName.trim();
  const meta = enrichTemplateForSend(
    getTemplateDefinition(settings.templates, templateName, rule.languageCode),
    templateName,
    settings,
  );
  const displayName = customerName?.trim() || "XGoo Customer";
  const welcomeDefaults = applyWelcomeTemplateDefaults(settings, templateName, {
    bodyParams: [displayName],
    customerName: displayName,
    trackingRef: settings.welcomeTemplateConfig?.trackShipmentSuffix || "xgoo",
  });
  const components = buildAutomationTemplateComponents(settings, meta, templateName, {
    bodyParams: welcomeDefaults.bodyParams,
    buttonParams: welcomeDefaults.buttonParams,
  });

  try {
    await sendWhatsAppTemplateMessage(config, {
      to,
      templateName,
      languageCode: meta?.language || rule.languageCode || "en",
      components,
    });
    markWelcomeSentToPhone(to);
    recordWhatsAppWebhookDebug({
      level: "info",
      event: "welcome_sent",
      from: to,
      detail: `Sent template "${templateName}" to ${to}`,
    });
    console.info("[WhatsApp welcome] Inbound greeting reply sent", { to, templateName });
    return true;
  } catch (error) {
    const metaErr = formatMetaGraphError(error);
    recordWhatsAppWebhookDebug({
      level: "error",
      event: "welcome_send_failed",
      from: to,
      detail: `${metaErr.message}${metaErr.code ? ` (#${metaErr.code})` : ""}`,
    });
    throw error;
  }
}

export async function handleInboundWhatsAppMessage(
  settings: WhatsAppSettings,
  officeId: string,
  fromPhone: string,
  messageText: string,
  customerName?: string,
  lookup?: {
    findByRequestNumber: (requestNumber: string) => Promise<BookingRequest | undefined>;
    findRecentByPhone: (phone: string) => Promise<BookingRequest[]>;
  },
): Promise<void> {
  const trimmed = messageText.trim();
  const requestNumberMatch = trimmed.match(/\b(BR[\w-]+)\b/i);

  if (isInboundGreetingMessage(trimmed)) {
    const sent = await sendInboundWelcomeMessage(settings, fromPhone, customerName);
    if (sent) return;
  }

  if (requestNumberMatch && lookup) {
    await replyWithBookingLookup(settings, officeId, fromPhone, messageText, lookup);
    return;
  }

  if (lookup) {
    const recent = await lookup.findRecentByPhone(fromPhone);
    if (recent.length > 0) {
      await replyWithBookingLookup(settings, officeId, fromPhone, messageText, lookup);
      return;
    }
  }

  const sent = await sendInboundWelcomeMessage(settings, fromPhone, customerName);
  if (sent) return;

  if (!configFromSettings(settings)) return;
  const config = await resolveWhatsAppApiConfig(settings);
  if (!config) return;
  await sendWhatsAppTextMessage(config, {
    to: normalizeWhatsAppPhone(fromPhone),
    text: "Hi! Welcome to XGoo. Reply with your booking number (e.g. BR-12345) or say Hi to see our welcome menu.",
  });
}

export async function replyWithBookingLookup(
  settings: WhatsAppSettings,
  _officeId: string,
  fromPhone: string,
  messageText: string,
  lookup: {
    findByRequestNumber: (requestNumber: string) => Promise<BookingRequest | undefined>;
    findRecentByPhone: (phone: string) => Promise<BookingRequest[]>;
  },
): Promise<void> {
  if (!configFromSettings(settings)) return;
  const config = await resolveWhatsAppApiConfig(settings);
  if (!config) return;

  const to = normalizeWhatsAppPhone(fromPhone);
  const trimmed = messageText.trim();
  const requestNumberMatch = trimmed.match(/\b(BR[\w-]+)\b/i);
  let request: BookingRequest | undefined;

  if (requestNumberMatch) {
    request = await lookup.findByRequestNumber(requestNumberMatch[1].toUpperCase());
  } else {
    const recent = await lookup.findRecentByPhone(fromPhone);
    request = recent[0];
  }

  if (!request) {
    await sendWhatsAppTextMessage(config, {
      to,
      text: "We could not find a booking for that number. Reply with your request number (e.g. BR-12345) or book at our portal.",
    });
    return;
  }

  const route = [request.senderCity, request.receiverCity].filter(Boolean).join(" → ");
  const statusLabel = request.status.replace(/_/g, " ");
  await sendWhatsAppTextMessage(config, {
    to,
    text: `Booking ${request.requestNumber}\nStatus: ${statusLabel}\nRoute: ${route || "—"}\nService: ${request.serviceType === "air" ? "Air" : "Surface"}\n\nThank you for choosing XGoo!`,
  });
}
