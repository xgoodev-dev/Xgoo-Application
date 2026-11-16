import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Radio } from "lucide-react";
import type { PickupLivePartner } from "@shared/pickup-live";
import { GoogleMapCanvas, type FleetMapMarker } from "@/components/maps/GoogleMapCanvas";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function rupees(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function minutesLabel(value: number) {
  if (value < 60) return `${Math.round(value)} min`;
  const hours = Math.floor(value / 60);
  const mins = Math.round(value % 60);
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

export function PickupLiveDesk() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canManageHubStaff, isCommandWorkspace } = useStaffAccess();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const live = useQuery<PickupLivePartner[]>({
    queryKey: ["/api/pickup-partners/live"],
    enabled: canManageHubStaff,
    refetchInterval: 8000,
  });

  const partners = live.data || [];
  const selected = partners.find((partner) => partner.id === selectedId) || partners.find((partner) => partner.onDuty) || partners[0];

  const markers = useMemo<FleetMapMarker[]>(
    () =>
      partners
        .filter((partner) => partner.lastLat != null && partner.lastLng != null)
        .map((partner) => ({
          id: partner.id,
          lat: partner.lastLat as number,
          lng: partner.lastLng as number,
          label: partner.name,
          letter: partner.name.slice(0, 1).toUpperCase(),
          color: partner.onDuty ? "#FF4907" : "#71717A",
        })),
    [partners],
  );

  const sendDemo = useMutation({
    mutationFn: (partnerId: string) => apiRequest("POST", `/api/pickup-partners/${partnerId}/demo-job`),
    onSuccess: async () => {
      toast({
        title: "Demo pickup assigned",
        description: "It will appear on this partner’s New jobs list with a map pin.",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/pickup-partners/live"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/booking-requests"] });
    },
    onError: (error: Error) =>
      toast({ title: "Could not assign demo pickup", description: error.message, variant: "destructive" }),
  });

  if (!canManageHubStaff) return null;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Live pickup movement</CardTitle>
          <CardDescription>
            {isCommandWorkspace
              ? `See where ${XGOO_MODULES.pickup.name} partners are now, plus today’s kilometres, fuel, and collections.`
              : `Watch this store’s ${XGOO_MODULES.pickup.name} partners move, and keep a record of kilometres, fuel, and pickups.`}
          </CardDescription>
        </div>
        {selected ? (
          <Button
            variant="outline"
            disabled={sendDemo.isPending || selected.status !== "active"}
            onClick={() => sendDemo.mutate(selected.id)}
          >
            {sendDemo.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send demo pickup
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleMapCanvas
          fleetMarkers={markers}
          selectedMarkerId={selected?.id}
          onMarkerSelect={setSelectedId}
          markerDraggable={false}
          showRoute={false}
          minHeight={340}
          center={markers[0] || { lat: 17.4487856, lng: 78.3638547 }}
          zoom={12}
        />
        {live.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : partners.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No activated pickup partners yet. Activate an account, then they appear here once they start duty.
          </p>
        ) : (
          <div className="space-y-3">
            {partners.map((partner) => {
              const active = selected?.id === partner.id;
              return (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => setSelectedId(partner.id)}
                  className={`flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition ${
                    active ? "border-primary/40 bg-primary/5" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{partner.name}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={partner.onDuty ? "default" : "outline"}>
                        {partner.onDuty ? (
                          <span className="inline-flex items-center gap-1">
                            <Radio className="h-3 w-3" />
                            On duty
                          </span>
                        ) : (
                          "Off duty"
                        )}
                      </Badge>
                      <Badge variant="outline">{partner.availability}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {partner.storeName || "Store pending"} · {partner.phone}
                    {partner.lastFixAt
                      ? ` · last seen ${new Date(partner.lastFixAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : " · no GPS yet"}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <RecordStat label="Today km" value={partner.today.distanceKm.toFixed(1)} />
                    <RecordStat label="Fuel" value={`${partner.today.fuelLitres.toFixed(2)} L`} />
                    <RecordStat label="Fuel cost" value={rupees(partner.today.fuelCost)} />
                    <RecordStat label="Pickups" value={String(partner.today.pickupsCompleted)} />
                  </div>
                  {active ? (
                    <div className="grid grid-cols-2 gap-2 border-t pt-2 text-sm sm:grid-cols-4">
                      <RecordStat label="Lifetime km" value={partner.lifetime.distanceKm.toFixed(1)} />
                      <RecordStat label="Lifetime fuel" value={`${partner.lifetime.fuelLitres.toFixed(2)} L`} />
                      <RecordStat label="Lifetime cost" value={rupees(partner.lifetime.fuelCost)} />
                      <RecordStat label="All pickups" value={String(partner.lifetime.pickupsCompleted)} />
                      <p className="col-span-2 text-xs text-muted-foreground sm:col-span-4">
                        <MapPin className="mr-1 inline h-3 w-3" />
                        {minutesLabel(partner.today.durationMinutes)} on duty today
                        {partner.lastLat != null
                          ? ` · pin ${partner.lastLat.toFixed(4)}, ${partner.lastLng?.toFixed(4)}`
                          : " · location appears after they start duty with GPS on"}
                      </p>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecordStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
