import type { Express } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { mergePickupSettings } from "@shared/pickup-settings";
import { detectKioskIntent, searchKnowledgeBase, quoteKey, type ServiceKind } from "@shared/kiosk";

const kioskQuoteSchema = z.object({
  serviceType: z.enum(["air", "surface"]).optional(),
  shipmentType: z.enum(["domestic", "international"]).optional(),
  packageType: z.enum(["document", "package"]).optional(),
  originCountry: z.string().optional(),
  destinationCountry: z.string().optional(),
  senderPincode: z.string().optional(),
  receiverPincode: z.string().optional(),
  weight: z.union([z.string(), z.number()]),
  length: z.union([z.string(), z.number()]).optional().nullable(),
  width: z.union([z.string(), z.number()]).optional().nullable(),
  height: z.union([z.string(), z.number()]).optional().nullable(),
});

function num(value: string | number | null | undefined): number | undefined {
  if (value == null || value === "") return undefined;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : undefined;
}

export function registerKioskRoutes(app: Express) {
  app.get("/api/public/office/:slug/kiosk", async (req, res) => {
    try {
      const slug = String(req.params.slug || "").trim();
      if (!slug) return res.status(400).json({ message: "Store slug required" });
      const office = await storage.getOfficeBySlug(slug);
      if (!office) {
        return res.status(404).json({ message: "This Hub store is not set up for Bot Assistant." });
      }
      const hubQuery = typeof req.query.hub === "string" ? req.query.hub.trim() : "";
      let hub: { id: string; name: string; city: string | null; address: string | null } | null =
        null;
      if (hubQuery) {
        const branch = await storage.getBranch(hubQuery);
        if (branch && branch.officeId === office.id && branch.isActive !== false) {
          hub = {
            id: branch.id,
            name: branch.name,
            city: branch.city ?? null,
            address: branch.address ?? null,
          };
        }
      }
      const pickup = mergePickupSettings(
        (office as { pickupSettings?: unknown }).pickupSettings,
      );
      res.json({
        demoMode: false,
        office: {
          id: office.id,
          name: office.name,
          slug: office.publicSlug,
          city: office.city,
          state: office.state,
          phone: office.phone,
          email: office.email,
        },
        hub,
        hours: "Mon – Sat, 9:00 AM – 7:00 PM IST",
        cutoffNote: pickup.cutoffNote,
        languages: ["en", "hi", "te"],
      });
    } catch (error) {
      console.error("Kiosk config error:", error);
      res.status(500).json({ message: "Failed to load Bot Assistant" });
    }
  });

  app.post("/api/public/office/:slug/kiosk/quote", async (req, res) => {
    try {
      const slug = String(req.params.slug || "").trim();
      const office = await storage.getOfficeBySlug(slug);
      if (!office) {
        return res.status(404).json({ message: "This Hub store is not set up for quotes." });
      }
      const data = kioskQuoteSchema.parse(req.body);
      const weight = num(data.weight) ?? 0;
      if (weight <= 0) {
        return res.status(400).json({ message: "Weight must be greater than 0" });
      }
      const services: ServiceKind[] = data.serviceType
        ? [data.serviceType]
        : ["surface", "air"];
      const quotes = [];
      for (const serviceType of services) {
        const rows = await storage.quoteAllPartners(office.id, {
          serviceType,
          shipmentType: data.shipmentType,
          packageType: data.packageType,
          originCountry: data.originCountry,
          destinationCountry: data.destinationCountry,
          senderPincode: data.senderPincode,
          receiverPincode: data.receiverPincode,
          weight,
          length: num(data.length ?? undefined),
          width: num(data.width ?? undefined),
          height: num(data.height ?? undefined),
          weightRoundOff: "ceil_kg",
        });
        for (const row of rows) {
          quotes.push({
            key: quoteKey(row.partnerCode || row.courierPartnerId, serviceType),
            partnerName: row.partnerName,
            partnerCode: row.partnerCode,
            serviceType,
            sellPrice: row.sellPrice,
            transitDays: row.transitDays ?? null,
            chargeableWeight: row.chargeableWeight,
            source: row.source,
            isLive: row.source !== "legacy",
            message: row.message,
          });
        }
      }
      quotes.sort((a, b) => a.sellPrice - b.sellPrice);
      res.json({
        demoMode: false,
        isLive: quotes.length > 0,
        quotes,
        message:
          quotes.length === 0
            ? "No live rates are configured for this store yet. Please ask staff for a quote."
            : "Prices and days are estimates from this store’s rate engine, not a delivery guarantee.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Kiosk quote error:", error);
      res.status(500).json({ message: "Failed to calculate rates" });
    }
  });

  app.get("/api/public/office/:slug/kiosk/knowledge", async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    res.json({ articles: searchKnowledgeBase(q) });
  });

  app.post("/api/public/office/:slug/kiosk/intent", async (req, res) => {
    const message = String((req.body as { message?: string })?.message || "");
    const intent = detectKioskIntent(message);
    res.json({
      intent,
      articles: intent === "help" ? searchKnowledgeBase(message) : [],
    });
  });
}
