import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { XGOO_BRAND_FOUNDATION } from "@/components/marketing/brand-foundation";
import {
  SERVICE_COVERAGE_COPY,
  type ServiceCoverageResult,
} from "@shared/service-coverage";

export function ComingSoonCoverage({
  coverage,
  isBusiness,
  onSaveLocation,
  saving,
  onTrack,
  onHelp,
}: {
  coverage: ServiceCoverageResult | undefined;
  isBusiness?: boolean;
  onSaveLocation: (pincode: string) => void;
  saving?: boolean;
  onTrack: () => void;
  onHelp: () => void;
}) {
  const [pincode, setPincode] = useState("");
  const product = isBusiness ? XGOO_MODULES.pro.name : XGOO_MODULES.go.name;

  return (
    <div
      className="flex h-full min-h-0 flex-col items-center overflow-y-auto px-5 py-8 text-center"
      data-testid="coming-soon-coverage"
    >
      <div className="mx-auto w-full max-w-md">
        <ExpandingSoonIllustration />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">
          {SERVICE_COVERAGE_COPY.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          {coverage?.reason === "missing_pickup"
            ? SERVICE_COVERAGE_COPY.missingPickup
            : SERVICE_COVERAGE_COPY.body}
        </p>
        {coverage?.configured && coverage.distanceKm != null ? (
          <p className="mt-2 text-xs text-zinc-500">
            Your pickup is about {coverage.distanceKm} km from {coverage.hubName || "our Hub"}.
            We currently serve {coverage.radiusKm} km around that Hub.
          </p>
        ) : null}
        <p className="mt-4 text-xs text-zinc-500">{XGOO_BRAND_FOUNDATION.mission.quote}</p>

        <form
          className="mt-6 space-y-3 text-left"
          onSubmit={(event) => {
            event.preventDefault();
            const pin = pincode.replace(/\D/g, "").slice(0, 6);
            if (pin.length !== 6) return;
            onSaveLocation(pin);
          }}
        >
          <label className="text-sm font-medium text-zinc-800" htmlFor="coverage-pincode">
            Pickup pincode
          </label>
          <Input
            id="coverage-pincode"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit pincode"
            value={pincode}
            onChange={(event) => setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            data-testid="input-coverage-pincode"
          />
          <Button
            type="submit"
            className="w-full bg-[#FF4907] text-white hover:bg-[#e03d00]"
            disabled={saving || pincode.replace(/\D/g, "").length !== 6}
            data-testid="button-check-coverage"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Check my location
          </Button>
        </form>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={onTrack} data-testid="button-coverage-track">
            <Search className="mr-2 h-4 w-4" />
            Track
          </Button>
          <Button type="button" variant="outline" onClick={onHelp} data-testid="button-coverage-help">
            Help
          </Button>
        </div>
        <p className="mt-6 text-xs text-zinc-400">
          {product} stays available for tracking and support while we expand.
        </p>
      </div>
    </div>
  );
}

function ExpandingSoonIllustration() {
  return (
    <svg
      viewBox="0 0 220 140"
      className="mx-auto h-36 w-full max-w-xs"
      role="img"
      aria-label="Map expanding around an XGoo Hub"
    >
      <rect width="220" height="140" rx="20" fill="#FFF4EF" />
      <circle cx="110" cy="78" r="48" fill="none" stroke="#FFD4C4" strokeWidth="2" />
      <circle cx="110" cy="78" r="32" fill="none" stroke="#FFB198" strokeWidth="2" />
      <circle cx="110" cy="78" r="16" fill="#FF4907" opacity="0.18" />
      <circle cx="110" cy="78" r="6" fill="#FF4907" />
      <path
        d="M110 52c-9 0-16 7.2-16 16.2 0 12.2 16 27.8 16 27.8s16-15.6 16-27.8C126 59.2 119 52 110 52z"
        fill="#18181B"
      />
      <circle cx="110" cy="68" r="5" fill="white" />
      <text x="110" y="28" textAnchor="middle" fill="#18181B" fontSize="12" fontWeight="700">
        XGoo Hub
      </text>
    </svg>
  );
}
