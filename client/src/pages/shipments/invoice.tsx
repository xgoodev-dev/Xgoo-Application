import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, AlertCircle, Printer, Share2, Mail } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { ShipmentWithRelations, Office, Invoice, Payment } from "@shared/schema";

interface InvoiceData {
  invoice: Invoice | null;
  shipment: ShipmentWithRelations;
  office: Office;
  payment: Payment | null;
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

export default function ShipmentInvoicePage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<InvoiceData>({
    queryKey: ["/api/shipments", params.id, "invoice"],
    queryFn: async () => {
      const response = await fetch(`/api/shipments/${params.id}/invoice`);
      if (!response.ok) {
        throw new Error("Failed to fetch invoice data");
      }
      return response.json();
    },
    enabled: !!params.id,
  });

  const handleBack = () => {
    setLocation("/shipments");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!data) return;
    const { shipment, office, invoice } = data;
    const invoiceNumber = invoice?.invoiceNumber || `INV-${shipment.bookingNumber}`;
    const message = `*Invoice: ${invoiceNumber}*

From: ${office.name}
Booking #: ${shipment.bookingNumber}
AWB: ${shipment.awbNumber || "N/A"}

Sender: ${shipment.senderName}
Receiver: ${shipment.receiverName}
Destination: ${shipment.receiverCity || ""}, ${shipment.receiverPincode || ""}

Total Amount: ${formatCurrency(shipment.totalAmount)}

View full invoice: ${window.location.href}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleEmailShare = () => {
    if (!data) return;
    const { shipment, office, invoice } = data;
    const invoiceNumber = invoice?.invoiceNumber || `INV-${shipment.bookingNumber}`;
    const subject = `Invoice ${invoiceNumber} - ${office.name}`;
    const body = `Invoice Details

Invoice Number: ${invoiceNumber}
From: ${office.name}
${office.address ? `Address: ${office.address}` : ""}
${office.gstNumber ? `GST: ${office.gstNumber}` : ""}

Booking Number: ${shipment.bookingNumber}
AWB Number: ${shipment.awbNumber || "N/A"}
Service Type: ${shipment.serviceType === "air" ? "Air" : "Surface"}

Sender: ${shipment.senderName}
Phone: ${shipment.senderPhone}
Address: ${shipment.senderAddress}${shipment.senderCity ? `, ${shipment.senderCity}` : ""}${shipment.senderPincode ? ` - ${shipment.senderPincode}` : ""}

Receiver: ${shipment.receiverName}
Phone: ${shipment.receiverPhone}
Address: ${shipment.receiverAddress}${shipment.receiverCity ? `, ${shipment.receiverCity}` : ""}${shipment.receiverPincode ? ` - ${shipment.receiverPincode}` : ""}

Weight: ${shipment.weight} kg
Pieces: ${shipment.numberOfPieces || 1}

Pricing:
Base Amount: ${formatCurrency(shipment.baseAmount)}
Additional Charges: ${formatCurrency(shipment.additionalCharges || 0)}
GST: ${formatCurrency(shipment.gstAmount || 0)}
Total: ${formatCurrency(shipment.totalAmount)}

View invoice online: ${window.location.href}`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center gap-4 mb-6 print:hidden">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back-loading">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex justify-center">
          <div className="w-full max-w-2xl border rounded-lg p-6 space-y-6 bg-card">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center gap-4 mb-6 print:hidden">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back-error">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load invoice</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Could not fetch invoice data"}
          </p>
          <Button onClick={handleBack} data-testid="button-return-shipments">
            Return to Shipments
          </Button>
        </div>
      </div>
    );
  }

  const { shipment, office, invoice, payment } = data;
  const invoiceNumber = invoice?.invoiceNumber || `INV-${shipment.bookingNumber}`;
  const invoiceDate = invoice?.invoiceDate || shipment.bookedAt;
  const paymentStatus = payment?.paymentStatus || "pending";
  const paymentMode = payment?.paymentMode || "N/A";

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden p-4 flex items-center gap-2 border-b bg-card flex-wrap">
        <Button variant="ghost" onClick={handleBack} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1" />
        <Button variant="outline" onClick={handleWhatsAppShare} data-testid="button-share-whatsapp">
          <SiWhatsapp className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>
        <Button variant="outline" onClick={handleEmailShare} data-testid="button-share-email">
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
        <Button onClick={handlePrint} data-testid="button-print">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      <div className="flex justify-center p-4 print:p-0">
        <div className="invoice-container w-full max-w-2xl bg-white text-black border print:border-0 rounded-lg print:rounded-none overflow-hidden">
          <div className="p-6 print:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-sm rounded">
                    XG
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">{office.name}</h1>
                  </div>
                </div>
                {office.address && (
                  <p className="text-sm text-gray-600">
                    {office.address}
                    {office.city && `, ${office.city}`}
                    {office.state && `, ${office.state}`}
                    {office.pincode && ` - ${office.pincode}`}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                  {office.phone && <span>Ph: {office.phone}</span>}
                  {office.email && <span>{office.email}</span>}
                </div>
                {office.gstNumber && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">GST:</span> {office.gstNumber}
                  </p>
                )}
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">{invoiceNumber}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Date: {invoiceDate ? format(new Date(invoiceDate), "dd MMM yyyy") : "-"}
                </p>
              </div>
            </div>

            <Separator className="my-4 bg-gray-300" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Sender (From)</h3>
                <p className="font-semibold">{shipment.senderName}</p>
                <p className="text-sm text-gray-700">{shipment.senderAddress}</p>
                <p className="text-sm text-gray-700">
                  {shipment.senderCity && <>{shipment.senderCity}</>}
                  {shipment.senderState && <>, {shipment.senderState}</>}
                  {shipment.senderPincode && <> - {shipment.senderPincode}</>}
                </p>
                <p className="text-sm text-gray-700 mt-1">Ph: {shipment.senderPhone}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Receiver (To)</h3>
                <p className="font-semibold">{shipment.receiverName}</p>
                <p className="text-sm text-gray-700">{shipment.receiverAddress}</p>
                <p className="text-sm text-gray-700">
                  {shipment.receiverCity && <>{shipment.receiverCity}</>}
                  {shipment.receiverState && <>, {shipment.receiverState}</>}
                  {shipment.receiverPincode && <> - {shipment.receiverPincode}</>}
                </p>
                <p className="text-sm text-gray-700 mt-1">Ph: {shipment.receiverPhone}</p>
              </div>
            </div>

            <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3 font-semibold">Shipment Details</th>
                    <th className="text-right p-3 font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-200">
                    <td className="p-3 text-gray-700">Booking Number</td>
                    <td className="p-3 text-right font-medium">{shipment.bookingNumber}</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="p-3 text-gray-700">AWB Number</td>
                    <td className="p-3 text-right font-medium">{shipment.awbNumber || "-"}</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="p-3 text-gray-700">Service Type</td>
                    <td className="p-3 text-right font-medium">
                      {shipment.serviceType === "air" ? "Air Express" : "Surface"}
                    </td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="p-3 text-gray-700">Weight</td>
                    <td className="p-3 text-right font-medium">{shipment.weight} kg</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="p-3 text-gray-700">Number of Pieces</td>
                    <td className="p-3 text-right font-medium">{shipment.numberOfPieces || 1}</td>
                  </tr>
                  {shipment.contentDescription && (
                    <tr className="border-t border-gray-200">
                      <td className="p-3 text-gray-700">Contents</td>
                      <td className="p-3 text-right font-medium">{shipment.contentDescription}</td>
                    </tr>
                  )}
                  {shipment.courierPartner && (
                    <tr className="border-t border-gray-200">
                      <td className="p-3 text-gray-700">Courier Partner</td>
                      <td className="p-3 text-right font-medium">{shipment.courierPartner.name}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3 font-semibold">Pricing</th>
                    <th className="text-right p-3 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-200">
                    <td className="p-3 text-gray-700">Base Amount</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(shipment.baseAmount)}</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="p-3 text-gray-700">Additional Charges</td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(shipment.additionalCharges || 0)}
                    </td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="p-3 text-gray-700">GST</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(shipment.gstAmount || 0)}</td>
                  </tr>
                  <tr className="border-t-2 border-gray-400 bg-gray-50">
                    <td className="p-3 font-bold text-gray-900">Total Amount</td>
                    <td className="p-3 text-right font-bold text-lg">{formatCurrency(shipment.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg print:bg-gray-100">
              <div>
                <span className="text-sm text-gray-600">Payment Status:</span>
                <span className="ml-2">
                  {paymentStatus === "completed" ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>
                  ) : paymentStatus === "failed" ? (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>
                  )}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Payment Mode: <span className="font-medium capitalize">{paymentMode.replace("_", " ")}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>Thank you for choosing {office.name}!</p>
              <p className="mt-1">This is a computer-generated invoice.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .invoice-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
