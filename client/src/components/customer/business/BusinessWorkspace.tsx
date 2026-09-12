import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  Clock,
  Loader2,
  MapPin,
  Plus,
  SkipForward,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  BUSINESS_STORE_TYPES,
  BUSINESS_WEEKDAY_KEYS,
  BUSINESS_WEEKDAY_LABELS,
  DEFAULT_BUSINESS_WEEKDAYS,
  storeTypeLabel,
  todayIsoDate,
  type BusinessWeekdays,
} from "@shared/business-courier";
import { enabledPickupSlots, mergePickupSettings, type PickupSettings } from "@shared/pickup-settings";
import { XGOO_BRAND_FOUNDATION } from "@/components/marketing/brand-foundation";
import { PickupLocationMap } from "@/components/customer/PickupLocationMap";
import { businessApi } from "./business-api";

type BusinessProfile = {
  companyName: string;
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
  weekdays: BusinessWeekdays;
  ready?: boolean;
};

type BusinessDestination = {
  id: string;
  name: string;
  phone: string;
  address: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  notes?: string | null;
  recurring: boolean;
};

type BusinessDailyJob = {
  id: string;
  destinationId?: string | null;
  receiverName: string;
  receiverCity?: string | null;
  receiverAddress: string;
  weight?: string | number | null;
  numberOfPieces?: number | null;
  contentDescription?: string | null;
  status: "planned" | "skipped" | "submitted";
  bookingRequestId?: string | null;
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
  const [storeType, setStoreType] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [pickupTimeSlot, setPickupTimeSlot] = useState("");
  const [pickupPhone, setPickupPhone] = useState(userPhone || "");
  const [saving, setSaving] = useState(false);

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
    if (!companyName.trim() || !storeType) {
      toast({ title: "Add your business", description: "Company name and store type are required.", variant: "destructive" });
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
        storeType,
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
            <label className="mb-1.5 block text-sm font-medium">Company or store name</label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Kondapur Cloth House"
              data-testid="input-business-company"
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

export function TodayDispatch({
  token,
  onOpenCustomers,
  onOpenSchedule,
  prefillCustomerId,
  onPrefillConsumed,
}: {
  token: string;
  onOpenCustomers: () => void;
  onOpenSchedule?: () => void;
  prefillCustomerId?: string | null;
  onPrefillConsumed?: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const api = businessApi(token);
  const date = todayIsoDate();
  const [source, setSource] = useState<"existing" | "new">("existing");
  const [addId, setAddId] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [weight, setWeight] = useState("1");
  const [pieces, setPieces] = useState("1");
  const [contents, setContents] = useState("");

  const todayQuery = useQuery({
    queryKey: ["/api/customer/business/today", date],
    queryFn: () => api.today(date),
  });

  useEffect(() => {
    if (!prefillCustomerId) return;
    setSource("existing");
    setAddId(prefillCustomerId);
    onPrefillConsumed?.();
  }, [prefillCustomerId, onPrefillConsumed]);

  const patchJob = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patchTodayJob(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/customer/business/today"] }),
    onError: (error: Error) => toast({ title: "Could not update", description: error.message, variant: "destructive" }),
  });

  const addJob = useMutation({
    mutationFn: () => {
      const parcel = {
        date,
        weight: weight.trim() || "1",
        numberOfPieces: Math.max(1, Number(pieces) || 1),
        contentDescription: contents.trim() || "Parcel",
      };
      if (source === "existing") {
        if (!addId) throw new Error("Choose an existing customer.");
        return api.addTodayJob({ ...parcel, destinationId: addId });
      }
      if (!newName.trim() || !newPhone.trim() || !newAddress.trim()) {
        throw new Error("Name, phone, and address are required for a new customer.");
      }
      return api.addTodayJob({
        ...parcel,
        saveCustomer: true,
        newCustomer: {
          name: newName.trim(),
          phone: newPhone.trim(),
          address: newAddress.trim(),
          city: newCity.trim() || null,
          state: newState.trim() || null,
          pincode: newPincode.trim() || null,
        },
      });
    },
    onSuccess: () => {
      setAddId("");
      setNewName("");
      setNewPhone("");
      setNewAddress("");
      setNewCity("");
      setNewState("");
      setNewPincode("");
      setWeight("1");
      setPieces("1");
      setContents("");
      queryClient.invalidateQueries({ queryKey: ["/api/customer/business/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/business/destinations"] });
      toast({ title: "Parcel added", description: "It is on today's pickup. Request collection when the list is ready." });
    },
    onError: (error: Error) => toast({ title: "Could not add parcel", description: error.message, variant: "destructive" }),
  });

  const confirm = useMutation({
    mutationFn: () => api.confirmToday(date),
    onSuccess: (result: { confirmed: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/business/today"] });
      toast({
        title: "Pickup requested",
        description: `${result.confirmed} parcel${result.confirmed === 1 ? "" : "s"} added to today's collection.`,
      });
    },
    onError: (error: Error) => toast({ title: "Could not confirm", description: error.message, variant: "destructive" }),
  });

  const data = todayQuery.data as
    | {
        pickupDay: boolean;
        profile: BusinessProfile;
        jobs: BusinessDailyJob[];
        destinations: BusinessDestination[];
      }
    | undefined;

  const planned = data?.jobs.filter((job) => job.status === "planned") || [];
  const customers = data?.destinations || [];

  if (todayQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#FF4907]" />
      </div>
    );
  }

  if (data && !data.pickupDay) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-6">
        <h2 className="text-xl font-bold">Request pickup</h2>
        <Card>
          <CardContent className="space-y-3 pt-6 text-sm text-zinc-600">
            <p>
              Today is not a pickup day on your schedule. Change working days so you can add parcels
              for collection.
            </p>
            {onOpenSchedule ? (
              <Button variant="outline" className="rounded-none" onClick={onOpenSchedule}>
                Edit pickup schedule
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 py-6" data-testid="business-today">
      <div>
        <h2 className="text-xl font-bold">Request pickup</h2>
        <p className="text-sm text-zinc-500">
          {data?.profile.companyName || "Your store"} · {date}. Add parcels for an existing customer
          or a new customer, then request collection.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a parcel</CardTitle>
          <CardDescription>
            The parcel goes on today&apos;s standing pickup. A new customer is saved to your directory.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSource("existing")}
              className={
                source === "existing"
                  ? "rounded-none border border-[#FF4907] bg-[#FF4907] px-3 py-2 text-sm font-semibold text-white"
                  : "rounded-none border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
              }
            >
              Existing customer
            </button>
            <button
              type="button"
              onClick={() => setSource("new")}
              className={
                source === "new"
                  ? "rounded-none border border-[#FF4907] bg-[#FF4907] px-3 py-2 text-sm font-semibold text-white"
                  : "rounded-none border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
              }
            >
              New customer
            </button>
          </div>

          {source === "existing" ? (
            customers.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No saved customers yet. Choose New customer, or{" "}
                <button type="button" className="font-semibold text-[#FF4907]" onClick={onOpenCustomers}>
                  manage customers
                </button>
                .
              </p>
            ) : (
              <select
                className="h-11 w-full border border-zinc-200 bg-white px-3 text-sm"
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
                data-testid="select-parcel-customer"
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                    {customer.city ? ` · ${customer.city}` : ""}
                  </option>
                ))}
              </select>
            )
          ) : (
            <div className="space-y-3">
              <Input placeholder="Customer name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
              <Textarea placeholder="Delivery address" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} rows={2} />
              <div className="grid gap-3 sm:grid-cols-3">
                <Input placeholder="City" value={newCity} onChange={(e) => setNewCity(e.target.value)} />
                <Input placeholder="State" value={newState} onChange={(e) => setNewState(e.target.value)} />
                <Input placeholder="Pincode" value={newPincode} onChange={(e) => setNewPincode(e.target.value)} />
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="Weight kg"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              aria-label="Weight kg"
            />
            <Input
              type="number"
              min={1}
              placeholder="Pieces"
              value={pieces}
              onChange={(e) => setPieces(e.target.value)}
              aria-label="Pieces"
            />
            <Input
              placeholder="Contents"
              value={contents}
              onChange={(e) => setContents(e.target.value)}
              aria-label="Contents"
            />
          </div>
          <Button
            className="rounded-none bg-[#FF4907] text-white hover:bg-[#e03d00]"
            disabled={addJob.isPending}
            onClick={() => addJob.mutate()}
            data-testid="button-add-parcel"
          >
            {addJob.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add parcel to pickup
          </Button>
        </CardContent>
      </Card>

      {(data?.jobs || []).length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-zinc-600">
            No parcels on today&apos;s pickup yet. Add one above for an existing customer or a new
            customer.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data?.jobs.map((job) => (
            <Card key={job.id} data-testid={`today-job-${job.id}`}>
              <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Parcel</p>
                  <p className="font-semibold">{job.contentDescription || "Parcel"}</p>
                  <p className="text-sm text-zinc-500">
                    For {job.receiverName}
                    {job.receiverCity ? ` · ${job.receiverCity}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Input
                      className="h-9 w-20"
                      defaultValue={String(job.weight || "1")}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== String(job.weight || "")) {
                          patchJob.mutate({ id: job.id, body: { weight: e.target.value.trim() } });
                        }
                      }}
                      disabled={job.status !== "planned"}
                      aria-label="Weight kg"
                    />
                    <Input
                      className="h-9 w-16"
                      type="number"
                      min={1}
                      defaultValue={job.numberOfPieces || 1}
                      onBlur={(e) => {
                        const next = Number(e.target.value);
                        if (next >= 1 && next !== job.numberOfPieces) {
                          patchJob.mutate({ id: job.id, body: { numberOfPieces: next } });
                        }
                      }}
                      disabled={job.status !== "planned"}
                      aria-label="Pieces"
                    />
                    <Input
                      className="h-9 min-w-[10rem] flex-1"
                      defaultValue={job.contentDescription || ""}
                      placeholder="Contents"
                      onBlur={(e) => {
                        if (e.target.value.trim() !== (job.contentDescription || "")) {
                          patchJob.mutate({
                            id: job.id,
                            body: { contentDescription: e.target.value.trim() || "Parcel" },
                          });
                        }
                      }}
                      disabled={job.status !== "planned"}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={job.status === "submitted" ? "default" : "secondary"}
                    className={job.status === "skipped" ? "opacity-60" : ""}
                  >
                    {job.status === "planned"
                      ? "Planned"
                      : job.status === "skipped"
                        ? "Skipped"
                        : "Sent to XGoo"}
                  </Badge>
                  {job.status === "planned" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => patchJob.mutate({ id: job.id, body: { status: "skipped" } })}
                    >
                      <SkipForward className="mr-1 h-4 w-4" />
                      Skip
                    </Button>
                  ) : job.status === "skipped" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => patchJob.mutate({ id: job.id, body: { status: "planned" } })}
                    >
                      Restore
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button
        className="h-12 w-full rounded-none bg-[#FF4907] font-semibold text-white hover:bg-[#e03d00]"
        disabled={planned.length === 0 || confirm.isPending}
        onClick={() => confirm.mutate()}
        data-testid="button-confirm-today"
      >
        {confirm.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
        Request pickup ({planned.length})
      </Button>
    </div>
  );
}

export function DestinationsPanel({
  token,
  onOpenPickup,
  onAddParcel,
}: {
  token: string;
  onOpenPickup?: () => void;
  onAddParcel?: (customerId: string) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const api = businessApi(token);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const listQuery = useQuery({
    queryKey: ["/api/customer/business/destinations"],
    queryFn: () => api.destinations() as Promise<BusinessDestination[]>,
  });

  const create = useMutation({
    mutationFn: () =>
      api.createDestination({ name, phone, address, city, state, pincode, recurring: false }),
    onSuccess: () => {
      setName("");
      setPhone("");
      setAddress("");
      setCity("");
      setState("");
      setPincode("");
      queryClient.invalidateQueries({ queryKey: ["/api/customer/business/destinations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/business/today"] });
    },
    onError: (error: Error) => toast({ title: "Could not save", description: error.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteDestination(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/business/destinations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/business/today"] });
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5 py-6" data-testid="business-destinations">
      <div>
        <h2 className="text-xl font-bold">Customers</h2>
        <p className="text-sm text-zinc-500">
          Save the people and places you ship to. Pickup is for parcels — add a parcel for a saved
          customer, or an order from a new customer.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add customer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Customer name" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-destination-name" />
          <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-destination-phone" />
          <Textarea placeholder="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
            <Input placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
          </div>
          <Button
            className="rounded-none bg-[#FF4907] text-white hover:bg-[#e03d00]"
            disabled={create.isPending}
            onClick={() => {
              if (!name.trim() || !phone.trim() || !address.trim()) {
                toast({ title: "Add customer details", description: "Name, phone, and address are required.", variant: "destructive" });
                return;
              }
              create.mutate();
            }}
            data-testid="button-add-destination"
          >
            {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Save customer
          </Button>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {(listQuery.data || []).map((destination) => (
          <Card key={destination.id}>
            <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold">{destination.name}</p>
                <p className="text-sm text-zinc-500">{destination.city || destination.address}</p>
                <p className="text-xs text-zinc-400">{destination.phone}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {onAddParcel ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-none"
                    onClick={() => onAddParcel(destination.id)}
                    data-testid={`button-add-parcel-${destination.id}`}
                  >
                    Add parcel
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove.mutate(destination.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!listQuery.isLoading && (listQuery.data || []).length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            No customers yet. Save a customer here, or add a parcel for a new customer on Pickup.
          </p>
        ) : null}
      </div>
      {onOpenPickup && (listQuery.data || []).length > 0 ? (
        <Button variant="outline" className="w-full rounded-none" onClick={onOpenPickup}>
          Go to today&apos;s pickup
        </Button>
      ) : null}
    </div>
  );
}

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
        weekdays: form?.weekdays,
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

  return (
    <div className="mx-auto max-w-2xl space-y-5 py-6" data-testid="business-schedule">
      <div>
        <h2 className="text-xl font-bold">Pickup schedule</h2>
        <p className="text-sm text-zinc-500">
          One standing pickup from your store. Add customer parcels on Pickup, then request collection.
        </p>
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Pickup address</label>
            <Textarea
              value={form.pickupAddress || ""}
              onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })}
              rows={2}
              data-testid="input-pickup-address"
            />
          </div>
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
            <p className="text-xs text-zinc-500">{slotsQuery.data.cutoffNote}</p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="City"
              value={form.pickupCity || ""}
              onChange={(e) => setForm({ ...form, pickupCity: e.target.value })}
            />
            <Input
              placeholder="State"
              value={form.pickupState || ""}
              onChange={(e) => setForm({ ...form, pickupState: e.target.value })}
            />
            <Input
              placeholder="Pincode"
              value={form.pickupPincode || ""}
              onChange={(e) => setForm({ ...form, pickupPincode: e.target.value })}
            />
          </div>
          <Input
            placeholder="Pickup contact phone"
            value={form.pickupPhone || ""}
            onChange={(e) => setForm({ ...form, pickupPhone: e.target.value })}
            data-testid="input-pickup-phone"
          />
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" /> Pickup slot
            </p>
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setForm({ ...form, pickupTimeSlot: slot.value })}
                  className={
                    form.pickupTimeSlot === slot.value
                      ? "rounded-none border border-[#FF4907] bg-[#FF4907] px-3 py-1.5 text-sm text-white"
                      : "rounded-none border border-zinc-200 px-3 py-1.5 text-sm"
                  }
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4" /> Working days
            </p>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_WEEKDAY_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      weekdays: { ...weekdays, [key]: !weekdays[key] },
                    })
                  }
                  className={
                    weekdays[key]
                      ? "rounded-none border border-[#FF4907] bg-[#FFF7F3] px-3 py-1.5 text-sm font-semibold text-[#FF4907]"
                      : "rounded-none border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500"
                  }
                >
                  {BUSINESS_WEEKDAY_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
          <Input
            placeholder="GST number (optional)"
            value={form.gstNumber || ""}
            onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
          />
          <Button
            className="rounded-none bg-[#FF4907] text-white hover:bg-[#e03d00]"
            disabled={save.isPending}
            onClick={() => save.mutate()}
            data-testid="button-save-schedule"
          >
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
            Save schedule
          </Button>
        </CardContent>
      </Card>
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
        <CardTitle className="text-base">{profile.companyName || "Your business"}</CardTitle>
        <CardDescription>
          {storeTypeLabel(profile.storeType)} · standing pickup{" "}
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
