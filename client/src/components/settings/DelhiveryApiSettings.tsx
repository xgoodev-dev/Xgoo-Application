import { useQuery, useMutation } from "@tanstack/react-query";
import { Truck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CourierPartner } from "@shared/schema";
import { isDelhiveryPartner } from "@shared/delhivery";

type DelhiveryStatus = {
  configured: boolean;
  baseUrl: string | null;
  pickupLocation: string | null;
  clientName: string | null;
  skipPickup: boolean;
  environment: "production" | "staging" | string;
};

export function DelhiveryApiSettings() {
  const { toast } = useToast();
  const { data: status, isLoading } = useQuery<DelhiveryStatus>({
    queryKey: ["/api/integrations/delhivery/status"],
  });
  const { data: partners } = useQuery<CourierPartner[]>({
    queryKey: ["/api/partners"],
  });
  const delhiveryPartner = partners?.find((partner) => isDelhiveryPartner(partner.code, partner.name));

  const testMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const res = await apiRequest("POST", `/api/partners/${partnerId}/test-connection`);
      return res.json() as Promise<{ ok: boolean; message: string }>;
    },
    onSuccess: (result) => {
      toast({
        title: result.ok ? "Delhivery connected" : "Delhivery connection failed",
        description: result.message,
        variant: result.ok ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Could not test Delhivery", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5" />
              Delhivery booking API
            </CardTitle>
            <CardDescription>
              XGoo books Delhivery shipments with the REST API token from Delhivery One. The MCP JSON
              in that same screen is for Cursor only and cannot create bookings.
            </CardDescription>
          </div>
          {status ? (
            <Badge variant={status.configured ? "secondary" : "outline"}>
              {status.configured ? "Configured" : "Not configured"}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : status?.configured ? (
          <div className="flex gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-green-900 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Token and warehouse are in <code className="text-xs">.env</code> ({status.environment},
              pickup <span className="font-medium">{status.pickupLocation}</span>
              {status.clientName ? `, client ${status.clientName}` : ""}). That does not prove Delhivery
              answered — use Test Delhivery connection. New Booking with Delhivery selected books the AWB
              in the same step.
            </p>
          </div>
        ) : (
          <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Add the API token and registered warehouse name to <code className="text-xs">.env</code>,
              then restart <code className="text-xs">npm run dev</code>.
            </p>
          </div>
        )}

        <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
          <li>
            In Delhivery One open <strong>Settings → API and MCP Setup</strong> and copy the{" "}
            <strong>API token</strong> (View / Copy), not the MCP block. Generating a new token
            immediately invalidates the old one.
          </li>
          <li>
            Match the URL to that token: <strong>Request Live API Token</strong> uses{" "}
            <code className="text-xs">https://track.delhivery.com</code>. A staging/test token uses{" "}
            <code className="text-xs">https://staging-express.delhivery.com</code>. Mixing them
            returns 401.
          </li>
          <li>
            Copy the warehouse name from <strong>Pickup Locations</strong> exactly (case-sensitive).
            That is <code className="text-xs">DELHIVERY_PICKUP_LOCATION</code>. Client name is the
            registered Delhivery company name, not the admin person.
          </li>
          <li>
            Put these in server <code className="text-xs">.env</code>, then restart{" "}
            <code className="text-xs">npm run dev</code>:
          </li>
        </ol>
        <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
{`DELHIVERY_API_TOKEN=paste-api-token
DELHIVERY_PICKUP_LOCATION=YourWarehouseName
DELHIVERY_CLIENT_NAME=YourRegisteredCompanyName
DELHIVERY_SELLER_GST_TIN=YourGstin
DELHIVERY_HSN_CODE=999799
DELHIVERY_API_BASE_URL=https://track.delhivery.com
# Staging token only: https://staging-express.delhivery.com
# DELHIVERY_SKIP_PICKUP=true`}
        </pre>
        <p className="text-muted-foreground">
          On the Delhivery partner in Partners, set <strong>Booking method</strong> to API. Then Book
          shipment on the shipment page creates the AWB and requests pickup.
        </p>
        {delhiveryPartner ? (
          <Button
            type="button"
            variant="outline"
            disabled={testMutation.isPending}
            onClick={() => testMutation.mutate(delhiveryPartner.id)}
          >
            {testMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Truck className="mr-2 h-4 w-4" />
            )}
            Test Delhivery connection
          </Button>
        ) : (
          <p className="text-muted-foreground">
            Add a courier partner named Delhivery (code DEL) under Partners first.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
