import type { Shipment } from "@shared/schema";
import { triggerTransactionalEmail } from "./integrations/email";
import {
  triggerReceiverTrackingWhatsApp,
  triggerShipmentStatusWhatsApp,
} from "./integrations/whatsapp-notifications";

const ORANGE = "#FF4907";

type ShipmentNotify = Pick<
  Shipment,
  | "senderName"
  | "senderPhone"
  | "senderEmail"
  | "receiverName"
  | "receiverPhone"
  | "receiverEmail"
  | "bookingNumber"
  | "senderCity"
  | "receiverCity"
  | "totalAmount"
  | "status"
> & {
  awbNumber?: string | null;
  externalAwb?: string | null;
};

function partnerAwb(shipment: ShipmentNotify): string {
  return (shipment.awbNumber || shipment.externalAwb || "").trim();
}

function shipmentRoute(shipment: ShipmentNotify): string {
  return [shipment.senderCity, shipment.receiverCity].filter(Boolean).join(" → ") || "your route";
}

function last10(phone?: string | null): string {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function normalizeEmail(value?: string | null): string {
  return (value || "").trim().toLowerCase();
}

export function formatShipmentStatus(status: string): string {
  switch (status) {
    case "booked":
      return "Booked";
    case "picked_up":
      return "Picked up";
    case "in_transit":
      return "In transit";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}

function statusSentence(status: string): string {
  switch (status) {
    case "booked":
      return "is booked";
    case "picked_up":
      return "has been picked up";
    case "in_transit":
      return "is in transit";
    case "delivered":
      return "has been delivered";
    case "cancelled":
      return "has been cancelled";
    default:
      return `is now ${formatShipmentStatus(status).toLowerCase()}`;
  }
}

function formatAmount(value?: string | null): string | null {
  const amount = parseFloat(value || "");
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function trackingEmailHtml(input: {
  name: string;
  intro: string;
  bookingNumber: string;
  awb: string;
  route: string;
  statusLabel: string;
  amountLine?: string | null;
  trackUrl: string;
}): string {
  const amountRow = input.amountLine
    ? `<tr><td style="padding:6px 0;color:#71717a;">Amount</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(input.amountLine)}</td></tr>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b;">
  <div style="max-width:560px;margin:24px auto;background:#fff;border:1px solid #e4e4e7;padding:28px;">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:${ORANGE};">XGoo</p>
    <h1 style="margin:0 0 16px;font-size:22px;">Track your shipment</h1>
    <p style="margin:0 0 20px;line-height:1.5;">Hi ${escapeHtml(input.name)}, ${escapeHtml(input.intro)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#71717a;">Booking</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(input.bookingNumber)}</td></tr>
      <tr><td style="padding:6px 0;color:#71717a;">AWB</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(input.awb)}</td></tr>
      <tr><td style="padding:6px 0;color:#71717a;">Route</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(input.route)}</td></tr>
      <tr><td style="padding:6px 0;color:#71717a;">Status</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(input.statusLabel)}</td></tr>
      ${amountRow}
    </table>
    <p style="margin:24px 0 0;">
      <a href="${escapeHtml(input.trackUrl)}" style="display:inline-block;background:${ORANGE};color:#fff;text-decoration:none;padding:10px 18px;font-weight:600;">Track shipment</a>
    </p>
    <p style="margin:24px 0 0;font-size:12px;color:#71717a;">XGoo — a product of NSGroup. Questions? connect@xgoo.in</p>
  </div>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sendPartyEmail(input: {
  to: string | null;
  name: string;
  subject: string;
  intro: string;
  bookingNumber: string;
  awb: string;
  route: string;
  statusLabel: string;
  amountLine?: string | null;
  trackUrl: string;
}): void {
  if (!input.to) return;
  const text = [
    `Hi ${input.name}, ${input.intro}`,
    `Booking: ${input.bookingNumber}`,
    `AWB: ${input.awb}`,
    `Route: ${input.route}`,
    `Status: ${input.statusLabel}`,
    input.amountLine ? `Amount: ${input.amountLine}` : null,
    `Track: ${input.trackUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
  triggerTransactionalEmail({
    to: input.to,
    subject: input.subject,
    text,
    html: trackingEmailHtml({
      name: input.name,
      intro: input.intro,
      bookingNumber: input.bookingNumber,
      awb: input.awb,
      route: input.route,
      statusLabel: input.statusLabel,
      amountLine: input.amountLine,
      trackUrl: input.trackUrl,
    }),
  });
}

export function notifyShipmentTrackingChannels(
  whatsappSettings: unknown,
  shipment: ShipmentNotify,
  trackUrl: string,
  storeName?: string | null,
): void {
  const awb = partnerAwb(shipment) || shipment.bookingNumber;
  const route = shipmentRoute(shipment);
  const statusLabel = formatShipmentStatus(shipment.status || "booked");
  const amount = formatAmount(shipment.totalAmount);
  const senderEmail = normalizeEmail(shipment.senderEmail);
  const receiverEmail = normalizeEmail(shipment.receiverEmail);
  const samePhone =
    last10(shipment.senderPhone).length >= 10 &&
    last10(shipment.senderPhone) === last10(shipment.receiverPhone);
  const sameEmail = Boolean(senderEmail && receiverEmail && senderEmail === receiverEmail);

  sendPartyEmail({
    to: senderEmail || null,
    name: shipment.senderName,
    subject: `XGoo tracking ${awb} — ${shipment.bookingNumber}`,
    intro: `your shipment ${shipment.bookingNumber} is booked with AWB ${awb} (${route}).`,
    bookingNumber: shipment.bookingNumber,
    awb,
    route,
    statusLabel,
    amountLine: amount,
    trackUrl,
  });

  if (!sameEmail) {
    sendPartyEmail({
      to: receiverEmail || null,
      name: shipment.receiverName,
      subject: `XGoo shipment ${awb} is on the way`,
      intro: storeName
        ? `your order from ${storeName} is booked with XGoo Courier (AWB ${awb}).`
        : `a shipment is on the way to you (booking ${shipment.bookingNumber}, AWB ${awb}).`,
      bookingNumber: shipment.bookingNumber,
      awb,
      route,
      statusLabel,
      amountLine: null,
      trackUrl,
    });
  }

  if (!samePhone && shipment.receiverPhone) {
    triggerReceiverTrackingWhatsApp(whatsappSettings, {
      receiverName: shipment.receiverName,
      receiverPhone: shipment.receiverPhone,
      bookingNumber: shipment.bookingNumber,
      awb,
      trackUrl,
      storeName,
    });
  }
}

export function notifyShipmentStatusChannels(
  whatsappSettings: unknown,
  shipment: ShipmentNotify,
  trackUrl: string,
): void {
  const awb = partnerAwb(shipment) || shipment.bookingNumber;
  const route = shipmentRoute(shipment);
  const statusLabel = formatShipmentStatus(shipment.status);
  const sentence = statusSentence(shipment.status);
  const senderEmail = normalizeEmail(shipment.senderEmail);
  const receiverEmail = normalizeEmail(shipment.receiverEmail);
  const samePhone =
    last10(shipment.senderPhone).length >= 10 &&
    last10(shipment.senderPhone) === last10(shipment.receiverPhone);
  const sameEmail = Boolean(senderEmail && receiverEmail && senderEmail === receiverEmail);
  const amount = formatAmount(shipment.totalAmount);

  triggerShipmentStatusWhatsApp(whatsappSettings, {
    senderName: shipment.senderName,
    senderPhone: shipment.senderPhone,
    receiverName: shipment.receiverName,
    receiverPhone: samePhone ? "" : shipment.receiverPhone,
    bookingNumber: shipment.bookingNumber,
    awb,
    route,
    statusLabel,
    trackUrl,
  });

  sendPartyEmail({
    to: senderEmail || null,
    name: shipment.senderName,
    subject: `XGoo update: ${shipment.bookingNumber} ${statusLabel.toLowerCase()}`,
    intro: `your shipment ${shipment.bookingNumber} ${sentence} (AWB ${awb}, ${route}).`,
    bookingNumber: shipment.bookingNumber,
    awb,
    route,
    statusLabel,
    amountLine: amount,
    trackUrl,
  });

  if (!sameEmail) {
    sendPartyEmail({
      to: receiverEmail || null,
      name: shipment.receiverName,
      subject: `XGoo update: shipment ${awb} ${statusLabel.toLowerCase()}`,
      intro: `shipment ${shipment.bookingNumber} ${sentence}.`,
      bookingNumber: shipment.bookingNumber,
      awb,
      route,
      statusLabel,
      amountLine: null,
      trackUrl,
    });
  }
}
