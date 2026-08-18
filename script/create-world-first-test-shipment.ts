import "dotenv/config";
import { storage } from "../server/storage";
import { db } from "../server/db";
import { courierPartners } from "@shared/schema";
import { isWorldFirstPartner } from "@shared/world-first";

async function main() {
  const partners = await db.select().from(courierPartners);
  const partner = partners.find((row) => isWorldFirstPartner(row.code, row.name));
  if (!partner) {
    throw new Error(
      "No World First partner found. Add a partner named World First (code WF) first.",
    );
  }

  const shipment = await storage.createShipment({
    officeId: partner.officeId,
    courierPartnerId: partner.id,
    senderName: "XGoo Test Sender",
    senderPhone: "9876500001",
    senderAddress: "Plot 12, HITEC City, Madhapur",
    senderCity: "Hyderabad",
    senderState: "Telangana",
    senderPincode: "500081",
    receiverName: "World First Test Consignee",
    receiverPhone: "9876500002",
    receiverAddress: "14 MG Road, Ashok Nagar",
    receiverCity: "Bengaluru",
    receiverState: "Karnataka",
    receiverPincode: "560001",
    weight: "2.50",
    length: "30",
    width: "20",
    height: "15",
    numberOfPieces: 1,
    contentDescription: "Documents (dummy test — do not dispatch)",
    declaredValue: "1000.00",
    serviceType: "air",
    status: "booked",
    baseAmount: "0",
    totalAmount: "0",
    isDemo: true,
    partnerSyncStatus: "pending",
  });

  await storage.createPayment({
    shipmentId: shipment.id,
    amount: "0",
    paymentMode: "cash",
    paymentStatus: "completed",
    notes: "Dummy World First booking test",
    paidAt: new Date(),
  });

  console.log(JSON.stringify({
    ok: true,
    partner: { id: partner.id, code: partner.code, name: partner.name },
    shipmentId: shipment.id,
    bookingNumber: shipment.bookingNumber,
    path: `/shipments/${shipment.id}`,
  }, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
