import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { offices, payments, type BookingRequest, type PickupJob, type Quotation, type Shipment } from "@shared/schema";
import { websiteTrackPath } from "@shared/track-links";
import { db } from "./db";
import { triggerCustomerNotification } from "./customer-notifications";
import {
  triggerInvoiceWhatsApp,
  triggerQuoteWhatsApp,
  triggerReceiverTrackingWhatsApp,
  triggerShipmentPartyWhatsApp,
  triggerTrackingWhatsApp,
} from "./integrations/whatsapp-notifications";
import { triggerPickupPartnerNotification } from "./pickup-notifications";
import { storage } from "./storage";

async function officeById(officeId: string) {
  const [office] = await db.select().from(offices).where(eq(offices.id, officeId)).limit(1);
  return office;
}

function publicOrigin(whatsappSettings?: unknown) {
  const fromSettings =
    whatsappSettings &&
    typeof whatsappSettings === "object" &&
    "publicAppBaseUrl" in whatsappSettings
      ? String((whatsappSettings as { publicAppBaseUrl?: string }).publicAppBaseUrl || "").trim()
      : "";
  return fromSettings || process.env.PUBLIC_APP_URL?.trim() || "https://www.xgoo.in";
}

export function publicQuoteUrl(acceptToken: string, whatsappSettings?: unknown) {
  return `${publicOrigin(whatsappSettings).replace(/\/$/, "")}/quote/${encodeURIComponent(acceptToken)}`;
}

export function publicTrackUrl(ref: string, whatsappSettings?: unknown) {
  return `${publicOrigin(whatsappSettings).replace(/\/$/, "")}${websiteTrackPath(ref)}`;
}

const STORE_VISIT_OPEN_STATUSES = new Set([
  "assigned",
  "accepted",
  "en_route",
  "arrived",
  "inspected",
  "quote_sent",
  "quote_accepted",
  "packed",
]);

function lastPhoneDigits(value?: string | null) {
  const digits = (value || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export async function isProBooking(request: BookingRequest) {
  if (request.source === "b2b_daily") return true;
  if (!request.customerUserId) return false;
  const user = await storage.getCustomerUser(request.customerUserId);
  return user?.accountType === "business";
}

async function addProBillForAcceptedQuote(quotation: Quotation, request: BookingRequest) {
  if (!(await isProBooking(request))) return false;
  const existing =
    (await storage.getPaymentByQuotation(quotation.id)) ||
    (request.convertedShipmentId
      ? await storage.getPaymentByShipment(request.convertedShipmentId)
      : undefined);
  if (existing) {
    if (!existing.quotationId) {
      await db.update(payments).set({ quotationId: quotation.id }).where(eq(payments.id, existing.id));
    }
    return true;
  }
  await storage.createPayment({
    shipmentId: request.convertedShipmentId || null,
    quotationId: quotation.id,
    amount: quotation.totalAmount,
    paymentMode: "credit",
    paymentStatus: "pending",
    notes: "Added to XGoo Pro bills after quote accept",
  });
  return true;
}

export type StoreVisitParcel = {
  id: string;
  status: string;
  requestNumber: string;
  receiverName: string;
  receiverCity: string | null;
  quotationAmount: string | null;
  quotationStatus: string | null;
};

export async function getStoreVisit(job: PickupJob) {
  const request = await storage.getBookingRequest(job.bookingRequestId);
  if (!request) {
    return { isBusinessStore: false, parcels: [] as StoreVisitParcel[] };
  }
  const isBusinessStore = await isProBooking(request);
  const jobs = job.partnerId ? await storage.getPickupJobsByPartner(job.partnerId) : [job];
  const parcels: StoreVisitParcel[] = [];
  const seen = new Set<string>();

  for (const other of jobs) {
    const include = other.id === job.id || STORE_VISIT_OPEN_STATUSES.has(other.status);
    if (!include || seen.has(other.id)) continue;
    const otherRequest =
      other.id === job.id ? request : await storage.getBookingRequest(other.bookingRequestId);
    if (!otherRequest) continue;
    const sameUser = Boolean(request.customerUserId && otherRequest.customerUserId === request.customerUserId);
    const samePhone = lastPhoneDigits(request.senderPhone) === lastPhoneDigits(otherRequest.senderPhone);
    if (!sameUser && !samePhone) continue;
    seen.add(other.id);
    const quotation = other.quotationId ? await storage.getQuotation(other.quotationId) : undefined;
    parcels.push({
      id: other.id,
      status: other.status,
      requestNumber: otherRequest.requestNumber,
      receiverName: otherRequest.receiverName,
      receiverCity: otherRequest.receiverCity || null,
      quotationAmount: quotation?.totalAmount || null,
      quotationStatus: quotation?.status || null,
    });
  }

  parcels.sort((a, b) => a.requestNumber.localeCompare(b.requestNumber));
  return { isBusinessStore, parcels };
}

export async function quoteStoreVisit(job: PickupJob) {
  const visit = await getStoreVisit(job);
  const quoted: Array<{ jobId: string; quotationId: string; totalAmount: string; quoteUrl: string }> = [];

  for (const parcel of visit.parcels) {
    const parcelJob = parcel.id === job.id ? job : await storage.getPickupJob(parcel.id);
    if (!parcelJob || !["inspected", "quote_sent"].includes(parcelJob.status)) continue;
    const request = await storage.getBookingRequest(parcelJob.bookingRequestId);
    if (!request) continue;
    const result = await createPickupQuotation({
      job: parcelJob,
      request,
      weight: String(parcelJob.actualWeight || request.weight || "1"),
      pieces: parcelJob.actualPieces || request.numberOfPieces || 1,
      contents: parcelJob.actualContents,
    });
    quoted.push({
      jobId: parcelJob.id,
      quotationId: result.quotation.id,
      totalAmount: String(result.quotation.totalAmount),
      quoteUrl: result.quoteUrl,
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
  }

  return { ...visit, quoted };
}

export async function createPickupQuotation(input: {
  job: PickupJob;
  request: BookingRequest;
  weight: string;
  pieces: number;
  contents?: string | null;
  notes?: string | null;
  baseAmount?: string;
  additionalCharges?: string;
  gstAmount?: string;
  totalAmount?: string;
  courierPartnerId?: string | null;
}) {
  const quoteInput = {
    serviceType: (input.request.serviceType === "air" ? "air" : "surface") as "air" | "surface",
    shipmentType: input.request.shipmentType === "international" ? "international" : "domestic",
    senderPincode: input.request.senderPincode || undefined,
    receiverPincode: input.request.receiverPincode || undefined,
    weight: parseFloat(input.weight) || 0,
    declaredValue:
      input.request.declaredValue != null
        ? parseFloat(String(input.request.declaredValue))
        : undefined,
  };

  const quotes = await storage.quoteAllPartners(input.job.officeId, quoteInput);
  const best = quotes[0];
  const courierPartnerId = input.courierPartnerId || best?.courierPartnerId || null;
  const baseAmount = input.baseAmount || (best ? String(best.sellPrice) : "0");
  const additionalCharges = input.additionalCharges || "0";
  const gstAmount = input.gstAmount || "0";
  const computedTotal =
    parseFloat(baseAmount || "0") + parseFloat(additionalCharges || "0") + parseFloat(gstAmount || "0");
  const totalAmount = input.totalAmount || (best ? String(best.sellPrice) : computedTotal.toFixed(2));
  const acceptToken = randomUUID();

  const quotation = await storage.createQuotation({
    officeId: input.job.officeId,
    customerName: input.request.senderName,
    customerPhone: input.request.senderPhone,
    customerEmail: input.request.senderEmail || null,
    senderCity: input.request.senderCity,
    senderState: input.request.senderState,
    senderPincode: input.request.senderPincode,
    receiverCity: input.request.receiverCity,
    receiverState: input.request.receiverState,
    receiverPincode: input.request.receiverPincode,
    weight: input.weight,
    numberOfPieces: input.pieces,
    contentDescription: input.contents || input.request.contentDescription,
    declaredValue: input.request.declaredValue,
    serviceType: input.request.serviceType || "surface",
    courierPartnerId,
    baseAmount,
    additionalCharges,
    gstAmount,
    totalAmount,
    status: "sent",
    notes: input.notes || null,
    bookingRequestId: input.request.id,
    pickupJobId: input.job.id,
    acceptToken,
  });

  await storage.updatePickupJob(input.job.id, {
    quotationId: quotation.id,
    status: "quote_sent",
    quoteSentAt: new Date(),
  });

  const office = await officeById(input.job.officeId);
  const quoteUrl = publicQuoteUrl(acceptToken, office?.whatsappSettings);

  triggerCustomerNotification(
    input.request.customerUserId,
    "Quote ready",
    `Accept the pickup quote for request #${input.request.requestNumber} — ₹${totalAmount}.`,
    "quote_sent",
    {
      quotationId: quotation.id,
      acceptToken,
      bookingRequestId: input.request.id,
      pickupJobId: input.job.id,
    },
  );

  return { quotation, quoteUrl, office };
}

export async function acceptPickupQuotation(quotation: Quotation) {
  if (quotation.status === "accepted" && quotation.pickupJobId) {
    const existingJob = await storage.getPickupJob(quotation.pickupJobId);
    const existingRequest = quotation.bookingRequestId
      ? await storage.getBookingRequest(quotation.bookingRequestId)
      : undefined;
    const billed = existingRequest ? await addProBillForAcceptedQuote(quotation, existingRequest) : false;
    return {
      quotation,
      job: existingJob,
      shipment: existingJob?.shipmentId
        ? await storage.getShipment(existingJob.shipmentId)
        : undefined,
      billed,
    };
  }
  if (quotation.status !== "sent") {
    throw Object.assign(new Error("This quote is no longer available."), { status: 400 });
  }

  const job = quotation.pickupJobId ? await storage.getPickupJob(quotation.pickupJobId) : undefined;
  const request = quotation.bookingRequestId
    ? await storage.getBookingRequest(quotation.bookingRequestId)
    : undefined;
  if (!job || !request) {
    throw Object.assign(new Error("Pickup job was not found for this quote."), { status: 404 });
  }

  const accepted = await storage.updateQuotation(quotation.id, {
    status: "accepted",
    acceptedAt: new Date(),
  });
  const updatedJob = await storage.updatePickupJob(job.id, {
    status: "quote_accepted",
    quoteAcceptedAt: new Date(),
  });

  const billed = await addProBillForAcceptedQuote(accepted || quotation, request);

  triggerPickupPartnerNotification(
    job.partnerId,
    "Quote accepted",
    `${request.senderName} accepted the quote. Pack the parcel and bring it to the XGoo store.`,
    { jobId: job.id, quotationId: quotation.id },
  );
  triggerCustomerNotification(
    request.customerUserId,
    "Quote accepted",
    billed
      ? `₹${accepted?.totalAmount || quotation.totalAmount} is on your Bills. The partner will pack after this approval.`
      : "XGoo will pack this parcel and raise the shipment after it reaches the store.",
    "quote_accepted",
    { bookingRequestId: request.id, quotationId: quotation.id, billed },
  );

  return { quotation: accepted || quotation, job: updatedJob, shipment: undefined, billed };
}

export async function raisePickupShipmentAtHub(job: PickupJob) {
  if (job.shipmentId) {
    const shipment = await storage.getShipment(job.shipmentId);
    if (job.status === "at_hub" || job.status === "awb_created" || job.status === "completed") {
      return { job, shipment };
    }
    const updatedJob = await storage.updatePickupJob(job.id, { status: "at_hub" });
    return { job: updatedJob, shipment };
  }
  const request = await storage.getBookingRequest(job.bookingRequestId);
  const quotation = job.quotationId ? await storage.getQuotation(job.quotationId) : undefined;
  if (!request || !quotation) {
    throw Object.assign(new Error("Quote and booking are required before the shipment can be raised."), {
      status: 400,
    });
  }
  if (quotation.status !== "accepted") {
    throw Object.assign(new Error("The store must accept the quote before the shipment is raised."), {
      status: 400,
    });
  }

  const partners = await storage.getPartnersByOffice(job.officeId);
  const courierPartnerId =
    quotation.courierPartnerId || partners.find((partner) => partner.isActive)?.id;
  if (!courierPartnerId) {
    throw Object.assign(new Error("Add a courier partner in Hub before converting this quote."), {
      status: 400,
    });
  }

  const weight = String(job.actualWeight || quotation.weight || request.weight || "1");
  const shipment = await storage.createShipment({
    officeId: job.officeId,
    branchId: job.branchId || request.branchId,
    courierPartnerId,
    senderName: request.senderName,
    senderPhone: request.senderPhone,
    senderAddress: request.senderAddress,
    senderAddressLine2: request.senderAddressLine2,
    senderCity: request.senderCity,
    senderState: request.senderState,
    senderPincode: request.senderPincode,
    receiverName: request.receiverName,
    receiverPhone: request.receiverPhone,
    receiverAddress: request.receiverAddress,
    receiverAddressLine2: request.receiverAddressLine2,
    receiverCity: request.receiverCity,
    receiverState: request.receiverState,
    receiverPincode: request.receiverPincode,
    weight,
    numberOfPieces: job.actualPieces || quotation.numberOfPieces || request.numberOfPieces || 1,
    contentDescription: job.actualContents || quotation.contentDescription || request.contentDescription,
    declaredValue: request.declaredValue,
    packagePhotoUrls: job.inspectionPhotoUrls || request.packagePhotoUrls,
    serviceType: request.serviceType === "air" ? "air" : "surface",
    baseAmount: quotation.baseAmount,
    additionalCharges: quotation.additionalCharges,
    gstAmount: quotation.gstAmount,
    totalAmount: quotation.totalAmount,
    status: "booked",
  });

  const existingPayment =
    (await storage.getPaymentByQuotation(quotation.id)) ||
    (await storage.getPaymentByShipment(shipment.id));
  if (existingPayment) {
    await db
      .update(payments)
      .set({
        shipmentId: shipment.id,
        quotationId: existingPayment.quotationId || quotation.id,
        amount: shipment.totalAmount,
      })
      .where(eq(payments.id, existingPayment.id));
  } else {
    await storage.createPayment({
      shipmentId: shipment.id,
      quotationId: quotation.id,
      amount: shipment.totalAmount,
      paymentMode: "credit",
      paymentStatus: "pending",
    });
  }

  await storage.updateBookingRequestStatus(request.id, "converted", shipment.id);
  const updatedJob = await storage.updatePickupJob(job.id, {
    shipmentId: shipment.id,
    status: "at_hub",
  });

  const office = await officeById(job.officeId);
  const trackUrl = publicTrackUrl(shipment.bookingNumber, office?.whatsappSettings);
  triggerShipmentPartyWhatsApp(office?.whatsappSettings, {
    senderName: request.senderName,
    senderPhone: request.senderPhone,
    receiverName: request.receiverName,
    receiverPhone: request.receiverPhone,
    bookingNumber: shipment.bookingNumber,
    route: [request.senderCity, request.receiverCity].filter(Boolean).join(" → ") || "your route",
    amount: quotation.totalAmount,
    trackUrl,
  });
  triggerCustomerNotification(
    request.customerUserId,
    "Shipment booked",
    `${shipment.bookingNumber} is booked for ${request.receiverName}. Amount ₹${quotation.totalAmount}.`,
    "shipment_created",
    { shipmentId: shipment.id, bookingRequestId: request.id, bookingNumber: shipment.bookingNumber },
  );

  return { job: updatedJob, shipment };
}

export async function rejectPickupQuotation(quotation: Quotation) {
  if (quotation.status !== "sent") {
    throw Object.assign(new Error("This quote is no longer available."), { status: 400 });
  }
  const rejected = await storage.updateQuotation(quotation.id, { status: "rejected" });
  if (quotation.pickupJobId) {
    const job = await storage.getPickupJob(quotation.pickupJobId);
    if (job) {
      await storage.updatePickupJob(job.id, { status: "inspected" });
      triggerPickupPartnerNotification(
        job.partnerId,
        "Quote declined",
        "The customer declined the quote. Review the inspection and send a new one.",
        { jobId: job.id, quotationId: quotation.id },
      );
    }
  }
  return rejected;
}

export async function ensureShipmentInvoice(shipment: Shipment) {
  const existing = await storage.getInvoiceByShipment(shipment.id);
  if (existing) return existing;
  return storage.createInvoice({
    shipmentId: shipment.id,
    invoiceNumber: `INV${Date.now().toString(36).toUpperCase()}`,
    subtotal: shipment.baseAmount || shipment.totalAmount,
    gstAmount: shipment.gstAmount || "0",
    totalAmount: shipment.totalAmount,
  });
}

export async function notifyAwbCreated(shipment: Shipment) {
  const awb = (shipment.awbNumber || shipment.externalAwb || "").trim();
  if (!awb) return;
  const invoice = await ensureShipmentInvoice(shipment);
  const office = await officeById(shipment.officeId);
  const settings = office?.whatsappSettings;
  const trackUrl = publicTrackUrl(awb, settings);
  triggerTrackingWhatsApp(settings, shipment, trackUrl);
  triggerInvoiceWhatsApp(settings, shipment, invoice.invoiceNumber, trackUrl);
  triggerReceiverTrackingWhatsApp(settings, {
    receiverName: shipment.receiverName,
    receiverPhone: shipment.receiverPhone,
    bookingNumber: shipment.bookingNumber,
    trackUrl,
  });
}
