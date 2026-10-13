import { useEffect } from "react";
import { useLocation } from "wouter";
import { CommandRateCalculator } from "@/components/command/CommandRateCalculator";
import { useStaffAccess } from "@/hooks/use-staff-access";

export default function RateCalculatorPage() {
  const [, setLocation] = useLocation();
  const { isCommandWorkspace, isLoading } = useStaffAccess();

  useEffect(() => {
    if (!isLoading && !isCommandWorkspace) setLocation("/dashboard");
  }, [isLoading, isCommandWorkspace, setLocation]);

  if (isLoading || !isCommandWorkspace) return null;

  return <CommandRateCalculator />;
}
