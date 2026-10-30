import "dotenv/config";
import { db } from "../server/db";
import { courierPartners } from "@shared/schema";
import { isWorldFirstPartner } from "@shared/world-first";
import { storage } from "../server/storage";
import { startBooking } from "../server/booking/service";
import { ensureWorldFirstShipmentColumns } from "../server/integrations/world-first";

async function main() {
  await ensureWorldFirstShipmentColumns();
  const partners = await db.select().from(courierPartners);
  const partner = partners.find((row) => isWorldFirstPartner(row.code, row.name));
  if (!partner) throw new Error("No World First partner in Hub.");

  const shipment = await storage.createShipment({
    officeId: partner.officeId,
    courierPartnerId: partner.id,
    shipmentType: "international",
    destinationCountry: "United Kingdom",
    orderDate: new Date().toISOString().slice(0, 10),
    senderName: "XGoo Test Shipper",
    senderPhone: "9876500001",
    senderEmail: "xgoo.test@example.com",
    senderAddress: "Plot 12, HITEC City, Madhapur",
    senderCity: "Hyderabad",
    senderState: "Telangana",
    senderPincode: "500081",
    senderCountry: "India",
    receiverName: "XGoo Test Consignee",
    receiverPhone: "9876500002",
    receiverEmail: "xgoo.consignee@example.com",
    receiverAddress: "14 Baker Street, Marylebone",
    receiverCity: "London",
    receiverState: "England",
    receiverPincode: "W1U3BW",
    receiverCountry: "United Kingdom",
    weight: "1.00",
    length: "20",
    width: "15",
    height: "10",
    volumetricWeight: "0.12",
    chargeableWeight: "1.00",
    numberOfPieces: 1,
    contentDescription: "FESTIVE ARTICLES",
    declaredValue: "500.00",
    products: [
      {
        name: "FESTIVE ARTICLES",
        hsn: "95059090",
        units: "1",
        unitPrice: "500",
        discount: "0",
        weight: "1.00",
      },
    ],
    serviceType: "air",
    partnerProduct: "INTL SAMPLE",
    partnerVendor: "WORLD FIRST",
    partnerService: "WF EX HYD DPD UK",
    incoTerms: "DAP",
    invoiceNumber: `XGOOTEST${Date.now().toString().slice(-6)}`,
    invoiceDate: new Date().toISOString().slice(0, 10),
    currency: "INR",
    shipmentPurpose: "UNSOLICITED GIFT - NOT FOR SALE",
    status: "booked",
    baseAmount: "0",
    totalAmount: "0",
    isDemo: true,
    partnerSyncStatus: "pending",
  });

  await storage.createPayment({
    shipmentId: shipment.id,
    amount: "0",
    paymentMode: "credit",
    paymentStatus: "completed",
    notes: "World First API test booking — not manifested",
    paidAt: new Date(),
  });

  const snapshot = await startBooking({
    officeId: partner.officeId,
    shipmentId: shipment.id,
    operatorUserId: null,
  });

  const updated = await storage.getShipment(shipment.id);
  console.log(
    JSON.stringify(
      {
        hubPath: `/shipments/${shipment.id}`,
        bookingNumber: shipment.bookingNumber,
        jobStatus: snapshot.job?.status || null,
        awb: snapshot.job?.awbNumber || updated?.externalAwb || null,
        vendorAwb: snapshot.job?.bookingReference || null,
        error: snapshot.job?.error || snapshot.issues.map((issue) => issue.message).join(" • ") || null,
        manifested: false,
      },
      null,
      2,
    ),
  );
  if (snapshot.job?.status !== "booked") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
