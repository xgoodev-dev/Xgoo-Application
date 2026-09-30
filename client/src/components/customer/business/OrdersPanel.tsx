import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Link2, Loader2, Plus, Printer, Trash2, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  BUSINESS_ORDER_CHANNELS,
  BUSINESS_SHIPMENT_SCOPES,
  joinAddressLines,
  shipmentScopeLabel,
  storeCustomerOrderPath,
  todayIsoDate,
  type BusinessOrderChannelId,
  type BusinessShipmentScope,
} from "@shared/business-courier";
import { businessApi } from "./business-api";
import { printProParcelSlip, type ProParcelSlipParty } from "./ProParcelSlip";
import { ProChip, ProField, ProSurface, proMobileInputClass } from "./pro-table";

type BusinessProfile = {
  id?: string;
  companyName?: string;
  storeName?: string;
  pickupAddress?: string;
  pickupCity?: string | null;
  pickupState?: string | null;
  pickupPincode?: string | null;
  pickupPhone?: string | null;
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

type BusinessOrder = {
  id: string;
  channel: BusinessOrderChannelId | string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverAddressLine2?: string | null;
  receiverCity?: string | null;
  receiverState?: string | null;
  receiverPincode?: string | null;
  shipmentType?: BusinessShipmentScope | string;
  destinationCountry?: string | null;
  contentDescription?: string | null;
  weight?: string | number | null;
  numberOfPieces?: number | null;
  notes?: string | null;
  xgooOrderId?: string | null;
  status: string;
  bookingRequestId?: string | null;
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  pickup_requested: "Pickup",
  booked: "Booked",
  cancelled: "Cancelled",
};

const STATUS_ORDER: Record<string, number> = {
  open: 0,
  pickup_requested: 1,
  booked: 2,
  cancelled: 3,
};

const EMPTY_DRAFT = {
  channel: "whatsapp" as BusinessOrderChannelId,
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

const cellClass =
  "h-9 w-full min-w-0 border-0 bg-transparent px-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400";

function channelLabel(channel: string) {
  return BUSINESS_ORDER_CHANNELS.find((item) => item.id === channel)?.label || channel;
}

function isOrderDraftDirty(draft: typeof EMPTY_DRAFT) {
  return Boolean(
    draft.destinationId ||
      draft.name.trim() ||
      draft.phone.trim() ||
      draft.address.trim() ||
      draft.addressLine2.trim() ||
      draft.city.trim() ||
      draft.state.trim() ||
      draft.pincode.trim() ||
      draft.destinationCountry.trim() ||
      draft.contents.trim() ||
      draft.shipmentType !== EMPTY_DRAFT.shipmentType ||
      draft.weight !== EMPTY_DRAFT.weight ||
      draft.pieces !== EMPTY_DRAFT.pieces,
  );
}

function fromParty(profile?: BusinessProfile | null): ProParcelSlipParty {
  return {
    name: profile?.storeName || profile?.companyName || "Store",
    phone: profile?.pickupPhone,
    address: profile?.pickupAddress || "",
    city: profile?.pickupCity,
    state: profile?.pickupState,
    pincode: profile?.pickupPincode,
  };
}

function toParty(order: BusinessOrder): ProParcelSlipParty {
  return {
    name: order.receiverName,
    phone: order.receiverPhone,
    address: joinAddressLines(order.receiverAddress, order.receiverAddressLine2),
    city: order.receiverCity,
    state: order.receiverState,
    pincode: order.receiverPincode,
  };
}

function printOrderSlip(profile: BusinessProfile | undefined, order: BusinessOrder) {
  return printProParcelSlip({
    from: fromParty(profile),
    to: toParty(order),
    contents: order.contentDescription,
    pieces: order.numberOfPieces,
    weight: order.weight,
    bookingRef: order.bookingRequestId || undefined,
    xgooOrderId: order.xgooOrderId,
    channel: channelLabel(order.channel),
  });
}

export function OrdersPanel({
  token,
  onOpenPickup,
}: {
  token: string;
  onOpenPickup: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const api = businessApi(token);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLTableCellElement>(null);
  const mobilePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      if (pickerRef.current?.contains(target) || mobilePickerRef.current?.contains(target)) return;
      setPickerOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [pickerOpen]);

  const profileQuery = useQuery({
    queryKey: ["/api/customer/business/profile"],
    queryFn: () => api.profile() as Promise<BusinessProfile>,
  });
  const destinationsQuery = useQuery({
    queryKey: ["/api/customer/business/destinations"],
    queryFn: () => api.destinations() as Promise<BusinessDestination[]>,
  });
  const ordersQuery = useQuery({
    queryKey: ["/api/customer/business/orders"],
    queryFn: () => api.orders() as Promise<BusinessOrder[]>,
  });
  const profile = profileQuery.data;
  const storeDisplayName = profile?.storeName || profile?.companyName || "our store";
  const customerOrderLink = profile?.id
    ? `${typeof window !== "undefined" ? window.location.origin : ""}${storeCustomerOrderPath(profile.id)}`
    : "";

  const shareCustomerLink = async (via: BusinessOrderChannelId = "whatsapp") => {
    if (!customerOrderLink) return;
    const url = `${customerOrderLink}?via=${via}`;
    const text = `Please add your delivery address for your order from ${storeDisplayName}: ${url}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Customer link copied",
        description: "Send it on WhatsApp, Instagram, your website, or app.",
      });
    } catch {
      toast({ title: "Copy this link", description: url });
    }
    if (via === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    }
  };

  const customers = destinationsQuery.data || [];
  const orders = useMemo(() => {
    return [...(ordersQuery.data || [])].sort(
      (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9),
    );
  }, [ordersQuery.data]);
  const openOrders = orders.filter((order) => order.status === "open");
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

  const clearDraft = () => {
    setDraft({ ...EMPTY_DRAFT, channel: draft.channel });
    setPickerOpen(false);
  };

  const createOrder = useMutation({
    mutationFn: () => {
      if (draft.destinationId) {
        return api.createOrder({
          channel: draft.channel,
          destinationId: draft.destinationId,
          shipmentType: draft.shipmentType,
          destinationCountry: draft.shipmentType === "international" ? draft.destinationCountry.trim() || null : null,
          contentDescription: draft.contents.trim() || "Store order",
          weight: draft.weight.trim() || "1",
          numberOfPieces: Math.max(1, Number(draft.pieces) || 1),
        });
      }
      if (!draft.name.trim() || !draft.phone.trim() || !draft.address.trim()) {
        throw new Error("Add customer, phone, and address on this row.");
      }
      return api.createOrder({
        channel: draft.channel,
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        address: draft.address.trim(),
        addressLine2: draft.addressLine2.trim() || null,
        city: draft.city.trim() || null,
        state: draft.state.trim() || null,
        pincode: draft.pincode.trim() || null,
        shipmentType: draft.shipmentType,
        destinationCountry: draft.shipmentType === "international" ? draft.destinationCountry.trim() || null : null,
        contentDescription: draft.contents.trim() || "Store order",
        weight: draft.weight.trim() || "1",
        numberOfPieces: Math.max(1, Number(draft.pieces) || 1),
        saveCustomer: true,
      });
    },
    onSuccess: () => {
      setDraft({ ...EMPTY_DRAFT, channel: draft.channel });
      setPickerOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/orders"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/destinations"] });
    },
    onError: (error: Error) =>
      toast({ title: "Could not add order", description: error.message, variant: "destructive" }),
  });

  const queuePickup = useMutation({
    mutationFn: (id: string) => api.queueOrderPickup(id, todayIsoDate()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/orders"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/today"] });
      toast({
        title: "Added to today's pickup",
        description: "Request collection on Pickup when the list is ready.",
      });
    },
    onError: (error: Error) =>
      toast({ title: "Could not queue pickup", description: error.message, variant: "destructive" }),
  });

  const queueAll = useMutation({
    mutationFn: async () => {
      for (const order of openOrders) {
        await api.queueOrderPickup(order.id, todayIsoDate());
      }
      return openOrders.length;
    },
    onSuccess: (count) => {
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/orders"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/today"] });
      toast({
        title: "Orders added to pickup",
        description: `${count} order${count === 1 ? "" : "s"} ready on Pickup.`,
      });
    },
    onError: (error: Error) =>
      toast({ title: "Could not queue pickup", description: error.message, variant: "destructive" }),
  });

  const cancelOrder = useMutation({
    mutationFn: (id: string) => api.cancelOrder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/orders"] });
    },
    onError: (error: Error) =>
      toast({ title: "Could not cancel", description: error.message, variant: "destructive" }),
  });

  if (ordersQuery.isLoading || profileQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#FF4907]" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col py-4" data-testid="business-orders">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Orders</h2>
          <p className="text-sm text-zinc-500">
            Share a link so customers send their address, or type a row. Write the XGoo ID on the
            package so Hub and Command can identify it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {customerOrderLink ? (
            <>
              <Button
                variant="outline"
                className="rounded-xl sm:rounded-none"
                onClick={() => void shareCustomerLink("whatsapp")}
                data-testid="button-share-order-link-whatsapp"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Share WhatsApp link
              </Button>
              <Button
                variant="outline"
                className="rounded-xl sm:rounded-none"
                onClick={() => void shareCustomerLink("instagram")}
                data-testid="button-copy-order-link"
              >
                Copy link
              </Button>
            </>
          ) : null}
          <Button
            variant="outline"
            className="rounded-xl sm:rounded-none"
            disabled={openOrders.length === 0 || queueAll.isPending}
            onClick={() => queueAll.mutate()}
          >
            Add open to pickup ({openOrders.length})
          </Button>
          <Button variant="outline" className="rounded-xl sm:rounded-none" onClick={onOpenPickup}>
            Open pickup
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-2 md:hidden">
        <ProSurface className="space-y-3 bg-[#FFF7F3]">
          <p className="text-sm font-semibold text-zinc-900">New order</p>
          <div className="grid grid-cols-2 gap-2.5">
            <ProField label="Via">
              <select
                className={proMobileInputClass}
                value={draft.channel}
                onChange={(e) => setDraft({ ...draft, channel: e.target.value as BusinessOrderChannelId })}
                aria-label="Order via"
              >
                {BUSINESS_ORDER_CHANNELS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </ProField>
            <ProField label="Type">
              <select
                className={proMobileInputClass}
                value={draft.shipmentType}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    shipmentType: e.target.value as BusinessShipmentScope,
                    destinationCountry: e.target.value === "domestic" ? "" : draft.destinationCountry,
                  })
                }
                aria-label="Domestic or international"
              >
                {BUSINESS_SHIPMENT_SCOPES.map((scope) => (
                  <option key={scope.id} value={scope.id}>
                    {scope.label}
                  </option>
                ))}
              </select>
            </ProField>
          </div>
          <div className="relative" ref={mobilePickerRef}>
            <ProField label="Customer">
              <input
                className={proMobileInputClass}
                placeholder="Name or pick saved"
                value={draft.name}
                onFocus={() => setPickerOpen(true)}
                onChange={(e) => {
                  setDraft({ ...draft, destinationId: "", name: e.target.value });
                  setPickerOpen(true);
                }}
                data-testid="input-order-customer-mobile"
              />
            </ProField>
            {pickerOpen && matches.length > 0 ? (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                {matches.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    className="block w-full px-3 py-2.5 text-left text-sm hover:bg-[#FFF7F3]"
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
          </div>
          <ProField label="Phone">
            <input
              className={proMobileInputClass}
              placeholder="Phone"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, destinationId: "", phone: e.target.value })}
            />
          </ProField>
          <ProField label="Address">
            <input
              className={proMobileInputClass}
              placeholder="House / street"
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, destinationId: "", address: e.target.value })}
            />
          </ProField>
          <div className="grid grid-cols-2 gap-2.5">
            <ProField label="Pincode">
              <input
                className={proMobileInputClass}
                placeholder="Pin / ZIP"
                value={draft.pincode}
                onChange={(e) => setDraft({ ...draft, destinationId: "", pincode: e.target.value })}
              />
            </ProField>
            <ProField label="City">
              <input
                className={proMobileInputClass}
                placeholder="City"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              />
            </ProField>
          </div>
          <ProField label="Item">
            <input
              className={proMobileInputClass}
              placeholder="Clothes, gift…"
              value={draft.contents}
              onChange={(e) => setDraft({ ...draft, contents: e.target.value })}
            />
          </ProField>
          <div className="grid grid-cols-2 gap-2.5">
            <ProField label="Kg">
              <input
                className={proMobileInputClass}
                inputMode="decimal"
                value={draft.weight}
                onChange={(e) => setDraft({ ...draft, weight: e.target.value })}
              />
            </ProField>
            <ProField label="Pieces">
              <input
                className={proMobileInputClass}
                inputMode="numeric"
                value={draft.pieces}
                onChange={(e) => setDraft({ ...draft, pieces: e.target.value })}
              />
            </ProField>
          </div>
          <div className="flex gap-2">
            <Button
              className="h-11 flex-1 rounded-xl bg-[#FF4907] text-white hover:bg-[#e03d00]"
              disabled={createOrder.isPending}
              onClick={() => createOrder.mutate()}
            >
              {createOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Add order
            </Button>
            {isOrderDraftDirty(draft) ? (
              <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={clearDraft}>
                Clear
              </Button>
            ) : null}
          </div>
        </ProSurface>
        {orders.map((order) => (
          <ProSurface key={order.id} className="space-y-2" data-testid={`store-order-mobile-${order.id}`}>
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                className="font-mono text-xs font-semibold text-zinc-900"
                onClick={() => {
                  if (!order.xgooOrderId) return;
                  void navigator.clipboard.writeText(order.xgooOrderId).then(
                    () => toast({ title: "XGoo ID copied", description: "Write it on the package." }),
                    () => toast({ title: "XGoo ID", description: order.xgooOrderId || "" }),
                  );
                }}
              >
                {order.xgooOrderId || "—"}
              </button>
              <ProChip accent={order.status === "open"}>{ORDER_STATUS_LABELS[order.status] || order.status}</ProChip>
            </div>
            <p className="font-semibold text-zinc-900">{order.receiverName}</p>
            <p className="text-sm text-zinc-500">
              {order.receiverPhone}
              {order.receiverCity ? ` · ${order.receiverCity}` : ""}
            </p>
            <p className="text-sm text-zinc-600">{order.contentDescription || "Store order"}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {order.xgooOrderId ? (
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => {
                  void navigator.clipboard.writeText(order.xgooOrderId || "");
                }}>
                  <Copy className="mr-1 h-4 w-4" />
                  Copy ID
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  if (!printOrderSlip(profileQuery.data, order)) {
                    toast({
                      title: "Could not print",
                      description: "Allow printing in this browser and try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Printer className="mr-1 h-4 w-4" />
                Label
              </Button>
              {order.status === "open" ? (
                <>
                  <Button
                    size="sm"
                    className="rounded-xl bg-[#FF4907] text-white hover:bg-[#e03d00]"
                    disabled={queuePickup.isPending}
                    onClick={() => queuePickup.mutate(order.id)}
                  >
                    <Truck className="mr-1 h-4 w-4" />
                    Pickup
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={cancelOrder.isPending}
                    onClick={() => cancelOrder.mutate(order.id)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : order.status === "pickup_requested" ? (
                <Button size="sm" variant="outline" className="rounded-xl" onClick={onOpenPickup}>
                  Collect
                </Button>
              ) : null}
            </div>
          </ProSurface>
        ))}
      </div>

      <div className="hidden min-h-0 flex-1 overflow-auto rounded-none border border-zinc-200 bg-white md:block">
        <table className="w-full min-w-[1520px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr className="border-b border-zinc-200">
              <th className="w-40 px-2 py-2.5 font-semibold">XGoo ID</th>
              <th className="px-2 py-2.5 font-semibold">Via</th>
              <th className="px-2 py-2.5 font-semibold">Customer</th>
              <th className="px-2 py-2.5 font-semibold">Phone</th>
              <th className="w-32 px-2 py-2.5 font-semibold">Type</th>
              <th className="px-2 py-2.5 font-semibold">Address 1</th>
              <th className="px-2 py-2.5 font-semibold">Address 2</th>
              <th className="w-28 px-2 py-2.5 font-semibold">Pincode</th>
              <th className="px-2 py-2.5 font-semibold">City</th>
              <th className="px-2 py-2.5 font-semibold">Item</th>
              <th className="w-16 px-2 py-2.5 font-semibold">Kg</th>
              <th className="w-16 px-2 py-2.5 font-semibold">Pcs</th>
              <th className="w-24 px-2 py-2.5 font-semibold">Status</th>
              <th className="w-44 px-2 py-2.5 font-semibold"> </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#FF4907]/30 bg-[#FFF7F3]">
              <td className="px-2 py-1 text-xs text-zinc-400">Assigned on add</td>
              <td className="px-1 py-1">
                <select
                  className="h-9 w-full bg-transparent px-1 text-sm outline-none"
                  value={draft.channel}
                  onChange={(e) =>
                    setDraft({ ...draft, channel: e.target.value as BusinessOrderChannelId })
                  }
                  aria-label="Order via"
                >
                  {BUSINESS_ORDER_CHANNELS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </td>
              <td
                className="relative px-1 py-1"
                ref={pickerRef}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                    setPickerOpen(false);
                  }
                }}
              >
                <input
                  className={cellClass}
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
                      createOrder.mutate();
                    }
                    if (e.key === "Escape") setPickerOpen(false);
                  }}
                  data-testid="input-order-customer"
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
                  className={cellClass}
                  placeholder="Phone"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, destinationId: "", phone: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createOrder.mutate();
                    }
                  }}
                />
              </td>
              <td className="px-1 py-1">
                <select
                  className="h-9 w-full bg-transparent px-1 text-sm outline-none"
                  value={draft.shipmentType}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      shipmentType: e.target.value as BusinessShipmentScope,
                      destinationCountry: e.target.value === "domestic" ? "" : draft.destinationCountry,
                    })
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
                  className={cellClass}
                  placeholder="House / street"
                  value={draft.address}
                  onChange={(e) => setDraft({ ...draft, destinationId: "", address: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createOrder.mutate();
                    }
                  }}
                />
              </td>
              <td className="px-1 py-1">
                <input
                  className={cellClass}
                  placeholder="Area / landmark"
                  value={draft.addressLine2}
                  onChange={(e) => setDraft({ ...draft, destinationId: "", addressLine2: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createOrder.mutate();
                    }
                  }}
                />
              </td>
              <td className="px-1 py-1">
                <input
                  className={cellClass}
                  placeholder="Pin / ZIP"
                  value={draft.pincode}
                  onChange={(e) => setDraft({ ...draft, destinationId: "", pincode: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createOrder.mutate();
                    }
                  }}
                />
              </td>
              <td className="px-1 py-1">
                <input
                  className={cellClass}
                  placeholder="City"
                  value={draft.city}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createOrder.mutate();
                    }
                  }}
                />
              </td>
              <td className="px-1 py-1">
                <input
                  className={cellClass}
                  placeholder="Clothes, gift…"
                  value={draft.contents}
                  onChange={(e) => setDraft({ ...draft, contents: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createOrder.mutate();
                    }
                  }}
                />
              </td>
              <td className="px-1 py-1">
                <input
                  className={cellClass}
                  inputMode="decimal"
                  value={draft.weight}
                  onChange={(e) => setDraft({ ...draft, weight: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createOrder.mutate();
                    }
                  }}
                  aria-label="Weight kg"
                />
              </td>
              <td className="px-1 py-1">
                <input
                  className={cellClass}
                  inputMode="numeric"
                  value={draft.pieces}
                  onChange={(e) => setDraft({ ...draft, pieces: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createOrder.mutate();
                    }
                  }}
                  aria-label="Pieces"
                />
              </td>
              <td className="px-2 py-1 text-xs text-zinc-400">New</td>
              <td className="px-1 py-1">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    className="h-8 rounded-none bg-[#FF4907] px-3 text-white hover:bg-[#e03d00]"
                    disabled={createOrder.isPending}
                    onClick={() => createOrder.mutate()}
                    data-testid="button-save-order"
                  >
                    {createOrder.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="mr-1 h-4 w-4" />
                        Add
                      </>
                    )}
                  </Button>
                  {isOrderDraftDirty(draft) ? (
                    <button
                      type="button"
                      className="inline-flex h-8 items-center px-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900"
                      title="Clear this row"
                      onClick={clearDraft}
                      data-testid="button-clear-order-draft"
                    >
                      <X className="mr-1 h-4 w-4" />
                      Clear
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-zinc-100" data-testid={`store-order-${order.id}`}>
                <td className="px-2 py-2">
                  {order.xgooOrderId ? (
                    <button
                      type="button"
                      className="font-mono text-xs font-semibold tracking-wide text-zinc-900 hover:text-[#FF4907]"
                      title="Copy XGoo ID"
                      onClick={() => {
                        void navigator.clipboard.writeText(order.xgooOrderId || "").then(
                          () =>
                            toast({
                              title: "XGoo ID copied",
                              description: "Write it on the package.",
                            }),
                          () => toast({ title: "XGoo ID", description: order.xgooOrderId || "" }),
                        );
                      }}
                    >
                      {order.xgooOrderId}
                    </button>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="px-2 py-2 text-zinc-600">{channelLabel(order.channel)}</td>
                <td className="px-2 py-2 font-medium text-zinc-900">{order.receiverName}</td>
                <td className="px-2 py-2 text-zinc-600">{order.receiverPhone}</td>
                <td className="px-2 py-2 text-zinc-600">
                  {shipmentScopeLabel(order.shipmentType)}
                  {order.shipmentType === "international" && order.destinationCountry
                    ? ` · ${order.destinationCountry}`
                    : ""}
                </td>
                <td className="max-w-[14rem] truncate px-2 py-2 text-zinc-600" title={order.receiverAddress}>
                  {order.receiverAddress}
                </td>
                <td className="max-w-[10rem] truncate px-2 py-2 text-zinc-600" title={order.receiverAddressLine2 || ""}>
                  {order.receiverAddressLine2 || "—"}
                </td>
                <td className="px-2 py-2 text-zinc-600">{order.receiverPincode || "—"}</td>
                <td className="px-2 py-2 text-zinc-600">{order.receiverCity || "—"}</td>
                <td className="px-2 py-2 text-zinc-600">{order.contentDescription || "Store order"}</td>
                <td className="px-2 py-2 text-zinc-600">{order.weight || "1"}</td>
                <td className="px-2 py-2 text-zinc-600">{order.numberOfPieces || 1}</td>
                <td className="px-2 py-2">
                  <span
                    className={
                      order.status === "open"
                        ? "text-xs font-semibold text-[#FF4907]"
                        : "text-xs font-medium text-zinc-500"
                    }
                  >
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                </td>
                <td className="px-1 py-1">
                  <div className="flex items-center gap-1">
                    {order.xgooOrderId ? (
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center text-zinc-500 hover:text-zinc-900"
                        title="Copy XGoo ID"
                        onClick={() => {
                          void navigator.clipboard.writeText(order.xgooOrderId || "").then(
                            () =>
                              toast({
                                title: "XGoo ID copied",
                                description: "Write it on the package.",
                              }),
                            () => toast({ title: "XGoo ID", description: order.xgooOrderId || "" }),
                          );
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center text-zinc-500 hover:text-zinc-900"
                      title="Print A5 From / To label"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!printOrderSlip(profileQuery.data, order)) {
                          toast({
                            title: "Could not print",
                            description: "Allow printing in this browser and try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    {order.status === "open" ? (
                      <>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center text-[#FF4907] hover:text-[#e03d00]"
                          title="Add to today's pickup"
                          disabled={queuePickup.isPending}
                          onClick={() => queuePickup.mutate(order.id)}
                        >
                          <Truck className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center text-zinc-400 hover:text-red-600"
                          title="Cancel order"
                          disabled={cancelOrder.isPending}
                          onClick={() => cancelOrder.mutate(order.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : order.status === "pickup_requested" ? (
                      <button
                        type="button"
                        className="px-2 text-xs font-semibold text-[#FF4907]"
                        onClick={onOpenPickup}
                      >
                        Collect
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
