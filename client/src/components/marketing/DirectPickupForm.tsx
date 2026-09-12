import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Loader2, LocateFixed, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { reverseGeocodePoint } from "@/components/customer/BookShipmentMap";
import { trackMetaLead } from "@/lib/meta-pixel";
import { resolvePublicBookingOffice } from "@/lib/booking-office";
import { cn } from "@/lib/utils";

const ORANGE = "#FF4907";

const fieldClass = cn(
  "h-11 rounded-none border border-zinc-200 bg-[#f5f3f2] text-zinc-900 shadow-none",
  "placeholder:text-zinc-400",
  "focus-visible:ring-2 focus-visible:ring-[#FF4907]/35 focus-visible:border-[#FF4907]/40 focus-visible:bg-[#faf8f7]",
);

const areaClass = cn(
  fieldClass,
  "min-h-[4.5rem] h-auto resize-none py-2.5",
);

const SUGGESTED_ITEMS = [
  "Documents",
  "Clothes",
  "Electronics",
  "Gifts",
  "Books",
  "Medicines",
];

export type DirectPickupDefaults = {
  destinationLocation?: string;
  destinationCountry?: string;
  shipmentType?: "domestic" | "international";
};

type DirectPickupFormProps = {
  id?: string;
  className?: string;
  compact?: boolean;
  title?: string;
  defaults?: DirectPickupDefaults;
  analyticsCategory?: string;
};

export function DirectPickupForm({
  id = "book-pickup",
  className,
  compact = false,
  title = "Book Shipment",
  defaults,
  analyticsCategory = "direct-pickup",
}: DirectPickupFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [destinationLocation, setDestinationLocation] = useState(defaults?.destinationLocation || "");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [itemDraft, setItemDraft] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    requestNumber: string;
    accountCreated?: boolean;
  } | null>(null);

  const shipmentType = defaults?.shipmentType || "domestic";

  const canAddItem = useMemo(() => {
    const next = itemDraft.trim();
    return next.length > 0 && !items.some((item) => item.toLowerCase() === next.toLowerCase());
  }, [itemDraft, items]);

  function geoErrorMessage(code?: number) {
    if (code === 1) return "Allow location access to fill pickup from GPS.";
    if (code === 2) return "Could not read your current location. Try again or type the address.";
    if (code === 3) return "Location request timed out. Try again or type the address.";
    return "Could not read your current location. Try again or type the address.";
  }

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("GPS is not available on this device. Type the pickup address instead.");
      return;
    }
    setError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const point = await reverseGeocodePoint(latitude, longitude);
          setPickupCoords({ lat: latitude, lng: longitude });
          setPickupLocation(point.label);
        } catch {
          setPickupCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
          setPickupLocation(
            `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`,
          );
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setError(geoErrorMessage(err.code));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  function addItem(value: string) {
    const next = value.trim();
    if (!next) return;
    if (items.some((item) => item.toLowerCase() === next.toLowerCase())) {
      setItemDraft("");
      return;
    }
    if (items.length >= 12) return;
    setItems((current) => [...current, next]);
    setItemDraft("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const senderName = name.trim();
    const senderPhone = phone.replace(/\D/g, "");
    const pickup = pickupLocation.trim();
    const destination = destinationLocation.trim();
    const estimatedWeight = weight.trim();
    const packageItems = items.length > 0 ? items : itemDraft.trim() ? [itemDraft.trim()] : [];

    if (!senderName) return setError("Enter your name.");
    if (senderPhone.length < 10) return setError("Enter a valid 10-digit mobile number.");
    if (!pickup) return setError("Enter the pickup location.");
    if (!destination) return setError("Enter the destination location.");
    if (!estimatedWeight || !(Number.parseFloat(estimatedWeight) > 0)) {
      return setError("Enter the estimated package weight.");
    }
    if (packageItems.length === 0) return setError("Add at least one item in the package.");

    setSubmitting(true);
    try {
      const office = await resolvePublicBookingOffice();
      const res = await fetch(`/api/public/office/${encodeURIComponent(office.slug)}/booking-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName,
          senderPhone,
          senderEmail: email.trim(),
          senderAddress: pickup,
          receiverAddress: destination,
          weight: estimatedWeight,
          packageLength: length.trim() || undefined,
          packageWidth: width.trim() || undefined,
          packageHeight: height.trim() || undefined,
          packageItems,
          contentDescription: packageItems.join(", "),
          shipmentType,
          destinationCountry: defaults?.destinationCountry,
          pickupLocationName: pickup,
          pickupLat: pickupCoords?.lat?.toString(),
          pickupLng: pickupCoords?.lng?.toString(),
          notes: [
            "Direct pickup request",
            length || width || height
              ? `Dimensions: ${[length, width, height].filter(Boolean).join(" × ")} cm`
              : "",
          ]
            .filter(Boolean)
            .join(". "),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const firstError = Array.isArray(data.errors) ? data.errors[0]?.message : "";
        throw new Error(firstError || data.message || "Could not submit your pickup request.");
      }
      setResult({
        requestNumber: data.requestNumber,
        accountCreated: Boolean(data.accountCreated),
      });
      trackMetaLead({ content_category: analyticsCategory });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your pickup request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div
        id={id}
        className={cn(
          "rounded-md border border-zinc-200 bg-white p-5 text-zinc-900 shadow-2xl [color-scheme:light] sm:p-6",
          className,
        )}
      >
        <CheckCircle2 className="h-8 w-8" style={{ color: ORANGE }} />
        <h3 className="mt-3 text-xl font-bold tracking-tight">Pickup request received</h3>
        <p className="mt-2 font-mono text-lg font-semibold" style={{ color: ORANGE }}>
          {result.requestNumber}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          {result.accountCreated
            ? "Your XGoo Go account is ready. Sign in with this mobile number and OTP to track the request."
            : "Sign in with this mobile number and OTP to open your XGoo Go account and track the request."}
        </p>
        <Button asChild className="mt-5 h-11 w-full border-0 text-white" style={{ background: ORANGE }}>
          <Link href="/book?mode=login&account=go">Sign in to XGoo Go</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className={cn(
        "rounded-md border border-zinc-200 bg-white p-5 text-zinc-900 shadow-2xl [color-scheme:light] sm:p-6",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: ORANGE }}>
        Book a pickup
      </p>
      <h3 className={cn("mt-1 font-bold tracking-tight text-zinc-900", compact ? "text-lg" : "text-xl")}>
        {title}
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        We create your individual account automatically. Sign in later with your mobile number and OTP.
      </p>

      <div className="mt-4 grid gap-3">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name *"
          autoComplete="name"
          className={fieldClass}
          data-testid="input-pickup-name"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Mobile number *"
            autoComplete="tel"
            inputMode="tel"
            className={fieldClass}
            data-testid="input-pickup-phone"
          />
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email (optional)"
            type="email"
            autoComplete="email"
            className={fieldClass}
          />
        </div>
        <div>
          <Textarea
            value={pickupLocation}
            onChange={(event) => {
              setPickupLocation(event.target.value);
              if (!event.target.value.trim()) setPickupCoords(null);
            }}
            placeholder="Pickup location *"
            rows={2}
            className={areaClass}
            data-testid="input-pickup-location"
          />
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 border border-zinc-200 bg-[#f5f3f2] text-sm font-semibold text-zinc-700 hover:bg-[#faf8f7] hover:text-zinc-900 disabled:opacity-60"
            data-testid="button-pickup-gps"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" style={{ color: ORANGE }} />}
            {locating ? "Finding your location…" : "Use current location"}
          </button>
        </div>
        <Textarea
          value={destinationLocation}
          onChange={(event) => setDestinationLocation(event.target.value)}
          placeholder="Destination location *"
          rows={2}
          className={areaClass}
          data-testid="input-pickup-destination"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Input
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            placeholder="Weight kg *"
            inputMode="decimal"
            className={fieldClass}
            data-testid="input-pickup-weight"
          />
          <Input
            value={length}
            onChange={(event) => setLength(event.target.value)}
            placeholder="L cm"
            inputMode="decimal"
            className={fieldClass}
          />
          <Input
            value={width}
            onChange={(event) => setWidth(event.target.value)}
            placeholder="W cm"
            inputMode="decimal"
            className={fieldClass}
          />
          <Input
            value={height}
            onChange={(event) => setHeight(event.target.value)}
            placeholder="H cm"
            inputMode="decimal"
            className={fieldClass}
          />
        </div>
        <div>
          <div className="flex gap-2">
            <Input
              value={itemDraft}
              onChange={(event) => setItemDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addItem(itemDraft);
                }
              }}
              placeholder="Items in package *"
              className={fieldClass}
              data-testid="input-pickup-item"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-none border-zinc-200 bg-[#f5f3f2] px-3 text-zinc-700 hover:bg-[#faf8f7] hover:text-zinc-900"
              onClick={() => addItem(itemDraft)}
              disabled={!canAddItem}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {items.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setItems((current) => current.filter((entry) => entry !== item))}
                className="inline-flex items-center gap-1 rounded-full bg-[#FF4907]/10 px-2.5 py-1 text-xs font-semibold text-[#FF4907]"
              >
                {item}
                <X className="h-3 w-3" />
              </button>
            ))}
            {SUGGESTED_ITEMS.filter(
              (item) => !items.some((entry) => entry.toLowerCase() === item.toLowerCase()),
            ).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => addItem(item)}
                className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-500 hover:border-[#FF4907]/40 hover:text-[#FF4907]"
              >
                + {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <Button
        type="submit"
        disabled={submitting}
        className="mt-4 h-11 w-full border-0 font-semibold text-white"
        style={{ background: ORANGE }}
        data-testid="button-book-pickup"
      >
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Book Pickup
      </Button>
    </form>
  );
}
