import type { Request, Response } from "express";
import { sql, eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { offices, bookingRequests } from "@shared/schema";
import { mergeWhatsAppSettings } from "@shared/whatsapp";
import { replyWithBookingLookup } from "./whatsapp-notifications";

type WebhookMessage = {
  from?: string;
  type?: string;
  text?: { body?: string };
};

type WebhookChange = {
  value?: {
    metadata?: { phone_number_id?: string };
    messages?: WebhookMessage[];
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

async function findOfficeByPhoneNumberId(phoneNumberId: string) {
  const rows = await db
    .select()
    .from(offices)
    .where(sql`${offices.whatsappSettings}->>'phoneNumberId' = ${phoneNumberId}`)
    .limit(1);
  return rows[0];
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
    res.status(200).send(challenge);
    return;
  }
  res.sendStatus(403);
}

export async function handleWhatsAppWebhookPost(req: Request, res: Response): Promise<void> {
  res.sendStatus(200);

  try {
    const body = req.body as { entry?: Array<{ changes?: WebhookChange[] }> };
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;
        if (!phoneNumberId) continue;

        const office = await findOfficeByPhoneNumberId(phoneNumberId);
        if (!office) continue;

        const settings = mergeWhatsAppSettings(
          (office as { whatsappSettings?: unknown }).whatsappSettings,
        );
        if (!settings.enabled) continue;

        for (const message of value.messages || []) {
          if (message.type !== "text" || !message.text?.body || !message.from) continue;

          void replyWithBookingLookup(
            settings,
            office.id,
            message.from,
            message.text.body,
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
          ).catch((error) => {
            console.error("[WhatsApp webhook] Reply failed", error);
          });
        }
      }
    }
  } catch (error) {
    console.error("[WhatsApp webhook] Processing error", error);
  }
}
