import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { getCommandStoreId, setCommandStoreId, subscribeCommandStore } from "@/lib/command-store";
import type { BranchWithServiceAreas } from "@shared/schema";

function pickStore(
  stores: BranchWithServiceAreas[],
  preferredId: string | null | undefined,
): BranchWithServiceAreas | null {
  if (!stores.length) return null;
  return (
    stores.find((store) => store.id === preferredId) ||
    stores.find((store) => store.isPrimary) ||
    stores[0] ||
    null
  );
}

export function useOperatingStore() {
  const { isCommandWorkspace, branchId, isLoading: accessLoading } = useStaffAccess();
  const { data: branches, isLoading: branchesLoading } = useQuery<BranchWithServiceAreas[]>({
    queryKey: ["/api/branches"],
  });
  const [commandStoreId, setId] = useState(getCommandStoreId);
  useEffect(() => subscribeCommandStore(() => setId(getCommandStoreId())), []);

  const stores = branches || [];
  const preferredId = isCommandWorkspace ? commandStoreId : branchId;
  const store = useMemo(() => pickStore(stores, preferredId), [stores, preferredId]);

  useEffect(() => {
    if (!isCommandWorkspace || !store) return;
    if (commandStoreId === store.id) return;
    if (commandStoreId && stores.some((row) => row.id === commandStoreId)) return;
    setCommandStoreId(store.id);
  }, [isCommandWorkspace, store, commandStoreId, stores]);

  return {
    isCommandWorkspace,
    store,
    stores,
    setStoreId: setCommandStoreId,
    isLoading: accessLoading || branchesLoading,
  };
}
