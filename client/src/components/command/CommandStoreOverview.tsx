import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { setCommandStoreId } from "@/lib/command-store";
import { HubCounterQrCard } from "@/components/hubs/HubCounterQrCard";
import { HubServiceRangeInput } from "@/components/hubs/HubServiceAreaSettings";
import { parseServiceRadiusKm } from "@shared/service-coverage";
import type { Office, StoreRelocationRequest } from "@shared/schema";

export type CommandStoreSummary = {
  id: string;
  name: string;
  city: string | null;
  address?: string | null;
  pincode?: string | null;
  lat?: string | null;
  lng?: string | null;
  serviceRadiusKm?: string | null;
  isActive: boolean | null;
  isPrimary: boolean | null;
  todayBookings: number;
  todayRevenue: string;
  weekBookings: number;
  weekRevenue: string;
  monthBookings: number;
  monthRevenue: string;
};

function money(value: string | number) {
  const amount = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function CommandStoreOverview({ compact = false }: { compact?: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { data, isLoading } = useQuery<{ stores: CommandStoreSummary[] }>({
    queryKey: ["/api/command/stores"],
  });
  const { data: office } = useQuery<Office>({
    queryKey: ["/api/office"],
  });

  const toggleAccess = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/branches/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/command/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({ title: "Store access updated" });
    },
    onError: (error: Error) =>
      toast({ title: "Could not update store", description: error.message, variant: "destructive" }),
  });

  const stores = data?.stores || [];
  const { data: relocationData } = useQuery<{ requests: StoreRelocationRequest[] }>({
    queryKey: ["/api/command/relocation"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/command/relocation?status=pending");
      return res.json();
    },
  });
  const pendingMoves = relocationData?.requests || [];
  const reviewMove = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      apiRequest("PATCH", `/api/command/relocation/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/command/relocation"] });
      toast({ title: "Relocation updated" });
    },
    onError: (error: Error) =>
      toast({ title: "Could not review relocation", description: error.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
    {pendingMoves.length > 0 ? (
      <Card>
        <CardHeader>
          <CardTitle>Relocation requests</CardTitle>
          <CardDescription>
            Approve a move so the store manager can change that Hub pin once. They must request again after saving.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingMoves.map((request) => {
            const store = stores.find((row) => row.id === request.branchId);
            return (
              <div key={request.id} className="rounded-md border p-3" data-testid={`card-relocation-${request.id}`}>
                <p className="font-medium">{store?.name || "Hub"}</p>
                <p className="text-sm text-muted-foreground">
                  {[request.proposedAddress, request.proposedCity, request.proposedPincode].filter(Boolean).join(", ")}
                </p>
                {request.reason ? <p className="mt-1 text-sm">{request.reason}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  Requested by {request.requestedByName || "store manager"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    disabled={reviewMove.isPending}
                    onClick={() => reviewMove.mutate({ id: request.id, status: "approved" })}
                    data-testid={`button-approve-relocation-${request.id}`}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reviewMove.isPending}
                    onClick={() => reviewMove.mutate({ id: request.id, status: "rejected" })}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    ) : null}
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {XGOO_MODULES.command.name} stores
          </CardTitle>
          <CardDescription>
          Control every {XGOO_MODULES.hub.name} location, daily revenue, and the kilometre range
          for {XGOO_MODULES.go.shortName} and {XGOO_MODULES.pro.shortName}.
          </CardDescription>
        </div>
        {compact ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/stores">Manage stores</Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading store revenue…
          </div>
        ) : stores.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No stores yet. Add a location in Stores.</p>
        ) : (
          <div className="space-y-3">
            {stores.map((store) => (
              <div
                key={store.id}
                className="rounded-lg border p-4"
                data-testid={`card-command-store-${store.id}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{store.name}</p>
                      {store.isPrimary ? <Badge>Primary</Badge> : null}
                      {store.isActive === false ? <Badge variant="secondary">Access off</Badge> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {[store.address, store.city, store.pincode].filter(Boolean).join(", ") ||
                        "Location not set"}
                    </p>
                    {store.lat && store.lng ? (
                      <p className="text-xs text-muted-foreground">
                        Pin set · {parseServiceRadiusKm(store.serviceRadiusKm)} km service range
                      </p>
                    ) : (
                      <p className="text-xs text-amber-700">
                        Set a map pin on this Hub so Go and Pro coverage can start.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCommandStoreId(store.id);
                        setLocation("/bookings/new");
                      }}
                      data-testid={`button-operate-store-${store.id}`}
                    >
                      Operate store
                    </Button>
                    <span className="text-xs text-muted-foreground">Store access</span>
                    <Switch
                      checked={store.isActive !== false}
                      disabled={toggleAccess.isPending}
                      onCheckedChange={(isActive) => toggleAccess.mutate({ id: store.id, isActive })}
                      aria-label={`Toggle access for ${store.name}`}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Go / Pro service range</p>
                    <HubServiceRangeInput branchId={store.id} value={store.serviceRadiusKm} />
                  </div>
                </div>
                <div className="mt-4 border-t pt-4">
                  <HubCounterQrCard
                    compact
                    officeSlug={office?.publicSlug}
                    branchId={store.id}
                    hubName={store.name}
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Today</p>
                    <p className="font-semibold">{money(store.todayRevenue)}</p>
                    <p className="text-xs text-muted-foreground">{store.todayBookings} bookings</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">This week</p>
                    <p className="font-semibold">{money(store.weekRevenue)}</p>
                    <p className="text-xs text-muted-foreground">{store.weekBookings} bookings</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">This month</p>
                    <p className="font-semibold">{money(store.monthRevenue)}</p>
                    <p className="text-xs text-muted-foreground">{store.monthBookings} bookings</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
