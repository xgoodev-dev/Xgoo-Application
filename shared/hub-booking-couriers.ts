import { isDelhiveryPartner } from "./delhivery";
import { isWorldFirstPartner } from "./world-first";

export type HubBookingCourierStatus = "live" | "coming-soon";

export type HubBookingCourierDef = {
  key: string;
  name: string;
  codes: readonly string[];
  nameMatches: readonly string[];
  status: HubBookingCourierStatus;
  bookingMethod: "api" | "browser_automation" | "email" | "manual" | "disabled";
  portalUrl: string | null;
};

export const HUB_BOOKING_COURIERS: readonly HubBookingCourierDef[] = [
  {
    key: "world-first",
    name: "World First",
    codes: ["WF", "WFC", "WORLDFIRST"],
    nameMatches: ["world first", "worldfirst"],
    status: "live",
    bookingMethod: "api",
    portalUrl: "https://xpresion.worldfirst.in/",
  },
  {
    key: "delhivery",
    name: "Delhivery",
    codes: ["DEL", "DELHIVERY", "DL"],
    nameMatches: ["delhivery"],
    status: "live",
    bookingMethod: "api",
    portalUrl: "https://one.delhivery.com/",
  },
  {
    key: "st",
    name: "ST Couriers",
    codes: ["ST", "STC"],
    nameMatches: ["st courier", "stcourier", "st couriers"],
    status: "live",
    bookingMethod: "api",
    portalUrl: "https://erpstcourier.com/indexnew.php",
  },
  {
    key: "franch",
    name: "Franch Couriers",
    codes: ["FRANCH"],
    nameMatches: ["franch"],
    status: "live",
    bookingMethod: "api",
    portalUrl: "https://erpfranchexpress.com/indexnew.php",
  },
  {
    key: "tirupati",
    name: "Tirupati",
    codes: ["TIRUPATI", "TPC"],
    nameMatches: ["tirupati"],
    status: "live",
    bookingMethod: "manual",
    portalUrl: null,
  },
  {
    key: "atlantic",
    name: "Atlantic",
    codes: ["ATLANTIC", "AIE"],
    nameMatches: ["atlantic"],
    status: "coming-soon",
    bookingMethod: "disabled",
    portalUrl: null,
  },
  {
    key: "bluedart",
    name: "Blue Dart",
    codes: ["BD", "BLUEDART"],
    nameMatches: ["blue dart", "bluedart"],
    status: "coming-soon",
    bookingMethod: "disabled",
    portalUrl: "https://www.bluedart.com/",
  },
  {
    key: "dtdc",
    name: "DTDC",
    codes: ["DTDC"],
    nameMatches: ["dtdc"],
    status: "coming-soon",
    bookingMethod: "disabled",
    portalUrl: "https://www.dtdc.in/",
  },
  {
    key: "fedex",
    name: "FedEx",
    codes: ["FEDEX", "FDX"],
    nameMatches: ["fedex"],
    status: "coming-soon",
    bookingMethod: "disabled",
    portalUrl: null,
  },
] as const;

export function matchHubBookingCourier(partner: {
  code?: string | null;
  name?: string | null;
}): HubBookingCourierDef | null {
  if (isWorldFirstPartner(partner.code, partner.name)) {
    return HUB_BOOKING_COURIERS.find((row) => row.key === "world-first") || null;
  }
  if (isDelhiveryPartner(partner.code, partner.name)) {
    return HUB_BOOKING_COURIERS.find((row) => row.key === "delhivery") || null;
  }
  const code = (partner.code || "").trim().toUpperCase();
  const name = (partner.name || "").trim().toLowerCase();
  return (
    HUB_BOOKING_COURIERS.find((row) => row.codes.includes(code)) ||
    HUB_BOOKING_COURIERS.find((row) => row.nameMatches.some((match) => name.includes(match))) ||
    null
  );
}

export type HubBookingPartnerTab<T> = HubBookingCourierDef & {
  partner: T | null;
};

export function buildHubBookingPartnerTabs<T extends { code?: string | null; name?: string | null }>(
  partners: T[],
): HubBookingPartnerTab<T>[] {
  return HUB_BOOKING_COURIERS.map((row) => ({
    ...row,
    partner: partners.find((partner) => matchHubBookingCourier(partner)?.key === row.key) || null,
  }));
}
