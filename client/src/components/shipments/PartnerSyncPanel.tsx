import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Copy,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Circle,
  Clock,
  Ban,
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
import { isWorldFirstPartner } from "@shared/world-first";
import type { BookingWorkflowStep } from "@shared/world-first";
import {
  BOOKING_JOB_STATUS_LABELS,
  BOOKING_METHOD_LABELS,
  resolveBookingMethod,
  type BookingJobStatus,
  type BookingMethod,
  type BookingValidationIssue,
} from "@shared/booking-engine";
import { cn } from "@/lib/utils";

const syncStatusColors: Record<PartnerSyncStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-zinc-800 dark:text-amber-300",
  opened: "bg-blue-100 text-blue-800 dark:bg-zinc-800 dark:text-blue-300",
  submitted: "bg-purple-100 text-purple-800 dark:bg-zinc-800 dark:text-purple-300",
  synced: "bg-green-100 text-green-800 dark:bg-zinc-800 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-zinc-800 dark:text-red-400",
};

interface BookingSnapshot {
  job: {
    id: string;
    status: BookingJobStatus;
    bookingMethod: BookingMethod;
    attemptCount: number;
    maxAttempts: number;
    error?: string | null;
    actionRequiredReason?: string | null;
    nextAction?: string | null;
    awbNumber?: string | null;
    labelUrl?: string | null;
  } | null;
  events: Array<{ id: string; step: string; message: string; createdAt: string }>;
  method: BookingMethod;
  connectorId?: string | null;
  ready: boolean;
  issues: BookingValidationIssue[];
  workflow?: BookingWorkflowStep[];
  autofillToken?: string;
}

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

  const { data: booking, isLoading: bookingLoading } = useQuery<BookingSnapshot>({
    queryKey: ["/api/shipments", shipment.id, "booking"],
  });

  const payload = useMemo(() => {
    const base = buildPartnerSyncPayload(shipment, partner ?? undefined);
    return {
      ...base,
      autofillToken: booking?.autofillToken,
      xgooOrigin: typeof window !== "undefined" ? window.location.origin : undefined,
    };
  }, [shipment, partner, booking?.autofillToken]);

  useEffect(() => {
    if (!payload.shipmentId || !payload.partnerCode) return;
    notifyExtension(payload);
  }, [payload]);

  const resolvedPortalUrl = payload.portalUrl ?? resolvePartnerPortalUrl(partner ?? undefined);
  const portalConfigured = !!resolvedPortalUrl;
  const isDelhivery = isDelhiveryPartner(partner?.code, partner?.name);
  const isWorldFirst = isWorldFirstPartner(partner?.code, partner?.name);

  const bookingMethod = booking?.method ?? resolveBookingMethod(partner ?? {});
  const jobStatus = booking?.job?.status;
  const isApiBooking = bookingMethod === "api" && !isWorldFirst;
  const needsBrowserAssist = bookingMethod === "browser_automation" || isWorldFirst;

  const invalidateBooking = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
    queryClient.invalidateQueries({ queryKey: ["/api/shipments", shipment.id] });
    queryClient.invalidateQueries({ queryKey: ["/api/shipments", shipment.id, "booking"] });
  };

  const syncMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      return apiRequest("PATCH", `/api/shipments/${shipment.id}/partner-sync`, body);
    },
    onSuccess: () => {
      invalidateBooking();
    },
    onError: (error: Error) => {
      toast({
        title: "Sync update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bookMutation = useMutation({
    mutationFn: async (retry: boolean) => {
      const res = await apiRequest(
        "POST",
        `/api/shipments/${shipment.id}/booking/${retry ? "retry" : "start"}`,
      );
      return res.json() as Promise<BookingSnapshot>;
    },
    onSuccess: (snapshot) => {
      if (snapshot.job?.awbNumber) setExternalAwb(snapshot.job.awbNumber);
      if (snapshot.job?.error) setSyncError(snapshot.job.error);
      invalidateBooking();
      if (snapshot.job?.status === "booked") {
        toast({
          title: "Booking successful",
          description: snapshot.job.awbNumber
            ? `AWB ${snapshot.job.awbNumber} assigned.`
            : `${partnerName} booking completed.`,
        });
        return;
      }
      if (snapshot.issues.length > 0) {
        toast({
          title: "Action required",
          description: snapshot.issues.map((issue) => issue.message).join(" • "),
          variant: "destructive",
        });
        return;
      }
      if (snapshot.job?.status === "action_required") {
        toast({
          title: "Action required",
          description: snapshot.job.actionRequiredReason || "Finish this booking with the courier.",
        });
        return;
      }
      if (snapshot.job?.status === "booking_failed") {
        toast({
          title: "Booking failed",
          description: snapshot.job.error || "The courier booking could not be completed.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      setSyncError(error.message);
      toast({ title: "Could not start booking", description: error.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/shipments/${shipment.id}/booking/cancel`);
      return res.json() as Promise<BookingSnapshot>;
    },
    onSuccess: (snapshot) => {
      invalidateBooking();
      toast({
        title: "Cancelled on Delhivery",
        description: snapshot.job?.awbNumber
          ? `AWB ${snapshot.job.awbNumber} was cancelled. It should leave Manifested after a refresh.`
          : "Delhivery cancellation was sent.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not cancel on Delhivery",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const trackMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", `/api/shipments/${shipment.id}/delhivery-track`);
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || "Tracking failed");
      }
      return res.json() as Promise<{
        waybill: string;
        status: string;
        origin: string | null;
        destination: string | null;
        scans: Array<{ status: string; location: string | null; at: string | null }>;
      }>;
    },
    onError: (error: Error) => {
      toast({
        title: "Delhivery tracking failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/shipments/${shipment.id}/booking/resume`);
      return res.json() as Promise<BookingSnapshot>;
    },
    onSuccess: () => {
      invalidateBooking();
    },
    onError: (error: Error) => {
      toast({
        title: "Could not continue booking",
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
    syncMutation.isPending ||
    bookMutation.isPending ||
    resumeMutation.isPending ||
    cancelMutation.isPending ||
    partnersLoading ||
    bookingLoading;
  const alreadySynced = !!(
    shipment.externalAwb?.trim() ||
    externalAwb.trim() ||
    jobStatus === "booked"
  );
  const isCancelled = shipment.status === "cancelled" || jobStatus === "cancelled";
  const delhiveryAwb = (shipment.externalAwb || booking?.job?.awbNumber || "").trim();
  const canCancelDelhivery = isDelhivery && isApiBooking && !!delhiveryAwb && !isCancelled;
  const canRetry = jobStatus === "booking_failed" && (booking?.job?.attemptCount ?? 0) < (booking?.job?.maxAttempts ?? 3);
  const loginDone = booking?.events?.some((event) => event.step === "resume") ?? false;
  const waitingOnLogin =
    isWorldFirst &&
    !loginDone &&
    jobStatus === "action_required" &&
    (booking?.job?.nextAction === "login" ||
      booking?.job?.nextAction === "otp" ||
      booking?.job?.nextAction === "browser");

  const runBooking = async (retry = false) => {
    const snapshot = await bookMutation.mutateAsync(retry);
    if (
      snapshot.job?.status === "action_required" &&
      (snapshot.job.nextAction === "browser" ||
        snapshot.job.nextAction === "otp" ||
        snapshot.job.nextAction === "login")
    ) {
      await openPartnerPortal();
    }
  };

  const continueAfterLogin = async () => {
    await resumeMutation.mutateAsync();
    await openPartnerPortal();
    toast({
      title: "Continue on World First",
      description: "After you click Login (saved password or OTP), use Autofill on the AWB Entry screen.",
    });
  };

  return (
    <Card data-testid="panel-partner-sync">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Book shipment</CardTitle>
            <CardDescription>
              {BOOKING_METHOD_LABELS[bookingMethod]} · {partnerName}. The courier website stays an
              implementation detail — XGoo starts the booking from here.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {jobStatus ? (
              <Badge className="shrink-0" variant="secondary">
                {BOOKING_JOB_STATUS_LABELS[jobStatus]}
              </Badge>
            ) : null}
            <Badge className={cn("shrink-0", syncStatusColors[syncStatus])}>
              {PARTNER_SYNC_STATUS_LABELS[syncStatus]}
            </Badge>
          </div>
        </div>
        {!extensionChecking && needsBrowserAssist && (
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
          <Button
            onClick={() => void runBooking(canRetry)}
            disabled={actionDisabled || alreadySynced || isCancelled}
            data-testid="button-book-shipment"
          >
            {bookMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {alreadySynced ? "Booked" : canRetry ? "Retry booking" : "Book shipment"}
          </Button>
          {canCancelDelhivery ? (
            <Button
              variant="outline"
              className="text-red-700 hover:text-red-800 dark:text-red-400"
              disabled={actionDisabled}
              data-testid="button-cancel-delhivery"
              onClick={() => {
                if (
                  !window.confirm(
                    `Cancel Delhivery AWB ${delhiveryAwb}? This removes it from Manifested if pickup has not happened.`,
                  )
                ) {
                  return;
                }
                cancelMutation.mutate();
              }}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Ban className="mr-2 h-4 w-4" />
              )}
              Cancel on Delhivery
            </Button>
          ) : null}
          {isDelhivery && isApiBooking && (shipment.externalAwb || booking?.job?.awbNumber) ? (
            <Button
              variant="outline"
              onClick={() => trackMutation.mutate()}
              disabled={trackMutation.isPending}
            >
              {trackMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Clock className="mr-2 h-4 w-4" />
              )}
              Track on Delhivery
            </Button>
          ) : null}
          {booking?.job?.labelUrl ? (
            <Button variant="outline" asChild>
              <a href={booking.job.labelUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Packing slip
              </a>
            </Button>
          ) : null}
          {waitingOnLogin ? (
            <Button
              variant="secondary"
              onClick={() => void continueAfterLogin()}
              disabled={actionDisabled}
              data-testid="button-continue-after-login"
            >
              {resumeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Continue after login
            </Button>
          ) : null}
          {needsBrowserAssist || !isApiBooking ? (
            <>
              <Button
                variant={isApiBooking ? "outline" : "secondary"}
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
          ) : null}
        </div>

        {isWorldFirst && needsBrowserAssist ? (
          <div className="flex gap-2 rounded-none border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              World First login is usually your saved username and password — click{" "}
              <strong>Login</strong> if Chrome filled them. <strong>Login With OTP</strong> is
              optional. XGoo never stores partner passwords or OTPs. After you reach AWB Entry, click
              Autofill — the extension reads the form and uses AI to map this shipment onto every
              matching field. Review Product/Vendor/Service, click + Add for pieces if needed, then
              paste the AWB here.
            </p>
          </div>
        ) : null}

        {booking?.workflow && booking.workflow.length > 0 ? (
          <div className="space-y-1.5 border p-3 text-sm" data-testid="list-world-first-workflow">
            <p className="font-medium mb-2">World First booking steps</p>
            <ol className="space-y-1.5">
              {booking.workflow.map((step) => (
                <li key={step.id} className="flex items-center gap-2">
                  {step.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                  ) : step.status === "waiting" ? (
                    <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={step.status === "pending" ? "text-muted-foreground" : undefined}>
                    {step.label}
                    {step.status === "waiting" ? " — waiting on login" : ""}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {booking && !booking.ready ? (
          <div className="rounded-none border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <p className="font-medium mb-1">Action required</p>
            <ul className="list-disc pl-4 space-y-1">
              {booking.issues.map((issue) => (
                <li key={issue.code}>{issue.message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {booking?.job?.actionRequiredReason && booking.job.status === "action_required" ? (
          <div className="rounded-none border p-3 text-sm">
            <p className="font-medium">Waiting on operator</p>
            <p className="text-muted-foreground mt-1">{booking.job.actionRequiredReason}</p>
          </div>
        ) : null}

        {trackMutation.data ? (
          <div className="rounded-none border p-3 text-sm">
            <p className="font-medium">
              Delhivery · {trackMutation.data.waybill} · {trackMutation.data.status}
            </p>
            <p className="text-muted-foreground mt-1">
              {trackMutation.data.origin || "—"} → {trackMutation.data.destination || "—"}
            </p>
            {trackMutation.data.scans.length ? (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {trackMutation.data.scans.slice(-5).reverse().map((scan, index) => (
                  <li key={`${scan.at}-${index}`}>
                    {scan.at ? new Date(scan.at).toLocaleString("en-IN") : "—"} · {scan.status}
                    {scan.location ? ` · ${scan.location}` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {booking?.events?.length ? (
          <div className="space-y-1 border p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-2">Booking activity</p>
            {booking.events.slice(-8).map((event) => (
              <p key={event.id}>
                {new Date(event.createdAt).toLocaleTimeString("en-IN")} · {event.message}
              </p>
            ))}
          </div>
        ) : null}

        {isDelhivery && isApiBooking && booking?.issues.some((issue) => issue.code === "api_not_configured") && !partnersLoading && (
          <div className="flex gap-2 rounded-none border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Add <code className="text-xs">DELHIVERY_API_TOKEN</code> (API token from Delhivery One
              → Settings → API and MCP Setup) and{" "}
              <code className="text-xs">DELHIVERY_PICKUP_LOCATION</code> to{" "}
              <code className="text-xs">.env</code>, then restart the server. The MCP JSON on that
              page is for Cursor only and cannot create bookings.
            </p>
          </div>
        )}

        {needsBrowserAssist && !extensionInstalled && !extensionChecking && (
          <div className="flex gap-2 rounded-none border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Load the <strong>XGoo Partner Sync</strong> extension from the{" "}
              <code className="text-xs">extension/</code> folder in Chrome → Extensions → Load
              unpacked. Reload this page after installing.
            </p>
          </div>
        )}

        {needsBrowserAssist && !partnersLoading && !portalConfigured && (
          <div className="flex gap-2 rounded-none border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              No portal URL configured for this partner. Add one under{" "}
              <strong>Partners</strong> → edit partner → <strong>Booking portal URL</strong>.
            </p>
          </div>
        )}

        {portalConfigured && resolvedPortalUrl && needsBrowserAssist && (
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
          {isApiBooking
            ? "API booking creates the Delhivery AWB from this screen, then requests pickup. MCP in Cursor is separate and read-only."
            : needsBrowserAssist
              ? extensionInstalled
                ? isWorldFirst
                  ? "Open Xpresion, click Login if your password is saved (OTP is optional), then Autofill on AWB Entry. AI maps shipper, consignee, pieces, and content — review catalog fields before Save."
                  : "Open the partner portal, log in if needed, then click Autofill on the orange XGoo banner."
                : "Install the browser extension for autofill, or use Copy payload and enter the partner AWB manually."
              : "Book with the partner, then paste the AWB here. Automated website login is not used."}
        </p>
      </CardContent>
    </Card>
  );
}
