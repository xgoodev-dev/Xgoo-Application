import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { TariffGridRow } from "./types";
import { calculatePricingBreakdown } from "@shared/tariff-pricing";

type Props = {
  row: TariffGridRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionLabel?: string;
};

export function TariffRowDrawer({ row, open, onOpenChange, versionLabel }: Props) {
  if (!row) return null;
  const pricing = calculatePricingBreakdown({
    tariffAmount: row.tariffAmount,
    fixedMargin: row.fixedMargin,
    percentageMargin: row.percentageMargin,
    affiliateMargin: row.affiliateMargin,
    offerDiscount: row.offerDiscount,
    fuelCharge: row.fuelCharge,
    handlingCharge: row.handlingCharge,
    insuranceCharge: row.insuranceCharge,
    remoteAreaCharge: row.remoteAreaCharge,
    gst: row.gst,
  });

  const detail = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-4 py-2 border-b border-border/60 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Rate details</SheetTitle>
          <SheetDescription>
            {row.courierPartner} · {row.weight} kg slab
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-1">
          {detail("Courier partner", row.courierPartner)}
          {detail("Origin", row.originCountry || "—")}
          {detail("Destination", row.destinationCountry || "—")}
          {detail("Service", row.service)}
          {detail("Shipment type", row.shipmentType || "domestic")}
          {detail("Weight (kg)", row.weightMax || row.weight)}
          {detail("Partner rate", `₹${parseFloat(row.tariffAmount || "0").toFixed(2)}`)}
          {detail("Fixed margin", `₹${parseFloat(row.fixedMargin || "0").toFixed(2)}`)}
          {detail("Percentage margin", `${parseFloat(row.percentageMargin || "0")}%`)}
          {detail("Affiliate margin", `₹${parseFloat(row.affiliateMargin || "0").toFixed(2)}`)}
          {detail("Offer discount", `₹${parseFloat(row.offerDiscount || "0").toFixed(2)}`)}
          {detail("Additional charges", `₹${pricing.additionalCharges.toFixed(2)}`)}
          {detail("Subtotal before GST", `₹${pricing.subtotalBeforeTax.toFixed(2)}`)}
          {detail(
            `GST (${pricing.gstPercent}%)`,
            `₹${pricing.gstAmount.toFixed(2)}`,
          )}
          {detail(
            "Final price",
            <span className="text-primary font-bold">₹{pricing.customerPrice.toFixed(2)}</span>,
          )}
          {detail("Transit days", row.transitDays ?? "—")}
          {detail("Insurance charge", `₹${parseFloat(row.insuranceCharge || "0").toFixed(2)}`)}
          {detail("Notes", row.notes || "—")}
          {detail(
            "Status",
            row.isActive === false ? (
              <Badge variant="secondary">Inactive</Badge>
            ) : (
              <Badge className="bg-green-600">Active</Badge>
            ),
          )}
          {detail("Version", versionLabel || "—")}
          {detail(
            "Last updated",
            row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "—",
          )}
          {detail("Updated by", row.updatedBy || "—")}
        </div>
      </SheetContent>
    </Sheet>
  );
}
