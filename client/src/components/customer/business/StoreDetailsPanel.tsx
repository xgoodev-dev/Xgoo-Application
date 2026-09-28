import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCurrentLocation } from "@/hooks/use-current-location";
import { storeCustomerOrderPath } from "@shared/business-courier";
import { businessApi } from "./business-api";
import type { ProProfileStatus } from "./ProAccessGate";

export function StoreDetailsPanel({
  token,
  onBack,
  initialProfile,
}: {
  token: string;
  onBack: () => void;
  initialProfile?: ProProfileStatus | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["/api/customer/business/profile"],
    queryFn: ({ signal }) => businessApi(token).profile(signal) as Promise<ProProfileStatus>,
    enabled: Boolean(token),
  });
  const profile = profileQuery.data ?? initialProfile ?? undefined;
  const [storeName, setStoreName] = useState(profile?.storeName || "");
  const [companyName, setCompanyName] = useState(profile?.companyName || "");
  const [pickupAddress, setPickupAddress] = useState(profile?.pickupAddress || "");
  const [pickupCity, setPickupCity] = useState(profile?.pickupCity || "");
  const [pickupState, setPickupState] = useState(profile?.pickupState || "");
  const [pickupPincode, setPickupPincode] = useState(profile?.pickupPincode || "");
  const { label: liveLabel, locating, live, refresh } = useCurrentLocation(null);

  useEffect(() => {
    const next = profileQuery.data ?? initialProfile;
    if (!next) return;
    setStoreName(next.storeName || "");
    setCompanyName(next.companyName || "");
    setPickupAddress(next.pickupAddress || "");
    setPickupCity(next.pickupCity || "");
    setPickupState(next.pickupState || "");
    setPickupPincode(next.pickupPincode || "");
  }, [profileQuery.data, initialProfile]);

  useEffect(() => {
    if (!live || !liveLabel.trim()) return;
    setPickupAddress(liveLabel);
  }, [live, liveLabel]);

  const save = useMutation({
    mutationFn: () =>
      businessApi(token).saveProfile({
        storeName: storeName.trim(),
        companyName: companyName.trim(),
        pickupAddress: pickupAddress.trim(),
        pickupCity: pickupCity.trim() || null,
        pickupState: pickupState.trim() || null,
        pickupPincode: pickupPincode.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/profile"] });
      toast({
        title: "Store details saved",
        description: "The header will show this store name. Owner name stays in Personal information.",
      });
    },
    onError: (error: Error) =>
      toast({ title: "Could not save", description: error.message, variant: "destructive" }),
  });

  if (!profile && profileQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
        <button type="button" onClick={onBack} className="mb-4 text-sm font-medium text-zinc-500">
          ← Back
        </button>
        <p className="text-sm text-zinc-600">Could not load store details. Try again from Profile.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
      <button type="button" onClick={onBack} className="mb-4 text-sm font-medium text-zinc-500">
        ← Back
      </button>
      <h2 className="text-xl font-bold text-zinc-900">Store details</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Store name is what customers and the Pro header use. Owner name is separate, under Personal information.
      </p>
      {profileQuery.isFetching && !profile ? (
        <p className="mt-2 text-xs text-zinc-400">Loading saved store details…</p>
      ) : null}
      {profile?.id ? (
        <p className="mt-3 text-sm text-zinc-600">
          Customer order link:{" "}
          <button
            type="button"
            className="font-medium text-[#FF4907] underline-offset-2 hover:underline"
            onClick={() => {
              const url = `${window.location.origin}${storeCustomerOrderPath(profile.id!)}`;
              void navigator.clipboard.writeText(url).then(
                () => toast({ title: "Customer link copied" }),
                () => toast({ title: "Copy this link", description: url }),
              );
            }}
            data-testid="button-copy-store-order-link"
          >
            Copy link for WhatsApp, Instagram, website, or app
          </button>
        </p>
      ) : null}
      <Card className="mt-4 border-zinc-100 shadow-none">
        <CardContent className="space-y-3 pt-6">
          <label className="block text-sm font-medium text-zinc-700">
            Store name
            <Input
              className="mt-1 rounded-none"
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              placeholder="e.g. Harshini Store"
              data-testid="input-store-name"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Business name
            <Input
              className="mt-1 rounded-none"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Registered business name"
              data-testid="input-company-name"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Store address
            <Input
              className="mt-1 rounded-none"
              value={pickupAddress}
              onChange={(event) => setPickupAddress(event.target.value)}
              placeholder="Address 1"
              data-testid="input-store-address"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              className="rounded-none"
              value={pickupCity}
              onChange={(event) => setPickupCity(event.target.value)}
              placeholder="City"
            />
            <Input
              className="rounded-none"
              value={pickupState}
              onChange={(event) => setPickupState(event.target.value)}
              placeholder="State"
            />
            <Input
              className="rounded-none"
              value={pickupPincode}
              onChange={(event) => setPickupPincode(event.target.value)}
              placeholder="Pincode"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-none"
            disabled={locating}
            onClick={refresh}
            data-testid="button-detect-store-location"
          >
            <LocateFixed className="mr-2 h-4 w-4" />
            {locating ? "Finding location…" : "Use current location"}
          </Button>
          <Button
            type="button"
            className="w-full rounded-none bg-[#FF4907] hover:bg-[#e03d00]"
            disabled={save.isPending || storeName.trim().length < 1 || companyName.trim().length < 1}
            onClick={() => save.mutate()}
            data-testid="button-save-store-details"
          >
            {save.isPending ? "Saving…" : "Save store details"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
