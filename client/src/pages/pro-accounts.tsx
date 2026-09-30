import { useEffect } from "react";
import { useLocation } from "wouter";
import { CommandProAccounts } from "@/components/command/CommandProAccounts";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { XGOO_MODULES } from "@/components/marketing/site-info";

export default function ProAccountsPage() {
  const [, setLocation] = useLocation();
  const { isCommandWorkspace, isLoading } = useStaffAccess();

  useEffect(() => {
    if (!isLoading && !isCommandWorkspace) setLocation("/dashboard");
  }, [isLoading, isCommandWorkspace, setLocation]);

  if (isLoading || !isCommandWorkspace) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{XGOO_MODULES.pro.name} accounts</h1>
        <p className="text-sm text-muted-foreground">
          See active {XGOO_MODULES.pro.name} stores and the bookings they create. Review new
          applications before a store can go live.
        </p>
      </div>
      <CommandProAccounts />
    </div>
  );
}
