import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Link2, Loader2, Plus, Printer, Search, Trash2, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import {
  ProChip,
  ProField,
  ProSurface,
  ProToolbar,
  proMobileInputClass,
  proSearchClass,
  proSelectClass,
} from "./pro-table";
import { shareProCustomerLink } from "./share-store-link";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";

type BusinessProfile = {
  id?: string;
  companyName?: string;
  storeName?: string;
  pickupAddress?: string;
  pickupCity?: string | null;
  pickupState?: string | null;
  pickupPincode?: string | null;
  pickupPhone?: string | null;
  logoUrl?: string | null;
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
  createdAt?: string | Date | null;
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

type OrderStatusFilter = "all" | "open" | "pickup_requested" | "booked" | "cancelled";
type OrderSort = "newest" | "oldest" | "customer" | "status";

function orderTime(order: BusinessOrder) {
  const created = order.createdAt ? new Date(order.createdAt).getTime() : 0;
  return Number.isFinite(created) ? created : 0;
}

function compareOrders(a: BusinessOrder, b: BusinessOrder, sort: OrderSort) {
  switch (sort) {
    case "newest":
      return orderTime(b) - orderTime(a);
    case "oldest":
      return orderTime(a) - orderTime(b);
    case "customer":
      return a.receiverName.localeCompare(b.receiverName);
    case "status":
      return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    default: {
      const _never: never = sort;
      return _never;
    }
  }
}

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

type OrderDraft = typeof EMPTY_DRAFT;

function orderCreateBody(draft: OrderDraft) {
  const shared = {
    channel: draft.channel,
    shipmentType: draft.shipmentType,
    destinationCountry:
      draft.shipmentType === "international" ? draft.destinationCountry.trim() || null : null,
    contentDescription: draft.contents.trim() || "Store order",
    weight: draft.weight.trim() || "1",
    numberOfPieces: Math.max(1, Number(draft.pieces) || 1),
  };
  if (draft.destinationId) return { ...shared, destinationId: draft.destinationId };
  if (!draft.name.trim() || !draft.phone.trim() || !draft.address.trim()) {
    throw new Error("Add customer name, phone, and address.");
  }
  return {
    ...shared,
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    address: draft.address.trim(),
    addressLine2: draft.addressLine2.trim() || null,
    city: draft.city.trim() || null,
    state: draft.state.trim() || null,
    pincode: draft.pincode.trim() || null,
    saveCustomer: true,
  };
}

const cellClass =
  "h-9 w-full min-w-0 border-0 bg-transparent px-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400";

const formInputClass =
  "h-10 w-full rounded-none border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#FF4907]";

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
  const [formDraft, setFormDraft] = useState(EMPTY_DRAFT);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formPickerOpen, setFormPickerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [channelFilter, setChannelFilter] = useState<BusinessOrderChannelId | "all">("all");
  const [typeFilter, setTypeFilter] = useState<BusinessShipmentScope | "all">("all");
  const [sort, setSort] = useState<OrderSort>("status");
  const [search, setSearch] = useState("");
  const pickerRef = useRef<HTMLTableCellElement>(null);
  const mobilePickerRef = useRef<HTMLDivElement>(null);
  const formPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen && !formPickerOpen) return;
    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        pickerRef.current?.contains(target) ||
        mobilePickerRef.current?.contains(target) ||
        formPickerRef.current?.contains(target)
      ) {
        return;
      }
      setPickerOpen(false);
      setFormPickerOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [formPickerOpen, pickerOpen]);

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
    try {
      const result = await shareProCustomerLink({
        url,
        storeName: storeDisplayName,
        storeLogoUrl: profile?.logoUrl,
        xgooLogoUrl: xgooLogo,
        via,
      });
      toast({
        title: result === "shared" ? "Store link ready to send" : "Customer link copied",
        description:
          result === "shared"
            ? "The store logo and XGoo logo are included with the link."
            : "WhatsApp will show the store and XGoo branding with this link.",
      });
    } catch {
      toast({ title: "Copy this link", description: url });
    }
  };

  const customers = destinationsQuery.data || [];
  const orders = ordersQuery.data || [];
  const visibleOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...orders]
      .filter((order) => (statusFilter === "all" ? true : order.status === statusFilter))
      .filter((order) => (channelFilter === "all" ? true : order.channel === channelFilter))
      .filter((order) => (typeFilter === "all" ? true : order.shipmentType === typeFilter))
      .filter((order) => {
        if (!q) return true;
        return [
          order.xgooOrderId,
          order.receiverName,
          order.receiverPhone,
          order.receiverCity,
          order.receiverAddress,
          order.contentDescription,
          channelLabel(order.channel),
        ].some((value) => value?.toString().toLowerCase().includes(q));
      })
      .sort((a, b) => compareOrders(a, b, sort));
  }, [channelFilter, orders, search, sort, statusFilter, typeFilter]);
  const openOrders = visibleOrders.filter((order) => order.status === "open");
  const selectedOpen = openOrders.filter((order) => selectedIds.includes(order.id));
  const pickupTargets = selectedOpen.length > 0 ? selectedOpen : openOrders;
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
  const formMatches = useMemo(() => {
    const q = formDraft.name.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);
    return customers
      .filter((customer) =>
        [customer.name, customer.phone, customer.city].some((value) =>
          value?.toLowerCase().includes(q),
        ),
      )
      .slice(0, 8);
  }, [customers, formDraft.name]);

  const fillCustomer = (current: OrderDraft, customer: BusinessDestination): OrderDraft => ({
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
  });

  const applyCustomer = (customer: BusinessDestination) => {
    setDraft((current) => fillCustomer(current, customer));
    setPickerOpen(false);
  };

  const applyFormCustomer = (customer: BusinessDestination) => {
    setFormDraft((current) => fillCustomer(current, customer));
    setFormPickerOpen(false);
  };

  const clearDraft = () => {
    setDraft({ ...EMPTY_DRAFT, channel: draft.channel });
    setPickerOpen(false);
  };

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((current) => {
      if (checked) return current.includes(id) ? current : [...current, id];
      return current.filter((item) => item !== id);
    });
  };

  const toggleSelectVisibleOpen = (checked: boolean) => {
    setSelectedIds(checked ? openOrders.map((order) => order.id) : []);
  };

  const createOrder = useMutation({
    mutationFn: (input: { values: OrderDraft; source: "form" | "row" }) =>
      api.createOrder(orderCreateBody(input.values)),
    onSuccess: (_result, input) => {
      if (input.source === "form") {
        setFormDraft(EMPTY_DRAFT);
        setFormPickerOpen(false);
        setFormOpen(false);
      } else {
        setDraft({ ...EMPTY_DRAFT, channel: input.values.channel });
        setPickerOpen(false);
      }
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/orders"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/destinations"] });
      toast({
        title: "Order created",
        description: "Add it to pickup when the parcel is ready, or create another order.",
      });
    },
    onError: (error: Error) =>
      toast({ title: "Could not add order", description: error.message, variant: "destructive" }),
  });

  const submitRow = () => createOrder.mutate({ values: draft, source: "row" });
  const submitForm = () => createOrder.mutate({ values: formDraft, source: "form" });

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
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await api.queueOrderPickup(id, todayIsoDate());
      }
      return ids.length;
    },
    onSuccess: (count) => {
      setSelectedIds([]);
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
            Share a link so customers send their address, or create an order here if they prefer to
            tell you the details. Write the XGoo ID on the package so Hub and Command can identify it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="rounded-xl bg-[#FF4907] text-white hover:bg-[#e03d00] sm:rounded-none"
            onClick={() => {
              setFormDraft(EMPTY_DRAFT);
              setFormPickerOpen(false);
              setFormOpen(true);
            }}
            data-testid="button-create-order"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
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
            disabled={pickupTargets.length === 0 || queueAll.isPending}
            onClick={() => queueAll.mutate(pickupTargets.map((order) => order.id))}
            data-testid="button-add-selected-pickup"
          >
            {selectedOpen.length > 0
              ? `Add selected to pickup (${selectedOpen.length})`
              : `Add open to pickup (${openOrders.length})`}
          </Button>
          <Button variant="outline" className="rounded-xl sm:rounded-none" onClick={onOpenPickup}>
            Open pickup
          </Button>
        </div>
      </div>

      <ProToolbar>
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            className={`${proSearchClass} pl-8`}
            placeholder="Search XGoo ID, customer, phone, city…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            data-testid="input-orders-search"
          />
        </div>
        <select
          className={proSelectClass}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as OrderStatusFilter)}
          aria-label="Order status"
          data-testid="select-orders-status"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="pickup_requested">Pickup</option>
          <option value="booked">Booked</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className={proSelectClass}
          value={channelFilter}
          onChange={(event) =>
            setChannelFilter(event.target.value === "all" ? "all" : (event.target.value as BusinessOrderChannelId))
          }
          aria-label="Order channel"
          data-testid="select-orders-channel"
        >
          <option value="all">All channels</option>
          {BUSINESS_ORDER_CHANNELS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          className={proSelectClass}
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value === "all" ? "all" : (event.target.value as BusinessShipmentScope))
          }
          aria-label="Shipment type"
          data-testid="select-orders-type"
        >
          <option value="all">All types</option>
          {BUSINESS_SHIPMENT_SCOPES.map((scope) => (
            <option key={scope.id} value={scope.id}>
              {scope.label}
            </option>
          ))}
        </select>
        <select
          className={proSelectClass}
          value={sort}
          onChange={(event) => setSort(event.target.value as OrderSort)}
          aria-label="Sort orders"
          data-testid="select-orders-sort"
        >
          <option value="status">Status</option>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="customer">Customer A–Z</option>
        </select>
      </ProToolbar>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-2 md:hidden">
        <ProSurface className="space-y-3 bg-[#FFF7F3]">
          <p className="text-sm font-semibold text-zinc-900">Quick add</p>
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
              onClick={() => submitRow()}
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
        {visibleOrders.map((order) => (
          <ProSurface key={order.id} className="space-y-2" data-testid={`store-order-mobile-${order.id}`}>
            <div className="flex items-start justify-between gap-2">
              {order.status === "open" ? (
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#FF4907]"
                    checked={selectedIds.includes(order.id)}
                    onChange={(event) => toggleSelected(order.id, event.target.checked)}
                    aria-label={`Select ${order.receiverName}`}
                  />
                  Select
                </label>
              ) : (
                <span />
              )}
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
        {visibleOrders.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-zinc-500">No orders match these filters.</p>
        ) : null}
      </div>

      <div className="hidden min-h-0 flex-1 overflow-auto rounded-none border border-zinc-200 bg-white md:block">
        <table className="w-full min-w-[1520px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr className="border-b border-zinc-200">
              <th className="w-10 px-2 py-2.5">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#FF4907]"
                  checked={openOrders.length > 0 && selectedOpen.length === openOrders.length}
                  disabled={openOrders.length === 0}
                  onChange={(event) => toggleSelectVisibleOpen(event.target.checked)}
                  aria-label="Select all open orders"
                  data-testid="checkbox-orders-select-all"
                />
              </th>
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
              <td className="px-2 py-1 text-xs text-zinc-400">New</td>
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
                      submitRow();
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
                      submitRow();
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
                      submitRow();
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
                      submitRow();
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
                      submitRow();
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
                      submitRow();
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
                      submitRow();
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
                      submitRow();
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
                      submitRow();
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
                    onClick={() => submitRow()}
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
            {visibleOrders.map((order) => (
              <tr key={order.id} className="border-b border-zinc-100" data-testid={`store-order-${order.id}`}>
                <td className="px-2 py-2">
                  {order.status === "open" ? (
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#FF4907]"
                      checked={selectedIds.includes(order.id)}
                      onChange={(event) => toggleSelected(order.id, event.target.checked)}
                      aria-label={`Select ${order.receiverName}`}
                    />
                  ) : null}
                </td>
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
            {visibleOrders.length === 0 ? (
              <tr>
                <td className="px-2 py-8 text-center text-sm text-zinc-500" colSpan={15}>
                  No orders match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setFormDraft(EMPTY_DRAFT);
            setFormPickerOpen(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create order</DialogTitle>
            <DialogDescription>
              Enter the customer and parcel details. You can also type a new row in the table and click Add.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              submitForm();
            }}
          >
            <ProField label="Via">
              <select
                className={formInputClass}
                value={formDraft.channel}
                onChange={(e) =>
                  setFormDraft({ ...formDraft, channel: e.target.value as BusinessOrderChannelId })
                }
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
                className={formInputClass}
                value={formDraft.shipmentType}
                onChange={(e) =>
                  setFormDraft({
                    ...formDraft,
                    shipmentType: e.target.value as BusinessShipmentScope,
                    destinationCountry:
                      e.target.value === "domestic" ? "" : formDraft.destinationCountry,
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
            <div className="relative sm:col-span-2" ref={formPickerRef}>
              <ProField label="Customer">
                <Input
                  className={formInputClass}
                  placeholder="Name or pick a saved customer"
                  value={formDraft.name}
                  onFocus={() => setFormPickerOpen(true)}
                  onChange={(e) => {
                    setFormDraft({ ...formDraft, destinationId: "", name: e.target.value });
                    setFormPickerOpen(true);
                  }}
                  data-testid="input-create-order-customer"
                />
              </ProField>
              {formPickerOpen && formMatches.length > 0 ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden border border-zinc-200 bg-white shadow-lg">
                  {formMatches.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="block w-full px-3 py-2.5 text-left text-sm hover:bg-[#FFF7F3]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFormCustomer(customer)}
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
              <Input
                className={formInputClass}
                placeholder="Phone"
                value={formDraft.phone}
                onChange={(e) =>
                  setFormDraft({ ...formDraft, destinationId: "", phone: e.target.value })
                }
                data-testid="input-create-order-phone"
              />
            </ProField>
            <ProField label="Pincode">
              <Input
                className={formInputClass}
                placeholder="Pin / ZIP"
                value={formDraft.pincode}
                onChange={(e) =>
                  setFormDraft({ ...formDraft, destinationId: "", pincode: e.target.value })
                }
              />
            </ProField>
            <ProField label="Address 1" className="sm:col-span-2">
              <Input
                className={formInputClass}
                placeholder="House / street"
                value={formDraft.address}
                onChange={(e) =>
                  setFormDraft({ ...formDraft, destinationId: "", address: e.target.value })
                }
                data-testid="input-create-order-address"
              />
            </ProField>
            <ProField label="Address 2" className="sm:col-span-2">
              <Input
                className={formInputClass}
                placeholder="Area / landmark"
                value={formDraft.addressLine2}
                onChange={(e) =>
                  setFormDraft({ ...formDraft, destinationId: "", addressLine2: e.target.value })
                }
              />
            </ProField>
            <ProField label="City">
              <Input
                className={formInputClass}
                placeholder="City"
                value={formDraft.city}
                onChange={(e) => setFormDraft({ ...formDraft, city: e.target.value })}
              />
            </ProField>
            <ProField label="State">
              <Input
                className={formInputClass}
                placeholder="State"
                value={formDraft.state}
                onChange={(e) => setFormDraft({ ...formDraft, state: e.target.value })}
              />
            </ProField>
            {formDraft.shipmentType === "international" ? (
              <ProField label="Country" className="sm:col-span-2">
                <Input
                  className={formInputClass}
                  placeholder="Destination country"
                  value={formDraft.destinationCountry}
                  onChange={(e) =>
                    setFormDraft({ ...formDraft, destinationCountry: e.target.value })
                  }
                />
              </ProField>
            ) : null}
            <ProField label="Item" className="sm:col-span-2">
              <Input
                className={formInputClass}
                placeholder="Clothes, gift hamper…"
                value={formDraft.contents}
                onChange={(e) => setFormDraft({ ...formDraft, contents: e.target.value })}
              />
            </ProField>
            <ProField label="Kg">
              <Input
                className={formInputClass}
                inputMode="decimal"
                value={formDraft.weight}
                onChange={(e) => setFormDraft({ ...formDraft, weight: e.target.value })}
              />
            </ProField>
            <ProField label="Pieces">
              <Input
                className={formInputClass}
                inputMode="numeric"
                value={formDraft.pieces}
                onChange={(e) => setFormDraft({ ...formDraft, pieces: e.target.value })}
              />
            </ProField>
            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-none"
                onClick={() => {
                  setFormOpen(false);
                  setFormDraft(EMPTY_DRAFT);
                  setFormPickerOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-none bg-[#FF4907] text-white hover:bg-[#e03d00]"
                disabled={createOrder.isPending}
                data-testid="button-submit-create-order"
              >
                {createOrder.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create order
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
