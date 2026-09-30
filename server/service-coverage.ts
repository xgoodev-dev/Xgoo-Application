import type { Response } from "express";
import {
  buildServiceCoverageResult,
  OUT_OF_SERVICE_AREA_CODE,
  parseCoord,
  parseServiceRadiusKm,
  type ServiceCoverageResult,
} from "@shared/service-coverage";
import type { CustomerUser } from "@shared/schema";
import { getBusinessProfileDto } from "./business-courier";
import { distanceKm, geocodeIndianPincode, normalizePincode } from "./geocode";
import { ensureHubServiceAreaColumns, storage } from "./storage";

export type PickupPointInput = {
  lat?: string | number | null;
  lng?: string | number | null;
  pincode?: string | null;
};

type HubPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
};

async function resolveHubPoints(officeId: string): Promise<HubPoint[]> {
  await ensureHubServiceAreaColumns();
  const hubs = (await storage.getBranchesByOffice(officeId)).filter((hub) => hub.isActive !== false);
  const points: HubPoint[] = [];

  for (const hub of hubs) {
    const lat = parseCoord(hub.lat);
    const lng = parseCoord(hub.lng);
    if (lat == null || lng == null) continue;
    points.push({
      id: hub.id,
      name: hub.name,
      lat,
      lng,
      radiusKm: parseServiceRadiusKm(hub.serviceRadiusKm),
    });
  }

  return points;
}

async function resolvePickupCoords(pickup: PickupPointInput): Promise<{ lat: number; lng: number } | null> {
  const lat = parseCoord(pickup.lat);
  const lng = parseCoord(pickup.lng);
  if (lat != null && lng != null) return { lat, lng };

  const pincode = pickup.pincode ? normalizePincode(pickup.pincode) : "";
  if (pincode.length !== 6) return null;
  const coords = await geocodeIndianPincode(pincode);
  return coords;
}

function matchCoverage(pickup: { lat: number; lng: number }, hubs: HubPoint[]): ServiceCoverageResult {
  let best: { hub: HubPoint; distanceKm: number } | null = null;
  for (const hub of hubs) {
    const dist = distanceKm(pickup.lat, pickup.lng, hub.lat, hub.lng);
    if (!best || dist < best.distanceKm) best = { hub, distanceKm: dist };
  }
  if (!best) {
    return buildServiceCoverageResult({
      configured: false,
      hasPickupLocation: true,
      reason: "unconfigured",
      distanceKm: null,
      radiusKm: parseServiceRadiusKm(null),
      hubId: null,
      hubName: null,
    });
  }
  const inside = best.distanceKm <= best.hub.radiusKm;
  return buildServiceCoverageResult({
    configured: true,
    hasPickupLocation: true,
    reason: inside ? "inside" : "outside",
    distanceKm: Math.round(best.distanceKm * 10) / 10,
    radiusKm: best.hub.radiusKm,
    hubId: best.hub.id,
    hubName: best.hub.name,
  });
}

export async function evaluatePickupCoverage(
  officeId: string,
  pickup: PickupPointInput,
): Promise<ServiceCoverageResult> {
  const hubs = await resolveHubPoints(officeId);
  if (!hubs.length) {
    return buildServiceCoverageResult({
      configured: false,
      hasPickupLocation: Boolean(parseCoord(pickup.lat) && parseCoord(pickup.lng)) || Boolean(pickup.pincode),
      reason: "unconfigured",
      distanceKm: null,
      radiusKm: parseServiceRadiusKm(null),
      hubId: null,
      hubName: null,
    });
  }

  const coords = await resolvePickupCoords(pickup);
  if (!coords) {
    return buildServiceCoverageResult({
      configured: true,
      hasPickupLocation: false,
      reason: "missing_pickup",
      distanceKm: null,
      radiusKm: hubs[0]?.radiusKm ?? parseServiceRadiusKm(null),
      hubId: hubs[0]?.id ?? null,
      hubName: hubs[0]?.name ?? null,
    });
  }

  return matchCoverage(coords, hubs);
}

export async function evaluateCustomerCoverage(user: CustomerUser): Promise<ServiceCoverageResult> {
  if (user.accountType === "business") {
    const profile = await getBusinessProfileDto(user.id);
    return evaluatePickupCoverage(user.officeId, {
      lat: profile.pickupLat,
      lng: profile.pickupLng,
      pincode: profile.pickupPincode,
    });
  }

  return evaluatePickupCoverage(user.officeId, {
    lat: user.defaultPickupLat,
    lng: user.defaultPickupLng,
    pincode: user.pincode,
  });
}

export async function respondIfOutsideServiceArea(
  res: Response,
  officeId: string,
  pickup: PickupPointInput,
): Promise<boolean> {
  const coverage = await evaluatePickupCoverage(officeId, pickup);
  if (!coverage.configured || coverage.served) return false;
  res.status(403).json({
    code: OUT_OF_SERVICE_AREA_CODE,
    message: coverage.message,
    coverage,
  });
  return true;
}

export async function respondIfCustomerOutsideServiceArea(
  res: Response,
  user: CustomerUser,
): Promise<boolean> {
  const coverage = await evaluateCustomerCoverage(user);
  if (!coverage.configured || coverage.served) return false;
  res.status(403).json({
    code: OUT_OF_SERVICE_AREA_CODE,
    message: coverage.message,
    coverage,
  });
  return true;
}
