import bcrypt from "bcryptjs";
import { randomInt, randomUUID } from "crypto";
import { and, desc, eq, gt } from "drizzle-orm";
import { customerOtps, type Office, type PickupPartner } from "@shared/schema";
import {
  buildOtpTemplateComponents,
  getTemplateDefinition,
  isCustomerOtpWhatsAppReady,
  mergeWhatsAppSettings,
  resolveTemplateLanguageForSend,
} from "@shared/whatsapp";
import { db } from "./db";
import {
  configForMessaging,
  sendWhatsAppTemplateMessage,
} from "./integrations/whatsapp";
import { ensureCustomerOtpTable } from "./customer-otp";
import { startPartnerShift } from "./pickup-fuel";
import { storage } from "./storage";

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 45 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_HOUR = 5;
const PICKUP_OTP_PURPOSE = "pickup_login";
export const DUMMY_PICKUP_OTP = "123456";

function isDummyOtpEnabled() {
  return process.env.CUSTOMER_OTP_DUMMY !== "0";
}

export function normalizePickupPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function officeWhatsAppSettings(office: Office) {
  return mergeWhatsAppSettings(
    (office as { whatsappSettings?: unknown }).whatsappSettings,
  );
}

function whatsappOtpReady(office: Office) {
  return isCustomerOtpWhatsAppReady(officeWhatsAppSettings(office));
}

async function sendOtpWhatsApp(office: Office, phone: string, code: string) {
  const settings = officeWhatsAppSettings(office);
  const config = configForMessaging(settings);
  if (!config) {
    throw new Error("WhatsApp is not configured for this office.");
  }

  const rule = settings.automation.customer_otp;
  const templateName = rule?.templateName?.trim();
  if (!rule?.enabled || !templateName) {
    throw new Error(
      "Map an approved WhatsApp Authentication template to Login OTP in Settings → WhatsApp Business.",
    );
  }

  const languageCode = resolveTemplateLanguageForSend(
    settings.templates,
    templateName,
    rule.languageCode,
  );
  const template = getTemplateDefinition(settings.templates, templateName, languageCode);

  const send = sendWhatsAppTemplateMessage(config, {
    to: phone,
    templateName,
    languageCode,
    components: buildOtpTemplateComponents(code, template),
  });
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("WhatsApp OTP timed out.")), 12_000);
  });
  await Promise.race([send, timeout]);
}

export async function issuePickupPartnerSession(partner: PickupPartner) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await storage.createPickupPartnerSession({
    partnerId: partner.id,
    token,
    expiresAt,
  });
  await startPartnerShift(partner).catch((error) => {
    console.warn("Could not start pickup duty shift", error);
  });
  return { user: partner, token };
}

export function assertPickupPartnerCanLogin(partner: PickupPartner | undefined) {
  if (!partner) {
    throw Object.assign(new Error("No XGoo Pickup partner found for this mobile number."), {
      status: 404,
    });
  }
  if (partner.status === "pending") {
    throw Object.assign(
      new Error("Hub has not activated this partner yet. Wait until a store is assigned."),
      { status: 403 },
    );
  }
  if (partner.status !== "active") {
    throw Object.assign(new Error("This pickup partner account is inactive."), { status: 403 });
  }
  if (!partner.branchId) {
    throw Object.assign(
      new Error("Hub must assign a store before this partner can sign in."),
      { status: 403 },
    );
  }
  return partner;
}

export async function sendPickupPartnerOtp(input: { office: Office; phone: string }) {
  await ensureCustomerOtpTable();
  const phone = normalizePickupPhone(input.phone);
  if (phone.length < 10) {
    throw Object.assign(new Error("Enter a valid 10-digit mobile number."), { status: 400 });
  }

  const partner = await storage.getPickupPartnerByPhone(input.office.id, phone);
  assertPickupPartnerCanLogin(partner);

  const recent = await db
    .select()
    .from(customerOtps)
    .where(
      and(
        eq(customerOtps.officeId, input.office.id),
        eq(customerOtps.phone, phone),
        eq(customerOtps.purpose, PICKUP_OTP_PURPOSE),
        gt(customerOtps.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
      ),
    )
    .orderBy(desc(customerOtps.createdAt));

  if (recent.length >= MAX_SENDS_PER_HOUR) {
    throw Object.assign(new Error("Too many OTP requests. Try again in an hour."), { status: 429 });
  }
  const latest = recent[0];
  const lastSentAt = latest?.createdAt ? new Date(latest.createdAt).getTime() : 0;
  if (lastSentAt && Date.now() - lastSentAt < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - lastSentAt)) / 1000);
    throw Object.assign(new Error(`Wait ${waitSec} seconds before requesting another OTP.`), {
      status: 429,
    });
  }

  const dummy = isDummyOtpEnabled() && !whatsappOtpReady(input.office);
  const code = dummy ? DUMMY_PICKUP_OTP : String(randomInt(100000, 1000000));
  const codeHash = await bcrypt.hash(code, 10);

  await db
    .delete(customerOtps)
    .where(
      and(
        eq(customerOtps.officeId, input.office.id),
        eq(customerOtps.phone, phone),
        eq(customerOtps.purpose, PICKUP_OTP_PURPOSE),
      ),
    );

  await db.insert(customerOtps).values({
    officeId: input.office.id,
    phone,
    purpose: PICKUP_OTP_PURPOSE,
    codeHash,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  if (!dummy) {
    if (!whatsappOtpReady(input.office)) {
      throw Object.assign(new Error("WhatsApp OTP is not configured for this office yet."), {
        status: 503,
      });
    }
    try {
      await sendOtpWhatsApp(input.office, phone, code);
    } catch (error) {
      console.error("Pickup OTP WhatsApp send failed:", error);
      if (!isDummyOtpEnabled()) {
        throw Object.assign(new Error("Could not send the OTP just now. Please try again in a moment."), {
          status: 502,
        });
      }
      const fallbackHash = await bcrypt.hash(DUMMY_PICKUP_OTP, 10);
      await db
        .update(customerOtps)
        .set({ codeHash: fallbackHash })
        .where(
          and(
            eq(customerOtps.officeId, input.office.id),
            eq(customerOtps.phone, phone),
            eq(customerOtps.purpose, PICKUP_OTP_PURPOSE),
          ),
        );
    }
  }

  return {
    phone,
    expiresInSec: OTP_TTL_MS / 1000,
    channel: dummy ? ("dummy" as const) : ("whatsapp" as const),
  };
}

export async function consumePickupPartnerOtp(input: {
  officeId: string;
  phone: string;
  otp: string;
}) {
  await ensureCustomerOtpTable();
  const phone = normalizePickupPhone(input.phone);
  const otp = input.otp.replace(/\D/g, "");
  if (otp.length !== 6) {
    throw Object.assign(new Error("Enter the 6-digit OTP."), { status: 400 });
  }

  if (isDummyOtpEnabled() && otp === DUMMY_PICKUP_OTP) {
    await db
      .delete(customerOtps)
      .where(
        and(
          eq(customerOtps.officeId, input.officeId),
          eq(customerOtps.phone, phone),
          eq(customerOtps.purpose, PICKUP_OTP_PURPOSE),
        ),
      );
    return phone;
  }

  const [row] = await db
    .select()
    .from(customerOtps)
    .where(
      and(
        eq(customerOtps.officeId, input.officeId),
        eq(customerOtps.phone, phone),
        eq(customerOtps.purpose, PICKUP_OTP_PURPOSE),
      ),
    )
    .orderBy(desc(customerOtps.createdAt))
    .limit(1);

  if (!row || row.expiresAt.getTime() < Date.now()) {
    throw Object.assign(new Error("OTP expired. Request a new code."), { status: 401 });
  }
  if ((row.attempts ?? 0) >= MAX_ATTEMPTS) {
    throw Object.assign(new Error("Too many incorrect attempts. Request a new OTP."), { status: 401 });
  }

  const matches = await bcrypt.compare(otp, row.codeHash);
  if (!matches) {
    await db
      .update(customerOtps)
      .set({ attempts: (row.attempts ?? 0) + 1 })
      .where(eq(customerOtps.id, row.id));
    throw Object.assign(new Error("Incorrect OTP. Try again."), { status: 401 });
  }

  await db.delete(customerOtps).where(eq(customerOtps.id, row.id));
  return phone;
}

export function pickupOtpError(res: { status: (code: number) => { json: (body: unknown) => unknown } }, error: unknown) {
  const status = (error as { status?: number })?.status;
  const message = error instanceof Error ? error.message : "OTP failed";
  if (typeof status === "number") {
    return res.status(status).json({ message });
  }
  return res.status(400).json({ message });
}
