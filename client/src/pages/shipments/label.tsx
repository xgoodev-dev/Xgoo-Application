import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { ParcelLabel } from "@/components/ParcelLabel";
import type { ShipmentWithRelations, Office } from "@shared/schema";

interface LabelData {
  shipment: ShipmentWithRelations;
  office: Office;
}

export default function ShipmentLabelPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<LabelData>({
    queryKey: ["/api/shipments", params.id, "label"],
    enabled: !!params.id,
  });

  const handleBack = () => {
    setLocation("/shipments");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back-loading">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex justify-center">
          <div className="w-[4in] h-[6in] border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-20 w-20 mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back-error">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load label</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Could not fetch shipment data"}
          </p>
          <Button onClick={handleBack} data-testid="button-return-shipments">
            Return to Shipments
          </Button>
        </div>
      </div>
    );
  }

  return <ParcelLabel shipment={data.shipment} office={data.office} onBack={handleBack} />;
}
