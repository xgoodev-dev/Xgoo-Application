import type { Express, NextFunction, Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { bookingRequests, PICKUP_GOVT_ID_TYPES, type PickupPartner } from "@shared/schema";
import { isAuthenticated } from "./auth";
import { db } from "./db";
import { triggerQuoteWhatsApp } from "./integrations/whatsapp-notifications";
import {
  assignSoleStoreIfNeeded,
  createPickupPartnerAccount,
  hashPickupPassword,
  requireOfficeStore,
  toPublicPickupPartner,
  verifyPickupPassword,
} from "./pickup-auth";
import {
  assignAvailableJobsForPartner,
  assignPickupJob,
  ensurePickupTables,
  reassignDeclinedJob,
} from "./pickup-dispatch";
import { triggerPickupPartnerNotification } from "./pickup-notifications";
import {
  consumePickupPartnerOtp,
  issuePickupPartnerSession,
  normalizePickupPhone,
  pickupOtpError,
  sendPickupPartnerOtp,
} from "./pickup-otp";
import {
  acceptPickupQuotation,
  createPickupQuotation,
  getStoreVisit,
  isProBooking,
  notifyAwbCreated,
  publicQuoteUrl,
  quoteStoreVisit,
  raisePickupShipmentAtHub,
  rejectPickupQuotation,
} from "./pickup-service";
import { storage } from "./storage";

const ACTIVE_JOB_STATUSES = new Set([
  "assigned",
  "accepted",
  "en_route",
  "arrived",
  "inspected",
  "quote_sent",
  "quote_accepted",
  "packed",
  "at_hub",
  "awb_created",
]);

const HISTORY_JOB_STATUSES = new Set(["completed", "declined", "cancelled"]);

function otpError(res: Response, error: unknown) {
  return pickupOtpError(res, error);
}

async function isPickupAuthenticated(req: any, res: Response, next: NextFunction) {
  const token = req.headers["x-pickup-token"] as string;
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  await ensurePickupTables();
  const session = await storage.getPickupPartnerSessionByToken(token);
  if (!session) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
  const partner = await storage.getPickupPartner(session.partnerId);
  if (!partner || partner.status !== "active") {
    return res.status(401).json({ message: "Partner not found" });
  }
  req.pickupPartner = partner;
  next();
}

async function jobForPartner(jobId: string, partner: PickupPartner) {
  const job = await storage.getPickupJob(jobId);
  if (!job || job.partnerId !== partner.id) return undefined;
  if (partner.branchId && job.branchId && partner.branchId !== job.branchId) return undefined;
  return job;
}

const partnerAccountSchema = z.object({
  name: z.string().trim().min(1).max(255),
  phone: z.string().min(10),
  password: z.string().min(8),
  address: z.string().trim().min(4).max(500),
  govtIdType: z.enum(PICKUP_GOVT_ID_TYPES),
  govtIdNumber: z.string().trim().min(4).max(80),
  branchId: z.string().uuid(),
});

async function enrichJob(job: Awaited<ReturnType<typeof storage.getPickupJob>>) {
  if (!job) return null;
  const request = await storage.getBookingRequest(job.bookingRequestId);
  const quotation = job.quotationId ? await storage.getQuotation(job.quotationId) : undefined;
  const shipment = job.shipmentId ? await storage.getShipment(job.shipmentId) : undefined;
  const storeVisit = await getStoreVisit(job);
  return { ...job, request, quotation, shipment, storeVisit };
}

async function requireStaffPartnerAccess(req: any, res: Response) {
  const office = await storage.getOfficeByUserId(req.user.id);
  if (!office) {
    res.status(404).json({ message: "XGoo organization was not found" });
    return null;
  }
  if (req.staffRole === "super_admin") {
    return { office, isSuperAdmin: true as const, branchId: null as string | null };
  }
  const member = req.staffMember as { role?: string; branchId?: string | null } | undefined;
  if (member?.role === "branch_manager" && member.branchId) {
    return { office, isSuperAdmin: false as const, branchId: member.branchId };
  }
  res.status(403).json({
    message: "Only XGoo Command Super Admin or an XGoo Hub store manager can manage pickup partners.",
  });
  return null;
}

export function registerPickupRoutes(app: Express) {
  app.post("/api/public/office/:slug/pickup/otp", async (req, res) => {
    try {
      const office = await storage.getOfficeBySlug(req.params.slug);
      if (!office) return res.status(404).json({ message: "Office not found" });
      await ensurePickupTables();
      const phone = z.object({ phone: z.string().min(10) }).parse(req.body).phone;
      const result = await sendPickupPartnerOtp({ office, phone });
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError || (error as { status?: number })?.status) {
        return otpError(res, error);
      }
      console.error("Pickup OTP send failed:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/public/office/:slug/pickup/login", async (req, res) => {
    try {
      const office = await storage.getOfficeBySlug(req.params.slug);
      if (!office) return res.status(404).json({ message: "Office not found" });
      await ensurePickupTables();
      const body = z.object({ phone: z.string().min(10), otp: z.string().min(6) }).parse(req.body);
      const phone = await consumePickupPartnerOtp({
        officeId: office.id,
        phone: body.phone,
        otp: body.otp,
      });
      const partner = await storage.getPickupPartnerByPhone(office.id, phone);
      if (!partner || partner.status !== "active") {
        return res.status(401).json({ message: "No XGoo Pickup partner found for this mobile number." });
      }
      const ready = await assignSoleStoreIfNeeded(partner);
      const session = await issuePickupPartnerSession(ready);
      res.json({ token: session.token, user: await toPublicPickupPartner(session.user) });
    } catch (error) {
      if (error instanceof z.ZodError || (error as { status?: number })?.status) {
        return otpError(res, error);
      }
      console.error("Pickup login failed:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.get("/api/public/office/:slug/pickup/stores", async (req, res) => {
    const office = await storage.getOfficeBySlug(req.params.slug);
    if (!office) return res.status(404).json({ message: "Office not found" });
    const stores = await storage.getBranchesByOffice(office.id);
    res.json(stores.map((store) => ({ id: store.id, name: store.name, city: store.city })));
  });

  app.post("/api/public/office/:slug/pickup/signup", async (req, res) => {
    try {
      const office = await storage.getOfficeBySlug(req.params.slug);
      if (!office) return res.status(404).json({ message: "Office not found" });
      await ensurePickupTables();
      const body = partnerAccountSchema.parse(req.body);
      const partner = await createPickupPartnerAccount({
        office,
        branchId: body.branchId,
        name: body.name,
        phone: body.phone,
        password: body.password,
        address: body.address,
        govtIdType: body.govtIdType,
        govtIdNumber: body.govtIdNumber,
        signupSource: "self",
      });
      const session = await issuePickupPartnerSession(partner);
      res.json({ token: session.token, user: await toPublicPickupPartner(session.user) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Enter name, mobile, password, address, government ID, and store.",
        });
      }
      if ((error as { status?: number })?.status) {
        return otpError(res, error);
      }
      console.error("Pickup signup failed:", error);
      res.status(500).json({ message: "Failed to create pickup partner account" });
    }
  });

  app.post("/api/public/office/:slug/pickup/login-password", async (req, res) => {
    try {
      const office = await storage.getOfficeBySlug(req.params.slug);
      if (!office) return res.status(404).json({ message: "Office not found" });
      await ensurePickupTables();
      const body = z.object({ phone: z.string().min(10), password: z.string().min(1) }).parse(req.body);
      const phone = normalizePickupPhone(body.phone);
      const partner = await storage.getPickupPartnerByPhone(office.id, phone);
      if (!partner || partner.status !== "active") {
        return res.status(401).json({ message: "No XGoo Pickup partner found for this mobile number." });
      }
      await verifyPickupPassword(body.password, partner.passwordHash);
      const ready = await assignSoleStoreIfNeeded(partner);
      const session = await issuePickupPartnerSession(ready);
      res.json({ token: session.token, user: await toPublicPickupPartner(session.user) });
    } catch (error) {
      if (error instanceof z.ZodError || (error as { status?: number })?.status) {
        return otpError(res, error);
      }
      console.error("Pickup password login failed:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.get("/api/pickup/me", isPickupAuthenticated, async (req: any, res) => {
    res.json(await toPublicPickupPartner(req.pickupPartner));
  });

  app.patch("/api/pickup/me", isPickupAuthenticated, async (req: any, res) => {
    try {
      const body = z
        .object({
          availability: z.enum(["offline", "available", "busy"]).optional(),
          name: z.string().trim().min(1).max(255).optional(),
          password: z.string().min(8).optional(),
        })
        .parse(req.body);
      const updated = await storage.updatePickupPartner(req.pickupPartner.id, {
        availability: body.availability,
        name: body.name,
        ...(body.password ? { passwordHash: await hashPickupPassword(body.password) } : {}),
      });
      if (!updated) return res.status(404).json({ message: "Partner not found" });
      if (body.availability === "available") {
        await assignAvailableJobsForPartner(req.pickupPartner.id);
      }
      res.json(await toPublicPickupPartner(updated));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update availability" });
    }
  });

  app.post("/api/pickup/logout", isPickupAuthenticated, async (req, res) => {
    const token = req.headers["x-pickup-token"] as string;
    await storage.deletePickupPartnerSession(token);
    res.json({ success: true });
  });

  app.post("/api/pickup/push-token", isPickupAuthenticated, async (req: any, res) => {
    const body = z.object({ token: z.string().min(8), platform: z.string().min(2) }).parse(req.body);
    res.json(await storage.upsertPickupPartnerPushToken(req.pickupPartner.id, body.token, body.platform));
  });

  app.get("/api/pickup/jobs", isPickupAuthenticated, async (req: any, res) => {
    await ensurePickupTables();
    const jobs = await storage.getPickupJobsByPartner(req.pickupPartner.id);
    const bucket = String(req.query.bucket || "all");
    const filtered = jobs.filter((job) => {
      if (bucket === "new") return job.status === "assigned";
      if (bucket === "active") return ACTIVE_JOB_STATUSES.has(job.status) && job.status !== "assigned";
      if (bucket === "history") return HISTORY_JOB_STATUSES.has(job.status);
      return true;
    });
    res.json(await Promise.all(filtered.map((job) => enrichJob(job))));
  });

  app.get("/api/pickup/jobs/:id", isPickupAuthenticated, async (req: any, res) => {
    const job = await jobForPartner(req.params.id, req.pickupPartner);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(await enrichJob(job));
  });

  app.post("/api/pickup/jobs/:id/accept", isPickupAuthenticated, async (req: any, res) => {
    const job = await jobForPartner(req.params.id, req.pickupPartner);
    if (!job || job.status !== "assigned") {
      return res.status(400).json({ message: "This job cannot be accepted." });
    }
    const updated = await storage.updatePickupJob(job.id, {
      status: "accepted",
      acceptedAt: new Date(),
    });
    res.json(await enrichJob(updated));
  });

  app.post("/api/pickup/jobs/:id/decline", isPickupAuthenticated, async (req: any, res) => {
    const job = await jobForPartner(req.params.id, req.pickupPartner);
    if (!job || job.status !== "assigned") {
      return res.status(400).json({ message: "This job cannot be declined." });
    }
    await storage.updatePickupJob(job.id, { status: "declined" });
    await storage.updatePickupPartner(req.pickupPartner.id, { availability: "available" });
    await reassignDeclinedJob(job.id, req.pickupPartner.id);
    res.json({ success: true });
  });

  app.post("/api/pickup/jobs/:id/en-route", isPickupAuthenticated, async (req: any, res) => {
    const job = await jobForPartner(req.params.id, req.pickupPartner);
    if (!job || (job.status !== "accepted" && job.status !== "en_route")) {
      return res.status(400).json({ message: "Mark the job accepted before going en route." });
    }
    const updated = await storage.updatePickupJob(job.id, {
      status: "en_route",
      enRouteAt: new Date(),
    });
    res.json(await enrichJob(updated));
  });

  app.post("/api/pickup/jobs/:id/arrive", isPickupAuthenticated, async (req: any, res) => {
    const job = await jobForPartner(req.params.id, req.pickupPartner);
    if (!job || (job.status !== "en_route" && job.status !== "accepted" && job.status !== "arrived")) {
      return res.status(400).json({ message: "Go en route before marking arrived." });
    }
    const updated = await storage.updatePickupJob(job.id, {
      status: "arrived",
      arrivedAt: new Date(),
    });
    res.json(await enrichJob(updated));
  });

  app.post("/api/pickup/jobs/:id/inspect", isPickupAuthenticated, async (req: any, res) => {
    try {
      const job = await jobForPartner(req.params.id, req.pickupPartner);
      if (!job) return res.status(404).json({ message: "Job not found" });
      const body = z
        .object({
          actualWeight: z.string().min(1),
          actualPieces: z.number().int().positive().default(1),
          actualContents: z.string().optional(),
          inspectionNotes: z.string().optional(),
          inspectionPhotoUrls: z.array(z.string()).optional(),
        })
        .parse(req.body);

      const updated = await storage.updatePickupJob(job.id, {
        actualWeight: body.actualWeight,
        actualPieces: body.actualPieces,
        actualContents: body.actualContents || null,
        inspectionNotes: body.inspectionNotes || null,
        inspectionPhotoUrls: body.inspectionPhotoUrls || [],
        status: "inspected",
        inspectedAt: new Date(),
      });

      await storage.updateBookingRequestStatus(job.bookingRequestId, "reviewed");
      const request = await storage.getBookingRequest(job.bookingRequestId);
      if (request) {
        await db
          .update(bookingRequests)
          .set({
            weight: body.actualWeight,
            numberOfPieces: body.actualPieces,
            contentDescription: body.actualContents || request.contentDescription,
            packagePhotoUrls: body.inspectionPhotoUrls || request.packagePhotoUrls,
          })
          .where(eq(bookingRequests.id, request.id));
      }

      res.json(await enrichJob(updated));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Pickup inspect failed:", error);
      res.status(500).json({ message: "Failed to save inspection" });
    }
  });

  app.post("/api/pickup/jobs/:id/quote", isPickupAuthenticated, async (req: any, res) => {
    try {
      const job = await jobForPartner(req.params.id, req.pickupPartner);
      if (!job) return res.status(404).json({ message: "Job not found" });
      if (!["inspected", "quote_sent"].includes(job.status)) {
        return res.status(400).json({ message: "Inspect the parcel before sending a quote." });
      }
      const request = await storage.getBookingRequest(job.bookingRequestId);
      if (!request) return res.status(404).json({ message: "Booking request not found" });
      const body = z
        .object({
          baseAmount: z.string().optional(),
          additionalCharges: z.string().optional(),
          gstAmount: z.string().optional(),
          totalAmount: z.string().optional(),
          notes: z.string().optional(),
          courierPartnerId: z.string().optional(),
        })
        .parse(req.body || {});

      const result = await createPickupQuotation({
        job,
        request,
        weight: String(job.actualWeight || request.weight || "1"),
        pieces: job.actualPieces || request.numberOfPieces || 1,
        contents: job.actualContents,
        notes: body.notes,
        baseAmount: body.baseAmount,
        additionalCharges: body.additionalCharges,
        gstAmount: body.gstAmount,
        totalAmount: body.totalAmount,
        courierPartnerId: body.courierPartnerId,
      });

      if (result.office) {
        triggerQuoteWhatsApp(
          result.office.whatsappSettings,
          request.senderPhone,
          request.senderName,
          result.quoteUrl,
          result.quotation.totalAmount,
        );
      }

      res.json({
        ...(await enrichJob(await storage.getPickupJob(job.id))),
        quoteUrl: result.quoteUrl,
        quotation: result.quotation,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Pickup quote failed:", error);
      res.status(500).json({ message: "Failed to send quote" });
    }
  });

  app.post("/api/pickup/jobs/:id/quote-store", isPickupAuthenticated, async (req: any, res) => {
    try {
      const job = await jobForPartner(req.params.id, req.pickupPartner);
      if (!job) return res.status(404).json({ message: "Job not found" });
      const result = await quoteStoreVisit(job);
      if (result.quoted.length === 0) {
        return res.status(400).json({
          message: "Inspect every parcel at this store before sending the final quotations.",
        });
      }
      res.json({
        ...(await enrichJob(await storage.getPickupJob(job.id))),
        quoted: result.quoted,
      });
    } catch (error) {
      const status = (error as { status?: number })?.status || 500;
      res.status(status).json({
        message: error instanceof Error ? error.message : "Failed to send store quotations",
      });
    }
  });

  app.post("/api/pickup/jobs/:id/pack", isPickupAuthenticated, async (req: any, res) => {
    const job = await jobForPartner(req.params.id, req.pickupPartner);
    if (!job || (job.status !== "quote_accepted" && job.status !== "packed")) {
      return res.status(400).json({ message: "Wait for the customer to accept the quote before packing." });
    }
    const updated = await storage.updatePickupJob(job.id, {
      status: "packed",
      packedAt: new Date(),
    });
    res.json(await enrichJob(updated));
  });

  app.post("/api/pickup/jobs/:id/hub", isPickupAuthenticated, async (req: any, res) => {
    try {
      const job = await jobForPartner(req.params.id, req.pickupPartner);
      if (!job || !["packed", "at_hub"].includes(job.status)) {
        return res.status(400).json({ message: "Pack the parcel before bringing it to the XGoo store." });
      }
      const result = await raisePickupShipmentAtHub(job);
      res.json(await enrichJob(result.job));
    } catch (error) {
      const status = (error as { status?: number })?.status || 500;
      res.status(status).json({
        message: error instanceof Error ? error.message : "Failed to raise the shipment",
      });
    }
  });

  app.post("/api/pickup/jobs/:id/awb", isPickupAuthenticated, async (req: any, res) => {
    try {
      const job = await jobForPartner(req.params.id, req.pickupPartner);
      if (!job || !(["at_hub", "awb_created"].includes(job.status) || Boolean(job.shipmentId))) {
        return res.status(400).json({ message: "Bring the parcel to the XGoo store before creating an AWB." });
      }
      if (!job.shipmentId) {
        return res.status(400).json({ message: "Shipment is not ready yet." });
      }
      const body = z.object({ awbNumber: z.string().trim().min(4) }).parse(req.body);
      const shipment = await storage.getShipment(job.shipmentId);
      if (!shipment) return res.status(404).json({ message: "Shipment not found" });

      const hadAwb = Boolean((shipment.awbNumber || shipment.externalAwb || "").trim());
      const updatedShipment = await storage.updateShipmentPartnerSync(job.shipmentId, {
        awbNumber: body.awbNumber,
        externalAwb: body.awbNumber,
        partnerSyncStatus: shipment.partnerSyncStatus || "pending",
      });
      const updatedJob = await storage.updatePickupJob(job.id, {
        awbNumber: body.awbNumber,
        status: "awb_created",
        awbCreatedAt: new Date(),
      });
      if (!hadAwb && updatedShipment) {
        await notifyAwbCreated(updatedShipment);
      }
      res.json(await enrichJob(updatedJob));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Pickup AWB failed:", error);
      res.status(500).json({ message: "Failed to save AWB" });
    }
  });

  app.post("/api/pickup/jobs/:id/complete", isPickupAuthenticated, async (req: any, res) => {
    const job = await jobForPartner(req.params.id, req.pickupPartner);
    if (!job || (job.status !== "awb_created" && job.status !== "completed")) {
      return res.status(400).json({ message: "Create the AWB before completing the job." });
    }
    const updated = await storage.updatePickupJob(job.id, {
      status: "completed",
      completedAt: new Date(),
    });
    await storage.updatePickupPartner(req.pickupPartner.id, { availability: "available" });
    await assignAvailableJobsForPartner(req.pickupPartner.id);
    res.json(await enrichJob(updated));
  });

  app.get("/api/public/quotations/:acceptToken", async (req, res) => {
    await ensurePickupTables();
    const quotation = await storage.getQuotationByAcceptToken(req.params.acceptToken);
    if (!quotation) return res.status(404).json({ message: "Quote not found" });
    const request = quotation.bookingRequestId
      ? await storage.getBookingRequest(quotation.bookingRequestId)
      : undefined;
    res.json({
      id: quotation.id,
      quotationNumber: quotation.quotationNumber,
      customerName: quotation.customerName,
      senderCity: quotation.senderCity,
      receiverCity: quotation.receiverCity,
      weight: quotation.weight,
      numberOfPieces: quotation.numberOfPieces,
      contentDescription: quotation.contentDescription,
      serviceType: quotation.serviceType,
      totalAmount: quotation.totalAmount,
      status: quotation.status,
      validUntil: quotation.validUntil,
      requestNumber: request?.requestNumber,
      billOnAccept: request ? await isProBooking(request) : false,
    });
  });

  app.post("/api/public/quotations/:acceptToken/accept", async (req, res) => {
    try {
      await ensurePickupTables();
      const quotation = await storage.getQuotationByAcceptToken(req.params.acceptToken);
      if (!quotation) return res.status(404).json({ message: "Quote not found" });
      const result = await acceptPickupQuotation(quotation);
      res.json({
        success: true,
        status: "accepted",
        bookingNumber: result.shipment?.bookingNumber,
        billed: Boolean(result.billed),
      });
    } catch (error) {
      const status = (error as { status?: number })?.status || 500;
      res.status(status).json({
        message: error instanceof Error ? error.message : "Failed to accept quote",
      });
    }
  });

  app.post("/api/public/quotations/:acceptToken/reject", async (req, res) => {
    try {
      await ensurePickupTables();
      const quotation = await storage.getQuotationByAcceptToken(req.params.acceptToken);
      if (!quotation) return res.status(404).json({ message: "Quote not found" });
      await rejectPickupQuotation(quotation);
      res.json({ success: true, status: "rejected" });
    } catch (error) {
      const status = (error as { status?: number })?.status || 500;
      res.status(status).json({
        message: error instanceof Error ? error.message : "Failed to reject quote",
      });
    }
  });

  app.get("/api/customer/quotations", async (req: any, res) => {
    const token = req.headers["x-customer-token"] as string;
    if (!token) return res.status(401).json({ message: "Authentication required" });
    const session = await storage.getCustomerSessionByToken(token);
    if (!session) return res.status(401).json({ message: "Invalid or expired session" });
    await ensurePickupTables();
    res.json(await storage.getPendingQuotationsForCustomer(session.customerUserId));
  });

  app.post("/api/customer/quotations/:id/accept", async (req: any, res) => {
    const token = req.headers["x-customer-token"] as string;
    if (!token) return res.status(401).json({ message: "Authentication required" });
    const session = await storage.getCustomerSessionByToken(token);
    if (!session) return res.status(401).json({ message: "Invalid or expired session" });
    await ensurePickupTables();
    const quotation = await storage.getQuotation(req.params.id);
    if (!quotation) return res.status(404).json({ message: "Quote not found" });
    const pending = await storage.getPendingQuotationsForCustomer(session.customerUserId);
    if (!pending.some((item) => item.id === quotation.id) && quotation.status !== "accepted") {
      return res.status(403).json({ message: "This quote is not for your account." });
    }
    try {
      const result = await acceptPickupQuotation(quotation);
      res.json({ success: true, bookingNumber: result.shipment?.bookingNumber, billed: Boolean(result.billed) });
    } catch (error) {
      const status = (error as { status?: number })?.status || 500;
      res.status(status).json({
        message: error instanceof Error ? error.message : "Failed to accept quote",
      });
    }
  });

  app.get("/api/pickup-partners", isAuthenticated, async (req: any, res) => {
    const context = await requireStaffPartnerAccess(req, res);
    if (!context) return;
    await ensurePickupTables();
    const partners = await storage.getPickupPartnersByOffice(context.office.id, context.branchId);
    const ready = await Promise.all(partners.map((partner) => assignSoleStoreIfNeeded(partner)));
    res.json(await Promise.all(ready.map((partner) => toPublicPickupPartner(partner))));
  });

  app.post("/api/pickup-partners", isAuthenticated, async (req: any, res) => {
    try {
      const context = await requireStaffPartnerAccess(req, res);
      if (!context) return;
      await ensurePickupTables();
      const body = partnerAccountSchema.parse(req.body);
      const branchId = context.isSuperAdmin ? body.branchId : context.branchId;
      await requireOfficeStore(context.office, branchId);
      const partner = await createPickupPartnerAccount({
        office: context.office,
        branchId: branchId as string,
        name: body.name,
        phone: body.phone,
        password: body.password,
        address: body.address,
        govtIdType: body.govtIdType,
        govtIdNumber: body.govtIdNumber,
        signupSource: "hub",
      });
      res.json(await toPublicPickupPartner(partner));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Enter name, mobile, password, address, government ID, and store.",
        });
      }
      if ((error as { status?: number })?.status) {
        return otpError(res, error);
      }
      console.error("Create pickup partner failed:", error);
      res.status(500).json({ message: "Failed to add pickup partner" });
    }
  });

  app.patch("/api/pickup-partners/:id", isAuthenticated, async (req: any, res) => {
    try {
      const context = await requireStaffPartnerAccess(req, res);
      if (!context) return;
      const partner = await storage.getPickupPartner(req.params.id);
      if (!partner || partner.officeId !== context.office.id) {
        return res.status(404).json({ message: "Partner not found" });
      }
      if (context.branchId && partner.branchId !== context.branchId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const body = z
        .object({
          name: z.string().trim().min(1).max(255).optional(),
          address: z.string().trim().min(4).max(500).optional(),
          govtIdType: z.enum(PICKUP_GOVT_ID_TYPES).optional(),
          govtIdNumber: z.string().trim().min(4).max(80).optional(),
          status: z.enum(["active", "inactive"]).optional(),
          availability: z.enum(["offline", "available", "busy"]).optional(),
          branchId: z.string().uuid().optional(),
          password: z.string().min(8).optional(),
        })
        .parse(req.body);
      const nextBranchId = context.isSuperAdmin ? body.branchId ?? partner.branchId : partner.branchId;
      if (body.branchId && context.isSuperAdmin) {
        await requireOfficeStore(context.office, body.branchId);
      }
      const updated = await storage.updatePickupPartner(partner.id, {
        name: body.name,
        address: body.address,
        govtIdType: body.govtIdType,
        govtIdNumber: body.govtIdNumber,
        status: body.status,
        availability: body.availability,
        branchId: nextBranchId,
        ...(body.password ? { passwordHash: await hashPickupPassword(body.password) } : {}),
      });
      if (!updated) return res.status(404).json({ message: "Partner not found" });
      if (body.availability === "available") {
        await assignAvailableJobsForPartner(partner.id);
      }
      res.json(await toPublicPickupPartner(updated));
    } catch (error) {
      if (error instanceof z.ZodError || (error as { status?: number })?.status) {
        return otpError(res, error);
      }
      console.error("Update pickup partner failed:", error);
      res.status(500).json({ message: "Failed to update partner" });
    }
  });

  app.post("/api/booking-requests/:id/assign-partner", isAuthenticated, async (req: any, res) => {
    const context = await requireStaffPartnerAccess(req, res);
    if (!context) return;
    const request = await storage.getBookingRequest(req.params.id);
    if (!request || request.officeId !== context.office.id) {
      return res.status(404).json({ message: "Booking request not found" });
    }
    const body = z.object({ partnerId: z.string().uuid().optional() }).parse(req.body || {});
    await ensurePickupTables();
    let job = await storage.getPickupJobByBookingRequest(request.id);
    if (!job) {
      job = await assignPickupJob(request);
    }
    if (body.partnerId) {
      const partner = await storage.getPickupPartner(body.partnerId);
      if (!partner || partner.officeId !== context.office.id) {
        return res.status(400).json({ message: "Invalid pickup partner" });
      }
      if (request.branchId && partner.branchId && partner.branchId !== request.branchId) {
        return res.status(400).json({ message: "This pickup partner belongs to another store." });
      }
      const now = new Date();
      job = await storage.updatePickupJob(job.id, {
        partnerId: partner.id,
        status: "assigned",
        assignedAt: now,
      });
      await storage.updatePickupPartner(partner.id, { lastAssignedAt: now, availability: "busy" });
      triggerPickupPartnerNotification(
        partner.id,
        "New pickup assigned",
        `Hub assigned request #${request.requestNumber}.`,
        { jobId: job?.id || "", bookingRequestId: request.id, requestNumber: request.requestNumber },
      );
    } else {
      job = await reassignDeclinedJob(job.id);
    }
    res.json(job);
  });
}

export { assignPickupJob, publicQuoteUrl };
