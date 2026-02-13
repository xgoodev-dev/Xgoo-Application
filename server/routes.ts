import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "./db";
import { shipments } from "@shared/schema";
import { sql } from "drizzle-orm";

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
});

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
  awbPrefix: z.string().optional(),
  awbRangeStart: z.string().optional(),
  awbRangeEnd: z.string().optional(),
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
  serviceType: z.enum(["air", "surface"]),
  paymentMode: z.enum(["cash", "upi", "bank_transfer", "credit"]),
  baseAmount: z.string().optional(),
  totalAmount: z.string().min(1),
});

const statusUpdateSchema = z.object({
  status: z.enum(["booked", "picked_up", "in_transit", "delivered"]),
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

const bookingRequestCreateSchema = z.object({
  senderName: z.string().min(1, "Sender name required"),
  senderPhone: z.string().min(10, "Valid phone required"),
  senderEmail: z.string().email().optional().or(z.literal("")),
  senderAddress: z.string().min(1, "Address required"),
  senderCity: z.string().optional(),
  senderState: z.string().optional(),
  senderPincode: z.string().optional(),
  receiverName: z.string().min(1, "Receiver name required"),
  receiverPhone: z.string().min(10, "Valid phone required"),
  receiverAddress: z.string().min(1, "Address required"),
  receiverCity: z.string().optional(),
  receiverState: z.string().optional(),
  receiverPincode: z.string().optional(),
  weight: z.string().optional(),
  numberOfPieces: z.number().int().positive().default(1),
  contentDescription: z.string().optional(),
  declaredValue: z.string().optional().nullable(),
  serviceType: z.enum(["air", "surface"]).default("surface"),
  courierPreference: z.string().optional(),
  notes: z.string().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  async function getOrCreateOffice(userId: string, officeName?: string): Promise<string> {
    let office = await storage.getOfficeByUserId(userId);
    if (!office) {
      office = await storage.createOffice({
        userId,
        name: officeName || "My Courier Office",
      });
    }
    return office.id;
  }

  // Helper to verify resource belongs to user's office
  async function verifyOwnership(userId: string, resourceOfficeId: string): Promise<boolean> {
    const office = await storage.getOfficeByUserId(userId);
    return office?.id === resourceOfficeId;
  }

  // Office routes
  app.get("/api/office", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const office = await storage.getOfficeByUserId(userId);
      res.json(office || null);
    } catch (error) {
      console.error("Error fetching office:", error);
      res.status(500).json({ message: "Failed to fetch office" });
    }
  });

  app.post("/api/office", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.patch("/api/office/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const officeId = await getOrCreateOffice(userId);
      const validated = partnerCreateSchema.parse(req.body);
      const partner = await storage.createPartner({ ...validated, officeId });
      res.json(partner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating partner:", error);
      res.status(500).json({ message: "Failed to create partner" });
    }
  });

  app.patch("/api/partners/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);
      
      // Verify ownership
      const existing = await storage.getPartner(id);
      if (!existing || existing.officeId !== officeId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validated = partnerCreateSchema.partial().parse(req.body);
      const partner = await storage.updatePartner(id, validated);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      res.json(partner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating partner:", error);
      res.status(500).json({ message: "Failed to update partner" });
    }
  });

  app.delete("/api/partners/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Shipment routes
  app.get("/api/shipments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      res.json(shipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating shipment status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  app.get("/api/shipments/:id/label", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const officeId = await getOrCreateOffice(userId);
      const requests = await storage.getBookingRequestsByOffice(officeId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching booking requests:", error);
      res.status(500).json({ message: "Failed to fetch booking requests" });
    }
  });

  app.get("/api/booking-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const officeId = await getOrCreateOffice(userId);
      
      const request = await storage.getBookingRequest(id);
      if (!request || request.officeId !== officeId) {
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
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status, convertedShipmentId } = req.body;
      const officeId = await getOrCreateOffice(userId);
      
      const existing = await storage.getBookingRequest(id);
      if (!existing || existing.officeId !== officeId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updated = await storage.updateBookingRequestStatus(id, status, convertedShipmentId);
      res.json(updated);
    } catch (error) {
      console.error("Error updating booking request:", error);
      res.status(500).json({ message: "Failed to update booking request" });
    }
  });

  // Public offices listing (for customer discovery)
  app.get("/api/public/offices", async (req, res) => {
    try {
      const officesList = await storage.getPublicOffices();
      res.json(officesList);
    } catch (error) {
      console.error("Error fetching public offices:", error);
      res.status(500).json({ message: "Failed to fetch offices" });
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
      });
    } catch (error) {
      console.error("Error fetching public office:", error);
      res.status(500).json({ message: "Failed to fetch office" });
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
      
      const validated = bookingRequestCreateSchema.parse(req.body);
      
      const request = await storage.createBookingRequest({
        ...validated,
        officeId: office.id,
        status: "pending",
      });
      
      res.json({ 
        success: true, 
        requestNumber: request.requestNumber,
        message: "Your booking request has been submitted. The office will contact you shortly."
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating booking request:", error);
      res.status(500).json({ message: "Failed to submit booking request" });
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

  // Middleware to authenticate customer portal users
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

  // Get customer's booking requests
  app.get("/api/customer/bookings", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const requests = await storage.getBookingRequestsByCustomerUser(req.customerUser.id);
      res.json(requests);
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

      let shipment = null;
      if (request.convertedShipmentId) {
        shipment = await storage.getShipment(request.convertedShipmentId);
      }

      res.json({ request, shipment });
    } catch (error) {
      console.error("Error fetching booking detail:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Customer submits a new booking (authenticated)
  app.post("/api/customer/bookings", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const validated = bookingRequestCreateSchema.parse(req.body);
      const pickupData = {
        pickupLat: req.body.pickupLat || null,
        pickupLng: req.body.pickupLng || null,
        pickupLocationName: req.body.pickupLocationName || null,
      };

      const request = await storage.createBookingRequest({
        ...validated,
        ...pickupData,
        officeId: req.customerUser.officeId,
        customerUserId: req.customerUser.id,
        status: "pending",
      });

      res.json({
        success: true,
        requestNumber: request.requestNumber,
        message: "Your booking request has been submitted.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating customer booking:", error);
      res.status(500).json({ message: "Failed to submit booking" });
    }
  });

  // Customer track shipment by booking number or AWB (public, no auth needed)
  app.get("/api/public/track/:trackingNumber", async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      const shipmentResults = await db
        .select()
        .from(shipments)
        .where(
          sql`${shipments.bookingNumber} = ${trackingNumber} OR ${shipments.awbNumber} = ${trackingNumber}`
        );

      if (shipmentResults.length === 0) {
        return res.status(404).json({ message: "No shipment found with this tracking number" });
      }

      const s = shipmentResults[0];
      res.json({
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
      });
    } catch (error) {
      console.error("Error tracking shipment:", error);
      res.status(500).json({ message: "Failed to track shipment" });
    }
  });

  return httpServer;
}
