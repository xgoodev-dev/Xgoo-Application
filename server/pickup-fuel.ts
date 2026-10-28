import { and, desc, eq, sql } from "drizzle-orm";
import {
  pickupFuelClaims,
  pickupFuelRates,
  pickupPartnerShifts,
  pickupPartners,
  type PickupFuelClaim,
  type PickupFuelRate,
  type PickupPartner,
  type PickupPartnerShift,
} from "@shared/schema";
import {
  DEFAULT_PICKUP_FUEL,
  PICKUP_VEHICLE_TYPES,
  fuelFromDistance,
  haversineKm,
  workingHoursMinutes,
  type PickupFuelClaimStatus,
  type PickupVehicleType,
} from "@shared/pickup-fuel";
import { db } from "./db";

const MAX_OPEN_SHIFT_HOURS = 16;
const MIN_MOVE_KM = 0.015;
const MAX_JUMP_KM = 2;
const MAX_ACCURACY_M = 80;

let fuelTablesReady: Promise<void> | null = null;

export async function ensurePickupFuelTables() {
  if (!fuelTablesReady) {
    fuelTablesReady = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS pickup_fuel_rates (
          office_id varchar PRIMARY KEY REFERENCES offices(id) ON DELETE CASCADE,
          vehicle_type varchar(20) NOT NULL DEFAULT 'bike',
          mileage_km_per_litre numeric(8, 2) NOT NULL DEFAULT 40,
          fuel_price_per_litre numeric(8, 2) NOT NULL DEFAULT 105,
          updated_at timestamp DEFAULT now()
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS pickup_partner_shifts (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          office_id varchar NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
          partner_id varchar NOT NULL REFERENCES pickup_partners(id) ON DELETE CASCADE,
          status varchar(20) NOT NULL DEFAULT 'open',
          started_at timestamp NOT NULL DEFAULT now(),
          ended_at timestamp,
          duration_minutes integer NOT NULL DEFAULT 0,
          distance_km numeric(12, 3) NOT NULL DEFAULT 0,
          fuel_litres numeric(12, 3) NOT NULL DEFAULT 0,
          fuel_cost numeric(12, 2) NOT NULL DEFAULT 0,
          mileage_km_per_litre numeric(8, 2),
          fuel_price_per_litre numeric(8, 2),
          start_lat numeric(10, 7),
          start_lng numeric(10, 7),
          end_lat numeric(10, 7),
          end_lng numeric(10, 7),
          last_lat numeric(10, 7),
          last_lng numeric(10, 7),
          last_fix_at timestamp,
          point_count integer NOT NULL DEFAULT 0,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        )
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_pickup_partner_shifts_partner
        ON pickup_partner_shifts (partner_id, status)
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS pickup_fuel_claims (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          office_id varchar NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
          partner_id varchar NOT NULL REFERENCES pickup_partners(id) ON DELETE CASCADE,
          shift_id varchar NOT NULL REFERENCES pickup_partner_shifts(id) ON DELETE CASCADE,
          distance_km numeric(12, 3) NOT NULL,
          fuel_litres numeric(12, 3) NOT NULL,
          amount numeric(12, 2) NOT NULL,
          mileage_km_per_litre numeric(8, 2) NOT NULL,
          fuel_price_per_litre numeric(8, 2) NOT NULL,
          status varchar(20) NOT NULL DEFAULT 'requested',
          notes text,
          review_notes text,
          requested_at timestamp DEFAULT now(),
          reviewed_at timestamp,
          reviewed_by_user_id varchar,
          paid_at timestamp,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        )
      `);
      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_pickup_fuel_claims_shift
        ON pickup_fuel_claims (shift_id)
      `);
    })().catch((error) => {
      fuelTablesReady = null;
      throw error;
    });
  }
  await fuelTablesReady;
}

function num(value: string | number | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getOfficeFuelRate(officeId: string): Promise<PickupFuelRate> {
  await ensurePickupFuelTables();
  const [existing] = await db.select().from(pickupFuelRates).where(eq(pickupFuelRates.officeId, officeId));
  if (existing) return existing;
  const [created] = await db
    .insert(pickupFuelRates)
    .values({
      officeId,
      vehicleType: DEFAULT_PICKUP_FUEL.vehicleType,
      mileageKmPerLitre: String(DEFAULT_PICKUP_FUEL.mileageKmPerLitre),
      fuelPricePerLitre: String(DEFAULT_PICKUP_FUEL.fuelPricePerLitre),
    })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [again] = await db.select().from(pickupFuelRates).where(eq(pickupFuelRates.officeId, officeId));
  return (
    again || {
      officeId,
      vehicleType: DEFAULT_PICKUP_FUEL.vehicleType,
      mileageKmPerLitre: String(DEFAULT_PICKUP_FUEL.mileageKmPerLitre),
      fuelPricePerLitre: String(DEFAULT_PICKUP_FUEL.fuelPricePerLitre),
      updatedAt: new Date(),
    }
  );
}

export async function saveOfficeFuelRate(
  officeId: string,
  input: { vehicleType?: PickupVehicleType; mileageKmPerLitre?: number; fuelPricePerLitre?: number },
) {
  const current = await getOfficeFuelRate(officeId);
  const vehicleType =
    input.vehicleType && PICKUP_VEHICLE_TYPES.includes(input.vehicleType)
      ? input.vehicleType
      : (current.vehicleType as PickupVehicleType);
  const mileage =
    input.mileageKmPerLitre != null ? input.mileageKmPerLitre : num(current.mileageKmPerLitre, 40);
  const price =
    input.fuelPricePerLitre != null ? input.fuelPricePerLitre : num(current.fuelPricePerLitre, 105);
  const [saved] = await db
    .insert(pickupFuelRates)
    .values({
      officeId,
      vehicleType,
      mileageKmPerLitre: String(mileage),
      fuelPricePerLitre: String(price),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: pickupFuelRates.officeId,
      set: {
        vehicleType,
        mileageKmPerLitre: String(mileage),
        fuelPricePerLitre: String(price),
        updatedAt: new Date(),
      },
    })
    .returning();
  return saved;
}

function applyFuel(shift: PickupPartnerShift, rate: PickupFuelRate, endedAt?: Date) {
  const fuel = fuelFromDistance(
    num(shift.distanceKm),
    num(shift.mileageKmPerLitre, num(rate.mileageKmPerLitre)),
    num(shift.fuelPricePerLitre, num(rate.fuelPricePerLitre)),
  );
  const end = endedAt || shift.endedAt || new Date();
  return {
    durationMinutes: workingHoursMinutes(shift.startedAt, end),
    fuelLitres: String(fuel.litres),
    fuelCost: String(fuel.amount),
    mileageKmPerLitre: String(fuel.mileageKmPerLitre),
    fuelPricePerLitre: String(fuel.fuelPricePerLitre),
  };
}

export function presentShift(shift: PickupPartnerShift, rate?: PickupFuelRate) {
  const live = applyFuel(
    shift,
    rate || {
      officeId: shift.officeId,
      vehicleType: DEFAULT_PICKUP_FUEL.vehicleType,
      mileageKmPerLitre: shift.mileageKmPerLitre || String(DEFAULT_PICKUP_FUEL.mileageKmPerLitre),
      fuelPricePerLitre: shift.fuelPricePerLitre || String(DEFAULT_PICKUP_FUEL.fuelPricePerLitre),
      updatedAt: new Date(),
    },
    shift.status === "open" ? new Date() : shift.endedAt || undefined,
  );
  return {
    ...shift,
    durationMinutes: live.durationMinutes,
    fuelLitres: live.fuelLitres,
    fuelCost: live.fuelCost,
    distanceKm: String(num(shift.distanceKm)),
  };
}

export async function getOpenShift(partnerId: string) {
  await ensurePickupFuelTables();
  const [shift] = await db
    .select()
    .from(pickupPartnerShifts)
    .where(and(eq(pickupPartnerShifts.partnerId, partnerId), eq(pickupPartnerShifts.status, "open")))
    .orderBy(desc(pickupPartnerShifts.startedAt))
    .limit(1);
  return shift;
}

export async function startPartnerShift(partner: PickupPartner) {
  await ensurePickupFuelTables();
  const open = await getOpenShift(partner.id);
  if (open) {
    const ageHours = (Date.now() - new Date(open.startedAt).getTime()) / 3_600_000;
    if (ageHours < MAX_OPEN_SHIFT_HOURS) return open;
    await closePartnerShift(partner);
  }
  const rate = await getOfficeFuelRate(partner.officeId);
  const [created] = await db
    .insert(pickupPartnerShifts)
    .values({
      officeId: partner.officeId,
      partnerId: partner.id,
      status: "open",
      startedAt: new Date(),
      mileageKmPerLitre: rate.mileageKmPerLitre,
      fuelPricePerLitre: rate.fuelPricePerLitre,
    })
    .returning();
  return created;
}

export async function closePartnerShift(partner: PickupPartner, point?: { lat: number; lng: number }) {
  const open = await getOpenShift(partner.id);
  if (!open) return null;
  const rate = await getOfficeFuelRate(partner.officeId);
  const endedAt = new Date();
  const fuel = applyFuel(open, rate, endedAt);
  const [closed] = await db
    .update(pickupPartnerShifts)
    .set({
      status: "closed",
      endedAt,
      durationMinutes: fuel.durationMinutes,
      fuelLitres: fuel.fuelLitres,
      fuelCost: fuel.fuelCost,
      mileageKmPerLitre: fuel.mileageKmPerLitre,
      fuelPricePerLitre: fuel.fuelPricePerLitre,
      endLat: point ? String(point.lat) : open.lastLat,
      endLng: point ? String(point.lng) : open.lastLng,
      updatedAt: endedAt,
    })
    .where(eq(pickupPartnerShifts.id, open.id))
    .returning();
  return closed;
}

export async function recordShiftPoints(
  partner: PickupPartner,
  points: Array<{ lat: number; lng: number; accuracy?: number; recordedAt?: string }>,
) {
  let shift = await getOpenShift(partner.id);
  if (!shift) shift = await startPartnerShift(partner);
  const rate = await getOfficeFuelRate(partner.officeId);
  let distance = num(shift.distanceKm);
  let lastLat = shift.lastLat ? num(shift.lastLat) : null;
  let lastLng = shift.lastLng ? num(shift.lastLng) : null;
  let lastFixAt = shift.lastFixAt;
  let pointCount = shift.pointCount || 0;
  let startLat = shift.startLat;
  let startLng = shift.startLng;

  for (const point of points) {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) continue;
    if (Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) continue;
    if (point.accuracy != null && point.accuracy > MAX_ACCURACY_M) continue;
    const at = point.recordedAt ? new Date(point.recordedAt) : new Date();
    if (lastLat != null && lastLng != null) {
      const moved = haversineKm({ lat: lastLat, lng: lastLng }, { lat: point.lat, lng: point.lng });
      const dtSec = lastFixAt ? Math.max(1, (at.getTime() - new Date(lastFixAt).getTime()) / 1000) : 30;
      if (moved > MAX_JUMP_KM && dtSec < 25) continue;
      if (moved >= MIN_MOVE_KM) distance += moved;
    } else {
      startLat = String(point.lat);
      startLng = String(point.lng);
    }
    lastLat = point.lat;
    lastLng = point.lng;
    lastFixAt = at;
    pointCount += 1;
  }

  const [updated] = await db
    .update(pickupPartnerShifts)
    .set({
      distanceKm: String(Math.round(distance * 1000) / 1000),
      lastLat: lastLat != null ? String(lastLat) : shift.lastLat,
      lastLng: lastLng != null ? String(lastLng) : shift.lastLng,
      lastFixAt,
      pointCount,
      startLat,
      startLng,
      updatedAt: new Date(),
    })
    .where(eq(pickupPartnerShifts.id, shift.id))
    .returning();
  return presentShift(updated || shift, rate);
}

export async function listPartnerShifts(partnerId: string, limit = 30) {
  await ensurePickupFuelTables();
  return db
    .select()
    .from(pickupPartnerShifts)
    .where(eq(pickupPartnerShifts.partnerId, partnerId))
    .orderBy(desc(pickupPartnerShifts.startedAt))
    .limit(limit);
}

export async function getShift(id: string) {
  const [shift] = await db.select().from(pickupPartnerShifts).where(eq(pickupPartnerShifts.id, id));
  return shift;
}

export async function listPartnerClaims(partnerId: string) {
  await ensurePickupFuelTables();
  return db
    .select()
    .from(pickupFuelClaims)
    .where(eq(pickupFuelClaims.partnerId, partnerId))
    .orderBy(desc(pickupFuelClaims.requestedAt));
}

export async function requestFuelClaim(partner: PickupPartner, shiftId: string, notes?: string) {
  const shift = await getShift(shiftId);
  if (!shift || shift.partnerId !== partner.id) {
    throw Object.assign(new Error("Shift not found."), { status: 404 });
  }
  if (shift.status !== "closed") {
    throw Object.assign(new Error("Sign out first so this duty can be closed, then request fuel."), {
      status: 400,
    });
  }
  const [existing] = await db.select().from(pickupFuelClaims).where(eq(pickupFuelClaims.shiftId, shiftId));
  if (existing && existing.status !== "rejected") {
    throw Object.assign(new Error("Fuel cost for this duty is already requested."), { status: 409 });
  }
  const rate = await getOfficeFuelRate(partner.officeId);
  const fuel = applyFuel(shift, rate, shift.endedAt || new Date());
  if (num(shift.distanceKm) < 0.5) {
    throw Object.assign(new Error("Travel at least 0.5 km on duty before requesting fuel."), { status: 400 });
  }
  if (existing?.status === "rejected") {
    const [updated] = await db
      .update(pickupFuelClaims)
      .set({
        distanceKm: String(num(shift.distanceKm)),
        fuelLitres: fuel.fuelLitres,
        amount: fuel.fuelCost,
        mileageKmPerLitre: fuel.mileageKmPerLitre,
        fuelPricePerLitre: fuel.fuelPricePerLitre,
        status: "requested",
        notes: notes?.trim() || existing.notes,
        reviewNotes: null,
        requestedAt: new Date(),
        reviewedAt: null,
        reviewedByUserId: null,
        paidAt: null,
        updatedAt: new Date(),
      })
      .where(eq(pickupFuelClaims.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(pickupFuelClaims)
    .values({
      officeId: partner.officeId,
      partnerId: partner.id,
      shiftId,
      distanceKm: String(num(shift.distanceKm)),
      fuelLitres: fuel.fuelLitres,
      amount: fuel.fuelCost,
      mileageKmPerLitre: fuel.mileageKmPerLitre,
      fuelPricePerLitre: fuel.fuelPricePerLitre,
      status: "requested",
      notes: notes?.trim() || null,
    })
    .returning();
  return created;
}

export async function listOfficeFuelClaims(officeId: string, branchId?: string | null) {
  await ensurePickupFuelTables();
  const rows = await db
    .select({
      claim: pickupFuelClaims,
      partnerName: pickupPartners.name,
      partnerPhone: pickupPartners.phone,
      partnerBranchId: pickupPartners.branchId,
    })
    .from(pickupFuelClaims)
    .innerJoin(pickupPartners, eq(pickupFuelClaims.partnerId, pickupPartners.id))
    .where(eq(pickupFuelClaims.officeId, officeId))
    .orderBy(desc(pickupFuelClaims.requestedAt));
  return rows
    .filter((row) => !branchId || row.partnerBranchId === branchId)
    .map((row) => ({
      ...row.claim,
      partnerName: row.partnerName,
      partnerPhone: row.partnerPhone,
    }));
}

export async function reviewFuelClaim(
  claimId: string,
  officeId: string,
  input: { status: PickupFuelClaimStatus; reviewNotes?: string; reviewerUserId?: string },
) {
  const [claim] = await db.select().from(pickupFuelClaims).where(eq(pickupFuelClaims.id, claimId));
  if (!claim || claim.officeId !== officeId) {
    throw Object.assign(new Error("Fuel request not found."), { status: 404 });
  }
  const status = input.status;
  switch (status) {
    case "approved":
    case "rejected":
    case "paid":
    case "requested":
      break;
    default: {
      const _exhaustive: never = status;
      throw Object.assign(new Error(`Unsupported status: ${String(_exhaustive)}`), { status: 400 });
    }
  }
  if (status === "paid" && claim.status !== "approved" && claim.status !== "paid") {
    throw Object.assign(new Error("Approve the fuel request before marking it paid."), { status: 400 });
  }
  const now = new Date();
  const [updated] = await db
    .update(pickupFuelClaims)
    .set({
      status,
      reviewNotes: input.reviewNotes?.trim() || claim.reviewNotes,
      reviewedAt: status === "requested" ? claim.reviewedAt : now,
      reviewedByUserId: input.reviewerUserId || claim.reviewedByUserId,
      paidAt: status === "paid" ? now : status === "rejected" ? null : claim.paidAt,
      updatedAt: now,
    })
    .where(eq(pickupFuelClaims.id, claimId))
    .returning();
  return updated;
}

export type { PickupFuelClaim };
