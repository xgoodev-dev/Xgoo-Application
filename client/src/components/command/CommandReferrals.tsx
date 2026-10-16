import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  DEFAULT_REFERRAL_DOMESTIC_PERCENT,
  DEFAULT_REFERRAL_INTERNATIONAL_FLAT,
  formatReferralRupees,
} from "@shared/referral";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type ReferralSettings = {
  domesticCommissionType: "percent" | "flat";
  domesticCommissionValue: string;
  internationalCommissionType: "percent" | "flat";
  internationalCommissionValue: string;
  minPayoutAmount: string;
  isActive: boolean;
};

type PartnerRow = {
  id: string;
  code: string;
  status: "active" | "suspended";
  name: string;
  phone: string | null;
  email: string | null;
  accountType: string | null;
  bankAccountName: string;
  bankAccountNumberMasked: string;
  bankIfsc: string;
  hasBank: boolean;
  pendingAmount: number;
  paidAmount: number;
  earningCount: number;
  createdAt?: string | null;
};

type PayoutRow = {
  id: string;
  partnerName: string;
  partnerCode: string;
  amount: string;
  note: string | null;
  paidAt?: string | null;
};

export function CommandReferrals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ReferralSettings>({
    domesticCommissionType: "percent",
    domesticCommissionValue: DEFAULT_REFERRAL_DOMESTIC_PERCENT,
    internationalCommissionType: "flat",
    internationalCommissionValue: DEFAULT_REFERRAL_INTERNATIONAL_FLAT,
    minPayoutAmount: "100",
    isActive: true,
  });

  const settingsQuery = useQuery({
    queryKey: ["/api/command/referral/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/command/referral/settings");
      const data = (await res.json()) as ReferralSettings;
      setForm({
        domesticCommissionType: data.domesticCommissionType === "flat" ? "flat" : "percent",
        domesticCommissionValue: String(data.domesticCommissionValue || DEFAULT_REFERRAL_DOMESTIC_PERCENT),
        internationalCommissionType: data.internationalCommissionType === "percent" ? "percent" : "flat",
        internationalCommissionValue: String(
          data.internationalCommissionValue || DEFAULT_REFERRAL_INTERNATIONAL_FLAT,
        ),
        minPayoutAmount: String(data.minPayoutAmount || "100"),
        isActive: Boolean(data.isActive),
      });
      return data;
    },
  });

  const partnersQuery = useQuery({
    queryKey: ["/api/command/referral/partners"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/command/referral/partners");
      return (await res.json()) as PartnerRow[];
    },
  });

  const payoutsQuery = useQuery({
    queryKey: ["/api/command/referral/payouts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/command/referral/payouts");
      return (await res.json()) as PayoutRow[];
    },
  });

  const saveSettings = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/command/referral/settings", form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/command/referral/settings"] });
      toast({ title: "Referral rates saved" });
    },
    onError: async (error) => {
      toast({
        title: "Could not save rates",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "suspended" }) =>
      apiRequest("PATCH", `/api/command/referral/partners/${id}`, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/command/referral/partners"] });
    },
  });

  const markPaid = useMutation({
    mutationFn: (partnerId: string) => apiRequest("POST", "/api/command/referral/payouts", { partnerId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/command/referral/partners"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/command/referral/payouts"] }),
      ]);
      toast({ title: "Payout marked paid" });
    },
    onError: (error) => {
      toast({
        title: "Could not mark paid",
        description: error instanceof Error ? error.message : "Check the pending amount and bank details.",
        variant: "destructive",
      });
    },
  });

  const partners = partnersQuery.data || [];
  const payouts = payoutsQuery.data || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Commission rates</CardTitle>
          <CardDescription>
            Domestic referrals earn a percent of the total bill. International referrals earn a flat
            amount per paid booking.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border px-3 py-2 md:col-span-2">
            <div>
              <p className="text-sm font-medium">Program active</p>
              <p className="text-xs text-muted-foreground">Pause to stop new earnings without removing partners.</p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(isActive) => setForm((current) => ({ ...current, isActive }))}
            />
          </div>
          <div>
            <Label htmlFor="referral-domestic">Domestic parcel (%)</Label>
            <Input
              id="referral-domestic"
              value={form.domesticCommissionValue}
              onChange={(event) =>
                setForm((current) => ({ ...current, domesticCommissionValue: event.target.value }))
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">Percent of the total bill.</p>
          </div>
          <div>
            <Label htmlFor="referral-international">International courier (₹)</Label>
            <Input
              id="referral-international"
              value={form.internationalCommissionValue}
              onChange={(event) =>
                setForm((current) => ({ ...current, internationalCommissionValue: event.target.value }))
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">Flat amount per paid referral.</p>
          </div>
          <div>
            <Label htmlFor="referral-min">Minimum payout (₹)</Label>
            <Input
              id="referral-min"
              value={form.minPayoutAmount}
              onChange={(event) => setForm((current) => ({ ...current, minPayoutAmount: event.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <Button type="button" disabled={saveSettings.isPending || settingsQuery.isLoading} onClick={() => saveSettings.mutate()}>
              {saveSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save rates
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referral partners</CardTitle>
          <CardDescription>Bank payouts are marked here after you transfer the amount.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {partnersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading partners…</p>
          ) : partners.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referral partners have joined yet.</p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Partner</th>
                  <th className="pb-2 font-medium">Code</th>
                  <th className="pb-2 font-medium">Pending</th>
                  <th className="pb-2 font-medium">Paid</th>
                  <th className="pb-2 font-medium">Bank</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {partners.map((partner) => (
                  <tr key={partner.id}>
                    <td className="py-3">
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {partner.phone || partner.email || partner.accountType}
                      </p>
                    </td>
                    <td className="py-3 font-mono">{partner.code}</td>
                    <td className="py-3">{formatReferralRupees(partner.pendingAmount)}</td>
                    <td className="py-3">{formatReferralRupees(partner.paidAmount)}</td>
                    <td className="py-3 text-xs">
                      {partner.hasBank
                        ? `${partner.bankAccountName} · ${partner.bankAccountNumberMasked} · ${partner.bankIfsc}`
                        : "Not added"}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={partner.status === "active" ? "default" : "secondary"}>
                          {partner.status}
                        </Badge>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={updateStatus.isPending}
                          onClick={() =>
                            updateStatus.mutate({
                              id: partner.id,
                              status: partner.status === "active" ? "suspended" : "active",
                            })
                          }
                        >
                          {partner.status === "active" ? "Pause" : "Activate"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!partner.hasBank || partner.pendingAmount <= 0 || markPaid.isPending}
                          onClick={() => markPaid.mutate(partner.id)}
                        >
                          Mark paid
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout history</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payouts have been marked yet.</p>
          ) : (
            <ul className="divide-y">
              {payouts.map((payout) => (
                <li key={payout.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {payout.partnerName} · {payout.partnerCode}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payout.paidAt ? format(new Date(payout.paidAt), "d MMM yyyy") : "—"}
                      {payout.note ? ` · ${payout.note}` : ""}
                    </p>
                  </div>
                  <p className="font-semibold">{formatReferralRupees(payout.amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
