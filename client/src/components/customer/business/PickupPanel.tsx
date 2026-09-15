import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus, Printer, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  BUSINESS_SHIPMENT_SCOPES,
  joinAddressLines,
  shipmentScopeLabel,
  todayIsoDate,
  type BusinessShipmentScope,
} from "@shared/business-courier";
import { businessApi } from "./business-api";
import { printProParcelSlip } from "./ProParcelSlip";
import { ProPageHeader, ProTableFrame, ProTableHead, proCellClass } from "./pro-table";

type BusinessProfile = {
  companyName: string;
  storeName?: string;
  pickupAddress: string;
  pickupCity?: string | null;
  pickupState?: string | null;
  pickupPincode?: string | null;
  pickupPhone?: string | null;
  pickupStyle?: "standing" | "on_demand";
};

type BusinessDestination = {
  id: string;
  name: string;
  phone: string;
  address: string;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  shipmentType?: BusinessShipmentScope | string;
  destinationCountry?: string | null;
};

type BusinessDailyJob = {
  id: string;
  receiverName: string;
  receiverPhone?: string | null;
  receiverCity?: string | null;
  receiverState?: string | null;
  receiverPincode?: string | null;
  receiverAddress: string;
  receiverAddressLine2?: string | null;
  shipmentType?: BusinessShipmentScope | string;
  destinationCountry?: string | null;
  weight?: string | number | null;
  numberOfPieces?: number | null;
  contentDescription?: string | null;
  status: "planned" | "skipped" | "submitted";
  bookingRequestId?: string | null;
};

const EMPTY_DRAFT = {
  destinationId: "",
  name: "",
  phone: "",
  address: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  shipmentType: "domestic" as BusinessShipmentScope,
  destinationCountry: "",
  contents: "",
  weight: "1",
  pieces: "1",
};

const JOB_STATUS: Record<BusinessDailyJob["status"], string> = {
  planned: "Planned",
  skipped: "Skipped",
  submitted: "Sent",
};

export function PickupPanel({
  token,
  onOpenCustomers,
  onOpenSchedule,
  onOpenOrders,
  prefillCustomerId,
  onPrefillConsumed,
}: {
  token: string;
  onOpenCustomers: () => void;
  onOpenSchedule?: () => void;
  onOpenOrders?: () => void;
  prefillCustomerId?: string | null;
  onPrefillConsumed?: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const api = businessApi(token);
  const date = todayIsoDate();
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [pickerOpen, setPickerOpen] = useState(false);

  const todayQuery = useQuery({
    queryKey: ["/api/customer/business/today", date],
    queryFn: () => api.today(date),
  });

  const data = todayQuery.data as
    | {
        standingDay?: boolean;
        pickupStyle?: "standing" | "on_demand";
        profile: BusinessProfile;
        jobs: BusinessDailyJob[];
        destinations: BusinessDestination[];
      }
    | undefined;

  const customers = data?.destinations || [];

  useEffect(() => {
    if (!prefillCustomerId) return;
    const customer = customers.find((row) => row.id === prefillCustomerId);
    if (customer) {
      setDraft({
        ...EMPTY_DRAFT,
        destinationId: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        city: customer.city || "",
        state: customer.state || "",
        pincode: customer.pincode || "",
      });
    }
    onPrefillConsumed?.();
  }, [prefillCustomerId, customers, onPrefillConsumed]);

  const matches = useMemo(() => {
    const q = draft.name.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);
    return customers
      .filter((customer) =>
        [customer.name, customer.phone, customer.city].some((value) =>
          value?.toLowerCase().includes(q),
        ),
      )
      .slice(0, 8);
  }, [customers, draft.name]);

  const applyCustomer = (customer: BusinessDestination) => {
    setDraft((current) => ({
      ...current,
      destinationId: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      addressLine2: customer.addressLine2 || "",
      city: customer.city || "",
      state: customer.state || "",
      pincode: customer.pincode || "",
      shipmentType: customer.shipmentType === "international" ? "international" : "domestic",
      destinationCountry: customer.destinationCountry || "",
    }));
    setPickerOpen(false);
  };

  const patchJob = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patchTodayJob(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/customer/business/today"] }),
    onError: (error: Error) =>
      toast({ title: "Could not update", description: error.message, variant: "destructive" }),
  });

  const addJob = useMutation({
    mutationFn: () => {
      const parcel = {
        date,
        weight: draft.weight.trim() || "1",
        numberOfPieces: Math.max(1, Number(draft.pieces) || 1),
        contentDescription: draft.contents.trim() || "Parcel",
      };
      if (draft.destinationId) {
        return api.addTodayJob({ ...parcel, destinationId: draft.destinationId });
      }
      if (!draft.name.trim() || !draft.phone.trim() || !draft.address.trim()) {
        throw new Error("Add customer, phone, and address on this row.");
      }
      return api.addTodayJob({
        ...parcel,
        saveCustomer: true,
        newCustomer: {
          name: draft.name.trim(),
          phone: draft.phone.trim(),
          address: draft.address.trim(),
          addressLine2: draft.addressLine2.trim() || null,
          city: draft.city.trim() || null,
          state: draft.state.trim() || null,
          pincode: draft.pincode.trim() || null,
          shipmentType: draft.shipmentType,
          destinationCountry: draft.shipmentType === "international" ? draft.destinationCountry.trim() || null : null,
        },
      });
    },
    onSuccess: () => {
      setDraft(EMPTY_DRAFT);
      setPickerOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/today"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/destinations"] });
    },
    onError: (error: Error) =>
      toast({ title: "Could not add parcel", description: error.message, variant: "destructive" }),
  });

  const confirm = useMutation({
    mutationFn: () => api.confirmToday(date),
    onSuccess: (result: { confirmed: number }) => {
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/today"] });
      toast({
        title: "Pickup requested",
        description: `${result.confirmed} parcel${result.confirmed === 1 ? "" : "s"} added to today's collection.`,
      });
    },
    onError: (error: Error) =>
      toast({ title: "Could not confirm", description: error.message, variant: "destructive" }),
  });

  const planned = data?.jobs.filter((job) => job.status === "planned") || [];
  const pickupStyle = data?.pickupStyle || data?.profile.pickupStyle || "standing";

  if (todayQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#FF4907]" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col py-4" data-testid="business-today">
      <ProPageHeader
        title="Pickup"
        description={`${data?.profile.storeName || data?.profile.companyName || "Your store"} · ${date}. Add parcels, then request collection.`}
        actions={
          <>
            {onOpenOrders ? (
              <Button variant="outline" className="rounded-none" onClick={onOpenOrders}>
                From orders
              </Button>
            ) : (
              <Button variant="outline" className="rounded-none" onClick={onOpenCustomers}>
                Customers
              </Button>
            )}
            <Button
              className="rounded-none bg-[#FF4907] text-white hover:bg-[#e03d00]"
              disabled={planned.length === 0 || confirm.isPending}
              onClick={() => confirm.mutate()}
              data-testid="button-confirm-today"
            >
              {confirm.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Request pickup ({planned.length})
            </Button>
          </>
        }
      />
      {pickupStyle === "standing" && data?.standingDay === false ? (
        <p className="mb-3 text-sm text-zinc-500">
          Today is outside standing pickup days.{" "}
          {onOpenSchedule ? (
            <button type="button" className="font-semibold text-[#FF4907]" onClick={onOpenSchedule}>
              Edit schedule
            </button>
          ) : (
            "You can still add parcels."
          )}
        </p>
      ) : null}
      <ProTableFrame minWidth="1360px">
        <ProTableHead
          columns={[
            { label: "Customer" },
            { label: "Phone" },
            { label: "Type", width: "8rem" },
            { label: "Address 1" },
            { label: "Address 2" },
            { label: "Pincode", width: "7rem" },
            { label: "City" },
            { label: "Item" },
            { label: "Kg", width: "4rem" },
            { label: "Pcs", width: "4rem" },
            { label: "Status", width: "6rem" },
            { label: " ", width: "8rem" },
          ]}
        />
        <tbody>
          <tr className="border-b border-[#FF4907]/30 bg-[#FFF7F3]">
            <td className="relative px-1 py-1">
              <input
                className={proCellClass}
                placeholder="Name or pick saved"
                value={draft.name}
                onFocus={() => setPickerOpen(true)}
                onChange={(e) => {
                  setDraft({ ...draft, destinationId: "", name: e.target.value });
                  setPickerOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addJob.mutate();
                  }
                  if (e.key === "Escape") setPickerOpen(false);
                }}
                data-testid="select-parcel-customer"
              />
              {pickerOpen && matches.length > 0 ? (
                <div className="absolute left-0 top-full z-20 mt-1 w-[22rem] max-w-[80vw] border border-zinc-200 bg-white shadow-lg">
                  {matches.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-[#FFF7F3]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyCustomer(customer)}
                    >
                      <span className="font-medium">{customer.name}</span>
                      <span className="ml-2 text-zinc-500">
                        {customer.phone}
                        {customer.city ? ` · ${customer.city}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </td>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                placeholder="Phone"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, destinationId: "", phone: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addJob.mutate())}
              />
            </td>
            <td className="px-1 py-1">
              <select
                className="h-9 w-full bg-transparent px-1 text-sm outline-none"
                value={draft.shipmentType}
                onChange={(e) =>
                  setDraft({ ...draft, shipmentType: e.target.value as BusinessShipmentScope })
                }
                aria-label="Domestic or international"
              >
                {BUSINESS_SHIPMENT_SCOPES.map((scope) => (
                  <option key={scope.id} value={scope.id}>
                    {scope.label}
                  </option>
                ))}
              </select>
            </td>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                placeholder="House / street"
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, destinationId: "", address: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addJob.mutate())}
              />
            </td>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                placeholder="Area / landmark"
                value={draft.addressLine2}
                onChange={(e) => setDraft({ ...draft, destinationId: "", addressLine2: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addJob.mutate())}
              />
            </td>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                placeholder="Pin / ZIP"
                value={draft.pincode}
                onChange={(e) => setDraft({ ...draft, destinationId: "", pincode: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addJob.mutate())}
              />
            </td>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                placeholder="City"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addJob.mutate())}
              />
            </td>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                placeholder="Clothes, gift…"
                value={draft.contents}
                onChange={(e) => setDraft({ ...draft, contents: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addJob.mutate())}
              />
            </td>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                value={draft.weight}
                onChange={(e) => setDraft({ ...draft, weight: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addJob.mutate())}
                aria-label="Weight kg"
              />
            </td>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                value={draft.pieces}
                onChange={(e) => setDraft({ ...draft, pieces: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addJob.mutate())}
                aria-label="Pieces"
              />
            </td>
            <td className="px-2 py-1 text-xs text-zinc-400">New</td>
            <td className="px-1 py-1">
              <Button
                size="sm"
                className="h-8 rounded-none bg-[#FF4907] px-3 text-white hover:bg-[#e03d00]"
                disabled={addJob.isPending}
                onClick={() => addJob.mutate()}
                data-testid="button-add-parcel"
              >
                {addJob.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
                Add
              </Button>
            </td>
          </tr>
          {(data?.jobs || []).map((job) => (
            <tr key={job.id} className="border-b border-zinc-100" data-testid={`today-job-${job.id}`}>
              <td className="px-2 py-2 font-medium text-zinc-900">{job.receiverName}</td>
              <td className="px-2 py-2 text-zinc-600">{job.receiverPhone || "—"}</td>
              <td className="px-2 py-2 text-zinc-600">{shipmentScopeLabel(job.shipmentType)}</td>
              <td className="max-w-[12rem] truncate px-2 py-2 text-zinc-600" title={job.receiverAddress}>
                {job.receiverAddress}
              </td>
              <td className="max-w-[10rem] truncate px-2 py-2 text-zinc-600" title={job.receiverAddressLine2 || ""}>
                {job.receiverAddressLine2 || "—"}
              </td>
              <td className="px-2 py-2 text-zinc-600">{job.receiverPincode || "—"}</td>
              <td className="px-2 py-2 text-zinc-600">{job.receiverCity || "—"}</td>
              <td className="px-1 py-1">
                <input
                  className={proCellClass}
                  defaultValue={job.contentDescription || ""}
                  disabled={job.status !== "planned"}
                  onBlur={(e) => {
                    if (e.target.value.trim() !== (job.contentDescription || "")) {
                      patchJob.mutate({
                        id: job.id,
                        body: { contentDescription: e.target.value.trim() || "Parcel" },
                      });
                    }
                  }}
                />
              </td>
              <td className="px-1 py-1">
                <input
                  className={proCellClass}
                  defaultValue={String(job.weight || "1")}
                  disabled={job.status !== "planned"}
                  onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value !== String(job.weight || "")) {
                      patchJob.mutate({ id: job.id, body: { weight: e.target.value.trim() } });
                    }
                  }}
                  aria-label="Weight kg"
                />
              </td>
              <td className="px-1 py-1">
                <input
                  className={proCellClass}
                  defaultValue={job.numberOfPieces || 1}
                  disabled={job.status !== "planned"}
                  onBlur={(e) => {
                    const next = Number(e.target.value);
                    if (next >= 1 && next !== job.numberOfPieces) {
                      patchJob.mutate({ id: job.id, body: { numberOfPieces: next } });
                    }
                  }}
                  aria-label="Pieces"
                />
              </td>
              <td className="px-2 py-2 text-xs font-semibold text-zinc-500">{JOB_STATUS[job.status]}</td>
              <td className="px-1 py-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center text-zinc-500 hover:text-zinc-900"
                    title="Print A5 From / To label"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      printProParcelSlip({
                        from: {
                          name: data?.profile.storeName || data?.profile.companyName || "Store",
                          phone: data?.profile.pickupPhone,
                          address: data?.profile.pickupAddress || "",
                          city: data?.profile.pickupCity,
                          state: data?.profile.pickupState,
                          pincode: data?.profile.pickupPincode,
                        },
                        to: {
                          name: job.receiverName,
                          phone: job.receiverPhone,
                          address: joinAddressLines(job.receiverAddress, job.receiverAddressLine2),
                          city: job.receiverCity,
                          state: job.receiverState,
                          pincode: job.receiverPincode,
                        },
                        contents: job.contentDescription,
                        pieces: job.numberOfPieces,
                        weight: job.weight,
                        bookingRef: job.bookingRequestId || undefined,
                      });
                    }}
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  {job.status === "planned" ? (
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center text-zinc-400 hover:text-zinc-700"
                      title="Skip"
                      onClick={() => patchJob.mutate({ id: job.id, body: { status: "skipped" } })}
                    >
                      <SkipForward className="h-4 w-4" />
                    </button>
                  ) : job.status === "skipped" ? (
                    <button
                      type="button"
                      className="px-2 text-xs font-semibold text-[#FF4907]"
                      onClick={() => patchJob.mutate({ id: job.id, body: { status: "planned" } })}
                    >
                      Restore
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </ProTableFrame>
    </div>
  );
}
