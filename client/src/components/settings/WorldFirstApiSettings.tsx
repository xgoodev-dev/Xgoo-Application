import { useQuery, useMutation } from "@tanstack/react-query";
import { Truck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CourierPartner } from "@shared/schema";
import { isWorldFirstPartner } from "@shared/world-first";
import { WorldFirstWalletBar } from "@/components/bookings/world-first-wallet-bar";

type WorldFirstStatus = {
  configured: boolean;
  baseUrl: string | null;
  hasProduct: boolean;
  hasVendor: boolean;
  hasService: boolean;
};

export function WorldFirstApiSettings() {
  const { toast } = useToast();
  const { data: status, isLoading } = useQuery<WorldFirstStatus>({
    queryKey: ["/api/integrations/world-first/status"],
  });
  const { data: partners } = useQuery<CourierPartner[]>({
    queryKey: ["/api/partners"],
  });
  const worldFirstPartner = partners?.find((partner) => isWorldFirstPartner(partner.code, partner.name));

  const testMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const res = await apiRequest("POST", `/api/partners/${partnerId}/test-connection`);
      return res.json() as Promise<{ ok: boolean; message: string }>;
    },
    onSuccess: (result) => {
      toast({
        title: result.ok ? "World First connected" : "World First connection failed",
        description: result.message,
        variant: result.ok ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Could not test World First", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5" />
              World First booking API
            </CardTitle>
            <CardDescription>
              XGoo books World First shipments with the Xpresion AWB, tracking, cancel, and print
              AWB APIs. Portal autofill is only a fallback if API credentials are missing.
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
              Username and password are in <code className="text-xs">.env</code>
              {status.baseUrl ? ` (${status.baseUrl})` : ""}. Test the connection, then book a
              World First shipment to issue the AWB. After booking, download Vendor AWB and Invoice,
              check the account balance, and finish Day End.
            </p>
          </div>
        ) : (
          <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Add World First API username and password to <code className="text-xs">.env</code>,
              then restart <code className="text-xs">npm run dev</code>.
            </p>
          </div>
        )}
        {status?.configured ? <WorldFirstWalletBar /> : null}

        <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
{`WORLD_FIRST_API_BASE_URL=https://xpresion.worldfirst.in
WORLD_FIRST_API_USERNAME=
WORLD_FIRST_API_PASSWORD=
WORLD_FIRST_PRODUCT=
WORLD_FIRST_VENDOR=
WORLD_FIRST_SERVICE=`}
        </pre>
        <p className="text-muted-foreground">
          Product, Vendor and Service must match the names on Xpresion AWB Entry. You can also set
          them per shipment on New Booking.
        </p>
        {worldFirstPartner ? (
          <Button
            type="button"
            variant="outline"
            disabled={testMutation.isPending}
            onClick={() => testMutation.mutate(worldFirstPartner.id)}
          >
            {testMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Truck className="h-4 w-4 mr-2" />
            )}
            Test World First connection
          </Button>
        ) : (
          <p className="text-muted-foreground">
            Add a courier partner named World First (code WF) under Partners first.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
