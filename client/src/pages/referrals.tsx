import { useEffect } from "react";
import { useLocation } from "wouter";
import { CommandReferrals } from "@/components/command/CommandReferrals";
import { useStaffAccess } from "@/hooks/use-staff-access";

export default function ReferralsPage() {
  const [, setLocation] = useLocation();
  const { isCommandWorkspace, isLoading } = useStaffAccess();

  useEffect(() => {
    if (!isLoading && !isCommandWorkspace) setLocation("/dashboard");
  }, [isLoading, isCommandWorkspace, setLocation]);

  if (isLoading || !isCommandWorkspace) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Referral program</h1>
        <p className="text-sm text-muted-foreground">
          Set commission rates, review partners, and mark bank payouts after a referred person pays a quote.
        </p>
      </div>
      <CommandReferrals />
    </div>
  );
}
