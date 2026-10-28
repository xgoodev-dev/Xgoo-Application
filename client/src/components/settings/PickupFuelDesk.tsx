import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fuel, Loader2 } from "lucide-react";
import {
  PICKUP_VEHICLE_TYPES,
  VEHICLE_MILEAGE_KM_PER_LITRE,
  type PickupFuelClaimStatus,
  type PickupVehicleType,
} from "@shared/pickup-fuel";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type FuelRate = {
  officeId: string;
  vehicleType: PickupVehicleType | string;
  mileageKmPerLitre: string;
  fuelPricePerLitre: string;
};

type FuelClaim = {
  id: string;
  partnerName: string;
  partnerPhone: string;
  distanceKm: string;
  fuelLitres: string;
  amount: string;
  status: PickupFuelClaimStatus;
  notes?: string | null;
  reviewNotes?: string | null;
  requestedAt?: string | null;
};

function vehicleLabel(type: string) {
  switch (type) {
    case "bike":
      return "Bike";
    case "scooter":
      return "Scooter";
    case "auto":
      return "Auto";
    case "van":
      return "Van";
    default:
      return type;
  }
}

function statusLabel(status: PickupFuelClaimStatus) {
  switch (status) {
    case "requested":
      return "Requested";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "paid":
      return "Paid";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function PickupFuelDesk() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canManageHubStaff } = useStaffAccess();
  const [mileage, setMileage] = useState("");
  const [price, setPrice] = useState("");
  const [vehicleType, setVehicleType] = useState<PickupVehicleType>("bike");

  const rates = useQuery<FuelRate>({
    queryKey: ["/api/pickup-fuel/rates"],
    enabled: canManageHubStaff,
  });
  const claims = useQuery<FuelClaim[]>({
    queryKey: ["/api/pickup-fuel/claims"],
    enabled: canManageHubStaff,
  });

  const rate = rates.data;
  const filledMileage = mileage || rate?.mileageKmPerLitre || String(VEHICLE_MILEAGE_KM_PER_LITRE.bike);
  const filledPrice = price || rate?.fuelPricePerLitre || "105";
  const filledVehicle = (vehicleType || rate?.vehicleType || "bike") as PickupVehicleType;

  const saveRates = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", "/api/pickup-fuel/rates", {
        vehicleType: filledVehicle,
        mileageKmPerLitre: Number(filledMileage),
        fuelPricePerLitre: Number(filledPrice),
      }),
    onSuccess: () => {
      toast({ title: "Fuel rates saved" });
      void queryClient.invalidateQueries({ queryKey: ["/api/pickup-fuel/rates"] });
    },
    onError: (error: Error) =>
      toast({ title: "Could not save rates", description: error.message, variant: "destructive" }),
  });

  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PickupFuelClaimStatus }) =>
      apiRequest("PATCH", `/api/pickup-fuel/claims/${id}`, { status }),
    onSuccess: () => {
      toast({ title: "Fuel request updated" });
      void queryClient.invalidateQueries({ queryKey: ["/api/pickup-fuel/claims"] });
    },
    onError: (error: Error) =>
      toast({ title: "Could not update request", description: error.message, variant: "destructive" }),
  });

  if (!canManageHubStaff) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5" />
          {XGOO_MODULES.pickup.name} fuel
        </CardTitle>
        <CardDescription>
          Set mileage and fuel price for this store. Partners track kilometres from sign-in to
          sign-out, then request fuel cost here for review and payment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Vehicle</Label>
            <Select
              value={filledVehicle}
              onValueChange={(value) => {
                const next = value as PickupVehicleType;
                setVehicleType(next);
                if (!mileage) setMileage(String(VEHICLE_MILEAGE_KM_PER_LITRE[next]));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PICKUP_VEHICLE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {vehicleLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pickup-mileage">Mileage (km/L)</Label>
            <Input
              id="pickup-mileage"
              value={mileage || rate?.mileageKmPerLitre || ""}
              onChange={(event) => setMileage(event.target.value)}
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pickup-fuel-price">Fuel price (₹/L)</Label>
            <Input
              id="pickup-fuel-price"
              value={price || rate?.fuelPricePerLitre || ""}
              onChange={(event) => setPrice(event.target.value)}
              inputMode="decimal"
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full" disabled={saveRates.isPending} onClick={() => saveRates.mutate()}>
              {saveRates.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save rates
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Fuel requests</h3>
          {claims.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (claims.data || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No fuel requests yet.</p>
          ) : (
            (claims.data || []).map((claim) => (
              <div
                key={claim.id}
                className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{claim.partnerName}</p>
                  <p className="text-sm text-muted-foreground">{claim.partnerPhone}</p>
                  <p className="text-sm text-muted-foreground">
                    {Number(claim.distanceKm).toFixed(1)} km · {Number(claim.fuelLitres).toFixed(2)} L · ₹
                    {Number(claim.amount).toFixed(2)}
                  </p>
                  {claim.notes ? <p className="text-sm text-muted-foreground">{claim.notes}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{statusLabel(claim.status)}</Badge>
                  {claim.status === "requested" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => review.mutate({ id: claim.id, status: "approved" })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => review.mutate({ id: claim.id, status: "rejected" })}
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {claim.status === "approved" ? (
                    <Button size="sm" onClick={() => review.mutate({ id: claim.id, status: "paid" })}>
                      Mark paid
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
