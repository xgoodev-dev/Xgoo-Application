import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Truck,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CourierPartner } from "@shared/schema";

const partnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(10, "Code must be 10 characters or less"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  baseRateAir: z.string().optional(),
  baseRateSurface: z.string().optional(),
  ratePerKgAir: z.string().optional(),
  ratePerKgSurface: z.string().optional(),
  awbPrefix: z.string().optional(),
  awbRangeStart: z.string().optional(),
  awbRangeEnd: z.string().optional(),
  isActive: z.boolean().default(true),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

export default function PartnersPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<CourierPartner | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: partners, isLoading } = useQuery<CourierPartner[]>({
    queryKey: ["/api/partners"],
  });

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      isActive: true,
      baseRateAir: "0",
      baseRateSurface: "0",
      ratePerKgAir: "0",
      ratePerKgSurface: "0",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      return apiRequest("POST", "/api/partners", data);
    },
    onSuccess: () => {
      toast({ title: "Partner Added", description: "New courier partner has been added." });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add partner",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PartnerFormData }) => {
      return apiRequest("PATCH", `/api/partners/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Partner Updated", description: "Partner details have been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      setIsDialogOpen(false);
      setEditingPartner(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update partner",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/partners/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Partner Deleted", description: "Partner has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete partner",
        variant: "destructive",
      });
    },
  });

  const openEditDialog = (partner: CourierPartner) => {
    setEditingPartner(partner);
    form.reset({
      name: partner.name,
      code: partner.code,
      contactPerson: partner.contactPerson || "",
      phone: partner.phone || "",
      email: partner.email || "",
      baseRateAir: partner.baseRateAir || "0",
      baseRateSurface: partner.baseRateSurface || "0",
      ratePerKgAir: partner.ratePerKgAir || "0",
      ratePerKgSurface: partner.ratePerKgSurface || "0",
      awbPrefix: partner.awbPrefix || "",
      awbRangeStart: partner.awbRangeStart || "",
      awbRangeEnd: partner.awbRangeEnd || "",
      isActive: partner.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: PartnerFormData) => {
    if (editingPartner) {
      updateMutation.mutate({ id: editingPartner.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredPartners = partners?.filter(
    (partner) =>
      search === "" ||
      partner.name.toLowerCase().includes(search.toLowerCase()) ||
      partner.code.toLowerCase().includes(search.toLowerCase())
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Courier Partners</h1>
          <p className="text-muted-foreground">Manage your courier partner network</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingPartner(null);
              form.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button data-testid="button-add-partner">
              <Plus className="mr-2 h-4 w-4" />
              Add Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPartner ? "Edit Partner" : "Add Courier Partner"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Partner Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., DTDC Express" data-testid="input-partner-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., DTDC" className="uppercase" data-testid="input-partner-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Contact name" data-testid="input-partner-contact" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Phone number" data-testid="input-partner-phone" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="email@example.com" data-testid="input-partner-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Rate Card</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="baseRateSurface"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Rate (Surface)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-base-surface" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ratePerKgSurface"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate/kg (Surface)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-rate-surface" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="baseRateAir"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Rate (Air)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-base-air" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ratePerKgAir"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate/kg (Air)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-rate-air" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">AWB Settings</h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="awbPrefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AWB Prefix</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., DT" data-testid="input-awb-prefix" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="awbRangeStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Range Start</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 1000" data-testid="input-awb-start" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="awbRangeEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Range End</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 9999" data-testid="input-awb-end" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel className="text-base">Active</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Partner will be available for bookings
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-partner"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending} data-testid="button-save-partner">
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : editingPartner ? (
                      "Update Partner"
                    ) : (
                      "Add Partner"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-partners"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : filteredPartners && filteredPartners.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Surface Rate</TableHead>
                    <TableHead>Air Rate</TableHead>
                    <TableHead>AWB</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.map((partner) => (
                    <TableRow key={partner.id} data-testid={`row-partner-${partner.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                            <Truck className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{partner.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {partner.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{partner.contactPerson || "-"}</div>
                        {partner.phone && (
                          <div className="text-xs text-muted-foreground">{partner.phone}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        Rs. {partner.baseRateSurface || 0} + Rs. {partner.ratePerKgSurface || 0}/kg
                      </TableCell>
                      <TableCell className="text-sm">
                        Rs. {partner.baseRateAir || 0} + Rs. {partner.ratePerKgAir || 0}/kg
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {partner.awbPrefix || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            partner.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                          }
                        >
                          {partner.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-partner-actions-${partner.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(partner)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteMutation.mutate(partner.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-1">No partners found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? "Try a different search term" : "Add your first courier partner"}
              </p>
              {!search && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Partner
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
