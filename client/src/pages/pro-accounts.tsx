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
          Review business name, store name, GST, and category. Only verified stores can use{" "}
          {XGOO_MODULES.pro.name}.
        </p>
      </div>
      <CommandProAccounts />
    </div>
  );
}
