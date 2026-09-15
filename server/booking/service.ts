import type { BookingEvent, BookingJob, CourierPartner, ShipmentWithRelations } from "@shared/schema";
import {
  resolveBookingMethod,
  type BookingEventLevel,
  type BookingJobStatus,
  type BookingValidationIssue,
} from "@shared/booking-engine";
import { storage } from "../storage";
import { getConnectorForPartner } from "./registry";
import { validateShipmentForBooking } from "./validate";
import { isWorldFirstPartner, worldFirstWorkflowStatus } from "@shared/world-first";
import type { BookingWorkflowStep } from "@shared/world-first";
import { issueAutofillToken } from "./autofill-token";
import { isDelhiveryPartner } from "@shared/delhivery";
import { getDelhiveryConfigFromEnv, cancelDelhiveryShipment } from "../integrations/delhivery";
import { notifyAwbCreated } from "../pickup-service";

export class BookingEngineError extends Error {
  constructor(
    message: string,
    public httpStatus: number,
    public code: string,
  ) {
    super(message);
    this.name = "BookingEngineError";
  }
}

export type BookingSnapshot = {
  job: BookingJob | null;
  events: BookingEvent[];
  method: ReturnType<typeof resolveBookingMethod>;
  connectorId: string | null;
  ready: boolean;
  issues: BookingValidationIssue[];
  workflow: BookingWorkflowStep[];
  autofillToken: string;
};

async function requireShipment(officeId: string, shipmentId: string): Promise<ShipmentWithRelations> {
  const shipment = await storage.getShipment(shipmentId);
  if (!shipment || shipment.officeId !== officeId) {
    throw new BookingEngineError("Shipment not found", 404, "not_found");
  }
  return shipment;
}

async function requirePartner(
  shipment: ShipmentWithRelations,
): Promise<CourierPartner> {
  const partnerId = shipment.courierPartnerId;
  const partner = partnerId
    ? await storage.getPartner(partnerId)
    : shipment.courierPartner ?? undefined;
  if (!partner || partner.officeId !== shipment.officeId) {
    throw new BookingEngineError("Select a courier partner before booking.", 400, "partner_missing");
  }
  return partner;
}

export async function getBookingSnapshot(
  officeId: string,
  shipmentId: string,
): Promise<BookingSnapshot> {
  const shipment = await requireShipment(officeId, shipmentId);
  const partner = shipment.courierPartnerId
    ? (await storage.getPartner(shipment.courierPartnerId)) ?? shipment.courierPartner ?? null
    : shipment.courierPartner ?? null;
  const issues = validateShipmentForBooking(shipment, partner);
  const job = (await storage.getLatestBookingJob(shipmentId)) ?? null;
  const events = job ? await storage.getBookingEvents(job.id) : [];
  const connector = partner ? getConnectorForPartner(partner) : null;
  const workflow =
    partner && isWorldFirstPartner(partner.code, partner.name)
      ? worldFirstWorkflowStatus(
          events.map((event) => event.step),
          job?.status,
        )
      : [];
  return {
    job,
    events,
    method: partner ? resolveBookingMethod(partner) : "manual",
    connectorId: connector?.id ?? null,
    ready: issues.length === 0,
    issues,
    workflow,
    autofillToken: issueAutofillToken(shipmentId),
  };
}

export async function validateBooking(officeId: string, shipmentId: string) {
  const snapshot = await getBookingSnapshot(officeId, shipmentId);
  return {
    ready: snapshot.ready,
    issues: snapshot.issues,
    method: snapshot.method,
    job: snapshot.job,
  };
}

export async function startBooking(input: {
  officeId: string;
  shipmentId: string;
  operatorUserId?: string | null;
  retry?: boolean;
}): Promise<BookingSnapshot> {
  const shipment = await requireShipment(input.officeId, input.shipmentId);
  const partner = await requirePartner(shipment);
  const method = resolveBookingMethod(partner);
  const connector = getConnectorForPartner(partner);

  let job = await storage.getLatestBookingJob(shipment.id);

  if (job?.status === "booked" || shipment.externalAwb?.trim()) {
    throw new BookingEngineError(
      "This shipment is already booked with the courier. A second booking was blocked.",
      409,
      "already_booked",
    );
  }

  if (job?.status === "booking") {
    throw new BookingEngineError(
      "A booking attempt is already in progress for this shipment.",
      409,
      "in_progress",
    );
  }

  const issues = validateShipmentForBooking(shipment, partner);
  if (issues.length > 0) {
    if (!job) {
      job = await storage.createBookingJob({
        officeId: input.officeId,
        shipmentId: shipment.id,
        courierPartnerId: partner.id,
        status: "action_required",
        bookingMethod: method,
        operatorUserId: input.operatorUserId || undefined,
        actionRequiredReason: issues.map((issue) => issue.message).join(" • "),
        nextAction: "document",
        error: issues.map((issue) => issue.message).join(" "),
      });
    } else {
      job = (await storage.updateBookingJob(job.id, {
        status: "action_required",
        bookingMethod: method,
        error: issues.map((issue) => issue.message).join(" "),
        actionRequiredReason: issues.map((issue) => issue.message).join(" • "),
        nextAction: "document",
      })) ?? job;
    }
    await storage.addBookingEvent({
      jobId: job.id,
      shipmentId: shipment.id,
      level: "warn",
      step: "validation",
      message: `Action required: ${issues.map((issue) => issue.message).join(" • ")}`,
    });
    return getBookingSnapshot(input.officeId, shipment.id);
  }

  if (!job) {
    job = await storage.createBookingJob({
      officeId: input.officeId,
      shipmentId: shipment.id,
      courierPartnerId: partner.id,
      status: "ready_to_book",
      bookingMethod: method,
      operatorUserId: input.operatorUserId || null,
    });
    await storage.addBookingEvent({
      jobId: job.id,
      shipmentId: shipment.id,
      level: "info",
      step: "created",
      message: `Booking job created for ${partner.name} (${method}).`,
    });
  }

  const nextAttempt = (job.attemptCount ?? 0) + 1;
  if (input.retry && nextAttempt > (job.maxAttempts ?? 3)) {
    throw new BookingEngineError(
      `Retry limit reached (${job.maxAttempts} attempts). Switch courier or book manually.`,
      409,
      "retry_exhausted",
    );
  }

  job = (await storage.updateBookingJob(job.id, {
    status: "booking",
    bookingMethod: method,
    courierPartnerId: partner.id,
    attemptCount: nextAttempt,
    error: null,
    actionRequiredReason: null,
    nextAction: null,
    startedAt: new Date(),
    operatorUserId: input.operatorUserId || job.operatorUserId,
  })) ?? job;

  await storage.addBookingEvent({
    jobId: job.id,
    shipmentId: shipment.id,
    level: "info",
    step: "start",
    message: input.retry
      ? `Retry ${nextAttempt} of ${job.maxAttempts} via ${connector.id}`
      : `Booking started via ${connector.id}`,
  });

  await storage.updateShipmentPartnerSync(shipment.id, {
    partnerSyncStatus: "submitted",
    partnerSyncError: null,
  });

  const log = async (step: string, message: string, level: BookingEventLevel = "info") => {
    await storage.addBookingEvent({
      jobId: job!.id,
      shipmentId: shipment.id,
      level,
      step,
      message,
    });
  };

  try {
    const result = await connector.createShipment({
      shipment,
      partner,
      jobId: job.id,
      log,
    });

    if (!result.ok) {
      await storage.updateBookingJob(job.id, {
        status: "booking_failed",
        error: result.error,
        completedAt: new Date(),
      });
      await storage.updateShipmentPartnerSync(shipment.id, {
        partnerSyncStatus: "failed",
        partnerSyncError: result.error,
      });
      await log("failed", result.error, "error");
      return getBookingSnapshot(input.officeId, shipment.id);
    }

    if (result.status === "booked") {
      await storage.updateBookingJob(job.id, {
        status: "booked",
        awbNumber: result.awb || null,
        bookingReference: result.bookingReference || result.awb || null,
        labelUrl: result.labelUrl || null,
        error: null,
        actionRequiredReason: null,
        nextAction: "none",
        completedAt: new Date(),
      });
      const updatedShipment = await storage.updateShipmentPartnerSync(shipment.id, {
        partnerSyncStatus: "synced",
        externalAwb: result.awb || null,
        awbNumber: shipment.awbNumber?.trim() ? shipment.awbNumber : result.awb || null,
        partnerSyncError: null,
        partnerSyncedAt: new Date(),
      });
      if (!shipment.awbNumber?.trim() && !shipment.externalAwb?.trim() && updatedShipment) {
        void notifyAwbCreated(updatedShipment).catch((error) => {
          console.error("AWB WhatsApp notify failed:", error);
        });
      }
      await log("complete", `Booked with AWB ${result.awb || "n/a"}`);
      return getBookingSnapshot(input.officeId, shipment.id);
    }

    await storage.updateBookingJob(job.id, {
      status: "action_required",
      actionRequiredReason: result.reason || "Operator action is required.",
      nextAction: result.nextAction || "manual",
      error: null,
    });
    await storage.updateShipmentPartnerSync(shipment.id, {
      partnerSyncStatus: "opened",
      partnerSyncError: result.reason || null,
    });
    await log("action_required", result.reason || "Operator action is required.", "warn");
    return getBookingSnapshot(input.officeId, shipment.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking failed";
    await storage.updateBookingJob(job.id, {
      status: "booking_failed",
      error: message,
      completedAt: new Date(),
    });
    await storage.updateShipmentPartnerSync(shipment.id, {
      partnerSyncStatus: "failed",
      partnerSyncError: message,
    });
    await log("failed", message, "error");
    return getBookingSnapshot(input.officeId, shipment.id);
  }
}

export async function resumeBooking(input: {
  officeId: string;
  shipmentId: string;
  operatorUserId?: string | null;
}): Promise<BookingSnapshot> {
  const shipment = await requireShipment(input.officeId, input.shipmentId);
  await requirePartner(shipment);
  const job = await storage.getLatestBookingJob(shipment.id);
  if (!job) {
    throw new BookingEngineError("Start booking first, then continue after login.", 400, "no_job");
  }
  if (job.status === "booked" || shipment.externalAwb?.trim()) {
    throw new BookingEngineError(
      "This shipment is already booked with the courier. A second booking was blocked.",
      409,
      "already_booked",
    );
  }
  await storage.addBookingEvent({
    jobId: job.id,
    shipmentId: shipment.id,
    level: "info",
    step: "resume",
    message:
      "Operator continuing after login (saved password or OTP). XGoo does not store partner credentials.",
  });
  await storage.updateBookingJob(job.id, {
    operatorUserId: input.operatorUserId || job.operatorUserId,
    nextAction: "browser",
    actionRequiredReason: "Logged in. Open AWB Entry, Autofill, then paste the partner AWB in XGoo.",
  });
  return getBookingSnapshot(input.officeId, shipment.id);
}

export async function cancelPartnerBooking(input: {
  officeId: string;
  shipmentId: string;
  operatorUserId: string;
}): Promise<BookingSnapshot> {
  const shipment = await requireShipment(input.officeId, input.shipmentId);
  const partner = await requirePartner(shipment);
  if (shipment.status === "cancelled") {
    return getBookingSnapshot(input.officeId, shipment.id);
  }
  if (shipment.status === "delivered") {
    throw new BookingEngineError("Delivered shipments cannot be cancelled.", 409, "not_cancellable");
  }

  const waybill = (shipment.externalAwb || shipment.awbNumber || "").trim();
  if (!isDelhiveryPartner(partner.code, partner.name) || resolveBookingMethod(partner) !== "api") {
    throw new BookingEngineError(
      "Courier cancel from XGoo is only available for Delhivery API bookings.",
      400,
      "unsupported",
    );
  }
  if (!waybill) {
    throw new BookingEngineError("No Delhivery AWB to cancel. Book the shipment first.", 400, "no_awb");
  }
  const config = getDelhiveryConfigFromEnv();
  if (!config) {
    throw new BookingEngineError(
      "Delhivery API is not configured. Add DELHIVERY_API_TOKEN, then restart the server.",
      400,
      "not_configured",
    );
  }

  await cancelDelhiveryShipment(config, waybill);

  await storage.updateShipmentStatus(shipment.id, "cancelled");
  const job = await storage.getLatestBookingJob(shipment.id);
  if (job) {
    await storage.updateBookingJob(job.id, {
      status: "cancelled",
      error: null,
      actionRequiredReason: null,
      nextAction: "none",
      completedAt: new Date(),
      operatorUserId: input.operatorUserId || job.operatorUserId,
    });
    await storage.addBookingEvent({
      jobId: job.id,
      shipmentId: shipment.id,
      level: "info",
      step: "cancelled",
      message: `Cancelled Delhivery AWB ${waybill}`,
    });
  }
  await storage.updateShipmentPartnerSync(shipment.id, {
    partnerSyncError: `Cancelled on Delhivery (${waybill})`,
  });
  return getBookingSnapshot(input.officeId, shipment.id);
}

export async function testPartnerConnection(partner: CourierPartner) {
  const method = resolveBookingMethod(partner);
  const connector = getConnectorForPartner(partner);
  const result = await connector.testConnection(partner);
  return { ...result, method, connectorId: connector.id };
}

export function mapBookingStatusToUi(status: BookingJobStatus | string | null | undefined): string {
  return status || "draft";
}
