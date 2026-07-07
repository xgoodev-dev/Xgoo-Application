import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { Office, Quotation } from "@shared/schema";
import { XgooShippingDocument, DocumentPrintStyles } from "@/components/documents/XgooShippingDocument";
import { DocumentActionBar } from "@/components/documents/DocumentActionBar";
import {
  getOfficeDocumentSettings,
  quotationToDocument,
  formatDocCurrency,
} from "@/lib/document-utils";

export default function QuotationDocumentPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: quotation, isLoading: qLoading, error: qError } = useQuery<Quotation>({
    queryKey: ["/api/quotations", params.id],
    enabled: !!params.id,
  });

  const { data: office, isLoading: oLoading } = useQuery<Office>({
    queryKey: ["/api/office"],
  });

  const isLoading = qLoading || oLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-[600px] w-full max-w-3xl mx-auto" />
      </div>
    );
  }

  if (qError || !quotation || !office) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load quotation</h2>
        <Button onClick={() => setLocation("/documents/quotations")}>Back to Quotations</Button>
      </div>
    );
  }

  const settings = getOfficeDocumentSettings(office);
  const document = quotationToDocument(quotation, office, settings);
  const shareText = `${document.title} ${document.serialNumber}\nTotal: ${formatDocCurrency(document.totalAmount)}\n${window.location.href}`;

  return (
    <div className="min-h-screen bg-muted/30">
      <DocumentPrintStyles />
      <DocumentActionBar
        onBack={() => setLocation("/documents/quotations")}
        shareText={shareText}
        downloadFilename={`Quotation-${document.serialNumber}.pdf`}
      />

      <div className="flex justify-center p-4 print:p-0">
        <XgooShippingDocument office={office} settings={settings} document={document} />
      </div>
    </div>
  );
}
