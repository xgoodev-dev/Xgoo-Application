import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, X } from "lucide-react";
import { PublicTrackingSearch } from "@/components/customer/PublicTrackingSearch";
import { cn } from "@/lib/utils";

const ORANGE = "#FF4907";

type TrackingSidebarProps = {
  open: boolean;
  collapsed: boolean;
  onOpenChange: (open: boolean) => void;
  onCollapsedChange: (collapsed: boolean) => void;
};

export function TrackingSidebar({
  open,
  collapsed,
  onOpenChange,
  onCollapsedChange,
}: TrackingSidebarProps) {
  const expanded = open && !collapsed;

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded, onOpenChange]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70]" data-testid="tracking-sidebar">
      {expanded ? (
        <button
          type="button"
          aria-label="Collapse tracking panel"
          className="pointer-events-auto absolute inset-0 bg-black/35"
          onClick={() => onCollapsedChange(true)}
        />
      ) : null}

      <aside
        id="tracking-sidebar-panel"
        hidden={collapsed}
        className={cn(
          "pointer-events-auto absolute inset-y-0 right-0 flex w-full max-w-[26rem] flex-col border-l border-zinc-100 bg-white shadow-2xl [color-scheme:light]",
          collapsed && "invisible pointer-events-none",
        )}
        role="dialog"
        aria-modal={!collapsed}
        aria-labelledby="tracking-sidebar-title"
      >
          <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: ORANGE }}>
                Live tracking
              </p>
              <h2 id="tracking-sidebar-title" className="mt-1 text-lg font-bold tracking-tight text-zinc-900">
                Track your shipment
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Enter a request number, booking number, or AWB. No login required.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onCollapsedChange(true)}
                className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Collapse tracking panel"
                data-testid="button-collapse-tracking"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Close tracking panel"
                data-testid="button-close-tracking"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <PublicTrackingSearch variant="panel" id="header-track-parcel" />
        </div>
      </aside>
    </div>,
    document.body,
  );
}
