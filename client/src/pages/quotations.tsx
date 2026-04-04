import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import {
  FileSpreadsheet,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Mail,
  Phone,
  Printer,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Quotation, CourierPartner } from "@shared/schema";

type QuotationWithPartner = Quotation & {
  courierPartner?: CourierPartner | null;
};

const quotationSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  senderCity: z.string().optional(),
  senderState: z.string().optional(),
  senderPincode: z.string().optional(),
  receiverCity: z.string().optional(),
  receiverState: z.string().optional(),
  receiverPincode: z.string().optional(),
  weight: z.string().min(1, "Weight is required"),
  numberOfPieces: z.number().int().positive().default(1),
  contentDescription: z.string().optional(),
  declaredValue: z.string().optional(),
  serviceType: z.enum(["air", "surface"]),
  courierPartnerId: z.string().optional(),
  baseAmount: z.string().default("0"),
  additionalCharges: z.string().optional(),
  gstAmount: z.string().optional(),
  totalAmount: z.string().min(1, "Total amount is required"),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]).default("draft"),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 dark:border dark:border-zinc-700",
  sent: "bg-blue-100 text-blue-700 dark:bg-zinc-800 dark:text-blue-400 dark:border dark:border-zinc-700",
  accepted: "bg-green-100 text-green-700 dark:bg-zinc-800 dark:text-green-400 dark:border dark:border-zinc-700",
  rejected: "bg-red-100 text-red-700 dark:bg-zinc-800 dark:text-red-400 dark:border dark:border-zinc-700",
  expired: "bg-amber-100 text-amber-700 dark:bg-zinc-800 dark:text-zinc-200 dark:border dark:border-zinc-700",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
};

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function QuotationsPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<QuotationWithPartner | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: quotations, isLoading } = useQuery<QuotationWithPartner[]>({
    queryKey: ["/api/quotations"],
  });

  const { data: partners } = useQuery<CourierPartner[]>({
    queryKey: ["/api/partners"],
  });

  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      serviceType: "surface",
      status: "draft",
      numberOfPieces: 1,
      baseAmount: "0",
      totalAmount: "0",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      return apiRequest("POST", "/api/quotations", {
        ...data,
        courierPartnerId: data.courierPartnerId || null,
        declaredValue: data.declaredValue || null,
        validUntil: data.validUntil || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Quotation Created", description: "New quotation has been created." });
      qc.invalidateQueries({ queryKey: ["/api/quotations"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quotation",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: QuotationFormData }) => {
      return apiRequest("PATCH", `/api/quotations/${id}`, {
        ...data,
        courierPartnerId: data.courierPartnerId || null,
        declaredValue: data.declaredValue || null,
        validUntil: data.validUntil || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Quotation Updated", description: "Quotation has been updated." });
      qc.invalidateQueries({ queryKey: ["/api/quotations"] });
      setIsDialogOpen(false);
      setEditingQuotation(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quotation",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/quotations/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Quotation Deleted", description: "Quotation has been removed." });
      qc.invalidateQueries({ queryKey: ["/api/quotations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete quotation",
        variant: "destructive",
      });
    },
  });

  const openEditDialog = (quotation: QuotationWithPartner) => {
    setEditingQuotation(quotation);
    form.reset({
      customerName: quotation.customerName,
      customerPhone: quotation.customerPhone || "",
      customerEmail: quotation.customerEmail || "",
      senderCity: quotation.senderCity || "",
      senderState: quotation.senderState || "",
      senderPincode: quotation.senderPincode || "",
      receiverCity: quotation.receiverCity || "",
      receiverState: quotation.receiverState || "",
      receiverPincode: quotation.receiverPincode || "",
      weight: quotation.weight,
      numberOfPieces: quotation.numberOfPieces || 1,
      contentDescription: quotation.contentDescription || "",
      declaredValue: quotation.declaredValue || "",
      serviceType: quotation.serviceType as "air" | "surface",
      courierPartnerId: quotation.courierPartnerId || "",
      baseAmount: quotation.baseAmount || "0",
      additionalCharges: quotation.additionalCharges || "",
      gstAmount: quotation.gstAmount || "",
      totalAmount: quotation.totalAmount,
      status: quotation.status as "draft" | "sent" | "accepted" | "rejected" | "expired",
      validUntil: quotation.validUntil ? format(new Date(quotation.validUntil), "yyyy-MM-dd") : "",
      notes: quotation.notes || "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: QuotationFormData) => {
    if (editingQuotation) {
      updateMutation.mutate({ id: editingQuotation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleWhatsAppShare = (quotation: QuotationWithPartner) => {
    const message = `*Quotation: ${quotation.quotationNumber}*
    
Customer: ${quotation.customerName}
From: ${quotation.senderCity || "N/A"}, ${quotation.senderState || ""}
To: ${quotation.receiverCity || "N/A"}, ${quotation.receiverState || ""}
Weight: ${quotation.weight} kg
Service: ${quotation.serviceType === "air" ? "Air" : "Surface"}
Amount: ${formatCurrency(quotation.totalAmount)}
Valid Until: ${quotation.validUntil ? format(new Date(quotation.validUntil), "dd MMM yyyy") : "N/A"}

Thank you for choosing XGoo Courier Services!`;

    const encodedMessage = encodeURIComponent(message);
    const phone = quotation.customerPhone?.replace(/\D/g, "") || "";
    const whatsappUrl = phone
      ? `https://wa.me/${phone.startsWith("91") ? phone : `91${phone}`}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleEmailShare = (quotation: QuotationWithPartner) => {
    const subject = `Quotation ${quotation.quotationNumber} - XGoo Courier Services`;
    const body = `Dear ${quotation.customerName},

Please find below the quotation details:

Quotation Number: ${quotation.quotationNumber}
From: ${quotation.senderCity || "N/A"}, ${quotation.senderState || ""}
To: ${quotation.receiverCity || "N/A"}, ${quotation.receiverState || ""}
Weight: ${quotation.weight} kg
Number of Pieces: ${quotation.numberOfPieces || 1}
Service Type: ${quotation.serviceType === "air" ? "Air Express" : "Surface"}
${quotation.contentDescription ? `Contents: ${quotation.contentDescription}` : ""}

Amount: ${formatCurrency(quotation.totalAmount)}
Valid Until: ${quotation.validUntil ? format(new Date(quotation.validUntil), "dd MMM yyyy") : "N/A"}

${quotation.notes ? `Notes: ${quotation.notes}` : ""}

Thank you for choosing XGoo Courier Services!

Best regards,
XGoo Team`;

    const mailtoUrl = `mailto:${quotation.customerEmail || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handlePrint = (quotation: QuotationWithPartner) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation - ${quotation.quotationNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #f97316; margin: 0; font-size: 28px; }
            .header p { color: #666; margin: 5px 0 0 0; }
            .quotation-number { background: #f97316; color: white; padding: 8px 16px; border-radius: 4px; display: inline-block; margin-top: 15px; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: bold; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 15px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .label { color: #666; }
            .value { font-weight: 500; }
            .amount-section { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .total { font-size: 24px; color: #f97316; font-weight: bold; text-align: right; margin-top: 10px; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
            .status { padding: 4px 12px; border-radius: 4px; font-size: 12px; text-transform: uppercase; }
            .status.draft { background: #e2e8f0; color: #475569; }
            .status.sent { background: #dbeafe; color: #1d4ed8; }
            .status.accepted { background: #dcfce7; color: #16a34a; }
            .status.rejected { background: #fee2e2; color: #dc2626; }
            .status.expired { background: #fef3c7; color: #d97706; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>XGoo Courier Services</h1>
            <p>Professional Courier & Logistics</p>
            <div class="quotation-number">${quotation.quotationNumber}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Customer Details</div>
            <div class="row"><span class="label">Name:</span><span class="value">${quotation.customerName}</span></div>
            ${quotation.customerPhone ? `<div class="row"><span class="label">Phone:</span><span class="value">${quotation.customerPhone}</span></div>` : ""}
            ${quotation.customerEmail ? `<div class="row"><span class="label">Email:</span><span class="value">${quotation.customerEmail}</span></div>` : ""}
          </div>

          <div class="section">
            <div class="section-title">Shipment Details</div>
            <div class="row"><span class="label">From:</span><span class="value">${quotation.senderCity || "N/A"}${quotation.senderState ? `, ${quotation.senderState}` : ""}${quotation.senderPincode ? ` - ${quotation.senderPincode}` : ""}</span></div>
            <div class="row"><span class="label">To:</span><span class="value">${quotation.receiverCity || "N/A"}${quotation.receiverState ? `, ${quotation.receiverState}` : ""}${quotation.receiverPincode ? ` - ${quotation.receiverPincode}` : ""}</span></div>
            <div class="row"><span class="label">Weight:</span><span class="value">${quotation.weight} kg</span></div>
            <div class="row"><span class="label">Pieces:</span><span class="value">${quotation.numberOfPieces || 1}</span></div>
            <div class="row"><span class="label">Service:</span><span class="value">${quotation.serviceType === "air" ? "Air Express" : "Surface"}</span></div>
            ${quotation.contentDescription ? `<div class="row"><span class="label">Contents:</span><span class="value">${quotation.contentDescription}</span></div>` : ""}
            ${quotation.declaredValue ? `<div class="row"><span class="label">Declared Value:</span><span class="value">${formatCurrency(quotation.declaredValue)}</span></div>` : ""}
          </div>

          <div class="amount-section">
            <div class="section-title">Pricing</div>
            <div class="row"><span class="label">Base Amount:</span><span class="value">${formatCurrency(quotation.baseAmount || 0)}</span></div>
            ${quotation.additionalCharges ? `<div class="row"><span class="label">Additional Charges:</span><span class="value">${formatCurrency(quotation.additionalCharges)}</span></div>` : ""}
            ${quotation.gstAmount ? `<div class="row"><span class="label">GST:</span><span class="value">${formatCurrency(quotation.gstAmount)}</span></div>` : ""}
            <div class="total">Total: ${formatCurrency(quotation.totalAmount)}</div>
          </div>

          <div class="section" style="margin-top: 25px;">
            <div class="row"><span class="label">Status:</span><span class="status ${quotation.status}">${statusLabels[quotation.status]}</span></div>
            ${quotation.validUntil ? `<div class="row"><span class="label">Valid Until:</span><span class="value">${format(new Date(quotation.validUntil), "dd MMM yyyy")}</span></div>` : ""}
            ${quotation.notes ? `<div class="row"><span class="label">Notes:</span><span class="value">${quotation.notes}</span></div>` : ""}
          </div>

          <div class="footer">
            <p>Thank you for choosing XGoo Courier Services!</p>
            <p>Generated on ${format(new Date(), "dd MMM yyyy, hh:mm a")}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const filteredQuotations = quotations?.filter(
    (quotation) =>
      search === "" ||
      quotation.customerName.toLowerCase().includes(search.toLowerCase()) ||
      quotation.quotationNumber.toLowerCase().includes(search.toLowerCase())
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quotations</h1>
          <p className="text-muted-foreground">Create and manage customer quotations</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingQuotation(null);
              form.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button data-testid="button-new-quotation">
              <Plus className="mr-2 h-4 w-4" />
              New Quotation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuotation ? "Edit Quotation" : "Create New Quotation"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Customer Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Customer name" data-testid="input-customer-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Phone number" data-testid="input-customer-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="customer@example.com" data-testid="input-customer-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Sender Location</h3>
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
                          <FormMessage />
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
                          <FormMessage />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Receiver Location</h3>
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
                          <FormMessage />
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
                          <FormMessage />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Package Details</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg) *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.1" placeholder="0.0" data-testid="input-weight" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numberOfPieces"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pieces</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              data-testid="input-pieces"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="declaredValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Declared Value</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0" data-testid="input-declared-value" />
                          </FormControl>
                          <FormMessage />
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
                          <Input {...field} placeholder="Describe contents" data-testid="input-content-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Service & Partner</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-service-type">
                                <SelectValue placeholder="Select service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="surface">Surface</SelectItem>
                              <SelectItem value="air">Air Express</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="courierPartnerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Courier Partner</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-courier-partner">
                                <SelectValue placeholder="Select partner (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {partners?.filter(p => p.isActive).map((partner) => (
                                <SelectItem key={partner.id} value={partner.id}>
                                  {partner.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Pricing</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="baseAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Amount</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0" data-testid="input-base-amount" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="additionalCharges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Charges</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0" data-testid="input-additional-charges" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="gstAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Amount</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0" data-testid="input-gst-amount" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="0" data-testid="input-total-amount" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Status & Validity</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="accepted">Accepted</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid Until</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" data-testid="input-valid-until" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional notes..." className="resize-none" data-testid="input-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingQuotation(null);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending} data-testid="button-save-quotation">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingQuotation ? "Update Quotation" : "Create Quotation"}
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
              placeholder="Search by customer name or quotation number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-quotations"
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
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : filteredQuotations && filteredQuotations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Share</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id} data-testid={`row-quotation-${quotation.id}`}>
                      <TableCell className="font-medium">{quotation.quotationNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{quotation.customerName}</div>
                          {quotation.customerPhone && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {quotation.customerPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{quotation.senderCity || "N/A"}</div>
                          <div className="text-muted-foreground">→ {quotation.receiverCity || "N/A"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(quotation.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[quotation.status]}>
                          {statusLabels[quotation.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {quotation.createdAt ? format(new Date(quotation.createdAt), "dd MMM yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleWhatsAppShare(quotation)}
                            title="Share via WhatsApp"
                            data-testid={`button-whatsapp-${quotation.id}`}
                          >
                            <SiWhatsapp className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEmailShare(quotation)}
                            title="Share via Email"
                            data-testid={`button-email-${quotation.id}`}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handlePrint(quotation)}
                            title="Print Quotation"
                            data-testid={`button-print-${quotation.id}`}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" data-testid={`button-actions-${quotation.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openEditDialog(quotation)}
                              data-testid={`button-edit-${quotation.id}`}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(quotation.id)}
                              className="text-destructive focus:text-destructive"
                              data-testid={`button-delete-${quotation.id}`}
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
            <div className="p-12 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No quotations found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {search ? "Try adjusting your search" : "Create your first quotation to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
