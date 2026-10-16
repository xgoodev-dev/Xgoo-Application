import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  bookingRequests,
  customerUsers,
  referralCommissions,
  referralPartners,
  referralPayouts,
  referralSettings,
  type BookingRequest,
  type Quotation,
  type ReferralPartner,
  type ReferralSettings,
} from "@shared/schema";
import {
  calculateReferralCommission,
  DEFAULT_REFERRAL_COMMISSION_PERCENT,
  DEFAULT_REFERRAL_DOMESTIC_PERCENT,
  DEFAULT_REFERRAL_INTERNATIONAL_FLAT,
  DEFAULT_REFERRAL_MIN_PAYOUT,
  generateReferralCode,
  isValidReferralCode,
  lastTenPhoneDigits,
  maskBankAccountNumber,
  normalizeReferralCode,
  referralSharePath,
  resolveReferralRate,
  type ReferralCommissionType,
  type ReferralPartnerStatus,
} from "@shared/referral";
import { db } from "./db";

let referralSchemaReady: Promise<void> | null = null;

export const referralBankSchema = z.object({
  bankAccountName: z.string().trim().min(2, "Account name is required").max(120),
  bankAccountNumber: z
    .string()
    .trim()
    .regex(/^\d{8,18}$/, "Enter a valid bank account number"),
  bankIfsc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC"),
});

const commissionAmountSchema = z
  .string()
  .trim()
  .refine((value) => {
    const amount = Number.parseFloat(value);
    return Number.isFinite(amount) && amount > 0 && amount <= 100000;
  }, "Enter a valid commission amount");

export const referralSettingsUpdateSchema = z.object({
  commissionType: z.enum(["percent", "flat"]).optional(),
  commissionValue: commissionAmountSchema.optional(),
  domesticCommissionType: z.enum(["percent", "flat"]).default("percent"),
  domesticCommissionValue: commissionAmountSchema.default(DEFAULT_REFERRAL_DOMESTIC_PERCENT),
  internationalCommissionType: z.enum(["percent", "flat"]).default("flat"),
  internationalCommissionValue: commissionAmountSchema.default(DEFAULT_REFERRAL_INTERNATIONAL_FLAT),
  minPayoutAmount: z
    .string()
    .trim()
    .refine((value) => {
      const amount = Number.parseFloat(value);
      return Number.isFinite(amount) && amount >= 0;
    }, "Enter a valid minimum payout"),
  isActive: z.boolean(),
});

export const referralPartnerStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
});

export const referralPayoutCreateSchema = z.object({
  partnerId: z.string().min(1),
  note: z.string().trim().max(500).optional(),
});

export function ensureReferralSchema() {
  if (!referralSchemaReady) {
    referralSchemaReady = (async () => {
      await db.execute(sql`
        ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS referral_code varchar(16)
      `);
      await db.execute(sql`
        ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS referred_by_partner_id varchar
      `);
      await db.execute(sql`
        ALTER TABLE customer_users ADD COLUMN IF NOT EXISTS referred_by_partner_id varchar
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS referral_settings (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          office_id varchar NOT NULL UNIQUE REFERENCES offices(id),
          commission_type varchar(20) NOT NULL DEFAULT 'percent',
          commission_value decimal(10, 2) NOT NULL DEFAULT 10,
          min_payout_amount decimal(12, 2) NOT NULL DEFAULT 100,
          is_active boolean NOT NULL DEFAULT true,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        )
      `);
      await db.execute(sql`
        ALTER TABLE referral_settings
          ADD COLUMN IF NOT EXISTS domestic_commission_type varchar(20) NOT NULL DEFAULT 'percent'
      `);
      await db.execute(sql`
        ALTER TABLE referral_settings
          ADD COLUMN IF NOT EXISTS domestic_commission_value decimal(10, 2) NOT NULL DEFAULT 10
      `);
      await db.execute(sql`
        ALTER TABLE referral_settings
          ADD COLUMN IF NOT EXISTS international_commission_type varchar(20) NOT NULL DEFAULT 'flat'
      `);
      await db.execute(sql`
        ALTER TABLE referral_settings
          ADD COLUMN IF NOT EXISTS international_commission_value decimal(10, 2) NOT NULL DEFAULT 300
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS referral_partners (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          office_id varchar NOT NULL REFERENCES offices(id),
          customer_user_id varchar NOT NULL UNIQUE REFERENCES customer_users(id),
          code varchar(16) NOT NULL UNIQUE,
          status varchar(20) NOT NULL DEFAULT 'active',
          bank_account_name varchar(120),
          bank_account_number varchar(20),
          bank_ifsc varchar(11),
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS referral_payouts (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          office_id varchar NOT NULL REFERENCES offices(id),
          partner_id varchar NOT NULL REFERENCES referral_partners(id),
          amount decimal(12, 2) NOT NULL,
          note text,
          paid_at timestamp DEFAULT now(),
          paid_by_user_id varchar,
          created_at timestamp DEFAULT now()
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS referral_commissions (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          office_id varchar NOT NULL REFERENCES offices(id),
          partner_id varchar NOT NULL REFERENCES referral_partners(id),
          booking_request_id varchar NOT NULL UNIQUE REFERENCES booking_requests(id),
          quotation_id varchar REFERENCES quotations(id),
          quote_amount decimal(12, 2) NOT NULL,
          commission_type varchar(20) NOT NULL,
          commission_value decimal(10, 2) NOT NULL,
          commission_amount decimal(12, 2) NOT NULL,
          status varchar(20) NOT NULL DEFAULT 'pending',
          payout_id varchar REFERENCES referral_payouts(id),
          created_at timestamp DEFAULT now()
        )
      `);
    })().catch((error) => {
      referralSchemaReady = null;
      throw error;
    });
  }
  return referralSchemaReady;
}

function asCommissionType(value: string | null | undefined): ReferralCommissionType {
  return value === "flat" ? "flat" : "percent";
}

function asPartnerStatus(value: string | null | undefined): ReferralPartnerStatus {
  return value === "suspended" ? "suspended" : "active";
}

function publicSettings(settings: ReferralSettings) {
  const domesticType = asCommissionType(settings.domesticCommissionType || "percent");
  const domesticValue = String(settings.domesticCommissionValue || DEFAULT_REFERRAL_DOMESTIC_PERCENT);
  const internationalType = asCommissionType(settings.internationalCommissionType || "flat");
  const internationalValue = String(
    settings.internationalCommissionValue || DEFAULT_REFERRAL_INTERNATIONAL_FLAT,
  );
  return {
    isActive: Boolean(settings.isActive),
    commissionType: domesticType,
    commissionValue: domesticValue,
    domesticCommissionType: domesticType,
    domesticCommissionValue: domesticValue,
    internationalCommissionType: internationalType,
    internationalCommissionValue: internationalValue,
    minPayoutAmount: String(settings.minPayoutAmount || DEFAULT_REFERRAL_MIN_PAYOUT),
  };
}

export async function getOrCreateReferralSettings(officeId: string): Promise<ReferralSettings> {
  await ensureReferralSchema();
  const [existing] = await db
    .select()
    .from(referralSettings)
    .where(eq(referralSettings.officeId, officeId))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(referralSettings)
    .values({
      officeId,
      commissionType: "percent",
      commissionValue: DEFAULT_REFERRAL_COMMISSION_PERCENT,
      domesticCommissionType: "percent",
      domesticCommissionValue: DEFAULT_REFERRAL_DOMESTIC_PERCENT,
      internationalCommissionType: "flat",
      internationalCommissionValue: DEFAULT_REFERRAL_INTERNATIONAL_FLAT,
      minPayoutAmount: DEFAULT_REFERRAL_MIN_PAYOUT,
      isActive: true,
    })
    .returning();
  return created;
}

export async function updateReferralSettings(
  officeId: string,
  input: z.infer<typeof referralSettingsUpdateSchema>,
) {
  const current = await getOrCreateReferralSettings(officeId);
  const [updated] = await db
    .update(referralSettings)
    .set({
      commissionType: input.domesticCommissionType,
      commissionValue: input.domesticCommissionValue,
      domesticCommissionType: input.domesticCommissionType,
      domesticCommissionValue: input.domesticCommissionValue,
      internationalCommissionType: input.internationalCommissionType,
      internationalCommissionValue: input.internationalCommissionValue,
      minPayoutAmount: input.minPayoutAmount,
      isActive: input.isActive,
      updatedAt: new Date(),
    })
    .where(eq(referralSettings.id, current.id))
    .returning();
  return updated || current;
}

export async function getPublicReferralProgram(officeId: string) {
  const settings = await getOrCreateReferralSettings(officeId);
  return publicSettings(settings);
}

async function getPartnerByCode(officeId: string, rawCode: string) {
  const code = normalizeReferralCode(rawCode);
  if (!isValidReferralCode(code)) return undefined;
  const [partner] = await db
    .select()
    .from(referralPartners)
    .where(and(eq(referralPartners.officeId, officeId), eq(referralPartners.code, code)))
    .limit(1);
  return partner;
}

async function getPartnerByCustomer(officeId: string, customerUserId: string) {
  const [partner] = await db
    .select()
    .from(referralPartners)
    .where(
      and(eq(referralPartners.officeId, officeId), eq(referralPartners.customerUserId, customerUserId)),
    )
    .limit(1);
  return partner;
}

async function isSelfReferral(partner: ReferralPartner, customerUserId?: string | null, senderPhone?: string | null) {
  if (customerUserId && partner.customerUserId === customerUserId) return true;
  const phone = lastTenPhoneDigits(senderPhone);
  if (phone.length < 10) return false;
  const [owner] = await db
    .select({ id: customerUsers.id, phone: customerUsers.phone })
    .from(customerUsers)
    .where(eq(customerUsers.id, partner.customerUserId))
    .limit(1);
  return lastTenPhoneDigits(owner?.phone) === phone;
}

export async function resolveReferralAttribution(input: {
  officeId: string;
  customerUserId?: string | null;
  senderPhone?: string | null;
  referralCode?: string | null;
}): Promise<{ referralCode: string | null; referredByPartnerId: string | null }> {
  await ensureReferralSchema();
  const requestedCode = normalizeReferralCode(input.referralCode);
  let partner: ReferralPartner | undefined;

  if (input.customerUserId) {
    const [user] = await db
      .select()
      .from(customerUsers)
      .where(eq(customerUsers.id, input.customerUserId))
      .limit(1);
    if (user?.referredByPartnerId) {
      const [sticky] = await db
        .select()
        .from(referralPartners)
        .where(eq(referralPartners.id, user.referredByPartnerId))
        .limit(1);
      if (sticky && !(await isSelfReferral(sticky, input.customerUserId, input.senderPhone))) {
        return {
          referralCode: requestedCode || sticky.code,
          referredByPartnerId: sticky.id,
        };
      }
    }
  }

  if (requestedCode) {
    partner = await getPartnerByCode(input.officeId, requestedCode);
  }
  if (!partner) {
    return { referralCode: requestedCode || null, referredByPartnerId: null };
  }
  if (await isSelfReferral(partner, input.customerUserId, input.senderPhone)) {
    return { referralCode: null, referredByPartnerId: null };
  }

  if (input.customerUserId) {
    await db
      .update(customerUsers)
      .set({ referredByPartnerId: partner.id, updatedAt: new Date() })
      .where(
        and(eq(customerUsers.id, input.customerUserId), sql`${customerUsers.referredByPartnerId} IS NULL`),
      );
  }

  return { referralCode: partner.code, referredByPartnerId: partner.id };
}

export async function joinReferralProgram(input: {
  officeId: string;
  customerUserId: string;
  name: string;
}) {
  await ensureReferralSchema();
  const existing = await getPartnerByCustomer(input.officeId, input.customerUserId);
  if (existing) return existing;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateReferralCode(input.name);
    try {
      const [created] = await db
        .insert(referralPartners)
        .values({
          officeId: input.officeId,
          customerUserId: input.customerUserId,
          code,
          status: "active",
        })
        .returning();
      return created;
    } catch (error) {
      const message = String((error as { message?: string })?.message || "");
      if (!/duplicate|unique/i.test(message) || attempt === 7) throw error;
    }
  }
  throw new Error("Could not create a referral code");
}

export async function updateReferralBank(
  officeId: string,
  customerUserId: string,
  input: z.infer<typeof referralBankSchema>,
) {
  const partner = await getPartnerByCustomer(officeId, customerUserId);
  if (!partner) {
    throw Object.assign(new Error("Join the referral program first."), { status: 400 });
  }
  const [updated] = await db
    .update(referralPartners)
    .set({
      bankAccountName: input.bankAccountName,
      bankAccountNumber: input.bankAccountNumber,
      bankIfsc: input.bankIfsc,
      updatedAt: new Date(),
    })
    .where(eq(referralPartners.id, partner.id))
    .returning();
  return updated || partner;
}

async function partnerEarnings(partnerId: string) {
  const rows = await db
    .select()
    .from(referralCommissions)
    .where(eq(referralCommissions.partnerId, partnerId))
    .orderBy(desc(referralCommissions.createdAt));
  const totals = { pending: 0, approved: 0, paid: 0, voided: 0 };
  for (const row of rows) {
    const amount = Number.parseFloat(String(row.commissionAmount || "0")) || 0;
    switch (row.status) {
      case "pending":
        totals.pending += amount;
        break;
      case "approved":
        totals.approved += amount;
        break;
      case "paid":
        totals.paid += amount;
        break;
      case "void":
        totals.voided += amount;
        break;
      default:
        break;
    }
  }
  return { rows, totals };
}

export async function getCustomerReferralDashboard(input: {
  officeId: string;
  customerUserId: string;
}) {
  const settings = await getOrCreateReferralSettings(input.officeId);
  const partner = await getPartnerByCustomer(input.officeId, input.customerUserId);
  if (!partner) {
    return {
      program: publicSettings(settings),
      partner: null,
    };
  }
  const { rows, totals } = await partnerEarnings(partner.id);
  return {
    program: publicSettings(settings),
    partner: {
      id: partner.id,
      code: partner.code,
      status: asPartnerStatus(partner.status),
      sharePath: referralSharePath(partner.code),
      bankAccountName: partner.bankAccountName || "",
      bankAccountNumberMasked: maskBankAccountNumber(partner.bankAccountNumber),
      bankIfsc: partner.bankIfsc || "",
      hasBank: Boolean(partner.bankAccountName && partner.bankAccountNumber && partner.bankIfsc),
      totals,
      earnings: rows.slice(0, 40).map((row) => ({
        id: row.id,
        bookingRequestId: row.bookingRequestId,
        quoteAmount: String(row.quoteAmount),
        commissionAmount: String(row.commissionAmount),
        status: row.status,
        createdAt: row.createdAt,
      })),
    },
  };
}

export async function creditReferralCommission(input: {
  quotation: Quotation;
  request: BookingRequest;
}) {
  await ensureReferralSchema();
  const { quotation, request } = input;
  const attribution = await resolveReferralAttribution({
    officeId: request.officeId,
    customerUserId: request.customerUserId,
    senderPhone: request.senderPhone,
    referralCode: request.referralCode,
  });
  const partnerId = request.referredByPartnerId || attribution.referredByPartnerId;
  if (!partnerId) return null;

  if (!request.referredByPartnerId && attribution.referredByPartnerId) {
    await db
      .update(bookingRequests)
      .set({
        referredByPartnerId: attribution.referredByPartnerId,
        referralCode: attribution.referralCode,
      })
      .where(eq(bookingRequests.id, request.id));
  }

  const [partner] = await db
    .select()
    .from(referralPartners)
    .where(eq(referralPartners.id, partnerId))
    .limit(1);
  if (!partner || partner.status !== "active") return null;
  if (await isSelfReferral(partner, request.customerUserId, request.senderPhone)) return null;

  const settings = await getOrCreateReferralSettings(request.officeId);
  if (!settings.isActive) return null;

  const [existing] = await db
    .select()
    .from(referralCommissions)
    .where(eq(referralCommissions.bookingRequestId, request.id))
    .limit(1);
  if (existing) return existing;

  const rate = resolveReferralRate({
    shipmentType: request.shipmentType,
    domesticCommissionType: asCommissionType(settings.domesticCommissionType || settings.commissionType),
    domesticCommissionValue: settings.domesticCommissionValue || settings.commissionValue,
    internationalCommissionType: asCommissionType(settings.internationalCommissionType || "flat"),
    internationalCommissionValue: settings.internationalCommissionValue || DEFAULT_REFERRAL_INTERNATIONAL_FLAT,
  });
  const commissionAmount = calculateReferralCommission({
    quoteAmount: quotation.totalAmount,
    commissionType: rate.commissionType,
    commissionValue: rate.commissionValue,
  });
  if (commissionAmount <= 0) return null;

  try {
    const [created] = await db
      .insert(referralCommissions)
      .values({
        officeId: request.officeId,
        partnerId: partner.id,
        bookingRequestId: request.id,
        quotationId: quotation.id,
        quoteAmount: String(quotation.totalAmount),
        commissionType: rate.commissionType,
        commissionValue: rate.commissionValue,
        commissionAmount: commissionAmount.toFixed(2),
        status: "pending",
      })
      .returning();
    return created;
  } catch (error) {
    const message = String((error as { message?: string })?.message || "");
    if (/duplicate|unique/i.test(message)) return existing || null;
    throw error;
  }
}

export async function listReferralPartners(officeId: string) {
  await ensureReferralSchema();
  const partners = await db
    .select({
      partner: referralPartners,
      name: customerUsers.name,
      phone: customerUsers.phone,
      email: customerUsers.email,
      accountType: customerUsers.accountType,
    })
    .from(referralPartners)
    .innerJoin(customerUsers, eq(customerUsers.id, referralPartners.customerUserId))
    .where(eq(referralPartners.officeId, officeId))
    .orderBy(desc(referralPartners.createdAt));

  const ids = partners.map((row) => row.partner.id);
  const commissions = ids.length
    ? await db
        .select()
        .from(referralCommissions)
        .where(inArray(referralCommissions.partnerId, ids))
    : [];
  const byPartner = new Map<string, { pending: number; paid: number; count: number }>();
  for (const row of commissions) {
    const current = byPartner.get(row.partnerId) || { pending: 0, paid: 0, count: 0 };
    const amount = Number.parseFloat(String(row.commissionAmount || "0")) || 0;
    current.count += 1;
    if (row.status === "paid") current.paid += amount;
    else if (row.status === "pending" || row.status === "approved") current.pending += amount;
    byPartner.set(row.partnerId, current);
  }

  return partners.map((row) => {
    const totals = byPartner.get(row.partner.id) || { pending: 0, paid: 0, count: 0 };
    return {
      id: row.partner.id,
      code: row.partner.code,
      status: asPartnerStatus(row.partner.status),
      name: row.name,
      phone: row.phone,
      email: row.email,
      accountType: row.accountType,
      bankAccountName: row.partner.bankAccountName || "",
      bankAccountNumberMasked: maskBankAccountNumber(row.partner.bankAccountNumber),
      bankIfsc: row.partner.bankIfsc || "",
      hasBank: Boolean(
        row.partner.bankAccountName && row.partner.bankAccountNumber && row.partner.bankIfsc,
      ),
      pendingAmount: totals.pending,
      paidAmount: totals.paid,
      earningCount: totals.count,
      createdAt: row.partner.createdAt,
    };
  });
}

export async function updateReferralPartnerStatus(
  officeId: string,
  partnerId: string,
  status: ReferralPartnerStatus,
) {
  const [updated] = await db
    .update(referralPartners)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(referralPartners.id, partnerId), eq(referralPartners.officeId, officeId)))
    .returning();
  if (!updated) {
    throw Object.assign(new Error("Referral partner was not found."), { status: 404 });
  }
  return updated;
}

export async function listReferralPayouts(officeId: string) {
  await ensureReferralSchema();
  const rows = await db
    .select({
      payout: referralPayouts,
      partner: referralPartners,
      name: customerUsers.name,
    })
    .from(referralPayouts)
    .innerJoin(referralPartners, eq(referralPartners.id, referralPayouts.partnerId))
    .innerJoin(customerUsers, eq(customerUsers.id, referralPartners.customerUserId))
    .where(eq(referralPayouts.officeId, officeId))
    .orderBy(desc(referralPayouts.paidAt));
  return rows.map((row) => ({
    id: row.payout.id,
    partnerId: row.payout.partnerId,
    partnerName: row.name,
    partnerCode: row.partner.code,
    amount: String(row.payout.amount),
    note: row.payout.note,
    paidAt: row.payout.paidAt,
  }));
}

export async function markReferralPayoutPaid(input: {
  officeId: string;
  partnerId: string;
  paidByUserId?: string | null;
  note?: string;
}) {
  await ensureReferralSchema();
  const settings = await getOrCreateReferralSettings(input.officeId);
  const [partner] = await db
    .select()
    .from(referralPartners)
    .where(and(eq(referralPartners.id, input.partnerId), eq(referralPartners.officeId, input.officeId)))
    .limit(1);
  if (!partner) {
    throw Object.assign(new Error("Referral partner was not found."), { status: 404 });
  }
  if (!partner.bankAccountName || !partner.bankAccountNumber || !partner.bankIfsc) {
    throw Object.assign(new Error("This partner has not added a bank account yet."), { status: 400 });
  }

  const unpaid = await db
    .select()
    .from(referralCommissions)
    .where(
      and(
        eq(referralCommissions.partnerId, partner.id),
        inArray(referralCommissions.status, ["pending", "approved"]),
      ),
    );
  const amount = unpaid.reduce(
    (sum, row) => sum + (Number.parseFloat(String(row.commissionAmount || "0")) || 0),
    0,
  );
  const minPayout = Number.parseFloat(String(settings.minPayoutAmount || "0")) || 0;
  if (amount <= 0) {
    throw Object.assign(new Error("There is nothing pending to pay."), { status: 400 });
  }
  if (amount + 0.001 < minPayout) {
    throw Object.assign(
      new Error(`Pending amount is below the ₹${minPayout} minimum payout.`),
      { status: 400 },
    );
  }

  const [payout] = await db
    .insert(referralPayouts)
    .values({
      officeId: input.officeId,
      partnerId: partner.id,
      amount: amount.toFixed(2),
      note: input.note || null,
      paidByUserId: input.paidByUserId || null,
      paidAt: new Date(),
    })
    .returning();

  const ids = unpaid.map((row) => row.id);
  if (ids.length) {
    await db
      .update(referralCommissions)
      .set({ status: "paid", payoutId: payout.id })
      .where(inArray(referralCommissions.id, ids));
  }
  return payout;
}
