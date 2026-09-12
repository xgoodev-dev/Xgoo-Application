import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { supabaseAdmin } from "./auth";
import { issueCustomerSession } from "./customer-otp";
import { storage } from "./storage";
import type { Office } from "@shared/schema";

let googleColumnsReady: Promise<void> | null = null;

function ensureCustomerGoogleColumns() {
  if (!googleColumnsReady) {
    googleColumnsReady = db
      .execute(sql`ALTER TABLE customer_users ADD COLUMN IF NOT EXISTS google_id varchar(255)`)
      .then(async () => {
        await db.execute(sql`ALTER TABLE customer_users ALTER COLUMN phone DROP NOT NULL`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_customer_users_google ON customer_users (google_id)`);
      });
  }
  return googleColumnsReady;
}

function googlePhone(user: { phone?: string; user_metadata?: Record<string, unknown> }) {
  const metaPhone = typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : "";
  const digits = `${user.phone || ""} ${metaPhone}`.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

export async function loginOrRegisterCustomerWithGoogle(office: Office, accessToken: string) {
  await ensureCustomerGoogleColumns();
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    throw Object.assign(new Error("Google sign-in expired. Try again."), { status: 401 });
  }

  const googleUser = data.user;
  const email = googleUser.email?.trim().toLowerCase() || null;
  const name =
    (typeof googleUser.user_metadata?.full_name === "string" && googleUser.user_metadata.full_name.trim()) ||
    (typeof googleUser.user_metadata?.name === "string" && googleUser.user_metadata.name.trim()) ||
    email?.split("@")[0] ||
    "Customer";
  const phone = googlePhone(googleUser);

  let customer =
    (await storage.getCustomerUserByGoogleId(office.id, googleUser.id)) ||
    (email ? await storage.getCustomerUserByEmail(office.id, email) : undefined) ||
    (phone ? await storage.getCustomerUserByPhone(office.id, phone) : undefined);

  if (customer?.accountType === "individual") {
    throw Object.assign(
      new Error("This is an individual account. Sign in with your mobile number and OTP."),
      { status: 403 },
    );
  }

  if (!customer) {
    const passwordHash = await bcrypt.hash(randomUUID(), 10);
    customer = await storage.createCustomerUser({
      officeId: office.id,
      name,
      phone,
      email,
      googleId: googleUser.id,
      passwordHash,
      accountType: "business",
    });
  } else if (!customer.googleId) {
    customer =
      (await storage.updateCustomerUser(customer.id, {
        googleId: googleUser.id,
        ...(email && !customer.email ? { email } : {}),
      })) || customer;
  }

  return issueCustomerSession(customer);
}
