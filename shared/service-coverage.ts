export const DEFAULT_HUB_SERVICE_RADIUS_KM = 13;
export const MIN_HUB_SERVICE_RADIUS_KM = 1;
export const MAX_HUB_SERVICE_RADIUS_KM = 200;
export const OUT_OF_SERVICE_AREA_CODE = "OUT_OF_SERVICE_AREA";

export const SERVICE_COVERAGE_COPY = {
  title: "We're expanding soon",
  body: "XGoo is not in your location yet. Stay tuned — we are growing our movement network, and we will be ready when we arrive near you. Please visit us again.",
  missingPickup: "Tell us your pickup location so we can check whether XGoo already serves your area.",
  inside: "XGoo already serves your pickup location.",
  unconfigured: "This Hub has not set a service location yet.",
} as const;

export type ServiceCoverageReason = "unconfigured" | "missing_pickup" | "inside" | "outside";

export type ServiceCoverageResult = {
  served: boolean;
  configured: boolean;
  hasPickupLocation: boolean;
  reason: ServiceCoverageReason;
  distanceKm: number | null;
  radiusKm: number;
  hubId: string | null;
  hubName: string | null;
  message: string;
};

export function parseCoord(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

export function parseServiceRadiusKm(value: string | number | null | undefined): number {
  const n = parseCoord(value);
  if (n == null || n <= 0) return DEFAULT_HUB_SERVICE_RADIUS_KM;
  return Math.min(MAX_HUB_SERVICE_RADIUS_KM, Math.max(MIN_HUB_SERVICE_RADIUS_KM, n));
}

export function coverageMessage(reason: ServiceCoverageReason): string {
  switch (reason) {
    case "unconfigured":
      return SERVICE_COVERAGE_COPY.unconfigured;
    case "missing_pickup":
      return SERVICE_COVERAGE_COPY.missingPickup;
    case "inside":
      return SERVICE_COVERAGE_COPY.inside;
    case "outside":
      return SERVICE_COVERAGE_COPY.body;
    default: {
      const exhaustive: never = reason;
      return exhaustive;
    }
  }
}

export function buildServiceCoverageResult(
  input: Omit<ServiceCoverageResult, "served" | "message">,
): ServiceCoverageResult {
  return {
    ...input,
    served: input.reason === "inside" || input.reason === "unconfigured",
    message: coverageMessage(input.reason),
  };
}
