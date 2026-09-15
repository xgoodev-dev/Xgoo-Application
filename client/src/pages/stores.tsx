import { useEffect } from "react";
import { useLocation } from "wouter";
import { BranchManagement } from "@/components/branches/BranchManagement";
import { CommandStoreOverview } from "@/components/command/CommandStoreOverview";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { XGOO_MODULES } from "@/components/marketing/site-info";

export default function StoresPage() {
  const [, setLocation] = useLocation();
  const { isCommandWorkspace, isLoading } = useStaffAccess();

  useEffect(() => {
    if (!isLoading && !isCommandWorkspace) setLocation("/dashboard");
  }, [isLoading, isCommandWorkspace, setLocation]);

  if (isLoading || !isCommandWorkspace) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{XGOO_MODULES.command.name} stores</h1>
        <p className="text-sm text-muted-foreground">
          Control every {XGOO_MODULES.hub.name} location, review revenue, and remove store access.
        </p>
      </div>
      <CommandStoreOverview />
      <BranchManagement />
    </div>
  );
}
