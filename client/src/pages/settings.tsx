import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Settings,
  Building2,
  Loader2,
  Upload,
  Link2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Users,
  Clock3,
  Images,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Office } from "@shared/schema";
import { BranchManagement } from "@/components/branches/BranchManagement";
import { DemoDataSettings } from "@/components/settings/DemoDataSettings";
import { WhatsAppBusinessSync } from "@/components/settings/WhatsAppBusinessSync";
import { StaffManagement } from "@/components/settings/StaffManagement";
import { PickupSlotSettings } from "@/components/settings/PickupSlotSettings";
import { AppBannerSettings } from "@/components/settings/AppBannerSettings";
import { DelhiveryApiSettings } from "@/components/settings/DelhiveryApiSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const officeSchema = z.object({
  name: z.string().min(1, "Office name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  gstNumber: z.string().optional(),
});

type OfficeFormData = z.infer<typeof officeSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: office, isLoading } = useQuery<Office>({
    queryKey: ["/api/office"],
  });

  const form = useForm<OfficeFormData>({
    resolver: zodResolver(officeSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
      email: "",
      gstNumber: "",
    },
  });

  useEffect(() => {
    if (office) {
      form.reset({
        name: office.name || "",
        address: office.address || "",
        city: office.city || "",
        state: office.state || "",
        pincode: office.pincode || "",
        phone: office.phone || "",
        email: office.email || "",
        gstNumber: office.gstNumber || "",
      });
    }
  }, [office, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: OfficeFormData) => {
      if (office?.id) {
        return apiRequest("PATCH", `/api/office/${office.id}`, data);
      }
      return apiRequest("POST", "/api/office", data);
    },
    onSuccess: () => {
      toast({ title: "Settings Saved", description: "Organization settings have been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/office"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OfficeFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization profile, app banners, pickup slots, branches, and WhatsApp Business automation
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp Business
          </TabsTrigger>
          <TabsTrigger value="banners" className="gap-2">
            <Images className="h-4 w-4" />
            App Banners
          </TabsTrigger>
          <TabsTrigger value="pickup" className="gap-2">
            <Clock3 className="h-4 w-4" />
            Pickup Slots
          </TabsTrigger>
          <TabsTrigger value="couriers" className="gap-2">
            <Truck className="h-4 w-4" />
            Courier APIs
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2">
            <Users className="h-4 w-4" />
            Staff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-0">
      <BookingPortalLink office={office} />

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Office Details
                </CardTitle>
                <CardDescription>
                  Company-wide branding and GST (applies to all branches)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Your courier office name" data-testid="input-office-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Full office address" className="resize-none" data-testid="input-office-address" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="City" data-testid="input-office-city" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="State" data-testid="input-office-state" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Pincode" data-testid="input-office-pincode" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Office phone number" data-testid="input-office-phone" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="office@example.com" data-testid="input-office-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="gstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 22AAAAA0000A1Z5" data-testid="input-office-gst" />
                          </FormControl>
                          <FormDescription>
                            Your 15-digit GST identification number for invoicing
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-settings">
                        {updateMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Settings className="mr-2 h-4 w-4" />
                            Save Settings
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Office Logo</CardTitle>
                <CardDescription>
                  Upload your logo for invoices and branding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
                    {office?.logoUrl ? (
                      <img
                        src={office.logoUrl}
                        alt="Office logo"
                        className="h-full w-full object-contain rounded-lg"
                      />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground/50" />
                    )}
                  </div>
                  <Button variant="outline" size="sm" disabled data-testid="button-upload-logo">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Created</span>
                  <span className="font-medium">
                    {office?.createdAt
                      ? new Date(office.createdAt).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium text-primary">Free</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {office && <BranchManagement />}

        <DemoDataSettings />

        </>
      )}
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-0">
          <WhatsAppBusinessSync />
        </TabsContent>

        <TabsContent value="banners" className="mt-0">
          <AppBannerSettings />
        </TabsContent>

        <TabsContent value="pickup" className="mt-0">
          <PickupSlotSettings />
        </TabsContent>

        <TabsContent value="couriers" className="mt-0">
          <DelhiveryApiSettings />
        </TabsContent>
        <TabsContent value="staff" className="mt-0">
          <StaffManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingPortalLink({ office }: { office?: Office | null }) {
  const [copied, setCopied] = useState(false);

  const portalUrl = office?.publicSlug
    ? `${window.location.origin}/book/${office.publicSlug}`
    : `${window.location.origin}/book`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = portalUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Customer Booking Portal
        </CardTitle>
        <CardDescription>
          Share this link with customers. Bookings submitted here appear under{" "}
          <strong>Booking Requests</strong> in your staff portal — approve and convert them into shipments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={portalUrl}
            className="font-mono text-sm"
            data-testid="input-booking-portal-url"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
            data-testid="button-copy-portal-link"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            asChild
            data-testid="button-open-portal"
          >
            <a href={portalUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          This link is tied to your office{office?.publicSlug ? ` (${office.publicSlug})` : ""}. Website bookings will not
          show under Shipments until you approve them in Booking Requests.
        </p>
      </CardContent>
    </Card>
  );
}
