import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { CheckCircle2, XCircle } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Button } from "@/components/ui/button";
import { XGOO_MODULES } from "@/components/marketing/site-info";

const ORANGE = "#FF4907";

type PublicQuote = {
  id: string;
  quotationNumber: string;
  customerName: string;
  senderCity?: string | null;
  receiverCity?: string | null;
  weight: string;
  numberOfPieces?: number | null;
  contentDescription?: string | null;
  serviceType?: string | null;
  totalAmount: string;
  status: string;
  requestNumber?: string;
  billOnAccept?: boolean;
};

export default function QuoteAcceptPage() {
  const params = useParams<{ token?: string }>();
  const token = params.token || "";
  const [done, setDone] = useState<"accepted" | "rejected" | null>(null);

  const quote = useQuery({
    queryKey: ["/api/public/quotations", token],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await fetch(`/api/public/quotations/${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("Quote not found");
      return (await res.json()) as PublicQuote;
    },
  });

  const accept = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/public/quotations/${encodeURIComponent(token)}/accept`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || "Could not accept this quote");
      return body;
    },
    onSuccess: () => setDone("accepted"),
  });

  const reject = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/public/quotations/${encodeURIComponent(token)}/reject`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || "Could not decline this quote");
      return body;
    },
    onSuccess: () => setDone("rejected"),
  });

  const data = quote.data;
  const route = [data?.senderCity, data?.receiverCity].filter(Boolean).join(" → ");

  return (
    <MarketingLayout>
      <section className="mx-auto w-full max-w-xl px-4 pb-16 pt-8 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: ORANGE }}>
          {XGOO_MODULES.pickup.name}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">Pickup quote</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Review the inspected weight and charges, then accept so the partner can pack and bring the parcel to the XGoo store.
        </p>

        {quote.isLoading ? (
          <p className="mt-8 text-sm text-zinc-500">Loading quote…</p>
        ) : quote.isError || !data ? (
          <p className="mt-8 text-sm text-red-600">This quote link is invalid or has expired.</p>
        ) : (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">{data.quotationNumber}</p>
            {data.requestNumber ? (
              <p className="mt-1 text-xs text-zinc-500">Request {data.requestNumber}</p>
            ) : null}
            <p className="mt-4 text-sm text-zinc-600">{route || "Doorstep pickup"}</p>
            <p className="mt-1 text-sm text-zinc-600">
              {data.weight} kg · {data.numberOfPieces || 1} piece
              {data.serviceType ? ` · ${data.serviceType}` : ""}
            </p>
            {data.contentDescription ? (
              <p className="mt-2 text-sm text-zinc-500">{data.contentDescription}</p>
            ) : null}
            <p className="mt-5 text-3xl font-extrabold text-zinc-900">₹{data.totalAmount}</p>

            {done === "accepted" || data.status === "accepted" ? (
              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {data.billOnAccept
                  ? "Quote accepted. This amount is on your Bills. The partner will pack and bring the parcel to the XGoo store."
                  : "Quote accepted. The partner will pack the parcel and raise the shipment after it reaches the XGoo store."}
              </div>
            ) : done === "rejected" || data.status === "rejected" ? (
              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-red-600">
                <XCircle className="h-4 w-4" />
                Quote declined.
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button
                  className="h-11 flex-1 border-0 font-semibold text-white"
                  style={{ background: ORANGE }}
                  disabled={accept.isPending}
                  onClick={() => accept.mutate()}
                >
                  Accept quote
                </Button>
                <Button
                  variant="outline"
                  className="h-11 flex-1"
                  disabled={reject.isPending}
                  onClick={() => reject.mutate()}
                >
                  Decline
                </Button>
              </div>
            )}
            {accept.error || reject.error ? (
              <p className="mt-3 text-sm text-red-600">
                {(accept.error || reject.error)?.message}
              </p>
            ) : null}
          </div>
        )}
      </section>
    </MarketingLayout>
  );
}
