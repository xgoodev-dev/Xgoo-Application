import { LocateFixed, MapPin } from "lucide-react";
import { useCurrentLocation } from "@/hooks/use-current-location";
import { cn } from "@/lib/utils";

export function LocationChip({
  fallback,
  className,
  compact,
}: {
  fallback?: string | null;
  className?: string;
  compact?: boolean;
}) {
  const { label, locating, denied, live, refresh } = useCurrentLocation(fallback);
  const text = locating
    ? "Finding live location…"
    : label || (denied ? "Location off — tap to retry" : "Tap for live location");
  const action = locating ? "…" : live ? "Refresh" : "Live";

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={locating}
      title={live ? "Refresh live location" : "Fetch live location"}
      aria-label={live ? "Refresh live location" : "Fetch live location"}
      data-testid="header-current-location"
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 rounded-none border border-zinc-200 bg-white px-2.5 py-1.5 text-left text-zinc-600 transition-colors hover:border-[#FF4907] hover:text-zinc-900 disabled:cursor-wait disabled:opacity-80",
        compact ? "text-[11px]" : "text-xs",
        className,
      )}
    >
      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF4907]" />
      <span className="min-w-0 flex-1 truncate font-medium">{text}</span>
      <LocateFixed className={cn("h-3.5 w-3.5 shrink-0 text-[#FF4907]", locating && "animate-pulse")} />
      <span className="shrink-0 font-semibold text-[#FF4907]">{action}</span>
    </button>
  );
}
