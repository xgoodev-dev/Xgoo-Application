import type { CourierPartner, Shipment } from "@shared/schema";
import type { BookingValidationIssue } from "@shared/booking-engine";
import { resolveBookingMethod } from "@shared/booking-engine";
import { getDelhiveryConfigFromEnv } from "../integrations/delhivery";

function digits(value: string | null | undefined): string {
  return (value || "").replace(/\D/g, "");
}

export function validateShipmentForBooking(
  shipment: Shipment,
  partner: CourierPartner | null | undefined,
): BookingValidationIssue[] {
  const issues: BookingValidationIssue[] = [];

  if (!partner) {
    issues.push({ code: "partner_missing", message: "Select a courier partner before booking." });
    return issues;
  }

  if (partner.isActive === false) {
    issues.push({ code: "partner_inactive", message: `${partner.name} is inactive.` });
  }

  const method = resolveBookingMethod(partner);
  if (method === "disabled") {
    issues.push({ code: "partner_disabled", message: `Booking is disabled for ${partner.name}.` });
  }

  if (!(shipment.senderName || "").trim()) {
    issues.push({ code: "sender_name", message: "Sender name is missing.", field: "senderName" });
  }
  if (digits(shipment.senderPhone).length < 10) {
    issues.push({
      code: "sender_phone",
      message: "Sender phone must have at least 10 digits.",
      field: "senderPhone",
    });
  }
  if (!(shipment.senderAddress || "").trim()) {
    issues.push({ code: "sender_address", message: "Sender address is missing.", field: "senderAddress" });
  }

  if (!(shipment.receiverName || "").trim()) {
    issues.push({ code: "receiver_name", message: "Receiver name is missing.", field: "receiverName" });
  }
  if (digits(shipment.receiverPhone).length < 10) {
    issues.push({
      code: "receiver_phone",
      message: "Receiver phone must have at least 10 digits.",
      field: "receiverPhone",
    });
  }
  if (!(shipment.receiverAddress || "").trim()) {
    issues.push({
      code: "receiver_address",
      message: "Receiver address is missing.",
      field: "receiverAddress",
    });
  }

  const senderPin = (shipment.senderPincode || "").trim();
  if (senderPin && !/^\d{6}$/.test(senderPin)) {
    issues.push({
      code: "sender_pincode",
      message: "Sender pincode must be 6 digits.",
      field: "senderPincode",
    });
  }
  const receiverPin = (shipment.receiverPincode || "").trim();
  if (receiverPin && !/^\d{6}$/.test(receiverPin)) {
    issues.push({
      code: "receiver_pincode",
      message: "Receiver pincode must be 6 digits.",
      field: "receiverPincode",
    });
  }

  const weight = Number.parseFloat(String(shipment.weight ?? "0"));
  if (!Number.isFinite(weight) || weight <= 0) {
    issues.push({ code: "weight", message: "Package weight is required.", field: "weight" });
  }

  if (method === "api") {
    const config = getDelhiveryConfigFromEnv();
    if (!config) {
      issues.push({
        code: "api_not_configured",
        message: "Courier API credentials are not configured on the server.",
      });
    }
  }

  if (method === "browser_automation" && partner.automationEnabled === false) {
    issues.push({
      code: "automation_off",
      message: `Browser assist is turned off for ${partner.name}.`,
    });
  }

  return issues;
}
