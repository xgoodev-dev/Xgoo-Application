import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import type { BranchWithServiceAreas, OfficeMember } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StaffAccess = {
  officeId: string;
  role: string;
  branchId: string | null;
  isSuperAdmin: boolean;
};

const unassignedBranch = "__all__";

export function StaffManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("staff");
  const [branchId, setBranchId] = useState(unassignedBranch);

  const { data: access } = useQuery<StaffAccess>({ queryKey: ["/api/staff/me"] });
  const { data: members = [], isLoading } = useQuery<OfficeMember[]>({
    queryKey: ["/api/staff-members"],
    enabled: access?.isSuperAdmin === true,
  });
  const { data: branches = [] } = useQuery<BranchWithServiceAreas[]>({
    queryKey: ["/api/branches"],
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/staff-members"] });

  const addMember = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/staff-members", {
        email,
        displayName,
        role,
        branchId: branchId === unassignedBranch ? null : branchId,
      }),
    onSuccess: () => {
      toast({
        title: "Staff member added",
        description: "Access is linked to the XGoo organization. An invitation was sent when required.",
      });
      refresh();
      setDialogOpen(false);
      setEmail("");
      setDisplayName("");
      setRole("staff");
      setBranchId(unassignedBranch);
    },
    onError: (error: Error) =>
      toast({ title: "Could not add staff", description: error.message, variant: "destructive" }),
  });

  const updateMember = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/staff-members/${id}`, patch),
    onSuccess: () => refresh(),
    onError: (error: Error) =>
      toast({ title: "Could not update staff", description: error.message, variant: "destructive" }),
  });

  const removeMember = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/staff-members/${id}`),
    onSuccess: () => {
      toast({ title: "Staff access removed" });
      refresh();
    },
    onError: (error: Error) =>
      toast({ title: "Could not remove staff", description: error.message, variant: "destructive" }),
  });

  if (access && !access.isSuperAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff access</CardTitle>
          <CardDescription>
            Only the XGoo Super Admin can manage staff members and branch assignments.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              XGoo Staff
            </CardTitle>
            <CardDescription>
              Add staff to this organization and assign their operating branch.
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add staff
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading staff…
            </div>
          ) : (
            members.map((member) => {
              const isOwner = member.role === "super_admin";
              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{member.displayName || member.email}</p>
                      {isOwner ? (
                        <Badge className="gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Super Admin
                        </Badge>
                      ) : null}
                      {member.status === "inactive" ? <Badge variant="secondary">Inactive</Badge> : null}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  {!isOwner ? (
                    <>
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          updateMember.mutate({ id: member.id, patch: { role: value } })
                        }
                      >
                        <SelectTrigger className="w-full lg:w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="branch_manager">Branch manager</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={member.branchId || unassignedBranch}
                        onValueChange={(value) =>
                          updateMember.mutate({
                            id: member.id,
                            patch: { branchId: value === unassignedBranch ? null : value },
                          })
                        }
                      >
                        <SelectTrigger className="w-full lg:w-52">
                          <SelectValue placeholder="All branches" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={unassignedBranch}>All branches</SelectItem>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Remove ${member.displayName || member.email}`}
                        onClick={() => {
                          if (window.confirm(`Remove access for ${member.email}?`)) {
                            removeMember.mutate(member.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">All branches</span>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add XGoo staff member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Name</Label>
              <Input id="staff-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="branch_manager">Branch manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={unassignedBranch}>All branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!displayName.trim() || !email.trim() || addMember.isPending}
              onClick={() => addMember.mutate()}
            >
              {addMember.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add staff member
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

