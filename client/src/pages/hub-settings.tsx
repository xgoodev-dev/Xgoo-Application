import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { HubServiceAreaSettings } from "@/components/hubs/HubServiceAreaSettings";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import type { BranchWithServiceAreas } from "@shared/schema";

export default function HubSettingsPage() {
  const [, setLocation] = useLocation();
  const { isCommandWorkspace, isLoading, branchId } = useStaffAccess();
  const { data: branches, isLoading: branchesLoading } = useQuery<BranchWithServiceAreas[]>({
    queryKey: ["/api/branches"],
    enabled: !isLoading && !isCommandWorkspace,
  });

  useEffect(() => {
    if (!isLoading && isCommandWorkspace) setLocation("/stores");
  }, [isCommandWorkspace, isLoading, setLocation]);

  if (isLoading || isCommandWorkspace) return null;

  const hub =
    branches?.find((branch) => branch.id === branchId) ||
    branches?.find((branch) => branch.isPrimary) ||
    branches?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{XGOO_MODULES.hub.name} settings</h1>
        <p className="text-sm text-muted-foreground">
          Set this Hub’s map location and the kilometre range for {XGOO_MODULES.go.name} and{" "}
          {XGOO_MODULES.pro.name}.
        </p>
      </div>
      {branchesLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading Hub location…
        </div>
      ) : hub ? (
        <HubServiceAreaSettings branch={hub} />
      ) : (
        <p className="text-sm text-muted-foreground">No Hub location is set up yet.</p>
      )}
    </div>
  );
}
