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
          Domestic referrals earn 10% of the total bill. International referrals earn ₹300 each. Review
          partners and mark bank payouts after the bill is paid.
        </p>
      </div>
      <CommandReferrals />
    </div>
  );
}
