import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "wouter";
import { ChevronDown, Loader2, Package, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { storeTypeLabel } from "@shared/business-courier";

type VerificationStatus = "pending" | "approved" | "rejected";
type AccountFilter = VerificationStatus | "all";

type ProAccountRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt?: string | null;
  companyName: string;
  storeName: string;
  storeType: string;
  gstNumber: string | null;
  pickupAddress: string;
  pickupCity: string | null;
  pickupState: string | null;
  pickupPincode: string | null;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
  verifiedAt?: string | null;
  applicationComplete: boolean;
  bookingCount?: number;
  orderCount?: number;
};

type ProBookingRow = {
  id: string;
  requestNumber: string;
  xgooOrderId?: string | null;
  receiverName: string;
  receiverCity?: string | null;
  status: string;
  createdAt?: string | null;
  convertedShipmentId?: string | null;
  customerUserId?: string | null;
  storeName?: string | null;
};

type ProOrderRow = {
  id: string;
  xgooOrderId?: string | null;
  receiverName: string;
  receiverCity?: string | null;
  status: string;
  contentDescription?: string | null;
  createdAt?: string | null;
  bookingRequestId?: string | null;
  customerUserId?: string | null;
  storeName?: string | null;
};

type ActivityRow = {
  id: string;
  storeName: string;
  xgooOrderId: string | null;
  reference: string;
  href: string | null;
  receiverName: string;
  receiverCity: string | null;
  statusLabel: string;
  createdAt: string | null;
};

const statusLabel: Record<VerificationStatus, string> = {
  pending: "Waiting for review",
  approved: "Active",
  rejected: "Needs changes",
};

const bookingStatusLabel: Record<string, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  approved: "Approved",
  rejected: "Rejected",
  converted: "Booked",
};

const orderStatusLabel: Record<string, string> = {
  open: "Open order",
  pickup_requested: "Pickup requested",
  booked: "Booked",
  cancelled: "Cancelled",
};

function formatAddress(row: ProAccountRow) {
  return [row.pickupAddress, row.pickupCity, row.pickupState, row.pickupPincode]
    .filter(Boolean)
    .join(", ");
}

function emptyFilterMessage(filter: AccountFilter): string {
  switch (filter) {
    case "approved":
      return "No verified Pro stores yet.";
    case "pending":
      return "No Pro applications waiting for review.";
    case "rejected":
      return "No stores have been sent back.";
    case "all":
      return "No Pro accounts yet.";
    default: {
      const _never: never = filter;
      return _never;
    }
  }
}

function matchesFilter(status: VerificationStatus, filter: AccountFilter): boolean {
  switch (filter) {
    case "pending":
      return status === "pending";
    case "approved":
      return status === "approved";
    case "rejected":
      return status === "rejected";
    case "all":
      return true;
    default: {
      const _never: never = filter;
      return _never;
    }
  }
}

function verificationBadge(status: VerificationStatus) {
  switch (status) {
    case "approved":
      return "outline";
    case "rejected":
      return "destructive";
    case "pending":
      return "secondary";
    default: {
      const _never: never = status;
      return _never;
    }
  }
}

function activityFromBooking(booking: ProBookingRow): ActivityRow {
  return {
    id: `booking-${booking.id}`,
    storeName: booking.storeName || "XGoo Pro store",
    xgooOrderId: booking.xgooOrderId || null,
    reference: booking.requestNumber,
    href: booking.convertedShipmentId ? `/shipments/${booking.convertedShipmentId}` : "/enquiries",
    receiverName: booking.receiverName,
    receiverCity: booking.receiverCity || null,
    statusLabel: bookingStatusLabel[booking.status] || booking.status,
    createdAt: booking.createdAt || null,
  };
}

function activityFromOrder(order: ProOrderRow): ActivityRow {
  return {
    id: `order-${order.id}`,
    storeName: order.storeName || "XGoo Pro store",
    xgooOrderId: order.xgooOrderId || null,
    reference: order.xgooOrderId || "Store order",
    href: null,
    receiverName: order.receiverName,
    receiverCity: order.receiverCity || null,
    statusLabel: orderStatusLabel[order.status] || order.status,
    createdAt: order.createdAt || null,
  };
}

function mergeActivity(bookings: ProBookingRow[], orders: ProOrderRow[]): ActivityRow[] {
  const linkedBookingIds = new Set(
    bookings.map((booking) => booking.id).filter((id): id is string => Boolean(id)),
  );
  const standaloneOrders = orders.filter(
    (order) => !order.bookingRequestId || !linkedBookingIds.has(order.bookingRequestId),
  );
  return [...bookings.map(activityFromBooking), ...standaloneOrders.map(activityFromOrder)].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

function ActivityTable({ rows, showStore }: { rows: ActivityRow[]; showStore?: boolean }) {
  if (rows.length === 0) {
    return <p className="py-2 text-sm text-muted-foreground">No bookings or store orders yet.</p>;
  }

  return (
    <>
    <div className="space-y-2 md:hidden">
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border bg-background px-3 py-2.5">
          {showStore ? <p className="text-xs font-medium text-muted-foreground">{row.storeName}</p> : null}
          <p className="font-mono text-xs font-semibold">{row.xgooOrderId || "—"}</p>
          <p className="mt-0.5 text-sm font-medium">
            {row.href ? (
              <Link href={row.href} className="hover:underline">
                {row.reference}
              </Link>
            ) : (
              row.reference
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {row.receiverName}
            {row.receiverCity ? ` · ${row.receiverCity}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {row.statusLabel}
            {row.createdAt ? ` · ${format(new Date(row.createdAt), "dd MMM, HH:mm")}` : ""}
          </p>
        </div>
      ))}
    </div>
    <div className="hidden overflow-x-auto rounded-md border md:block">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {showStore ? <th className="px-3 py-2 font-semibold">Store</th> : null}
            <th className="px-3 py-2 font-semibold">XGoo ID</th>
            <th className="px-3 py-2 font-semibold">Reference</th>
            <th className="px-3 py-2 font-semibold">Customer</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2 font-semibold">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              {showStore ? <td className="px-3 py-2 font-medium">{row.storeName}</td> : null}
              <td className="px-3 py-2 font-mono text-xs font-semibold">{row.xgooOrderId || "—"}</td>
              <td className="px-3 py-2">
                {row.href ? (
                  <Link href={row.href} className="font-medium hover:underline">
                    {row.reference}
                  </Link>
                ) : (
                  <span className="font-medium">{row.reference}</span>
                )}
              </td>
              <td className="px-3 py-2">
                {row.receiverName}
                {row.receiverCity ? (
                  <span className="block text-xs text-muted-foreground">{row.receiverCity}</span>
                ) : null}
              </td>
              <td className="px-3 py-2">{row.statusLabel}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {row.createdAt ? format(new Date(row.createdAt), "dd MMM, HH:mm") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}

function AccountActivity({ accountId }: { accountId: string }) {
  const { data, isLoading } = useQuery<{ bookings: ProBookingRow[]; orders: ProOrderRow[] }>({
    queryKey: ["/api/command/pro-accounts", accountId, "activity"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/command/pro-accounts/${accountId}/activity`);
      return res.json();
    },
  });

  const rows = mergeActivity(data?.bookings || [], data?.orders || []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading bookings…
      </div>
    );
  }

  return <ActivityTable rows={rows} />;
}

function AccountCard({
  row,
  isOpen,
  note,
  reviewPending,
  onToggle,
  onNoteChange,
  onVerify,
  onSendBack,
}: {
  row: ProAccountRow;
  isOpen: boolean;
  note: string;
  reviewPending: boolean;
  onToggle: () => void;
  onNoteChange: (value: string) => void;
  onVerify: () => void;
  onSendBack: () => void;
}) {
  const movementCount = (row.bookingCount || 0) + (row.orderCount || 0);

  return (
    <div className="space-y-3 rounded-lg border border-border p-4" data-testid={`pro-account-${row.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{row.storeName || row.companyName || row.name}</p>
          <p className="text-sm text-muted-foreground">
            {row.companyName}
            {row.storeType ? ` · ${storeTypeLabel(row.storeType)}` : ""}
          </p>
        </div>
        <Badge variant={verificationBadge(row.verificationStatus)}>
          {statusLabel[row.verificationStatus]}
        </Badge>
      </div>
      <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
        <p>GSTIN: {row.gstNumber || "Not provided"}</p>
        <p>
          Contact: {row.name}
          {row.phone ? ` · ${row.phone}` : ""}
          {row.email ? ` · ${row.email}` : ""}
        </p>
        <p className="sm:col-span-2">Address: {formatAddress(row) || "Not provided"}</p>
        <p>
          Bookings: {row.bookingCount || 0}
          {row.orderCount ? ` · ${row.orderCount} store orders` : movementCount === 0 ? "" : ""}
        </p>
        {row.verifiedAt ? <p>Verified {format(new Date(row.verifiedAt), "dd MMM yyyy")}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={onToggle} data-testid={`button-pro-bookings-${row.id}`}>
          <ChevronDown className={`mr-1 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          {isOpen ? "Hide bookings" : "View bookings"}
        </Button>
      </div>
      {isOpen ? <AccountActivity accountId={row.id} /> : null}
      {row.verificationStatus !== "approved" ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Note for the business (required to reject)"
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={!row.applicationComplete || reviewPending} onClick={onVerify}>
              Verify
            </Button>
            <Button size="sm" variant="outline" disabled={reviewPending} onClick={onSendBack}>
              Send back
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CommandProAccounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<AccountFilter>("approved");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{
    accounts: ProAccountRow[];
    bookings?: ProBookingRow[];
    orders?: ProOrderRow[];
  }>({
    queryKey: ["/api/command/pro-accounts"],
    refetchInterval: 20_000,
  });

  const review = useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: "approved" | "rejected";
      note?: string;
    }) => apiRequest("PATCH", `/api/command/pro-accounts/${id}`, { status, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/command/pro-accounts"] });
      toast({ title: "Pro account updated" });
    },
    onError: (error: Error) =>
      toast({ title: "Could not update account", description: error.message, variant: "destructive" }),
  });

  const accounts = data?.accounts || [];
  const recentRows = useMemo(
    () => mergeActivity(data?.bookings || [], data?.orders || []),
    [data?.bookings, data?.orders],
  );
  const visible = useMemo(
    () => accounts.filter((row) => matchesFilter(row.verificationStatus, filter)),
    [accounts, filter],
  );
  const pendingCount = accounts.filter((row) => row.verificationStatus === "pending").length;
  const activeCount = accounts.filter((row) => row.verificationStatus === "approved").length;
  const returnedCount = accounts.filter((row) => row.verificationStatus === "rejected").length;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {XGOO_MODULES.pro.name} accounts
          </CardTitle>
          <CardDescription>
            Active stores, their bookings, and new applications waiting for {XGOO_MODULES.command.name}.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
          >
            Active{activeCount ? ` (${activeCount})` : ""}
          </Button>
          <Button
            size="sm"
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
          >
            Pending{pendingCount ? ` (${pendingCount})` : ""}
          </Button>
          <Button
            size="sm"
            variant={filter === "rejected" ? "default" : "outline"}
            onClick={() => setFilter("rejected")}
          >
            Sent back{returnedCount ? ` (${returnedCount})` : ""}
          </Button>
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
            All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Pro accounts…
          </div>
        ) : (
          <div className="space-y-4">
            {recentRows.length > 0 ? (
              <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="h-4 w-4" />
                  Recent Pro bookings
                  <span className="font-normal text-muted-foreground">({recentRows.length})</span>
                </div>
                <ActivityTable rows={recentRows} showStore />
              </div>
            ) : null}
            {visible.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">
                {emptyFilterMessage(filter)}
                {filter === "approved" && pendingCount > 0
                  ? ` ${pendingCount} application${pendingCount === 1 ? "" : "s"} still waiting for review.`
                  : ""}
              </p>
            ) : (
              visible.map((row) => (
                <AccountCard
                  key={row.id}
                  row={row}
                  isOpen={openId === row.id}
                  note={notes[row.id] || ""}
                  reviewPending={review.isPending}
                  onToggle={() => setOpenId(openId === row.id ? null : row.id)}
                  onNoteChange={(value) => setNotes((current) => ({ ...current, [row.id]: value }))}
                  onVerify={() => review.mutate({ id: row.id, status: "approved" })}
                  onSendBack={() =>
                    review.mutate({
                      id: row.id,
                      status: "rejected",
                      note: notes[row.id] || "Please update your business details and resubmit.",
                    })
                  }
                />
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
