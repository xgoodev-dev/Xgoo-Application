import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Building2,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Loader2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BranchWithServiceAreas } from "@shared/schema";

const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

const pincodeSchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  radiusKm: z.string().optional(),
  label: z.string().optional(),
});

type BranchFormData = z.infer<typeof branchSchema>;
type PincodeFormData = z.infer<typeof pincodeSchema>;

export function BranchManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [pincodeDialogOpen, setPincodeDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchWithServiceAreas | null>(null);
  const [pincodeBranchId, setPincodeBranchId] = useState<string | null>(null);

  const { data: branches, isLoading } = useQuery<BranchWithServiceAreas[]>({
    queryKey: ["/api/branches"],
  });

  const branchForm = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
      email: "",
      isPrimary: false,
      isActive: true,
    },
  });

  const pincodeForm = useForm<PincodeFormData>({
    resolver: zodResolver(pincodeSchema),
    defaultValues: { pincode: "", radiusKm: "25", label: "" },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/branches"] });

  const saveBranchMutation = useMutation({
    mutationFn: async (data: BranchFormData) => {
      if (editingBranch) {
        return apiRequest("PATCH", `/api/branches/${editingBranch.id}`, data);
      }
      return apiRequest("POST", "/api/branches", data);
    },
    onSuccess: () => {
      toast({
        title: editingBranch ? "Branch updated" : "Branch created",
        description: "Branch settings have been saved.",
      });
      invalidate();
      setBranchDialogOpen(false);
      setEditingBranch(null);
      branchForm.reset();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/branches/${id}`),
    onSuccess: () => {
      toast({ title: "Branch deleted" });
      invalidate();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const addPincodeMutation = useMutation({
    mutationFn: async ({ branchId, data }: { branchId: string; data: PincodeFormData }) =>
      apiRequest("POST", `/api/branches/${branchId}/service-areas`, data),
    onSuccess: () => {
      toast({ title: "Service pincode added" });
      invalidate();
      setPincodeDialogOpen(false);
      setPincodeBranchId(null);
      pincodeForm.reset({ pincode: "", radiusKm: "25", label: "" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deletePincodeMutation = useMutation({
    mutationFn: async ({ branchId, areaId }: { branchId: string; areaId: string }) =>
      apiRequest("DELETE", `/api/branches/${branchId}/service-areas/${areaId}`),
    onSuccess: () => {
      toast({ title: "Service pincode removed" });
      invalidate();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openCreateBranch = () => {
    setEditingBranch(null);
    branchForm.reset({
      name: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
      email: "",
      isPrimary: false,
      isActive: true,
    });
    setBranchDialogOpen(true);
  };

  const openEditBranch = (branch: BranchWithServiceAreas) => {
    setEditingBranch(branch);
    branchForm.reset({
      name: branch.name,
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || "",
      pincode: branch.pincode || "",
      phone: branch.phone || "",
      email: branch.email || "",
      isPrimary: branch.isPrimary ?? false,
      isActive: branch.isActive ?? true,
    });
    setBranchDialogOpen(true);
  };

  const openAddPincode = (branchId: string) => {
    setPincodeBranchId(branchId);
    pincodeForm.reset({ pincode: "", radiusKm: "25", label: "" });
    setPincodeDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Branches
          </CardTitle>
          <CardDescription>
            Manage XGoo branches and the pincodes each branch serves. Set a radius in km to cover nearby areas from each operation pincode.
          </CardDescription>
        </div>
        <Button onClick={openCreateBranch} data-testid="button-new-branch">
          <Plus className="mr-2 h-4 w-4" />
          New Branch
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : branches && branches.length > 0 ? (
          branches.map((branch) => (
            <div
              key={branch.id}
              className="rounded-lg border p-4 space-y-3"
              data-testid={`branch-card-${branch.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{branch.name}</h3>
                    {branch.isPrimary && (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3" /> Primary
                      </Badge>
                    )}
                    {!branch.isActive && <Badge variant="outline">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {[branch.address, branch.city, branch.state, branch.pincode]
                      .filter(Boolean)
                      .join(", ") || "No address set"}
                  </p>
                  {(branch.phone || branch.email) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {[branch.phone, branch.email].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditBranch(branch)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  {!branch.isPrimary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteBranchMutation.mutate(branch.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> Service pincodes
                  </span>
                  <Button variant="outline" size="sm" onClick={() => openAddPincode(branch.id)}>
                    <Plus className="h-3 w-3 mr-1" /> Add pincode
                  </Button>
                </div>
                {branch.serviceAreas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {branch.serviceAreas.map((area) => (
                      <Badge
                        key={area.id}
                        variant="outline"
                        className="gap-2 py-1.5 pl-2 pr-1"
                      >
                        <span>
                          {area.pincode}
                          {parseFloat(area.radiusKm || "0") > 0 && (
                            <span className="text-muted-foreground ml-1">
                              (+{area.radiusKm} km)
                            </span>
                          )}
                          {area.label && (
                            <span className="text-muted-foreground ml-1">· {area.label}</span>
                          )}
                        </span>
                        <button
                          type="button"
                          className="rounded hover:bg-muted p-0.5"
                          onClick={() =>
                            deletePincodeMutation.mutate({
                              branchId: branch.id,
                              areaId: area.id,
                            })
                          }
                          aria-label="Remove pincode"
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No service pincodes yet. Add pincodes this branch operates in.
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            No branches yet. Your main branch will appear here after saving organization settings.
          </p>
        )}
      </CardContent>

      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBranch ? "Edit Branch" : "New Branch"}</DialogTitle>
          </DialogHeader>
          <Form {...branchForm}>
            <form
              onSubmit={branchForm.handleSubmit((data) => saveBranchMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={branchForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Hyderabad Branch" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={branchForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Branch address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={branchForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={6} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={branchForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={branchForm.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Primary branch</FormLabel>
                      <FormDescription>Default branch when pickup location is unclear</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={branchForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Active</FormLabel>
                      <FormDescription>Inactive branches won&apos;t receive new bookings</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={saveBranchMutation.isPending} className="w-full">
                {saveBranchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingBranch ? "Save changes" : "Create branch"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={pincodeDialogOpen} onOpenChange={setPincodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add service pincode</DialogTitle>
          </DialogHeader>
          <Form {...pincodeForm}>
            <form
              onSubmit={pincodeForm.handleSubmit((data) => {
                if (pincodeBranchId) {
                  addPincodeMutation.mutate({ branchId: pincodeBranchId, data });
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={pincodeForm.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operation pincode *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="500090" maxLength={6} />
                    </FormControl>
                    <FormDescription>6-digit pincode this branch operates from</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pincodeForm.control}
                name="radiusKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service radius (km)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" step="1" placeholder="25" />
                    </FormControl>
                    <FormDescription>
                      Pickups within this distance from the pincode are assigned to this branch. Use 0 for exact pincode only.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pincodeForm.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. North zone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={addPincodeMutation.isPending} className="w-full">
                {addPincodeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add pincode
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
