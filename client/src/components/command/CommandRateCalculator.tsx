import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowRight,
  Calculator,
  CircleHelp,
  Loader2,
  MapPin,
  Package,
  Plane,
  Search,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  RATE_CALCULATOR_COUNTRIES,
  isIndianPincode,
  rateCalculatorCountryName,
  type RateCalculatorQuoteCard,
  type RateCalculatorResponse,
} from "@shared/rate-calculator";
import type { Office } from "@shared/schema";
import type { CommandStoreSummary } from "@/components/command/CommandStoreOverview";
import { useStaffAccess } from "@/hooks/use-staff-access";

type GeoHit = {
  displayName: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
};

type PlaceValue = {
  query: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
};

const EMPTY_PLACE: PlaceValue = { query: "", pincode: "", city: "", state: "", country: "IN" };

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function serviceLabel(quote: RateCalculatorQuoteCard) {
  if (quote.laneLabel) return quote.laneLabel;
  switch (quote.serviceType) {
    case "surface":
      return "Surface shipping";
    case "air":
      return "Express / air";
    default: {
      const _exhaustive: never = quote.serviceType;
      return _exhaustive;
    }
  }
}

function sourceLabel(source: RateCalculatorQuoteCard["source"]) {
  switch (source) {
    case "api":
      return "Live API";
    case "tariff":
      return "Tariff";
    case "legacy":
      return "Estimate";
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}

function placeLabel(place: PlaceValue) {
  return [place.city, place.state, place.pincode].filter(Boolean).join(", ");
}

function PackageBox({
  length,
  width,
  height,
}: {
  length: string;
  width: string;
  height: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-3">
      <svg viewBox="0 0 88 72" className="h-16 w-20 shrink-0 text-zinc-400" aria-hidden>
        <polygon points="16,28 44,12 72,28 44,44" fill="#f4d7b0" stroke="#c4a574" strokeWidth="1.4" />
        <polygon points="16,28 44,44 44,64 16,48" fill="#e7c089" stroke="#c4a574" strokeWidth="1.4" />
        <polygon points="44,44 72,28 72,48 44,64" fill="#d4a56a" stroke="#c4a574" strokeWidth="1.4" />
      </svg>
      <div className="grid flex-1 grid-cols-3 gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">L (cm)</p>
          <p className="text-sm font-medium">{length || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">W (cm)</p>
          <p className="text-sm font-medium">{width || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">H (cm)</p>
          <p className="text-sm font-medium">{height || "—"}</p>
        </div>
      </div>
    </div>
  );
}

function LocationSearchField({
  id,
  label,
  placeholder,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: PlaceValue;
  onChange: (next: PlaceValue) => void;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState(value.query);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value.query.trim()), 280);
    return () => window.clearTimeout(handle);
  }, [value.query]);

  const digits = debounced.replace(/\D/g, "").slice(0, 6);
  const isPinQuery = isIndianPincode(digits) && /^\d{6}$/.test(debounced.replace(/\s/g, ""));
  const isPlaceQuery = /[a-zA-Z]/.test(debounced) && debounced.length >= 3;
  const shouldSearch = isPinQuery || isPlaceQuery;

  const { data: hits = [], isFetching } = useQuery<GeoHit[]>({
    queryKey: ["/api/geocode/search", debounced],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/geocode/search?q=${encodeURIComponent(debounced)}`);
      return res.json();
    },
    enabled: shouldSearch,
    staleTime: 60_000,
  });

  useEffect(() => {
    const hit = hits[0];
    if (!isPinQuery || !hit?.pincode) return;
    if (value.pincode === hit.pincode && value.city === (hit.city || value.city)) return;
    onChange({
      query: value.query,
      pincode: hit.pincode,
      city: hit.city || "",
      state: hit.state || "",
      country: "IN",
    });
  }, [hits, isPinQuery, onChange, value.city, value.pincode, value.query]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#FF4907]" />
        <Input
          id={id}
          value={value.query}
          placeholder={placeholder}
          className="pl-9"
          autoComplete="off"
          inputMode={/[a-zA-Z]/.test(value.query) ? "text" : "numeric"}
          maxLength={/[a-zA-Z]/.test(value.query) ? undefined : 6}
          data-testid={`input-rate-${id}`}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            const query = event.target.value;
            const nextDigits = query.replace(/\D/g, "").slice(0, 6);
            onChange({
              query,
              pincode: isIndianPincode(nextDigits) ? nextDigits : "",
              city: isIndianPincode(nextDigits) && nextDigits === value.pincode ? value.city : "",
              state: isIndianPincode(nextDigits) && nextDigits === value.pincode ? value.state : "",
              country: "IN",
            });
            setOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 180)}
        />
        {open && shouldSearch ? (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-md">
            {isFetching ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">Looking up pincode…</p>
            ) : hits.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                {isPinQuery ? `Pincode ${digits} accepted` : "No matching city or pincode"}
              </p>
            ) : (
              hits.map((hit) => (
                <button
                  type="button"
                  key={`${hit.pincode}-${hit.displayName}`}
                  className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange({
                      query: hit.pincode || value.query,
                      pincode: hit.pincode,
                      city: hit.city,
                      state: hit.state,
                      country: "IN",
                    });
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{hit.city || hit.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {[hit.state, hit.pincode].filter(Boolean).join(" · ")}
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
      {value.pincode ? (
        <p className="text-xs font-medium text-zinc-700">
          {placeLabel(value) || (isFetching ? "Looking up city…" : hint) || value.pincode}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function InternationalPostalField({
  country,
  value,
  onChange,
}: {
  country: string;
  value: PlaceValue;
  onChange: (next: PlaceValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState(value.query);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value.query.trim()), 280);
    return () => window.clearTimeout(handle);
  }, [value.query]);

  const shouldSearch = debounced.length >= 3;
  const isPostalQuery = /\d/.test(debounced);

  const { data: hits = [], isFetching } = useQuery<GeoHit[]>({
    queryKey: ["/api/geocode/search", country, debounced],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/geocode/search?q=${encodeURIComponent(debounced)}&country=${encodeURIComponent(country)}`,
      );
      return res.json();
    },
    enabled: shouldSearch && Boolean(country) && country !== "IN",
    staleTime: 60_000,
  });

  useEffect(() => {
    const hit = hits[0];
    if (!isPostalQuery || !hit) return;
    const samePlace =
      value.pincode === (hit.pincode || value.pincode) &&
      value.city === (hit.city || "") &&
      value.state === (hit.state || "");
    if (samePlace) return;
    onChange({
      query: value.query,
      pincode: hit.pincode || value.query.trim(),
      city: hit.city || "",
      state: hit.state || "",
      country,
    });
  }, [country, hits, isPostalQuery, onChange, value.city, value.pincode, value.query, value.state]);

  const place = placeLabel(value);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="dest-postal">Delivery postal / ZIP</Label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#FF4907]" />
        <Input
          id="dest-postal"
          value={value.query}
          placeholder="City or postal / ZIP code"
          className="pl-9"
          autoComplete="off"
          maxLength={16}
          data-testid="input-rate-dest-postal"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            const query = event.target.value;
            onChange({
              query,
              pincode: query.trim(),
              city: "",
              state: "",
              country,
            });
            setOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 180)}
        />
        {open && shouldSearch ? (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-md">
            {isFetching ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">Looking up postal code…</p>
            ) : hits.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No matching city for this postal code
              </p>
            ) : (
              hits.map((hit) => (
                <button
                  type="button"
                  key={`${hit.pincode}-${hit.displayName}`}
                  className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange({
                      query: hit.pincode || value.query,
                      pincode: hit.pincode || value.query.trim(),
                      city: hit.city,
                      state: hit.state,
                      country,
                    });
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{hit.city || hit.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {[hit.state, hit.pincode, rateCalculatorCountryName(country)].filter(Boolean).join(" · ")}
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
      {place ? (
        <p className="text-xs font-medium text-zinc-700">{place}</p>
      ) : value.query && isFetching ? (
        <p className="text-xs text-muted-foreground">Looking up city…</p>
      ) : value.query && shouldSearch && !isFetching && hits.length === 0 ? (
        <p className="text-xs text-destructive">Could not resolve this postal code</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          World First books to the country; city is filled from the postal code.
        </p>
      )}
    </div>
  );
}

function bookingHref(input: {
  quote: RateCalculatorQuoteCard;
  pickup: PlaceValue;
  delivery: PlaceValue;
  destCountry: string;
  lane: "domestic" | "international";
  length: string;
  width: string;
  height: string;
  volumetricKg: number;
}) {
  const params = new URLSearchParams({
    courierPartnerId: input.quote.courierPartnerId,
    partner: input.quote.courierPartnerId,
    senderPincode: input.pickup.pincode,
    senderCity: input.pickup.city,
    senderState: input.pickup.state,
    senderCountry: input.pickup.country || "India",
    weight: String(input.quote.actualWeight),
    serviceType: input.quote.serviceType,
    shipmentType: input.lane,
  });
  if (input.pickup.query) params.set("pickupLocationName", input.pickup.query);
  if (input.lane === "domestic") {
    params.set("receiverPincode", input.delivery.pincode);
    params.set("receiverCity", input.delivery.city);
    params.set("receiverState", input.delivery.state);
    params.set("receiverCountry", "India");
  } else {
    params.set("destinationCountry", rateCalculatorCountryName(input.destCountry));
    params.set("receiverCountry", rateCalculatorCountryName(input.destCountry));
    if (input.delivery.pincode) params.set("receiverPincode", input.delivery.pincode);
    if (input.delivery.city) params.set("receiverCity", input.delivery.city);
    if (input.delivery.state) params.set("receiverState", input.delivery.state);
  }
  if (input.length) params.set("length", input.length);
  if (input.width) params.set("width", input.width);
  if (input.height) params.set("height", input.height);
  if (input.volumetricKg > 0) params.set("volumetricWeight", String(input.volumetricKg.toFixed(2)));
  if (input.quote.partnerProduct) params.set("partnerProduct", input.quote.partnerProduct);
  if (input.quote.partnerVendor) params.set("partnerVendor", input.quote.partnerVendor);
  if (input.quote.partnerService) params.set("partnerService", input.quote.partnerService);
  return `/bookings/new?${params.toString()}`;
}

export function CommandRateCalculator() {
  const { isCommandWorkspace } = useStaffAccess();
  const [lane, setLane] = useState<"domestic" | "international">("domestic");
  const [pickup, setPickup] = useState<PlaceValue>(EMPTY_PLACE);
  const [delivery, setDelivery] = useState<PlaceValue>(EMPTY_PLACE);
  const [destCountry, setDestCountry] = useState("US");
  const [weight, setWeight] = useState("0.5");
  const [weightUnit, setWeightUnit] = useState<"gm" | "kg">("kg");
  const [volumetric, setVolumetric] = useState("");
  const [codAmount, setCodAmount] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [packageType, setPackageType] = useState<"package" | "document">("package");
  const [pickupStoreId, setPickupStoreId] = useState("office");
  const [showDimensions, setShowDimensions] = useState(true);

  const { data: office } = useQuery<Office>({ queryKey: ["/api/office"] });
  const { data: storeData } = useQuery<{ stores: CommandStoreSummary[] }>({
    queryKey: ["/api/command/stores"],
    enabled: isCommandWorkspace,
  });

  useEffect(() => {
    if (lane !== "international") return;
    setDelivery((prev) => {
      if (prev.country === destCountry) return prev;
      return {
        query: prev.query,
        pincode: prev.pincode,
        city: "",
        state: "",
        country: destCountry,
      };
    });
  }, [destCountry, lane]);

  useEffect(() => {
    if (!office?.pincode || pickup.pincode) return;
    setPickup({
      query: [office.city, office.state, office.pincode].filter(Boolean).join(", "),
      pincode: office.pincode,
      city: office.city || "",
      state: office.state || "",
      country: "IN",
    });
  }, [office, pickup.pincode]);

  const applyStorePickup = (storeId: string) => {
    setPickupStoreId(storeId);
    if (storeId === "office" && office?.pincode) {
      setPickup({
        query: [office.name, office.city, office.pincode].filter(Boolean).join(", "),
        pincode: office.pincode,
        city: office.city || "",
        state: office.state || "",
        country: "IN",
      });
      return;
    }
    const store = storeData?.stores.find((row) => row.id === storeId);
    if (store?.pincode) {
      setPickup({
        query: [store.name, store.city, store.pincode].filter(Boolean).join(", "),
        pincode: store.pincode,
        city: store.city || "",
        state: "",
        country: "IN",
      });
    }
  };

  const canCalculate =
    isIndianPincode(pickup.pincode) &&
    Number(weight) > 0 &&
    (lane === "domestic" ? isIndianPincode(delivery.pincode) : Boolean(destCountry && destCountry !== "IN"));

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/booking/rate-calculator", {
        shipmentType: lane,
        packageType,
        senderPincode: pickup.pincode,
        receiverPincode: lane === "domestic" ? delivery.pincode : delivery.pincode || undefined,
        originCountry: "IN",
        destinationCountry: lane === "domestic" ? "IN" : destCountry,
        weight: Number(weight),
        weightUnit,
        volumetricWeight: volumetric ? Number(volumetric) : undefined,
        length: length ? Number(length) : undefined,
        width: width ? Number(width) : undefined,
        height: height ? Number(height) : undefined,
        codAmount: codAmount ? Number(codAmount) : undefined,
      });
      return (await res.json()) as RateCalculatorResponse;
    },
  });

  useEffect(() => {
    if (!canCalculate) return;
    const handle = window.setTimeout(() => mutation.mutate(), 450);
    return () => window.clearTimeout(handle);
    // Recalculate when the core quote inputs change; mutate identity is stable enough here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canCalculate,
    lane,
    pickup.pincode,
    delivery.pincode,
    destCountry,
    weight,
    weightUnit,
    volumetric,
    length,
    width,
    height,
    packageType,
    codAmount,
  ]);

  const result = mutation.data;
  const quotes = result?.quotes ?? [];
  const dimVolumetric =
    Number(length) > 0 && Number(width) > 0 && Number(height) > 0
      ? (Number(length) * Number(width) * Number(height)) / 5000
      : 0;
  const enteredVolumetric = Number(volumetric) > 0 ? Number(volumetric) : 0;
  const volumetricKg = Math.max(dimVolumetric, enteredVolumetric);
  const actualKg =
    Number(weight) > 0 ? (weightUnit === "gm" ? Number(weight) / 1000 : Number(weight)) : 0;
  const chargeableKg = Math.max(actualKg, volumetricKg);

  const pickupHint = useMemo(() => {
    if (pickupStoreId === "office" && office?.name) return `${office.name} (autofilled from pickup)`;
    const store = storeData?.stores.find((row) => row.id === pickupStoreId);
    return store ? `${store.name} (autofilled from pickup)` : undefined;
  }, [office?.name, pickupStoreId, storeData?.stores]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rate estimator & serviceability</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter From and To, actual and volumetric weight, then pick a connected courier to book the movement.
          </p>
        </div>
        {isCommandWorkspace ? (
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/pricing">
              <CircleHelp className="h-3.5 w-3.5" />
              Tariff sheets
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Location details</CardTitle>
              <CardDescription>Calculate shipping charges between any two locations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCommandWorkspace && (storeData?.stores.length || 0) > 0 ? (
                <div className="space-y-1.5">
                  <Label>Pickup warehouse</Label>
                  <Select value={pickupStoreId} onValueChange={applyStorePickup}>
                    <SelectTrigger data-testid="select-rate-pickup-store">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">{office?.name || "Command office"}</SelectItem>
                      {(storeData?.stores || []).map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                          {store.pincode ? ` · ${store.pincode}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <LocationSearchField
                  id="pickup"
                  label="From pincode"
                  placeholder="Search city or 6-digit pincode"
                  value={pickup}
                  onChange={setPickup}
                  hint={pickupHint}
                />
                {lane === "domestic" ? (
                  <LocationSearchField
                    id="delivery"
                    label="To pincode"
                    placeholder="Search city or 6-digit pincode"
                    value={delivery}
                    onChange={setDelivery}
                  />
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="dest-country">Delivery country</Label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                      <Select value={destCountry} onValueChange={setDestCountry}>
                        <SelectTrigger id="dest-country" className="pl-9" data-testid="select-rate-dest-country">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RATE_CALCULATOR_COUNTRIES.filter((country) => country.code !== "IN").map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <InternationalPostalField
                      country={destCountry}
                      value={delivery}
                      onChange={setDelivery}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Package details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="rate-weight">Actual weight</Label>
                  <div className="flex gap-2">
                    <Input
                      id="rate-weight"
                      type="number"
                      min="0"
                      step={weightUnit === "gm" ? "1" : "0.1"}
                      value={weight}
                      onChange={(event) => setWeight(event.target.value)}
                      data-testid="input-rate-weight"
                    />
                    <Select value={weightUnit} onValueChange={(value) => setWeightUnit(value as "gm" | "kg")}>
                      <SelectTrigger className="w-[88px]" data-testid="select-rate-weight-unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gm">gm</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rate-volumetric">Volumetric weight (kg)</Label>
                  <Input
                    id="rate-volumetric"
                    type="number"
                    min="0"
                    step="0.01"
                    value={volumetric}
                    onChange={(event) => setVolumetric(event.target.value)}
                    placeholder="Or add L × W × H below"
                    data-testid="input-rate-volumetric"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="rate-cod">COD amount in ₹ (optional)</Label>
                  <Input
                    id="rate-cod"
                    type="number"
                    min="0"
                    value={codAmount}
                    onChange={(event) => setCodAmount(event.target.value)}
                    placeholder="₹"
                    data-testid="input-rate-cod"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-0 text-[#FF4907] hover:bg-transparent hover:text-[#e03d00]"
                  onClick={() => setShowDimensions((open) => !open)}
                >
                  {showDimensions ? "Hide package dimensions" : "+ Add package dimensions"}
                </Button>
                <Select value={packageType} onValueChange={(value) => setPackageType(value as "package" | "document")}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="package">Package</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showDimensions ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="L cm" value={length} onChange={(event) => setLength(event.target.value)} />
                    <Input placeholder="W cm" value={width} onChange={(event) => setWidth(event.target.value)} />
                    <Input placeholder="H cm" value={height} onChange={(event) => setHeight(event.target.value)} />
                  </div>
                  <PackageBox length={length} width={width} height={height} />
                  <p className="text-xs text-muted-foreground">
                    Volumetric = L × W × H / 5000
                    {dimVolumetric > 0 ? ` · ${dimVolumetric.toFixed(2)} kg` : ""}. Delhivery is quoted on the higher of
                    actual, volumetric, and billed kg, including these dimensions.
                  </p>
                </div>
              ) : null}

              <p className="text-xs text-muted-foreground">
                Actual {actualKg.toFixed(2)} kg · Volumetric {volumetricKg.toFixed(2)} kg · Chargeable{" "}
                {chargeableKg.toFixed(2)} kg
              </p>

              <Button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={!canCalculate || mutation.isPending}
                data-testid="button-rate-calculate"
              >
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="mr-2 h-4 w-4" />
                )}
                Calculate rates
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden bg-amber-50/40">
          <CardHeader className="border-b bg-white/70 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Courier comparison</CardTitle>
                <CardDescription>
                  {lane === "domestic"
                    ? "Live Delhivery pincode and rate API · World First is international only"
                    : `Live World First customer rate compare to ${rateCalculatorCountryName(destCountry)} · Delhivery is India only`}
                </CardDescription>
              </div>
              {result ? (
                <Badge variant="outline">{result.serviceableCount} serviceable</Badge>
              ) : null}
            </div>
            <Tabs
              value={lane}
              onValueChange={(value) => {
                setLane(value as "domestic" | "international");
                setDelivery(EMPTY_PLACE);
              }}
              className="pt-2"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="domestic" data-testid="tab-rate-domestic">
                  Domestic
                </TabsTrigger>
                <TabsTrigger value="international" data-testid="tab-rate-international">
                  International
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {!canCalculate ? (
              <p className="rounded-lg border border-dashed bg-white p-4 text-sm text-muted-foreground">
                {lane === "domestic"
                  ? "Enter pickup and destination pincodes plus weight to see partner rates and transit days."
                  : "Enter a pickup pincode, destination country, postal / ZIP code, and weight to compare international couriers."}
              </p>
            ) : mutation.isPending && !result ? (
              <div className="flex items-center gap-2 rounded-lg bg-white p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking serviceability and rates…
              </div>
            ) : mutation.isError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {mutation.error instanceof Error ? mutation.error.message : "Could not calculate rates"}
              </p>
            ) : quotes.length === 0 ? (
              <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">
                No live Delhivery or World First result for this lane.
              </p>
            ) : (
              quotes.map((quote) => {
                const bookHref = bookingHref({
                  quote,
                  pickup,
                  delivery,
                  destCountry,
                  lane,
                  length,
                  width,
                  height,
                  volumetricKg,
                });
                return (
                  <div
                    key={quote.quoteKey || `${quote.courierPartnerId}-${quote.serviceType}`}
                    className={cn(
                      "rounded-xl border bg-white p-4 shadow-sm",
                      quote.popular && quote.serviceable && "ring-1 ring-[#FF4907]/40",
                      !quote.serviceable && "opacity-70",
                    )}
                    data-testid={`card-rate-${quote.partnerCode}-${quote.serviceType}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {quote.serviceType === "air" ? (
                          <Plane className="h-4 w-4 text-zinc-700" />
                        ) : (
                          <Truck className="h-4 w-4 text-zinc-700" />
                        )}
                        <div>
                          <p className="text-sm font-semibold leading-tight">
                            {serviceLabel(quote)}
                          </p>
                          <p className="text-xs text-muted-foreground">{quote.partnerName}</p>
                        </div>
                      </div>
                      {quote.popular && quote.serviceable ? (
                        <Badge className="bg-[#FF4907] text-white hover:bg-[#e03d00]">Popular choice</Badge>
                      ) : (
                        <Badge variant={quote.source === "api" ? "default" : "outline"}>{sourceLabel(quote.source)}</Badge>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Delivery</p>
                        <p className="font-semibold">
                          {quote.transitDays != null ? `${quote.transitDays} day${quote.transitDays === 1 ? "" : "s"}` : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Starts from</p>
                        <p className={cn("font-semibold", !quote.serviceable && "text-destructive")}>
                          {quote.serviceable && quote.sellPrice > 0
                            ? money(quote.sellPrice)
                            : quote.serviceable
                              ? "At booking"
                              : "No Service"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Chargeable weight</p>
                        <p className="font-semibold">{quote.billedWeight.toFixed(2)} kg</p>
                      </div>
                    </div>

                    {quote.message ? (
                      <p className="mt-2 text-[11px] text-muted-foreground">{quote.message}</p>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between">
                      <p className={cn("text-[11px]", quote.serviceable ? "text-muted-foreground" : "font-medium text-destructive")}>
                        {quote.serviceable ? "Serviceable on this lane" : "No Service"}
                      </p>
                      {quote.serviceable ? (
                        <Link href={bookHref}>
                          <Button size="sm" className="h-8 gap-1 bg-zinc-900 text-white hover:bg-zinc-800">
                            Book with {quote.partnerName}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      ) : (
                        <Button size="sm" variant="outline" disabled className="h-8 text-destructive">
                          No Service
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {result ? (
              <p className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                Chargeable {result.chargeableWeight.toFixed(2)} kg · billed {result.billedWeight.toFixed(2)} kg
                {result.volumetricWeight > 0 ? ` · volumetric ${result.volumetricWeight.toFixed(2)} kg` : ""}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
