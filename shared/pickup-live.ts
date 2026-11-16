export type PickupLiveTotals = {
  distanceKm: number;
  fuelLitres: number;
  fuelCost: number;
  pickupsCompleted: number;
  durationMinutes: number;
};

export type PickupLivePartner = {
  id: string;
  name: string;
  phone: string;
  status: string;
  availability: string;
  storeName: string | null;
  branchId: string | null;
  onDuty: boolean;
  lastLat: number | null;
  lastLng: number | null;
  lastFixAt: string | null;
  today: PickupLiveTotals;
  lifetime: PickupLiveTotals;
};

export type PickupBadge = {
  id: string;
  title: string;
  detail: string;
  earned: boolean;
};

export type PickupPartnerStats = {
  today: PickupLiveTotals;
  week: { pickupsCompleted: number; distanceKm: number };
  streakDays: number;
  rank: number | null;
  partnerCount: number;
  badges: PickupBadge[];
};

export function startOfIstDay(now = new Date()): Date {
  const istMs = now.getTime() + 330 * 60 * 1000;
  const ist = new Date(istMs);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - 330 * 60 * 1000);
}

export function emptyPickupTotals(): PickupLiveTotals {
  return { distanceKm: 0, fuelLitres: 0, fuelCost: 0, pickupsCompleted: 0, durationMinutes: 0 };
}

export function buildPickupBadges(input: {
  todayPickups: number;
  todayKm: number;
  lifetimePickups: number;
  streakDays: number;
}): PickupBadge[] {
  return [
    {
      id: "first",
      title: "First collection",
      detail: "Complete your first pickup",
      earned: input.lifetimePickups >= 1,
    },
    {
      id: "five-today",
      title: "Five in a day",
      detail: "Finish 5 pickups today",
      earned: input.todayPickups >= 5,
    },
    {
      id: "ten-today",
      title: "Ten-stop hero",
      detail: "Finish 10 pickups today",
      earned: input.todayPickups >= 10,
    },
    {
      id: "km-20",
      title: "20 km rider",
      detail: "Cover 20 km on duty today",
      earned: input.todayKm >= 20,
    },
    {
      id: "km-50",
      title: "50 km rider",
      detail: "Cover 50 km on duty today",
      earned: input.todayKm >= 50,
    },
    {
      id: "streak-3",
      title: "3-day streak",
      detail: "Collect on 3 days in a row",
      earned: input.streakDays >= 3,
    },
    {
      id: "streak-7",
      title: "Week on the move",
      detail: "Collect on 7 days in a row",
      earned: input.streakDays >= 7,
    },
  ];
}
