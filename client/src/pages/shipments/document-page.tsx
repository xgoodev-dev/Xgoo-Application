import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { ShipmentWithRelations, Office, Invoice, Payment } from "@shared/schema";
import { XgooShippingDocument, DocumentPrintStyles } from "@/components/documents/XgooShippingDocument";
import { DocumentActionBar } from "@/components/documents/DocumentActionBar";
import {
  getOfficeDocumentSettings,
  shipmentToDocument,
  formatDocCurrency,
} from "@/lib/document-utils";

interface InvoiceData {
  invoice: Invoice | null;
  shipment: ShipmentWithRelations;
  office: Office;
  payment: Payment | null;
}

export type ShipmentDocKind = "invoice" | "bill";

interface ShipmentDocumentPageProps {
  docKind: ShipmentDocKind;
}

function useQueryParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

export function ShipmentDocumentPage({ docKind }: ShipmentDocumentPageProps) {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const searchParams = useQueryParams();
  const autoprint = searchParams.get("autoprint") === "1";
  const autodownload = searchParams.get("download") === "1";

  const { data, isLoading, error } = useQuery<InvoiceData>({
    queryKey: ["/api/shipments", params.id, "invoice"],
    enabled: !!params.id,
  });

  const isBill = docKind === "bill";

  useEffect(() => {
    if (!data || isLoading) return;
    if (autoprint) {
      const timer = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timer);
    }
  }, [data, isLoading, autoprint]);

  useEffect(() => {
    if (!data || isLoading || !autodownload) return;
    const timer = setTimeout(async () => {
      const { downloadDocumentAsPdf } = await import("@/lib/document-pdf");
      const serial =
        data.shipment.bookingNumber ||
        data.invoice?.invoiceNumber ||
        data.shipment.id.slice(0, 8);
      const prefix = isBill ? "Bill" : "Invoice";
      try {
        await downloadDocumentAsPdf(`${prefix}-${serial}.pdf`);
      } catch {
        /* user can retry from toolbar */
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [data, isLoading, autodownload, isBill]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-[600px] w-full max-w-3xl mx-auto" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Failed to load {isBill ? "bill" : "invoice"}
        </h2>
        <Button onClick={() => setLocation("/shipments")}>Return to Shipments</Button>
      </div>
    );
  }

  const { shipment, office, invoice } = data;
  const settings = getOfficeDocumentSettings(office);
  const serialNumber =
    shipment.bookingNumber ||
    invoice?.invoiceNumber ||
    `${isBill ? "BILL" : "INV"}-${shipment.id.slice(0, 8)}`;
  const document = shipmentToDocument(shipment, office, serialNumber, settings, docKind);
  const shareText = `${document.title} ${serialNumber}\nTotal: ${formatDocCurrency(document.totalAmount)}\n${window.location.href}`;
  const filePrefix = isBill ? "Bill" : "Invoice";

  return (
    <div className="min-h-screen bg-muted/30">
      <DocumentPrintStyles />
      <DocumentActionBar
        backLabel={isBill ? "Back" : "Back"}
        onBack={() => setLocation("/documents")}
        shareText={shareText}
        downloadFilename={`${filePrefix}-${serialNumber}.pdf`}
        printLabel={isBill ? "Print Bill" : "Print"}
      />
      {isBill && autoprint && (
        <div className="print:hidden bg-primary/10 border-b border-primary/20 px-4 py-2 text-center text-sm">
          Booking confirmed — print this bill and hand it to the customer.
        </div>
      )}
      <div className="flex justify-center p-4 print:p-0">
        <XgooShippingDocument office={office} settings={settings} document={document} />
      </div>
    </div>
  );
}

export default function ShipmentInvoicePage() {
  return <ShipmentDocumentPage docKind="invoice" />;
}
