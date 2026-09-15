import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOpsWorkspace, subscribeOpsWorkspace } from "@/lib/ops-workspace";

export type StaffAccess = {
  officeId: string;
  role: string;
  branchId: string | null;
  isSuperAdmin: boolean;
};

export function useStaffAccess() {
  const query = useQuery<StaffAccess>({
    queryKey: ["/api/staff/me"],
  });
  const [workspace, setWorkspace] = useState(getOpsWorkspace);
  useEffect(() => subscribeOpsWorkspace(() => setWorkspace(getOpsWorkspace())), []);

  const access = query.data;
  const isSuperAdmin = access?.isSuperAdmin === true;
  const isCommandWorkspace = isSuperAdmin && workspace === "command";
  return {
    ...query,
    access,
    workspace,
    isSuperAdmin,
    isCommandWorkspace,
    isHubManager: !isSuperAdmin && access?.role === "branch_manager",
    canManageHubStaff: isSuperAdmin || access?.role === "branch_manager",
    branchId: access?.branchId ?? null,
    role: access?.role ?? "staff",
  };
}
