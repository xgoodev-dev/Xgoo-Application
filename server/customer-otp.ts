import bcrypt from "bcryptjs";
import { randomInt, randomUUID } from "crypto";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { customerOtps, type CustomerUser, type Office } from "@shared/schema";
import { mergeWhatsAppSettings } from "@shared/whatsapp";
import { db } from "./db";
import { configForMessaging, sendWhatsAppTextMessage } from "./integrations/whatsapp";
import { storage } from "./storage";

export type CustomerOtpPurpose = "login" | "register";

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 45 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_HOUR = 5;
/** Temporary login/signup code until WhatsApp OTP is configured. */
export const DUMMY_CUSTOMER_OTP = "123456";

function isDummyOtpEnabled() {
  return process.env.CUSTOMER_OTP_DUMMY !== "0";
}

let tableReady: Promise<void> | null = null;

export function normalizeCustomerPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function maskPhone(phone: string) {
  return phone.length >= 4 ? `******${phone.slice(-4)}` : phone;
}

function whatsappReady(office: Office) {
  const settings = mergeWhatsAppSettings(
    (office as { whatsappSettings?: unknown }).whatsappSettings,
  );
  return Boolean(configForMessaging(settings));
}

async function ensureOtpTable() {
  if (!tableReady) {
    tableReady = db.execute(sql`
      CREATE TABLE IF NOT EXISTS customer_otps (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
        office_id varchar NOT NULL,
        phone varchar(20) NOT NULL,
        purpose varchar(20) NOT NULL,
        code_hash varchar(255) NOT NULL,
        expires_at timestamp NOT NULL,
        attempts integer NOT NULL DEFAULT 0,
        created_at timestamp DEFAULT now()
      )
    `).then(async () => {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_customer_otps_lookup
        ON customer_otps (office_id, phone, purpose)
      `);
    });
  }
  await tableReady;
}

async function sendOtpWhatsApp(office: Office, phone: string, code: string) {
  const settings = mergeWhatsAppSettings(
    (office as { whatsappSettings?: unknown }).whatsappSettings,
  );
  const config = configForMessaging(settings);
  if (!config) {
    throw new Error("WhatsApp is not configured for this office.");
  }

  await sendWhatsAppTextMessage(config, {
    to: phone,
    text: `Your XGoo verification code is ${code}. It expires in 5 minutes. Do not share this code.`,
  });
}

export async function issueCustomerSession(customerUser: CustomerUser) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await storage.createCustomerSession({
    customerUserId: customerUser.id,
    token,
    expiresAt,
  });
  const { passwordHash: _, ...safeUser } = customerUser;
  return { user: safeUser, token };
}

export async function sendCustomerOtp(input: {
  office: Office;
  phone: string;
  purpose: CustomerOtpPurpose;
}) {
  await ensureOtpTable();
  const phone = normalizeCustomerPhone(input.phone);
  if (phone.length < 10) {
    throw Object.assign(new Error("Enter a valid 10-digit mobile number."), { status: 400 });
  }

  const existing = await storage.getCustomerUserByPhone(input.office.id, phone);
  if (input.purpose === "login" && !existing) {
    throw Object.assign(new Error("No account found for this mobile number. Create an account first."), {
      status: 404,
    });
  }
  if (input.purpose === "register" && existing) {
    throw Object.assign(new Error("An account with this mobile number already exists. Sign in instead."), {
      status: 400,
    });
  }

  const recent = await db
    .select()
    .from(customerOtps)
    .where(
      and(
        eq(customerOtps.officeId, input.office.id),
        eq(customerOtps.phone, phone),
        eq(customerOtps.purpose, input.purpose),
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

  const dummy = isDummyOtpEnabled() && !whatsappReady(input.office);
  const code = dummy ? DUMMY_CUSTOMER_OTP : String(randomInt(100000, 1000000));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db
    .delete(customerOtps)
    .where(
      and(
        eq(customerOtps.officeId, input.office.id),
        eq(customerOtps.phone, phone),
        eq(customerOtps.purpose, input.purpose),
      ),
    );

  await db.insert(customerOtps).values({
    officeId: input.office.id,
    phone,
    purpose: input.purpose,
    codeHash,
    expiresAt,
  });

  if (!dummy) {
    try {
      await sendOtpWhatsApp(input.office, phone, code);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "WhatsApp send failed";
      console.error(`Customer OTP WhatsApp send failed for ${maskPhone(phone)}:`, reason);
      if (!isDummyOtpEnabled()) {
        throw Object.assign(
          new Error("Could not send the OTP just now. Please try again in a moment."),
          { status: 502 },
        );
      }
    }
  }

  return {
    phone,
    expiresInSec: OTP_TTL_MS / 1000,
    channel: dummy ? ("dummy" as const) : ("whatsapp" as const),
    ...(dummy || isDummyOtpEnabled() ? { debugOtp: dummy ? DUMMY_CUSTOMER_OTP : code } : {}),
  };
}

export async function consumeCustomerOtp(input: {
  officeId: string;
  phone: string;
  purpose: CustomerOtpPurpose;
  otp: string;
}) {
  await ensureOtpTable();
  const phone = normalizeCustomerPhone(input.phone);
  const otp = input.otp.replace(/\D/g, "");
  if (otp.length !== 6) {
    throw Object.assign(new Error("Enter the 6-digit OTP."), { status: 400 });
  }

  if (isDummyOtpEnabled() && otp === DUMMY_CUSTOMER_OTP) {
    await db
      .delete(customerOtps)
      .where(
        and(
          eq(customerOtps.officeId, input.officeId),
          eq(customerOtps.phone, phone),
          eq(customerOtps.purpose, input.purpose),
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
        eq(customerOtps.purpose, input.purpose),
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

export async function createOtpCustomerUser(input: {
  officeId: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}) {
  const passwordHash = await bcrypt.hash(randomUUID(), 10);
  return storage.createCustomerUser({
    officeId: input.officeId,
    name: input.name,
    phone: input.phone,
    email: input.email || null,
    passwordHash,
    address: input.address || null,
    city: input.city || null,
    state: input.state || null,
    pincode: input.pincode || null,
  });
}
