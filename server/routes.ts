import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, supabaseAdmin } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db, verifyDatabaseConnection, databaseHost } from "./db";
import { isOpenAiConfigured, resolveOpenAiApiKey } from "./openai-config";
import { shipments, offices } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import OpenAI from "openai";
import express from "express";
import { searchIndianAddresses, reverseGeocodeLatLng } from "./geocode";
import { parseTariffSheetRows, parseTariffSheetBuffer, parsedRowsToInsert, buildImportPreview, rowsToCsv, resolvePartnerId } from "./pricing";
import { calculateCustomerPrice } from "@shared/tariff-pricing";
import { TARIFF_CSV_TEMPLATE } from "@shared/pricing";
import { shipmentPackageSchema } from "@shared/document-template";
import { mergePickupSettings, pickupSettingsSchema } from "@shared/pickup-settings";
import { buildPartnerSyncPayload, PARTNER_SYNC_STATUSES } from "@shared/partner-sync";
import { isDelhiveryPartner } from "@shared/delhivery";
import { createDelhiveryShipment, getDelhiveryConfigFromEnv } from "./integrations/delhivery";
import {
  applyWelcomeTemplateDefaults,
  finalizeWhatsAppSettingsMediaUrls,
  resolveAppBaseUrl,
  buildWhatsAppTemplateComponents,
  describeTemplateParameterRequirements,
  enrichTemplateForSend,
  getTemplateDefinition,
  mergeWhatsAppSettings,
  normalizeWhatsAppPhone,
  resolveMessagingHeaderMediaUrl,
  resolveAccessTokenForSave,
  sanitizeWhatsAppSettingsForClient,
  templateParamsFilled,
  templateNeedsHeaderMedia,
  bookingWhatsAppExtras,
  buildWhatsAppDeliveryHints,
  buildWhatsAppDeliveryChecklist,
  buildWhatsAppDeliveryPreflight,
  describeWhatsAppDeliveryStatus,
  buildCustomTextDeliveryHints,
  resolveTemplateSendParams,
  resolveTemplateLanguageForSend,
  sanitizeWhatsAppMediaFields,
  whatsAppSettingsSchema,
} from "@shared/whatsapp";
import { buildCustomerTracking, buildCustomerTrackingSummary } from "@shared/customer-tracking";
import {
  configFromSettings,
  fetchWhatsAppTemplates,
  formatMetaGraphError,
  resolveWhatsAppApiConfig,
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
  testWhatsAppConnection,
} from "./integrations/whatsapp";
import {
  triggerBookingRequestWhatsApp,
  triggerBookingSuccessWhatsApp,
} from "./integrations/whatsapp-notifications";
import { triggerCustomerNotification } from "./customer-notifications";
import {
  clearWelcomeCooldownForPhone,
  getRecentWhatsAppWebhookDebugEvents,
  getWhatsAppDeliveryStatus,
  verifyHeaderMediaReachable,
} from "./integrations/whatsapp-delivery";
import {
  handleWhatsAppWebhookGet,
  handleWhatsAppWebhookPost,
} from "./integrations/whatsapp-webhook";

const SUPER_ADMIN_EMAIL = (
  process.env.XGOO_SUPER_ADMIN_EMAIL || "xgoo.express@gmail.com"
).toLowerCase();

// Validation schemas
const officeCreateSchema = z.object({
  name: z.string().min(1, "Office name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  gstNumber: z.string().optional(),
  publicSlug: z.string().optional(),
  documentSettings: z.record(z.unknown()).optional(),
  whatsappSettings: z.record(z.unknown()).optional(),
  pickupSettings: pickupSettingsSchema.optional(),
});

const officeUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  gstNumber: z.string().optional(),
  publicSlug: z.string().optional(),
  documentSettings: z.record(z.unknown()).optional(),
  whatsappSettings: z.record(z.unknown()).optional(),
  pickupSettings: pickupSettingsSchema.optional(),
});

const branchCreateSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const branchUpdateSchema = branchCreateSchema.partial();

const serviceAreaCreateSchema = z.object({
  pincode: z.string().min(6, "Valid 6-digit pincode required").max(10),
  radiusKm: z.union([z.string(), z.number()]).optional(),
  label: z.string().optional(),
});

const serviceAreaUpdateSchema = serviceAreaCreateSchema.partial();

const customerCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: z.enum(["walk_in", "business"]).default("walk_in"),
  paymentType: z.enum(["prepaid", "credit"]).default("prepaid"),
  creditLimit: z.string().optional(),
});

function normalizePortalUrlInput(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const portalUrlSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => normalizePortalUrlInput(v ?? ""))
  .refine((v) => v === "" || z.string().url().safeParse(v).success, {
    message: "Enter a valid URL (e.g. https://one.delhivery.com/)",
  });

const partnerCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1).max(10),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  baseRateAir: z.string().optional(),
  baseRateSurface: z.string().optional(),
  ratePerKgAir: z.string().optional(),
  ratePerKgSurface: z.string().optional(),
  marginAmount: z.string().optional(),
  marginPercent: z.string().optional(),
  useTariffPricing: z.boolean().optional(),
  awbPrefix: z.string().optional(),
  awbRangeStart: z.string().optional(),
  awbRangeEnd: z.string().optional(),
  portalUrl: portalUrlSchema,
  isActive: z.boolean().default(true),
});

const shipmentCreateSchema = z.object({
  customerId: z.string().optional(),
  courierPartnerId: z.string().min(1, "Courier partner is required"),
  awbNumber: z.string().optional(),
  senderName: z.string().min(1, "Sender name is required"),
  senderPhone: z.string().min(10, "Valid phone required"),
  senderAddress: z.string().min(1, "Address required"),
  senderCity: z.string().optional(),
  senderState: z.string().optional(),
  senderPincode: z.string().optional(),
  receiverName: z.string().min(1, "Receiver name is required"),
  receiverPhone: z.string().min(10, "Valid phone required"),
  receiverAddress: z.string().min(1, "Address required"),
  receiverCity: z.string().optional(),
  receiverState: z.string().optional(),
  receiverPincode: z.string().optional(),
  weight: z.string().min(1, "Weight is required"),
  length: z.string().optional().nullable(),
  width: z.string().optional().nullable(),
  height: z.string().optional().nullable(),
  numberOfPieces: z.number().int().positive().default(1),
  contentDescription: z.string().optional(),
  declaredValue: z.string().optional().nullable(),
  packagePhotoUrls: z.array(z.string()).optional(),
  packages: z.array(shipmentPackageSchema).optional(),
  serviceType: z.enum(["air", "surface"]),
  paymentMode: z.enum(["cash", "upi", "bank_transfer", "credit"]),
  baseAmount: z.string().optional(),
  totalAmount: z.string().min(1),
  bookingRequestId: z.string().uuid().optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(["booked", "picked_up", "in_transit", "delivered"]),
});

const partnerSyncUpdateSchema = z.object({
  partnerSyncStatus: z.enum(PARTNER_SYNC_STATUSES).optional(),
  externalAwb: z.string().optional().nullable(),
  awbNumber: z.string().optional().nullable(),
  partnerSyncError: z.string().optional().nullable(),
  copyExternalToAwb: z.boolean().optional(),
});

const dateParamSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format");

const reportTypeSchema = z.enum(["date_wise", "customer_wise", "partner_wise"]);

const quotationCreateSchema = z.object({
  customerName: z.string().min(1, "Customer name required"),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  senderCity: z.string().optional(),
  senderState: z.string().optional(),
  senderPincode: z.string().optional(),
  receiverCity: z.string().optional(),
  receiverState: z.string().optional(),
  receiverPincode: z.string().optional(),
  weight: z.string().min(1, "Weight required"),
  numberOfPieces: z.number().int().positive().default(1),
  contentDescription: z.string().optional(),
  declaredValue: z.string().optional().nullable(),
  serviceType: z.enum(["air", "surface"]),
  courierPartnerId: z.string().optional().nullable(),
  baseAmount: z.string().default("0"),
  additionalCharges: z.string().optional(),
  gstAmount: z.string().optional(),
  totalAmount: z.string().min(1),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]).default("draft"),
  validUntil: z.string().optional().nullable(),
  notes: z.string().optional(),
});

function uploadExtensionForContentType(contentType: string): string {
  const ct = contentType.toLowerCase();
  if (ct.includes("jpeg") || ct.includes("jpg")) return ".jpg";
  if (ct.includes("png")) return ".png";
  if (ct.includes("webp")) return ".webp";
  if (ct.includes("gif")) return ".gif";
  return "";
}

function normalizeBookingRequestBody(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  const b = { ...(body as Record<string, unknown>) };

  for (const key of ["senderPhone", "receiverPhone"]) {
    if (typeof b[key] === "string") {
      b[key] = (b[key] as string).replace(/\D/g, "");
    }
  }

  if (
    b.courierPreference === null ||
    b.courierPreference === undefined ||
    b.courierPreference === "" ||
    b.courierPreference === "none"
  ) {
    delete b.courierPreference;
  }

  if (b.senderEmail === null || b.senderEmail === undefined) {
    b.senderEmail = "";
  }

  if (b.declaredValue === null || b.declaredValue === undefined || b.declaredValue === "") {
    delete b.declaredValue;
  } else {
    b.declaredValue = String(b.declaredValue);
  }

  if (b.weight === null || b.weight === undefined) {
    b.weight = "";
  } else {
    b.weight = String(b.weight).trim();
  }

  if (b.contentDescription === null || b.contentDescription === undefined) {
    b.contentDescription = "";
  } else {
    b.contentDescription = String(b.contentDescription).trim();
  }

  for (const key of [
    "senderCity",
    "senderState",
    "senderPincode",
    "receiverCity",
    "receiverState",
    "receiverPincode",
    "destinationCountry",
    "notes",
    "pickupLocationName",
  ]) {
    if (b[key] === null || b[key] === "") {
      delete b[key];
    }
  }

  if (b.shipmentType !== "international") {
    b.shipmentType = "domestic";
  }

  if (typeof b.numberOfPieces === "string") {
    const parsed = parseInt(b.numberOfPieces, 10);
    b.numberOfPieces = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } else if (b.numberOfPieces === null || b.numberOfPieces === undefined || b.numberOfPieces === "") {
    b.numberOfPieces = 0;
  }

  return b;
}

const bookingRequestCreateSchema = z.object({
  senderName: z.string().min(1, "Sender name required"),
  senderPhone: z.string().min(10, "Valid phone required").max(15),
  senderEmail: z.union([z.literal(""), z.string().email()]).optional(),
  senderAddress: z.string().min(1, "Address required"),
  senderCity: z.string().optional(),
  senderState: z.string().optional(),
  senderPincode: z.string().optional(),
  receiverName: z.string().min(1, "Receiver name required"),
  receiverPhone: z.string().min(10, "Valid phone required").max(15),
  receiverAddress: z.string().min(1, "Address required"),
  receiverCity: z.string().optional(),
  receiverState: z.string().optional(),
  receiverPincode: z.string().optional(),
  weight: z
    .string()
    .trim()
    .min(1, "Weight is required")
    .refine((v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) && n > 0;
    }, "Weight must be greater than 0"),
  numberOfPieces: z.number().int().positive("Number of pieces must be at least 1"),
  contentDescription: z.string().trim().min(1, "Package contents are required"),
  declaredValue: z.string().optional(),
  serviceType: z.enum(["air", "surface"]).default("surface"),
  courierPreference: z.string().optional(),
  shipmentType: z.enum(["domestic", "international"]).default("domestic"),
  destinationCountry: z.string().optional(),
  notes: z.string().optional(),
  packagePhotoUrls: z.array(z.string()).optional(),
  pickupLat: z.string().optional().nullable(),
  pickupLng: z.string().optional().nullable(),
  pickupLocationName: z.string().optional().nullable(),
  pickupDate: z.string().optional().nullable(),
  pickupTimeSlot: z.string().optional().nullable(),
});

function parseBookingRequestBody(body: unknown) {
  return bookingRequestCreateSchema.parse(normalizeBookingRequestBody(body));
}

function trackingFromBookingRequest(
  request: {
    status: string;
    createdAt: Date | null;
    reviewedAt?: Date | null;
    pickupLocationName?: string | null;
    senderCity?: string | null;
    senderState?: string | null;
    senderAddress?: string | null;
    receiverCity?: string | null;
    receiverState?: string | null;
    receiverAddress?: string | null;
  },
  shipment?: {
    status: string;
    bookedAt?: Date | null;
    pickedUpAt?: Date | null;
    deliveredAt?: Date | null;
    senderCity?: string | null;
    senderState?: string | null;
    senderAddress?: string | null;
    receiverCity?: string | null;
    receiverState?: string | null;
    receiverAddress?: string | null;
    bookingNumber?: string | null;
    awbNumber?: string | null;
  } | null,
) {
  return buildCustomerTracking(
    {
      status: request.status,
      createdAt: request.createdAt ?? new Date(),
      reviewedAt: request.reviewedAt,
      pickupLocationName: request.pickupLocationName,
      senderCity: request.senderCity,
      senderState: request.senderState,
      senderAddress: request.senderAddress,
      receiverCity: request.receiverCity,
      receiverState: request.receiverState,
      receiverAddress: request.receiverAddress,
    },
    shipment
      ? {
          status: shipment.status,
          bookedAt: shipment.bookedAt,
          pickedUpAt: shipment.pickedUpAt,
          deliveredAt: shipment.deliveredAt,
          senderCity: shipment.senderCity,
          senderState: shipment.senderState,
          senderAddress: shipment.senderAddress,
          receiverCity: shipment.receiverCity,
          receiverState: shipment.receiverState,
          receiverAddress: shipment.receiverAddress,
          bookingNumber: shipment.bookingNumber,
          awbNumber: shipment.awbNumber,
        }
      : null,
  );
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Multer for local storage
  // When running on Vercel, the filesystem is read-only except for /tmp.
  const uploadDir = process.env.VERCEL
    ? path.join("/tmp", "uploads")
    : path.join(process.cwd(), "uploads");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  const upload = multer({
    storage: fileStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  });

  const tariffUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  function isMultipartRequest(req: any): boolean {
    const ct = req.headers["content-type"] || "";
    return ct.includes("multipart/form-data");
  }

  function handleTariffUpload(req: any, res: Response, next: NextFunction) {
    tariffUpload.single("file")(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : "File upload failed";
        return res.status(400).json({ message });
      }
      next();
    });
  }

  function optionalTariffUpload(req: any, res: Response, next: NextFunction) {
    if (isMultipartRequest(req)) {
      return handleTariffUpload(req, res, next);
    }
    next();
  }

  const tariffJsonFileSchema = z.object({
    fileName: z.string().min(1),
    fileData: z.string().min(1),
  });

  function readTariffFileBuffer(req: any): { buffer: Buffer; fileName: string } | null {
    if (req.file?.buffer) {
      return {
        buffer: req.file.buffer,
        fileName: req.file.originalname || "upload.csv",
      };
    }
    const jsonResult = tariffJsonFileSchema.safeParse(req.body);
    if (jsonResult.success) {
      try {
        const buffer = Buffer.from(jsonResult.data.fileData, "base64");
        if (buffer.length === 0) return null;
        return { buffer, fileName: jsonResult.data.fileName };
      } catch {
        return null;
      }
    }
    return null;
  }

  async function ensurePartnersForImport(
    officeId: string,
    parsed: ReturnType<typeof parseTariffSheetBuffer>,
    partners: Awaited<ReturnType<typeof storage.getPartnersByOffice>>,
  ) {
    const list = [...partners];
    const createdCodes: string[] = [];
    const codes = Array.from(new Set(parsed.map((p) => p.partnerCode).filter(Boolean)));
    const displayNames: Record<string, string> = {
      UPS: "UPS",
      FEDEX: "FedEx",
      DEL: "Delhivery",
      BD: "Blue Dart",
      DTDC: "DTDC",
      ICL: "Indian Couriers",
    };

    for (const code of codes) {
      if (resolvePartnerId(code, list)) continue;
      const upper = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20) || code.toUpperCase().slice(0, 20);
      const created = await storage.createPartner({
        officeId,
        name: displayNames[upper] || upper,
        code: upper,
        isActive: true,
        useTariffPricing: true,
      });
      list.push(created);
      createdCodes.push(upper);
    }
    return { partners: list, createdCodes };
  }

  function parseUploadedTariffFile(file: Express.Multer.File, defaultPartnerCode?: string) {
    if (file.buffer) {
      return parseTariffSheetBuffer(file.buffer, file.originalname, defaultPartnerCode);
    }
    if (file.path) {
      return parseTariffSheetRows(file.path, defaultPartnerCode);
    }
    throw new Error("Uploaded file has no readable content");
  }

  function persistUploadedFile(file: Express.Multer.File): string {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + path.extname(file.originalname || ".csv");
    const dest = path.join(uploadDir, filename);
    if (file.buffer) {
      fs.writeFileSync(dest, file.buffer);
    } else if (file.path) {
      fs.copyFileSync(file.path, dest);
    } else {
      throw new Error("Uploaded file has no readable content");
    }
    return filename;
  }

  async function isCustomerAuthenticated(req: any, res: Response, next: NextFunction) {
    const token = req.headers["x-customer-token"] as string;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const session = await storage.getCustomerSessionByToken(token);
    if (!session) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }
    const customerUser = await storage.getCustomerUser(session.customerUserId);
    if (!customerUser) {
      return res.status(401).json({ message: "User not found" });
    }
    req.customerUser = customerUser;
    next();
  }

  async function isOfficeOrCustomerAuthenticated(req: any, res: Response, next: NextFunction) {
    const customerToken = req.headers["x-customer-token"] as string;
    if (customerToken) {
      return isCustomerAuthenticated(req, res, next);
    }
    return isAuthenticated(req, res, next);
  }

  // Local Storage Routes
  app.post("/api/uploads/request-url", isOfficeOrCustomerAuthenticated, (req, res) => {
    const id = randomUUID();
    res.json({
      uploadURL: `/api/uploads/direct/${id}`,
      objectPath: `/objects/${id}`,
    });
  });

  app.put(
    "/api/uploads/direct/:id",
    isOfficeOrCustomerAuthenticated,
    express.raw({ type: () => true, limit: "10mb" }),
    async (req, res) => {
      try {
        const { id } = req.params;
        if (!/^[0-9a-f-]{36}$/i.test(id)) {
          return res.status(400).json({ error: "Invalid upload id" });
        }
        const data = req.body;
        if (!Buffer.isBuffer(data) || data.length === 0) {
          return res.status(400).json({ error: "No file uploaded" });
        }
        const contentType = (req.headers["content-type"] as string) || "application/octet-stream";
        const ext = uploadExtensionForContentType(contentType);
        const filename = `${id}${ext}`;
        const filePath = path.join(uploadDir, filename);
        await fs.promises.writeFile(filePath, data);
        const objectPath = `/objects/${filename}`;
        res.json({ publicUrl: objectPath, objectPath });
      } catch (error) {
        console.error("Error saving upload:", error);
        res.status(500).json({ error: "Failed to save upload" });
      }
    },
  );

  storage.backfillPublicSlugs().catch((err) =>
    console.error("Failed to backfill public slugs:", err)
  );
  storage.backfillBranches().catch((err) =>
    console.error("Failed to backfill branches:", err)
  );

  async function getOrCreateOffice(userId: string, officeName?: string): Promise<string> {
    const office = await storage.getOfficeByUserId(userId);
    if (!office) {
      throw new Error(
        `No XGoo organization is assigned to this staff account${officeName ? ` (${officeName})` : ""}`,
      );
    }
    return office.id;
  }

  // Helper to verify resource belongs to user's office
  async function verifyOwnership(userId: string, resourceOfficeId: string): Promise<boolean> {
    const office = await storage.getOfficeByUserId(userId);
    return office?.id === resourceOfficeId;
  }

  async function resolveBranchIdForBooking(
    officeId: string,
    data: {
      senderPincode?: string | null;
      pickupLat?: string | number | null;
      pickupLng?: string | number | null;
    },
  ): Promise<string | undefined> {
    const branch = await storage.findBranchForPickup(officeId, {
      pincode: data.senderPincode,
      lat: data.pickupLat != null && data.pickupLat !== "" ? parseFloat(String(data.pickupLat)) : null,
      lng: data.pickupLng != null && data.pickupLng !== "" ? parseFloat(String(data.pickupLng)) : null,
    });
    return branch?.id;
  }

  const staffMemberInputSchema = z.object({
    email: z.string().email(),
    displayName: z.string().trim().min(1).max(255),
    role: z.enum(["staff", "branch_manager"]).default("staff"),
    branchId: z.string().uuid().nullable().optional(),
  });

  const staffMemberUpdateSchema = z.object({
    displayName: z.string().trim().min(1).max(255).optional(),
    role: z.enum(["staff", "branch_manager"]).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    branchId: z.string().uuid().nullable().optional(),
  });

  function isSuperAdmin(req: any): boolean {
    return req.staffRole === "super_admin";
  }

  function superAdminOnly(req: any, res: Response, next: NextFunction) {
    if (!isSuperAdmin(req)) {
      return res.status(403).json({ message: "Super Admin access is required" });
    }
    next();
  }

  async function requireSuperAdmin(req: any, res: Response) {
    if (!isSuperAdmin(req)) {
      res.status(403).json({ message: "Super Admin access is required" });
      return null;
    }
    const office = await storage.getOfficeByUserId(req.user.id);
    if (!office) {
      res.status(404).json({ message: "XGoo organization was not found" });
      return null;
    }
    return office;
  }

  // Office routes
  app.get("/api/office", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const office = await storage.getOfficeByUserId(userId);
      if (office) {
        try {
          await storage.ensureDefaultBranchForOffice(office);
        } catch (branchErr) {
          console.error("Error ensuring default branch:", branchErr);
        }
      }
      res.json(office || null);
    } catch (error) {
      console.error("Error fetching office:", error);
      res.status(500).json({ message: "Failed to fetch office" });
    }
  });

  app.post("/api/office", isAuthenticated, superAdminOnly, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const existing = await storage.getOfficeByUserId(userId);
      if (existing) {
        return res.status(400).json({ message: "Office already exists" });
      }
      const validated = officeCreateSchema.parse(req.body);
      const office = await storage.createOffice({ ...validated, userId });
      res.json(office);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating office:", error);
      res.status(500).json({ message: "Failed to create office" });
    }
  });

  app.patch("/api/office/:id", isAuthenticated, superAdminOnly, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Verify ownership
      const userOffice = await storage.getOfficeByUserId(userId);
      if (!userOffice || userOffice.id !== id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validated = officeUpdateSchema.parse(req.body);
      const office = await storage.updateOffice(id, validated);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }
      res.json(office);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating office:", error);
      res.status(500).json({ message: "Failed to update office" });
    }
  });

  app.get("/api/staff/me", isAuthenticated, async (req: any, res) => {
    const office = await storage.getOfficeByUserId(req.user.id);
    if (!office) return res.status(404).json({ message: "Organization not found" });
    const member = await storage.getOfficeMemberByUserId(req.user.id);
    res.json({
      officeId: office.id,
      role: isSuperAdmin(req) ? "super_admin" : member?.role || "staff",
      branchId: member?.branchId || null,
      isSuperAdmin: isSuperAdmin(req),
    });
  });

  app.get("/api/staff-members", isAuthenticated, async (req: any, res) => {
    try {
      const office = await requireSuperAdmin(req, res);
      if (!office) return;
      await storage.upsertOfficeMember({
        officeId: office.id,
        userId: req.user.id,
        email: SUPER_ADMIN_EMAIL,
        displayName:
          [req.user.user_metadata?.firstName, req.user.user_metadata?.lastName]
            .filter(Boolean)
            .join(" ") || "XGoo Super Admin",
        role: "super_admin",
        status: "active",
        branchId: null,
        invitedByUserId: req.user.id,
      });
      res.json(await storage.getOfficeMembersByOffice(office.id));
    } catch (error) {
      console.error("Error fetching staff members:", error);
      res.status(500).json({ message: "Failed to fetch staff members" });
    }
  });

  app.post("/api/staff-members", isAuthenticated, async (req: any, res) => {
    try {
      const office = await requireSuperAdmin(req, res);
      if (!office) return;
      const validated = staffMemberInputSchema.parse(req.body);
      if (validated.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL) {
        return res.status(400).json({ message: "The Super Admin is already a member" });
      }
      if (validated.branchId) {
        const branch = await storage.getBranch(validated.branchId);
        if (!branch || branch.officeId !== office.id) {
          return res.status(400).json({ message: "Invalid branch assignment" });
        }
      }

      const normalizedEmail = validated.email.trim().toLowerCase();
      const { data: usersPage, error: listError } =
        await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) throw listError;
      let authUser = usersPage.users.find(
        (user) => user.email?.trim().toLowerCase() === normalizedEmail,
      );
      let invitationSent = false;
      if (!authUser) {
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          normalizedEmail,
          { data: { displayName: validated.displayName } },
        );
        if (error) throw error;
        authUser = data.user;
        invitationSent = true;
      }
      if (!authUser) {
        return res.status(500).json({ message: "Failed to create staff identity" });
      }

      const member = await storage.upsertOfficeMember({
        officeId: office.id,
        userId: authUser.id,
        email: normalizedEmail,
        displayName: validated.displayName,
        role: validated.role,
        status: "active",
        branchId: validated.branchId || null,
        invitedByUserId: req.user.id,
      });
      res.status(201).json({ member, invitationSent });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      const message = error instanceof Error ? error.message : "Failed to add staff member";
      console.error("Error adding staff member:", error);
      res.status(500).json({ message });
    }
  });

  app.patch("/api/staff-members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const office = await requireSuperAdmin(req, res);
      if (!office) return;
      const existing = (await storage.getOfficeMembersByOffice(office.id)).find(
        (member) => member.id === req.params.id,
      );
      if (!existing) return res.status(404).json({ message: "Staff member not found" });
      if (existing.userId === office.userId || existing.role === "super_admin") {
        return res.status(400).json({ message: "The Super Admin cannot be modified" });
      }
      const validated = staffMemberUpdateSchema.parse(req.body);
      if (validated.branchId) {
        const branch = await storage.getBranch(validated.branchId);
        if (!branch || branch.officeId !== office.id) {
          return res.status(400).json({ message: "Invalid branch assignment" });
        }
      }
      const updated = await storage.updateOfficeMember(
        existing.id,
        office.id,
        validated,
      );
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating staff member:", error);
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  app.delete("/api/staff-members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const office = await requireSuperAdmin(req, res);
      if (!office) return;
      const existing = (await storage.getOfficeMembersByOffice(office.id)).find(
        (member) => member.id === req.params.id,
      );
      if (!existing) return res.status(404).json({ message: "Staff member not found" });
      if (existing.userId === office.userId || existing.role === "super_admin") {
        return res.status(400).json({ message: "The Super Admin cannot be removed" });
      }
      await storage.deleteOfficeMember(existing.id, office.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing staff member:", error);
      res.status(500).json({ message: "Failed to remove staff member" });
    }
  });

  // WhatsApp Business API settings
  app.get("/api/whatsapp/webhook", (req, res) => {
    void handleWhatsAppWebhookGet(req, res);
  });

  app.post("/api/whatsapp/webhook", (req, res) => {
    void handleWhatsAppWebhookPost(req, res);
  });

  app.get("/api/whatsapp/webhook/debug", isAuthenticated, (_req, res) => {
    res.json({ events: getRecentWhatsAppWebhookDebugEvents() });
  });

  app.post("/api/whatsapp/webhook/clear-welcome-cooldown", isAuthenticated, (req, res) => {
    const phone = String((req.body as { phone?: string })?.phone || "").trim();
    if (phone) clearWelcomeCooldownForPhone(phone);
    res.json({ ok: true });
  });

  app.get("/api/whatsapp/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const office = await storage.getOfficeByUserId(userId);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }

      const settings = mergeWhatsAppSettings(
        (office as { whatsappSettings?: unknown }).whatsappSettings,
      );
      res.json(sanitizeWhatsAppSettingsForClient(settings));
    } catch (error) {
      console.error("Error fetching WhatsApp settings:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp settings" });
    }
  });

  app.patch("/api/whatsapp/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const office = await storage.getOfficeByUserId(userId);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }

      const existing = mergeWhatsAppSettings(
        (office as { whatsappSettings?: unknown }).whatsappSettings,
      );
      const incoming = whatsAppSettingsSchema.partial().parse(req.body);

      const merged = mergeWhatsAppSettings({
        ...existing,
        ...incoming,
        accessToken: resolveAccessTokenForSave(incoming.accessToken, existing.accessToken),
        automation: {
          ...existing.automation,
          ...(incoming.automation || {}),
        },
        welcomeTemplateConfig: {
          ...existing.welcomeTemplateConfig,
          ...(incoming.welcomeTemplateConfig || {}),
        },
      });

      const requestOrigin =
        typeof req.get === "function"
          ? `${req.protocol}://${req.get("host")}`
          : undefined;
      let toSave = finalizeWhatsAppSettingsMediaUrls(
        mergeWhatsAppSettings({
          ...merged,
          ...sanitizeWhatsAppMediaFields(merged),
        }),
        requestOrigin,
      );
      try {
        const resolved = await resolveWhatsAppApiConfig(merged);
        if (resolved?.wabaId) {
          toSave = { ...merged, wabaId: resolved.wabaId };
        }
      } catch {
        // WABA auto-detect is best-effort on save; test/sync will retry.
      }

      const updated = await storage.updateOffice(office.id, {
        whatsappSettings: toSave,
      } as Parameters<typeof storage.updateOffice>[1]);

      if (!updated) {
        return res.status(404).json({ message: "Office not found" });
      }

      const saved = mergeWhatsAppSettings(
        (updated as { whatsappSettings?: unknown }).whatsappSettings,
      );
      res.json(sanitizeWhatsAppSettingsForClient(saved));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating WhatsApp settings:", error);
      res.status(500).json({ message: "Failed to update WhatsApp settings" });
    }
  });

  app.post("/api/whatsapp/templates/sync", isAuthenticated, async (req: any, res) => {
    const userId = req.user.id;
    let phoneNumberId: string | undefined;
    let wabaId: string | undefined;

    try {
      const office = await storage.getOfficeByUserId(userId);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }

      const saved = mergeWhatsAppSettings(
        (office as { whatsappSettings?: unknown }).whatsappSettings,
      );
      const body = z
        .object({
          phoneNumberId: z.string().optional(),
          wabaId: z.string().optional(),
          accessToken: z.string().optional(),
        })
        .parse(req.body || {});

      const settings = mergeWhatsAppSettings({
        ...saved,
        phoneNumberId: body.phoneNumberId?.trim() || saved.phoneNumberId,
        wabaId: body.wabaId?.trim() || saved.wabaId,
        accessToken: resolveAccessTokenForSave(body.accessToken, saved.accessToken),
      });
      phoneNumberId = settings.phoneNumberId;

      if (!configFromSettings(settings)) {
        return res.status(400).json({
          message: "Configure Phone Number ID and Access Token before syncing templates.",
          step: "validate_settings",
        });
      }

      console.info("[WhatsApp sync] Resolving WABA from phone number", {
        officeId: office.id,
        phoneNumberId: settings.phoneNumberId,
      });

      const config = await resolveWhatsAppApiConfig(settings);
      if (!config) {
        return res.status(400).json({
          message: "Configure Phone Number ID and Access Token before syncing templates.",
          step: "resolve_config",
        });
      }
      wabaId = config.wabaId;

      console.info("[WhatsApp sync] Fetching templates", {
        officeId: office.id,
        phoneNumberId: config.phoneNumberId,
        wabaId: config.wabaId,
      });

      const templates = await fetchWhatsAppTemplates(config);
      const updatedSettings = {
        ...settings,
        wabaId: config.wabaId,
        templates,
        lastSyncedAt: new Date().toISOString(),
      };

      await storage.updateOffice(office.id, {
        whatsappSettings: updatedSettings,
      } as Parameters<typeof storage.updateOffice>[1]);

      console.info("[WhatsApp sync] Success", {
        officeId: office.id,
        wabaId: config.wabaId,
        templateCount: templates.length,
      });

      res.json({
        templates,
        wabaId: config.wabaId,
        lastSyncedAt: updatedSettings.lastSyncedAt,
      });
    } catch (error) {
      const meta = formatMetaGraphError(error);
      console.error("[WhatsApp sync] Failed", {
        userId,
        phoneNumberId,
        wabaId,
        step: meta.requestPath?.includes("message_templates")
          ? "fetch_templates"
          : meta.requestPath?.includes("debug_token") || meta.requestPath?.includes("resolve_waba")
            ? "resolve_waba"
            : "unknown",
        message: meta.message,
        metaType: meta.type,
        metaCode: meta.code,
        metaSubcode: meta.error_subcode,
        fbtraceId: meta.fbtrace_id,
        httpStatus: meta.httpStatus,
        requestPath: meta.requestPath,
        raw: meta.raw,
      });
      res.status(500).json({
        message: meta.message,
        step: meta.requestPath?.includes("message_templates")
          ? "fetch_templates"
          : meta.requestPath?.includes("debug_token") || meta.requestPath?.includes("resolve_waba")
            ? "resolve_waba"
            : "sync",
        details: {
          type: meta.type,
          code: meta.code,
          error_subcode: meta.error_subcode,
          fbtrace_id: meta.fbtrace_id,
          httpStatus: meta.httpStatus,
          requestPath: meta.requestPath,
          phoneNumberId,
          wabaId,
        },
      });
    }
  });

  app.post("/api/whatsapp/connection/test", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const office = await storage.getOfficeByUserId(userId);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }

      const saved = mergeWhatsAppSettings(
        (office as { whatsappSettings?: unknown }).whatsappSettings,
      );
      const body = z
        .object({
          phoneNumberId: z.string().optional(),
          wabaId: z.string().optional(),
          accessToken: z.string().optional(),
        })
        .parse(req.body || {});

      const settings = mergeWhatsAppSettings({
        ...saved,
        phoneNumberId: body.phoneNumberId?.trim() || saved.phoneNumberId,
        wabaId: body.wabaId?.trim() || saved.wabaId,
        accessToken: resolveAccessTokenForSave(body.accessToken, saved.accessToken),
      });

      const baseConfig = configFromSettings(settings);
      if (!baseConfig) {
        return res.status(400).json({
          message: "Configure Phone Number ID and Access Token before testing.",
        });
      }

      const result = await testWhatsAppConnection(baseConfig, settings);

      if (result.wabaId) {
        await storage.updateOffice(office.id, {
          whatsappSettings: { ...settings, wabaId: result.wabaId },
        } as Parameters<typeof storage.updateOffice>[1]);
      }

      res.json(result);
    } catch (error) {
      const meta = formatMetaGraphError(error);
      console.error("[WhatsApp connection test] Failed", {
        userId: req.user.id,
        message: meta.message,
        metaType: meta.type,
        metaCode: meta.code,
        fbtraceId: meta.fbtrace_id,
        requestPath: meta.requestPath,
        raw: meta.raw,
      });
      res.status(500).json({
        message: meta.message,
        step: "connection_test",
        details: {
          type: meta.type,
          code: meta.code,
          error_subcode: meta.error_subcode,
          fbtrace_id: meta.fbtrace_id,
          requestPath: meta.requestPath,
        },
      });
    }
  });

  app.post("/api/whatsapp/messages/test", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const office = await storage.getOfficeByUserId(userId);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }

      const body = z
        .object({
          to: z.string().min(10, "Valid phone number required"),
          messageType: z.enum(["template", "text"]).default("template"),
          templateName: z.string().optional(),
          languageCode: z.string().default("en"),
          text: z.string().optional(),
          bodyParams: z.array(z.string()).optional(),
          headerParams: z.array(z.string()).optional(),
          buttonParams: z.array(z.string()).optional(),
          headerMediaUrl: z.string().optional(),
          defaultHeaderMediaUrl: z.string().optional(),
          defaultHeaderMediaPath: z.string().optional(),
          publicAppBaseUrl: z.string().optional(),
          welcomeTemplateConfig: whatsAppSettingsSchema.shape.welcomeTemplateConfig.optional(),
          phoneNumberId: z.string().optional(),
          wabaId: z.string().optional(),
          accessToken: z.string().optional(),
          apiVersion: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          if (data.messageType === "template" && !data.templateName?.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Template name is required for template messages",
              path: ["templateName"],
            });
          }
          if (data.messageType === "text" && !data.text?.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Message text is required for custom text messages",
              path: ["text"],
            });
          }
        })
        .parse(req.body);

      const saved = mergeWhatsAppSettings(
        (office as { whatsappSettings?: unknown }).whatsappSettings,
      );
      const requestOrigin =
        typeof req.get === "function"
          ? `${req.protocol}://${req.get("host")}`
          : undefined;
      const settings = finalizeWhatsAppSettingsMediaUrls(
        mergeWhatsAppSettings({
          ...saved,
          phoneNumberId: body.phoneNumberId?.trim() || saved.phoneNumberId,
          wabaId: body.wabaId?.trim() || saved.wabaId,
          accessToken: resolveAccessTokenForSave(body.accessToken, saved.accessToken),
          apiVersion: body.apiVersion?.trim() || saved.apiVersion,
          defaultHeaderMediaUrl:
            body.defaultHeaderMediaUrl?.trim() || saved.defaultHeaderMediaUrl,
          defaultHeaderMediaPath:
            body.defaultHeaderMediaPath?.trim() || saved.defaultHeaderMediaPath,
          publicAppBaseUrl: body.publicAppBaseUrl?.trim() || saved.publicAppBaseUrl,
          welcomeTemplateConfig: body.welcomeTemplateConfig
            ? { ...saved.welcomeTemplateConfig, ...body.welcomeTemplateConfig }
            : saved.welcomeTemplateConfig,
        }),
        requestOrigin,
      );
      const config = configFromSettings(settings);
      if (!config) {
        return res.status(400).json({ message: "WhatsApp is not fully configured." });
      }

      const templateMeta =
        body.messageType === "template"
          ? enrichTemplateForSend(
              getTemplateDefinition(
                settings.templates,
                body.templateName!.trim(),
                body.languageCode,
              ),
              body.templateName!.trim(),
              settings,
            )
          : undefined;

      const headerMediaUrl = resolveMessagingHeaderMediaUrl(
        settings,
        templateMeta,
        body.templateName?.trim() || "",
        body.headerMediaUrl,
        resolveAppBaseUrl(settings, requestOrigin),
      );

      const welcomeDefaults =
        body.messageType === "template" && body.templateName?.trim()
          ? applyWelcomeTemplateDefaults(settings, body.templateName.trim(), {
              bodyParams: body.bodyParams,
              buttonParams: body.buttonParams,
            })
          : undefined;

      const resolvedParams =
        body.messageType === "template" && templateMeta
          ? resolveTemplateSendParams(templateMeta, {
              bodyParams: welcomeDefaults?.bodyParams ?? body.bodyParams,
              headerParams: body.headerParams,
              buttonParams: welcomeDefaults?.buttonParams ?? body.buttonParams,
              headerMediaUrl: body.headerMediaUrl || headerMediaUrl,
              defaultHeaderMediaUrl: settings.defaultHeaderMediaUrl,
            })
          : undefined;

      const effectiveHeaderMediaUrl =
        resolvedParams?.headerMediaUrl ||
        headerMediaUrl ||
        resolveMessagingHeaderMediaUrl(
          settings,
          templateMeta,
          body.templateName?.trim() || "",
          undefined,
          resolveAppBaseUrl(settings, requestOrigin),
        );

      if (body.messageType === "template") {
        const expectedCounts = {
          bodyParamCount: templateMeta?.bodyParamCount ?? body.bodyParams?.length ?? 0,
          headerParamCount: templateNeedsHeaderMedia(templateMeta)
            ? 0
            : templateMeta?.headerParamCount ?? body.headerParams?.length ?? 0,
          buttonParamCount: templateMeta?.buttonParamCount ?? body.buttonParams?.length ?? 0,
          headerMediaRequired: templateNeedsHeaderMedia(templateMeta),
          headerFormat: templateMeta?.headerFormat,
          templateName: body.templateName?.trim(),
        };
        const paramValues = {
          bodyParams: resolvedParams?.bodyParams || body.bodyParams || [],
          headerParams: resolvedParams?.headerParams || body.headerParams || [],
          buttonParams: resolvedParams?.buttonParams || body.buttonParams || [],
          headerMediaUrl: effectiveHeaderMediaUrl,
        };
        if (!templateParamsFilled(expectedCounts, paramValues)) {
          const parts: string[] = [];
          if (expectedCounts.headerMediaRequired) {
            parts.push(
              `1 ${(templateMeta?.headerFormat || "image").toLowerCase()} header URL (public HTTPS link)`,
            );
          } else if (expectedCounts.headerParamCount > 0) {
            parts.push(`${expectedCounts.headerParamCount} header`);
          }
          if (expectedCounts.bodyParamCount > 0) {
            parts.push(`${expectedCounts.bodyParamCount} body`);
          }
          if (expectedCounts.buttonParamCount > 0) {
            parts.push(`${expectedCounts.buttonParamCount} button`);
          }
          const hint = templateMeta
            ? ` (${describeTemplateParameterRequirements(templateMeta)})`
            : "";
          return res.status(400).json({
            message: `Template requires ${parts.join(", ")} parameter(s). Fill all parameter fields before sending.${hint}`,
          });
        }
      }

      const toPhone = normalizeWhatsAppPhone(body.to);
      let fromDisplayNumber: string | undefined;
      try {
        const connection = await testWhatsAppConnection(config);
        fromDisplayNumber = connection.displayPhoneNumber;
      } catch {
        // optional context for delivery hints
      }

      let headerMediaReachable: boolean | undefined;
      let headerMediaError: string | undefined;
      if (
        body.messageType === "template" &&
        effectiveHeaderMediaUrl &&
        templateNeedsHeaderMedia(templateMeta)
      ) {
        const mediaCheck = await verifyHeaderMediaReachable(effectiveHeaderMediaUrl);
        headerMediaReachable = mediaCheck.ok;
        headerMediaError = mediaCheck.error;
        if (!mediaCheck.ok) {
          return res.status(400).json({
            message:
              mediaCheck.error ||
              "Header image URL is not reachable by Meta. Fix the image URL before sending.",
            deliveryPreflight: buildWhatsAppDeliveryPreflight({
              toPhone,
              headerMediaUrl: effectiveHeaderMediaUrl,
              bodyParams: resolvedParams?.bodyParams || body.bodyParams,
              bodyParamCount: templateMeta?.bodyParamCount,
              templateMeta,
              fromDisplayNumber,
              headerMediaReachable: false,
              headerMediaError: mediaCheck.error,
            }),
          });
        }
      }

      const deliveryPreflight =
        body.messageType === "template"
          ? buildWhatsAppDeliveryPreflight({
              toPhone,
              headerMediaUrl: effectiveHeaderMediaUrl,
              bodyParams: resolvedParams?.bodyParams || body.bodyParams,
              bodyParamCount: templateMeta?.bodyParamCount,
              templateMeta,
              fromDisplayNumber,
              headerMediaReachable,
              headerMediaError,
            })
          : undefined;

      const components =
        body.messageType === "template"
          ? buildWhatsAppTemplateComponents({
              template: templateMeta,
              bodyParams: resolvedParams?.bodyParams || body.bodyParams,
              headerParams: resolvedParams?.headerParams || body.headerParams,
              buttonParams: resolvedParams?.buttonParams || body.buttonParams,
              headerMediaUrl: effectiveHeaderMediaUrl,
            })
          : undefined;

      const languageCode =
        templateMeta?.language ||
        resolveTemplateLanguageForSend(
          settings.templates,
          body.templateName!.trim(),
          body.languageCode,
        );

      const result =
        body.messageType === "text"
          ? await sendWhatsAppTextMessage(config, {
              to: toPhone,
              text: body.text!.trim(),
            })
          : await sendWhatsAppTemplateMessage(config, {
              to: toPhone,
              templateName: body.templateName!.trim(),
              languageCode,
              components,
            });

      const raw = result.raw as {
        messages?: Array<{ message_status?: string }>;
      };
      const messageStatus = raw.messages?.[0]?.message_status;
      const messageId = result.messageId;
      const webhookStatus = messageId ? getWhatsAppDeliveryStatus(messageId) : undefined;

      res.json({
        ...result,
        messageStatus,
        phoneNumberId: config.phoneNumberId,
        fromDisplayNumber,
        autoFilledParams: resolvedParams,
        deliveryPreflight,
        webhookDeliveryStatus: webhookStatus,
        deliveryHints:
          body.messageType === "text"
            ? buildCustomTextDeliveryHints(fromDisplayNumber)
            : buildWhatsAppDeliveryHints({
                templateMeta,
                fromDisplayNumber,
                messageStatus,
                toPhone,
              }),
        deliveryChecklist:
          body.messageType === "template"
            ? buildWhatsAppDeliveryChecklist({
                templateMeta,
                fromDisplayNumber,
                toPhone,
                messageStatus,
              })
            : undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      const meta = formatMetaGraphError(error);
      console.error("[WhatsApp test send] Failed", {
        message: meta.message,
        metaCode: meta.code,
        fbtraceId: meta.fbtrace_id,
        raw: meta.raw,
      });
      res.status(500).json({
        message: meta.message,
        details: {
          code: meta.code,
          fbtrace_id: meta.fbtrace_id,
        },
      });
    }
  });

  app.get("/api/whatsapp/messages/:messageId/delivery-status", isAuthenticated, (req, res) => {
    const messageId = String(req.params.messageId || "").trim();
    if (!messageId) {
      return res.status(400).json({ message: "Message ID required" });
    }
    const status = getWhatsAppDeliveryStatus(messageId);
    if (!status) {
      return res.json({
        messageId,
        status: null,
        detail:
          "No webhook update yet. Configure Meta webhooks to your public URL to see delivered/failed status here. Until then, use WhatsApp Manager → Insights.",
      });
    }
    res.json({
      ...status,
      detail: describeWhatsAppDeliveryStatus(
        status.status,
        status.errorMessage || status.errorTitle,
      ),
    });
  });

  // Branch routes
  app.get("/api/branches", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const branchList = await storage.getBranchesByOffice(officeId);
      res.json(branchList);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ message: "Failed to fetch branches" });
    }
  });

  app.post("/api/branches", isAuthenticated, superAdminOnly, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const validated = branchCreateSchema.parse(req.body);
      const branch = await storage.createBranch({ ...validated, officeId });
      res.json(branch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating branch:", error);
      res.status(500).json({ message: "Failed to create branch" });
    }
  });

  app.patch("/api/branches/:id", isAuthenticated, superAdminOnly, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const { id } = req.params;
      const existing = await storage.getBranch(id);
      if (!existing || existing.officeId !== officeId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const validated = branchUpdateSchema.parse(req.body);
      const branch = await storage.updateBranch(id, validated);
      res.json(branch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating branch:", error);
      res.status(500).json({ message: "Failed to update branch" });
    }
  });

  app.delete("/api/branches/:id", isAuthenticated, superAdminOnly, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const { id } = req.params;
      const existing = await storage.getBranch(id);
      if (!existing || existing.officeId !== officeId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const deleted = await storage.deleteBranch(id);
      if (!deleted) {
        return res.status(400).json({ message: "Cannot delete the only branch" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting branch:", error);
      res.status(500).json({ message: "Failed to delete branch" });
    }
  });

  app.post("/api/branches/:id/service-areas", isAuthenticated, superAdminOnly, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const { id } = req.params;
      const branch = await storage.getBranch(id);
      if (!branch || branch.officeId !== officeId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const validated = serviceAreaCreateSchema.parse(req.body);
      const area = await storage.createBranchServiceArea({
        branchId: id,
        pincode: validated.pincode,
        radiusKm: validated.radiusKm != null ? String(validated.radiusKm) : "0",
        label: validated.label,
      });
      res.json(area);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating service area:", error);
      res.status(500).json({ message: "Failed to add service pincode" });
    }
  });

  app.patch("/api/branches/:branchId/service-areas/:areaId", isAuthenticated, superAdminOnly, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const { branchId, areaId } = req.params;
      const branch = await storage.getBranch(branchId);
      if (!branch || branch.officeId !== officeId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const validated = serviceAreaUpdateSchema.parse(req.body);
      const patch: Record<string, unknown> = { ...validated };
      if (validated.radiusKm != null) patch.radiusKm = String(validated.radiusKm);
      const area = await storage.updateBranchServiceArea(areaId, patch);
      if (!area) return res.status(404).json({ message: "Service area not found" });
      res.json(area);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating service area:", error);
      res.status(500).json({ message: "Failed to update service pincode" });
    }
  });

  app.delete("/api/branches/:branchId/service-areas/:areaId", isAuthenticated, superAdminOnly, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const { branchId, areaId } = req.params;
      const branch = await storage.getBranch(branchId);
      if (!branch || branch.officeId !== officeId) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteBranchServiceArea(areaId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service area:", error);
      res.status(500).json({ message: "Failed to delete service pincode" });
    }
  });

  // Geocoding for address autofill + maps
  app.get("/api/geocode/search", isAuthenticated, async (req: any, res) => {
    try {
      const q = String(req.query.q || "").trim();
      if (q.length < 3) {
        return res.json([]);
      }
      const results = await searchIndianAddresses(q, 6);
      res.json(results);
    } catch (error) {
      console.error("Geocode search error:", error);
      res.status(500).json({ message: "Address search failed" });
    }
  });

  app.get("/api/geocode/reverse", isAuthenticated, async (req: any, res) => {
    try {
      const lat = parseFloat(String(req.query.lat));
      const lng = parseFloat(String(req.query.lng));
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }
      const result = await reverseGeocodeLatLng(lat, lng);
      if (!result) {
        return res.status(404).json({ message: "Could not resolve address" });
      }
      res.json(result);
    } catch (error) {
      console.error("Reverse geocode error:", error);
      res.status(500).json({ message: "Reverse geocode failed" });
    }
  });

  // Demo / sample data
  app.get("/api/demo-data/status", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      const status = await storage.getDemoDataStatus(officeId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching demo data status:", error);
      res.status(500).json({ message: "Failed to fetch demo data status" });
    }
  });

  app.post("/api/demo-data/seed", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      await storage.seedData(officeId);
      const status = await storage.getDemoDataStatus(officeId);
      res.json({ success: true, ...status });
    } catch (error) {
      console.error("Error seeding demo data:", error);
      const message =
        error instanceof Error ? error.message : "Failed to load sample data";
      res.status(500).json({ message });
    }
  });

  app.delete("/api/demo-data", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      await storage.clearDemoData(officeId);
      res.json({ success: true, hasDemoData: false });
    } catch (error) {
      console.error("Error clearing demo data:", error);
      res.status(500).json({ message: "Failed to remove sample data" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const stats = await storage.getDashboardStats(officeId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Customer routes
  app.get("/api/customers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const customers = await storage.getCustomersByOffice(officeId);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const validated = customerCreateSchema.parse(req.body);
      const customer = await storage.createCustomer({ ...validated, officeId });
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);

      // Verify ownership
      const existing = await storage.getCustomer(id);
      if (!existing || existing.officeId !== officeId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validated = customerCreateSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, validated);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);

      // Verify ownership
      const existing = await storage.getCustomer(id);
      if (!existing || existing.officeId !== officeId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteCustomer(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Courier Partner routes
  app.get("/api/partners", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const partners = await storage.getPartnersByOffice(officeId);
      res.json(partners);
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  app.post("/api/partners", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const validated = partnerCreateSchema.parse(req.body);
      const partner = await storage.createPartner({
        ...validated,
        officeId,
        portalUrl: validated.portalUrl || null,
      });
      res.json(partner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error && typeof error === "object" && "code" in error && (error as any).code === "23505") {
        return res.status(409).json({
          message: "A partner with the same unique value already exists (likely code or email).",
        });
      }
      console.error("Error creating partner:", error);
      res.status(500).json({ message: "Failed to create partner" });
    }
  });

  app.patch("/api/partners/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);

      // Verify ownership
      const existing = await storage.getPartner(id);
      if (!existing || existing.officeId !== officeId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validated = partnerCreateSchema.partial().parse(req.body);
      const partner = await storage.updatePartner(id, {
        ...validated,
        ...(validated.portalUrl !== undefined
          ? { portalUrl: validated.portalUrl || null }
          : {}),
      });
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      res.json(partner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error && typeof error === "object" && "code" in error && (error as any).code === "23505") {
        return res.status(409).json({
          message: "Update conflicts with an existing partner (duplicate code/email).",
        });
      }
      console.error("Error updating partner:", error);
      res.status(500).json({ message: "Failed to update partner" });
    }
  });

  app.delete("/api/partners/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);

      // Verify ownership
      const existing = await storage.getPartner(id);
      if (!existing || existing.officeId !== officeId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deletePartner(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting partner:", error);
      res.status(500).json({ message: "Failed to delete partner" });
    }
  });

  const tariffUploadSchema = z.object({
    label: z.string().min(1, "Tariff cycle name is required"),
    courierPartnerId: z.string().optional(),
    validFrom: z.string().optional(),
    validTo: z.string().optional(),
    activate: z.enum(["true", "false"]).optional(),
    compareVersionId: z.string().optional(),
  });

  function readTariffUploadMeta(req: any) {
    const raw = { ...(req.query ?? {}), ...(req.body ?? {}) };
    return {
      label: typeof raw.label === "string" ? raw.label : String(raw.label ?? ""),
      courierPartnerId: raw.courierPartnerId || undefined,
      validFrom: raw.validFrom || undefined,
      validTo: raw.validTo || undefined,
      activate: raw.activate || undefined,
      compareVersionId: raw.compareVersionId || undefined,
    };
  }

  const pricingQuoteSchema = z.object({
    courierPartnerId: z.string().optional(),
    serviceType: z.enum(["air", "surface"]),
    shipmentType: z.string().optional(),
    packageType: z.enum(["document", "package"]).optional(),
    originCountry: z.string().optional(),
    destinationCountry: z.string().optional(),
    senderPincode: z.string().optional(),
    receiverPincode: z.string().optional(),
    weight: z.union([z.string(), z.number()]),
    length: z.union([z.string(), z.number()]).optional().nullable(),
    width: z.union([z.string(), z.number()]).optional().nullable(),
    height: z.union([z.string(), z.number()]).optional().nullable(),
    insurance: z.boolean().optional(),
    declaredValue: z.union([z.string(), z.number()]).optional().nullable(),
    weightRoundOff: z.union([z.boolean(), z.enum(["off", "ceil_kg"])]).optional(),
  });

  // Tariff & pricing routes
  app.get("/api/tariffs/template", isAuthenticated, (_req, res) => {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="xgoo-tariff-template.csv"');
    res.send(TARIFF_CSV_TEMPLATE);
  });

  app.get("/api/tariffs", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      const versions = await storage.getTariffVersionsByOffice(officeId);
      res.json(versions);
    } catch (error) {
      console.error("Error fetching tariffs:", error);
      res.status(500).json({ message: "Failed to fetch tariffs" });
    }
  });

  app.post("/api/tariffs", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      const label = String(req.body?.label || "").trim();
      if (!label) {
        return res.status(400).json({ message: "Sheet name is required" });
      }
      const validFrom = req.body?.validFrom
        ? new Date(req.body.validFrom)
        : new Date();
      const validTo = req.body?.validTo
        ? new Date(req.body.validTo)
        : new Date(validFrom.getTime() + 15 * 24 * 60 * 60 * 1000);
      const version = await storage.createTariffVersion({
        officeId,
        courierPartnerId: req.body?.courierPartnerId || null,
        label,
        fileName: null,
        fileUrl: null,
        validFrom,
        validTo,
        status: "draft",
        rowCount: 0,
        uploadedBy: req.user.id,
      });
      res.status(201).json(version);
    } catch (error) {
      console.error("Error creating tariff sheet:", error);
      res.status(500).json({ message: "Failed to create tariff sheet" });
    }
  });

  app.patch("/api/tariffs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      const version = await storage.getTariffVersion(req.params.id);
      if (!version || version.officeId !== officeId) {
        return res.status(404).json({ message: "Tariff sheet not found" });
      }
      const patch: Record<string, unknown> = {};
      if (typeof req.body?.label === "string") {
        const label = req.body.label.trim();
        if (!label) {
          return res.status(400).json({ message: "Sheet name cannot be empty" });
        }
        patch.label = label;
      }
      if (req.body?.columnConfig != null) {
        patch.columnConfig = req.body.columnConfig;
      }
      if (typeof req.body?.status === "string") {
        patch.status = req.body.status;
      }
      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }
      const updated = await storage.updateTariffVersion(version.id, patch as any);
      res.json(updated);
    } catch (error) {
      console.error("Error updating tariff sheet:", error);
      res.status(500).json({ message: "Failed to update tariff sheet" });
    }
  });

  app.get("/api/tariffs/:id/rows", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      const version = await storage.getTariffVersion(req.params.id);
      if (!version || version.officeId !== officeId) {
        return res.status(404).json({ message: "Tariff not found" });
      }
      const enriched = req.query.enriched === "true";
      const rows = enriched
        ? await storage.getTariffRateRowsEnriched(version.id)
        : await storage.getTariffRateRowsByVersion(version.id);
      res.json(rows);
    } catch (error) {
      console.error("Error fetching tariff rows:", error);
      res.status(500).json({ message: "Failed to fetch tariff rows" });
    }
  });

  app.get("/api/tariffs/:id/export", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      const version = await storage.getTariffVersion(req.params.id);
      if (!version || version.officeId !== officeId) {
        return res.status(404).json({ message: "Tariff not found" });
      }
      const rows = await storage.getTariffRateRowsEnriched(version.id);
      const csv = rowsToCsv(rows);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${version.label.replace(/[^a-z0-9]/gi, "-")}-tariff.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Error exporting tariff:", error);
      res.status(500).json({ message: "Failed to export tariff" });
    }
  });

  app.patch("/api/tariffs/rows/:rowId", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      const row = await storage.getTariffRateRow(req.params.rowId);
      if (!row || row.officeId !== officeId) {
        return res.status(404).json({ message: "Row not found" });
      }
      const body = req.body || {};
      const customerPrice = calculateCustomerPrice({
        tariffAmount: body.tariffAmount ?? row.tariffAmount,
        fixedMargin: body.fixedMargin ?? row.fixedMargin,
        percentageMargin: body.percentageMargin ?? row.percentageMargin,
        affiliateMargin: body.affiliateMargin ?? row.affiliateMargin,
        offerDiscount: body.offerDiscount ?? row.offerDiscount,
        fuelCharge: body.fuelCharge ?? row.fuelCharge,
        handlingCharge: body.handlingCharge ?? row.handlingCharge,
        insuranceCharge: body.insuranceCharge ?? row.insuranceCharge,
        remoteAreaCharge: body.remoteAreaCharge ?? row.remoteAreaCharge,
        gst: body.gst ?? row.gst,
      });
      const updated = await storage.updateTariffRateRow(row.id, {
        ...body,
        customerPrice: String(customerPrice),
        updatedBy: req.user.id,
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating tariff row:", error);
      res.status(500).json({ message: "Failed to update row" });
    }
  });

  app.post("/api/tariffs/:id/rows/bulk", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      const version = await storage.getTariffVersion(req.params.id);
      if (!version || version.officeId !== officeId) {
        return res.status(404).json({ message: "Tariff not found" });
      }
      const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
      const result = await storage.bulkSaveTariffRows(version.id, officeId, rows, req.user.id);
      res.json(result);
    } catch (error) {
      console.error("Error bulk saving rows:", error);
      res.status(500).json({ message: "Failed to save rows" });
    }
  });

  app.post("/api/tariffs/:id/rows/delete", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      const version = await storage.getTariffVersion(req.params.id);
      if (!version || version.officeId !== officeId) {
        return res.status(404).json({ message: "Tariff not found" });
      }
      const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
      const deleted = await storage.deleteTariffRateRows(ids);
      const count = (await storage.getTariffRateRowsByVersion(version.id)).length;
      await storage.updateTariffVersion(version.id, { rowCount: count });
      res.json({ deleted });
    } catch (error) {
      console.error("Error deleting rows:", error);
      res.status(500).json({ message: "Failed to delete rows" });
    }
  });

  app.post("/api/tariffs/preview", isAuthenticated, optionalTariffUpload, async (req: any, res) => {
    try {
      const fileInfo = readTariffFileBuffer(req);
      if (!fileInfo) {
        return res.status(400).json({
          message: "No file uploaded. Send a spreadsheet file or JSON with fileName and fileData (base64).",
        });
      }

      const body = readTariffUploadMeta(req);
      const metaResult = tariffUploadSchema.safeParse(body);
      if (!metaResult.success) {
        const first = metaResult.error.errors[0];
        return res.status(400).json({
          message: first?.message || "Invalid upload metadata",
          errors: metaResult.error.errors,
          hint: !body.label?.trim()
            ? "Tariff cycle name was not received. Refresh the page and try again."
            : undefined,
        });
      }
      const meta = metaResult.data;

      const officeId = await getOrCreateOffice(req.user.id);
      let partners = await storage.getPartnersByOffice(officeId);
      const defaultPartner = meta.courierPartnerId
        ? partners.find((p) => p.id === meta.courierPartnerId)
        : undefined;

      let parsed;
      try {
        parsed = parseTariffSheetBuffer(fileInfo.buffer, fileInfo.fileName, defaultPartner?.code);
      } catch (parseErr) {
        const detail = parseErr instanceof Error ? parseErr.message : "Could not read spreadsheet";
        return res.status(400).json({
          message: `Could not read file: ${detail}`,
        });
      }

      if (parsed.length === 0) {
        return res.status(400).json({
          message:
            "No valid rows found. Ensure columns include partner_code (or set default partner), service_type, weight range, and tariff_amount / partner_rate.",
        });
      }

      const ensured = await ensurePartnersForImport(officeId, parsed, partners);
      partners = ensured.partners;

      let existingRows: Awaited<ReturnType<typeof storage.getTariffRateRowsByVersion>> = [];
      if (meta.compareVersionId) {
        const v = await storage.getTariffVersion(meta.compareVersionId);
        if (v && v.officeId === officeId) {
          existingRows = await storage.getTariffRateRowsByVersion(meta.compareVersionId);
        }
      }

      const { rows, errors } = parsedRowsToInsert(
        parsed,
        partners,
        "preview",
        officeId,
        meta.courierPartnerId,
      );
      if (rows.length === 0) {
        return res.status(400).json({
          message: "No rows could be imported. Partner codes in the file must match your Courier Partners.",
          parseErrors: errors.slice(0, 50),
          partnerCodes: partners.map((p) => p.code),
        });
      }

      const preview = buildImportPreview(rows, existingRows);
      res.json({
        preview: preview.rows.slice(0, 500).map(({ data: _data, ...rest }) => rest),
        summary: preview.summary,
        totalRows: rows.length,
        parseErrors: errors,
        parsedRows: rows.slice(0, 100),
        createdPartners: ensured.createdCodes,
      });
    } catch (error) {
      console.error("Error previewing tariff:", error);
      const detail = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        message: `Failed to preview import: ${detail}`,
        detail,
      });
    }
  });

  app.post("/api/tariffs/compare", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      const { versionAId, versionBId } = req.body || {};
      if (!versionAId || !versionBId) {
        return res.status(400).json({ message: "versionAId and versionBId required" });
      }
      const [a, b] = await Promise.all([
        storage.getTariffVersion(versionAId),
        storage.getTariffVersion(versionBId),
      ]);
      if (!a || !b || a.officeId !== officeId || b.officeId !== officeId) {
        return res.status(404).json({ message: "Version not found" });
      }
      const comparison = await storage.compareTariffVersions(versionAId, versionBId);
      res.json({ comparison, versionA: a, versionB: b });
    } catch (error) {
      console.error("Error comparing versions:", error);
      res.status(500).json({ message: "Failed to compare versions" });
    }
  });

  app.post("/api/tariffs/:id/archive", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      const archived = await storage.archiveTariffVersion(req.params.id, officeId);
      if (!archived) {
        return res.status(404).json({ message: "Tariff not found" });
      }
      res.json(archived);
    } catch (error) {
      console.error("Error archiving tariff:", error);
      res.status(500).json({ message: "Failed to archive tariff" });
    }
  });

  app.post("/api/tariffs/:id/restore", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      const version = await storage.getTariffVersion(req.params.id);
      if (!version || version.officeId !== officeId) {
        return res.status(404).json({ message: "Tariff not found" });
      }
      const restored = await storage.updateTariffVersion(version.id, { status: "draft" });
      res.json(restored);
    } catch (error) {
      console.error("Error restoring tariff:", error);
      res.status(500).json({ message: "Failed to restore tariff" });
    }
  });

  app.post("/api/tariffs/upload", isAuthenticated, optionalTariffUpload, async (req: any, res) => {
    try {
      const fileInfo = readTariffFileBuffer(req);
      if (!fileInfo) {
        return res.status(400).json({
          message: "No file uploaded. Send a spreadsheet file or JSON with fileName and fileData (base64).",
        });
      }

      const officeId = await getOrCreateOffice(req.user.id);
      const metaResult = tariffUploadSchema.safeParse(readTariffUploadMeta(req));
      if (!metaResult.success) {
        const first = metaResult.error.errors[0];
        return res.status(400).json({
          message: first?.message || "Invalid upload metadata",
          errors: metaResult.error.errors,
        });
      }
      const meta = metaResult.data;
      let partners = await storage.getPartnersByOffice(officeId);
      const defaultPartner = meta.courierPartnerId
        ? partners.find((p) => p.id === meta.courierPartnerId)
        : undefined;

      const parsed = parseTariffSheetBuffer(fileInfo.buffer, fileInfo.fileName, defaultPartner?.code);

      if (parsed.length === 0) {
        return res.status(400).json({
          message: "No valid tariff rows found. Use the CSV template with partner_code, service_type, weight range, and tariff_amount columns.",
        });
      }

      const ensured = await ensurePartnersForImport(officeId, parsed, partners);
      partners = ensured.partners;

      const validFrom = meta.validFrom ? new Date(meta.validFrom) : new Date();
      const validTo = meta.validTo ? new Date(meta.validTo) : new Date(validFrom.getTime() + 15 * 24 * 60 * 60 * 1000);
      const storedFilename = persistUploadedFile({
        buffer: fileInfo.buffer,
        originalname: fileInfo.fileName,
      } as Express.Multer.File);

      const version = await storage.createTariffVersion({
        officeId,
        courierPartnerId: meta.courierPartnerId || null,
        label: meta.label,
        fileName: fileInfo.fileName,
        fileUrl: `/objects/${storedFilename}`,
        validFrom,
        validTo,
        status: meta.activate === "true" ? "active" : "draft",
        rowCount: 0,
        uploadedBy: null,
      });

      const { rows, errors } = parsedRowsToInsert(
        parsed,
        partners,
        version.id,
        officeId,
        meta.courierPartnerId,
      );

      if (rows.length === 0) {
        return res.status(400).json({
          message: "No rows could be imported. Partner codes in the file must match your Courier Partners.",
          parseErrors: errors.slice(0, 50),
          partnerCodes: partners.map((p) => p.code),
        });
      }

      const inserted = await storage.insertTariffRateRows(rows);
      await storage.updateTariffVersion(version.id, { rowCount: inserted });

      if (meta.activate === "true") {
        await storage.activateTariffVersion(version.id, officeId);
      }

      res.json({
        version: { ...version, rowCount: inserted },
        imported: inserted,
        parseErrors: errors,
        createdPartners: ensured.createdCodes,
      });
    } catch (error) {
      console.error("Error uploading tariff:", error);
      const detail = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        message: `Failed to upload tariff: ${detail}`,
        detail,
      });
    }
  });

  app.post("/api/tariffs/:id/activate", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      const activated = await storage.activateTariffVersion(req.params.id, officeId);
      if (!activated) {
        return res.status(404).json({ message: "Tariff not found" });
      }
      res.json(activated);
    } catch (error) {
      console.error("Error activating tariff:", error);
      res.status(500).json({ message: "Failed to activate tariff" });
    }
  });

  app.delete("/api/tariffs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      const version = await storage.getTariffVersion(req.params.id);
      if (!version || version.officeId !== officeId) {
        return res.status(404).json({ message: "Tariff not found" });
      }
      await storage.deleteTariffVersion(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tariff:", error);
      res.status(500).json({ message: "Failed to delete tariff" });
    }
  });

  app.post("/api/pricing/quote", isAuthenticated, async (req: any, res) => {
    try {
      const officeId = await getOrCreateOffice(req.user.id);
      const data = pricingQuoteSchema.parse(req.body);

      const baseInput = {
        serviceType: data.serviceType,
        shipmentType: data.shipmentType,
        packageType: data.packageType,
        originCountry: data.originCountry,
        destinationCountry: data.destinationCountry,
        senderPincode: data.senderPincode,
        receiverPincode: data.receiverPincode,
        insurance: data.insurance,
        declaredValue:
          data.declaredValue != null
            ? parseFloat(String(data.declaredValue))
            : undefined,
        weightRoundOff: data.weightRoundOff,
        weight: parseFloat(String(data.weight)) || 0,
        length: data.length != null ? parseFloat(String(data.length)) : undefined,
        width: data.width != null ? parseFloat(String(data.width)) : undefined,
        height: data.height != null ? parseFloat(String(data.height)) : undefined,
      };

      if (data.courierPartnerId) {
        const quote = await storage.quotePrice(officeId, {
          ...baseInput,
          courierPartnerId: data.courierPartnerId,
        });
        if (!quote) {
          return res.status(404).json({ message: "Partner not found" });
        }
        const partner = await storage.getPartner(data.courierPartnerId);
        return res.json({
          quotes: [
            {
              ...quote,
              partnerName: partner?.name || "Courier",
              partnerCode: partner?.code || "",
            },
          ],
        });
      }

      const quotes = await storage.quoteAllPartners(officeId, baseInput);
      res.json({ quotes });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error quoting price:", error);
      res.status(500).json({ message: "Failed to quote price" });
    }
  });

  // Shipment routes
  app.get("/api/shipments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const shipments = await storage.getShipmentsByOffice(officeId);
      res.json(shipments);
    } catch (error) {
      console.error("Error fetching shipments:", error);
      res.status(500).json({ message: "Failed to fetch shipments" });
    }
  });

  app.get("/api/shipments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);

      const shipment = await storage.getShipment(id);
      if (!shipment || shipment.officeId !== officeId) {
        return res.status(404).json({ message: "Shipment not found" });
      }
      res.json(shipment);
    } catch (error) {
      console.error("Error fetching shipment:", error);
      res.status(500).json({ message: "Failed to fetch shipment" });
    }
  });

  app.post("/api/shipments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);

      const validated = shipmentCreateSchema.parse(req.body);

      // Verify courierPartnerId belongs to this office
      const partner = await storage.getPartner(validated.courierPartnerId);
      if (!partner || partner.officeId !== officeId) {
        return res.status(400).json({ message: "Invalid courier partner" });
      }

      // Verify customerId belongs to this office (if provided)
      if (validated.customerId) {
        const customer = await storage.getCustomer(validated.customerId);
        if (!customer || customer.officeId !== officeId) {
          return res.status(400).json({ message: "Invalid customer" });
        }
      }

      const shipmentData = {
        ...validated,
        officeId,
        customerId: validated.customerId || null,
      };

      const shipment = await storage.createShipment(shipmentData);

      // Create payment record
      if (validated.paymentMode !== "credit") {
        await storage.createPayment({
          shipmentId: shipment.id,
          amount: shipment.totalAmount,
          paymentMode: validated.paymentMode,
          paymentStatus: "completed",
          paidAt: new Date(),
        });
      } else {
        await storage.createPayment({
          shipmentId: shipment.id,
          amount: shipment.totalAmount,
          paymentMode: "credit",
          paymentStatus: "pending",
        });
      }

      if (validated.bookingRequestId) {
        const bookingRequest = await storage.getBookingRequest(validated.bookingRequestId);
        if (bookingRequest && bookingRequest.officeId === officeId) {
          await storage.updateBookingRequestStatus(
            validated.bookingRequestId,
            "converted",
            shipment.id,
          );
          triggerCustomerNotification(
            bookingRequest.customerUserId,
            "Shipment created",
            `Your booking is confirmed as shipment ${shipment.bookingNumber}.`,
            "shipment_created",
            {
              shipmentId: shipment.id,
              bookingRequestId: bookingRequest.id,
              bookingNumber: shipment.bookingNumber,
            },
          );
        }
      }

      const office = await storage.getOfficeByUserId(userId);
      if (office) {
        triggerBookingSuccessWhatsApp(
          (office as { whatsappSettings?: unknown }).whatsappSettings,
          shipment,
        );
      }

      res.json(shipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating shipment:", error);
      res.status(500).json({ message: "Failed to create shipment" });
    }
  });

  app.patch("/api/shipments/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);

      // Verify ownership
      const existing = await storage.getShipment(id);
      if (!existing || existing.officeId !== officeId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validated = statusUpdateSchema.parse(req.body);
      const shipment = await storage.updateShipmentStatus(id, validated.status);
      if (!shipment) {
        return res.status(404).json({ message: "Shipment not found" });
      }
      if (existing.status !== validated.status) {
        const bookingRequest = await storage.getBookingRequestByShipmentId(id);
        const statusLabel = validated.status
          .replace(/_/g, " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase());
        triggerCustomerNotification(
          bookingRequest?.customerUserId,
          "Shipment status updated",
          `${shipment.bookingNumber} is now ${statusLabel}.`,
          "shipment_status",
          {
            shipmentId: shipment.id,
            bookingRequestId: bookingRequest?.id || null,
            status: validated.status,
          },
        );
      }
      res.json(shipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating shipment status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  app.get("/api/shipments/:id/partner-payload", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);

      const shipment = await storage.getShipment(id);
      if (!shipment || shipment.officeId !== officeId) {
        return res.status(404).json({ message: "Shipment not found" });
      }

      let partner = shipment.courierPartner ?? undefined;
      if (shipment.courierPartnerId) {
        const freshPartner = await storage.getPartner(shipment.courierPartnerId);
        if (freshPartner) partner = freshPartner;
      }

      const payload = buildPartnerSyncPayload(shipment, partner);
      res.json(payload);
    } catch (error) {
      console.error("Error building partner payload:", error);
      res.status(500).json({ message: "Failed to build partner payload" });
    }
  });

  app.patch("/api/shipments/:id/partner-sync", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);

      const existing = await storage.getShipment(id);
      if (!existing || existing.officeId !== officeId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validated = partnerSyncUpdateSchema.parse(req.body);

      let awbNumber = validated.awbNumber;
      const externalAwb = validated.externalAwb;

      if (validated.copyExternalToAwb !== false && externalAwb?.trim()) {
        if (!awbNumber?.trim() && !existing.awbNumber?.trim()) {
          awbNumber = externalAwb.trim();
        }
      }

      let partnerSyncedAt: Date | null | undefined;
      if (validated.partnerSyncStatus === "synced") {
        partnerSyncedAt = new Date();
      } else if (validated.partnerSyncStatus !== undefined) {
        partnerSyncedAt = null;
      }

      const shipment = await storage.updateShipmentPartnerSync(id, {
        partnerSyncStatus: validated.partnerSyncStatus,
        externalAwb: externalAwb !== undefined ? externalAwb : undefined,
        awbNumber: awbNumber !== undefined ? awbNumber : undefined,
        partnerSyncError: validated.partnerSyncError,
        partnerSyncedAt,
      });

      if (!shipment) {
        return res.status(404).json({ message: "Shipment not found" });
      }

      const withRelations = await storage.getShipment(id);
      res.json(withRelations ?? shipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating partner sync:", error);
      res.status(500).json({ message: "Failed to update partner sync" });
    }
  });

  app.get("/api/integrations/delhivery/status", isAuthenticated, async (_req: any, res) => {
    const config = getDelhiveryConfigFromEnv();
    res.json({
      configured: !!config,
      baseUrl: config?.baseUrl ?? null,
      pickupLocation: config?.pickupLocation ?? null,
    });
  });

  app.post("/api/shipments/:id/delhivery-sync", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);

      const shipment = await storage.getShipment(id);
      if (!shipment || shipment.officeId !== officeId) {
        return res.status(404).json({ message: "Shipment not found" });
      }

      const partner = shipment.courierPartnerId
        ? await storage.getPartner(shipment.courierPartnerId)
        : shipment.courierPartner;

      if (!partner || !isDelhiveryPartner(partner.code, partner.name)) {
        return res.status(400).json({ message: "This shipment is not assigned to Delhivery" });
      }

      const config = getDelhiveryConfigFromEnv();
      if (!config) {
        return res.status(503).json({
          message:
            "Delhivery API not configured. Set DELHIVERY_API_TOKEN and DELHIVERY_PICKUP_LOCATION in .env",
        });
      }

      if (shipment.externalAwb?.trim()) {
        return res.status(409).json({
          message: "Already synced to Delhivery",
          waybill: shipment.externalAwb,
        });
      }

      const result = await createDelhiveryShipment(config, {
        shipment,
        pickupLocation: config.pickupLocation,
      });

      await storage.updateShipmentPartnerSync(id, {
        partnerSyncStatus: "synced",
        externalAwb: result.waybill,
        awbNumber: shipment.awbNumber?.trim() ? shipment.awbNumber : result.waybill,
        partnerSyncError: null,
        partnerSyncedAt: new Date(),
      });

      const updated = await storage.getShipment(id);
      res.json({ waybill: result.waybill, shipment: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delhivery sync failed";
      console.error("Delhivery sync error:", error);

      try {
        await storage.updateShipmentPartnerSync(req.params.id, {
          partnerSyncStatus: "failed",
          partnerSyncError: message,
        });
      } catch {
        /* ignore */
      }

      res.status(502).json({ message });
    }
  });

  app.get("/api/shipments/:id/label", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);

      const shipment = await storage.getShipment(id);
      if (!shipment || shipment.officeId !== officeId) {
        return res.status(404).json({ message: "Shipment not found" });
      }

      const office = await storage.getOfficeByUserId(userId);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }

      res.json({ shipment, office });
    } catch (error) {
      console.error("Error fetching label data:", error);
      res.status(500).json({ message: "Failed to fetch label data" });
    }
  });

  app.get("/api/shipments/:id/invoice", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);

      const shipment = await storage.getShipment(id);
      if (!shipment || shipment.officeId !== officeId) {
        return res.status(404).json({ message: "Shipment not found" });
      }

      const office = await storage.getOfficeByUserId(userId);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }

      // Get or create invoice
      let invoice = await storage.getInvoiceByShipment(id);
      if (!invoice) {
        const invoiceNumber = `INV${Date.now().toString(36).toUpperCase()}`;
        invoice = await storage.createInvoice({
          shipmentId: id,
          invoiceNumber,
          subtotal: shipment.baseAmount || "0",
          gstAmount: shipment.gstAmount || "0",
          totalAmount: shipment.totalAmount,
        });
      }

      const payment = await storage.getPaymentByShipment(id);

      res.json({ invoice, shipment, office, payment });
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      res.status(500).json({ message: "Failed to fetch invoice data" });
    }
  });

  // Reports routes
  app.get("/api/reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const { from, to } = req.query;

      // Validate date parameters
      const fromResult = dateParamSchema.safeParse(from);
      const toResult = dateParamSchema.safeParse(to);
      if (!fromResult.success || !toResult.success) {
        return res.status(400).json({ message: "From and to dates are required in YYYY-MM-DD format" });
      }

      const reportData = await storage.getReportData(officeId, fromResult.data, toResult.data);
      res.json(reportData);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const { type, from, to } = req.query;

      // Validate parameters
      const typeResult = reportTypeSchema.safeParse(type);
      const fromResult = dateParamSchema.safeParse(from);
      const toResult = dateParamSchema.safeParse(to);

      if (!typeResult.success) {
        return res.status(400).json({ message: "Invalid report type" });
      }
      if (!fromResult.success || !toResult.success) {
        return res.status(400).json({ message: "From and to dates are required in YYYY-MM-DD format" });
      }

      const reportData = await storage.getReportData(officeId, fromResult.data, toResult.data);

      let csvContent = "";
      let filename = "";

      switch (typeResult.data) {
        case "date_wise":
          csvContent = "Date,Bookings,Revenue\n";
          reportData.dateWise.forEach((row) => {
            csvContent += `${row.date},${row.bookings},${row.revenue}\n`;
          });
          filename = `date_wise_report_${fromResult.data}_${toResult.data}.csv`;
          break;
        case "customer_wise":
          csvContent = "Customer,Bookings,Revenue\n";
          reportData.customerWise.forEach((row) => {
            csvContent += `"${row.customerName}",${row.bookings},${row.revenue}\n`;
          });
          filename = `customer_wise_report_${fromResult.data}_${toResult.data}.csv`;
          break;
        case "partner_wise":
          csvContent = "Partner,Bookings,Revenue\n";
          reportData.partnerWise.forEach((row) => {
            csvContent += `"${row.partnerName}",${row.bookings},${row.revenue}\n`;
          });
          filename = `partner_wise_report_${fromResult.data}_${toResult.data}.csv`;
          break;
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting report:", error);
      res.status(500).json({ message: "Failed to export report" });
    }
  });

  // Quotation routes
  app.get("/api/quotations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const quotations = await storage.getQuotationsByOffice(officeId);
      res.json(quotations);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  app.get("/api/quotations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);

      const quotation = await storage.getQuotation(id);
      if (!quotation || quotation.officeId !== officeId) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      console.error("Error fetching quotation:", error);
      res.status(500).json({ message: "Failed to fetch quotation" });
    }
  });

  app.post("/api/quotations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);

      const validated = quotationCreateSchema.parse(req.body);

      // Verify courierPartnerId if provided
      if (validated.courierPartnerId) {
        const partner = await storage.getPartner(validated.courierPartnerId);
        if (!partner || partner.officeId !== officeId) {
          return res.status(400).json({ message: "Invalid courier partner" });
        }
      }

      const quotation = await storage.createQuotation({
        ...validated,
        officeId,
        validUntil: validated.validUntil ? new Date(validated.validUntil) : null,
      });
      res.json(quotation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating quotation:", error);
      res.status(500).json({ message: "Failed to create quotation" });
    }
  });

  app.patch("/api/quotations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);

      const existing = await storage.getQuotation(id);
      if (!existing || existing.officeId !== officeId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validated = quotationCreateSchema.partial().parse(req.body);
      const quotation = await storage.updateQuotation(id, {
        ...validated,
        validUntil: validated.validUntil ? new Date(validated.validUntil) : undefined,
      });
      res.json(quotation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating quotation:", error);
      res.status(500).json({ message: "Failed to update quotation" });
    }
  });

  app.delete("/api/quotations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);

      const existing = await storage.getQuotation(id);
      if (!existing || existing.officeId !== officeId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteQuotation(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting quotation:", error);
      res.status(500).json({ message: "Failed to delete quotation" });
    }
  });

  // Booking Request routes (for authenticated users)
  app.get("/api/booking-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeId = await getOrCreateOffice(userId);
      const requests = await storage.getBookingRequestsByOffice(
        officeId,
        req.staffMember?.branchId,
      );
      res.json(requests);
    } catch (error) {
      console.error("Error fetching booking requests:", error);
      res.status(500).json({ message: "Failed to fetch booking requests" });
    }
  });

  app.get("/api/booking-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);

      const request = await storage.getBookingRequest(id);
      if (
        !request ||
        request.officeId !== officeId ||
        (req.staffMember?.branchId &&
          request.branchId !== req.staffMember.branchId)
      ) {
        return res.status(404).json({ message: "Booking request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching booking request:", error);
      res.status(500).json({ message: "Failed to fetch booking request" });
    }
  });

  app.patch("/api/booking-requests/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { status, convertedShipmentId } = req.body;
      const officeId = await getOrCreateOffice(userId);

      const existing = await storage.getBookingRequest(id);
      if (
        !existing ||
        existing.officeId !== officeId ||
        (req.staffMember?.branchId &&
          existing.branchId !== req.staffMember.branchId)
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.updateBookingRequestStatus(id, status, convertedShipmentId);
      if (updated && existing.status !== status) {
        const bookingMessages: Record<string, { title: string; body: string }> = {
          reviewed: {
            title: "Booking under review",
            body: `XGoo is reviewing request #${existing.requestNumber}.`,
          },
          approved: {
            title: "Booking approved",
            body: `Request #${existing.requestNumber} is approved. Pickup confirmation will follow.`,
          },
          rejected: {
            title: "Booking update",
            body: `Request #${existing.requestNumber} could not be accepted. Contact XGoo support for help.`,
          },
          converted: {
            title: "Shipment created",
            body: `Request #${existing.requestNumber} is now an active shipment.`,
          },
        };
        const message = bookingMessages[status];
        if (message) {
          triggerCustomerNotification(
            existing.customerUserId,
            message.title,
            message.body,
            `booking_${status}`,
            { bookingRequestId: existing.id, requestNumber: existing.requestNumber },
          );
        }
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating booking request:", error);
      res.status(500).json({ message: "Failed to update booking request" });
    }
  });

  // Default office for the public booking portal (single booking system)
  app.get("/api/public/booking-office", async (_req, res) => {
    try {
      const office = await storage.getDefaultBookingOffice();
      if (!office || !office.publicSlug) {
        return res.status(404).json({ message: "Booking is not available yet" });
      }
      res.json({
        id: office.id,
        name: office.name,
        city: office.city,
        state: office.state,
        phone: office.phone,
        email: office.email,
        slug: office.publicSlug,
        pickupSettings: mergePickupSettings(
          (office as { pickupSettings?: unknown }).pickupSettings,
        ),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error fetching booking office:", message);
      res.status(503).json({
        message: "Booking service is temporarily unavailable",
        hint: process.env.VERCEL
          ? "Check DATABASE_URL or DATABASE_POOL_URL in Vercel environment variables."
          : "Check DATABASE_URL and database connectivity.",
      });
    }
  });

  app.get("/api/health", async (_req, res) => {
    try {
      await verifyDatabaseConnection();
      res.json({ ok: true, database: "connected", host: databaseHost, openai: isOpenAiConfigured() ? "configured" : "missing" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Health check failed:", message);
      const usePooler =
        Boolean(process.env.VERCEL) &&
        databaseHost.startsWith("db.") &&
        databaseHost.endsWith(".supabase.co");
      res.status(503).json({
        ok: false,
        database: "disconnected",
        host: databaseHost,
        openai: isOpenAiConfigured() ? "configured" : "missing",
        error: message,
        hint: usePooler
          ? "Direct Supabase host (db.*.supabase.co) often fails on Vercel. Use the Connection Pooler URL (port 6543) as DATABASE_POOL_URL in Vercel."
          : "Verify DATABASE_URL / DATABASE_POOL_URL and redeploy.",
      });
    }
  });

  // Public booking portal routes (no auth required)
  app.get("/api/public/office/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const office = await storage.getOfficeBySlug(slug);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }
      // Return limited public info
      res.json({
        id: office.id,
        name: office.name,
        city: office.city,
        state: office.state,
        phone: office.phone,
        email: office.email,
        pickupSettings: mergePickupSettings(
          (office as { pickupSettings?: unknown }).pickupSettings,
        ),
      });
    } catch (error) {
      console.error("Error fetching public office:", error);
      res.status(500).json({ message: "Failed to fetch office" });
    }
  });

  app.get("/api/public/office/:slug/pickup-settings", async (req, res) => {
    try {
      const { slug } = req.params;
      const office = await storage.getOfficeBySlug(slug);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }
      res.json(
        mergePickupSettings((office as { pickupSettings?: unknown }).pickupSettings),
      );
    } catch (error) {
      console.error("Error fetching pickup settings:", error);
      res.status(500).json({ message: "Failed to fetch pickup settings" });
    }
  });

  app.get("/api/public/office/:slug/partners", async (req, res) => {
    try {
      const { slug } = req.params;
      const office = await storage.getOfficeBySlug(slug);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }
      const partners = await storage.getPartnersByOffice(office.id);
      // Return limited partner info for public view
      res.json(partners.filter(p => p.isActive).map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
      })));
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  app.post("/api/public/office/:slug/booking-request", async (req, res) => {
    try {
      const { slug } = req.params;
      const office = await storage.getOfficeBySlug(slug);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }

      const validated = parseBookingRequestBody(req.body);
      const branchId = await resolveBranchIdForBooking(office.id, validated);

      const request = await storage.createBookingRequest({
        ...validated,
        officeId: office.id,
        branchId,
        source: "website",
        status: "pending",
      });

      triggerBookingRequestWhatsApp(
        (office as { whatsappSettings?: unknown }).whatsappSettings,
        request,
      );

      res.json({
        success: true,
        id: request.id,
        requestNumber: request.requestNumber,
        message: "Your booking request has been submitted. The office will contact you shortly.",
        ...bookingWhatsAppExtras(
          (office as { whatsappSettings?: unknown }).whatsappSettings,
          request.requestNumber,
        ),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating booking request:", error);
      res.status(500).json({ message: "Failed to submit booking request" });
    }
  });

  // Public track for this office: request # (BR…), booking #, or AWB
  async function resolvePublicTrack(officeId: string, raw: string) {
    const shipmentDirect = await storage.getShipmentByOfficeAndTracking(officeId, raw);
    if (shipmentDirect) {
      const tracking = trackingFromBookingRequest(
        {
          status: "converted",
          createdAt: shipmentDirect.bookedAt ?? shipmentDirect.createdAt,
          senderCity: shipmentDirect.senderCity,
          senderState: shipmentDirect.senderState,
          senderAddress: shipmentDirect.senderAddress,
          receiverCity: shipmentDirect.receiverCity,
          receiverState: shipmentDirect.receiverState,
          receiverAddress: shipmentDirect.receiverAddress,
        },
        shipmentDirect,
      );
      return {
        kind: "shipment" as const,
        bookingNumber: shipmentDirect.bookingNumber,
        awbNumber: shipmentDirect.awbNumber,
        status: shipmentDirect.status,
        senderCity: shipmentDirect.senderCity,
        receiverCity: shipmentDirect.receiverCity,
        serviceType: shipmentDirect.serviceType,
        weight: shipmentDirect.weight,
        bookedAt: shipmentDirect.bookedAt,
        pickedUpAt: shipmentDirect.pickedUpAt,
        deliveredAt: shipmentDirect.deliveredAt,
        tracking,
      };
    }

    const br = await storage.getBookingRequestByOfficeAndRequestNumber(officeId, raw);
    if (!br) return null;

    if (br.convertedShipmentId) {
      const s = await storage.getShipment(br.convertedShipmentId);
      if (s) {
        const tracking = trackingFromBookingRequest(br, s);
        return {
          kind: "shipment" as const,
          bookingNumber: s.bookingNumber,
          awbNumber: s.awbNumber,
          status: s.status,
          senderCity: s.senderCity,
          receiverCity: s.receiverCity,
          serviceType: s.serviceType,
          weight: s.weight,
          bookedAt: s.bookedAt,
          pickedUpAt: s.pickedUpAt,
          deliveredAt: s.deliveredAt,
          tracking,
        };
      }
    }

    const tracking = trackingFromBookingRequest(br, null);
    return {
      kind: "booking_request" as const,
      requestNumber: br.requestNumber,
      status: br.status,
      senderCity: br.senderCity,
      receiverCity: br.receiverCity,
      createdAt: br.createdAt,
      message:
        "Your request is with the office. When it becomes a shipment, full tracking will appear here.",
      tracking,
    };
  }

  app.get("/api/public/office/:slug/track/:trackingNumber", async (req, res) => {
    try {
      const { slug, trackingNumber: rawParam } = req.params;
      const office = await storage.getOfficeBySlug(slug);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }
      const raw = decodeURIComponent(rawParam || "").trim();
      if (!raw) {
        return res.status(400).json({ message: "Tracking number required" });
      }

      const result = await resolvePublicTrack(office.id, raw);
      if (!result) {
        return res.status(404).json({ message: "No booking or shipment found with this number" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error in office track:", error);
      res.status(500).json({ message: "Failed to track" });
    }
  });

  // Guest / public: booking request detail by request number (scoped to office)
  app.get("/api/public/office/:slug/booking-request/:requestNumber", async (req, res) => {
    try {
      const { slug, requestNumber: rawParam } = req.params;
      const office = await storage.getOfficeBySlug(slug);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }
      const request = await storage.getBookingRequestByOfficeAndRequestNumber(
        office.id,
        decodeURIComponent(rawParam || "")
      );
      if (!request) {
        return res.status(404).json({ message: "Booking not found" });
      }
      let shipment = null;
      if (request.convertedShipmentId) {
        shipment = await storage.getShipment(request.convertedShipmentId);
      }
      const tracking = trackingFromBookingRequest(request, shipment);
      res.json({ request, shipment, tracking });
    } catch (error) {
      console.error("Error fetching public booking request:", error);
      res.status(500).json({ message: "Failed to load booking" });
    }
  });

  // ==========================================
  // Customer Portal Auth & API Routes
  // ==========================================

  const customerRegisterSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(10, "Valid phone number required"),
    email: z.string().email().optional().or(z.literal("")),
    password: z.string().min(6, "Password must be at least 6 characters"),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  });

  const customerLoginSchema = z.object({
    phone: z.string().min(10, "Valid phone number required"),
    password: z.string().min(1, "Password is required"),
  });

  const customerUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().min(10).optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    defaultPickupLat: z.string().optional().nullable(),
    defaultPickupLng: z.string().optional().nullable(),
  });

  // Customer Register
  app.post("/api/public/office/:slug/customer/register", async (req, res) => {
    try {
      const { slug } = req.params;
      const office = await storage.getOfficeBySlug(slug);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }

      const validated = customerRegisterSchema.parse(req.body);

      const existing = await storage.getCustomerUserByPhone(office.id, validated.phone);
      if (existing) {
        return res.status(400).json({ message: "An account with this phone number already exists. Please login instead." });
      }

      if (validated.email) {
        const existingEmail = await storage.getCustomerUserByEmail(office.id, validated.email);
        if (existingEmail) {
          return res.status(400).json({ message: "An account with this email already exists." });
        }
      }

      const passwordHash = await bcrypt.hash(validated.password, 10);
      const customerUser = await storage.createCustomerUser({
        officeId: office.id,
        name: validated.name,
        phone: validated.phone,
        email: validated.email || null,
        passwordHash,
        address: validated.address || null,
        city: validated.city || null,
        state: validated.state || null,
        pincode: validated.pincode || null,
      });

      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await storage.createCustomerSession({
        customerUserId: customerUser.id,
        token,
        expiresAt,
      });

      const { passwordHash: _, ...safeUser } = customerUser;
      res.json({ user: safeUser, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error registering customer:", error);
      res.status(500).json({ message: "Failed to register" });
    }
  });

  // Customer Login
  app.post("/api/public/office/:slug/customer/login", async (req, res) => {
    try {
      const { slug } = req.params;
      const office = await storage.getOfficeBySlug(slug);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }

      const validated = customerLoginSchema.parse(req.body);
      const customerUser = await storage.getCustomerUserByPhone(office.id, validated.phone);
      if (!customerUser) {
        return res.status(401).json({ message: "Invalid phone number or password" });
      }

      const isValid = await bcrypt.compare(validated.password, customerUser.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid phone number or password" });
      }

      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await storage.createCustomerSession({
        customerUserId: customerUser.id,
        token,
        expiresAt,
      });

      const { passwordHash: _, ...safeUser } = customerUser;
      res.json({ user: safeUser, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error logging in customer:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Customer Logout
  app.post("/api/customer/logout", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const token = req.headers["x-customer-token"] as string;
      await storage.deleteCustomerSession(token);
      res.json({ success: true });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // Get current customer user
  app.get("/api/customer/me", isCustomerAuthenticated, async (req: any, res) => {
    const { passwordHash: _, ...safeUser } = req.customerUser;
    res.json(safeUser);
  });

  // Update customer profile
  app.patch("/api/customer/me", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const validated = customerUpdateSchema.parse(req.body);
      const updated = await storage.updateCustomerUser(req.customerUser.id, validated as any);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      const { passwordHash: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch("/api/customer/password", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const validated = z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
      }).parse(req.body);
      const matches = await bcrypt.compare(
        validated.currentPassword,
        req.customerUser.passwordHash,
      );
      if (!matches) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      if (validated.currentPassword === validated.newPassword) {
        return res.status(400).json({ message: "Choose a different new password" });
      }
      await storage.updateCustomerUser(req.customerUser.id, {
        passwordHash: await bcrypt.hash(validated.newPassword, 10),
      });
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error changing customer password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.post("/api/customer/push-token", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const validated = z.object({
        token: z.string().min(10),
        platform: z.enum(["android", "ios"]),
      }).parse(req.body);
      const saved = await storage.upsertCustomerPushToken(
        req.customerUser.id,
        validated.token,
        validated.platform,
      );
      res.json(saved);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error registering customer push token:", error);
      res.status(500).json({ message: "Failed to register notifications" });
    }
  });

  app.get("/api/customer/notifications", isCustomerAuthenticated, async (req: any, res) => {
    try {
      res.json(await storage.getCustomerNotifications(req.customerUser.id));
    } catch (error) {
      console.error("Error fetching customer notifications:", error);
      res.status(500).json({ message: "Failed to load notifications" });
    }
  });

  app.patch("/api/customer/notifications/read", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const validated = z.object({ id: z.string().uuid().optional() }).parse(req.body || {});
      await storage.markCustomerNotificationsRead(
        req.customerUser.id,
        validated.id,
      );
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error marking customer notifications read:", error);
      res.status(500).json({ message: "Failed to update notifications" });
    }
  });

  const customerAddressSchema = z.object({
    label: z.string().min(1, "Label is required"),
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(10, "Valid phone required"),
    address: z.string().min(1, "Address is required"),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    lat: z.string().optional().nullable(),
    lng: z.string().optional().nullable(),
    addressType: z.enum(["sender", "receiver"]).default("sender"),
    isDefault: z.boolean().optional(),
  });

  app.get("/api/customer/addresses", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const addresses = await storage.getCustomerAddresses(req.customerUser.id);
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      res.status(500).json({ message: "Failed to fetch addresses" });
    }
  });

  app.post("/api/customer/addresses", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const validated = customerAddressSchema.parse(req.body);
      const created = await storage.createCustomerAddress({
        ...validated,
        customerUserId: req.customerUser.id,
      });
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating address:", error);
      res.status(500).json({ message: "Failed to save address" });
    }
  });

  app.patch("/api/customer/addresses/:id", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const validated = customerAddressSchema.partial().parse(req.body);
      const updated = await storage.updateCustomerAddress(req.params.id, req.customerUser.id, validated);
      if (!updated) {
        return res.status(404).json({ message: "Address not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating address:", error);
      res.status(500).json({ message: "Failed to update address" });
    }
  });

  app.delete("/api/customer/addresses/:id", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deleteCustomerAddress(req.params.id, req.customerUser.id);
      if (!deleted) {
        return res.status(404).json({ message: "Address not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting address:", error);
      res.status(500).json({ message: "Failed to delete address" });
    }
  });

  // Get customer's booking requests
  app.get("/api/customer/bookings", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const requests = await storage.getBookingRequestsByCustomerUser(req.customerUser.id);
      const enriched = await Promise.all(
        requests.map(async (request) => {
          const shipment = await storage.getShipmentForBookingRequest(request);
          return {
            ...request,
            tracking: buildCustomerTrackingSummary(request, shipment),
          };
        }),
      );
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching customer bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get customer's booking request with shipment tracking info
  app.get("/api/customer/bookings/:id", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const request = await storage.getBookingRequest(id);
      if (!request || request.customerUserId !== req.customerUser.id) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const shipment = await storage.getShipmentForBookingRequest(request);
      const tracking = trackingFromBookingRequest(request, shipment);
      res.json({ request, shipment, tracking });
    } catch (error) {
      console.error("Error fetching booking detail:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Customer submits a new booking (authenticated)
  app.post("/api/customer/bookings", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const validated = parseBookingRequestBody(req.body);
      const pickupData = {
        pickupLat: req.body.pickupLat || null,
        pickupLng: req.body.pickupLng || null,
        pickupLocationName: req.body.pickupLocationName || null,
        pickupDate: req.body.pickupDate || null,
        pickupTimeSlot: req.body.pickupTimeSlot || null,
      };

      const branchId = await resolveBranchIdForBooking(req.customerUser.officeId, {
        ...validated,
        ...pickupData,
      });
      const clientSource = String(req.headers["x-xgoo-client"] || "");
      const source =
        clientSource === "mobile_android" || clientSource === "mobile_ios"
          ? clientSource
          : "customer_portal";

      const request = await storage.createBookingRequest({
        ...validated,
        ...pickupData,
        officeId: req.customerUser.officeId,
        branchId,
        customerUserId: req.customerUser.id,
        source,
        status: "pending",
      });
      triggerCustomerNotification(
        req.customerUser.id,
        "Booking request received",
        `Request #${request.requestNumber} was submitted successfully. XGoo will review it shortly.`,
        "booking_created",
        { bookingRequestId: request.id, requestNumber: request.requestNumber },
      );

      const [office] = await db
        .select()
        .from(offices)
        .where(eq(offices.id, req.customerUser.officeId))
        .limit(1);
      if (office) {
        triggerBookingRequestWhatsApp(
          (office as { whatsappSettings?: unknown }).whatsappSettings,
          request,
        );
      }

      res.json({
        success: true,
        requestNumber: request.requestNumber,
        message: "Your booking request has been submitted.",
        ...bookingWhatsAppExtras(
          (office as { whatsappSettings?: unknown }).whatsappSettings,
          request.requestNumber,
        ),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating customer booking:", error);
      res.status(500).json({ message: "Failed to submit booking" });
    }
  });

  // === AI ENDPOINTS ===
  const openaiApiKey = resolveOpenAiApiKey();
  const openaiBaseUrlRaw = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim();
  const openaiBaseUrl =
    openaiBaseUrlRaw && openaiBaseUrlRaw.length > 0 ? openaiBaseUrlRaw : undefined;

  const aiOpenai = new OpenAI({
    apiKey: openaiApiKey || "sk-missing-configure-env",
    baseURL: openaiBaseUrl,
  });

  /** OpenAI Node SDK: details are often on `error.error.message` / `error.code`, not only `error.message`. */
  function openAiErrMessage(err: unknown): string {
    if (!err || typeof err !== "object") return String(err);
    const e = err as Record<string, unknown> & {
      error?: { message?: string; code?: string };
      code?: string;
      response?: { data?: { error?: { message?: string; code?: string } } };
      message?: string;
    };
    const apiInner = e.error;
    if (apiInner && typeof apiInner === "object") {
      const m = (apiInner as { message?: string }).message;
      if (typeof m === "string" && m.length) return m;
    }
    const fromAxios = e.response?.data?.error?.message;
    if (typeof fromAxios === "string" && fromAxios.length) return fromAxios;
    if (typeof e.message === "string" && e.message.length) return e.message;
    return "Unknown error";
  }

  function openAiErrCode(err: unknown): string | undefined {
    if (!err || typeof err !== "object") return undefined;
    const e = err as { code?: string; error?: { code?: string } };
    return e.code || e.error?.code;
  }

  /** Vision models sometimes wrap JSON in markdown; json_object mode can error on some accounts. */
  function parseJsonFromChatContent(raw: string | null | undefined): Record<string, unknown> {
    const text = (raw || "").trim();
    if (!text) return {};
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenced ? fenced[1].trim() : text;
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    const slice =
      start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
    try {
      return JSON.parse(slice) as Record<string, unknown>;
    } catch {
      return {};
    }
  }


  // AI Section Fill - Parse natural language description for a specific form section (multilingual)
  app.post("/api/ai/section-fill", async (req, res) => {
    try {
      const { section, description, customers, partners } = req.body;
      if (!description || !section) {
        return res.status(400).json({ message: "Section and description are required" });
      }
      if (typeof description !== "string" || description.length > 1000) {
        return res.status(400).json({ message: "Description too long (max 1000 chars)" });
      }

      const validSections = ["sender", "receiver", "package", "service"];
      if (!validSections.includes(section)) {
        return res.status(400).json({ message: "Invalid section. Must be: sender, receiver, package, or service" });
      }

      const sectionFieldMap: Record<string, string> = {
        sender: `Extract sender/shipper details. Return JSON with ONLY fields you can extract:
{ "senderName": string, "senderPhone": string (10-digit Indian number), "senderAddress": string, "senderCity": string, "senderState": string, "senderPincode": string (6-digit), "customerId": string }
${customers?.length ? `Known customers: ${customers.map((c: any) => `${c.name} (${c.phone}, ID: ${c.id})`).join(", ")}. If the description matches a known customer, include their customerId.` : ""}`,

        receiver: `Extract receiver/destination details. Return JSON with ONLY fields you can extract:
{ "receiverName": string, "receiverPhone": string (10-digit Indian number), "receiverAddress": string, "receiverCity": string, "receiverState": string, "receiverPincode": string (6-digit) }
For Indian cities, infer the state if possible. Try to infer pincode from well-known areas.`,

        package: `Extract package/parcel details. Return JSON with ONLY fields you can extract:
{ "weight": string (in kg), "length": string (in cm), "width": string (in cm), "height": string (in cm), "numberOfPieces": string, "contentDescription": string, "declaredValue": string (in INR) }
Common conversions: 1 pound ≈ 0.45 kg, 1 inch ≈ 2.54 cm. Parse colloquial measurements.`,

        service: `Extract service/shipping preference details. Return JSON with ONLY fields you can extract:
{ "serviceType": "air" | "surface", "courierPartnerId": string, "paymentMode": "cash" | "upi" | "bank_transfer" | "credit", "awbNumber": string }
Default "surface" unless express/urgent/air/fast mentioned. "COD" or "cash on delivery" = "cash".
${partners?.length ? `Available courier partners: ${partners.map((p: any) => `${p.name} (${p.code}, ID: ${p.id})`).join(", ")}. Match partner by name/code if mentioned.` : ""}`,
      };

      const response = await aiOpenai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a multilingual courier booking assistant for Indian courier offices. You understand ALL languages including Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, English, and mixed-language input (Hinglish etc.).

${sectionFieldMap[section]}

IMPORTANT RULES:
1. The user may type in ANY language or mix of languages. Understand their intent regardless of language.
2. Always return field VALUES in English (names can be in the original script if that's clearly the person's name).
3. Phone numbers should be 10-digit Indian format.
4. Return ONLY a JSON object with the fields you could extract. Omit fields you're unsure about.
5. Do NOT wrap the response in markdown.`
          },
          { role: "user", content: description }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 300,
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(parsed);
    } catch (error) {
      console.error("AI section fill error:", error);
      res.status(500).json({ message: "AI processing failed" });
    }
  });

  // AI Smart Fill - Parse natural language booking description into form fields
  app.post("/api/ai/smart-fill", async (req, res) => {
    try {
      const { description, customers, partners } = req.body;
      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }

      const customerList = (customers || []).map((c: any) => `${c.name} (${c.phone})`).join(", ");
      const partnerList = (partners || []).map((p: any) => `${p.name} (${p.code}) - Air: ₹${p.baseRateAir}+₹${p.ratePerKgAir}/kg, Surface: ₹${p.baseRateSurface}+₹${p.ratePerKgSurface}/kg`).join("\n");

      const response = await aiOpenai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a courier booking assistant for an Indian courier office. Parse the user's natural language booking description and extract structured data. Return a JSON object with ONLY the fields you can extract (omit unknown fields):
{
  "senderName": string,
  "senderPhone": string,
  "senderAddress": string,
  "senderCity": string,
  "senderState": string,
  "senderPincode": string,
  "receiverName": string,
  "receiverPhone": string,
  "receiverAddress": string,
  "receiverCity": string,
  "receiverState": string,
  "receiverPincode": string,
  "weight": string (in kg),
  "length": string (in cm),
  "width": string (in cm),
  "height": string (in cm),
  "numberOfPieces": string,
  "contentDescription": string,
  "declaredValue": string,
  "serviceType": "air" | "surface",
  "courierPartnerId": string (match from available partners if mentioned),
  "customerId": string (match from available customers if mentioned),
  "notes": string
}

Available customers: ${customerList || "None"}
Available courier partners:\n${partnerList || "None"}

Important: Only include fields you're confident about. For Indian cities, infer state and approximate pincode if possible. Default serviceType to "surface" unless air/express/urgent is mentioned.`
          },
          { role: "user", content: description }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 500,
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(parsed);
    } catch (error) {
      console.error("AI smart fill error:", error);
      res.status(500).json({ message: "AI processing failed" });
    }
  });

  // AI Package Measurement - Analyze photo to estimate package dimensions
  app.post("/api/ai/measure-package", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ message: "Image data is required" });
      }

      const response = await aiOpenai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a package measurement assistant. Analyze the photo of a package/parcel and estimate its dimensions. Return a JSON object:
{
  "length": number (in cm, estimated),
  "width": number (in cm, estimated),
  "height": number (in cm, estimated),
  "estimatedWeight": number (in kg, rough estimate based on apparent size and typical package density),
  "contentDescription": string (brief description of what the package appears to contain or its type, e.g., "cardboard box", "envelope", "bubble wrap package"),
  "confidence": "low" | "medium" | "high"
}

Use visual cues like nearby objects for scale reference. If there's a reference object visible (phone, hand, pen, ruler), use it for more accurate estimates. Provide your best estimates even if uncertain. All measurements should be reasonable for courier packages (typically 5-150 cm per side, 0.1-50 kg).`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
              },
              { type: "text", text: "Please measure this package and estimate its dimensions and weight." }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 300,
      });

      const measurements = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(measurements);
    } catch (error) {
      console.error("AI measure package error:", error);
      res.status(500).json({ message: "AI measurement failed" });
    }
  });

  // AI: Scan package / label photos — OCR addresses + infer parcel details (vision)
  app.post("/api/ai/scan-package-photos", isAuthenticated, async (req, res) => {
    try {
      if (!openaiApiKey) {
        return res.status(503).json({
          message:
            "OpenAI API key is not set. Add AI_INTEGRATIONS_OPENAI_API_KEY=sk-... or OPENAI_API_KEY=sk-... to your .env file and restart the dev server (npm run dev).",
        });
      }

      const { images, customers, partners } = req.body;
      if (!Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ message: "Provide at least one image (images[])" });
      }
      if (images.length > 5) {
        return res.status(400).json({ message: "Maximum 5 images per scan" });
      }

      const dataUrls: string[] = [];
      for (const img of images) {
        if (typeof img !== "string" || !img.trim()) {
          return res.status(400).json({ message: "Each image must be a non-empty base64 or data URL string" });
        }
        const s = img.trim();
        if (s.startsWith("data:image/")) dataUrls.push(s);
        else dataUrls.push(`data:image/jpeg;base64,${s}`);
      }

      const customerList = (customers || [])
        .map((c: any) => `${c.name} (${c.phone}) ID:${c.id}`)
        .join("; ");
      const partnerList = (partners || [])
        .map((p: any) => `${p.name} (${p.code}) ID:${p.id}`)
        .join("; ");

      const systemPrompt = `You are an expert at reading courier/shipping photos for Indian courier offices.

The user may provide one or more photos showing:
- Printed shipping labels, waybills, or AWB stickers (read FROM/Sender vs TO/Receiver/Courier blocks)
- Handwritten addresses on parcels or envelopes
- The package itself (estimate size/weight if no label)

Return ONE JSON object with ONLY fields you can confidently extract. Use English for values; preserve person/place names in original script if clearly visible.

Schema (omit unknown fields):
{
  "senderName": string,
  "senderPhone": string (10-digit Indian mobile, no country code),
  "senderAddress": string,
  "senderCity": string,
  "senderState": string,
  "senderPincode": string (6 digits),
  "receiverName": string,
  "receiverPhone": string (10-digit Indian mobile),
  "receiverAddress": string,
  "receiverCity": string,
  "receiverState": string,
  "receiverPincode": string (6 digits),
  "weight": string (kg),
  "length": string (cm),
  "width": string (cm),
  "height": string (cm),
  "numberOfPieces": string,
  "contentDescription": string,
  "declaredValue": string (INR),
  "serviceType": "air" | "surface",
  "paymentMode": "cash" | "upi" | "bank_transfer" | "credit",
  "awbNumber": string,
  "customerId": string (must match a listed customer ID if the sender clearly matches),
  "courierPartnerId": string (must match a listed partner ID if logo/name/code visible),
  "scanNotes": string (brief: what you read from which image, or uncertainties)
}

Rules:
- Distinguish sender FROM vs receiver TO using label layout, arrows, or "Ship To" / "Deliver To" / "From".
- If only one full address is visible, assign to the side that fits (e.g. label "To" → receiver).
- Infer Indian state from city when reasonable. Normalize phones to 10 digits.
- Default serviceType to "surface" unless "express", "air", or "overnight" is visible.
- COD on label often implies paymentMode "cash".

Known customers (match sender if plausible): ${customerList || "None"}
Known courier partners (match if logo/text visible): ${partnerList || "None"}`;

      const userContent: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      > = [
        {
          type: "text",
          text: "Read all images together. Extract booking fields for creating a shipment. Return JSON only.",
        },
      ];
      for (const url of dataUrls) {
        userContent.push({
          type: "image_url",
          image_url: { url },
        });
      }

      const response = await aiOpenai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_completion_tokens: 900,
      });

      const content = response.choices[0]?.message?.content;
      const parsed = parseJsonFromChatContent(content);
      res.json(parsed);
    } catch (error: unknown) {
      console.error("AI scan package photos error:", error);
      const code = openAiErrCode(error);
      let msg = openAiErrMessage(error);
      let httpStatus = 500;

      if (code === "insufficient_quota" || /insufficient_quota|exceeded your current quota|billing/i.test(msg)) {
        httpStatus = 402;
        msg =
          "OpenAI quota or billing limit reached. Add credits or a payment method at https://platform.openai.com/account/billing (Usage limits / Payment methods), then try again.";
      } else if (/invalid.?api|incorrect api key|invalid_api_key|^401\b/i.test(msg) || code === "invalid_api_key") {
        msg =
          "OpenAI rejected the API key. Set AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY in .env, save, and restart the server.";
        httpStatus = 401;
      } else if (code === "rate_limit_exceeded" || /rate.?limit/i.test(msg)) {
        httpStatus = 429;
        msg = msg || "OpenAI rate limit exceeded. Wait a minute and try again.";
      } else if (msg.includes("Invalid image")) {
        /* keep msg */
      } else if (!msg || msg === "Unknown error") {
        msg = "AI scan failed. Check server logs, OpenAI key, and billing.";
      }
      res.status(httpStatus).json({ message: msg, code: code || undefined });
    }
  });

  // AI Courier Recommendation - Suggest best courier partner
  app.post("/api/ai/recommend-courier", async (req, res) => {
    try {
      const { senderCity, receiverCity, weight, serviceType, contentDescription, partners } = req.body;
      if (!partners || partners.length === 0) {
        return res.status(400).json({ message: "No courier partners available" });
      }

      const partnerDetails = partners.map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        airRate: `Base ₹${p.baseRateAir} + ₹${p.ratePerKgAir}/kg`,
        surfaceRate: `Base ₹${p.baseRateSurface} + ₹${p.ratePerKgSurface}/kg`,
      }));

      const response = await aiOpenai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a courier recommendation engine for Indian courier offices. Based on the shipment details, recommend the best courier partner. Return JSON:
{
  "recommendedPartnerId": string,
  "reason": string (brief, 1-2 sentences why this partner is best),
  "estimatedCost": number (approximate cost in INR),
  "alternativePartnerId": string | null,
  "alternativeReason": string | null
}

Consider: price (most important for surface), speed (most important for air), and typical Indian courier strengths:
- DTDC: Good for domestic, affordable surface
- FedEx: International, premium
- Blue Dart: Fast air, reliable
- Delhivery: E-commerce friendly, wide coverage
- Professional Courier: Budget-friendly
Match by code/name if recognized.`
          },
          {
            role: "user",
            content: `Shipment: ${senderCity || "Unknown"} → ${receiverCity || "Unknown"}, Weight: ${weight || "Unknown"}kg, Service: ${serviceType || "surface"}, Contents: ${contentDescription || "General"}\n\nAvailable partners: ${JSON.stringify(partnerDetails)}`
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 300,
      });

      const recommendation = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(recommendation);
    } catch (error) {
      console.error("AI recommend courier error:", error);
      res.status(500).json({ message: "AI recommendation failed" });
    }
  });

  // AI Section Fill for customer portal (public, no auth, multilingual)
  app.post("/api/public/ai/section-fill", async (req, res) => {
    try {
      const { section, description, senderName, senderPhone, senderAddress } = req.body;
      if (!description || !section) {
        return res.status(400).json({ message: "Section and description are required" });
      }
      if (typeof description !== "string" || description.length > 1000) {
        return res.status(400).json({ message: "Description too long (max 1000 chars)" });
      }

      const validSections = ["sender", "receiver", "package", "service"];
      if (!validSections.includes(section)) {
        return res.status(400).json({ message: "Invalid section" });
      }

      const sectionFieldMap: Record<string, string> = {
        sender: `Extract sender/shipper details. Return JSON with ONLY fields you can extract:
{ "senderName": string, "senderPhone": string (10-digit Indian number), "senderEmail": string, "senderAddress": string, "senderCity": string, "senderState": string, "senderPincode": string (6-digit) }
${senderName ? `Current sender: ${senderName} (${senderPhone}), address: ${senderAddress}. Update only fields the user mentions.` : ""}`,

        receiver: `Extract receiver/destination details. Return JSON with ONLY fields you can extract:
{ "receiverName": string, "receiverPhone": string (10-digit Indian number), "receiverAddress": string, "receiverCity": string, "receiverState": string, "receiverPincode": string (6-digit) }
For Indian cities, infer the state if possible. Try to infer pincode from well-known areas.`,

        package: `Extract package/parcel details. Return JSON with ONLY fields you can extract:
{ "weight": string (in kg), "numberOfPieces": string, "contentDescription": string, "declaredValue": string (in INR) }
Common conversions: 1 pound ≈ 0.45 kg. Parse colloquial measurements like "paanch kilo" = 5 kg.`,

        service: `Extract service/shipping preference details. Return JSON with ONLY fields you can extract:
{ "serviceType": "air" | "surface", "courierPreference": string, "notes": string }
Default "surface" unless express/urgent/air/fast mentioned.`,
      };

      const response = await aiOpenai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a multilingual courier booking assistant. You understand ALL languages including Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, English, and mixed-language input (Hinglish etc.).

${sectionFieldMap[section]}

IMPORTANT RULES:
1. The user may type in ANY language or mix of languages. Understand their intent regardless of language.
2. Always return field VALUES in English (names can be in the original script if that's clearly the person's name).
3. Phone numbers should be 10-digit Indian format.
4. Return ONLY a JSON object with the fields you could extract. Omit fields you're unsure about.`
          },
          { role: "user", content: description }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 300,
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(parsed);
    } catch (error) {
      console.error("AI section fill (public) error:", error);
      res.status(500).json({ message: "AI processing failed" });
    }
  });

  // AI Smart Fill for customer portal (public, no auth)
  app.post("/api/public/ai/smart-fill", async (req, res) => {
    try {
      const { description, senderName, senderPhone, senderAddress } = req.body;
      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }
      if (typeof description !== "string" || description.length > 1000) {
        return res.status(400).json({ message: "Description too long (max 1000 chars)" });
      }

      const response = await aiOpenai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a courier booking assistant helping a customer book a parcel. Parse their natural language description and extract structured booking data. Return a JSON object with ONLY the fields you can extract:
{
  "receiverName": string,
  "receiverPhone": string,
  "receiverAddress": string,
  "receiverCity": string,
  "receiverState": string,
  "receiverPincode": string,
  "weight": string (in kg),
  "numberOfPieces": string,
  "contentDescription": string,
  "declaredValue": string,
  "serviceType": "air" | "surface",
  "notes": string
}

${senderName ? `The sender is ${senderName} (${senderPhone}), address: ${senderAddress}.` : ""}
Important: Focus on extracting receiver details since the sender is the customer themselves. For Indian cities, infer state if possible. Default serviceType to "surface" unless express/urgent/air mentioned.`
          },
          { role: "user", content: description }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 400,
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(parsed);
    } catch (error) {
      console.error("AI smart fill (public) error:", error);
      res.status(500).json({ message: "AI processing failed" });
    }
  });

  // AI Package Measurement (public, no auth)
  app.post("/api/public/ai/measure-package", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ message: "Image data is required" });
      }
      if (typeof imageBase64 !== "string" || imageBase64.length > 10_000_000) {
        return res.status(400).json({ message: "Image too large (max ~7MB)" });
      }

      const response = await aiOpenai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a package measurement assistant. Analyze the photo and estimate dimensions. Return JSON:
{
  "length": number (cm),
  "width": number (cm),
  "height": number (cm),
  "estimatedWeight": number (kg),
  "contentDescription": string,
  "confidence": "low" | "medium" | "high"
}`
          },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
              { type: "text", text: "Measure this package dimensions and estimate weight." }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 300,
      });

      const measurements = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(measurements);
    } catch (error) {
      console.error("AI measure package (public) error:", error);
      res.status(500).json({ message: "AI measurement failed" });
    }
  });

  // Customer track by request #, booking #, or AWB (public, no login)
  app.get("/api/public/track/:trackingNumber", async (req, res) => {
    try {
      const raw = decodeURIComponent(req.params.trackingNumber || "").trim();
      if (!raw) {
        return res.status(400).json({ message: "Tracking number required" });
      }

      const office = await storage.getDefaultBookingOffice();
      if (!office) {
        return res.status(503).json({ message: "Tracking is not available yet" });
      }

      const result = await resolvePublicTrack(office.id, raw);
      if (!result) {
        return res.status(404).json({ message: "No booking or shipment found with this number" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error tracking shipment:", error);
      res.status(500).json({ message: "Failed to track shipment" });
    }
  });

  app.post("/api/public/contact", async (req, res) => {
    const contactInquirySchema = z.object({
      name: z.string().trim().min(1).max(120),
      email: z.string().trim().email().max(255),
      phone: z.string().trim().max(20).optional().or(z.literal("")),
      subject: z.string().trim().min(1).max(200),
      message: z.string().trim().min(1).max(5000),
    });

    try {
      const parsed = contactInquirySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Please check your details and try again." });
      }

      console.log("[contact-inquiry]", {
        ...parsed.data,
        receivedAt: new Date().toISOString(),
      });

      res.json({ message: "Thank you! We will get back to you shortly." });
    } catch (error) {
      console.error("Contact inquiry error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  return httpServer;
}
