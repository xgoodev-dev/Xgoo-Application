import { isDelhiveryPartner } from "@shared/delhivery";
import { resolveBookingMethod } from "@shared/booking-engine";
import { isWorldFirstPartner } from "@shared/world-first";
import type { CourierPartner } from "@shared/schema";
import type { CourierConnector } from "./connector";
import {
  browserAssistConnector,
  delhiveryApiConnector,
  disabledConnector,
  emailConnector,
  getConnectorForMethod,
  manualConnector,
} from "./connectors";
import { worldFirstConnector } from "./world-first";

/**
 * Pick a connector from the partner, not from the booking screen.
 * API vs browser is stored on the partner; World First currently has no public booking API.
 */
export function getConnectorForPartner(partner: CourierPartner): CourierConnector {
  const method = resolveBookingMethod(partner);

  if (method === "disabled") return disabledConnector;
  if (method === "manual") return manualConnector;
  if (method === "email") return emailConnector;

  if (method === "api") {
    if (isDelhiveryPartner(partner.code, partner.name)) return delhiveryApiConnector;
    if (isWorldFirstPartner(partner.code, partner.name)) return worldFirstConnector;
    return delhiveryApiConnector;
  }

  if (isWorldFirstPartner(partner.code, partner.name)) return worldFirstConnector;
  return browserAssistConnector;
}

export { getConnectorForMethod };
