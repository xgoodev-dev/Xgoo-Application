/** Recent webhook events for staff debugging (in-memory, last 30). */
export type WhatsAppWebhookDebugEvent = {
  at: string;
  level: "info" | "warn" | "error";
  event: string;
  detail?: string;
  phoneNumberId?: string;
  from?: string;
  messagePreview?: string;
};

const recentWebhookEvents: WhatsAppWebhookDebugEvent[] = [];
const MAX_WEBHOOK_DEBUG_EVENTS = 30;

export function recordWhatsAppWebhookDebug(event: Omit<WhatsAppWebhookDebugEvent, "at">): void {
  recentWebhookEvents.unshift({ ...event, at: new Date().toISOString() });
  if (recentWebhookEvents.length > MAX_WEBHOOK_DEBUG_EVENTS) {
    recentWebhookEvents.length = MAX_WEBHOOK_DEBUG_EVENTS;
  }
  const prefix = `[WhatsApp webhook] ${event.event}`;
  const extra = event.detail ? ` — ${event.detail}` : "";
  if (event.level === "error") {
    console.error(prefix + extra, {
      phoneNumberId: event.phoneNumberId,
      from: event.from,
      messagePreview: event.messagePreview,
    });
  } else if (event.level === "warn") {
    console.warn(prefix + extra, {
      phoneNumberId: event.phoneNumberId,
      from: event.from,
    });
  } else {
    console.info(prefix + extra, {
      phoneNumberId: event.phoneNumberId,
      from: event.from,
      messagePreview: event.messagePreview,
    });
  }
}

export function getRecentWhatsAppWebhookDebugEvents(): WhatsAppWebhookDebugEvent[] {
  return [...recentWebhookEvents];
}

export function clearWelcomeCooldownForPhone(phone: string): void {
  recentWelcomeByPhone.delete(phone.replace(/\D/g, ""));
}

/** In-memory delivery status from Meta webhooks (last ~100 messages, 24h TTL). */
export type WhatsAppDeliveryStatusRecord = {
  messageId: string;
  status: string;
  recipientId?: string;
  phoneNumberId?: string;
  errorCode?: number;
  errorTitle?: string;
  errorMessage?: string;
  updatedAt: string;
};

const statusByMessageId = new Map<string, WhatsAppDeliveryStatusRecord>();
const recentWelcomeByPhone = new Map<string, number>();
const MAX_STATUS_ENTRIES = 100;
const STATUS_TTL_MS = 24 * 60 * 60 * 1000;
const WELCOME_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function recordWhatsAppDeliveryStatus(input: {
  messageId: string;
  status: string;
  recipientId?: string;
  phoneNumberId?: string;
  errorCode?: number;
  errorTitle?: string;
  errorMessage?: string;
}): void {
  const now = new Date().toISOString();
  statusByMessageId.set(input.messageId, {
    messageId: input.messageId,
    status: input.status,
    recipientId: input.recipientId,
    phoneNumberId: input.phoneNumberId,
    errorCode: input.errorCode,
    errorTitle: input.errorTitle,
    errorMessage: input.errorMessage,
    updatedAt: now,
  });

  if (statusByMessageId.size > MAX_STATUS_ENTRIES) {
    const oldest = Array.from(statusByMessageId.entries()).sort(
      (a, b) => a[1].updatedAt.localeCompare(b[1].updatedAt),
    )[0]?.[0];
    if (oldest) statusByMessageId.delete(oldest);
  }

  const cutoff = Date.now() - STATUS_TTL_MS;
  for (const [id, rec] of Array.from(statusByMessageId.entries())) {
    if (new Date(rec.updatedAt).getTime() < cutoff) {
      statusByMessageId.delete(id);
    }
  }
}

export function getWhatsAppDeliveryStatus(
  messageId: string,
): WhatsAppDeliveryStatusRecord | undefined {
  return statusByMessageId.get(messageId.trim());
}

export function shouldSendWelcomeToPhone(phone: string): boolean {
  const key = phone.replace(/\D/g, "");
  const last = recentWelcomeByPhone.get(key);
  if (last && Date.now() - last < WELCOME_COOLDOWN_MS) return false;
  return true;
}

export function markWelcomeSentToPhone(phone: string): void {
  const key = phone.replace(/\D/g, "");
  recentWelcomeByPhone.set(key, Date.now());
  if (recentWelcomeByPhone.size > 500) {
    const oldest = Array.from(recentWelcomeByPhone.entries()).sort((a, b) => a[1] - b[1])[0]?.[0];
    if (oldest) recentWelcomeByPhone.delete(oldest);
  }
}

export async function verifyHeaderMediaReachable(
  url: string,
): Promise<{ ok: boolean; statusCode?: number; contentType?: string; error?: string }> {
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) {
    return { ok: false, error: "Header image must be a public HTTPS URL." };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(trimmed, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    const contentType = res.headers.get("content-type") || "";
    if (!res.ok) {
      return {
        ok: false,
        statusCode: res.status,
        contentType,
        error: `Meta cannot fetch this image (HTTP ${res.status}). Upload again on your live site or use a direct HTTPS link.`,
      };
    }

    if (contentType && !contentType.startsWith("image/")) {
      return {
        ok: false,
        statusCode: res.status,
        contentType,
        error: `URL does not return an image (got ${contentType}). Meta will reject the template header.`,
      };
    }

    return { ok: true, statusCode: res.status, contentType };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: `Could not reach header image URL: ${msg}` };
  }
}
