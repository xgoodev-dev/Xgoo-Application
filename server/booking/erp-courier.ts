import { erpCourierBrand, isErpPortalCourier } from "@shared/erp-courier";
import type { CourierPartner } from "@shared/schema";
import type { ConnectorContext, ConnectorResult, CourierConnector } from "./connector";
import { createErpCourierBooking, getErpCourierConfig, pingErpCourier } from "../integrations/erp-courier-portal";

export const erpCourierApiConnector: CourierConnector = {
  id: "erp_courier_api",
  method: "api",
  async testConnection(partner: CourierPartner) {
    const brand = erpCourierBrand(partner.code, partner.name);
    if (!brand) {
      return { ok: false, message: "This connector is only for ST Couriers and Franch Couriers." };
    }
    return pingErpCourier(brand);
  },
  async createShipment(ctx: ConnectorContext): Promise<ConnectorResult> {
    const brand = erpCourierBrand(ctx.partner.code, ctx.partner.name);
    if (!brand || !isErpPortalCourier(ctx.partner.code, ctx.partner.name)) {
      return { ok: false, status: "booking_failed", error: "This connector only supports ST Couriers and Franch Couriers." };
    }
    if (ctx.shipment.partnerSyncStatus === "synced" && ctx.shipment.externalAwb?.trim()) {
      await ctx.log("duplicate_check", `Already saved on the portal as ${ctx.shipment.externalAwb}`);
      return { ok: true, status: "booked", awb: ctx.shipment.externalAwb, bookingReference: ctx.shipment.externalAwb };
    }
    const config = getErpCourierConfig(brand);
    if (!config) {
      return {
        ok: false,
        status: "booking_failed",
        error: `${ctx.partner.name} portal credentials are missing. Add them to env and restart Hub.`,
      };
    }
    const awb = (ctx.shipment.awbNumber || "").trim();
    await ctx.log("connecting", `Saving AWB ${awb || "(missing)"} on ${config.origin}`);
    try {
      const result = await createErpCourierBooking(brand, ctx.shipment);
      await ctx.log("booked", `${ctx.partner.name} accepted AWB ${result.awb}`);
      return { ok: true, status: "booked", awb: result.awb, bookingReference: result.awb };
    } catch (error) {
      const message = error instanceof Error ? error.message : `${ctx.partner.name} portal booking failed.`;
      return { ok: false, status: "booking_failed", error: message };
    }
  },
};
