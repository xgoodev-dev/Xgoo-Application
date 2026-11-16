import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { HubCounterQrCard } from "@/components/hubs/HubCounterQrCard";
import { HubBotAssistantCard } from "@/components/hubs/HubBotAssistantCard";
import { HubServiceAreaSettings } from "@/components/hubs/HubServiceAreaSettings";
import { useOperatingStore } from "@/hooks/use-operating-store";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import type { Office } from "@shared/schema";

export default function HubSettingsPage() {
  const { isCommandWorkspace, store: hub, isLoading } = useOperatingStore();
  const { data: office } = useQuery<Office>({
    queryKey: ["/api/office"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isCommandWorkspace ? `${XGOO_MODULES.command.name} store settings` : `${XGOO_MODULES.hub.name} settings`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isCommandWorkspace
            ? `Operate this ${XGOO_MODULES.hub.name} store the same way the store team does — location, range, counter QR, and Bot Assistant. Pick the store in the header.`
            : `Set this Hub’s map location, kilometre range, and the counter QR customers scan to book From and To.`}
        </p>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading Hub location…
        </div>
      ) : hub ? (
        <>
          <HubCounterQrCard
            officeSlug={office?.publicSlug}
            branchId={hub.id}
            hubName={hub.name}
          />
          <HubBotAssistantCard
            officeSlug={office?.publicSlug}
            branchId={hub.id}
            hubName={hub.name}
          />
          <HubServiceAreaSettings branch={hub} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No Hub location is set up yet.</p>
      )}
    </div>
  );
}
