import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  BUSINESS_BILLING_CYCLES,
  BUSINESS_SETTLEMENT_MODES,
  billingCycleLabel,
  settlementModeLabel,
  type BusinessBillingCycle,
  type BusinessSettlementMode,
} from "@shared/business-courier";
import { businessApi } from "./business-api";
import { ProPageHeader, ProTableFrame, ProTableHead } from "./pro-table";

type BillRow = {
  id: string;
  requestNumber: string;
  bookingNumber: string;
  invoiceNumber?: string | null;
  receiverName: string;
  receiverCity?: string | null;
  senderCity?: string | null;
  bookedAt?: string | null;
  amount: string;
  paymentStatus: "pending" | "completed" | "failed";
  paymentMode?: string | null;
  inCurrentPeriod: boolean;
};

type SettlementRow = {
  id: string;
  amount: string;
  paymentMode: string;
  shipmentCount: number;
  paidAt?: string | null;
  transactionReference?: string | null;
};

type BillsPayload = {
  billingCycle: BusinessBillingCycle;
  period: { label: string };
  outstandingTotal: string;
  periodOutstandingTotal: string;
  paidTotal: string;
  outstandingCount: number;
  periodOutstandingCount: number;
  bills: BillRow[];
  settlements: SettlementRow[];
};

type FilterId = "all" | "due" | "period" | "paid";

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "All" },
  { id: "due", label: "Due" },
  { id: "period", label: "This period" },
  { id: "paid", label: "Paid" },
];

function rupees(value: string | number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function billDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function paymentLabel(status: BillRow["paymentStatus"]) {
  switch (status) {
    case "completed":
      return "Paid";
    case "failed":
      return "Failed";
    case "pending":
      return "Due";
    default: {
      const _never: never = status;
      return _never;
    }
  }
}

export function BillsPanel({ token }: { token: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const api = businessApi(token);
  const [filter, setFilter] = useState<FilterId>("all");
  const [paying, setPaying] = useState(false);
  const [paymentMode, setPaymentMode] = useState<BusinessSettlementMode>("upi");
  const [reference, setReference] = useState("");

  const billsQuery = useQuery({
    queryKey: ["/api/customer/business/bills"],
    queryFn: () => api.bills() as Promise<BillsPayload>,
  });

  const saveCycle = useMutation({
    mutationFn: (billingCycle: BusinessBillingCycle) => api.saveProfile({ billingCycle }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/bills"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/profile"] });
    },
    onError: (error: Error) =>
      toast({ title: "Could not save cycle", description: error.message, variant: "destructive" }),
  });

  const settle = useMutation({
    mutationFn: () =>
      api.settleBills({
        paymentMode,
        reference: reference.trim() || null,
      }),
    onSuccess: (result: { paidTotal?: string; paidCount?: number }) => {
      setPaying(false);
      setReference("");
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/bills"] });
      toast({
        title: "Paid to XGoo",
        description: `${result.paidCount || 0} shipment${result.paidCount === 1 ? "" : "s"} · ${rupees(result.paidTotal || "0")}`,
      });
    },
    onError: (error: Error) =>
      toast({ title: "Could not pay XGoo", description: error.message, variant: "destructive" }),
  });

  const data = billsQuery.data;
  const cycle = data?.billingCycle || "weekly";
  const rows = useMemo(() => {
    const bills = data?.bills || [];
    switch (filter) {
      case "due":
        return bills.filter((bill) => bill.paymentStatus !== "completed");
      case "period":
        return bills.filter((bill) => bill.inCurrentPeriod);
      case "paid":
        return bills.filter((bill) => bill.paymentStatus === "completed");
      case "all":
        return bills;
      default: {
        const _never: never = filter;
        return _never;
      }
    }
  }, [data?.bills, filter]);

  const lastSettlement = data?.settlements?.[0];
  const outstanding = Number(data?.outstandingTotal || 0);

  return (
    <div className="flex h-full min-h-0 flex-col py-5" data-testid="business-bills">
      <ProPageHeader
        title="Bills"
        description="Every shipment charge in one place. Pay XGoo once for all outstanding movement."
        actions={
          <Button
            className="rounded-none bg-[#FF4907] text-white hover:bg-[#e03d00]"
            disabled={outstanding <= 0}
            onClick={() => setPaying(true)}
          >
            Pay XGoo {outstanding > 0 ? rupees(outstanding) : ""}
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        <div className="border border-zinc-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Due now</p>
          <p className="mt-1 text-2xl font-extrabold text-zinc-900">{rupees(data?.outstandingTotal || "0")}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {data?.outstandingCount || 0} shipment{(data?.outstandingCount || 0) === 1 ? "" : "s"}
          </p>
        </div>
        <div className="border border-zinc-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            This {billingCycleLabel(cycle).toLowerCase()}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-zinc-900">
            {rupees(data?.periodOutstandingTotal || "0")}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{data?.period.label || "—"}</p>
        </div>
        <div className="border border-zinc-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Already paid</p>
          <p className="mt-1 text-2xl font-extrabold text-zinc-900">{rupees(data?.paidTotal || "0")}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {lastSettlement
              ? `Last ${settlementModeLabel(lastSettlement.paymentMode)} · ${billDate(lastSettlement.paidAt)}`
              : "No settlement yet"}
          </p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {BUSINESS_BILLING_CYCLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => saveCycle.mutate(item.id)}
              className={
                cycle === item.id
                  ? "rounded-none border border-[#FF4907] bg-[#FF4907] px-3 py-1.5 text-sm font-semibold text-white"
                  : "rounded-none border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700"
              }
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={
                filter === item.id
                  ? "rounded-none border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-sm text-white"
                  : "rounded-none border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700"
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {paying ? (
        <div className="mb-3 flex flex-wrap items-end gap-2 border border-[#FF4907]/30 bg-[#FFF7F3] px-3 py-3">
          <label className="min-w-[140px] text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Pay by</span>
            <select
              value={paymentMode}
              onChange={(event) => setPaymentMode(event.target.value as BusinessSettlementMode)}
              className="h-9 w-full border border-zinc-200 bg-white px-2 text-sm outline-none"
            >
              {BUSINESS_SETTLEMENT_MODES.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[180px] flex-1 text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Reference</span>
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="UPI / bank reference"
              className="h-9 w-full border border-zinc-200 bg-white px-2 text-sm outline-none"
            />
          </label>
          <Button
            className="h-9 rounded-none bg-[#FF4907] text-white hover:bg-[#e03d00]"
            disabled={settle.isPending}
            onClick={() => settle.mutate()}
          >
            {settle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Confirm ${rupees(outstanding)}`}
          </Button>
          <Button
            variant="outline"
            className="h-9 rounded-none"
            disabled={settle.isPending}
            onClick={() => setPaying(false)}
          >
            Cancel
          </Button>
        </div>
      ) : null}

      {billsQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading bills
        </div>
      ) : (
        <ProTableFrame minWidth="920px">
          <ProTableHead
            columns={[
              { label: "Date", width: "110px" },
              { label: "Booking" },
              { label: "Invoice" },
              { label: "Customer" },
              { label: "Route" },
              { label: "Amount", width: "120px" },
              { label: "Status", width: "90px" },
            ]}
          />
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-sm text-zinc-500">
                  {filter === "due"
                    ? "Nothing is due to XGoo right now."
                    : "Accepted pickup quotations appear here. Pay XGoo once for the cycle you choose."}
                </td>
              </tr>
            ) : (
              rows.map((bill) => (
                <tr key={bill.id} className="border-b border-zinc-100">
                  <td className="px-2 py-2.5 text-zinc-600">{billDate(bill.bookedAt)}</td>
                  <td className="px-2 py-2.5 font-medium text-zinc-900">
                    {bill.requestNumber || bill.bookingNumber}
                  </td>
                  <td className="px-2 py-2.5 text-zinc-600">{bill.invoiceNumber || "—"}</td>
                  <td className="px-2 py-2.5 text-zinc-900">{bill.receiverName}</td>
                  <td className="px-2 py-2.5 text-zinc-600">
                    {[bill.senderCity, bill.receiverCity].filter(Boolean).join(" → ") || "—"}
                  </td>
                  <td className="px-2 py-2.5 font-semibold text-zinc-900">{rupees(bill.amount)}</td>
                  <td className="px-2 py-2.5">
                    <span
                      className={
                        bill.paymentStatus === "completed"
                          ? "text-emerald-700"
                          : bill.paymentStatus === "failed"
                            ? "text-red-600"
                            : "font-semibold text-[#FF4907]"
                      }
                    >
                      {paymentLabel(bill.paymentStatus)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </ProTableFrame>
      )}
    </div>
  );
}
