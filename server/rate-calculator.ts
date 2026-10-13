import { isDelhiveryPartner } from "@shared/delhivery";
import { chargeableWeight, resolveBilledWeight } from "@shared/pricing";
import {
  isIndianPincode,
  rateCalculatorCountryName,
  rateCalculatorRequestSchema,
  type RateCalculatorLocation,
  type RateCalculatorQuoteCard,
  type RateCalculatorRequest,
  type RateCalculatorResponse,
} from "@shared/rate-calculator";
import { geocodeIndianPincode, reverseGeocodeLatLng, searchIndianAddresses } from "./geocode";
import { checkDelhiveryPincode, getDelhiveryConfigFromEnv } from "./integrations/delhivery";
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

async function delhiveryServiceability(pincode: string | null): Promise<{
  serviceable: boolean;
  message: string;
} | null> {
  if (!pincode || !isIndianPincode(pincode)) return null;
  const config = getDelhiveryConfigFromEnv();
  if (!config) return null;
  try {
    const result = await checkDelhiveryPincode(config, pincode);
    return { serviceable: result.serviceable, message: result.message };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delhivery serviceability check failed";
    return { serviceable: false, message };
  }
}

function quoteServiceable(
  shipmentType: "domestic" | "international",
  source: RateCalculatorQuoteCard["source"],
  sellPrice: number,
  pinCheck: { serviceable: boolean; message: string } | null,
  isDelhivery: boolean,
): { serviceable: boolean; estimated: boolean; message?: string } {
  if (isDelhivery && pinCheck && !pinCheck.serviceable) {
    return { serviceable: false, estimated: false, message: pinCheck.message };
  }

  switch (source) {
    case "api":
    case "tariff":
      return {
        serviceable: sellPrice > 0,
        estimated: false,
        message: pinCheck?.message,
      };
    case "legacy":
      if (shipmentType === "international") {
        return {
          serviceable: false,
          estimated: false,
          message: "No matching international tariff for this destination",
        };
      }
      return {
        serviceable: sellPrice > 0,
        estimated: true,
        message: "Estimated from partner fallback rates — confirm before booking",
      };
    default:
      return assertNever(source);
  }
}

export async function runRateCalculator(
  officeId: string,
  raw: RateCalculatorRequest,
): Promise<RateCalculatorResponse> {
  const input = rateCalculatorRequestSchema.parse(raw);
  const shipmentType = input.shipmentType;
  const originCountry = (input.originCountry || "IN").trim().toUpperCase() || "IN";
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
  const internationalPin = (input.receiverPincode || "").replace(/\s/g, "");
  const receiverPincode =
    shipmentType === "domestic"
      ? (input.receiverPincode || "").replace(/\D/g, "").slice(0, 6)
      : /^\d{4,12}$/.test(internationalPin)
        ? internationalPin
        : null;

  const [pickup, destination, destPinCheck] = await Promise.all([
    resolveIndianLocation(senderPincode),
    shipmentType === "domestic"
      ? resolveIndianLocation(receiverPincode || "")
      : Promise.resolve({
          pincode: receiverPincode,
          city: null,
          state: null,
          country: destinationCountry,
          displayName: [receiverPincode, rateCalculatorCountryName(destinationCountry)].filter(Boolean).join(", "),
        } satisfies RateCalculatorLocation),
    shipmentType === "domestic" ? delhiveryServiceability(receiverPincode) : Promise.resolve(null),
  ]);

  const quoteInput = {
    shipmentType,
    packageType: input.packageType,
    originCountry,
    destinationCountry,
    senderPincode,
    receiverPincode,
    insurance: input.insurance,
    declaredValue: input.codAmount ?? undefined,
    weightRoundOff: "ceil_kg" as const,
    weight: actualKg,
    length: input.length ?? undefined,
    width: input.width ?? undefined,
    height: input.height ?? undefined,
  };

  const [surfaceQuotes, airQuotes] = await Promise.all([
    storage.quoteAllPartners(officeId, { ...quoteInput, serviceType: "surface" }),
    storage.quoteAllPartners(officeId, { ...quoteInput, serviceType: "air" }),
  ]);

  const merged = [...surfaceQuotes, ...airQuotes];
  const cards: RateCalculatorQuoteCard[] = merged.map((quote) => {
    const serviceType: "air" | "surface" = quote.serviceType === "air" ? "air" : "surface";
    const isDelhivery = isDelhiveryPartner(quote.partnerCode, quote.partnerName);
    const flags = quoteServiceable(
      shipmentType,
      quote.source,
      quote.sellPrice,
      destPinCheck,
      isDelhivery,
    );
    return {
      courierPartnerId: quote.courierPartnerId,
      partnerName: quote.partnerName,
      partnerCode: quote.partnerCode,
      serviceType,
      shipmentType,
      sellPrice: quote.sellPrice,
      tariffAmount: quote.tariffAmount,
      transitDays: quote.transitDays ?? null,
      chargeableWeight: quote.chargeableWeight,
      billedWeight: quote.billedWeight,
      actualWeight: quote.actualWeight,
      volumetricWeight: quote.volumetricWeight,
      source: quote.source,
      serviceable: flags.serviceable,
      estimated: flags.estimated,
      popular: false,
      message: flags.message || quote.message,
    };
  });

  const serviceable = cards.filter((quote) => quote.serviceable);
  const cheapestId = serviceable.reduce<string | null>((best, quote) => {
    if (!best) return `${quote.courierPartnerId}:${quote.serviceType}`;
    const current = serviceable.find((row) => `${row.courierPartnerId}:${row.serviceType}` === best);
    if (!current || quote.sellPrice < current.sellPrice) {
      return `${quote.courierPartnerId}:${quote.serviceType}`;
    }
    if (quote.sellPrice === current.sellPrice) {
      const quoteDays = quote.transitDays ?? 99;
      const currentDays = current.transitDays ?? 99;
      if (quoteDays < currentDays) return `${quote.courierPartnerId}:${quote.serviceType}`;
    }
    return best;
  }, null);

  const quotes = cards
    .map((quote) => ({
      ...quote,
      popular: `${quote.courierPartnerId}:${quote.serviceType}` === cheapestId,
    }))
    .sort((a, b) => {
      if (a.serviceable !== b.serviceable) return a.serviceable ? -1 : 1;
      return a.sellPrice - b.sellPrice;
    });

  const weights = chargeableWeight(actualKg, input.length, input.width, input.height);
  const billed = resolveBilledWeight(weights.chargeable, "ceil_kg");

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
