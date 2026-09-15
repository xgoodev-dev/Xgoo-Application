import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { storeTypeLabel } from "@shared/business-courier";

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
  verificationStatus: "pending" | "approved" | "rejected";
  verificationNote: string | null;
  applicationComplete: boolean;
};

const statusLabel: Record<ProAccountRow["verificationStatus"], string> = {
  pending: "Waiting for review",
  approved: "Verified",
  rejected: "Needs changes",
};

function formatAddress(row: ProAccountRow) {
  return [row.pickupAddress, row.pickupCity, row.pickupState, row.pickupPincode]
    .filter(Boolean)
    .join(", ");
}

export function CommandProAccounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery<{ accounts: ProAccountRow[] }>({
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
  const visible = useMemo(
    () => (filter === "pending" ? accounts.filter((row) => row.verificationStatus === "pending") : accounts),
    [accounts, filter],
  );
  const pendingCount = accounts.filter((row) => row.verificationStatus === "pending").length;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {XGOO_MODULES.pro.name} applications
          </CardTitle>
          <CardDescription>
            Verify business name, store name, GST, and category before a store can use{" "}
            {XGOO_MODULES.pro.name}.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
          >
            Pending{pendingCount ? ` (${pendingCount})` : ""}
          </Button>
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Pro applications…
          </div>
        ) : visible.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            {filter === "pending" ? "No Pro applications waiting for review." : "No Pro accounts yet."}
          </p>
        ) : (
          visible.map((row) => (
            <div
              key={row.id}
              className="space-y-3 rounded-lg border border-border p-4"
              data-testid={`pro-account-${row.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{row.storeName || row.companyName || row.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.companyName}
                    {row.storeType ? ` · ${storeTypeLabel(row.storeType)}` : ""}
                  </p>
                </div>
                <Badge variant={row.verificationStatus === "approved" ? "outline" : "secondary"}>
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
              </div>
              {row.verificationStatus !== "approved" ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    placeholder="Note for the business (required to reject)"
                    value={notes[row.id] || ""}
                    onChange={(event) => setNotes((current) => ({ ...current, [row.id]: event.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!row.applicationComplete || review.isPending}
                      onClick={() => review.mutate({ id: row.id, status: "approved" })}
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={review.isPending}
                      onClick={() =>
                        review.mutate({
                          id: row.id,
                          status: "rejected",
                          note: notes[row.id] || "Please update your business details and resubmit.",
                        })
                      }
                    >
                      Send back
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
