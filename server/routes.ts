import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { z } from "zod";

// Validation schemas
const officeUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  gstNumber: z.string().optional(),
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
      await storage.seedData(office.id);
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
      const validated = officeUpdateSchema.parse(req.body);
      const office = await storage.createOffice({ ...validated, userId });
      await storage.seedData(office.id);
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

  return httpServer;
}
