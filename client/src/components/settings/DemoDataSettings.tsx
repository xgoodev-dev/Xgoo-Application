import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, Loader2, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DemoDataStatus {
  hasDemoData: boolean;
  counts: {
    partners: number;
    customers: number;
    shipments: number;
    quotations: number;
    bookingRequests: number;
  };
}

const DEMO_QUERY_KEY = ["/api/demo-data/status"];

function invalidateAllDemoQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: DEMO_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
  queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
  queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
  queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
  queryClient.invalidateQueries({ queryKey: ["/api/booking-requests"] });
  queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
}

export function DemoDataSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery<DemoDataStatus>({
    queryKey: DEMO_QUERY_KEY,
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/demo-data/seed"),
    onSuccess: async (res) => {
      const text = await res.text();
      let result: DemoDataStatus;
      try {
        result = JSON.parse(text) as DemoDataStatus;
      } catch {
        throw new Error(
          "Server returned an invalid response. Restart the dev server, run npm run db:push, then try again.",
        );
      }
      invalidateAllDemoQueries(queryClient);
      toast({
        title: "Sample data loaded",
        description: result.hasDemoData
          ? "Demo partners, customers, shipments, and more are ready to explore."
          : "Sample data was already present.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/demo-data"),
    onSuccess: () => {
      invalidateAllDemoQueries(queryClient);
      toast({
        title: "Sample data removed",
        description: "All demo records have been deleted. Your real data is untouched.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const total =
    status?.counts
      ? Object.values(status.counts).reduce((a, b) => a + b, 0)
      : 0;

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sample Data
        </CardTitle>
        <CardDescription>
          Load demo partners, customers, shipments, quotations, and booking requests to explore the app.
          Remove them anytime — only sample records are deleted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Checking sample data…</p>
        ) : status?.hasDemoData ? (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
            <p className="font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {total} demo records loaded
            </p>
            <p className="text-muted-foreground">
              {status.counts.partners} partners · {status.counts.customers} customers ·{" "}
              {status.counts.shipments} shipments · {status.counts.quotations} quotations ·{" "}
              {status.counts.bookingRequests} booking requests
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No sample data loaded. Use the button below to populate the dashboard with demo content.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending || status?.hasDemoData}
            data-testid="button-load-sample-data"
          >
            {seedMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Load sample data
          </Button>

          {status?.hasDemoData && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={clearMutation.isPending} data-testid="button-remove-sample-data">
                  {clearMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Remove sample data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove all sample data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This deletes demo courier partners, customers, shipments, quotations, and booking
                    requests only. Your real bookings and settings will not be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => clearMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove sample data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
