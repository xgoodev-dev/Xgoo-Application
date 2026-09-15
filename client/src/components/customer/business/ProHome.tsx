import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  ClipboardList,
  Clock3,
  Loader2,
  Package,
  PackageCheck,
  Receipt,
  Truck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import {
  BUSINESS_ORDER_CHANNELS,
  pickupStyleLabel,
  storeTypeLabel,
  todayIsoDate,
} from "@shared/business-courier";
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

type StoreOrder = {
  id: string;
  channel: string;
  receiverName: string;
  receiverPhone: string;
  receiverCity?: string | null;
  contentDescription?: string | null;
  status: string;
};

type PendingQuote = {
  id: string;
  quotationNumber: string;
  totalAmount: string;
  acceptToken?: string | null;
  senderCity?: string | null;
  receiverCity?: string | null;
  status: string;
};

type TodayPayload = {
  pickupDay: boolean;
  pickupStyle?: "standing" | "on_demand";
  profile: {
    companyName?: string;
    storeName?: string;
    storeType?: string;
    pickupTimeSlot?: string | null;
    pickupStyle?: "standing" | "on_demand";
  };
  jobs: Array<{ status: string }>;
};

const ORDER_STATUS: Record<string, string> = {
  open: "Open",
  pickup_requested: "On pickup",
  booked: "Booked",
  cancelled: "Cancelled",
};

function inTransitCount(items: BookingRow[]) {
  return items.filter((item) =>
    ["converted", "picked_up", "in_transit", "out_for_delivery"].includes(item.status),
  ).length;
}

function channelLabel(channel: string) {
  return BUSINESS_ORDER_CHANNELS.find((item) => item.id === channel)?.label || channel;
}

export function ProHome({
  token,
  userName,
  onPickup,
  onOrders,
  onCustomers,
  onShipments,
  onBills,
  onSchedule,
  onNotifications,
  onOpenBooking,
}: {
  token: string;
  userName?: string;
  onPickup: () => void;
  onOrders: () => void;
  onCustomers: () => void;
  onShipments: () => void;
  onBills: () => void;
  onSchedule: () => void;
  onNotifications: () => void;
  onOpenBooking: (id: string) => void;
}) {
  const queryClient = useQueryClient();
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
  const ordersQuery = useQuery({
    queryKey: ["/api/customer/business/orders"],
    queryFn: () => api.orders() as Promise<StoreOrder[]>,
  });
  const billsQuery = useQuery({
    queryKey: ["/api/customer/business/bills"],
    queryFn: () => api.bills() as Promise<{ outstandingTotal: string; outstandingCount: number }>,
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
  const quotes = useQuery({
    queryKey: ["/api/customer/quotations", token],
    queryFn: async () => {
      const res = await fetch("/api/customer/quotations", {
        headers: { "x-customer-token": token },
      });
      if (!res.ok) return [] as PendingQuote[];
      return (await res.json()) as PendingQuote[];
    },
    refetchInterval: 15_000,
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
  const orders = ordersQuery.data || [];
  const openOrders = orders.filter((order) => order.status === "open");
  const unread = (notifications.data || []).filter((item) => !item.readAt).length;
  const pendingQuotes = (quotes.data || []).filter((item) => item.status === "sent");
  const refreshAfterQuote = () => {
    void queryClient.invalidateQueries({ queryKey: ["/api/customer/quotations", token] });
    void queryClient.invalidateQueries({ queryKey: ["/api/customer/bookings", token] });
    void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/bills"] });
  };
  const acceptQuoteById = async (id: string) => {
    const res = await fetch(`/api/customer/quotations/${id}/accept`, {
      method: "POST",
      headers: { "x-customer-token": token },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.message || "Could not accept quote");
    return body;
  };
  const acceptQuote = useMutation({
    mutationFn: acceptQuoteById,
    onSuccess: refreshAfterQuote,
  });
  const acceptAllQuotes = useMutation({
    mutationFn: async () => {
      for (const quote of pendingQuotes) {
        await acceptQuoteById(quote.id);
      }
    },
    onSuccess: refreshAfterQuote,
  });
  const planned = (todayQuery.data?.jobs || []).filter((job) => job.status === "planned").length;
  const submitted = (todayQuery.data?.jobs || []).filter((job) => job.status === "submitted").length;
  const profile = todayQuery.data?.profile;
  const pickupStyle = todayQuery.data?.pickupStyle || profile?.pickupStyle || "standing";
  const storeLabel = profile?.storeName || profile?.companyName || XGOO_MODULES.pro.name;

  return (
    <div className="space-y-6 py-5" data-testid="business-home">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#FF4907]">Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">Good day, {firstName}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {storeLabel}
            {profile?.storeType ? ` · ${storeTypeLabel(profile.storeType)}` : ""}
            {profile?.pickupTimeSlot
              ? ` · ${pickupStyleLabel(pickupStyle)} ${profile.pickupTimeSlot}`
              : ""}
            {submitted ? ` · ${submitted} parcel${submitted === 1 ? "" : "s"} already sent` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onNotifications}
          className="relative inline-flex h-10 w-10 items-center justify-center border border-zinc-200 bg-white text-zinc-700"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread ? (
            <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-[#FF4907] px-1 text-center text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Open orders" value={openOrders.length} onClick={onOrders} />
        <StatCard label="Today's pickup" value={planned} onClick={onPickup} />
        <StatCard label="In transit" value={inTransitCount(items)} onClick={onShipments} />
        <StatCard
          label="Due to XGoo"
          value={`₹${Number(billsQuery.data?.outstandingTotal || 0).toLocaleString("en-IN")}`}
          onClick={onBills}
        />
        <StatCard
          label="Customers"
          value={customersQuery.data?.length || 0}
          onClick={onCustomers}
        />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <QuickAction icon={ClipboardList} label="Record an order" onClick={onOrders} accent />
          <QuickAction icon={Package} label="Request pickup" onClick={onPickup} />
          <QuickAction icon={Users} label="Customers" onClick={onCustomers} />
          <QuickAction icon={Truck} label="Shipments" onClick={onShipments} />
          <QuickAction icon={Receipt} label="Bills" onClick={onBills} />
          <QuickAction icon={Clock3} label="Schedule" onClick={onSchedule} />
        </div>
      </section>

      {pendingQuotes.length > 0 ? (
        <section className="overflow-auto border border-[#FF4907]/30 bg-white">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#FF4907]/20 px-3 py-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Final quotations</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Approve these inspected amounts to add them to Bills. The partner packs only after you accept.
              </p>
            </div>
            {pendingQuotes.length > 1 ? (
              <Button
                size="sm"
                className="rounded-none bg-[#FF4907] text-white hover:bg-[#e03d00]"
                disabled={acceptAllQuotes.isPending || acceptQuote.isPending}
                onClick={() => acceptAllQuotes.mutate()}
              >
                {acceptAllQuotes.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept all to Bills"}
              </Button>
            ) : null}
          </div>
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-[#FFF7F3] text-left text-xs font-semibold uppercase tracking-wide text-[#FF4907]">
              <tr className="border-b border-[#FF4907]/20">
                <th className="px-3 py-2.5 font-semibold">Quote ready</th>
                <th className="px-3 py-2.5 font-semibold">Route</th>
                <th className="px-3 py-2.5 font-semibold">Amount</th>
                <th className="px-3 py-2.5 font-semibold"> </th>
              </tr>
            </thead>
            <tbody>
              {pendingQuotes.map((quote) => (
                <tr key={quote.id} className="border-b border-zinc-100">
                  <td className="px-3 py-2 font-semibold text-zinc-900">{quote.quotationNumber}</td>
                  <td className="px-3 py-2 text-zinc-600">
                    {[quote.senderCity, quote.receiverCity].filter(Boolean).join(" → ") || "Pickup quote"}
                  </td>
                  <td className="px-3 py-2 font-semibold text-zinc-900">₹{quote.totalAmount}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="rounded-none bg-[#FF4907] text-white hover:bg-[#e03d00]"
                        disabled={acceptQuote.isPending}
                        onClick={() => acceptQuote.mutate(quote.id)}
                      >
                        {acceptQuote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept to Bills"}
                      </Button>
                      {quote.acceptToken ? (
                        <Button size="sm" variant="outline" className="rounded-none" asChild>
                          <a href={`/quote/${quote.acceptToken}`}>Review</a>
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Store orders</h2>
          <button type="button" onClick={onOrders} className="text-xs font-bold text-[#FF4907]">
            Record or view all
          </button>
        </div>
        <div className="overflow-auto border border-zinc-200 bg-white">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr className="border-b border-zinc-200">
                <th className="px-3 py-2.5 font-semibold">Via</th>
                <th className="px-3 py-2.5 font-semibold">Customer</th>
                <th className="px-3 py-2.5 font-semibold">Phone</th>
                <th className="px-3 py-2.5 font-semibold">City</th>
                <th className="px-3 py-2.5 font-semibold">Item</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map((order) => (
                <tr
                  key={order.id}
                  className="cursor-pointer border-b border-zinc-100 hover:bg-[#FFF7F3]"
                  onClick={onOrders}
                >
                  <td className="px-3 py-2 text-zinc-600">{channelLabel(order.channel)}</td>
                  <td className="px-3 py-2 font-medium text-zinc-900">{order.receiverName}</td>
                  <td className="px-3 py-2 text-zinc-600">{order.receiverPhone}</td>
                  <td className="px-3 py-2 text-zinc-600">{order.receiverCity || "—"}</td>
                  <td className="px-3 py-2 text-zinc-600">{order.contentDescription || "Store order"}</td>
                  <td className="px-3 py-2 text-xs font-semibold text-[#FF4907]">
                    {ORDER_STATUS[order.status] || order.status}
                  </td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <p className="font-medium text-zinc-900">No courier orders yet</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Record WhatsApp, call, or DM orders so they are ready for pickup.
                    </p>
                    <Button className="mt-4 rounded-none bg-[#FF4907] hover:bg-[#e03d00]" onClick={onOrders}>
                      Record an order
                    </Button>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Shipments</h2>
          <button type="button" onClick={onShipments} className="text-xs font-bold text-[#FF4907]">
            Track all
          </button>
        </div>
        <div className="overflow-auto border border-zinc-200 bg-white">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr className="border-b border-zinc-200">
                <th className="px-3 py-2.5 font-semibold">Booking</th>
                <th className="px-3 py-2.5 font-semibold">Customer</th>
                <th className="px-3 py-2.5 font-semibold">From</th>
                <th className="px-3 py-2.5 font-semibold">To</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 8).map((booking) => (
                <tr
                  key={booking.id}
                  className="cursor-pointer border-b border-zinc-100 hover:bg-[#FFF7F3]"
                  onClick={() => onOpenBooking(booking.id)}
                >
                  <td className="px-3 py-2 font-mono font-semibold text-zinc-900">{booking.requestNumber}</td>
                  <td className="px-3 py-2 text-zinc-700">{booking.receiverName || "Customer"}</td>
                  <td className="px-3 py-2 text-zinc-600">{booking.senderCity || "—"}</td>
                  <td className="px-3 py-2 text-zinc-600">{booking.receiverCity || "—"}</td>
                  <td className="px-3 py-2 text-xs font-medium text-zinc-500">
                    {booking.tracking?.overallStatusLabel || booking.status.replace(/_/g, " ")}
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <PackageCheck className="mx-auto h-7 w-7 text-[#FF4907]" />
                    <p className="mt-3 font-medium text-zinc-900">No shipments yet</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      After pickup and quote acceptance, bookings appear here.
                    </p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number | string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-zinc-200 bg-white px-4 py-4 text-left hover:border-[#FF4907]/40"
    >
      <p className="text-2xl font-extrabold text-zinc-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-zinc-500">{label}</p>
    </button>
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
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 border border-zinc-200 bg-white px-3 py-3 text-left hover:border-[#FF4907]/40"
    >
      <span
        className={
          accent
            ? "flex h-10 w-10 shrink-0 items-center justify-center bg-[#FF4907] text-white"
            : "flex h-10 w-10 shrink-0 items-center justify-center bg-[#FFF7F3] text-[#FF4907]"
        }
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold text-zinc-800">{label}</span>
    </button>
  );
}
