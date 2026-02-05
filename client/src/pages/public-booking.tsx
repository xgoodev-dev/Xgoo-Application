import { useState } from "react";
import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  Package,
  User,
  MapPin,
  Scale,
  Truck,
  Loader2,
  CheckCircle,
  Building2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const bookingRequestSchema = z.object({
  senderName: z.string().min(1, "Sender name is required"),
  senderPhone: z.string().min(10, "Valid phone number required"),
  senderEmail: z.string().email().optional().or(z.literal("")),
  senderAddress: z.string().min(1, "Sender address is required"),
  senderCity: z.string().optional(),
  senderState: z.string().optional(),
  senderPincode: z.string().optional(),
  receiverName: z.string().min(1, "Receiver name is required"),
  receiverPhone: z.string().min(10, "Valid phone number required"),
  receiverAddress: z.string().min(1, "Receiver address is required"),
  receiverCity: z.string().optional(),
  receiverState: z.string().optional(),
  receiverPincode: z.string().optional(),
  weight: z.string().optional(),
  numberOfPieces: z.string().default("1"),
  contentDescription: z.string().optional(),
  declaredValue: z.string().optional(),
  serviceType: z.enum(["air", "surface"]).default("surface"),
  courierPreference: z.string().optional(),
  notes: z.string().optional(),
});

type BookingRequestFormData = z.infer<typeof bookingRequestSchema>;

interface OfficeInfo {
  id: string;
  name: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
}

interface PartnerInfo {
  id: string;
  name: string;
  code: string;
}

export default function PublicBookingPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { toast } = useToast();
  const [submittedRequest, setSubmittedRequest] = useState<{
    requestNumber: string;
    message: string;
  } | null>(null);

  const { data: office, isLoading: isLoadingOffice, error: officeError } = useQuery<OfficeInfo>({
    queryKey: ["/api/public/office", slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/office/${slug}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Office not found");
        }
        throw new Error("Failed to fetch office");
      }
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: partners } = useQuery<PartnerInfo[]>({
    queryKey: ["/api/public/office", slug, "partners"],
    queryFn: async () => {
      const res = await fetch(`/api/public/office/${slug}/partners`);
      if (!res.ok) throw new Error("Failed to fetch partners");
      return res.json();
    },
    enabled: !!slug && !!office,
  });

  const form = useForm<BookingRequestFormData>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: {
      serviceType: "surface",
      numberOfPieces: "1",
      senderName: "",
      senderPhone: "",
      senderEmail: "",
      senderAddress: "",
      senderCity: "",
      senderState: "",
      senderPincode: "",
      receiverName: "",
      receiverPhone: "",
      receiverAddress: "",
      receiverCity: "",
      receiverState: "",
      receiverPincode: "",
      weight: "",
      contentDescription: "",
      declaredValue: "",
      courierPreference: "",
      notes: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: BookingRequestFormData) => {
      const payload = {
        ...data,
        numberOfPieces: parseInt(data.numberOfPieces) || 1,
        declaredValue: data.declaredValue || null,
        courierPreference: data.courierPreference || null,
      };
      const res = await fetch(`/api/public/office/${slug}/booking-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit request");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setSubmittedRequest({
        requestNumber: data.requestNumber,
        message: data.message,
      });
      toast({
        title: "Request Submitted",
        description: "Your booking request has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit booking request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingRequestFormData) => {
    submitMutation.mutate(data);
  };

  if (isLoadingOffice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (officeError || !office) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">XGoo</span>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Office Not Found</h1>
          <p className="text-muted-foreground">
            The booking portal you're looking for doesn't exist or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (submittedRequest) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl font-semibold">XGoo</span>
                <span className="text-muted-foreground text-sm ml-2">| {office.name}</span>
              </div>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-lg px-4 py-12">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-success-title">Request Submitted!</h2>
              <p className="text-muted-foreground mb-6">{submittedRequest.message}</p>
              <div className="bg-muted rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-1">Your Request Number</p>
                <p className="text-2xl font-mono font-bold text-primary" data-testid="text-request-number">
                  {submittedRequest.requestNumber}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Please save this number for tracking. {office.name} will contact you shortly to confirm your booking.
              </p>
              <Button
                className="mt-6"
                variant="outline"
                onClick={() => {
                  setSubmittedRequest(null);
                  form.reset();
                }}
                data-testid="button-new-request"
              >
                Submit Another Request
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl font-semibold">XGoo</span>
                <span className="text-muted-foreground text-sm ml-2 hidden sm:inline">| {office.name}</span>
              </div>
            </div>
            {office.phone && (
              <a
                href={`tel:${office.phone}`}
                className="text-sm text-primary hover:underline"
                data-testid="link-office-phone"
              >
                {office.phone}
              </a>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 sm:hidden">{office.name}</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Book a Shipment</h1>
          <p className="text-muted-foreground">
            Fill in the details below to request a courier pickup from {office.name}
            {office.city && `, ${office.city}`}.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Sender Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="senderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your full name" data-testid="input-sender-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senderPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="10-digit phone" data-testid="input-sender-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="senderEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="your@email.com" data-testid="input-sender-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="senderAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Full pickup address" className="resize-none" data-testid="input-sender-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="senderCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="City" data-testid="input-sender-city" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senderState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="State" data-testid="input-sender-state" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senderPincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Pincode" data-testid="input-sender-pincode" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  Receiver Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="receiverName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Receiver's full name" data-testid="input-receiver-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receiverPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="10-digit phone" data-testid="input-receiver-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="receiverAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Full delivery address" className="resize-none" data-testid="input-receiver-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="receiverCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="City" data-testid="input-receiver-city" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receiverState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="State" data-testid="input-receiver-state" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receiverPincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Pincode" data-testid="input-receiver-pincode" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scale className="h-4 w-4" />
                  Package Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approx. Weight (kg)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.1" placeholder="e.g., 0.5" data-testid="input-weight" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="numberOfPieces"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. of Pieces</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" data-testid="input-pieces" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="contentDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Documents, Electronics, Clothes" data-testid="input-content" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="declaredValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Declared Value (Rs.)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0" data-testid="input-declared-value" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" />
                  Service Preference
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-service-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="surface">Surface (Standard)</SelectItem>
                          <SelectItem value="air">Air (Express)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                {partners && partners.length > 0 && (
                  <FormField
                    control={form.control}
                    name="courierPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Courier (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-courier-preference">
                              <SelectValue placeholder="No preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No preference</SelectItem>
                            {partners.map((partner) => (
                              <SelectItem key={partner.id} value={partner.name}>
                                {partner.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Any special instructions or notes for the courier office"
                          className="resize-none"
                          data-testid="input-notes"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitMutation.isPending}
              data-testid="button-submit"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Booking Request
                </>
              )}
            </Button>
          </form>
        </Form>
      </main>

      <footer className="border-t py-6 mt-8">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by{" "}
            <span className="font-semibold text-primary">XGoo</span>
            {" "}| Courier Management Software
          </p>
        </div>
      </footer>
    </div>
  );
}
