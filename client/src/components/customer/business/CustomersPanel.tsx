import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  BUSINESS_SHIPMENT_SCOPES,
  shipmentScopeLabel,
  type BusinessShipmentScope,
} from "@shared/business-courier";
import { businessApi } from "./business-api";
import { ProPageHeader, ProTableFrame, ProTableHead, proCellClass } from "./pro-table";

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

const EMPTY_DRAFT = {
  name: "",
  phone: "",
  address: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  shipmentType: "domestic" as BusinessShipmentScope,
  destinationCountry: "",
};

export function CustomersPanel({
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
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const listQuery = useQuery({
    queryKey: ["/api/customer/business/destinations"],
    queryFn: () => api.destinations() as Promise<BusinessDestination[]>,
  });

  const create = useMutation({
    mutationFn: () => {
      if (!draft.name.trim() || !draft.phone.trim() || !draft.address.trim()) {
        throw new Error("Add name, phone, and address on this row.");
      }
      return api.createDestination({
        ...draft,
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        address: draft.address.trim(),
        addressLine2: draft.addressLine2.trim() || null,
        city: draft.city.trim() || null,
        state: draft.state.trim() || null,
        pincode: draft.pincode.trim() || null,
        shipmentType: draft.shipmentType,
        destinationCountry: draft.shipmentType === "international" ? draft.destinationCountry.trim() || null : null,
        recurring: false,
      });
    },
    onSuccess: () => {
      setDraft(EMPTY_DRAFT);
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/destinations"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/today"] });
    },
    onError: (error: Error) =>
      toast({ title: "Could not save", description: error.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteDestination(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/destinations"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/today"] });
    },
  });

  const submit = () => create.mutate();

  if (listQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#FF4907]" />
      </div>
    );
  }

  const customers = listQuery.data || [];

  return (
    <div className="flex h-full min-h-0 flex-col py-4" data-testid="business-destinations">
      <ProPageHeader
        title="Customers"
        description="People you ship to. Add a row, then use them on Orders or Pickup."
        actions={
          onOpenPickup ? (
            <Button variant="outline" className="rounded-none" onClick={onOpenPickup}>
              Open pickup
            </Button>
          ) : null
        }
      />
      <ProTableFrame minWidth="1180px">
        <ProTableHead
          columns={[
            { label: "Name" },
            { label: "Phone" },
            { label: "Type", width: "8rem" },
            { label: "Address 1" },
            { label: "Address 2" },
            { label: "City" },
            { label: "State" },
            { label: "Pincode", width: "7rem" },
            { label: " ", width: "8rem" },
          ]}
        />
        <tbody>
          <tr className="border-b border-[#FF4907]/30 bg-[#FFF7F3]">
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                placeholder="Customer name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
                data-testid="input-destination-name"
              />
            </td>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                placeholder="Phone"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
                data-testid="input-destination-phone"
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
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
              />
            </td>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                placeholder="Area / landmark"
                value={draft.addressLine2}
                onChange={(e) => setDraft({ ...draft, addressLine2: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
              />
            </td>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                placeholder="City"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
              />
            </td>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                placeholder="State"
                value={draft.state}
                onChange={(e) => setDraft({ ...draft, state: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
              />
            </td>
            <td className="px-1 py-1">
              <input
                className={proCellClass}
                placeholder="Pin"
                value={draft.pincode}
                onChange={(e) => setDraft({ ...draft, pincode: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
              />
            </td>
            <td className="px-1 py-1">
              <Button
                size="sm"
                className="h-8 rounded-none bg-[#FF4907] px-3 text-white hover:bg-[#e03d00]"
                disabled={create.isPending}
                onClick={submit}
                data-testid="button-add-destination"
              >
                {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
                Add
              </Button>
            </td>
          </tr>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-b border-zinc-100">
              <td className="px-2 py-2 font-medium text-zinc-900">{customer.name}</td>
              <td className="px-2 py-2 text-zinc-600">{customer.phone}</td>
              <td className="px-2 py-2 text-zinc-600">{shipmentScopeLabel(customer.shipmentType)}</td>
              <td className="max-w-[14rem] truncate px-2 py-2 text-zinc-600" title={customer.address}>
                {customer.address}
              </td>
              <td className="max-w-[10rem] truncate px-2 py-2 text-zinc-600" title={customer.addressLine2 || ""}>
                {customer.addressLine2 || "—"}
              </td>
              <td className="px-2 py-2 text-zinc-600">{customer.city || "—"}</td>
              <td className="px-2 py-2 text-zinc-600">{customer.state || "—"}</td>
              <td className="px-2 py-2 text-zinc-600">{customer.pincode || "—"}</td>
              <td className="px-1 py-1">
                <div className="flex items-center gap-1">
                  {onAddParcel ? (
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center text-[#FF4907] hover:text-[#e03d00]"
                      title="Add to today's pickup"
                      onClick={() => onAddParcel(customer.id)}
                      data-testid={`button-add-parcel-${customer.id}`}
                    >
                      <Truck className="h-4 w-4" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center text-zinc-400 hover:text-red-600"
                    title="Remove customer"
                    onClick={() => remove.mutate(customer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </ProTableFrame>
    </div>
  );
}
