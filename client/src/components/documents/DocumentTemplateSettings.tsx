import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import type { Office } from "@shared/schema";
import { documentSettingsSchema, DEFAULT_DOCUMENT_SETTINGS, type DocumentSettings } from "@shared/document-template";
import { mergeDocumentSettings } from "@shared/document-template";
import { XgooShippingDocument } from "@/components/documents/XgooShippingDocument";
import type { XgooDocumentData } from "@shared/document-template";

const SAMPLE_DOCUMENT: XgooDocumentData = {
  kind: "invoice",
  title: "Receipt",
  serialNumber: "XGC9000521",
  date: new Date(),
  awbNumber: "AWB123456789",
  consigner: {
    name: "VRUSHABH GARUD",
    lines: ["GHANDHINAGAR - 382421", "GUJARAT"],
  },
  consignee: {
    name: "VRUSHABH GARUD",
    lines: ["GHANDHINAGAR - 382421", "GUJARAT"],
  },
  courierScope: "domestic",
  packageType: "non_dox",
  packageLine: { count: 2, description: "24KgX100", amount: 2400 },
  packageLines: [
    {
      count: 2,
      description: "Clothes · 45x30x54 CMS",
      amount: 2400,
      weight: 24,
      dimensions: "45x30x54 CMS",
      content: "Clothes",
      declaredValue: 5000,
    },
  ],
  subtotal: 2400,
  gstRate: 18,
  gstAmount: 432,
  totalAmount: 2832,
};

export function DocumentTemplateSettings({ office }: { office: Office }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DocumentSettings>({
    resolver: zodResolver(documentSettingsSchema),
    defaultValues: DEFAULT_DOCUMENT_SETTINGS,
  });

  useEffect(() => {
    const merged = mergeDocumentSettings((office as Office & { documentSettings?: unknown }).documentSettings);
    form.reset(merged);
  }, [office, form]);

  const saveMutation = useMutation({
    mutationFn: async (settings: DocumentSettings) => {
      return apiRequest("PATCH", `/api/office/${office.id}`, { documentSettings: settings });
    },
    onSuccess: () => {
      toast({ title: "Template saved", description: "Invoice & quotation layout updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/office"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const values = form.watch();
  const previewDoc: XgooDocumentData = {
    ...SAMPLE_DOCUMENT,
    title: values.invoiceTitle || SAMPLE_DOCUMENT.title,
    gstRate: values.gstRate ?? 18,
    gstAmount: Math.round(SAMPLE_DOCUMENT.subtotal * (values.gstRate ?? 18)) / 100,
    totalAmount: SAMPLE_DOCUMENT.subtotal + Math.round(SAMPLE_DOCUMENT.subtotal * (values.gstRate ?? 18)) / 100,
    courierScope: values.defaultCourierScope || "domestic",
    packageType: values.defaultPackageType || "non_dox",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice &amp; Quotation Template
          </CardTitle>
          <CardDescription>
            Customize the XGoo shipping receipt layout for invoices, customer bills, and quotations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="invoiceTitle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice / Receipt Title</FormLabel>
                    <FormControl><Input {...field} placeholder="Receipt" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="billTitle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Bill Title</FormLabel>
                    <FormControl><Input {...field} placeholder="Booking Bill" /></FormControl>
                    <FormDescription>Printed and handed to customer at booking</FormDescription>
                  </FormItem>
                )} />
                <FormField control={form.control} name="quotationTitle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quotation Title</FormLabel>
                    <FormControl><Input {...field} placeholder="Quotation" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="serialPrefix" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Prefix</FormLabel>
                    <FormControl><Input {...field} placeholder="XGC" /></FormControl>
                    <FormDescription>Prepended to booking numbers when needed</FormDescription>
                  </FormItem>
                )} />
                <FormField control={form.control} name="gstRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="contactEmail" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl><Input {...field} type="email" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="website" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="brandColor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Color</FormLabel>
                    <FormControl><Input {...field} type="color" className="h-10 w-20 p-1" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="defaultCourierScope" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Courier Scope</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="domestic">Domestic</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="defaultPackageType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Package Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="dox">DOX (Documents)</SelectItem>
                        <SelectItem value="non_dox">NON DOX</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="termsAndConditions" render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms &amp; Conditions</FormLabel>
                  <FormControl><Textarea {...field} rows={3} className="resize-none" /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="contactNotice" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Notice</FormLabel>
                  <FormControl><Textarea {...field} rows={2} className="resize-none" /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="footerNote" render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Note (optional)</FormLabel>
                  <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="showSignatures" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Show signature blocks</FormLabel>
                    <FormDescription>Display sender &amp; receiver signature lines on print</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Template Settings
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live Preview</CardTitle>
          <CardDescription>Sample receipt using your current template settings</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto bg-muted/30 p-4 rounded-lg">
          <XgooShippingDocument office={office} settings={values} document={previewDoc} />
        </CardContent>
      </Card>
    </div>
  );
}
