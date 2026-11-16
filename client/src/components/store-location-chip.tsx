import { useLocation } from "wouter";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOperatingStore } from "@/hooks/use-operating-store";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BranchWithServiceAreas, Office } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

function storeLabel(branch?: BranchWithServiceAreas | null, office?: Office | null) {
  if (!branch) return office?.name || "Store location not set";
  const place = [branch.address, branch.city, branch.pincode].filter(Boolean).join(", ");
  return [branch.name, place].filter(Boolean).join(" · ") || office?.name || "Store location not set";
}

export function StoreLocationChip({ className }: { className?: string }) {
  const [, setLocation] = useLocation();
  const { isCommandWorkspace, store, stores, setStoreId } = useOperatingStore();
  const { data: office } = useQuery<Office>({ queryKey: ["/api/office"] });

  if (isCommandWorkspace) {
    return (
      <Select value={store?.id || ""} onValueChange={setStoreId}>
        <SelectTrigger
          title="Operate this Hub store from Command"
          aria-label="Command store"
          data-testid="header-store-location"
          className={cn(
            "h-9 max-w-[min(22rem,42vw)] min-w-0 gap-1.5 rounded-none border-zinc-200 bg-white px-2.5 text-xs text-zinc-600 hover:border-[#FF4907] hover:text-zinc-900 focus:ring-0 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300",
            className,
          )}
        >
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF4907]" />
          <SelectValue placeholder={`${XGOO_MODULES.command.name} store`}>
            <span className="min-w-0 truncate font-medium">
              {store ? storeLabel(store, office) : `${XGOO_MODULES.command.name} · Select store`}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          {stores.map((row) => (
            <SelectItem key={row.id} value={row.id}>
              {row.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const text = storeLabel(store, office);

  return (
    <button
      type="button"
      onClick={() => setLocation("/hub-settings")}
      title="Store location is set in Settings"
      aria-label={text}
      data-testid="header-store-location"
      className={cn(
        "inline-flex max-w-[min(22rem,40vw)] min-w-0 items-center gap-1.5 rounded-none border border-zinc-200 bg-white px-2.5 py-1.5 text-left text-xs text-zinc-600 hover:border-[#FF4907] hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300",
        className,
      )}
    >
      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF4907]" />
      <span className="min-w-0 truncate font-medium">{text}</span>
    </button>
  );
}
