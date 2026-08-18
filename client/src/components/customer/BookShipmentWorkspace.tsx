import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Globe2, Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  BookShipmentMap,
  searchAddresses,
  reverseGeocodePoint,
  type ActivePin,
  type AddressScope,
  type ShipmentMapPoint,
} from "@/components/customer/BookShipmentMap";

export type { ActivePin, AddressScope, ShipmentMapPoint };

export type BookFlowStep = "pickup" | "destination" | "details" | "package" | "review";

const STEPS: { id: BookFlowStep; label: string }[] = [
  { id: "pickup", label: "Pickup" },
  { id: "destination", label: "Drop" },
  { id: "details", label: "Details" },
  { id: "package", label: "Package" },
  { id: "review", label: "Confirm" },
];

type BookShipmentWorkspaceProps = {
  step: BookFlowStep;
  onStepChange: (step: BookFlowStep) => void;
  scope: AddressScope;
  onScopeChange: (scope: AddressScope) => void;
  pickup: ShipmentMapPoint | null;
  destination: ShipmentMapPoint | null;
  onPickupChange: (point: ShipmentMapPoint) => void;
  onDestinationChange: (point: ShipmentMapPoint) => void;
  children: React.ReactNode;
  onContinue?: () => void | Promise<void>;
  onBack?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  showSubmit?: boolean;
  submitLabel?: string;
  onConfirm?: () => void | Promise<void>;
  confirmDisabled?: boolean;
  isSubmitting?: boolean;
  title?: string;
};

function shortLabel(point: ShipmentMapPoint | null, fallback: string) {
  if (!point) return fallback;
  return point.city || point.label.split(",")[0] || fallback;
}

export function BookShipmentWorkspace({
  step,
  onStepChange,
  scope,
  onScopeChange,
  pickup,
  destination,
  onPickupChange,
  onDestinationChange,
  children,
  onContinue,
  onBack,
  continueLabel = "Continue",
  continueDisabled,
  showSubmit,
  submitLabel = "Confirm booking",
  onConfirm,
  confirmDisabled,
  isSubmitting,
  title = "Book a shipment",
}: BookShipmentWorkspaceProps) {
  const activePin: ActivePin = step === "destination" ? "destination" : "pickup";
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ShipmentMapPoint[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mapStep = step === "pickup" || step === "destination";
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  useEffect(() => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  }, [step, scope]);

  useEffect(() => {
    if (!mapStep) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchAddresses(q, scope);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, scope, mapStep]);

  const applyPoint = (point: ShipmentMapPoint) => {
    if (activePin === "pickup") onPickupChange(point);
    else onDestinationChange(point);
    setQuery(point.label);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  async function detectCurrentLocation() {
    if (!navigator.geolocation) return;
    setIsDetecting(true);
    onStepChange("pickup");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const point = await reverseGeocodePoint(pos.coords.latitude, pos.coords.longitude);
          onPickupChange(point);
          setQuery(point.label);
        } finally {
          setIsDetecting(false);
        }
      },
      () => setIsDetecting(false),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  const activePoint = activePin === "pickup" ? pickup : destination;

  return (
    <div
      className="flex h-full max-h-full min-h-0 w-full flex-col overflow-hidden bg-[#F9FAFB] lg:flex-row"
      data-testid="book-shipment-workspace"
    >
      <aside className="flex max-h-[52vh] min-h-0 w-full shrink-0 flex-col overflow-hidden border-b border-zinc-200 bg-white lg:max-h-none lg:h-full lg:w-[400px] lg:border-b-0 lg:border-r">
        <div className="shrink-0 space-y-3 border-b border-zinc-100 px-4 pb-3 pt-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900" data-testid="text-booking-title">
              {title}
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Step {stepIndex + 1} of {STEPS.length} — {STEPS[stepIndex]?.label}
            </p>
          </div>

          {/* Step progress */}
          <ol
            className={cn("grid gap-1.5", STEPS.length <= 4 ? "grid-cols-4" : "grid-cols-5")}
            aria-label="Booking steps"
          >
            {STEPS.map((s, i) => {
              const done = i < stepIndex;
              const active = s.id === step;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (i <= stepIndex) onStepChange(s.id);
                    }}
                    className={cn(
                      "w-full rounded-lg px-1 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide transition-colors",
                      active && "bg-[#FF4907] text-white",
                      done && !active && "bg-[#FF4907]/15 text-[#FF4907]",
                      !done && !active && "bg-zinc-100 text-zinc-400",
                    )}
                    data-testid={`book-step-${s.id}`}
                  >
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ol>

          {mapStep && (
            <>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1" role="tablist">
                <button
                  type="button"
                  onClick={() => onScopeChange("domestic")}
                  data-testid="scope-domestic"
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold",
                    scope === "domestic" ? "bg-white text-[#FF4907] shadow-sm" : "text-zinc-500",
                  )}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Domestic
                </button>
                <button
                  type="button"
                  onClick={() => onScopeChange("international")}
                  data-testid="scope-international"
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold",
                    scope === "international" ? "bg-white text-[#FF4907] shadow-sm" : "text-zinc-500",
                  )}
                >
                  <Globe2 className="h-3.5 w-3.5" />
                  International
                </button>
              </div>

              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      placeholder={
                        step === "pickup"
                          ? "Search pickup address…"
                          : scope === "international"
                            ? "Search destination worldwide…"
                            : "Search destination…"
                      }
                      className="h-11 rounded-xl border-zinc-200 bg-zinc-50 pl-9"
                      data-testid="input-map-address-search"
                      autoComplete="off"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />
                    )}
                  </div>
                  {step === "pickup" && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 shrink-0 rounded-xl"
                      onClick={detectCurrentLocation}
                      disabled={isDetecting}
                      data-testid="button-detect-pickup"
                    >
                      {isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                    {suggestions.map((s, i) => (
                      <li key={`${s.lat}-${s.lng}-${i}`}>
                        <button
                          type="button"
                          className="w-full px-3 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                          onClick={() => applyPoint(s)}
                        >
                          <span className="line-clamp-2">{s.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {activePoint ? (
                <div
                  className={cn(
                    "rounded-xl px-3 py-2 text-xs",
                    step === "pickup" ? "bg-[#FF4907]/5 text-zinc-700" : "bg-green-50 text-zinc-700",
                  )}
                >
                  <p className="font-semibold text-zinc-900">
                    {step === "pickup" ? "Pickup set" : "Destination set"}
                  </p>
                  <p className="mt-0.5 line-clamp-2">{activePoint.label}</p>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Confirm details below, or drag the pin to adjust
                  </p>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  {step === "pickup"
                    ? "Search or tap the map to set pickup."
                    : "Search or tap the map to set destination."}
                </p>
              )}
            </>
          )}

          {!mapStep && (
            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF4907]" />
              <span className="min-w-0 truncate font-medium text-zinc-800">{shortLabel(pickup, "Pickup")}</span>
              <span className="text-zinc-300">→</span>
              <span className="min-w-0 truncate font-medium text-zinc-800">
                {shortLabel(destination, "Destination")}
              </span>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>

        <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-3">
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                className="h-11 shrink-0 rounded-xl"
                onClick={onBack}
                data-testid="button-booking-back"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {showSubmit ? (
              <Button
                type="button"
                className="h-11 flex-1 rounded-xl bg-[#FF4907] font-semibold text-white hover:bg-[#e03d00]"
                disabled={isSubmitting || continueDisabled || confirmDisabled}
                onClick={() => void onConfirm?.()}
                data-testid="button-submit-booking"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {submitLabel}
              </Button>
            ) : (
              <Button
                type="button"
                className="h-11 flex-1 rounded-xl bg-[#FF4907] font-semibold text-white hover:bg-[#e03d00]"
                onClick={() => void onContinue?.()}
                disabled={continueDisabled}
                data-testid="button-booking-continue"
              >
                {continueLabel}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <BookShipmentMap
          scope={scope}
          activePin={mapStep ? activePin : pickup && destination ? "destination" : "pickup"}
          pickup={pickup}
          destination={destination}
          onPickupChange={onPickupChange}
          onDestinationChange={onDestinationChange}
          className="absolute inset-0 h-full w-full rounded-none border-0"
        />
        <div className="pointer-events-none absolute left-3 top-3 z-[500] flex gap-2">
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#FF4907]" /> Pickup
          </span>
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-600" /> Destination
          </span>
        </div>
      </div>
    </div>
  );
}
