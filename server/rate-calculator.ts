import { isDelhiveryPartner } from "@shared/delhivery";
import { isWorldFirstPartner } from "@shared/world-first";
import { chargeableWeight } from "@shared/pricing";
import type { CourierPartner } from "@shared/schema";
import {
  isIndianPincode,
  rateCalculatorCountryName,
  rateCalculatorRequestSchema,
  type RateCalculatorLocation,
  type RateCalculatorQuoteCard,
  type RateCalculatorRequest,
  type RateCalculatorResponse,
} from "@shared/rate-calculator";
import {
  geocodeIndianPincode,
  isoCountryCode,
  lookupInternationalPostal,
  reverseGeocodeLatLng,
  searchIndianAddresses,
  searchInternationalAddresses,
} from "./geocode";
import {
  calculateDelhiveryShippingCost,
  checkDelhiveryPincode,
  getDelhiveryConfigFromEnv,
  getDelhiveryTat,
} from "./integrations/delhivery";
import {
  checkWorldFirstDestination,
  getWorldFirstConfigFromEnv,
} from "./integrations/world-first";
import {
  getWorldFirstCustomerRates,
  resolveWorldFirstOrigin,
} from "./integrations/world-first-portal";
import { storage } from "./storage";

function assertNever(value: never): never {
  throw new Error(`Unhandled rate-calculator value: ${String(value)}`);
}

function weightInKg(weight: number, unit: "kg" | "gm"): number {
  switch (unit) {
    case "kg":
      return weight;
    case "gm":
      return weight / 1000;
    default:
      return assertNever(unit);
  }
}

async function resolveIndianLocation(pincode: string): Promise<RateCalculatorLocation> {
  const pin = pincode.replace(/\D/g, "").slice(0, 6);
  const empty: RateCalculatorLocation = {
    pincode: pin || null,
    city: null,
    state: null,
    country: "IN",
    displayName: pin || "India",
  };
  if (!isIndianPincode(pin)) return empty;

  try {
    const results = await searchIndianAddresses(pin, 4);
    const match =
      results.find((row) => row.pincode === pin) ||
      results.find((row) => row.city) ||
      results[0];
    if (match) {
      return {
        pincode: match.pincode || pin,
        city: match.city || null,
        state: match.state || null,
        country: "IN",
        displayName: [match.city, match.state, match.pincode || pin].filter(Boolean).join(", ") || match.displayName,
      };
    }
  } catch {
    /* continue to coordinate fallback */
  }

  try {
    const coords = await geocodeIndianPincode(pin);
    if (coords) {
      const reversed = await reverseGeocodeLatLng(coords.lat, coords.lng);
      if (reversed) {
        return {
          pincode: reversed.pincode || pin,
          city: reversed.city || null,
          state: reversed.state || null,
          country: "IN",
          displayName: [reversed.city, reversed.state, pin].filter(Boolean).join(", "),
        };
      }
    }
  } catch {
    /* keep pin-only label */
  }

  return empty;
}

function normalizeInternationalPostal(value: string | null | undefined): string | null {
  const raw = (value || "").trim().replace(/\s+/g, " ");
  if (raw.length < 3 || raw.length > 16) return null;
  return raw.toUpperCase();
}

async function resolveInternationalLocation(
  country: string,
  postalOrPlace: string | null,
): Promise<RateCalculatorLocation> {
  const countryName = rateCalculatorCountryName(country);
  const empty: RateCalculatorLocation = {
    pincode: postalOrPlace,
    city: null,
    state: null,
    country,
    displayName: [postalOrPlace, countryName].filter(Boolean).join(", ") || countryName,
  };
  const query = (postalOrPlace || "").trim();
  if (!query) return empty;

  try {
    const match =
      (await lookupInternationalPostal(country, query)) ||
      (await searchInternationalAddresses(country, query, 4))[0];
    if (match) {
      const pin = match.pincode || query;
      return {
        pincode: pin,
        city: match.city || null,
        state: match.state || null,
        country: isoCountryCode(match.country) || country,
        displayName:
          [match.city, match.state, pin, countryName].filter(Boolean).join(", ") || match.displayName,
      };
    }
  } catch {
    /* keep country + postal label */
  }
  return empty;
}

function uniqueApiPartners(partners: CourierPartner[]): CourierPartner[] {
  const out: CourierPartner[] = [];
  const seen = new Set<string>();
  for (const partner of partners) {
    if (!partner.isActive) continue;
    const kind = isDelhiveryPartner(partner.code, partner.name)
      ? "delhivery"
      : isWorldFirstPartner(partner.code, partner.name)
        ? "world-first"
        : null;
    if (!kind || seen.has(kind)) continue;
    seen.add(kind);
    out.push(partner);
  }
  return out;
}

function emptyCard(
  partner: CourierPartner,
  serviceType: "air" | "surface",
  shipmentType: "domestic" | "international",
  weights: { chargeable: number; volumetric: number; actual: number },
  billedWeight: number,
  message: string,
): RateCalculatorQuoteCard {
  return {
    courierPartnerId: partner.id,
    partnerName: partner.name,
    partnerCode: partner.code,
    serviceType,
    shipmentType,
    sellPrice: 0,
    tariffAmount: 0,
    transitDays: null,
    chargeableWeight: weights.chargeable,
    billedWeight,
    actualWeight: weights.actual,
    volumetricWeight: weights.volumetric,
    source: "api",
    serviceable: false,
    estimated: false,
    popular: false,
    message: message.startsWith("No Service") ? message : `No Service · ${message}`,
  };
}

async function quoteDelhiveryApi(
  partner: CourierPartner,
  input: {
    shipmentType: "domestic" | "international";
    packageType: "document" | "package";
    senderPincode: string;
    receiverPincode: string | null;
    serviceType: "air" | "surface";
    actualKg: number;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    volumetricWeight?: number | null;
  },
  weights: { chargeable: number; volumetric: number; actual: number },
  billedWeight: number,
): Promise<RateCalculatorQuoteCard> {
  if (input.shipmentType === "international") {
    return emptyCard(
      partner,
      input.serviceType,
      input.shipmentType,
      weights,
      billedWeight,
      "Delhivery rate and pincode APIs are India-to-India only.",
    );
  }
  const config = getDelhiveryConfigFromEnv();
  if (!config) {
    return emptyCard(
      partner,
      input.serviceType,
      input.shipmentType,
      weights,
      billedWeight,
      "Delhivery API credentials are not configured.",
    );
  }
  const originPin = input.senderPincode;
  const destPin = input.receiverPincode || "";
  if (!isIndianPincode(originPin) || !isIndianPincode(destPin)) {
    return emptyCard(
      partner,
      input.serviceType,
      input.shipmentType,
      weights,
      billedWeight,
      "Delhivery needs 6-digit From and To pincodes.",
    );
  }

  const [origin, dest] = await Promise.all([
    checkDelhiveryPincode(config, originPin).catch((error) => ({
      serviceable: false,
      prepaid: false,
      city: null,
      district: null,
      state: null,
      hub: null,
      message: error instanceof Error ? error.message : "Origin pincode check failed",
    })),
    checkDelhiveryPincode(config, destPin).catch((error) => ({
      serviceable: false,
      prepaid: false,
      city: null,
      district: null,
      state: null,
      hub: null,
      message: error instanceof Error ? error.message : "Destination pincode check failed",
    })),
  ]);
  if (!origin.serviceable || !dest.serviceable) {
    return emptyCard(
      partner,
      input.serviceType,
      input.shipmentType,
      weights,
      billedWeight,
      `No Service · ${[origin.message, dest.message].filter(Boolean).join(" · ")}`,
    );
  }

  const chargeableKg = Math.round(weights.chargeable * 1000) / 1000;
  const cgm = Math.max(1, Math.round(chargeableKg * 1000));
  try {
    const [cost, tat] = await Promise.all([
      calculateDelhiveryShippingCost(config, {
        md: input.serviceType === "air" ? "E" : "S",
        cgm,
        o_pin: originPin,
        d_pin: destPin,
        ss: "Delivered",
        pt: "Pre-paid",
        l: input.length ?? undefined,
        b: input.width ?? undefined,
        h: input.height ?? undefined,
        ipkg_type: input.packageType === "document" ? "flyer" : "box",
      }),
      getDelhiveryTat(config, {
        originPin,
        destPin,
        mot: input.serviceType === "air" ? "E" : "S",
        pdt: "B2C",
      }).catch(() => ({ tat: 0, expectedDeliveryDate: null })),
    ]);
    const parts = [
      `Delhivery API ${input.serviceType === "air" ? "Express" : "Surface"}`,
      origin.message,
      `to ${dest.message}`,
      cost.freightCharge != null ? `shipping ₹${cost.freightCharge}` : "",
      cost.peakCharge != null ? `peak ₹${cost.peakCharge}` : "",
      cost.fuelSurcharge != null ? `fuel ₹${cost.fuelSurcharge}` : "",
      cost.gstAmount != null ? `GST ₹${cost.gstAmount}` : "",
    ].filter(Boolean);
    return {
      courierPartnerId: partner.id,
      partnerName: partner.name,
      partnerCode: partner.code,
      serviceType: input.serviceType,
      shipmentType: input.shipmentType,
      sellPrice: cost.totalAmount,
      tariffAmount: cost.totalAmount,
      transitDays: tat.tat > 0 ? tat.tat : null,
      chargeableWeight: chargeableKg,
      billedWeight: chargeableKg,
      actualWeight: weights.actual,
      volumetricWeight: weights.volumetric,
      source: "api",
      serviceable: true,
      estimated: false,
      popular: false,
      message: parts.join(" · "),
    };
  } catch (error) {
    return emptyCard(
      partner,
      input.serviceType,
      input.shipmentType,
      weights,
      billedWeight,
      error instanceof Error ? error.message : "Delhivery rate API failed",
    );
  }
}

function worldFirstQuoteKey(partnerId: string, vendor: string, service: string): string {
  return `${partnerId}:${vendor}:${service}`;
}

async function quoteWorldFirstApi(
  partner: CourierPartner,
  input: {
    shipmentType: "domestic" | "international";
    packageType: "document" | "package";
    destinationCountry: string;
    destination: RateCalculatorLocation;
    pickup: RateCalculatorLocation;
  },
  weights: { chargeable: number; volumetric: number; actual: number },
  billedWeight: number,
): Promise<RateCalculatorQuoteCard[]> {
  if (input.shipmentType === "domestic") {
    return [
      emptyCard(
        partner,
        "air",
        input.shipmentType,
        weights,
        billedWeight,
        "World First API books international AWBs only.",
      ),
    ];
  }
  const config = getWorldFirstConfigFromEnv();
  if (!config) {
    return [
      emptyCard(
        partner,
        "air",
        input.shipmentType,
        weights,
        billedWeight,
        "World First API credentials are not configured.",
      ),
    ];
  }
  const dest = await checkWorldFirstDestination(config, input.destinationCountry);
  if (!dest.ok) {
    return [emptyCard(partner, "air", input.shipmentType, weights, billedWeight, dest.message)];
  }
  const origin = resolveWorldFirstOrigin(input.pickup.city);
  if (!origin) {
    return [
      emptyCard(
        partner,
        "air",
        input.shipmentType,
        weights,
        billedWeight,
        `World First has no origin station for ${input.pickup.city || input.pickup.pincode || "this pickup"}.`,
      ),
    ];
  }
  const place = [input.destination.city, input.destination.state, input.destination.pincode]
    .filter(Boolean)
    .join(", ");
  try {
    const rates = await getWorldFirstCustomerRates({
      originCity: origin.name,
      originCode: origin.code,
      destinationCountry: input.destinationCountry,
      toPinCode: input.destination.pincode,
      weightKg: weights.actual,
      volumetricKg: weights.volumetric,
      packageType: input.packageType,
    });
    if (rates.length === 0) {
      return [
        emptyCard(
          partner,
          "air",
          input.shipmentType,
          weights,
          billedWeight,
          `No Service · World First has no customer rate for ${origin.code} → ${dest.label || input.destinationCountry}${place ? ` · ${place}` : ""}.`,
        ),
      ];
    }
    return rates.map((rate) => {
      const laneLabel = [rate.vendor, rate.service].filter(Boolean).join(" · ");
      const breakdown = [
        `${origin.code} → ${rate.destination || dest.label}`,
        place,
        `${rate.product} (${rate.productCode})`,
        rate.amount ? `amount ₹${rate.amount.toFixed(2)}` : "",
        rate.otherCharges ? `other ₹${rate.otherCharges.toFixed(2)}` : "",
        rate.fuel ? `fuel ₹${rate.fuel.toFixed(2)}` : "",
        rate.tax ? `tax ₹${rate.tax.toFixed(2)}` : "",
      ].filter(Boolean);
      return {
        courierPartnerId: partner.id,
        partnerName: partner.name,
        partnerCode: partner.code,
        serviceType: "air" as const,
        shipmentType: input.shipmentType,
        sellPrice: rate.grandTotal,
        tariffAmount: rate.grandTotal,
        transitDays: rate.displayDays,
        chargeableWeight: weights.chargeable,
        billedWeight,
        actualWeight: weights.actual,
        volumetricWeight: weights.volumetric,
        source: "api" as const,
        serviceable: true,
        estimated: false,
        popular: false,
        quoteKey: worldFirstQuoteKey(partner.id, rate.vendorCode || rate.vendor, rate.service),
        laneLabel,
        partnerProduct: rate.product,
        partnerVendor: rate.vendor,
        partnerService: rate.service,
        freightAmount: rate.amount,
        otherCharges: rate.otherCharges,
        fuelSurcharge: rate.fuel,
        taxAmount: rate.tax,
        message: breakdown.join(" · "),
      };
    });
  } catch (error) {
    return [
      emptyCard(
        partner,
        "air",
        input.shipmentType,
        weights,
        billedWeight,
        error instanceof Error ? error.message : "World First rate compare failed",
      ),
    ];
  }
}

export async function runRateCalculator(
  officeId: string,
  raw: RateCalculatorRequest,
): Promise<RateCalculatorResponse> {
  const input = rateCalculatorRequestSchema.parse(raw);
  const shipmentType = input.shipmentType;
  const destinationCountry = (
    shipmentType === "domestic" ? "IN" : input.destinationCountry || ""
  )
    .trim()
    .toUpperCase();

  if (shipmentType === "international" && (!destinationCountry || destinationCountry === "IN")) {
    throw Object.assign(new Error("Choose a destination country for international rates"), { status: 400 });
  }
  if (shipmentType === "domestic" && !isIndianPincode(input.receiverPincode || "")) {
    throw Object.assign(new Error("Enter a 6-digit destination pincode for domestic rates"), { status: 400 });
  }

  const actualKg = weightInKg(input.weight, input.weightUnit);
  if (actualKg <= 0) {
    throw Object.assign(new Error("Enter a package weight greater than zero"), { status: 400 });
  }

  const senderPincode = input.senderPincode.replace(/\D/g, "").slice(0, 6);
  const receiverPincode =
    shipmentType === "domestic"
      ? (input.receiverPincode || "").replace(/\D/g, "").slice(0, 6)
      : normalizeInternationalPostal(input.receiverPincode);

  const weights = chargeableWeight(
    actualKg,
    input.length,
    input.width,
    input.height,
    input.volumetricWeight,
  );
  const billedWeight = Math.round(weights.chargeable * 1000) / 1000;
  const billed = { billedWeight, rounded: false };

  const [pickup, destination, partners] = await Promise.all([
    resolveIndianLocation(senderPincode),
    shipmentType === "domestic"
      ? resolveIndianLocation(receiverPincode || "")
      : resolveInternationalLocation(destinationCountry, receiverPincode),
    storage.getPartnersByOffice(officeId),
  ]);

  const apiPartners = uniqueApiPartners(partners);
  const cards: RateCalculatorQuoteCard[] = [];
  for (const partner of apiPartners) {
    if (isDelhiveryPartner(partner.code, partner.name)) {
      const modes: Array<"surface" | "air"> =
        shipmentType === "international" ? ["surface"] : ["surface", "air"];
      const quoted = await Promise.all(
        modes.map((serviceType) =>
          quoteDelhiveryApi(
            partner,
            {
              shipmentType,
              packageType: input.packageType,
              senderPincode,
              receiverPincode,
              serviceType,
              actualKg,
              length: input.length,
              width: input.width,
              height: input.height,
              volumetricWeight: input.volumetricWeight,
            },
            weights,
            billed.billedWeight,
          ),
        ),
      );
      cards.push(...quoted);
      continue;
    }
    if (isWorldFirstPartner(partner.code, partner.name)) {
      cards.push(
        ...(await quoteWorldFirstApi(
          partner,
          {
            shipmentType,
            packageType: input.packageType,
            destinationCountry,
            destination,
            pickup,
          },
          weights,
          billed.billedWeight,
        )),
      );
    }
  }

  const serviceable = cards.filter((quote) => quote.serviceable);
  const priced = serviceable.filter((quote) => quote.sellPrice > 0);
  const quoteIdentity = (quote: RateCalculatorQuoteCard) =>
    quote.quoteKey || `${quote.courierPartnerId}:${quote.serviceType}`;
  const cheapestId = priced.reduce<string | null>((best, quote) => {
    if (!best) return quoteIdentity(quote);
    const current = priced.find((row) => quoteIdentity(row) === best);
    if (!current || quote.sellPrice < current.sellPrice) {
      return quoteIdentity(quote);
    }
    if (quote.sellPrice === current.sellPrice) {
      const quoteDays = quote.transitDays ?? 99;
      const currentDays = current.transitDays ?? 99;
      if (quoteDays < currentDays) return quoteIdentity(quote);
    }
    return best;
  }, null);

  const quotes = cards
    .map((quote) => ({
      ...quote,
      popular: quoteIdentity(quote) === cheapestId,
    }))
    .sort((a, b) => {
      if (a.serviceable !== b.serviceable) return a.serviceable ? -1 : 1;
      if ((a.sellPrice > 0) !== (b.sellPrice > 0)) return a.sellPrice > 0 ? -1 : 1;
      return a.sellPrice - b.sellPrice;
    });

  return {
    shipmentType,
    pickup,
    destination,
    actualWeight: weights.actual,
    volumetricWeight: weights.volumetric,
    chargeableWeight: weights.chargeable,
    billedWeight: billed.billedWeight,
    quotes,
    serviceableCount: serviceable.length,
  };
}

export { rateCalculatorRequestSchema };
