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
  configForMessaging,
  configFromSettings,
  formatMetaGraphError,
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
> & {
  awbNumber?: string | null;
  externalAwb?: string | null;
};

async function sendAutomatedWhatsApp(
  whatsappSettingsRaw: unknown,
  ruleKey: WhatsAppMessageTypeKey,
  toPhone: string,
  values: {
    name: string;
    requestNumber: string;
    route?: string;
    bookingNumber?: string;
    trackUrl?: string;
    invoiceNumber?: string;
  },
  fallbackText: string,
): Promise<void> {
  const settings = mergeWhatsAppSettings(whatsappSettingsRaw);
  if (!settings.enabled) return;

  const rule = settings.automation[ruleKey];
  if (!rule?.enabled) return;
  if (!configFromSettings(settings)) return;

  const config = configForMessaging(settings);
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

export async function sendTrackingWhatsApp(
  whatsappSettingsRaw: unknown,
  shipment: ShipmentNotify,
  trackUrl: string,
): Promise<void> {
  const awb = (shipment.awbNumber || shipment.externalAwb || shipment.bookingNumber).trim();
  const route =
    [shipment.senderCity, shipment.receiverCity].filter(Boolean).join(" → ") || "your route";
  await sendAutomatedWhatsApp(
    whatsappSettingsRaw,
    "tracking",
    shipment.senderPhone,
    {
      name: shipment.senderName,
      requestNumber: awb,
      bookingNumber: shipment.bookingNumber,
      route,
      trackUrl,
    },
    `Hi ${shipment.senderName}, your shipment ${shipment.bookingNumber} is booked. Track it here: ${trackUrl}`,
  );
}

export async function sendInvoiceWhatsApp(
  whatsappSettingsRaw: unknown,
  shipment: ShipmentNotify,
  invoiceNumber: string,
  invoiceUrl: string,
): Promise<void> {
  await sendAutomatedWhatsApp(
    whatsappSettingsRaw,
    "invoice",
    shipment.senderPhone,
    {
      name: shipment.senderName,
      requestNumber: invoiceNumber,
      bookingNumber: shipment.bookingNumber,
      trackUrl: invoiceUrl,
      invoiceNumber,
    },
    `Hi ${shipment.senderName}, invoice ${invoiceNumber} for shipment ${shipment.bookingNumber} is ready: ${invoiceUrl}`,
  );
}

export function triggerTrackingWhatsApp(
  whatsappSettingsRaw: unknown,
  shipment: ShipmentNotify,
  trackUrl: string,
): void {
  void sendTrackingWhatsApp(whatsappSettingsRaw, shipment, trackUrl).catch((error) => {
    console.error("[WhatsApp tracking] Failed", formatMetaGraphError(error));
  });
}

export function triggerInvoiceWhatsApp(
  whatsappSettingsRaw: unknown,
  shipment: ShipmentNotify,
  invoiceNumber: string,
  invoiceUrl: string,
): void {
  void sendInvoiceWhatsApp(whatsappSettingsRaw, shipment, invoiceNumber, invoiceUrl).catch((error) => {
    console.error("[WhatsApp invoice] Failed", formatMetaGraphError(error));
  });
}

export async function sendQuoteWhatsApp(
  whatsappSettingsRaw: unknown,
  toPhone: string,
  customerName: string,
  quoteUrl: string,
  totalAmount: string,
): Promise<void> {
  const settings = mergeWhatsAppSettings(whatsappSettingsRaw);
  if (!settings.enabled) return;
  const config = configForMessaging(settings);
  if (!config) return;
  const to = normalizeWhatsAppPhone(toPhone);
  if (to.length < 10) return;
  await sendWhatsAppTextMessage(config, {
    to,
    text: `Hi ${customerName}, your XGoo Pickup quote is ready (₹${totalAmount}). Review and accept here: ${quoteUrl}\n\nReply ACCEPT to confirm.`,
  });
}

async function sendEnabledWhatsAppText(
  whatsappSettingsRaw: unknown,
  toPhone: string,
  text: string,
): Promise<void> {
  const settings = mergeWhatsAppSettings(whatsappSettingsRaw);
  if (!settings.enabled) return;
  const config = configForMessaging(settings);
  if (!config) return;
  const to = normalizeWhatsAppPhone(toPhone);
  if (to.length < 10) return;
  await sendWhatsAppTextMessage(config, { to, text });
}

export function triggerShipmentPartyWhatsApp(
  whatsappSettingsRaw: unknown,
  input: {
    senderName: string;
    senderPhone: string;
    receiverName: string;
    receiverPhone: string;
    bookingNumber: string;
    route: string;
    amount?: string | null;
    trackUrl: string;
  },
): void {
  const amountLine = input.amount ? `Amount: ₹${input.amount}. ` : "";
  void sendEnabledWhatsAppText(
    whatsappSettingsRaw,
    input.senderPhone,
    `Hi ${input.senderName}, XGoo booking ${input.bookingNumber} is confirmed (${input.route}). ${amountLine}Track: ${input.trackUrl}`,
  ).catch((error) => {
    console.error("[WhatsApp shipment sender] Failed", formatMetaGraphError(error));
  });
  void sendEnabledWhatsAppText(
    whatsappSettingsRaw,
    input.receiverPhone,
    `Hi ${input.receiverName}, your XGoo booking ${input.bookingNumber} is on the way. Track it here: ${input.trackUrl}`,
  ).catch((error) => {
    console.error("[WhatsApp shipment receiver] Failed", formatMetaGraphError(error));
  });
}

export function triggerReceiverTrackingWhatsApp(
  whatsappSettingsRaw: unknown,
  input: { receiverName: string; receiverPhone: string; bookingNumber: string; trackUrl: string },
): void {
  void sendEnabledWhatsAppText(
    whatsappSettingsRaw,
    input.receiverPhone,
    `Hi ${input.receiverName}, track XGoo booking ${input.bookingNumber} here: ${input.trackUrl}`,
  ).catch((error) => {
    console.error("[WhatsApp receiver tracking] Failed", formatMetaGraphError(error));
  });
}

export function triggerQuoteWhatsApp(
  whatsappSettingsRaw: unknown,
  toPhone: string,
  customerName: string,
  quoteUrl: string,
  totalAmount: string,
): void {
  void sendQuoteWhatsApp(whatsappSettingsRaw, toPhone, customerName, quoteUrl, totalAmount).catch(
    (error) => {
      console.error("[WhatsApp quote] Failed", formatMetaGraphError(error));
    },
  );
}

export async function sendInboundWelcomeMessage(
  settings: WhatsAppSettings,
  toPhone: string,
  customerName?: string,
  trackingRef?: string,
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
      detail: "Reply on first-time open / Hi / Hello / Menu is turned off in Welcome automation settings",
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

  const config = configForMessaging(settings);
  if (!config) {
    recordWhatsAppWebhookDebug({
      level: "warn",
      event: "welcome_skipped",
      from: to,
      detail: "Could not resolve Meta API config (check token and Phone Number ID)",
    });
    return false;
  }

  const sendStarted = Date.now();
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
    trackingRef:
      trackingRef?.trim() || settings.welcomeTemplateConfig?.trackShipmentSuffix || "open",
  });
  const components = buildAutomationTemplateComponents(settings, meta, templateName, {
    bodyParams: welcomeDefaults.bodyParams,
    buttonParams: welcomeDefaults.buttonParams,
  });

  try {
    const languageCode = meta?.language || rule.languageCode || "en";
    await sendWhatsAppTemplateMessage(config, {
      to,
      templateName,
      languageCode,
      components,
    });
    markWelcomeSentToPhone(to);
    const sendMs = Date.now() - sendStarted;
    recordWhatsAppWebhookDebug({
      level: "info",
      event: "welcome_sent",
      from: to,
      detail: `Queued template "${templateName}" (${languageCode}) in ${sendMs}ms. WhatsApp delivery time depends on Meta (MARKETING templates can take 1–2 min).`,
    });
    console.info("[WhatsApp welcome] Inbound greeting template sent", {
      to,
      templateName,
      languageCode,
      sendMs,
    });
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
  options?: { forceWelcome?: boolean },
): Promise<void> {
  const trimmed = messageText.trim();
  const requestNumberMatch = trimmed.match(/\b(BR[\w-]+)\b/i);

  if (options?.forceWelcome || isInboundGreetingMessage(trimmed)) {
    let trackingRef: string | undefined;
    if (lookup) {
      const recent = await lookup.findRecentByPhone(fromPhone);
      trackingRef = recent[0]?.requestNumber;
    }
    await sendInboundWelcomeMessage(settings, fromPhone, customerName, trackingRef);
    return;
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

  if (settings.automation.welcome?.enabled) return;

  if (!configFromSettings(settings)) return;
  const config = configForMessaging(settings);
  if (!config) return;
  await sendWhatsAppTextMessage(config, {
    to: normalizeWhatsAppPhone(fromPhone),
    text: "Hi! Welcome to XGoo Go. Reply with your booking number (e.g. BR-12345) or send Hi, Hello, or Menu to see our welcome options.",
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
  const config = configForMessaging(settings);
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
