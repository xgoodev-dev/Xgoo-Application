import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Phone,
  Plus,
  Search,
  Truck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BookingTrackingPanel } from "@/components/customer/BookingTrackingPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CustomerTrackingView } from "@shared/customer-tracking";

const ACCENT = "#FF4907";
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

export type LoadItem = {
  id: string;
  requestNumber: string;
  status: string;
  statusLabel: string;
  senderName: string;
  receiverName: string;
  fromLabel: string;
  toLabel: string;
  createdAt: string;
  progress: number;
  phone?: string;
};

export type LoadDetail = {
  requestNumber: string;
  statusLabel: string;
  senderName: string;
  senderPhone?: string;
  receiverName: string;
  receiverCity?: string;
  pickupLocationName?: string;
  tracking: CustomerTrackingView;
  bookingNumber?: string | null;
  awbNumber?: string | null;
  mapLat?: number | null;
  mapLng?: number | null;
};

export type TrackingLoadsWorkspaceProps = {
  loads: LoadItem[];
  isLoading?: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddLoad: () => void;
  detail: LoadDetail | null;
  detailLoading?: boolean;
  onCloseDetail?: () => void;
  searchPlaceholder?: string;
  addLabel?: string;
  emptyHint?: string;
  listLayout?: "cards" | "table";
};

type FilterKey = "all" | "in_transit" | "delivered" | "pending";

/** Maps backend shipment/request statuses onto list filter buckets. */
export function categorizeLoadStatus(status: string): FilterKey {
  const s = status.toLowerCase().replace(/-/g, "_");
  if (s === "delivered") return "delivered";
  if (
    s === "picked_up" ||
    s === "in_transit" ||
    s === "out_for_delivery" ||
    s === "converted"
  ) {
    return "in_transit";
  }
  // pending, approved, booked, rejected, and other early states
  return "pending";
}

export function loadProgressFromStatus(status: string): number {
  const s = status.toLowerCase().replace(/-/g, "_");
  switch (s) {
    case "rejected":
    case "cancelled":
    case "canceled":
      return 0;
    case "pending":
    case "submitted":
      return 10;
    case "reviewed":
      return 18;
    case "approved":
    case "booked":
      return 25;
    case "converted":
      return 40;
    case "picked_up":
    case "pickup":
      return 45;
    case "in_transit":
    case "intransit":
      return 70;
    case "out_for_delivery":
      return 85;
    case "delivered":
      return 100;
    default:
      return 15;
  }
}

function initialsFromName(name?: string) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function statusBadgeTone(status: string): { bg: string; text: string; label?: string } {
  const bucket = categorizeLoadStatus(status);
  if (bucket === "delivered") {
    return { bg: "bg-emerald-50 text-emerald-700", text: "text-emerald-700" };
  }
  if (bucket === "in_transit") {
    return { bg: "bg-sky-50 text-sky-700", text: "text-sky-700" };
  }
  return { bg: "bg-orange-50 text-[#C2410C]", text: "text-[#C2410C]" };
}

function ProgressRoute({
  progress,
  fromLabel,
  toLabel,
}: {
  progress: number;
  fromLabel: string;
  toLabel: string;
}) {
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <div className="mt-3">
      <div className="relative h-8 px-1">
        <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-zinc-200" />
        <div
          className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: ACCENT }}
        />
        <div className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-zinc-400 bg-white" />
        <div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-zinc-400 bg-white" />
        <div
          className="absolute top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-sm"
          style={{ left: `${pct}%`, backgroundColor: ACCENT }}
        >
          <Truck className="h-3 w-3" />
        </div>
      </div>
      <div className="mt-1 flex justify-between gap-2 text-[11px] text-zinc-500">
        <span className="truncate max-w-[45%]">{fromLabel || "Origin"}</span>
        <span className="truncate max-w-[45%] text-right">{toLabel || "Destination"}</span>
      </div>
    </div>
  );
}

function DetailMap({
  lat,
  lng,
  className,
}: {
  lat?: number | null;
  lng?: number | null;
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    let cancelled = false;

    const loadLeaflet = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapRef.current) return;

      const hasCoords =
        typeof lat === "number" &&
        typeof lng === "number" &&
        Number.isFinite(lat) &&
        Number.isFinite(lng);

      const center: [number, number] = hasCoords ? [lat!, lng!] : INDIA_CENTER;
      const zoom = hasCoords ? 13 : 5;

      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView(center, zoom);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      const defaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      if (hasCoords) {
        markerRef.current = L.marker(center, { icon: defaultIcon }).addTo(map);
      }

      leafletMapRef.current = map;
      // Leaflet needs a tick after container is laid out
      setTimeout(() => map.invalidateSize(), 80);
    };

    loadLeaflet();

    return () => {
      cancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const hasCoords =
      typeof lat === "number" &&
      typeof lng === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng);

    const update = async () => {
      const L = await import("leaflet");
      if (hasCoords) {
        map.setView([lat!, lng!], 13);
        if (markerRef.current) {
          markerRef.current.setLatLng([lat!, lng!]);
        } else {
          const defaultIcon = L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });
          markerRef.current = L.marker([lat!, lng!], { icon: defaultIcon }).addTo(map);
        }
      } else {
        map.setView(INDIA_CENTER, 5);
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
          markerRef.current = null;
        }
      }
      setTimeout(() => map.invalidateSize(), 80);
    };

    update();
  }, [lat, lng]);

  return <div ref={mapRef} className={cn("h-full w-full bg-zinc-100", className)} />;
}

function DetailCard({
  detail,
  detailLoading,
  onClose,
  compact,
}: {
  detail: LoadDetail | null;
  detailLoading?: boolean;
  onClose?: () => void;
  compact?: boolean;
}) {
  if (detailLoading && !detail) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-zinc-100 bg-white p-5 shadow-lg",
          compact ? "w-full" : "max-w-md",
        )}
      >
        <p className="text-sm text-zinc-500">Loading shipment details…</p>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div
      className={cn(
        "flex max-h-full flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-lg",
        compact ? "w-full" : "max-w-md w-full",
      )}
      data-testid="load-detail-card"
    >
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-zinc-900">
            #{detail.requestNumber}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">{detail.statusLabel}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close detail"
            data-testid="button-close-detail"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Tabs defaultValue="tracking" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-4 mt-3 grid h-9 w-auto grid-cols-2 rounded-xl bg-zinc-100 p-1">
          <TabsTrigger
            value="info"
            className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Load info
          </TabsTrigger>
          <TabsTrigger
            value="tracking"
            className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Tracking
          </TabsTrigger>
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <TabsContent value="info" className="mt-0 space-y-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                Sender
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900">{detail.senderName}</p>
              {detail.senderPhone && (
                <a
                  href={`tel:${detail.senderPhone.replace(/\s/g, "")}`}
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-[#FF4907]"
                >
                  <Phone className="h-3 w-3" />
                  {detail.senderPhone}
                </a>
              )}
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                Receiver
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900">{detail.receiverName}</p>
              {detail.receiverCity && (
                <p className="mt-0.5 text-xs text-zinc-500">{detail.receiverCity}</p>
              )}
            </div>
            {detail.pickupLocationName && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  Pickup
                </p>
                <p className="mt-1 text-sm text-zinc-800">{detail.pickupLocationName}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tracking" className="mt-0">
            <BookingTrackingPanel
              tracking={detail.tracking}
              bookingNumber={detail.bookingNumber}
              awbNumber={detail.awbNumber}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function LoadCard({
  load,
  selected,
  onSelect,
}: {
  load: LoadItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const tone = statusBadgeTone(load.status);
  const phone = load.phone;

  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`load-card-${load.id}`}
      className={cn(
        "w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition-all",
        selected
          ? "border-[#FF4907]/50 ring-2 ring-[#FF4907]/20"
          : "border-zinc-100 hover:border-zinc-200 hover:shadow",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-sm font-semibold text-zinc-900">
          #{load.requestNumber}
        </p>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
            tone.bg,
          )}
        >
          {load.statusLabel}
        </span>
      </div>

      <ProgressRoute
        progress={load.progress}
        fromLabel={load.fromLabel}
        toLabel={load.toLabel}
      />

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: ACCENT }}
          >
            {initialsFromName(load.senderName || load.receiverName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-zinc-800">
              {load.senderName}
              {load.receiverName ? ` → ${load.receiverName}` : ""}
            </p>
          </div>
        </div>
        {phone && (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            onClick={(e) => e.stopPropagation()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-[#FF4907]/10 hover:text-[#FF4907]"
            aria-label={`Call ${phone}`}
          >
            <Phone className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </button>
  );
}

export function TrackingLoadsWorkspace({
  loads,
  isLoading,
  selectedId,
  onSelect,
  onAddLoad,
  detail,
  detailLoading,
  onCloseDetail,
  searchPlaceholder = "Search request, name, or city…",
  addLabel = "Book shipment",
  emptyHint = "Book a shipment to see it here.",
  listLayout = "cards",
}: TrackingLoadsWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  useEffect(() => {
    if (selectedId) setMobileShowDetail(true);
  }, [selectedId]);

  const counts = useMemo(() => {
    const c = { all: loads.length, in_transit: 0, delivered: 0, pending: 0 };
    for (const load of loads) {
      const bucket = categorizeLoadStatus(load.status);
      c[bucket] += 1;
    }
    return c;
  }, [loads]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return loads.filter((load) => {
      if (filter !== "all" && categorizeLoadStatus(load.status) !== filter) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        load.requestNumber,
        load.senderName,
        load.receiverName,
        load.fromLabel,
        load.toLabel,
        load.statusLabel,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [loads, filter, query]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setMobileShowDetail(true);
  };

  const handleClose = () => {
    setMobileShowDetail(false);
    onCloseDetail?.();
  };

  const filters: { key: FilterKey; label: string; testId: string }[] = [
    { key: "all", label: "All", testId: "filter-all" },
    { key: "in_transit", label: "In-transit", testId: "filter-in-transit" },
    { key: "delivered", label: "Delivered", testId: "filter-delivered" },
    { key: "pending", label: "Pending", testId: "filter-pending" },
  ];

  const listPanel = (
    <div className={cn(
      "relative flex h-full w-full flex-col bg-[#F4F4F5] md:shrink-0 md:border-r md:border-zinc-200/80",
      listLayout === "table" ? "md:min-w-0 md:flex-1" : "md:w-[400px]",
    )}>
      <div className="shrink-0 space-y-3 px-4 pb-3 pt-5">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Tracking shipments
        </h1>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 rounded-xl border-zinc-200 bg-white pl-9 shadow-sm"
            data-testid="input-load-search"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                data-testid={f.testId}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-[#1A1A1A] text-white"
                    : "bg-white text-zinc-600 shadow-sm hover:bg-zinc-50",
                )}
              >
                {f.label}{" "}
                <span className={cn(active ? "text-zinc-300" : "text-zinc-400")}>
                  ({counts[f.key]})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl bg-white/80 shadow-sm"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-4 py-10 text-center">
            <Truck className="mx-auto h-8 w-8 text-zinc-300" />
            <p className="mt-3 text-sm font-medium text-zinc-700">No shipments found</p>
            <p className="mt-1 text-xs text-zinc-500">
              {query || filter !== "all"
                ? "Try a different search or filter."
                : emptyHint}
            </p>
          </div>
        ) : (
          listLayout === "table" ? (
            <div className="overflow-auto rounded-none border border-zinc-200 bg-white">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead className="sticky top-0 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <tr className="border-b border-zinc-200">
                    <th className="px-3 py-2.5 font-semibold">Booking</th>
                    <th className="px-3 py-2.5 font-semibold">From</th>
                    <th className="px-3 py-2.5 font-semibold">To</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((load) => (
                    <tr
                      key={load.id}
                      className={cn(
                        "cursor-pointer border-b border-zinc-100 hover:bg-[#FFF7F3]",
                        selectedId === load.id && "bg-[#FFF7F3]",
                      )}
                      onClick={() => handleSelect(load.id)}
                      data-testid={`load-card-${load.id}`}
                    >
                      <td className="px-3 py-2 font-mono font-semibold text-zinc-900">#{load.requestNumber}</td>
                      <td className="px-3 py-2 text-zinc-700">{load.senderName || load.fromLabel}</td>
                      <td className="px-3 py-2 text-zinc-600">{load.receiverName || load.toLabel}</td>
                      <td className="px-3 py-2 text-xs font-medium text-zinc-500">{load.statusLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
          <div className="space-y-3 py-1">
            {filtered.map((load) => (
              <LoadCard
                key={load.id}
                load={load}
                selected={selectedId === load.id}
                onSelect={() => handleSelect(load.id)}
              />
            ))}
          </div>
          )
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-zinc-200/80 bg-[#F4F4F5]/95 p-4 backdrop-blur-sm">
        <Button
          type="button"
          onClick={onAddLoad}
          data-testid="button-add-load"
          className="h-11 w-full rounded-xl bg-[#1A1A1A] text-sm font-semibold text-white hover:bg-zinc-800"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {addLabel}
        </Button>
      </div>
    </div>
  );

  const mapPanel = (
    <div className="relative hidden min-h-0 flex-1 md:block">
      <DetailMap lat={detail?.mapLat} lng={detail?.mapLng} className="absolute inset-0" />
      {selectedId && (
        <div className="pointer-events-none absolute inset-0 p-4 md:p-5">
          <div className="pointer-events-auto max-h-[calc(100%-1.5rem)] overflow-hidden">
            <DetailCard
              detail={detail}
              detailLoading={detailLoading}
              onClose={handleClose}
            />
          </div>
        </div>
      )}
      {!selectedId && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
          <p className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur">
            Select a shipment to view tracking on the map
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="flex h-full min-h-0 w-full overflow-hidden"
      data-testid="tracking-loads-workspace"
    >
      {/* Desktop: list + map */}
      <div className={cn("flex h-full min-h-0 w-full", mobileShowDetail && selectedId ? "hidden md:flex" : "flex")}>
        {listPanel}
        {mapPanel}
      </div>

      {/* Mobile: detail + map overlay */}
      {mobileShowDetail && selectedId && (
        <div className="flex h-full min-h-0 w-full flex-col md:hidden">
          <div className="flex shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-3 py-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleClose}
              aria-label="Back to list"
              data-testid="button-back-to-list"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <p className="truncate font-mono text-sm font-semibold text-zinc-900">
                #{detail?.requestNumber ?? "…"}
              </p>
              <p className="truncate text-xs text-zinc-500">
                {detail?.statusLabel ?? "Loading…"}
              </p>
            </div>
          </div>
          <div className="relative min-h-0 flex-1">
            <DetailMap lat={detail?.mapLat} lng={detail?.mapLng} className="absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 max-h-[55%] overflow-hidden p-3">
              <DetailCard
                detail={detail}
                detailLoading={detailLoading}
                onClose={handleClose}
                compact
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
