import { and, desc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  businessDailyJobs,
  businessDestinations,
  businessOrders,
  businessProfiles,
  businessSettlements,
  customerUsers,
  payments,
  type BusinessDailyJob,
  type BusinessDestination,
  type BusinessOrder,
  type BusinessProfile,
  type CustomerUser,
} from "@shared/schema";
import {
  billingPeriodBounds,
  DEFAULT_BUSINESS_WEEKDAYS,
  isBusinessApplicationComplete,
  isBusinessPickupDay,
  isBusinessProfileReady,
  isBusinessVerified,
  isDateInBillingPeriod,
  mergeBusinessWeekdays,
  normalizeBillingCycle,
  todayIsoDate,
  type BusinessBillingCycle,
  type BusinessSettlementMode,
  type BusinessVerificationStatus,
  type BusinessWeekdays,
} from "@shared/business-courier";
import { db } from "./db";
import { storage } from "./storage";
import { triggerCustomerNotification } from "./customer-notifications";
import { triggerBookingRequestWhatsApp } from "./integrations/whatsapp-notifications";
import { offices } from "@shared/schema";
import { assignPickupJob } from "./pickup-dispatch";

let tablesReady: Promise<void> | null = null;

export async function ensureBusinessCourierTables() {
  if (!tablesReady) {
    tablesReady = db.execute(sql`
      CREATE TABLE IF NOT EXISTS business_profiles (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
        customer_user_id varchar NOT NULL UNIQUE REFERENCES customer_users(id),
        company_name varchar(255) NOT NULL DEFAULT '',
        store_name varchar(255) NOT NULL DEFAULT '',
        store_type varchar(50) NOT NULL DEFAULT '',
        gst_number varchar(20),
        verification_status varchar(20) NOT NULL DEFAULT 'pending',
        verification_note text,
        verified_at timestamp,
        verified_by_user_id varchar,
        pickup_address text NOT NULL DEFAULT '',
        pickup_city varchar(100),
        pickup_state varchar(100),
        pickup_pincode varchar(10),
        pickup_lat decimal(10, 7),
        pickup_lng decimal(10, 7),
        pickup_time_slot varchar(40),
        pickup_phone varchar(20),
        weekdays jsonb NOT NULL DEFAULT '{"sun":false,"mon":true,"tue":true,"wed":true,"thu":true,"fri":true,"sat":true}'::jsonb,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )
    `).then(async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS business_destinations (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          customer_user_id varchar NOT NULL REFERENCES customer_users(id),
          name varchar(255) NOT NULL,
          phone varchar(20) NOT NULL,
          address text NOT NULL,
          city varchar(100),
          state varchar(100),
          pincode varchar(10),
          notes text,
          recurring boolean NOT NULL DEFAULT true,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        )
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_business_destinations_user
        ON business_destinations (customer_user_id)
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS business_daily_jobs (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          customer_user_id varchar NOT NULL REFERENCES customer_users(id),
          destination_id varchar REFERENCES business_destinations(id),
          job_date varchar(10) NOT NULL,
          receiver_name varchar(255) NOT NULL,
          receiver_phone varchar(20) NOT NULL,
          receiver_address text NOT NULL,
          receiver_city varchar(100),
          receiver_state varchar(100),
          receiver_pincode varchar(10),
          weight decimal(10, 2) DEFAULT 1,
          number_of_pieces integer NOT NULL DEFAULT 1,
          content_description text NOT NULL DEFAULT 'Daily courier',
          status varchar(20) NOT NULL DEFAULT 'planned',
          booking_request_id varchar REFERENCES booking_requests(id),
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        )
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_business_daily_jobs_user_date
        ON business_daily_jobs (customer_user_id, job_date)
      `);
      await db.execute(sql`
        ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS store_name varchar(255) NOT NULL DEFAULT '';
        ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS verification_status varchar(20) NOT NULL DEFAULT 'pending';
        ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS verification_note text;
        ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS verified_at timestamp;
        ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS verified_by_user_id varchar;
        ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS pickup_style varchar(20) NOT NULL DEFAULT 'standing';
        ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS billing_cycle varchar(20) NOT NULL DEFAULT 'weekly';
        ALTER TABLE business_destinations ADD COLUMN IF NOT EXISTS address_line2 text;
        ALTER TABLE business_destinations ADD COLUMN IF NOT EXISTS shipment_type varchar(30) NOT NULL DEFAULT 'domestic';
        ALTER TABLE business_destinations ADD COLUMN IF NOT EXISTS destination_country varchar(100);
        ALTER TABLE business_orders ADD COLUMN IF NOT EXISTS receiver_address_line2 text;
        ALTER TABLE business_orders ADD COLUMN IF NOT EXISTS shipment_type varchar(30) NOT NULL DEFAULT 'domestic';
        ALTER TABLE business_orders ADD COLUMN IF NOT EXISTS destination_country varchar(100);
        ALTER TABLE business_daily_jobs ADD COLUMN IF NOT EXISTS receiver_address_line2 text;
        ALTER TABLE business_daily_jobs ADD COLUMN IF NOT EXISTS shipment_type varchar(30) NOT NULL DEFAULT 'domestic';
        ALTER TABLE business_daily_jobs ADD COLUMN IF NOT EXISTS destination_country varchar(100);
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS business_settlements (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          customer_user_id varchar NOT NULL REFERENCES customer_users(id),
          billing_cycle varchar(20) NOT NULL,
          period_start timestamp NOT NULL,
          period_end timestamp NOT NULL,
          amount decimal(12, 2) NOT NULL,
          shipment_count integer NOT NULL DEFAULT 0,
          payment_mode varchar(30) NOT NULL,
          payment_status varchar(20) NOT NULL DEFAULT 'completed',
          transaction_reference varchar(100),
          notes text,
          paid_at timestamp DEFAULT now(),
          created_at timestamp DEFAULT now()
        )
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_business_settlements_user
        ON business_settlements (customer_user_id)
      `);
      await db.execute(sql`
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS settlement_id varchar;
        ALTER TABLE payments ALTER COLUMN shipment_id DROP NOT NULL;
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS quotation_id varchar;
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS business_orders (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          customer_user_id varchar NOT NULL REFERENCES customer_users(id),
          destination_id varchar REFERENCES business_destinations(id),
          channel varchar(20) NOT NULL DEFAULT 'whatsapp',
          receiver_name varchar(255) NOT NULL,
          receiver_phone varchar(20) NOT NULL,
          receiver_address text NOT NULL,
          receiver_city varchar(100),
          receiver_state varchar(100),
          receiver_pincode varchar(10),
          content_description text NOT NULL DEFAULT 'Store order',
          weight decimal(10, 2) DEFAULT 1,
          number_of_pieces integer NOT NULL DEFAULT 1,
          notes text,
          status varchar(20) NOT NULL DEFAULT 'open',
          daily_job_id varchar REFERENCES business_daily_jobs(id),
          booking_request_id varchar REFERENCES booking_requests(id),
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        )
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_business_orders_user ON business_orders (customer_user_id)
      `);
      await db.execute(sql`
        UPDATE business_profiles
        SET store_name = company_name
        WHERE (store_name IS NULL OR store_name = '') AND company_name <> ''
      `);
      await db.execute(sql`
        UPDATE business_profiles
        SET verification_status = 'approved', verified_at = COALESCE(verified_at, NOW())
        WHERE verification_status = 'pending'
          AND pickup_time_slot IS NOT NULL
          AND pickup_time_slot <> ''
          AND created_at < TIMESTAMPTZ '2026-09-13 00:00:00+00'
      `);
    });
  }
  await tablesReady;
}

function serializeProfile(profile: BusinessProfile) {
  return {
    ...profile,
    pickupStyle: profile.pickupStyle === "on_demand" ? "on_demand" : "standing",
    billingCycle: normalizeBillingCycle(profile.billingCycle),
    weekdays: mergeBusinessWeekdays(profile.weekdays),
    ready: isBusinessProfileReady(profile),
    applicationComplete: isBusinessApplicationComplete(profile),
    verified: isBusinessVerified(profile),
  };
}

export async function getOrCreateBusinessProfile(customerUserId: string): Promise<BusinessProfile> {
  await ensureBusinessCourierTables();
  const [existing] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.customerUserId, customerUserId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(businessProfiles)
    .values({
      customerUserId,
      weekdays: DEFAULT_BUSINESS_WEEKDAYS,
    })
    .returning();
  return created;
}

export async function getBusinessProfileDto(customerUserId: string) {
  const profile = await getOrCreateBusinessProfile(customerUserId);
  return serializeProfile(profile);
}

export async function updateBusinessProfile(
  customerUserId: string,
  patch: Partial<{
    companyName: string;
    storeName: string;
    storeType: string;
    gstNumber: string | null;
    pickupAddress: string;
    pickupCity: string | null;
    pickupState: string | null;
    pickupPincode: string | null;
    pickupLat: string | null;
    pickupLng: string | null;
    pickupTimeSlot: string | null;
    pickupPhone: string | null;
    pickupStyle: "standing" | "on_demand";
    billingCycle: BusinessBillingCycle;
    weekdays: BusinessWeekdays;
  }>,
) {
  const current = await getOrCreateBusinessProfile(customerUserId);
  const nextStatus: BusinessVerificationStatus =
    current.verificationStatus === "rejected" &&
    (patch.companyName || patch.storeName || patch.storeType || patch.gstNumber || patch.pickupAddress)
      ? "pending"
      : (current.verificationStatus as BusinessVerificationStatus);
  const [updated] = await db
    .update(businessProfiles)
    .set({
      ...patch,
      verificationStatus: nextStatus,
      verificationNote: nextStatus === "pending" && current.verificationStatus === "rejected" ? null : current.verificationNote,
      updatedAt: new Date(),
    })
    .where(eq(businessProfiles.customerUserId, customerUserId))
    .returning();
  return serializeProfile(updated);
}

export async function submitBusinessApplication(
  customerUserId: string,
  input: {
    companyName: string;
    storeName: string;
    storeType: string;
    gstNumber: string;
    pickupAddress?: string | null;
    pickupCity?: string | null;
    pickupState?: string | null;
    pickupPincode?: string | null;
  },
) {
  await getOrCreateBusinessProfile(customerUserId);
  const [updated] = await db
    .update(businessProfiles)
    .set({
      companyName: input.companyName,
      storeName: input.storeName,
      storeType: input.storeType,
      gstNumber: input.gstNumber,
      pickupAddress: input.pickupAddress || "",
      pickupCity: input.pickupCity || null,
      pickupState: input.pickupState || null,
      pickupPincode: input.pickupPincode || null,
      verificationStatus: "pending",
      verificationNote: null,
      verifiedAt: null,
      verifiedByUserId: null,
      updatedAt: new Date(),
    })
    .where(eq(businessProfiles.customerUserId, customerUserId))
    .returning();
  return serializeProfile(updated);
}

export async function listBusinessAccounts(officeId: string) {
  await ensureBusinessCourierTables();
  const rows = await db
    .select({
      user: customerUsers,
      profile: businessProfiles,
    })
    .from(customerUsers)
    .leftJoin(businessProfiles, eq(businessProfiles.customerUserId, customerUsers.id))
    .where(and(eq(customerUsers.officeId, officeId), eq(customerUsers.accountType, "business")))
    .orderBy(desc(customerUsers.createdAt));

  return rows.map((row) => {
    const profile = row.profile;
    return {
      id: row.user.id,
      name: row.user.name,
      phone: row.user.phone,
      email: row.user.email,
      createdAt: row.user.createdAt,
      companyName: profile?.companyName || "",
      storeName: profile?.storeName || "",
      storeType: profile?.storeType || "",
      gstNumber: profile?.gstNumber || null,
      pickupAddress: profile?.pickupAddress || "",
      pickupCity: profile?.pickupCity || null,
      pickupState: profile?.pickupState || null,
      pickupPincode: profile?.pickupPincode || null,
      verificationStatus: (profile?.verificationStatus || "pending") as BusinessVerificationStatus,
      verificationNote: profile?.verificationNote || null,
      verifiedAt: profile?.verifiedAt || null,
      applicationComplete: profile ? isBusinessApplicationComplete(profile) : false,
      ready: profile ? isBusinessProfileReady(profile) : false,
    };
  });
}

export async function reviewBusinessAccount(
  officeId: string,
  customerUserId: string,
  input: { status: "approved" | "rejected"; note?: string | null; reviewerUserId: string },
) {
  const customer = await storage.getCustomerUser(customerUserId);
  if (!customer || customer.officeId !== officeId || customer.accountType !== "business") {
    throw Object.assign(new Error("Pro account not found."), { status: 404 });
  }
  const profile = await getOrCreateBusinessProfile(customerUserId);
  if (input.status === "approved" && !isBusinessApplicationComplete(profile)) {
    throw Object.assign(
      new Error("This application is missing business name, store name, GST, category, or address."),
      { status: 400 },
    );
  }
  const [updated] = await db
    .update(businessProfiles)
    .set({
      verificationStatus: input.status,
      verificationNote: input.note?.trim() || null,
      verifiedAt: input.status === "approved" ? new Date() : null,
      verifiedByUserId: input.reviewerUserId,
      updatedAt: new Date(),
    })
    .where(eq(businessProfiles.customerUserId, customerUserId))
    .returning();
  return {
    ...serializeProfile(updated),
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
  };
}

export async function listBusinessDestinations(customerUserId: string) {
  await ensureBusinessCourierTables();
  return db
    .select()
    .from(businessDestinations)
    .where(eq(businessDestinations.customerUserId, customerUserId));
}

export async function createBusinessDestination(
  customerUserId: string,
  input: {
    name: string;
    phone: string;
    address: string;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    shipmentType?: "domestic" | "international";
    destinationCountry?: string | null;
    notes?: string | null;
    recurring?: boolean;
  },
) {
  await ensureBusinessCourierTables();
  const [created] = await db
    .insert(businessDestinations)
    .values({
      customerUserId,
      name: input.name,
      phone: input.phone,
      address: input.address,
      addressLine2: input.addressLine2 || null,
      city: input.city || null,
      state: input.state || null,
      pincode: input.pincode || null,
      shipmentType: input.shipmentType === "international" ? "international" : "domestic",
      destinationCountry: input.destinationCountry || null,
      notes: input.notes || null,
      recurring: input.recurring ?? true,
    })
    .returning();
  return created;
}

export async function updateBusinessDestination(
  customerUserId: string,
  id: string,
  patch: Partial<{
    name: string;
    phone: string;
    address: string;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    shipmentType: "domestic" | "international";
    destinationCountry: string | null;
    notes: string | null;
    recurring: boolean;
  }>,
) {
  const [updated] = await db
    .update(businessDestinations)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(businessDestinations.id, id), eq(businessDestinations.customerUserId, customerUserId)))
    .returning();
  return updated;
}

export async function deleteBusinessDestination(customerUserId: string, id: string) {
  await db
    .update(businessDailyJobs)
    .set({ destinationId: null, updatedAt: new Date() })
    .where(and(eq(businessDailyJobs.customerUserId, customerUserId), eq(businessDailyJobs.destinationId, id)));
  const deleted = await db
    .delete(businessDestinations)
    .where(and(eq(businessDestinations.id, id), eq(businessDestinations.customerUserId, customerUserId)))
    .returning();
  return deleted.length > 0;
}

async function jobsForDate(customerUserId: string, jobDate: string): Promise<BusinessDailyJob[]> {
  return db
    .select()
    .from(businessDailyJobs)
    .where(and(eq(businessDailyJobs.customerUserId, customerUserId), eq(businessDailyJobs.jobDate, jobDate)));
}

function jobFromDestination(
  customerUserId: string,
  jobDate: string,
  destination: BusinessDestination,
  extras?: { weight?: string; numberOfPieces?: number; contentDescription?: string },
) {
  return {
    customerUserId,
    destinationId: destination.id,
    jobDate,
    receiverName: destination.name,
    receiverPhone: destination.phone,
    receiverAddress: destination.address,
    receiverAddressLine2: destination.addressLine2,
    receiverCity: destination.city,
    receiverState: destination.state,
    receiverPincode: destination.pincode,
    shipmentType: destination.shipmentType === "international" ? "international" : "domestic",
    destinationCountry: destination.destinationCountry,
    weight: extras?.weight || "1",
    numberOfPieces: extras?.numberOfPieces || 1,
    contentDescription: extras?.contentDescription?.trim() || "Parcel",
    status: "planned" as const,
  };
}

export async function listBusinessOrders(customerUserId: string) {
  await ensureBusinessCourierTables();
  return db
    .select()
    .from(businessOrders)
    .where(eq(businessOrders.customerUserId, customerUserId))
    .orderBy(desc(businessOrders.createdAt));
}

export async function createBusinessOrder(
  customerUserId: string,
  input: {
    channel: "whatsapp" | "call" | "instagram" | "other";
    destinationId?: string;
    name?: string;
    phone?: string;
    address?: string;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    shipmentType?: "domestic" | "international";
    destinationCountry?: string | null;
    contentDescription?: string;
    weight?: string;
    numberOfPieces?: number;
    notes?: string | null;
    saveCustomer?: boolean;
  },
) {
  await ensureBusinessCourierTables();
  let destination: BusinessDestination | undefined;
  if (input.destinationId) {
    destination = (await listBusinessDestinations(customerUserId)).find((row) => row.id === input.destinationId);
    if (!destination) {
      throw Object.assign(new Error("Customer not found."), { status: 404 });
    }
  } else if (input.saveCustomer && input.name && input.phone && input.address) {
    destination = await createBusinessDestination(customerUserId, {
      name: input.name,
      phone: input.phone,
      address: input.address,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      shipmentType: input.shipmentType,
      destinationCountry: input.destinationCountry,
      notes: input.notes,
      recurring: false,
    });
  }

  const receiverName = destination?.name || input.name;
  const receiverPhone = destination?.phone || input.phone;
  const receiverAddress = destination?.address || input.address;
  if (!receiverName || !receiverPhone || !receiverAddress) {
    throw Object.assign(new Error("Add the customer name, phone, and address for this order."), { status: 400 });
  }

  const [created] = await db
    .insert(businessOrders)
    .values({
      customerUserId,
      destinationId: destination?.id || null,
      channel: input.channel,
      receiverName,
      receiverPhone,
      receiverAddress,
      receiverAddressLine2: destination?.addressLine2 || input.addressLine2 || null,
      receiverCity: destination?.city || input.city || null,
      receiverState: destination?.state || input.state || null,
      receiverPincode: destination?.pincode || input.pincode || null,
      shipmentType:
        destination?.shipmentType === "international" || input.shipmentType === "international"
          ? "international"
          : "domestic",
      destinationCountry: destination?.destinationCountry || input.destinationCountry || null,
      contentDescription: input.contentDescription?.trim() || "Store order",
      weight: input.weight || "1",
      numberOfPieces: input.numberOfPieces || 1,
      notes: input.notes || null,
      status: "open",
    })
    .returning();
  return created;
}

export async function queueBusinessOrderForPickup(customerUserId: string, orderId: string, jobDate = todayIsoDate()) {
  const [order] = await db
    .select()
    .from(businessOrders)
    .where(and(eq(businessOrders.id, orderId), eq(businessOrders.customerUserId, customerUserId)))
    .limit(1);
  if (!order) {
    throw Object.assign(new Error("Order not found."), { status: 404 });
  }
  if (order.status === "cancelled") {
    throw Object.assign(new Error("This order was cancelled."), { status: 400 });
  }
  if (order.status === "booked") {
    throw Object.assign(new Error("This order is already booked."), { status: 400 });
  }
  if (order.dailyJobId && order.status === "pickup_requested") {
    const [existing] = await db
      .select()
      .from(businessDailyJobs)
      .where(eq(businessDailyJobs.id, order.dailyJobId))
      .limit(1);
    if (existing) return { order, job: existing };
  }
  const job = await addBusinessTodayJob(customerUserId, jobDate, {
    destinationId: order.destinationId || undefined,
    newCustomer: order.destinationId
      ? undefined
      : {
          name: order.receiverName,
          phone: order.receiverPhone,
          address: order.receiverAddress,
          addressLine2: order.receiverAddressLine2,
          city: order.receiverCity,
          state: order.receiverState,
          pincode: order.receiverPincode,
          shipmentType: order.shipmentType === "international" ? "international" : "domestic",
          destinationCountry: order.destinationCountry,
        },
    saveCustomer: false,
    weight: String(order.weight || "1"),
    numberOfPieces: order.numberOfPieces || 1,
    contentDescription: order.contentDescription,
  });
  const [updated] = await db
    .update(businessOrders)
    .set({
      status: "pickup_requested",
      dailyJobId: job.id,
      updatedAt: new Date(),
    })
    .where(eq(businessOrders.id, order.id))
    .returning();
  return { order: updated, job };
}

export async function cancelBusinessOrder(customerUserId: string, orderId: string) {
  const [order] = await db
    .select()
    .from(businessOrders)
    .where(and(eq(businessOrders.id, orderId), eq(businessOrders.customerUserId, customerUserId)))
    .limit(1);
  if (!order) {
    throw Object.assign(new Error("Order not found."), { status: 404 });
  }
  const [updated] = await db
    .update(businessOrders)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(businessOrders.id, orderId))
    .returning();
  return updated;
}

export async function getBusinessToday(customerUserId: string, jobDate = todayIsoDate()) {
  const profile = await getOrCreateBusinessProfile(customerUserId);
  const weekdays = mergeBusinessWeekdays(profile.weekdays);
  const standingDay = isBusinessPickupDay(weekdays, jobDate);
  const jobs = await jobsForDate(customerUserId, jobDate);
  const pickupDay = profile.pickupStyle === "on_demand" || standingDay || jobs.length > 0;

  return {
    date: jobDate,
    pickupDay,
    standingDay,
    pickupStyle: profile.pickupStyle || "standing",
    profile: serializeProfile(profile),
    jobs,
    destinations: await listBusinessDestinations(customerUserId),
  };
}

export async function addBusinessTodayJob(
  customerUserId: string,
  jobDate: string,
  input: {
    destinationId?: string;
    newCustomer?: {
      name: string;
      phone: string;
      address: string;
      addressLine2?: string | null;
      city?: string | null;
      state?: string | null;
      pincode?: string | null;
      shipmentType?: "domestic" | "international";
      destinationCountry?: string | null;
      notes?: string | null;
    };
    saveCustomer?: boolean;
    weight?: string;
    numberOfPieces?: number;
    contentDescription?: string;
  },
) {
  let destination: BusinessDestination | undefined;
  if (input.destinationId) {
    const destinations = await listBusinessDestinations(customerUserId);
    destination = destinations.find((row) => row.id === input.destinationId);
    if (!destination) {
      throw Object.assign(new Error("Customer not found."), { status: 404 });
    }
  } else if (input.newCustomer) {
    if (input.saveCustomer !== false) {
      destination = await createBusinessDestination(customerUserId, {
        ...input.newCustomer,
        recurring: false,
      });
    }
  }

  const extras = {
    weight: input.weight,
    numberOfPieces: input.numberOfPieces,
    contentDescription: input.contentDescription,
  };

  if (destination) {
    const [created] = await db
      .insert(businessDailyJobs)
      .values(jobFromDestination(customerUserId, jobDate, destination, extras))
      .returning();
    return created;
  }

  const customer = input.newCustomer;
  if (!customer) {
    throw Object.assign(new Error("Choose an existing customer or enter a new customer."), { status: 400 });
  }
  const [created] = await db
    .insert(businessDailyJobs)
    .values({
      customerUserId,
      destinationId: null,
      jobDate,
      receiverName: customer.name,
      receiverPhone: customer.phone,
      receiverAddress: customer.address,
      receiverAddressLine2: customer.addressLine2 || null,
      receiverCity: customer.city || null,
      receiverState: customer.state || null,
      receiverPincode: customer.pincode || null,
      shipmentType: customer.shipmentType === "international" ? "international" : "domestic",
      destinationCountry: customer.destinationCountry || null,
      weight: extras.weight || "1",
      numberOfPieces: extras.numberOfPieces || 1,
      contentDescription: extras.contentDescription?.trim() || "Parcel",
      status: "planned",
    })
    .returning();
  return created;
}

export async function patchBusinessTodayJob(
  customerUserId: string,
  jobId: string,
  patch: Partial<{
    status: "planned" | "skipped";
    weight: string;
    numberOfPieces: number;
    contentDescription: string;
  }>,
) {
  const [job] = await db
    .select()
    .from(businessDailyJobs)
    .where(and(eq(businessDailyJobs.id, jobId), eq(businessDailyJobs.customerUserId, customerUserId)))
    .limit(1);
  if (!job) {
    throw Object.assign(new Error("Job not found."), { status: 404 });
  }
  if (job.status === "submitted") {
    throw Object.assign(new Error("This pickup is already submitted."), { status: 400 });
  }
  const [updated] = await db
    .update(businessDailyJobs)
    .set({
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.weight ? { weight: patch.weight } : {}),
      ...(patch.numberOfPieces ? { numberOfPieces: patch.numberOfPieces } : {}),
      ...(patch.contentDescription ? { contentDescription: patch.contentDescription } : {}),
      updatedAt: new Date(),
    })
    .where(eq(businessDailyJobs.id, jobId))
    .returning();
  return updated;
}

export async function confirmBusinessToday(
  customer: CustomerUser,
  jobDate: string,
  resolveBranchId: (officeId: string, body: {
    pickupLat?: string | null;
    pickupLng?: string | null;
    senderPincode?: string | null;
  }) => Promise<string | null>,
) {
  const profile = await getOrCreateBusinessProfile(customer.id);
  if (!isBusinessVerified(profile)) {
    throw Object.assign(
      new Error("XGoo Command must verify this Pro account before pickups can start."),
      { status: 403 },
    );
  }
  if (!isBusinessProfileReady(profile)) {
    throw Object.assign(
      new Error("Add your business name, store name, pickup address, and pickup slot first."),
      { status: 400 },
    );
  }
  const senderPhone = (profile.pickupPhone || customer.phone || "").replace(/\D/g, "");
  if (senderPhone.length < 10) {
    throw Object.assign(
      new Error("Add a pickup contact phone on Schedule or Account before confirming."),
      { status: 400 },
    );
  }

  const jobs = (await jobsForDate(customer.id, jobDate)).filter((job) => job.status === "planned");
  if (jobs.length === 0) {
    throw Object.assign(new Error("There are no planned pickups to confirm for this day."), { status: 400 });
  }

  const senderName = profile.storeName.trim() || profile.companyName.trim() || customer.name;
  const created: Array<{ jobId: string; requestNumber: string }> = [];
  const [office] = await db.select().from(offices).where(eq(offices.id, customer.officeId)).limit(1);

  for (const job of jobs) {
    const weight = String(job.weight || "1");
    const branchId = await resolveBranchId(customer.officeId, {
      pickupLat: profile.pickupLat,
      pickupLng: profile.pickupLng,
      senderPincode: profile.pickupPincode,
    });
    const request = await storage.createBookingRequest({
      senderName,
      senderPhone: senderPhone.slice(-10),
      senderEmail: customer.email || "",
      senderAddress: profile.pickupAddress,
      senderCity: profile.pickupCity,
      senderState: profile.pickupState,
      senderPincode: profile.pickupPincode,
      receiverName: job.receiverName,
      receiverPhone: job.receiverPhone,
      receiverAddress: job.receiverAddress,
      receiverAddressLine2: job.receiverAddressLine2,
      receiverCity: job.receiverCity,
      receiverState: job.receiverState,
      receiverPincode: job.receiverPincode,
      weight,
      numberOfPieces: job.numberOfPieces || 1,
      contentDescription: job.contentDescription || "Parcel",
      serviceType: "surface",
      shipmentType: job.shipmentType === "international" ? "international" : "domestic",
      destinationCountry: job.destinationCountry,
      pickupLat: profile.pickupLat,
      pickupLng: profile.pickupLng,
      pickupLocationName: profile.pickupAddress,
      pickupDate: jobDate,
      pickupTimeSlot: profile.pickupTimeSlot,
      officeId: customer.officeId,
      branchId: branchId || undefined,
      customerUserId: customer.id,
      source: "b2b_daily",
      status: "pending",
    });

    await db
      .update(businessDailyJobs)
      .set({
        status: "submitted",
        bookingRequestId: request.id,
        updatedAt: new Date(),
      })
      .where(eq(businessDailyJobs.id, job.id));

    await db
      .update(businessOrders)
      .set({
        status: "booked",
        bookingRequestId: request.id,
        updatedAt: new Date(),
      })
      .where(eq(businessOrders.dailyJobId, job.id));

    triggerCustomerNotification(
      customer.id,
      "Pickup requested",
      `Request #${request.requestNumber} is with XGoo for ${job.receiverName}.`,
      "booking_created",
      { bookingRequestId: request.id, requestNumber: request.requestNumber },
    );
    if (office) {
      triggerBookingRequestWhatsApp(
        (office as { whatsappSettings?: unknown }).whatsappSettings,
        request,
      );
    }
    void assignPickupJob(request).catch((error) => {
      console.error("Pickup assign failed:", error);
    });
    created.push({ jobId: job.id, requestNumber: request.requestNumber });
  }

  return {
    confirmed: created.length,
    requests: created,
    date: jobDate,
  };
}

type BusinessBillRow = {
  shipmentId: string | null;
  quotationId: string | null;
  bookingRequestId: string;
  requestNumber: string;
  bookingNumber: string;
  invoiceNumber: string | null;
  receiverName: string;
  receiverCity: string | null;
  senderCity: string | null;
  bookedAt: Date | null;
  amount: number;
  paymentId: string | null;
  paymentStatus: "pending" | "completed" | "failed";
  paymentMode: string | null;
  settlementId: string | null;
  inCurrentPeriod: boolean;
};

function moneyAmount(value: unknown) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

function billStatus(
  paymentStatus: string | null | undefined,
  amount: number,
): "pending" | "completed" | "failed" {
  if (paymentStatus === "completed") return "completed";
  if (paymentStatus === "failed") return "failed";
  if (amount <= 0) return "completed";
  return "pending";
}

async function collectBusinessBills(customer: CustomerUser): Promise<{
  billingCycle: BusinessBillingCycle;
  period: ReturnType<typeof billingPeriodBounds>;
  bills: BusinessBillRow[];
}> {
  await ensureBusinessCourierTables();
  const profile = await getOrCreateBusinessProfile(customer.id);
  const billingCycle = normalizeBillingCycle(profile.billingCycle);
  const period = billingPeriodBounds(billingCycle);
  const requests = await storage.getBookingRequestsByCustomerUser(customer.id, {
    officeId: customer.officeId,
    phone: customer.phone,
  });

  const bills: BusinessBillRow[] = [];
  const seen = new Set<string>();

  for (const request of requests) {
    const shipment = await storage.getShipmentForBookingRequest(request);
    if (shipment) {
      if (seen.has(`shipment:${shipment.id}`)) continue;
      seen.add(`shipment:${shipment.id}`);

      const [payment, invoice] = await Promise.all([
        storage.getPaymentByShipment(shipment.id),
        storage.getInvoiceByShipment(shipment.id),
      ]);
      const amount = moneyAmount(invoice?.totalAmount || shipment.totalAmount);
      const bookedAt = shipment.bookedAt || shipment.createdAt || request.createdAt || null;
      bills.push({
        shipmentId: shipment.id,
        quotationId: payment?.quotationId || null,
        bookingRequestId: request.id,
        requestNumber: request.requestNumber,
        bookingNumber: shipment.bookingNumber,
        invoiceNumber: invoice?.invoiceNumber || null,
        receiverName: shipment.receiverName || request.receiverName,
        receiverCity: shipment.receiverCity || request.receiverCity || null,
        senderCity: shipment.senderCity || request.senderCity || null,
        bookedAt,
        amount,
        paymentId: payment?.id || null,
        paymentStatus: billStatus(payment?.paymentStatus, amount),
        paymentMode: payment?.paymentMode || null,
        settlementId: payment?.settlementId || null,
        inCurrentPeriod: isDateInBillingPeriod(bookedAt, billingCycle),
      });
      continue;
    }

    const quotation = await storage.getLatestQuotationForBooking(request.id);
    if (!quotation || quotation.status !== "accepted") continue;
    if (seen.has(`quote:${quotation.id}`)) continue;
    seen.add(`quote:${quotation.id}`);

    const payment = await storage.getPaymentByQuotation(quotation.id);
    const amount = moneyAmount(quotation.totalAmount);
    const bookedAt = quotation.acceptedAt || quotation.createdAt || request.createdAt || null;
    bills.push({
      shipmentId: null,
      quotationId: quotation.id,
      bookingRequestId: request.id,
      requestNumber: request.requestNumber,
      bookingNumber: quotation.quotationNumber,
      invoiceNumber: null,
      receiverName: request.receiverName,
      receiverCity: quotation.receiverCity || request.receiverCity || null,
      senderCity: quotation.senderCity || request.senderCity || null,
      bookedAt,
      amount,
      paymentId: payment?.id || null,
      paymentStatus: billStatus(payment?.paymentStatus, amount),
      paymentMode: payment?.paymentMode || null,
      settlementId: payment?.settlementId || null,
      inCurrentPeriod: isDateInBillingPeriod(bookedAt, billingCycle),
    });
  }

  return { billingCycle, period, bills };
}

function serializeBill(bill: BusinessBillRow) {
  return {
    id: bill.shipmentId || bill.quotationId || bill.bookingRequestId,
    shipmentId: bill.shipmentId,
    quotationId: bill.quotationId,
    bookingRequestId: bill.bookingRequestId,
    requestNumber: bill.requestNumber,
    bookingNumber: bill.bookingNumber,
    invoiceNumber: bill.invoiceNumber,
    receiverName: bill.receiverName,
    receiverCity: bill.receiverCity,
    senderCity: bill.senderCity,
    bookedAt: bill.bookedAt,
    amount: bill.amount.toFixed(2),
    paymentStatus: bill.paymentStatus,
    paymentMode: bill.paymentMode,
    settlementId: bill.settlementId,
    inCurrentPeriod: bill.inCurrentPeriod,
  };
}

export async function listBusinessBills(customer: CustomerUser) {
  const { billingCycle, period, bills } = await collectBusinessBills(customer);
  const settlements = await db
    .select()
    .from(businessSettlements)
    .where(eq(businessSettlements.customerUserId, customer.id))
    .orderBy(desc(businessSettlements.createdAt))
    .limit(12);

  const outstanding = bills.filter((bill) => bill.paymentStatus !== "completed" && bill.amount > 0);
  const periodOutstanding = outstanding.filter((bill) => bill.inCurrentPeriod);
  const paid = bills.filter((bill) => bill.paymentStatus === "completed");

  return {
    billingCycle,
    period: {
      start: period.startIso,
      end: period.endIso,
      label: period.label,
    },
    outstandingTotal: outstanding.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2),
    periodOutstandingTotal: periodOutstanding.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2),
    paidTotal: paid.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2),
    outstandingCount: outstanding.length,
    periodOutstandingCount: periodOutstanding.length,
    bills: bills.map(serializeBill),
    settlements: settlements.map((row) => ({
      ...row,
      amount: moneyAmount(row.amount).toFixed(2),
    })),
  };
}

export async function settleBusinessBills(
  customer: CustomerUser,
  input: {
    paymentMode: BusinessSettlementMode;
    reference?: string | null;
    notes?: string | null;
  },
) {
  const { billingCycle, period, bills } = await collectBusinessBills(customer);
  const due = bills.filter((bill) => bill.paymentStatus !== "completed" && bill.amount > 0);
  if (due.length === 0) {
    throw Object.assign(new Error("There is nothing outstanding to pay XGoo right now."), { status: 400 });
  }

  const amount = due.reduce((sum, bill) => sum + bill.amount, 0);
  const paidAt = new Date();
  const [settlement] = await db
    .insert(businessSettlements)
    .values({
      customerUserId: customer.id,
      billingCycle,
      periodStart: period.start,
      periodEnd: period.end,
      amount: amount.toFixed(2),
      shipmentCount: due.length,
      paymentMode: input.paymentMode,
      paymentStatus: "completed",
      transactionReference: input.reference?.trim() || null,
      notes: input.notes?.trim() || null,
      paidAt,
    })
    .returning();

  for (const bill of due) {
    if (bill.paymentId) {
      await db
        .update(payments)
        .set({
          paymentStatus: "completed",
          paymentMode: input.paymentMode,
          settlementId: settlement.id,
          transactionReference: input.reference?.trim() || settlement.id,
          notes: input.notes?.trim() || `Settled with XGoo (${billingCycle})`,
          paidAt,
        })
        .where(eq(payments.id, bill.paymentId));
      continue;
    }
    await storage.createPayment({
      shipmentId: bill.shipmentId,
      quotationId: bill.quotationId,
      amount: bill.amount.toFixed(2),
      paymentMode: input.paymentMode,
      paymentStatus: "completed",
      settlementId: settlement.id,
      transactionReference: input.reference?.trim() || settlement.id,
      notes: input.notes?.trim() || `Settled with XGoo (${billingCycle})`,
      paidAt,
    });
  }

  return {
    settlement: {
      ...settlement,
      amount: amount.toFixed(2),
    },
    paidCount: due.length,
    paidTotal: amount.toFixed(2),
    bills: await listBusinessBills(customer),
  };
}
