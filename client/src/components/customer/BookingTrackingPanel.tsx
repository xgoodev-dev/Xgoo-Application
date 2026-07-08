import { CheckCircle2, Circle, MapPin, Navigation, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CustomerTrackingView } from "@shared/customer-tracking";

function formatTimestamp(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StepIcon({ state }: { state: "completed" | "current" | "upcoming" }) {
  if (state === "completed") {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <CheckCircle2 className="h-4 w-4" />
      </div>
    );
  }
  if (state === "current") {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary ring-4 ring-primary/15">
        <Navigation className="h-3.5 w-3.5" />
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30 bg-muted text-muted-foreground">
      <Circle className="h-3 w-3" />
    </div>
  );
}

export function BookingTrackingPanel({
  tracking,
  bookingNumber,
  awbNumber,
}: {
  tracking: CustomerTrackingView;
  bookingNumber?: string | null;
  awbNumber?: string | null;
}) {
  return (
    <div className="space-y-5" data-testid="booking-tracking-panel">
      {!tracking.isDelivered && !tracking.isRejected && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <MapPin className="h-4 w-4 shrink-0" />
            Current location
          </div>
          <p className="text-sm font-semibold" data-testid="text-current-location">
            {tracking.currentLocation}
          </p>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-current-status-detail">
            {tracking.currentStatusDetail}
          </p>
        </div>
      )}

      {tracking.isDelivered && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Delivered
          </div>
          <p className="text-sm font-semibold">{tracking.currentLocation}</p>
          <p className="mt-1 text-sm text-muted-foreground">{tracking.currentStatusDetail}</p>
        </div>
      )}

      {tracking.isRejected && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">Request not approved</p>
          <p className="mt-1 text-sm text-muted-foreground">{tracking.currentStatusDetail}</p>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Tracking timeline</p>
          <Badge variant="secondary" data-testid="badge-tracking-status">
            {tracking.overallStatusLabel}
          </Badge>
        </div>

        <div className="space-y-0">
          {tracking.steps.map((step, index) => (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StepIcon state={step.state} />
                {index < tracking.steps.length - 1 && (
                  <div
                    className={`my-1 w-px flex-1 min-h-[2rem] ${
                      step.state === "completed" ? "bg-primary/40" : "bg-border"
                    }`}
                  />
                )}
              </div>
              <div className={`pb-5 ${step.state === "upcoming" ? "opacity-60" : ""}`}>
                <p className={`text-sm font-medium ${step.state === "current" ? "text-primary" : ""}`}>
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                {step.location && (
                  <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{step.location}</span>
                  </p>
                )}
                {step.timestamp && (
                  <p className="mt-1 text-xs text-muted-foreground">{formatTimestamp(step.timestamp)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {(bookingNumber || awbNumber) && (
        <div className="rounded-md bg-muted p-3">
          {bookingNumber && (
            <>
              <p className="text-xs text-muted-foreground">Booking Number</p>
              <p className="font-mono font-bold" data-testid="text-tracking-booking-number">
                {bookingNumber}
              </p>
            </>
          )}
          {awbNumber && (
            <>
              <p className={`text-xs text-muted-foreground ${bookingNumber ? "mt-2" : ""}`}>AWB Number</p>
              <p className="font-mono font-bold">{awbNumber}</p>
            </>
          )}
        </div>
      )}

      {!bookingNumber && !awbNumber && !tracking.isDelivered && (
        <div className="flex items-start gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
          <Package className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Shipment booking and AWB numbers appear here once the office confirms your request.
        </div>
      )}
    </div>
  );
}
