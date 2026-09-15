import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  BUSINESS_PICKUP_STYLES,
  BUSINESS_STORE_TYPES,
  BUSINESS_WEEKDAY_KEYS,
  BUSINESS_WEEKDAY_LABELS,
  DEFAULT_BUSINESS_WEEKDAYS,
  pickupStyleLabel,
  storeTypeLabel,
  type BusinessWeekdays,
} from "@shared/business-courier";
import { enabledPickupSlots, mergePickupSettings, type PickupSettings } from "@shared/pickup-settings";
import { XGOO_BRAND_FOUNDATION } from "@/components/marketing/brand-foundation";
import { PickupLocationMap } from "@/components/customer/PickupLocationMap";
import { businessApi } from "./business-api";
import { ProPageHeader, ProTableFrame, proCellClass } from "./pro-table";

type BusinessProfile = {
  companyName: string;
  storeName?: string;
  storeType: string;
  gstNumber?: string | null;
  pickupAddress: string;
  pickupCity?: string | null;
  pickupState?: string | null;
  pickupPincode?: string | null;
  pickupTimeSlot?: string | null;
  pickupPhone?: string | null;
  pickupLat?: string | null;
  pickupLng?: string | null;
  pickupStyle?: "standing" | "on_demand";
  weekdays: BusinessWeekdays;
  ready?: boolean;
};

export function BusinessOnboarding({
  token,
  slug,
  userName,
  userPhone,
  onDone,
}: {
  token: string;
  slug: string;
  userName?: string;
  userPhone?: string | null;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const api = businessApi(token);
  const [companyName, setCompanyName] = useState(userName || "");
  const [storeName, setStoreName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [storeType, setStoreType] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [pickupTimeSlot, setPickupTimeSlot] = useState("");
  const [pickupPhone, setPickupPhone] = useState(userPhone || "");
  const [saving, setSaving] = useState(false);

  const savedProfileQuery = useQuery({
    queryKey: ["/api/customer/business/profile"],
    queryFn: () => api.profile() as Promise<BusinessProfile>,
  });
  useEffect(() => {
    const saved = savedProfileQuery.data;
    if (!saved) return;
    if (saved.companyName) setCompanyName(saved.companyName);
    if (saved.storeName) setStoreName(saved.storeName);
    if (saved.storeType) setStoreType(saved.storeType);
    if (saved.gstNumber) setGstNumber(saved.gstNumber);
    if (saved.pickupAddress) setPickupAddress(saved.pickupAddress);
    if (saved.pickupCity) setPickupCity(saved.pickupCity || "");
    if (saved.pickupTimeSlot) setPickupTimeSlot(saved.pickupTimeSlot);
    if (saved.pickupPhone) setPickupPhone(saved.pickupPhone);
  }, [savedProfileQuery.data]);

  const slotsQuery = useQuery({
    queryKey: ["/api/public/office", slug, "pickup-settings"],
    queryFn: async () => {
      const res = await fetch(`/api/public/office/${encodeURIComponent(slug)}/pickup-settings`);
      const json = await res.json();
      return mergePickupSettings(json);
    },
  });
  const slots = useMemo(
    () => enabledPickupSlots((slotsQuery.data || mergePickupSettings({})) as PickupSettings),
    [slotsQuery.data],
  );

  async function save() {
    const slot = pickupTimeSlot || slots[0]?.value || "";
    if (!companyName.trim() || !storeName.trim() || !storeType || !gstNumber.trim()) {
      toast({
        title: "Add your business",
        description: "Business name, store name, GSTIN, and category are required.",
        variant: "destructive",
      });
      return;
    }
    if (!pickupAddress.trim() || !slot) {
      toast({ title: "Add pickup details", description: "Pickup address and time slot are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.saveProfile({
        companyName: companyName.trim(),
        storeName: storeName.trim(),
        storeType,
        gstNumber: gstNumber.trim(),
        pickupAddress: pickupAddress.trim(),
        pickupCity: pickupCity.trim() || null,
        pickupTimeSlot: slot,
        pickupPhone: pickupPhone.trim() || userPhone || null,
      });
      onDone();
    } catch (error) {
      toast({
        title: "Could not save",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6" data-testid="business-onboarding">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#FF4907]">Business movement</p>
        <h2 className="mt-1 text-2xl font-bold text-zinc-900">Set up your pickup schedule</h2>
        <p className="mt-2 text-sm text-zinc-500">
          {XGOO_BRAND_FOUNDATION.purpose.quote} Tell us where to collect so you can add customer
          parcels to this standing pickup and request collection in one place.
        </p>
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Business name</label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Legal or company name"
              data-testid="input-business-company"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Store name</label>
            <Input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Kondapur Cloth House"
              data-testid="input-business-store"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">GSTIN</label>
            <Input
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              placeholder="15-character GST number"
              maxLength={15}
              data-testid="input-business-gst"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">What do you run?</p>
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
            <label className="mb-1.5 block text-sm font-medium">Standing pickup address</label>
            <Textarea
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="Store or office address"
              rows={2}
              data-testid="input-onboarding-pickup-address"
            />
          </div>
          <Input
            placeholder="City"
            value={pickupCity}
            onChange={(e) => setPickupCity(e.target.value)}
            data-testid="input-onboarding-pickup-city"
          />
          <Input
            placeholder="Pickup contact phone"
            value={pickupPhone}
            onChange={(e) => setPickupPhone(e.target.value)}
            data-testid="input-onboarding-pickup-phone"
          />
          <div>
            <p className="mb-2 text-sm font-medium">Pickup slot</p>
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setPickupTimeSlot(slot.value)}
                  className={
                    pickupTimeSlot === slot.value
                      ? "rounded-none border border-[#FF4907] bg-[#FF4907] px-3 py-1.5 text-sm text-white"
                      : "rounded-none border border-zinc-200 px-3 py-1.5 text-sm"
                  }
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
          <Button
            className="h-12 w-full rounded-none bg-[#FF4907] font-semibold text-white hover:bg-[#e03d00]"
            onClick={() => void save()}
            disabled={saving}
            data-testid="button-save-business-onboarding"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export { PickupPanel as TodayDispatch } from "./PickupPanel";
export { CustomersPanel as DestinationsPanel } from "./CustomersPanel";

export function SchedulePanel({
  token,
  slug,
  userPhone,
}: {
  token: string;
  slug: string;
  userPhone?: string | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const api = businessApi(token);
  const profileQuery = useQuery({
    queryKey: ["/api/customer/business/profile"],
    queryFn: () => api.profile() as Promise<BusinessProfile>,
  });
  const slotsQuery = useQuery({
    queryKey: ["/api/public/office", slug, "pickup-settings"],
    queryFn: async () => {
      const res = await fetch(`/api/public/office/${encodeURIComponent(slug)}/pickup-settings`);
      const json = await res.json();
      return mergePickupSettings(json);
    },
  });

  const [form, setForm] = useState<Partial<BusinessProfile> | null>(null);
  useEffect(() => {
    if (profileQuery.data && !form) {
      setForm({
        ...profileQuery.data,
        pickupPhone: profileQuery.data.pickupPhone || userPhone || "",
        pickupStyle: profileQuery.data.pickupStyle || "standing",
        weekdays: profileQuery.data.weekdays || DEFAULT_BUSINESS_WEEKDAYS,
      });
    }
  }, [profileQuery.data, form, userPhone]);

  const slots = useMemo(() => {
    return enabledPickupSlots((slotsQuery.data || mergePickupSettings({})) as PickupSettings);
  }, [slotsQuery.data]);

  const save = useMutation({
    mutationFn: () =>
      api.saveProfile({
        pickupAddress: form?.pickupAddress,
        pickupCity: form?.pickupCity,
        pickupState: form?.pickupState,
        pickupPincode: form?.pickupPincode,
        pickupLat: form?.pickupLat,
        pickupLng: form?.pickupLng,
        pickupTimeSlot: form?.pickupTimeSlot,
        pickupPhone: form?.pickupPhone,
        pickupStyle: form?.pickupStyle || "standing",
        weekdays: form?.weekdays,
        companyName: form?.companyName,
        storeName: form?.storeName,
        gstNumber: form?.gstNumber,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/business/profile"] });
      toast({ title: "Schedule saved", description: "XGoo will use this pickup window on your working days." });
    },
    onError: (error: Error) => toast({ title: "Could not save", description: error.message, variant: "destructive" }),
  });

  if (!form) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#FF4907]" />
      </div>
    );
  }

  const weekdays = form.weekdays || DEFAULT_BUSINESS_WEEKDAYS;

  const chip = (on: boolean) =>
    on
      ? "rounded-none border border-[#FF4907] bg-[#FF4907] px-3 py-1.5 text-sm text-white"
      : "rounded-none border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600";

  return (
    <div className="flex h-full min-h-0 flex-col py-4" data-testid="business-schedule">
      <ProPageHeader
        title="Schedule"
        description="Standing pickup or collect only when you have orders."
        actions={
          <Button
            className="rounded-none bg-[#FF4907] text-white hover:bg-[#e03d00]"
            disabled={save.isPending}
            onClick={() => save.mutate()}
            data-testid="button-save-schedule"
          >
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
            Save
          </Button>
        }
      />
      <ProTableFrame minWidth="720px">
        <tbody>
          <tr className="border-b border-zinc-100">
            <th className="w-44 bg-zinc-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Store</th>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                value={form.storeName || ""}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                data-testid="input-schedule-store"
              />
            </td>
          </tr>
          <tr className="border-b border-zinc-100">
            <th className="bg-zinc-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Business</th>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                value={form.companyName || ""}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                data-testid="input-schedule-company"
              />
            </td>
          </tr>
          <tr className="border-b border-zinc-100">
            <th className="bg-zinc-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">GSTIN</th>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                value={form.gstNumber || ""}
                maxLength={15}
                onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
              />
            </td>
          </tr>
          <tr className="border-b border-zinc-100">
            <th className="bg-zinc-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Style</th>
            <td className="px-2 py-2">
              <div className="flex flex-wrap gap-2">
                {BUSINESS_PICKUP_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setForm({ ...form, pickupStyle: style.id })}
                    className={chip((form.pickupStyle || "standing") === style.id)}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </td>
          </tr>
          <tr className="border-b border-zinc-100">
            <th className="bg-zinc-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Slot</th>
            <td className="px-2 py-2">
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => setForm({ ...form, pickupTimeSlot: slot.value })}
                    className={chip(form.pickupTimeSlot === slot.value)}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </td>
          </tr>
          <tr className="border-b border-zinc-100">
            <th className="bg-zinc-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Days</th>
            <td className="px-2 py-2">
              <div className="flex flex-wrap gap-2">
                {BUSINESS_WEEKDAY_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, weekdays: { ...weekdays, [key]: !weekdays[key] } })}
                    className={chip(weekdays[key])}
                  >
                    {BUSINESS_WEEKDAY_LABELS[key]}
                  </button>
                ))}
              </div>
            </td>
          </tr>
          <tr className="border-b border-zinc-100">
            <th className="bg-zinc-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Address</th>
            <td className="px-1 py-1">
              <Textarea
                className="min-h-16 border-0 bg-transparent shadow-none focus-visible:ring-0"
                value={form.pickupAddress || ""}
                onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })}
                rows={2}
                data-testid="input-pickup-address"
              />
            </td>
          </tr>
          <tr className="border-b border-zinc-100">
            <th className="bg-zinc-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">City</th>
            <td className="px-1 py-1">
              <div className="grid gap-2 sm:grid-cols-3">
                <input className={proCellClass} placeholder="City" value={form.pickupCity || ""} onChange={(e) => setForm({ ...form, pickupCity: e.target.value })} />
                <input className={proCellClass} placeholder="State" value={form.pickupState || ""} onChange={(e) => setForm({ ...form, pickupState: e.target.value })} />
                <input className={proCellClass} placeholder="Pincode" value={form.pickupPincode || ""} onChange={(e) => setForm({ ...form, pickupPincode: e.target.value })} />
              </div>
            </td>
          </tr>
          <tr className="border-b border-zinc-100">
            <th className="bg-zinc-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Phone</th>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                value={form.pickupPhone || ""}
                onChange={(e) => setForm({ ...form, pickupPhone: e.target.value })}
                data-testid="input-pickup-phone"
              />
            </td>
          </tr>
          <tr>
            <th className="bg-zinc-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Map</th>
            <td className="px-2 py-3">
              <PickupLocationMap
                initialLat={form.pickupLat ? Number(form.pickupLat) : undefined}
                initialLng={form.pickupLng ? Number(form.pickupLng) : undefined}
                onLocationSelect={(lat, lng, name) =>
                  setForm({
                    ...form,
                    pickupLat: String(lat),
                    pickupLng: String(lng),
                    pickupAddress: form.pickupAddress?.trim() ? form.pickupAddress : name,
                  })
                }
              />
              {slotsQuery.data?.cutoffNote ? (
                <p className="mt-2 text-xs text-zinc-500">{slotsQuery.data.cutoffNote}</p>
              ) : null}
            </td>
          </tr>
        </tbody>
      </ProTableFrame>
    </div>
  );
}

export function BusinessAccountExtras({
  token,
  onOpenSchedule,
}: {
  token: string;
  onOpenSchedule: () => void;
}) {
  const profileQuery = useQuery({
    queryKey: ["/api/customer/business/profile"],
    queryFn: () => businessApi(token).profile() as Promise<BusinessProfile>,
  });
  const profile = profileQuery.data;
  if (!profile) return null;
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base">{profile.storeName || profile.companyName || "Your business"}</CardTitle>
        <CardDescription>
          {storeTypeLabel(profile.storeType)} · {pickupStyleLabel(profile.pickupStyle)}{" "}
          {profile.pickupTimeSlot || "not set"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="rounded-none" onClick={onOpenSchedule}>
          Edit pickup schedule
        </Button>
      </CardContent>
    </Card>
  );
}
