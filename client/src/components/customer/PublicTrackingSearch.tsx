import { useState } from "react";
import { Loader2, Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingTrackingPanel } from "@/components/customer/BookingTrackingPanel";
import { buildCustomerTracking, type CustomerTrackingView } from "@shared/customer-tracking";

type PublicTrackResult =
  | {
      kind: "shipment";
      bookingNumber: string;
      awbNumber?: string | null;
      status: string;
      senderCity?: string | null;
      receiverCity?: string | null;
      serviceType: string;
      weight: string;
      bookedAt: string;
      pickedUpAt?: string | null;
      deliveredAt?: string | null;
      tracking?: CustomerTrackingView;
    }
  | {
      kind: "booking_request";
      requestNumber: string;
      status: string;
      senderCity?: string | null;
      receiverCity?: string | null;
      createdAt: string;
      message?: string;
      tracking?: CustomerTrackingView;
    };

function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusColor(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "pending":
    case "booked":
      return "secondary";
    case "rejected":
      return "destructive";
    default:
      return "default";
  }
}

export function PublicTrackingSearch({
  variant = "default",
  officeSlug,
  id,
}: {
  variant?: "hero" | "default" | "panel";
  officeSlug?: string;
  id?: string;
}) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [result, setResult] = useState<PublicTrackResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTrack() {
    const query = trackingNumber.trim();
    if (!query) return;

    setIsSearching(true);
    setNotFound(false);
    setError(null);
    setResult(null);

    try {
      const url = officeSlug
        ? `/api/public/office/${encodeURIComponent(officeSlug)}/track/${encodeURIComponent(query)}`
        : `/api/public/track/${encodeURIComponent(query)}`;

      const res = await fetch(url);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.message || "Could not look up this number");
        return;
      }
      setResult((await res.json()) as PublicTrackResult);
    } catch {
      setError("Failed to track shipment. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  const isHero = variant === "hero";
  const isPanel = variant === "panel";
  const isLight = isHero || isPanel;

  return (
    <div className={isHero ? "w-full min-w-0 max-w-full" : "w-full min-w-0"} id={id ?? (isHero ? "track-parcel" : undefined)}>
      <div
        className={
          isHero
            ? "flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50/80 p-2 w-full min-w-0"
            : "flex gap-2 min-w-0"
        }
      >
        <div className="relative flex-1 min-w-0 w-full">
          <Search
            className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isLight ? "text-zinc-400" : "text-muted-foreground"}`}
          />
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter request #, booking #, or AWB"
            className={
              isLight
                ? "h-11 min-w-0 w-full border border-zinc-200 bg-[#f5f3f2] pl-9 text-zinc-900 shadow-none placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-[#FF4907]"
                : "pl-9 min-w-0 w-full"
            }
            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            data-testid="input-landing-tracking"
          />
        </div>
        <Button
          variant={isHero ? "outline" : "default"}
          onClick={handleTrack}
          disabled={isSearching || !trackingNumber.trim()}
          className={
            isPanel
              ? "h-11 shrink-0 border-0 bg-[#FF4907] px-5 font-semibold text-white hover:bg-[#e03d00] disabled:opacity-50"
              : isHero
                ? "h-11 px-6 w-full sm:w-auto sm:shrink-0 border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium disabled:opacity-50"
                : "shrink-0"
          }
          data-testid="button-landing-track"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Track
            </>
          )}
        </Button>
      </div>

      {isHero && (
        <p className="mt-2 text-xs text-gray-400">
          No login required — track with your request number (BR…), booking number, or AWB.
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-destructive" data-testid="text-track-error">
          {error}
        </p>
      )}

      {notFound && (
        <Card className={`mt-4 border-dashed ${isLight ? "border-zinc-200 bg-zinc-50 text-zinc-800" : ""}`}>
          <CardContent className="py-8 text-center">
            <Package className={`mx-auto mb-3 h-10 w-10 ${isLight ? "text-zinc-400" : "text-muted-foreground"}`} />
            <p className={`text-sm ${isLight ? "text-zinc-500" : "text-muted-foreground"}`} data-testid="text-track-not-found">
              No booking found with this number. Check the ID and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className={`mt-4 ${isLight ? "border-zinc-200 bg-white text-zinc-900" : ""}`}>
          <CardContent className="pt-6 space-y-4">
            {result.kind === "booking_request" && (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Request number</p>
                  <p className="font-mono font-bold">{result.requestNumber}</p>
                </div>
                <Badge variant={statusColor(result.tracking?.overallStatus ?? result.status)}>
                  {result.tracking?.overallStatusLabel ?? statusLabel(result.status)}
                </Badge>
              </div>
            )}

            {result.kind === "shipment" && (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-mono font-bold">{result.bookingNumber}</p>
                  {result.awbNumber && (
                    <p className="text-xs text-muted-foreground">AWB: {result.awbNumber}</p>
                  )}
                </div>
                <Badge variant={statusColor(result.tracking?.overallStatus ?? result.status)}>
                  {result.tracking?.overallStatusLabel ?? statusLabel(result.status)}
                </Badge>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className={isLight ? "text-zinc-500" : "text-muted-foreground"}>From</p>
                <p>{result.senderCity || "N/A"}</p>
              </div>
              <div>
                <p className={isLight ? "text-zinc-500" : "text-muted-foreground"}>To</p>
                <p>{result.receiverCity || "N/A"}</p>
              </div>
              {result.kind === "shipment" && (
                <>
                  <div>
                    <p className="text-muted-foreground">Service</p>
                    <p className="capitalize">{result.serviceType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Weight</p>
                    <p>{result.weight} kg</p>
                  </div>
                </>
              )}
            </div>

            <BookingTrackingPanel
              tracking={
                result.tracking ??
                (result.kind === "shipment"
                  ? buildCustomerTracking(
                      {
                        status: "converted",
                        createdAt: result.bookedAt,
                        senderCity: result.senderCity,
                        receiverCity: result.receiverCity,
                      },
                      {
                        status: result.status,
                        bookedAt: result.bookedAt,
                        pickedUpAt: result.pickedUpAt,
                        deliveredAt: result.deliveredAt,
                        senderCity: result.senderCity,
                        receiverCity: result.receiverCity,
                        bookingNumber: result.bookingNumber,
                        awbNumber: result.awbNumber,
                      },
                    )
                  : buildCustomerTracking(
                      {
                        status: result.status,
                        createdAt: result.createdAt,
                        senderCity: result.senderCity,
                        receiverCity: result.receiverCity,
                      },
                      null,
                    ))
              }
              bookingNumber={result.kind === "shipment" ? result.bookingNumber : undefined}
              awbNumber={result.kind === "shipment" ? result.awbNumber : undefined}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
