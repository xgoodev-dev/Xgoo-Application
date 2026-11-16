import { desc, gte } from "drizzle-orm";
import type { PickupPartner } from "@shared/schema";
import { pickupPartnerSessions } from "@shared/schema";
import {
  buildPickupBadges,
  emptyPickupTotals,
  startOfIstDay,
  type PickupLivePartner,
  type PickupLiveTotals,
  type PickupPartnerStats,
} from "@shared/pickup-live";
import { db } from "./db";
import { getDirectionsRoute } from "./geocode";
import { getOfficeFuelRate, getOpenShift, listPartnerShifts, presentShift } from "./pickup-fuel";
import { triggerPickupPartnerNotification } from "./pickup-notifications";
import { storage } from "./storage";

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapCoord(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? n : fallback;
}

function addTotals(into: PickupLiveTotals, extra: Partial<PickupLiveTotals>) {
  into.distanceKm += extra.distanceKm || 0;
  into.fuelLitres += extra.fuelLitres || 0;
  into.fuelCost += extra.fuelCost || 0;
  into.pickupsCompleted += extra.pickupsCompleted || 0;
  into.durationMinutes += extra.durationMinutes || 0;
}

function completedOnOrAfter(completedAt: Date | string | null | undefined, from: Date) {
  if (!completedAt) return false;
  return new Date(completedAt).getTime() >= from.getTime();
}

export async function partnerDutyRecord(partner: PickupPartner) {
  const rate = await getOfficeFuelRate(partner.officeId);
  const open = await getOpenShift(partner.id);
  const shifts = await listPartnerShifts(partner.id, 90);
  const jobs = await storage.getPickupJobsByPartner(partner.id);
  const todayStart = startOfIstDay();
  const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

  const today = emptyPickupTotals();
  const lifetime = emptyPickupTotals();
  const week = { pickupsCompleted: 0, distanceKm: 0 };

  for (const raw of shifts) {
    const shift = presentShift(raw, rate);
    const km = num(shift.distanceKm);
    const litres = num(shift.fuelLitres);
    const cost = num(shift.fuelCost);
    const mins = num(shift.durationMinutes);
    addTotals(lifetime, { distanceKm: km, fuelLitres: litres, fuelCost: cost, durationMinutes: mins });
    const started = shift.startedAt ? new Date(shift.startedAt) : null;
    if (started && started >= todayStart) {
      addTotals(today, { distanceKm: km, fuelLitres: litres, fuelCost: cost, durationMinutes: mins });
    }
    if (started && started >= weekStart) week.distanceKm += km;
  }

  const completedDays = new Set<string>();
  for (const job of jobs) {
    if (job.status !== "completed") continue;
    lifetime.pickupsCompleted += 1;
    if (completedOnOrAfter(job.completedAt, todayStart)) today.pickupsCompleted += 1;
    if (completedOnOrAfter(job.completedAt, weekStart)) week.pickupsCompleted += 1;
    if (job.completedAt) {
      completedDays.add(startOfIstDay(new Date(job.completedAt)).toISOString().slice(0, 10));
    }
  }

  let streakDays = 0;
  for (let i = 0; i < 30; i++) {
    const day = startOfIstDay(new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000))
      .toISOString()
      .slice(0, 10);
    if (!completedDays.has(day)) {
      if (i === 0) continue;
      break;
    }
    streakDays += 1;
  }

  const lastFix = open || shifts[0];
  return {
    rate,
    open,
    today,
    week,
    lifetime,
    streakDays,
    lastLat: lastFix?.lastLat && num(lastFix.lastLat) !== 0 ? num(lastFix.lastLat) : null,
    lastLng: lastFix?.lastLng && num(lastFix.lastLng) !== 0 ? num(lastFix.lastLng) : null,
    lastFixAt: lastFix?.lastFixAt ? new Date(lastFix.lastFixAt).toISOString() : null,
    onDuty: Boolean(open),
  };
}

export async function listOfficeLivePartners(
  officeId: string,
  branchId?: string | null,
): Promise<PickupLivePartner[]> {
  const all = await storage.getPickupPartnersByOffice(officeId);
  const partners = branchId
    ? all.filter((partner) => partner.branchId === branchId || (partner.status === "pending" && !partner.branchId))
    : all;
  const rows: PickupLivePartner[] = [];
  for (const partner of partners) {
    if (partner.status === "pending") continue;
    const record = await partnerDutyRecord(partner);
    const store = partner.branchId ? await storage.getBranch(partner.branchId) : undefined;
    rows.push({
      id: partner.id,
      name: partner.name,
      phone: partner.phone,
      status: partner.status,
      availability: partner.availability,
      storeName: store?.name ?? null,
      branchId: partner.branchId,
      onDuty: record.onDuty,
      lastLat: record.lastLat,
      lastLng: record.lastLng,
      lastFixAt: record.lastFixAt,
      today: record.today,
      lifetime: record.lifetime,
    });
  }
  rows.sort((a, b) => Number(b.onDuty) - Number(a.onDuty) || b.today.pickupsCompleted - a.today.pickupsCompleted);
  return rows;
}

export async function partnerStats(partner: PickupPartner): Promise<PickupPartnerStats> {
  const record = await partnerDutyRecord(partner);
  const peers = await listOfficeLivePartners(partner.officeId, partner.branchId);
  const ranked = [...peers].sort(
    (a, b) =>
      b.today.pickupsCompleted - a.today.pickupsCompleted ||
      b.today.distanceKm - a.today.distanceKm,
  );
  const rank = ranked.findIndex((row) => row.id === partner.id);
  return {
    today: record.today,
    week: record.week,
    streakDays: record.streakDays,
    rank: rank >= 0 ? rank + 1 : null,
    partnerCount: ranked.length,
    badges: buildPickupBadges({
      todayPickups: record.today.pickupsCompleted,
      todayKm: record.today.distanceKm,
      lifetimePickups: record.lifetime.pickupsCompleted,
      streakDays: record.streakDays,
    }),
  };
}

export async function jobDrivingRoute(
  partner: PickupPartner,
  jobId: string,
  origin?: { lat: number; lng: number },
) {
  const job = await storage.getPickupJob(jobId);
  if (!job || job.partnerId !== partner.id) {
    throw Object.assign(new Error("Job not found"), { status: 404 });
  }
  const request = await storage.getBookingRequest(job.bookingRequestId);
  const destLat = mapCoord(request?.pickupLat, NaN);
  const destLng = mapCoord(request?.pickupLng, NaN);
  if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) {
    throw Object.assign(new Error("This pickup does not have a map pin yet."), { status: 400 });
  }
  const open = await getOpenShift(partner.id);
  const from =
    origin ||
    (open?.lastLat && open.lastLng
      ? { lat: num(open.lastLat), lng: num(open.lastLng) }
      : null);
  const destination = {
    lat: destLat,
    lng: destLng,
    label: request?.pickupLocationName || request?.senderAddress || request?.senderName || "Pickup",
  };
  if (!from) {
    return {
      origin: null,
      destination,
      polyline: "",
      points: [] as Array<[number, number]>,
      distanceKm: 0,
      distanceText: "",
      durationSeconds: 0,
      durationText: "Open maps for turn-by-turn",
    };
  }
  const route = await getDirectionsRoute(from.lat, from.lng, destLat, destLng);
  if (!route) {
    throw Object.assign(new Error("Could not calculate a driving route."), { status: 404 });
  }
  return { origin: from, destination, ...route };
}

export async function createAssignedDemoJob(partner: PickupPartner) {
  if (partner.status !== "active") {
    throw Object.assign(new Error("Activate this partner before assigning a pickup."), { status: 400 });
  }
  const branch = partner.branchId ? await storage.getBranch(partner.branchId) : undefined;
  const pickupLat = mapCoord(branch?.lat, 17.4487856);
  const pickupLng = mapCoord(branch?.lng, 78.3638547);
  const request = await storage.createBookingRequest({
    officeId: partner.officeId,
    branchId: partner.branchId,
    senderName: "Walk-in Demo",
    senderPhone: "9876500101",
    senderAddress: branch?.address || "Gachibowli Main Road, Kondapur",
    senderCity: branch?.city || "Hyderabad",
    senderState: branch?.state || "Telangana",
    senderPincode: branch?.pincode || "500032",
    receiverName: "Warehouse Hub",
    receiverPhone: "9966032234",
    receiverAddress: "Yelahanka Industrial Area",
    receiverCity: "Bengaluru",
    receiverState: "Karnataka",
    receiverPincode: "560064",
    weight: "2.50",
    numberOfPieces: 1,
    contentDescription: "Clothes",
    declaredValue: "1500",
    serviceType: "surface",
    shipmentType: "domestic",
    pickupLat: String(pickupLat),
    pickupLng: String(pickupLng),
    pickupLocationName: branch?.name ? `${branch.name} area pickup` : "Kondapur cloth pickup",
    pickupDate: new Date().toISOString().slice(0, 10),
    pickupTimeSlot: "09:00-12:00",
    source: "hub_qr",
    status: "pending",
    isDemo: true,
    notes: "Demo pickup for route, fuel, and live tracking.",
  });
  const now = new Date();
  const job = await storage.createPickupJob({
    officeId: partner.officeId,
    branchId: partner.branchId,
    bookingRequestId: request.id,
    partnerId: partner.id,
    status: "assigned",
    assignedAt: now,
  });
  await storage.updatePickupPartner(partner.id, { lastAssignedAt: now, availability: "busy" });
  triggerPickupPartnerNotification(
    partner.id,
    "New pickup assigned",
    `Collect ${request.senderName}'s parcel (${request.requestNumber}).`,
    { jobId: job.id, bookingRequestId: request.id, requestNumber: request.requestNumber },
  );
  return { request, job };
}

export async function latestSignedInPickupPartner(): Promise<PickupPartner | undefined> {
  const [live] = await db
    .select()
    .from(pickupPartnerSessions)
    .where(gte(pickupPartnerSessions.expiresAt, new Date()))
    .orderBy(desc(pickupPartnerSessions.createdAt))
    .limit(1);
  if (live) return storage.getPickupPartner(live.partnerId);
  const [any] = await db
    .select()
    .from(pickupPartnerSessions)
    .orderBy(desc(pickupPartnerSessions.createdAt))
    .limit(1);
  if (!any) return undefined;
  return storage.getPickupPartner(any.partnerId);
}
