import { useEffect } from "react";
import { useLocation } from "wouter";
import { PickupPartners } from "@/components/settings/PickupPartners";
import { StaffManagement } from "@/components/settings/StaffManagement";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { XGOO_MODULES } from "@/components/marketing/site-info";

export default function StaffPage() {
  const [, setLocation] = useLocation();
  const { canManageHubStaff, isCommandWorkspace, isLoading } = useStaffAccess();

  useEffect(() => {
    if (!isLoading && !canManageHubStaff) setLocation("/dashboard");
  }, [canManageHubStaff, isLoading, setLocation]);

  if (isLoading || !canManageHubStaff) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isCommandWorkspace ? `${XGOO_MODULES.command.name} staff` : `${XGOO_MODULES.hub.name} staff`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isCommandWorkspace
            ? `Add or remove access across every ${XGOO_MODULES.hub.name} store and XGoo application.`
            : `Assign staff to this ${XGOO_MODULES.hub.name} store only.`}
        </p>
      </div>
      <StaffManagement />
      <PickupPartners />
    </div>
  );
}
