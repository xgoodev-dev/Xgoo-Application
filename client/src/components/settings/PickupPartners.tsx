import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, UserPlus } from "lucide-react";
import {
  PICKUP_GOVT_ID_TYPES,
  type BranchWithServiceAreas,
  type PickupGovtIdType,
  type PickupPartner,
} from "@shared/schema";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type HubPickupPartner = PickupPartner & {
  hasPassword?: boolean;
  storeName?: string | null;
};

const emptyForm = {
  name: "",
  phone: "",
  password: "",
  address: "",
  govtIdType: "aadhaar" as PickupGovtIdType,
  govtIdNumber: "",
  branchId: "",
};

function govtIdLabel(type: string | null | undefined) {
  switch (type) {
    case "aadhaar":
      return "Aadhaar";
    case "pan":
      return "PAN";
    case "driving_license":
      return "Driving licence";
    case "voter_id":
      return "Voter ID";
    case null:
    case undefined:
      return "Government ID";
    default:
      return "Government ID";
  }
}

export function PickupPartners() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isCommandWorkspace, isSuperAdmin, canManageHubStaff, branchId: managerStoreId } = useStaffAccess();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordPartner, setPasswordPartner] = useState<HubPickupPartner | null>(null);
  const [reviewPartner, setReviewPartner] = useState<HubPickupPartner | null>(null);
  const [activateStoreId, setActivateStoreId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState(emptyForm);
  const canPickStore = isCommandWorkspace || (isSuperAdmin && !managerStoreId);

  const { data: partners = [], isLoading } = useQuery<HubPickupPartner[]>({
    queryKey: ["/api/pickup-partners"],
    enabled: canManageHubStaff,
    refetchInterval: 8000,
  });
  const { data: branches = [] } = useQuery<BranchWithServiceAreas[]>({
    queryKey: ["/api/branches"],
    enabled: canManageHubStaff,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/pickup-partners"] });

  const assignedStoreId = canPickStore ? form.branchId : managerStoreId || "";
  const pendingPartners = partners.filter((partner) => partner.status === "pending");
  const activePartners = partners.filter((partner) => partner.status !== "pending");

  const addPartner = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/pickup-partners", {
        ...form,
        branchId: assignedStoreId,
      }),
    onSuccess: () => {
      toast({
        title: "Pickup partner added",
        description: `${XGOO_MODULES.pickup.name} can sign in with this mobile number and password for this store only.`,
      });
      refresh();
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (error: Error) =>
      toast({ title: "Could not add partner", description: error.message, variant: "destructive" }),
  });

  const updatePartner = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/pickup-partners/${id}`, patch),
    onSuccess: (_data, variables) => {
      const activated = variables.patch.status === "active";
      toast({
        title: activated ? "Partner activated" : "Partner updated",
        description: activated ? "They can now sign in with their password or OTP." : undefined,
      });
      refresh();
      setPasswordPartner(null);
      setReviewPartner(null);
      setNewPassword("");
      setActivateStoreId("");
    },
    onError: (error: Error) =>
      toast({ title: "Could not update partner", description: error.message, variant: "destructive" }),
  });

  if (!canManageHubStaff) return null;

  const formReady =
    form.name.trim().length > 0 &&
    form.phone.replace(/\D/g, "").length >= 10 &&
    form.password.trim().length >= 8 &&
    form.address.trim().length >= 4 &&
    form.govtIdNumber.trim().length >= 4 &&
    Boolean(assignedStoreId);

  const storeNameFor = (partner: HubPickupPartner) =>
    partner.storeName ||
    branches.find((branch) => branch.id === partner.branchId)?.name ||
    "No store assigned";

  const activatePartner = (partner: HubPickupPartner, storeId?: string) => {
    const branchId = canPickStore ? storeId || partner.branchId || activateStoreId : managerStoreId || partner.branchId;
    if (!branchId) {
      toast({
        title: "Assign a store first",
        description: "Choose a store, then activate this partner.",
        variant: "destructive",
      });
      return;
    }
    updatePartner.mutate({ id: partner.id, patch: { status: "active", branchId } });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{XGOO_MODULES.pickup.name} partners</CardTitle>
          <CardDescription>
            {isCommandWorkspace
              ? "App requests appear here. Open one, assign a store, and activate so they can sign in with password or OTP."
              : `App requests appear here. Open one and activate it for this ${XGOO_MODULES.hub.name} store so they can sign in with password or OTP.`}
          </CardDescription>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add partner
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Activation requests</h3>
            {pendingPartners.length > 0 ? <Badge>{pendingPartners.length}</Badge> : null}
          </div>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : pendingPartners.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No app requests yet. Partners who tap Send to Activate in the {XGOO_MODULES.pickup.name} app
              appear here so you can add them and activate the account.
            </p>
          ) : (
            pendingPartners.map((partner) => (
              <button
                key={partner.id}
                type="button"
                className="flex w-full flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-left transition hover:bg-primary/10"
                onClick={() => {
                  setReviewPartner(partner);
                  setActivateStoreId(partner.branchId || managerStoreId || "");
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{partner.name}</p>
                  <Badge>Needs activation</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{partner.phone}</p>
                <p className="text-sm text-muted-foreground">
                  {storeNameFor(partner)}
                  {partner.address ? ` · ${partner.address}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {govtIdLabel(partner.govtIdType)} {partner.govtIdNumber || "not added"}
                </p>
                <p className="text-xs font-medium text-primary">Click to assign a store and activate</p>
              </button>
            ))
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Active partners</h3>
          {isLoading ? null : activePartners.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activated pickup partners yet.</p>
          ) : (
            activePartners.map((partner) => (
              <div
                key={partner.id}
                className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{partner.name}</p>
                  <p className="text-sm text-muted-foreground">{partner.phone}</p>
                  <p className="text-sm text-muted-foreground">
                    {storeNameFor(partner)}
                    {partner.address ? ` · ${partner.address}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {govtIdLabel(partner.govtIdType)} {partner.govtIdNumber || "not added"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canPickStore ? (
                    <Select
                      value={partner.branchId || undefined}
                      onValueChange={(branchId) => updatePartner.mutate({ id: partner.id, patch: { branchId } })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Assign store" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{storeNameFor(partner)}</Badge>
                  )}
                  <Badge variant="outline">{partner.signupSource === "self" ? "App request" : "Store created"}</Badge>
                  <Badge variant="outline">{partner.availability}</Badge>
                  <Select
                    value={partner.status}
                    onValueChange={(status) => updatePartner.mutate({ id: partner.id, patch: { status } })}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPasswordPartner(partner);
                      setNewPassword("");
                    }}
                  >
                    <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                    {partner.hasPassword ? "Reset password" : "Set password"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add {XGOO_MODULES.pickup.name} partner</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pickup-name">Name</Label>
              <Input
                id="pickup-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pickup-phone">Mobile number</Label>
              <Input
                id="pickup-phone"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="10-digit mobile"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pickup-password">Password</Label>
              <Input
                id="pickup-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pickup-address">Address</Label>
              <Textarea
                id="pickup-address"
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Government ID</Label>
                <Select
                  value={form.govtIdType}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, govtIdType: value as PickupGovtIdType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PICKUP_GOVT_ID_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {govtIdLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pickup-govt-id">ID number</Label>
                <Input
                  id="pickup-govt-id"
                  value={form.govtIdNumber}
                  onChange={(event) => setForm((current) => ({ ...current, govtIdNumber: event.target.value }))}
                />
              </div>
            </div>
            {canPickStore ? (
              <div className="space-y-1.5">
                <Label>Store</Label>
                <Select
                  value={form.branchId}
                  onValueChange={(value) => setForm((current) => ({ ...current, branchId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to one store" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <Button className="w-full" disabled={!formReady || addPartner.isPending} onClick={() => addPartner.mutate()}>
              {addPartner.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save partner
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(reviewPartner)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewPartner(null);
            setActivateStoreId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate {reviewPartner?.name}</DialogTitle>
          </DialogHeader>
          {reviewPartner ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{reviewPartner.phone}</p>
              {reviewPartner.address ? <p className="text-sm">{reviewPartner.address}</p> : null}
              <p className="text-sm text-muted-foreground">
                {govtIdLabel(reviewPartner.govtIdType)} {reviewPartner.govtIdNumber || "not added"}
              </p>
              {canPickStore ? (
                <div className="space-y-1.5">
                  <Label>Assign store</Label>
                  <Select value={activateStoreId} onValueChange={setActivateStoreId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a store" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-sm">This partner will be added to this store and can then sign in.</p>
              )}
              <Button
                className="w-full"
                disabled={updatePartner.isPending || (canPickStore && !activateStoreId)}
                onClick={() => activatePartner(reviewPartner, activateStoreId)}
              >
                {updatePartner.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Activate account
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(passwordPartner)} onOpenChange={(open) => !open && setPasswordPartner(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {passwordPartner?.hasPassword ? "Reset password" : "Set password"} for {passwordPartner?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pickup-reset-password">New password</Label>
              <Input
                id="pickup-reset-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <Button
              className="w-full"
              disabled={newPassword.trim().length < 8 || updatePartner.isPending}
              onClick={() => {
                if (!passwordPartner) return;
                updatePartner.mutate({ id: passwordPartner.id, patch: { password: newPassword } });
              }}
            >
              {updatePartner.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
