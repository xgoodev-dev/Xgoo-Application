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
}: {
  variant?: "hero" | "default";
  officeSlug?: string;
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

  return (
    <div className={isHero ? "w-full max-w-xl" : "w-full"} id="track-parcel">
      <div
        className={
          isHero
            ? "flex flex-col sm:flex-row gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm"
            : "flex gap-2"
        }
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter request #, booking #, or AWB"
            className={isHero ? "pl-9 border-0 shadow-none focus-visible:ring-0 h-11" : "pl-9"}
            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            data-testid="input-landing-tracking"
          />
        </div>
        <Button
          onClick={handleTrack}
          disabled={isSearching || !trackingNumber.trim()}
          className={isHero ? "h-11 px-6 text-white border-0 shrink-0" : "shrink-0"}
          style={isHero ? { background: "#FF4907" } : undefined}
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
        <Card className="mt-4 border-dashed">
          <CardContent className="py-8 text-center">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground" data-testid="text-track-not-found">
              No booking found with this number. Check the ID and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="mt-4">
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
                <p className="text-muted-foreground">From</p>
                <p>{result.senderCity || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">To</p>
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
