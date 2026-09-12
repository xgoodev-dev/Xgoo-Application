import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  Clock3,
  Package,
  PackageCheck,
  Truck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { storeTypeLabel, todayIsoDate } from "@shared/business-courier";
import { businessApi } from "./business-api";

type BookingRow = {
  id: string;
  requestNumber: string;
  status: string;
  senderCity?: string | null;
  receiverCity?: string | null;
  receiverName?: string;
  tracking?: { overallStatusLabel?: string };
};

type TodayPayload = {
  pickupDay: boolean;
  profile: {
    companyName?: string;
    storeType?: string;
    pickupTimeSlot?: string | null;
    pickupAddress?: string;
  };
  jobs: Array<{ status: string }>;
  destinations: unknown[];
};

function inTransitCount(items: BookingRow[]) {
  return items.filter((item) =>
    ["converted", "picked_up", "in_transit", "out_for_delivery"].includes(item.status),
  ).length;
}

export function ProHome({
  token,
  userName,
  onPickup,
  onCustomers,
  onShipments,
  onSchedule,
  onNotifications,
  onOpenBooking,
}: {
  token: string;
  userName?: string;
  onPickup: () => void;
  onCustomers: () => void;
  onShipments: () => void;
  onSchedule: () => void;
  onNotifications: () => void;
  onOpenBooking: (id: string) => void;
}) {
  const firstName = userName?.trim().split(/\s+/)[0] || "Mover";
  const date = todayIsoDate();
  const api = businessApi(token);

  const todayQuery = useQuery({
    queryKey: ["/api/customer/business/today", date],
    queryFn: () => api.today(date) as Promise<TodayPayload>,
  });
  const customersQuery = useQuery({
    queryKey: ["/api/customer/business/destinations"],
    queryFn: () => api.destinations() as Promise<unknown[]>,
  });
  const bookings = useQuery({
    queryKey: ["/api/customer/bookings", token],
    queryFn: async () => {
      const res = await fetch("/api/customer/bookings", {
        headers: { "x-customer-token": token },
      });
      if (!res.ok) throw new Error("Could not load shipments");
      return (await res.json()) as BookingRow[];
    },
  });
  const notifications = useQuery({
    queryKey: ["/api/customer/notifications", token],
    queryFn: async () => {
      const res = await fetch("/api/customer/notifications", {
        headers: { "x-customer-token": token },
      });
      if (!res.ok) return [] as Array<{ readAt?: string | null }>;
      return (await res.json()) as Array<{ readAt?: string | null }>;
    },
    refetchInterval: 15_000,
  });

  const items = bookings.data || [];
  const unread = (notifications.data || []).filter((item) => !item.readAt).length;
  const planned = (todayQuery.data?.jobs || []).filter((job) => job.status === "planned").length;
  const submitted = (todayQuery.data?.jobs || []).filter((job) => job.status === "submitted").length;
  const pickupDay = Boolean(todayQuery.data?.pickupDay);
  const profile = todayQuery.data?.profile;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-5 md:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">Good day,</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {profile?.companyName || XGOO_MODULES.pro.name} · {XGOO_MODULES.pro.meaning}.
          </p>
        </div>
        <button
          type="button"
          onClick={onNotifications}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread ? (
            <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-[#FF4907] px-1 text-center text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
      </div>

      <Card className="border-zinc-100 bg-gradient-to-br from-[#FF4907] to-[#ff8a3d] p-5 text-white shadow-none">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
          {pickupDay ? "Pickup day" : "Scheduled pickup"}
        </p>
        <p className="mt-1 text-lg font-bold">
          {pickupDay
            ? `${planned} parcel${planned === 1 ? "" : "s"} ready for collection`
            : "Today is not a pickup day on your schedule"}
        </p>
        <p className="mt-1 text-sm text-white/85">
          {profile?.pickupTimeSlot
            ? `Standing pickup ${profile.pickupTimeSlot} · ${storeTypeLabel(profile.storeType)}`
            : "Set a standing pickup so XGoo can collect from your store."}
          {submitted ? ` · ${submitted} already sent to XGoo` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            className="rounded-none bg-white text-[#FF4907] hover:bg-white/90"
            onClick={pickupDay ? onPickup : onSchedule}
          >
            {pickupDay ? "Request pickup" : "Edit schedule"}
          </Button>
          <Button
            variant="ghost"
            className="rounded-none text-white hover:bg-white/10 hover:text-white"
            onClick={onCustomers}
          >
            Manage customers
          </Button>
        </div>
      </Card>

      <div>
        <p className="mb-3 text-sm font-semibold text-zinc-900">Quick actions</p>
        <div className="flex flex-wrap gap-4">
          <QuickAction icon={Package} label="Request pickup" onClick={onPickup} accent />
          <QuickAction icon={Users} label="Customers" onClick={onCustomers} />
          <QuickAction icon={Truck} label="Shipments" onClick={onShipments} />
          <QuickAction icon={Clock3} label="Schedule" onClick={onSchedule} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard value={customersQuery.data?.length || 0} label="Customers" />
        <StatCard value={inTransitCount(items)} label="In transit" />
        <StatCard
          value={items.filter((item) => item.status === "delivered").length}
          label="Delivered"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-900">All shipments</p>
        <button
          type="button"
          onClick={onShipments}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#FF4907]"
        >
          Track all
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {items.slice(0, 5).map((booking) => (
          <button
            key={booking.id}
            type="button"
            onClick={() => onOpenBooking(booking.id)}
            className="w-full rounded-2xl border border-zinc-100 bg-white p-4 text-left shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-sm font-bold text-zinc-900">{booking.requestNumber}</p>
              <span className="text-xs font-medium text-zinc-500">
                {booking.tracking?.overallStatusLabel || booking.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              {booking.receiverName || "Customer"} · {booking.receiverCity || "Destination"}
            </p>
          </button>
        ))}
        {!bookings.isLoading && items.length === 0 ? (
          <Card className="flex flex-col items-center border-zinc-100 p-8 text-center shadow-none">
            <PackageCheck className="h-8 w-8 text-[#FF4907]" />
            <p className="mt-3 font-semibold text-zinc-900">No shipments yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              Add parcels on Pickup for a saved customer or a new customer, then request collection.
            </p>
            <Button className="mt-4 rounded-none bg-[#FF4907] hover:bg-[#e03d00]" onClick={onPickup}>
              Request pickup
            </Button>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  accent,
}: {
  icon: typeof Package;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-24 flex-col items-center gap-2">
      <span
        className={
          accent
            ? "flex h-14 w-14 items-center justify-center rounded-full bg-[#FF4907] text-white"
            : "flex h-14 w-14 items-center justify-center rounded-full bg-[#FF4907]/10 text-[#FF4907]"
        }
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-center text-xs font-semibold text-zinc-800">{label}</span>
    </button>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-3">
      <p className="text-xl font-extrabold text-zinc-900">{value}</p>
      <p className="text-[11px] font-medium text-zinc-500">{label}</p>
    </div>
  );
}
