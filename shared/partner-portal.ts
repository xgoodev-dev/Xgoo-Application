import { isDelhiveryPartner } from "./delhivery";
import { normalizePartnerCode } from "./partner-sync";
import { isWorldFirstPartner } from "./world-first";
import type { CourierPartner } from "./schema";

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * True when the saved portal URL clearly belongs to a different courier
 * than the partner being edited (e.g. World First Xpresion on UPS).
 */
export function partnerPortalMismatch(
  partner: Pick<CourierPartner, "code" | "name">,
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null;
  const host = hostnameOf(url.trim());
  if (!host) return "Booking portal URL is not a valid URL.";

  const name = (partner.name || "").toLowerCase();
  const code = normalizePartnerCode(partner.code || "");
  const isUps = code === "UPS" || name === "ups" || name.startsWith("ups ") || name.includes(" ups");
  const isFedex = code === "FX" || code === "FEDEX" || name.includes("fedex");

  if (host.includes("worldfirst") && !isWorldFirstPartner(partner.code, partner.name)) {
    return `This URL is World First (${host}), not ${partner.name}. Paste the ${partner.name} booking login — not Xpresion.`;
  }
  if (host.includes("delhivery") && !isDelhiveryPartner(partner.code, partner.name)) {
    return `This URL is Delhivery (${host}), not ${partner.name}.`;
  }
  if (isUps && !host.includes("ups")) {
    return `This URL (${host}) is not UPS. Use your UPS CampusShip or ups.com shipping login. WorldShip is desktop software, not a website.`;
  }
  if (isFedex && !host.includes("fedex")) {
    return `This URL (${host}) is not FedEx. Paste the FedEx booking login used by your office.`;
  }
  return null;
}

export function portalHostname(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  return hostnameOf(url.trim());
}
