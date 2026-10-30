import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorldFirstWallet = {
  limit: number;
  used: number;
  balance: number;
  unbilled?: number;
};

export function WorldFirstWalletBar({ className }: { className?: string }) {
  const { data, isLoading, error } = useQuery<WorldFirstWallet>({
    queryKey: ["/api/integrations/world-first/wallet"],
  });

  if (isLoading) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>Loading World First account…</p>
    );
  }
  if (error || !data) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-xs", className)}>
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Wallet className="h-3.5 w-3.5" />
        World First account
      </span>
      <span className="rounded-full bg-emerald-600 px-2 py-0.5 font-medium text-white">
        Limit: {data.limit}
      </span>
      <span className="rounded-full bg-amber-500 px-2 py-0.5 font-medium text-white">
        Used: {data.used}
      </span>
      <span className="rounded-full bg-red-600 px-2 py-0.5 font-medium text-white">
        Balance: {data.balance}
      </span>
    </div>
  );
}
