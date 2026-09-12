import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  Clock3,
  Package,
  PackageCheck,
  Phone,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XGOO_CONTACT, XGOO_MODULES } from "@/components/marketing/site-info";
import { cn } from "@/lib/utils";

type GoBooking = {
  id: string;
  requestNumber: string;
  status: string;
  senderCity?: string | null;
  receiverCity?: string | null;
  receiverName?: string;
  createdAt: string;
  tracking?: { overallStatus?: string; overallStatusLabel?: string };
};

type GoNotification = {
  id: string;
  readAt?: string | null;
};

type AppBanner = {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
};

function inTransitCount(items: GoBooking[]) {
  return items.filter((item) =>
    ["converted", "picked_up", "in_transit", "out_for_delivery"].includes(item.status),
  ).length;
}

function pendingCount(items: GoBooking[]) {
  return items.filter((item) =>
    ["pending", "submitted", "reviewed", "approved", "booked"].includes(item.status),
  ).length;
}

export function GoHome({
  token,
  slug,
  userName,
  module = "go",
  extraActions = [],
  onBook,
  onShipments,
  onNotifications,
  onOpenBooking,
}: {
  token: string;
  slug: string;
  userName?: string;
  module?: "go" | "pro";
  extraActions?: Array<{ label: string; icon: LucideIcon; onClick: () => void }>;
  onBook: () => void;
  onShipments: () => void;
  onNotifications: () => void;
  onOpenBooking: (id: string) => void;
}) {
  const firstName = userName?.trim().split(/\s+/)[0] || "Mover";
  const product = module === "pro" ? XGOO_MODULES.pro : XGOO_MODULES.go;
  const bookings = useQuery({
    queryKey: ["/api/customer/bookings", token],
    queryFn: async () => {
      const res = await fetch("/api/customer/bookings", {
        headers: { "x-customer-token": token },
      });
      if (!res.ok) throw new Error("Could not load shipments");
      return (await res.json()) as GoBooking[];
    },
  });
  const notifications = useQuery({
    queryKey: ["/api/customer/notifications", token],
    queryFn: async () => {
      const res = await fetch("/api/customer/notifications", {
        headers: { "x-customer-token": token },
      });
      if (!res.ok) return [] as GoNotification[];
      return (await res.json()) as GoNotification[];
    },
    refetchInterval: 15_000,
  });
  const banners = useQuery({
    queryKey: ["/api/public/office", slug, "app-banners"],
    queryFn: async () => {
      const res = await fetch(`/api/public/office/${encodeURIComponent(slug)}/app-banners`);
      if (!res.ok) return { banners: [] as AppBanner[] };
      return (await res.json()) as { banners: AppBanner[] };
    },
  });

  const items = bookings.data || [];
  const unread = (notifications.data || []).filter((item) => !item.readAt).length;
  const hero = banners.data?.banners?.[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-5 md:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">Good day,</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{product.meaning}.</p>
        </div>
        <button
          type="button"
          onClick={onNotifications}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700"
          aria-label="Notifications"
          data-testid="button-go-home-notifications"
        >
          <Bell className="h-4 w-4" />
          {unread ? (
            <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-[#FF4907] px-1 text-center text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
      </div>

      {hero ? (
        <a
          href={hero.linkUrl || undefined}
          className="block overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm"
        >
          {hero.imageUrl ? (
            <img src={hero.imageUrl} alt={hero.title || "XGoo"} className="h-40 w-full object-cover" />
          ) : null}
          {(hero.title || hero.subtitle) && (
            <div className="p-4">
              {hero.title ? <p className="font-semibold text-zinc-900">{hero.title}</p> : null}
              {hero.subtitle ? <p className="mt-1 text-sm text-zinc-500">{hero.subtitle}</p> : null}
            </div>
          )}
        </a>
      ) : (
        <Card className="border-zinc-100 bg-gradient-to-br from-[#FF4907] to-[#ff8a3d] p-5 text-white shadow-none">
          <p className="text-lg font-bold">
            {module === "pro" ? "Move business parcels in a few steps" : "Book a parcel in a few steps"}
          </p>
          <p className="mt-1 text-sm text-white/85">
            {module === "pro"
              ? "Standing pickup, destinations, and tracking in one place."
              : "Pickup, tracking, and delivery in one place."}
          </p>
        </Card>
      )}

      <div>
        <p className="mb-3 text-sm font-semibold text-zinc-900">Quick actions</p>
        <div className="flex flex-wrap gap-4">
          <button type="button" onClick={onBook} className="flex w-24 flex-col items-center gap-2">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF4907] text-white">
              <Package className="h-5 w-5" />
            </span>
            <span className="text-center text-xs font-semibold text-zinc-800">Book a Parcel</span>
          </button>
          {extraActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="flex w-24 flex-col items-center gap-2"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF4907]/10 text-[#FF4907]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-center text-xs font-semibold text-zinc-800">{action.label}</span>
              </button>
            );
          })}
          <a
            href={`tel:${XGOO_CONTACT.phone.replace(/\s/g, "")}`}
            className="flex w-24 flex-col items-center gap-2"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF4907]/10 text-[#FF4907]">
              <Phone className="h-5 w-5" />
            </span>
            <span className="text-center text-xs font-semibold text-zinc-800">Call us to book</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Truck} value={inTransitCount(items)} label="In transit" />
        <StatCard icon={Clock3} value={pendingCount(items)} label="Pending" />
        <StatCard
          icon={PackageCheck}
          value={items.filter((item) => item.status === "delivered").length}
          label="Delivered"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-900">Recent movements</p>
        <button
          type="button"
          onClick={onShipments}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#FF4907]"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {items.slice(0, 3).map((booking) => (
          <button
            key={booking.id}
            type="button"
            onClick={() => onOpenBooking(booking.id)}
            className="w-full rounded-2xl border border-zinc-100 bg-white p-4 text-left shadow-sm"
            data-testid={`button-go-recent-${booking.id}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-sm font-bold text-zinc-900">{booking.requestNumber}</p>
              <span className="text-xs font-medium text-zinc-500">
                {booking.tracking?.overallStatusLabel || booking.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              {booking.senderCity || "Pickup"} → {booking.receiverCity || booking.receiverName || "Destination"}
            </p>
          </button>
        ))}
        {!bookings.isLoading && items.length === 0 ? (
          <Card className="flex flex-col items-center border-zinc-100 p-8 text-center shadow-none">
            <PackageCheck className="h-8 w-8 text-[#FF4907]" />
            <p className="mt-3 font-semibold text-zinc-900">Your first movement starts here</p>
            <p className="mt-1 text-sm text-zinc-500">
              Book a parcel and follow every milestone from pickup to delivery.
            </p>
            <Button className="mt-4 rounded-none bg-[#FF4907] hover:bg-[#e03d00]" onClick={onBook}>
              Book a parcel
            </Button>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Truck;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-3">
      <Icon className="h-4 w-4 text-[#FF4907]" />
      <p className="mt-2 text-xl font-extrabold text-zinc-900">{value}</p>
      <p className="text-[11px] font-medium text-zinc-500">{label}</p>
    </div>
  );
}

export function GoNotifications({
  token,
  onBack,
  onOpenBooking,
}: {
  token: string;
  onBack: () => void;
  onOpenBooking?: (id: string) => void;
}) {
  const query = useQuery({
    queryKey: ["/api/customer/notifications", token],
    queryFn: async () => {
      const res = await fetch("/api/customer/notifications", {
        headers: { "x-customer-token": token },
      });
      if (!res.ok) throw new Error("Could not load notifications");
      return (await res.json()) as Array<{
        id: string;
        title: string;
        body: string;
        readAt?: string | null;
        createdAt: string;
        data?: { shipmentId?: string; bookingRequestId?: string } | null;
      }>;
    },
    refetchInterval: 15_000,
  });

  async function markRead(id?: string) {
    await fetch("/api/customer/notifications/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-customer-token": token },
      body: JSON.stringify(id ? { id } : {}),
    }).catch(() => {});
    void query.refetch();
  }

  const items = query.data || [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
      <button type="button" onClick={onBack} className="mb-4 text-sm font-medium text-zinc-500">
        ← Back
      </button>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900">Notifications</h2>
        {items.some((item) => !item.readAt) ? (
          <button type="button" className="text-xs font-semibold text-[#FF4907]" onClick={() => void markRead()}>
            Mark all read
          </button>
        ) : null}
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (!item.readAt) void markRead(item.id);
              const openId = item.data?.bookingRequestId || item.data?.shipmentId;
              if (openId) onOpenBooking?.(openId);
            }}
            className={cn(
              "w-full rounded-2xl border p-4 text-left",
              item.readAt ? "border-zinc-100 bg-white" : "border-[#FF4907]/20 bg-[#FF4907]/5",
            )}
          >
            <p className="font-semibold text-zinc-900">{item.title}</p>
            <p className="mt-1 text-sm text-zinc-600">{item.body}</p>
            <p className="mt-2 text-xs text-zinc-400">
              {new Date(item.createdAt).toLocaleString("en-IN")}
            </p>
          </button>
        ))}
        {!query.isLoading && items.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">No notifications yet.</p>
        ) : null}
      </div>
    </div>
  );
}
