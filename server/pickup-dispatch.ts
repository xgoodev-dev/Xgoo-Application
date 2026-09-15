import { sql } from "drizzle-orm";
import type { BookingRequest } from "@shared/schema";
import { db } from "./db";
import { triggerPickupPartnerNotification } from "./pickup-notifications";
import { storage } from "./storage";

let tablesReady: Promise<void> | null = null;

export async function ensurePickupTables() {
  if (!tablesReady) {
    tablesReady = (async () => {
      await db.execute(sql`
        ALTER TABLE quotations ADD COLUMN IF NOT EXISTS booking_request_id varchar;
        ALTER TABLE quotations ADD COLUMN IF NOT EXISTS pickup_job_id varchar;
        ALTER TABLE quotations ADD COLUMN IF NOT EXISTS accept_token varchar(255);
        ALTER TABLE quotations ADD COLUMN IF NOT EXISTS accepted_at timestamp;
      `);
      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_quotations_accept_token
        ON quotations (accept_token)
        WHERE accept_token IS NOT NULL
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS pickup_partners (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          office_id varchar NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
          branch_id varchar REFERENCES branches(id) ON DELETE SET NULL,
          name varchar(255) NOT NULL,
          phone varchar(20) NOT NULL,
          status varchar(20) NOT NULL DEFAULT 'active',
          availability varchar(20) NOT NULL DEFAULT 'offline',
          last_assigned_at timestamp,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        )
      `);
      await db.execute(sql`
        ALTER TABLE pickup_partners ADD COLUMN IF NOT EXISTS password_hash varchar(255);
        ALTER TABLE pickup_partners ADD COLUMN IF NOT EXISTS address text;
        ALTER TABLE pickup_partners ADD COLUMN IF NOT EXISTS govt_id_type varchar(40);
        ALTER TABLE pickup_partners ADD COLUMN IF NOT EXISTS govt_id_number varchar(80);
        ALTER TABLE pickup_partners ADD COLUMN IF NOT EXISTS govt_id_document_url text;
        ALTER TABLE pickup_partners ADD COLUMN IF NOT EXISTS signup_source varchar(20) DEFAULT 'hub';
      `);
      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_pickup_partners_office_phone
        ON pickup_partners (office_id, phone)
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS pickup_partner_sessions (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          partner_id varchar NOT NULL REFERENCES pickup_partners(id) ON DELETE CASCADE,
          token varchar(255) NOT NULL UNIQUE,
          expires_at timestamp NOT NULL,
          created_at timestamp DEFAULT now()
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS pickup_partner_push_tokens (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          partner_id varchar NOT NULL REFERENCES pickup_partners(id) ON DELETE CASCADE,
          token varchar(255) NOT NULL,
          platform varchar(20) NOT NULL,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        )
      `);
      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_pickup_partner_push_tokens_token
        ON pickup_partner_push_tokens (token)
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS pickup_jobs (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          office_id varchar NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
          branch_id varchar REFERENCES branches(id) ON DELETE SET NULL,
          booking_request_id varchar NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
          partner_id varchar REFERENCES pickup_partners(id) ON DELETE SET NULL,
          quotation_id varchar,
          shipment_id varchar REFERENCES shipments(id) ON DELETE SET NULL,
          status varchar(30) NOT NULL DEFAULT 'unassigned',
          actual_weight numeric(10, 2),
          actual_pieces integer,
          actual_contents text,
          inspection_notes text,
          inspection_photo_urls text[],
          awb_number varchar(100),
          assigned_at timestamp,
          accepted_at timestamp,
          en_route_at timestamp,
          arrived_at timestamp,
          inspected_at timestamp,
          quote_sent_at timestamp,
          quote_accepted_at timestamp,
          packed_at timestamp,
          awb_created_at timestamp,
          completed_at timestamp,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        )
      `);
      await db.execute(sql`
        ALTER TABLE payments ALTER COLUMN shipment_id DROP NOT NULL;
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS quotation_id varchar;
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_payments_quotation ON payments (quotation_id)
      `);
    })().catch((error) => {
      tablesReady = null;
      throw error;
    });
  }
  await tablesReady;
}

async function pickAvailablePartner(officeId: string, branchId?: string | null) {
  if (!branchId) return undefined;
  const partners = (await storage.getPickupPartnersByOffice(officeId, branchId)).filter(
    (partner) =>
      partner.status === "active" &&
      partner.availability === "available" &&
      partner.branchId === branchId,
  );
  partners.sort((a, b) => {
    const aTime = a.lastAssignedAt ? new Date(a.lastAssignedAt).getTime() : 0;
    const bTime = b.lastAssignedAt ? new Date(b.lastAssignedAt).getTime() : 0;
    return aTime - bTime;
  });
  return partners[0];
}

export async function assignPickupJob(request: BookingRequest) {
  await ensurePickupTables();
  const existing = await storage.getPickupJobByBookingRequest(request.id);
  if (existing && existing.status !== "declined" && existing.status !== "cancelled") {
    return existing;
  }

  const partner = await pickAvailablePartner(request.officeId, request.branchId);
  const now = new Date();
  const job = await storage.createPickupJob({
    officeId: request.officeId,
    branchId: request.branchId,
    bookingRequestId: request.id,
    partnerId: partner?.id ?? null,
    status: partner ? "assigned" : "unassigned",
    assignedAt: partner ? now : null,
  });

  if (partner) {
    await storage.updatePickupPartner(partner.id, { lastAssignedAt: now, availability: "busy" });
    triggerPickupPartnerNotification(
      partner.id,
      "New pickup assigned",
      `Collect ${request.senderName}'s parcel (${request.requestNumber}).`,
      { jobId: job.id, bookingRequestId: request.id, requestNumber: request.requestNumber },
    );
  }
  return job;
}

export async function reassignDeclinedJob(jobId: string, excludePartnerId?: string) {
  await ensurePickupTables();
  const job = await storage.getPickupJob(jobId);
  if (!job) return undefined;

  const partner = (await pickAvailablePartner(job.officeId, job.branchId));
  if (partner && partner.id === excludePartnerId) {
    const next = (await storage.getPickupPartnersByOffice(job.officeId, job.branchId)).find(
      (candidate) =>
        candidate.id !== excludePartnerId &&
        candidate.status === "active" &&
        candidate.availability === "available" &&
        Boolean(job.branchId) &&
        candidate.branchId === job.branchId,
    );
    if (!next) {
      return storage.updatePickupJob(job.id, {
        partnerId: null,
        status: "unassigned",
        assignedAt: null,
      });
    }
    const now = new Date();
    await storage.updatePickupPartner(next.id, { lastAssignedAt: now, availability: "busy" });
    const updated = await storage.updatePickupJob(job.id, {
      partnerId: next.id,
      status: "assigned",
      assignedAt: now,
    });
    triggerPickupPartnerNotification(
      next.id,
      "New pickup assigned",
      "A doorstep pickup is waiting for you.",
      { jobId: job.id, bookingRequestId: job.bookingRequestId },
    );
    return updated;
  }

  if (!partner) {
    return storage.updatePickupJob(job.id, {
      partnerId: null,
      status: "unassigned",
      assignedAt: null,
    });
  }

  const now = new Date();
  await storage.updatePickupPartner(partner.id, { lastAssignedAt: now, availability: "busy" });
  const updated = await storage.updatePickupJob(job.id, {
    partnerId: partner.id,
    status: "assigned",
    assignedAt: now,
  });
  triggerPickupPartnerNotification(
    partner.id,
    "New pickup assigned",
    "A doorstep pickup is waiting for you.",
    { jobId: job.id, bookingRequestId: job.bookingRequestId },
  );
  return updated;
}

export async function assignAvailableJobsForPartner(partnerId: string) {
  await ensurePickupTables();
  const partner = await storage.getPickupPartner(partnerId);
  if (!partner || partner.status !== "active" || partner.availability !== "available") return;

  if (!partner.branchId) return;
  const jobs = await storage.getPickupJobsByOffice(partner.officeId, partner.branchId);
  const waiting = jobs.find((job) => job.status === "unassigned" && job.branchId === partner.branchId);
  if (!waiting) return;

  const now = new Date();
  await storage.updatePickupJob(waiting.id, {
    partnerId: partner.id,
    status: "assigned",
    assignedAt: now,
  });
  await storage.updatePickupPartner(partner.id, { lastAssignedAt: now, availability: "busy" });
  triggerPickupPartnerNotification(
    partner.id,
    "New pickup assigned",
    "A waiting doorstep pickup was assigned to you.",
    { jobId: waiting.id, bookingRequestId: waiting.bookingRequestId },
  );
}
