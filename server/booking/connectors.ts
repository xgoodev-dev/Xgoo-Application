import { isDelhiveryPartner } from "@shared/delhivery";
import { partnerPortalMismatch } from "@shared/partner-portal";
import { resolvePartnerPortalUrl } from "@shared/partner-sync";
import type { CourierPartner } from "@shared/schema";
import { createDelhiveryShipment, getDelhiveryConfigFromEnv } from "../integrations/delhivery";
import type { ConnectorContext, ConnectorResult, CourierConnector } from "./connector";

export const delhiveryApiConnector: CourierConnector = {
  id: "delhivery_api",
  method: "api",
  async testConnection() {
    const config = getDelhiveryConfigFromEnv();
    if (!config) {
      return {
        ok: false,
        message: "Delhivery API is not configured. Set DELHIVERY_API_TOKEN and DELHIVERY_PICKUP_LOCATION.",
      };
    }
    return {
      ok: true,
      message: `Delhivery API ready (${config.baseUrl}, pickup ${config.pickupLocation}).`,
    };
  },
  async createShipment(ctx: ConnectorContext): Promise<ConnectorResult> {
    if (!isDelhiveryPartner(ctx.partner.code, ctx.partner.name)) {
      return { ok: false, status: "booking_failed", error: "This API connector only supports Delhivery." };
    }

    const existingAwb = ctx.shipment.externalAwb?.trim();
    if (existingAwb) {
      await ctx.log("duplicate_check", `Shipment already has partner AWB ${existingAwb}`);
      return { ok: true, status: "booked", awb: existingAwb, bookingReference: existingAwb };
    }

    const config = getDelhiveryConfigFromEnv();
    if (!config) {
      return {
        ok: false,
        status: "booking_failed",
        error: "Delhivery API is not configured on the server.",
      };
    }

    await ctx.log("connecting", "Connecting to Delhivery API");
    const result = await createDelhiveryShipment(config, {
      shipment: ctx.shipment,
      pickupLocation: config.pickupLocation,
    });
    await ctx.log("booked", `Delhivery assigned waybill ${result.waybill}`);
    return {
      ok: true,
      status: "booked",
      awb: result.waybill,
      bookingReference: result.waybill,
    };
  },
};

export const browserAssistConnector: CourierConnector = {
  id: "browser_assist",
  method: "browser_automation",
  async testConnection(partner: CourierPartner) {
    const url = resolvePartnerPortalUrl(partner);
    if (!url) {
      return {
        ok: false,
        message: "No booking portal URL is set for this partner.",
      };
    }
    const mismatch = partnerPortalMismatch(partner, url);
    if (mismatch) {
      return { ok: false, message: mismatch };
    }
    return {
      ok: true,
      message: `Portal ready for ${partner.name}: ${url}. Test connection does not open the site. On a shipment, click Book shipment, log in on that portal, then Autofill. Unattended website login is not used.`,
    };
  },
  async createShipment(ctx: ConnectorContext): Promise<ConnectorResult> {
    const url = resolvePartnerPortalUrl(ctx.partner);
    await ctx.log(
      "browser_assist",
      url
        ? `Operator must complete booking on ${url}. Unattended website automation is not implemented.`
        : "Operator must complete booking on the partner portal. No portal URL is configured.",
    );
    return {
      ok: true,
      status: "action_required",
      reason: url
        ? `Open ${ctx.partner.name} and finish booking in the partner portal. Capture the AWB when done.`
        : `Set a booking portal URL for ${ctx.partner.name}, then complete the booking manually.`,
      nextAction: "browser",
    };
  },
};

export const emailConnector: CourierConnector = {
  id: "email",
  method: "email",
  async testConnection() {
    return { ok: false, message: "Email booking is not implemented yet." };
  },
  async createShipment(ctx: ConnectorContext): Promise<ConnectorResult> {
    await ctx.log("email", "Email booking is not implemented. Use manual AWB capture.");
    return {
      ok: true,
      status: "action_required",
      reason: "Email booking is not available yet. Book with the partner and paste the AWB.",
      nextAction: "manual",
    };
  },
};

export const manualConnector: CourierConnector = {
  id: "manual",
  method: "manual",
  async testConnection() {
    return { ok: true, message: "Manual booking is ready. Operators paste the partner AWB after booking." };
  },
  async createShipment(ctx: ConnectorContext): Promise<ConnectorResult> {
    await ctx.log("manual", "Manual booking selected. Waiting for operator AWB.");
    return {
      ok: true,
      status: "action_required",
      reason: `Book this shipment on ${ctx.partner.name} and paste the AWB in Partner sync.`,
      nextAction: "manual",
    };
  },
};

export const disabledConnector: CourierConnector = {
  id: "disabled",
  method: "disabled",
  async testConnection() {
    return { ok: false, message: "Booking is disabled for this partner." };
  },
  async createShipment(ctx: ConnectorContext): Promise<ConnectorResult> {
    await ctx.log("disabled", "Booking method is disabled for this partner.", "error");
    return {
      ok: false,
      status: "booking_failed",
      error: `Automated booking is disabled for ${ctx.partner.name}.`,
    };
  },
};

export function getConnectorForMethod(method: CourierConnector["method"]): CourierConnector {
  switch (method) {
    case "api":
      return delhiveryApiConnector;
    case "browser_automation":
      return browserAssistConnector;
    case "email":
      return emailConnector;
    case "manual":
      return manualConnector;
    case "disabled":
      return disabledConnector;
  }
}
