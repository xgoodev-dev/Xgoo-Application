import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import { CheckCircle2 } from "lucide-react";
import {
  BUSINESS_ORDER_CHANNELS,
  businessOrderChannelSchema,
  type BusinessOrderChannelId,
} from "@shared/business-courier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XGOO_BRAND, XGOO_MODULES } from "@/components/marketing/site-info";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";

const ORANGE = "#FF4907";

function channelFromSearch(search: string): BusinessOrderChannelId {
  const via = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("via");
  const parsed = businessOrderChannelSchema.safeParse(via);
  return parsed.success ? parsed.data : "other";
}

function itemFromSearch(search: string) {
  return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("item")?.trim() || "";
}

function initialsFromName(name?: string) {
  if (!name?.trim()) return "ST";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function StoreCustomerOrderPage() {
  const params = useParams<{ storeId?: string }>();
  const search = useSearch();
  const storeId = params.storeId || "";
  const channel = useMemo(() => channelFromSearch(search), [search]);
  const presetItem = useMemo(() => itemFromSearch(search), [search]);
  const channelLabel =
    BUSINESS_ORDER_CHANNELS.find((item) => item.id === channel)?.label || "your order";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [orderNote, setOrderNote] = useState(presetItem);

  const store = useQuery({
    queryKey: ["/api/public/store", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const res = await fetch(`/api/public/store/${encodeURIComponent(storeId)}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { message?: string }).message || "Store not found");
      return body as { id: string; storeName: string; logoUrl?: string | null };
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/public/store/${encodeURIComponent(storeId)}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          addressLine2: addressLine2.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          pincode: pincode.trim() || null,
          orderNote: orderNote.trim() || null,
          item: presetItem || undefined,
          channel,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { message?: string }).message || "Could not save details");
      return body as { storeName: string };
    },
  });

  const storeName = store.data?.storeName || "Store";
  const storeLogo = store.data?.logoUrl?.trim() || "";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 [color-scheme:light]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {storeLogo ? (
              <img
                src={storeLogo}
                alt={storeName}
                className="h-12 w-12 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white"
                style={{ backgroundColor: ORANGE }}
                aria-hidden
              >
                {initialsFromName(store.isLoading ? "" : storeName)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-bold">{store.isLoading ? "…" : storeName}</p>
              <p className="text-xs text-zinc-500">Delivery with {XGOO_MODULES.pro.name}</p>
            </div>
          </div>
          <img src={xgooLogo} alt={XGOO_BRAND.productName} className="h-10 w-10 shrink-0 object-contain" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Where should we send it?</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {store.isError
            ? "This store link is not available."
            : `Add your address for this ${channelLabel.toLowerCase()} order. ${XGOO_BRAND.productName} will collect it from ${store.isLoading ? "the store" : storeName}.`}
        </p>

        {submit.isSuccess ? (
          <div className="mt-8 rounded-2xl border border-emerald-100 bg-white p-6 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h2 className="mt-3 text-xl font-bold">Details received</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Your order from {submit.data.storeName} is with {XGOO_BRAND.productName} Courier. We will share tracking
              on WhatsApp once the shipment is booked.
            </p>
          </div>
        ) : (
          <form
            className="mt-6 space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
            onSubmit={(event) => {
              event.preventDefault();
              submit.mutate();
            }}
          >
            <Input
              className="rounded-none"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              required
              data-testid="input-store-order-name"
            />
            <Input
              className="rounded-none"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="WhatsApp / mobile number"
              inputMode="tel"
              required
              data-testid="input-store-order-phone"
            />
            <Input
              className="rounded-none"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Address 1"
              required
              data-testid="input-store-order-address"
            />
            <Input
              className="rounded-none"
              value={addressLine2}
              onChange={(event) => setAddressLine2(event.target.value)}
              placeholder="Address 2 (optional)"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                className="rounded-none"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="City"
              />
              <Input
                className="rounded-none"
                value={state}
                onChange={(event) => setState(event.target.value)}
                placeholder="State"
              />
              <Input
                className="rounded-none"
                value={pincode}
                onChange={(event) => setPincode(event.target.value)}
                placeholder="Pincode"
              />
            </div>
            <Input
              className="rounded-none"
              value={orderNote}
              onChange={(event) => setOrderNote(event.target.value)}
              placeholder="What did you order? (optional)"
              data-testid="input-store-order-item"
            />
            {submit.isError ? (
              <p className="text-sm text-red-600">
                {submit.error instanceof Error ? submit.error.message : "Could not save details"}
              </p>
            ) : null}
            <Button
              type="submit"
              className="w-full rounded-none bg-[#FF4907] hover:bg-[#e03d00]"
              disabled={submit.isPending || store.isError || !storeId}
              data-testid="button-submit-store-order"
            >
              {submit.isPending ? "Sending…" : "Send delivery details"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
