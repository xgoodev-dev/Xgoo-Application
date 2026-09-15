import { useState } from "react";
import { Clock3, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { XGOO_BRAND_FOUNDATION } from "@/components/marketing/brand-foundation";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import {
  BUSINESS_STORE_TYPES,
  isBusinessApplicationComplete,
  type BusinessStoreTypeId,
} from "@shared/business-courier";
import { businessApi } from "./business-api";

export type ProProfileStatus = {
  companyName?: string | null;
  storeName?: string | null;
  storeType?: string | null;
  gstNumber?: string | null;
  pickupAddress?: string | null;
  pickupCity?: string | null;
  pickupState?: string | null;
  pickupPincode?: string | null;
  pickupTimeSlot?: string | null;
  verificationStatus?: string | null;
  verificationNote?: string | null;
  applicationComplete?: boolean;
  verified?: boolean;
  ready?: boolean;
};

export function ProApplicationForm({
  token,
  profile,
  onDone,
}: {
  token: string;
  profile?: ProProfileStatus | null;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState(profile?.companyName || "");
  const [storeName, setStoreName] = useState(profile?.storeName || "");
  const [storeType, setStoreType] = useState(profile?.storeType || "");
  const [gstNumber, setGstNumber] = useState(profile?.gstNumber || "");
  const [pickupAddress, setPickupAddress] = useState(profile?.pickupAddress || "");
  const [pickupCity, setPickupCity] = useState(profile?.pickupCity || "");
  const [pickupState, setPickupState] = useState(profile?.pickupState || "");
  const [pickupPincode, setPickupPincode] = useState(profile?.pickupPincode || "");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await businessApi(token).submitApplication({
        companyName: companyName.trim(),
        storeName: storeName.trim(),
        storeType,
        gstNumber: gstNumber.trim(),
        pickupAddress: pickupAddress.trim(),
        pickupCity: pickupCity.trim() || null,
        pickupState: pickupState.trim() || null,
        pickupPincode: pickupPincode.trim() || null,
      });
      toast({
        title: "Submitted to XGoo Command",
        description: "We’ll open your Pro account after these details are verified.",
      });
      onDone();
    } catch (error) {
      toast({
        title: "Could not submit",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6" data-testid="pro-application">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#FF4907]">
          {XGOO_MODULES.pro.name}
        </p>
        <h2 className="mt-1 text-2xl font-bold text-zinc-900">Tell us about your business</h2>
        <p className="mt-2 text-sm text-zinc-500">
          {XGOO_BRAND_FOUNDATION.purpose.quote} XGoo Command reviews every Pro application before
          pickup can start.
        </p>
      </div>
      {profile?.verificationStatus === "rejected" && profile.verificationNote ? (
        <p className="rounded-none border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {profile.verificationNote}
        </p>
      ) : null}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Business name</label>
            <Input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Legal or company name"
              data-testid="input-pro-company"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Store name</label>
            <Input
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              placeholder="e.g. Kondapur Cloth House"
              data-testid="input-pro-store"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">GSTIN</label>
            <Input
              value={gstNumber}
              onChange={(event) => setGstNumber(event.target.value.toUpperCase())}
              placeholder="15-character GST number"
              maxLength={15}
              data-testid="input-pro-gst"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Business category</p>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_STORE_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setStoreType(type.id)}
                  className={
                    storeType === type.id
                      ? "rounded-none border border-[#FF4907] bg-[#FF4907] px-3 py-2 text-sm font-semibold text-white"
                      : "rounded-none border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:border-zinc-300"
                  }
                  data-testid={`chip-store-type-${type.id}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Store address</label>
            <Textarea
              value={pickupAddress}
              onChange={(event) => setPickupAddress(event.target.value)}
              placeholder="Store or office address"
              rows={2}
              data-testid="input-pro-address"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="City"
              value={pickupCity}
              onChange={(event) => setPickupCity(event.target.value)}
              data-testid="input-pro-city"
            />
            <Input
              placeholder="State"
              value={pickupState}
              onChange={(event) => setPickupState(event.target.value)}
              data-testid="input-pro-state"
            />
            <Input
              placeholder="Pincode"
              value={pickupPincode}
              onChange={(event) => setPickupPincode(event.target.value)}
              data-testid="input-pro-pincode"
            />
          </div>
          <Button
            className="h-12 w-full rounded-none bg-[#FF4907] font-semibold text-white hover:bg-[#e03d00]"
            onClick={() => void submit()}
            disabled={saving}
            data-testid="button-submit-pro-application"
          >
            {saving ? "Submitting…" : "Submit for verification"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProVerificationPending({
  profile,
  onEdit,
}: {
  profile?: ProProfileStatus | null;
  onEdit?: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-6 py-10" data-testid="pro-pending-review">
      <div className="flex h-12 w-12 items-center justify-center rounded-none bg-[#FFF0EA] text-[#FF4907]">
        <Clock3 className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#FF4907]">
          {XGOO_MODULES.pro.name}
        </p>
        <h2 className="mt-1 text-2xl font-bold text-zinc-900">Waiting for Command</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Your business details are with {XGOO_MODULES.command.name}. You’ll get Pro access after
          they verify the store.
        </p>
      </div>
      <Card>
        <CardContent className="space-y-2 pt-6 text-sm">
          <p>
            <span className="text-zinc-500">Business</span>{" "}
            <span className="font-medium">{profile?.companyName || "—"}</span>
          </p>
          <p>
            <span className="text-zinc-500">Store</span>{" "}
            <span className="font-medium">{profile?.storeName || "—"}</span>
          </p>
          <p>
            <span className="text-zinc-500">GSTIN</span>{" "}
            <span className="font-medium">{profile?.gstNumber || "—"}</span>
          </p>
        </CardContent>
      </Card>
      {onEdit ? (
        <Button variant="outline" className="rounded-none" onClick={onEdit}>
          Update details
        </Button>
      ) : null}
    </div>
  );
}

export function proAccessState(profile?: ProProfileStatus | null) {
  if (!profile) return "loading" as const;
  const complete = profile.applicationComplete ?? isBusinessApplicationComplete(profile);
  if (!complete || profile.verificationStatus === "rejected") return "apply" as const;
  if (profile.verificationStatus !== "approved") return "pending" as const;
  return "approved" as const;
}

export function ProVerifiedBadge() {
  return (
    <p className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
      <ShieldCheck className="h-3.5 w-3.5" />
      Verified by {XGOO_MODULES.command.name}
    </p>
  );
}

export type { BusinessStoreTypeId };
