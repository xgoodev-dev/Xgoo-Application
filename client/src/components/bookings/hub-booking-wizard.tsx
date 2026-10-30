import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HubBookingFormData } from "./hub-booking-schema";

export const BOOKING_WIZARD_STEPS = [
  { id: "shipment", label: "Shipment", hint: "Type and destination" },
  { id: "shipper", label: "Shipper", hint: "Pickup from" },
  { id: "consignee", label: "Consignee", hint: "Deliver to" },
  { id: "package", label: "Package", hint: "Weight and size" },
  { id: "goods", label: "Goods", hint: "Items and HSN" },
  { id: "charge", label: "Charge", hint: "Service and pay" },
] as const;

export type BookingWizardStepId = (typeof BOOKING_WIZARD_STEPS)[number]["id"];

export const BOOKING_WIZARD_STEP_FIELDS: Record<BookingWizardStepId, (keyof HubBookingFormData)[]> = {
  shipment: ["shipmentType", "destinationCountry"],
  shipper: ["senderName", "senderPhone", "senderAddress"],
  consignee: ["receiverName", "receiverPhone", "receiverAddress"],
  package: ["weight"],
  goods: ["products"],
  charge: ["courierPartnerId", "serviceType", "paymentMode", "orderPaymentType", "collectableAmount"],
};

export function bookingWizardStepIndex(id: BookingWizardStepId): number {
  return BOOKING_WIZARD_STEPS.findIndex((step) => step.id === id);
}

export function BookingWizardStepper({
  current,
  onSelect,
}: {
  current: BookingWizardStepId;
  onSelect: (id: BookingWizardStepId) => void;
}) {
  const currentIndex = bookingWizardStepIndex(current);

  return (
    <nav aria-label="Booking steps" className="space-y-3">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {BOOKING_WIZARD_STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = step.id === current;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                data-testid={`button-booking-step-${step.id}`}
                className={cn(
                  "flex w-full items-center gap-2 border px-3 py-2 text-left transition-colors",
                  active && "border-[#FF4907] bg-[#FF4907]/10",
                  done && !active && "border-border bg-muted/40",
                  !done && !active && "border-border bg-background",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center text-xs font-semibold",
                    active && "bg-[#FF4907] text-white",
                    done && !active && "bg-foreground text-background",
                    !done && !active && "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className={cn("block truncate text-sm font-medium", active && "text-[#FF4907]")}>
                    {step.label}
                  </span>
                  <span className="hidden truncate text-xs text-muted-foreground sm:block">{step.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="h-1 w-full bg-muted">
        <div
          className="h-1 bg-[#FF4907] transition-all"
          style={{ width: `${((currentIndex + 1) / BOOKING_WIZARD_STEPS.length) * 100}%` }}
        />
      </div>
    </nav>
  );
}

export function BookingWizardFooter({
  current,
  submitting,
  submitLabel,
  submitPendingLabel,
  onBack,
  onNext,
  onCancel,
}: {
  current: BookingWizardStepId;
  submitting?: boolean;
  submitLabel: string;
  submitPendingLabel: string;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
}) {
  const index = bookingWizardStepIndex(current);
  const isFirst = index <= 0;
  const isLast = index >= BOOKING_WIZARD_STEPS.length - 1;

  return (
    <div className="sticky bottom-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 px-1 py-3 backdrop-blur">
      <Button type="button" variant="outline" onClick={isFirst ? onCancel : onBack} data-testid="button-wizard-back">
        {isFirst ? "Cancel" : "Back"}
      </Button>
      {isLast ? (
        <Button type="submit" disabled={submitting} data-testid="button-create-booking">
          {submitting ? submitPendingLabel : submitLabel}
        </Button>
      ) : (
        <Button type="button" onClick={onNext} data-testid="button-wizard-next">
          Continue
        </Button>
      )}
    </div>
  );
}
