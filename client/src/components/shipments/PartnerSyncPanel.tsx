import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Copy,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { copyPartnerPayload, notifyExtension, waitForExtensionStored } from "@/lib/partner-sync-client";
import { useXgooExtension } from "@/hooks/use-xgoo-extension";
import {
  PARTNER_SYNC_STATUSES,
  PARTNER_SYNC_STATUS_LABELS,
  buildPartnerSyncPayload,
  resolvePartnerPortalUrl,
  type PartnerSyncStatus,
} from "@shared/partner-sync";
import type { CourierPartner, ShipmentWithRelations } from "@shared/schema";
import { isDelhiveryPartner } from "@shared/delhivery";
import { cn } from "@/lib/utils";

const syncStatusColors: Record<PartnerSyncStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-zinc-800 dark:text-amber-300",
  opened: "bg-blue-100 text-blue-800 dark:bg-zinc-800 dark:text-blue-300",
  submitted: "bg-purple-100 text-purple-800 dark:bg-zinc-800 dark:text-purple-300",
  synced: "bg-green-100 text-green-800 dark:bg-zinc-800 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-zinc-800 dark:text-red-400",
};

interface PartnerSyncPanelProps {
  shipment: ShipmentWithRelations;
}

export function PartnerSyncPanel({ shipment }: PartnerSyncPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { installed: extensionInstalled, checking: extensionChecking } = useXgooExtension();
  const syncStatus = (shipment.partnerSyncStatus ?? "pending") as PartnerSyncStatus;

  const [externalAwb, setExternalAwb] = useState(shipment.externalAwb ?? "");
  const [syncError, setSyncError] = useState(shipment.partnerSyncError ?? "");

  const { data: partners, isLoading: partnersLoading } = useQuery<CourierPartner[]>({
    queryKey: ["/api/partners"],
  });

  const partner = useMemo(() => {
    if (shipment.courierPartnerId && partners?.length) {
      return partners.find((p) => p.id === shipment.courierPartnerId) ?? shipment.courierPartner;
    }
    return shipment.courierPartner ?? undefined;
  }, [shipment.courierPartnerId, shipment.courierPartner, partners]);

  const payload = useMemo(
    () => buildPartnerSyncPayload(shipment, partner ?? undefined),
    [shipment, partner],
  );

  const resolvedPortalUrl = payload.portalUrl ?? resolvePartnerPortalUrl(partner ?? undefined);
  const portalConfigured = !!resolvedPortalUrl;
  const isDelhivery = isDelhiveryPartner(partner?.code, partner?.name);

  const { data: delhiveryStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/integrations/delhivery/status"],
    enabled: isDelhivery,
  });

  const delhiveryApiReady = isDelhivery && delhiveryStatus?.configured === true;

  const syncMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      return apiRequest("PATCH", `/api/shipments/${shipment.id}/partner-sync`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipments", shipment.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const delhiverySyncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/shipments/${shipment.id}/delhivery-sync`);
      return res.json() as Promise<{ waybill: string }>;
    },
    onSuccess: (data) => {
      setExternalAwb(data.waybill);
      queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipments", shipment.id] });
      toast({
        title: "Created on Delhivery",
        description: `AWB ${data.waybill} assigned.`,
      });
    },
    onError: (error: Error) => {
      setSyncError(error.message);
      toast({
        title: "Delhivery sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openPartnerPortal = async () => {
    notifyExtension(payload);

    const storedPromise = waitForExtensionStored(payload.shipmentId);

    try {
      await copyPartnerPayload(payload);
    } catch {
      /* clipboard optional */
    }

    const url = resolvedPortalUrl;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    try {
      await syncMutation.mutateAsync({ partnerSyncStatus: "opened" });
    } catch {
      /* toast handled in mutation */
    }

    const stored = extensionInstalled ? await storedPromise : false;

    toast({
      title: url ? "Partner portal opened" : "Booking data ready",
      description: url
        ? stored
          ? "Extension received the booking — click Autofill on the partner site banner."
          : extensionInstalled
            ? "Portal opened. Use the Autofill banner on the partner booking form."
            : "Install the XGoo extension (extension/ folder) for autofill, or use Copy payload."
        : "Set a portal URL on the courier partner in Partners, then try again.",
    });
  };

  const savePartnerAwb = async () => {
    await syncMutation.mutateAsync({
      externalAwb: externalAwb.trim() || null,
      partnerSyncStatus: externalAwb.trim() ? "synced" : syncStatus,
      partnerSyncError: syncError.trim() || null,
      copyExternalToAwb: true,
    });
    toast({
      title: externalAwb.trim() ? "Partner AWB saved" : "Sync details updated",
      description: externalAwb.trim()
        ? "External AWB stored and copied to shipment AWB if empty."
        : undefined,
    });
  };

  const updateSyncStatus = async (status: PartnerSyncStatus) => {
    await syncMutation.mutateAsync({
      partnerSyncStatus: status,
      partnerSyncError: status === "failed" ? syncError.trim() || "Marked as failed" : null,
    });
    toast({ title: "Status updated", description: PARTNER_SYNC_STATUS_LABELS[status] });
  };

  const copyPayloadOnly = async () => {
    notifyExtension(payload);
    await copyPartnerPayload(payload);
    toast({ title: "Payload copied", description: "JSON copied for extension or manual use." });
  };

  const partnerName = partner?.name ?? shipment.courierPartner?.name ?? "Courier partner";
  const actionDisabled =
    syncMutation.isPending || delhiverySyncMutation.isPending || partnersLoading;
  const alreadySynced = !!(shipment.externalAwb?.trim() || externalAwb.trim());

  return (
    <Card data-testid="panel-partner-sync">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Partner sync</CardTitle>
            <CardDescription>
              {delhiveryApiReady
                ? `Create this booking on Delhivery via API, or use manual options below.`
                : `Push this booking to ${partnerName} and record the partner AWB when done.`}
            </CardDescription>
          </div>
          <Badge className={cn("shrink-0", syncStatusColors[syncStatus])}>
            {PARTNER_SYNC_STATUS_LABELS[syncStatus]}
          </Badge>
        </div>
        {!extensionChecking && !delhiveryApiReady && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-normal",
              extensionInstalled
                ? "border-green-600 text-green-700 dark:text-green-400"
                : "border-muted-foreground/40 text-muted-foreground",
            )}
            data-testid="badge-extension-status"
          >
            {extensionInstalled ? "Extension connected" : "Extension not detected"}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {delhiveryApiReady && (
            <Button
              onClick={() => delhiverySyncMutation.mutate()}
              disabled={actionDisabled || alreadySynced}
              data-testid="button-delhivery-api-sync"
            >
              {delhiverySyncMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {alreadySynced ? "Synced to Delhivery" : "Create on Delhivery"}
            </Button>
          )}
          {!delhiveryApiReady && (
            <>
              <Button
                onClick={openPartnerPortal}
                disabled={actionDisabled}
                data-testid="button-open-partner-portal"
              >
                {actionDisabled ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Open in partner portal
              </Button>
              <Button
                variant="outline"
                onClick={copyPayloadOnly}
                disabled={actionDisabled}
                data-testid="button-copy-partner-payload"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy payload
              </Button>
            </>
          )}
        </div>

        {isDelhivery && !delhiveryApiReady && !partnersLoading && (
          <div className="flex gap-2 rounded-none border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Add <code className="text-xs">DELHIVERY_API_TOKEN</code> and{" "}
              <code className="text-xs">DELHIVERY_PICKUP_LOCATION</code> to{" "}
              <code className="text-xs">.env</code>, then restart the server for API sync.
            </p>
          </div>
        )}

        {!delhiveryApiReady && !extensionInstalled && !extensionChecking && (
          <div className="flex gap-2 rounded-none border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Load the <strong>XGoo Partner Sync</strong> extension from the{" "}
              <code className="text-xs">extension/</code> folder in Chrome → Extensions → Load
              unpacked. Reload this page after installing.
            </p>
          </div>
        )}

        {!delhiveryApiReady && !partnersLoading && !portalConfigured && (
          <div className="flex gap-2 rounded-none border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              No portal URL configured for this partner. Add one under{" "}
              <strong>Partners</strong> → edit partner → <strong>Booking portal URL</strong>.
            </p>
          </div>
        )}

        {portalConfigured && resolvedPortalUrl && !delhiveryApiReady && (
          <p className="text-sm text-muted-foreground">
            Portal:{" "}
            <a
              href={resolvedPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              {resolvedPortalUrl}
            </a>
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="external-awb">Partner AWB / tracking no.</Label>
            <Input
              id="external-awb"
              value={externalAwb}
              onChange={(e) => setExternalAwb(e.target.value)}
              placeholder="Paste AWB from partner portal"
              data-testid="input-external-awb"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sync-status">Sync status</Label>
            <Select
              value={syncStatus}
              onValueChange={(v) => updateSyncStatus(v as PartnerSyncStatus)}
              disabled={syncMutation.isPending}
            >
              <SelectTrigger id="sync-status" data-testid="select-sync-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_SYNC_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {PARTNER_SYNC_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sync-error">Notes / error (optional)</Label>
          <Textarea
            id="sync-error"
            value={syncError}
            onChange={(e) => setSyncError(e.target.value)}
            placeholder="Reason if sync failed, or internal notes"
            rows={2}
            data-testid="input-sync-error"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={savePartnerAwb}
            disabled={syncMutation.isPending}
            data-testid="button-save-partner-awb"
          >
            {syncMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Save partner AWB
          </Button>
          <Button
            variant="outline"
            onClick={() => updateSyncStatus("submitted")}
            disabled={syncMutation.isPending}
          >
            Mark submitted on partner
          </Button>
        </div>

        {(shipment.externalAwb || shipment.awbNumber || shipment.partnerSyncedAt) && (
          <dl className="grid gap-2 border-t pt-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">XGoo AWB</dt>
              <dd className="font-mono font-medium">{shipment.awbNumber || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Partner AWB</dt>
              <dd className="font-mono font-medium">{shipment.externalAwb || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last synced</dt>
              <dd>
                {shipment.partnerSyncedAt
                  ? new Date(shipment.partnerSyncedAt).toLocaleString("en-IN")
                  : "—"}
              </dd>
            </div>
          </dl>
        )}

        <p className="text-xs text-muted-foreground">
          {delhiveryApiReady
            ? "Delhivery API creates the shipment and returns the AWB automatically. Docs: one.delhivery.com/developer-portal"
            : extensionInstalled
              ? "Open the partner portal, log in if needed, then click Autofill on the orange XGoo banner."
              : "Install the browser extension for autofill, or use Copy payload and enter the partner AWB manually."}
        </p>
      </CardContent>
    </Card>
  );
}
