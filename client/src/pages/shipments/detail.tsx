import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Package,
  Printer,
  Receipt,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PartnerSyncPanel } from "@/components/shipments/PartnerSyncPanel";
import {
  PARTNER_SYNC_STATUS_LABELS,
  type PartnerSyncStatus,
} from "@shared/partner-sync";
import type { ShipmentWithRelations } from "@shared/schema";

const statusColors: Record<string, string> = {
  booked: "bg-amber-100 text-amber-700 dark:bg-zinc-800 dark:text-zinc-200",
  picked_up: "bg-blue-100 text-blue-700 dark:bg-zinc-800 dark:text-blue-400",
  in_transit: "bg-purple-100 text-purple-700 dark:bg-zinc-800 dark:text-purple-300",
  delivered: "bg-green-100 text-green-700 dark:bg-zinc-800 dark:text-green-400",
};

const statusLabels: Record<string, string> = {
  booked: "Booked",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
};

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function AddressBlock({
  title,
  name,
  phone,
  address,
  city,
  state,
  pincode,
}: {
  title: string;
  name: string;
  phone: string;
  address: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h4>
      <p className="font-medium">{name}</p>
      <p className="text-sm text-muted-foreground">{phone}</p>
      <p className="mt-1 text-sm">{address}</p>
      <p className="text-sm text-muted-foreground">
        {[city, state, pincode].filter(Boolean).join(", ") || "—"}
      </p>
    </div>
  );
}

export default function ShipmentDetailPage() {
  const params = useParams<{ id: string }>();

  const { data: shipment, isLoading, error } = useQuery<ShipmentWithRelations>({
    queryKey: ["/api/shipments", params.id],
    enabled: !!params.id,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/shipments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to shipments
          </Link>
        </Button>
        <p className="text-muted-foreground">Shipment not found.</p>
      </div>
    );
  }

  const syncStatus = (shipment.partnerSyncStatus ?? "pending") as PartnerSyncStatus;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 mb-1" asChild>
            <Link href="/shipments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Shipments
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-shipment-booking">
              {shipment.bookingNumber}
            </h1>
            <Badge variant="secondary" className={statusColors[shipment.status]}>
              {statusLabels[shipment.status]}
            </Badge>
            <Badge variant="outline">{PARTNER_SYNC_STATUS_LABELS[syncStatus]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {shipment.courierPartner?.name ?? "No partner"} ·{" "}
            {shipment.bookedAt
              ? format(new Date(shipment.bookedAt), "dd MMM yyyy, HH:mm")
              : "—"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/shipments/${shipment.id}/label`}>
              <Printer className="mr-2 h-4 w-4" />
              Label
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/shipments/${shipment.id}/bill`}>
              <FileText className="mr-2 h-4 w-4" />
              Bill
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/shipments/${shipment.id}/invoice`}>
              <Receipt className="mr-2 h-4 w-4" />
              Invoice
            </Link>
          </Button>
        </div>
      </div>

      <PartnerSyncPanel shipment={shipment} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Shipment details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Weight</span>
                <p className="font-medium">{shipment.weight} kg</p>
              </div>
              <div>
                <span className="text-muted-foreground">Service</span>
                <p className="font-medium capitalize">{shipment.serviceType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Pieces</span>
                <p className="font-medium">{shipment.numberOfPieces ?? 1}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total</span>
                <p className="font-medium">{formatCurrency(shipment.totalAmount)}</p>
              </div>
            </div>
            {shipment.contentDescription && (
              <div className="text-sm">
                <span className="text-muted-foreground">Contents</span>
                <p>{shipment.contentDescription}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Addresses</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <AddressBlock
              title="Sender"
              name={shipment.senderName}
              phone={shipment.senderPhone}
              address={shipment.senderAddress}
              city={shipment.senderCity}
              state={shipment.senderState}
              pincode={shipment.senderPincode}
            />
            <AddressBlock
              title="Receiver"
              name={shipment.receiverName}
              phone={shipment.receiverPhone}
              address={shipment.receiverAddress}
              city={shipment.receiverCity}
              state={shipment.receiverState}
              pincode={shipment.receiverPincode}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
