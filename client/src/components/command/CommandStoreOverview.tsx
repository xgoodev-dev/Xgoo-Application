import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { XGOO_MODULES } from "@/components/marketing/site-info";

export type CommandStoreSummary = {
  id: string;
  name: string;
  city: string | null;
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
  const { data, isLoading } = useQuery<{ stores: CommandStoreSummary[] }>({
    queryKey: ["/api/command/stores"],
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

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {XGOO_MODULES.command.name} stores
          </CardTitle>
          <CardDescription>
            Daily, weekly, and monthly revenue for every {XGOO_MODULES.hub.name} location. Turn off
            access to remove a store from operations.
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
                    <p className="text-sm text-muted-foreground">{store.city || "Location not set"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Store access</span>
                    <Switch
                      checked={store.isActive !== false}
                      disabled={toggleAccess.isPending}
                      onCheckedChange={(isActive) => toggleAccess.mutate({ id: store.id, isActive })}
                      aria-label={`Toggle access for ${store.name}`}
                    />
                  </div>
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
  );
}
