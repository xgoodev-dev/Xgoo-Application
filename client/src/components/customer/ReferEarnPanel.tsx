import { useState, type Dispatch, type SetStateAction } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Gift, Landmark } from "lucide-react";
import { formatReferralRupees } from "@shared/referral";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { referralBookingShareUrl, referralLandingShareUrl } from "@/lib/referral";
import { XGOO_MODULES } from "@/components/marketing/site-info";

type ReferralDashboard = {
  program: {
    isActive: boolean;
    commissionType: "percent" | "flat";
    commissionValue: string;
    minPayoutAmount: string;
  };
  partner: null | {
    code: string;
    status: "active" | "suspended";
    sharePath: string;
    bankAccountName: string;
    bankAccountNumberMasked: string;
    bankIfsc: string;
    hasBank: boolean;
    totals: { pending: number; approved: number; paid: number };
    earnings: Array<{
      id: string;
      quoteAmount: string;
      commissionAmount: string;
      status: string;
      createdAt?: string | null;
    }>;
  };
};

function programRateLabel(program: ReferralDashboard["program"]) {
  if (program.commissionType === "flat") {
    return `${formatReferralRupees(program.commissionValue)} per paid courier`;
  }
  return `${program.commissionValue}% of the paid quote`;
}

async function fetchReferral(token: string): Promise<ReferralDashboard> {
  const res = await fetch("/api/customer/referral", {
    headers: { "x-customer-token": token },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || "Could not load referral program");
  return json as ReferralDashboard;
}

export function ReferEarnPanel({
  token,
  module = "go",
  onBack,
}: {
  token: string;
  module?: "go" | "pro";
  onBack?: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const product = module === "pro" ? XGOO_MODULES.pro : XGOO_MODULES.go;
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [bank, setBank] = useState({
    bankAccountName: "",
    bankAccountNumber: "",
    bankIfsc: "",
  });

  const query = useQuery({
    queryKey: ["/api/customer/referral", token],
    queryFn: () => fetchReferral(token),
  });
  const data = query.data;

  const join = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/customer/referral/join", {
        method: "POST",
        headers: { "x-customer-token": token },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { message?: string }).message || "Could not join");
      return json as ReferralDashboard;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(["/api/customer/referral", token], next);
      toast({ title: "You are in", description: "Share your link. You earn when they send a courier and pay the quote." });
    },
    onError: (error) => {
      toast({
        title: "Could not join",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  const saveBank = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/customer/referral/bank", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-customer-token": token },
        body: JSON.stringify({
          bankAccountName: bank.bankAccountName.trim(),
          bankAccountNumber: bank.bankAccountNumber.trim(),
          bankIfsc: bank.bankIfsc.trim().toUpperCase(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { message?: string }).message || "Could not save bank details");
      return json as ReferralDashboard;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(["/api/customer/referral", token], next);
      setBank({ bankAccountName: "", bankAccountNumber: "", bankIfsc: "" });
      toast({ title: "Bank details saved", description: "Command will pay this account when your earnings are ready." });
    },
    onError: (error) => {
      toast({
        title: "Bank details not saved",
        description: error instanceof Error ? error.message : "Check the account number and IFSC.",
        variant: "destructive",
      });
    },
  });

  async function copy(value: string, kind: "link" | "code") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      toast({ title: "Copy failed", description: value, variant: "destructive" });
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
      {onBack ? (
        <button type="button" onClick={onBack} className="mb-4 text-sm font-medium text-zinc-500">
          ← Back
        </button>
      ) : null}
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF4907] text-white">
          <Gift className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Refer and earn</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Share {product.name} with people and businesses who need to send a courier. You earn after
            their quote is paid — not when they only fill the form.
          </p>
        </div>
      </div>

      {query.isLoading ? (
        <p className="mt-6 text-sm text-zinc-500">Loading your referral program…</p>
      ) : query.isError ? (
        <p className="mt-6 text-sm text-red-600">
          {query.error instanceof Error ? query.error.message : "Could not load the referral program."}
        </p>
      ) : data ? (
        <>
          <Card className="mt-5 border-zinc-100 p-4 shadow-none">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Commission</p>
            <p className="mt-1 text-lg font-bold text-zinc-900">{programRateLabel(data.program)}</p>
            <p className="mt-1 text-sm text-zinc-500">
              Minimum payout {formatReferralRupees(data.program.minPayoutAmount)}. Program{" "}
              {data.program.isActive ? "is open" : "is paused by Command"}.
            </p>
          </Card>

          {!data.partner ? (
            <Button
              type="button"
              className="mt-5 w-full bg-[#FF4907] hover:bg-[#e54106]"
              disabled={!data.program.isActive || join.isPending}
              onClick={() => join.mutate()}
            >
              {join.isPending ? "Joining…" : "Join as a referral partner"}
            </Button>
          ) : (
            <PartnerDashboard
              partner={data.partner}
              copied={copied}
              bank={bank}
              setBank={setBank}
              saveBankPending={saveBank.isPending}
              onCopy={copy}
              onSaveBank={() => saveBank.mutate()}
            />
          )}
        </>
      ) : null}
    </div>
  );
}

function PartnerDashboard({
  partner,
  copied,
  bank,
  setBank,
  saveBankPending,
  onCopy,
  onSaveBank,
}: {
  partner: NonNullable<ReferralDashboard["partner"]>;
  copied: "link" | "code" | null;
  bank: { bankAccountName: string; bankAccountNumber: string; bankIfsc: string };
  setBank: Dispatch<SetStateAction<{ bankAccountName: string; bankAccountNumber: string; bankIfsc: string }>>;
  saveBankPending: boolean;
  onCopy: (value: string, kind: "link" | "code") => void;
  onSaveBank: () => void;
}) {
  const landing = referralLandingShareUrl(partner.code);
  const booking = referralBookingShareUrl(partner.code);
  return (
    <>
      {partner.status === "suspended" ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This referral account is paused. Existing earnings stay; new bookings will not earn until Command reactivates you.
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Pending" value={formatReferralRupees(partner.totals.pending + partner.totals.approved)} />
        <Stat label="Paid" value={formatReferralRupees(partner.totals.paid)} />
        <Stat label="Code" value={partner.code} />
      </div>

      <Card className="mt-5 space-y-3 border-zinc-100 p-4 shadow-none">
        <p className="text-sm font-semibold text-zinc-900">Your share links</p>
        <ShareRow
          label="Website"
          value={landing}
          copied={copied === "link"}
          onCopy={() => onCopy(landing, "link")}
        />
        <ShareRow
          label="Book with your code"
          value={booking}
          copied={copied === "code"}
          onCopy={() => onCopy(booking, "code")}
        />
      </Card>

      <Card className="mt-5 space-y-3 border-zinc-100 p-4 shadow-none">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-zinc-500" />
          <p className="text-sm font-semibold text-zinc-900">Bank account for payouts</p>
        </div>
        {partner.hasBank ? (
          <p className="text-sm text-zinc-500">
            {partner.bankAccountName} · {partner.bankAccountNumberMasked} · {partner.bankIfsc}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">Add the account Command should pay when you reach the minimum.</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="referral-bank-name">Account holder name</Label>
            <Input
              id="referral-bank-name"
              value={bank.bankAccountName}
              onChange={(event) => setBank((current) => ({ ...current, bankAccountName: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="referral-bank-number">Account number</Label>
            <Input
              id="referral-bank-number"
              inputMode="numeric"
              value={bank.bankAccountNumber}
              onChange={(event) => setBank((current) => ({ ...current, bankAccountNumber: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="referral-bank-ifsc">IFSC</Label>
            <Input
              id="referral-bank-ifsc"
              value={bank.bankIfsc}
              onChange={(event) => setBank((current) => ({ ...current, bankIfsc: event.target.value.toUpperCase() }))}
            />
          </div>
        </div>
        <Button type="button" variant="outline" disabled={saveBankPending} onClick={onSaveBank}>
          {saveBankPending ? "Saving…" : partner.hasBank ? "Update bank details" : "Save bank details"}
        </Button>
      </Card>

      <Card className="mt-5 border-zinc-100 p-0 shadow-none">
        <p className="px-4 pt-4 text-sm font-semibold text-zinc-900">Recent earnings</p>
        {partner.earnings.length === 0 ? (
          <p className="px-4 pb-4 pt-2 text-sm text-zinc-500">
            Nothing yet. Earnings appear after a referred person pays an accepted quote.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {partner.earnings.map((row) => (
              <li key={row.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-zinc-500">
                  Quote {formatReferralRupees(row.quoteAmount)} · {row.status}
                </span>
                <span className="font-semibold text-zinc-900">
                  {formatReferralRupees(row.commissionAmount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-zinc-100 p-3 shadow-none">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="mt-1 text-base font-bold text-zinc-900">{value}</p>
    </Card>
  );
}

function ShareRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <Input readOnly value={value} className="font-mono text-xs" />
        <Button type="button" variant="outline" size="icon" onClick={onCopy} aria-label={`Copy ${label}`}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
