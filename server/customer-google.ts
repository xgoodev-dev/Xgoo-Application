import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { verifyGoogleToken } from "./google-verify";
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

export async function loginOrRegisterCustomerWithGoogle(office: Office, token: string) {
  await ensureCustomerGoogleColumns();
  const googleUser = await verifyGoogleToken(token);

  const email = googleUser.email?.trim().toLowerCase() || null;
  const name = googleUser.name?.trim() || email?.split("@")[0] || "Customer";
  const phone = null;

  let customer =
    (await storage.getCustomerUserByGoogleId(office.id, googleUser.id, "business")) ||
    (email ? await storage.getCustomerUserByEmail(office.id, email, "business") : undefined);


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
