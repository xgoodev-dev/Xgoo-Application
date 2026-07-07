import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { Package, Plus, Search, Receipt, Printer, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { ShipmentWithRelations } from "@shared/schema";

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function DocumentsInvoicesTab() {
  const [search, setSearch] = useState("");

  const { data: shipments, isLoading } = useQuery<ShipmentWithRelations[]>({
    queryKey: ["/api/shipments"],
  });

  const filtered = (shipments || []).filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.bookingNumber?.toLowerCase().includes(q) ||
      s.awbNumber?.toLowerCase().includes(q) ||
      s.senderName?.toLowerCase().includes(q) ||
      s.receiverName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Generate invoices, print customer bills, and download PDF copies.
        </p>
        <Button variant="outline" asChild>
          <Link href="/bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by booking, AWB, or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-invoice-search"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking #</TableHead>
                    <TableHead>AWB</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((shipment) => (
                    <TableRow key={shipment.id} data-testid={`row-invoice-shipment-${shipment.id}`}>
                      <TableCell className="font-medium">{shipment.bookingNumber}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {shipment.awbNumber || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{shipment.senderName}</div>
                        <div className="text-xs text-muted-foreground">{shipment.senderCity || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{shipment.receiverName}</div>
                        <div className="text-xs text-muted-foreground">{shipment.receiverCity || "—"}</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(shipment.totalAmount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {shipment.bookedAt
                          ? format(new Date(shipment.bookedAt), "dd MMM yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          <Button variant="default" size="sm" asChild>
                            <Link href={`/shipments/${shipment.id}/bill`}>
                              <FileText className="mr-1.5 h-4 w-4" />
                              Bill
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/shipments/${shipment.id}/invoice`}>
                              <Receipt className="mr-1.5 h-4 w-4" />
                              Invoice
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild title="Download invoice PDF">
                            <Link href={`/shipments/${shipment.id}/invoice?download=1`}>
                              <Download className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild title="Print label">
                            <Link href={`/shipments/${shipment.id}/label`}>
                              <Printer className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-1">No shipments to invoice</h3>
              <p className="text-muted-foreground mb-4">
                {search
                  ? "Try a different search term"
                  : "Create a booking first, then generate an invoice from here"}
              </p>
              {!search && (
                <Button asChild>
                  <Link href="/bookings/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Booking
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
