import type { Request, Response } from "express";
import { sql, eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { offices, bookingRequests } from "@shared/schema";
import { mergeWhatsAppSettings } from "@shared/whatsapp";
import {
  recordWhatsAppDeliveryStatus,
  recordWhatsAppWebhookDebug,
} from "./whatsapp-delivery";
import { handleInboundWhatsAppMessage } from "./whatsapp-notifications";

type WebhookMessage = {
  from?: string;
  type?: string;
  text?: { body?: string };
};

type WebhookChange = {
  field?: string;
  value?: {
    metadata?: { phone_number_id?: string; display_phone_number?: string };
    messaging_product?: string;
    contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
    messages?: WebhookMessage[];
    statuses?: Array<{
      id?: string;
      status?: string;
      recipient_id?: string;
      errors?: Array<{ code?: number; title?: string; message?: string }>;
    }>;
  };
};

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function phonesMatch(a: string, b: string): boolean {
  const da = normalizePhoneDigits(a);
  const dbDigits = normalizePhoneDigits(b);
  if (da === dbDigits) return true;
  if (da.length >= 10 && dbDigits.length >= 10) {
    return da.slice(-10) === dbDigits.slice(-10);
  }
  return false;
}

const OFFICE_CACHE_MS = 60_000;
const officeByPhoneNumberIdCache = new Map<
  string,
  { office: (typeof offices.$inferSelect); at: number }
>();

async function findOfficeByPhoneNumberId(phoneNumberId: string) {
  const cached = officeByPhoneNumberIdCache.get(phoneNumberId);
  if (cached && Date.now() - cached.at < OFFICE_CACHE_MS) {
    return cached.office;
  }

  const rows = await db
    .select()
    .from(offices)
    .where(sql`${offices.whatsappSettings}->>'phoneNumberId' = ${phoneNumberId}`)
    .limit(1);
  const office = rows[0];
  if (office) {
    officeByPhoneNumberIdCache.set(phoneNumberId, { office, at: Date.now() });
  }
  return office;
}

async function listConfiguredPhoneNumberIds(): Promise<string[]> {
  const rows = await db.select().from(offices);
  return rows
    .map((office) =>
      mergeWhatsAppSettings((office as { whatsappSettings?: unknown }).whatsappSettings)
        .phoneNumberId?.trim(),
    )
    .filter((id): id is string => Boolean(id));
}

async function findRecentBookingsByPhone(officeId: string, phone: string, limit = 3) {
  const rows = await db
    .select()
    .from(bookingRequests)
    .where(eq(bookingRequests.officeId, officeId))
    .orderBy(desc(bookingRequests.createdAt))
    .limit(50);
  return rows.filter((r) => phonesMatch(r.senderPhone, phone)).slice(0, limit);
}

async function officeVerifyTokenMatches(verifyToken: string): Promise<boolean> {
  const globalToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim();
  if (globalToken && verifyToken === globalToken) return true;

  const rows = await db.select().from(offices);
  return rows.some((office) => {
    const settings = mergeWhatsAppSettings(
      (office as { whatsappSettings?: unknown }).whatsappSettings,
    );
    return settings.webhookVerifyToken?.trim() === verifyToken;
  });
}

export async function handleWhatsAppWebhookGet(req: Request, res: Response): Promise<void> {
  const mode = req.query["hub.mode"];
  const token = String(req.query["hub.verify_token"] || "");
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token && (await officeVerifyTokenMatches(token))) {
    recordWhatsAppWebhookDebug({
      level: "info",
      event: "webhook_verified",
      detail: "Meta subscription challenge accepted",
    });
    res.status(200).send(challenge);
    return;
  }
  recordWhatsAppWebhookDebug({
    level: "warn",
    event: "webhook_verify_failed",
    detail: "Verify token mismatch or invalid subscribe request",
  });
  res.sendStatus(403);
}

export async function handleWhatsAppWebhookPost(req: Request, res: Response): Promise<void> {
  res.sendStatus(200);

  try {
    const body = req.body as { object?: string; entry?: Array<{ changes?: WebhookChange[] }> };
    if (!body?.entry?.length) {
      recordWhatsAppWebhookDebug({
        level: "warn",
        event: "empty_payload",
        detail: "POST received but entry[] is empty — check Meta webhook field subscriptions (messages)",
      });
      return;
    }

    recordWhatsAppWebhookDebug({
      level: "info",
      event: "post_received",
      detail: `object=${body.object || "unknown"} entries=${body.entry.length}`,
    });

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;
        const field = change.field || "unknown";

        if (!phoneNumberId) {
          recordWhatsAppWebhookDebug({
            level: "warn",
            event: "missing_phone_number_id",
            detail: `Webhook field "${field}" had no metadata.phone_number_id`,
          });
          continue;
        }

        const office = await findOfficeByPhoneNumberId(phoneNumberId);
        if (!office) {
          const configured = await listConfiguredPhoneNumberIds();
          recordWhatsAppWebhookDebug({
            level: "warn",
            event: "office_not_found",
            phoneNumberId,
            detail: `No XGoo office for Phone Number ID ${phoneNumberId}. Saved in XGoo: ${configured.join(", ") || "(none)"}. Update Phone Number ID in Settings → WhatsApp.`,
          });
          continue;
        }

        const settings = mergeWhatsAppSettings(
          (office as { whatsappSettings?: unknown }).whatsappSettings,
        );
        if (!settings.enabled) {
          recordWhatsAppWebhookDebug({
            level: "warn",
            event: "whatsapp_disabled",
            phoneNumberId,
            detail: "WhatsApp is disabled in XGoo settings for this office",
          });
          continue;
        }

        for (const statusUpdate of value.statuses || []) {
          const level = statusUpdate.status === "failed" ? "error" : "info";
          const errDetail = statusUpdate.errors?.[0];
          if (statusUpdate.id && statusUpdate.status) {
            recordWhatsAppDeliveryStatus({
              messageId: statusUpdate.id,
              status: statusUpdate.status,
              recipientId: statusUpdate.recipient_id,
              phoneNumberId,
              errorCode: errDetail?.code,
              errorTitle: errDetail?.title,
              errorMessage: errDetail?.message,
            });
          }
          recordWhatsAppWebhookDebug({
            level: level === "error" ? "error" : "info",
            event: "message_status",
            phoneNumberId,
            from: statusUpdate.recipient_id,
            detail: `${statusUpdate.status}${errDetail?.message ? `: ${errDetail.message}` : ""}`,
          });
        }

        const inboundMessages = value.messages || [];
        if (inboundMessages.length === 0 && field === "messages") {
          recordWhatsAppWebhookDebug({
            level: "info",
            event: "messages_field_no_inbound",
            phoneNumberId,
            detail: "messages webhook with statuses only (no customer text)",
          });
        }

        for (const message of inboundMessages) {
          if (message.type !== "text" || !message.text?.body || !message.from) {
            recordWhatsAppWebhookDebug({
              level: "info",
              event: "skipped_non_text",
              phoneNumberId,
              from: message.from,
              detail: `Ignored message type "${message.type || "unknown"}"`,
            });
            continue;
          }

          const preview = message.text.body.slice(0, 80);
          recordWhatsAppWebhookDebug({
            level: "info",
            event: "inbound_text",
            phoneNumberId,
            from: message.from,
            messagePreview: preview,
            detail: `Processing "${preview}"`,
          });

          const contactName = value.contacts?.find((c) => c.wa_id === message.from)?.profile?.name;

          void handleInboundWhatsAppMessage(
            settings,
            office.id,
            message.from,
            message.text.body,
            contactName,
            {
              findByRequestNumber: async (requestNumber) => {
                const rows = await db
                  .select()
                  .from(bookingRequests)
                  .where(
                    and(
                      eq(bookingRequests.officeId, office.id),
                      eq(bookingRequests.requestNumber, requestNumber),
                    ),
                  )
                  .limit(1);
                return rows[0];
              },
              findRecentByPhone: (phone) => findRecentBookingsByPhone(office.id, phone),
            },
          )
            .then(() => {
              recordWhatsAppWebhookDebug({
                level: "info",
                event: "inbound_handled",
                phoneNumberId,
                from: message.from,
                messagePreview: preview,
                detail: "Handler completed",
              });
            })
            .catch((error) => {
              const msg = error instanceof Error ? error.message : String(error);
              recordWhatsAppWebhookDebug({
                level: "error",
                event: "inbound_failed",
                phoneNumberId,
                from: message.from,
                messagePreview: preview,
                detail: msg,
              });
            });
        }
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    recordWhatsAppWebhookDebug({
      level: "error",
      event: "processing_error",
      detail: msg,
    });
  }
}

/** Re-export lookup helpers for handleInboundWhatsAppMessage booking path. */
export { findRecentBookingsByPhone };
