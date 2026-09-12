import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  businessDailyJobs,
  businessDestinations,
  businessProfiles,
  type BusinessDailyJob,
  type BusinessDestination,
  type BusinessProfile,
  type CustomerUser,
} from "@shared/schema";
import {
  DEFAULT_BUSINESS_WEEKDAYS,
  isBusinessPickupDay,
  isBusinessProfileReady,
  mergeBusinessWeekdays,
  todayIsoDate,
  type BusinessWeekdays,
} from "@shared/business-courier";
import { db } from "./db";
import { storage } from "./storage";
import { triggerCustomerNotification } from "./customer-notifications";
import { triggerBookingRequestWhatsApp } from "./integrations/whatsapp-notifications";
import { offices } from "@shared/schema";

let tablesReady: Promise<void> | null = null;

export async function ensureBusinessCourierTables() {
  if (!tablesReady) {
    tablesReady = db.execute(sql`
      CREATE TABLE IF NOT EXISTS business_profiles (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
        customer_user_id varchar NOT NULL UNIQUE REFERENCES customer_users(id),
        company_name varchar(255) NOT NULL DEFAULT '',
        store_type varchar(50) NOT NULL DEFAULT '',
        gst_number varchar(20),
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
    });
  }
  await tablesReady;
}

function serializeProfile(profile: BusinessProfile) {
  return {
    ...profile,
    weekdays: mergeBusinessWeekdays(profile.weekdays),
    ready: isBusinessProfileReady(profile),
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
    weekdays: BusinessWeekdays;
  }>,
) {
  await getOrCreateBusinessProfile(customerUserId);
  const [updated] = await db
    .update(businessProfiles)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(eq(businessProfiles.customerUserId, customerUserId))
    .returning();
  return serializeProfile(updated);
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
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
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
      city: input.city || null,
      state: input.state || null,
      pincode: input.pincode || null,
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
    city: string | null;
    state: string | null;
    pincode: string | null;
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
    receiverCity: destination.city,
    receiverState: destination.state,
    receiverPincode: destination.pincode,
    weight: extras?.weight || "1",
    numberOfPieces: extras?.numberOfPieces || 1,
    contentDescription: extras?.contentDescription?.trim() || "Parcel",
    status: "planned" as const,
  };
}

export async function getBusinessToday(customerUserId: string, jobDate = todayIsoDate()) {
  const profile = await getOrCreateBusinessProfile(customerUserId);
  const weekdays = mergeBusinessWeekdays(profile.weekdays);
  const pickupDay = isBusinessPickupDay(weekdays, jobDate);
  const jobs = await jobsForDate(customerUserId, jobDate);

  return {
    date: jobDate,
    pickupDay,
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
      city?: string | null;
      state?: string | null;
      pincode?: string | null;
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
      receiverCity: customer.city || null,
      receiverState: customer.state || null,
      receiverPincode: customer.pincode || null,
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
  if (!isBusinessProfileReady(profile)) {
    throw Object.assign(
      new Error("Add your company name, store type, pickup address, and pickup slot first."),
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

  const senderName = profile.companyName.trim() || customer.name;
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
      receiverCity: job.receiverCity,
      receiverState: job.receiverState,
      receiverPincode: job.receiverPincode,
      weight,
      numberOfPieces: job.numberOfPieces || 1,
      contentDescription: job.contentDescription || "Parcel",
      serviceType: "surface",
      shipmentType: "domestic",
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
    created.push({ jobId: job.id, requestNumber: request.requestNumber });
  }

  return {
    confirmed: created.length,
    requests: created,
    date: jobDate,
  };
}
