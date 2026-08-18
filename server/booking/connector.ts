import type { CourierPartner, ShipmentWithRelations } from "@shared/schema";
import type { BookingEventLevel, BookingMethod } from "@shared/booking-engine";

export type BookingNextAction = "browser" | "login" | "otp" | "manual" | "payment" | "document" | "none";

export type ConnectorSuccess = {
  ok: true;
  status: "booked" | "action_required";
  awb?: string;
  bookingReference?: string;
  labelUrl?: string;
  reason?: string;
  nextAction?: BookingNextAction;
};

export type ConnectorFailure = {
  ok: false;
  status: "booking_failed";
  error: string;
};

export type ConnectorResult = ConnectorSuccess | ConnectorFailure;

export type ConnectorContext = {
  shipment: ShipmentWithRelations;
  partner: CourierPartner;
  jobId: string;
  log: (step: string, message: string, level?: BookingEventLevel) => Promise<void>;
};

export interface CourierConnector {
  id: string;
  method: BookingMethod;
  testConnection(partner: CourierPartner): Promise<{ ok: boolean; message: string }>;
  createShipment(ctx: ConnectorContext): Promise<ConnectorResult>;
}
