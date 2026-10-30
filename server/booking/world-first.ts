import { resolvePartnerPortalUrl } from "@shared/partner-sync";
import {
  isWorldFirstPartner,
  worldFirstPortalUrl,
  WORLD_FIRST_WORKFLOW,
  WORLD_FIRST_XPRESION_URL,
} from "@shared/world-first";
import type { CourierPartner } from "@shared/schema";
import type { ConnectorContext, ConnectorResult, CourierConnector } from "./connector";
import {
  createWorldFirstShipment,
  getWorldFirstConfigFromEnv,
  pingWorldFirstApi,
} from "../integrations/world-first";
import { getWorldFirstWallet } from "../integrations/world-first-portal";

export const worldFirstBrowserConnector: CourierConnector = {
  id: "world_first_browser",
  method: "browser_automation",
  async testConnection(partner: CourierPartner) {
    if (!isWorldFirstPartner(partner.code, partner.name)) {
      return { ok: false, message: "This connector is only for World First Courier." };
    }
    const url = worldFirstPortalUrl(partner.portalUrl);
    return {
      ok: true,
      message: `Ready. Test connection does not open a tab. Next: open a World First shipment → Book shipment → log in at ${url} (saved password/click Login, or OTP). XGoo never stores partner passwords or OTPs.`,
    };
  },
  async createShipment(ctx: ConnectorContext): Promise<ConnectorResult> {
    const existingAwb = ctx.shipment.externalAwb?.trim();
    if (existingAwb) {
      await ctx.log("duplicate_check", `Shipment already has partner AWB ${existingAwb}`);
      return { ok: true, status: "booked", awb: existingAwb, bookingReference: existingAwb };
    }

    const url = worldFirstPortalUrl(ctx.partner.portalUrl) || resolvePartnerPortalUrl(ctx.partner);

    await ctx.log("open_portal", `Open World First Xpresion at ${url || WORLD_FIRST_XPRESION_URL}`);
    await ctx.log(
      "authenticate",
      "Log in on World First. If the browser filled username and password, click Login. Login with OTP is optional. XGoo does not store partner passwords or OTPs.",
      "warn",
    );
    await ctx.log(
      "payload_ready",
      `Autofill ready after login — sender ${ctx.shipment.senderName}; consignee ${ctx.shipment.receiverName}; ${ctx.shipment.weight} kg, ${ctx.shipment.numberOfPieces ?? 1} piece(s).`,
    );

    const checklist = WORLD_FIRST_WORKFLOW.map((step) => step.label).join(" → ");
    return {
      ok: true,
      status: "action_required",
      reason: `Log in on Xpresion (saved password + Login, or OTP), then Autofill. Workflow: ${checklist}. Review and submit on World First, then paste the AWB into XGoo. Do not create a second booking.`,
      nextAction: "login",
    };
  },
};

export const worldFirstApiConnector: CourierConnector = {
  id: "world_first_api",
  method: "api",
  async testConnection(partner: CourierPartner) {
    if (!isWorldFirstPartner(partner.code, partner.name)) {
      return { ok: false, message: "This connector is only for World First Courier." };
    }
    const config = getWorldFirstConfigFromEnv();
    if (!config) {
      return {
        ok: false,
        message:
          "World First API is not configured. Set WORLD_FIRST_API_USERNAME and WORLD_FIRST_API_PASSWORD, then restart the server.",
      };
    }
    const ping = await pingWorldFirstApi(config);
    if (!ping.ok) return ping;
    try {
      const wallet = await getWorldFirstWallet();
      return {
        ok: true,
        message: `${ping.message} Account Limit ${wallet.limit}, Used ${wallet.used}, Balance ${wallet.balance}.`,
      };
    } catch {
      return ping;
    }
  },
  async createShipment(ctx: ConnectorContext): Promise<ConnectorResult> {
    if (!isWorldFirstPartner(ctx.partner.code, ctx.partner.name)) {
      return { ok: false, status: "booking_failed", error: "This API connector only supports World First." };
    }

    const existingAwb = ctx.shipment.externalAwb?.trim();
    if (existingAwb) {
      await ctx.log("duplicate_check", `Shipment already has partner AWB ${existingAwb}`);
      return { ok: true, status: "booked", awb: existingAwb, bookingReference: existingAwb };
    }

    const config = getWorldFirstConfigFromEnv();
    if (!config) {
      await ctx.log(
        "api_missing",
        "World First API credentials are missing. Falling back to browser assist.",
        "warn",
      );
      return worldFirstBrowserConnector.createShipment(ctx);
    }

    await ctx.log("connecting", `Creating World First AWB at ${config.baseUrl}`);
    const result = await createWorldFirstShipment(config, ctx.shipment);
    await ctx.log("booked", `World First assigned AWB ${result.awb}`);
    if (result.labelUrl) {
      await ctx.log("label", "World First AWB label is ready to print");
    }
    return {
      ok: true,
      status: "booked",
      awb: result.awb,
      bookingReference: result.forwardingNo || result.awb,
      labelUrl: result.labelUrl,
    };
  },
};

/** @deprecated Use worldFirstApiConnector when credentials exist. */
export const worldFirstConnector = worldFirstApiConnector;
