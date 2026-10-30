import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ClipboardList, Clock, Eye, Loader2, MapPin, PackagePlus, Search, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  BOOKING_FUNNEL_LABELS,
  bookingFunnel,
  bookingRequestToNewBookingHref,
  isCustomerBookingOrder,
} from "@/lib/booking-orders";
import type { EnquiryWithQuote } from "@/lib/enquiry-quote";
import type { CourierPartner } from "@shared/schema";

const pickupJobLabels: Record<string, string> = {
  unassigned: "Needs partner",
  assigned: "Assigned",
  accepted: "Accepted",
  en_route: "En route",
  arrived: "Arrived",
  inspected: "Inspected",
  quote_sent: "Quote sent",
  quote_accepted: "Quote accepted",
  packed: "Packed",
  at_hub: "At XGoo store",
  awb_created: "AWB created",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
};

function formatInr(amount: string | number) {
  const value = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (!Number.isFinite(value)) return `₹${amount}`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function DetailLine({ label, value }: { label: string; value?: string | number | null }) {
  const text = value == null || String(value).trim() === "" ? "—" : String(value);
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 text-sm sm:grid-cols-[9.5rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-line break-words font-medium">{text}</dd>
    </div>
  );
}

function partyAddress(request: EnquiryWithQuote, party: "sender" | "receiver") {
  const line2 = party === "sender" ? request.senderAddressLine2 : request.receiverAddressLine2;
  const city = party === "sender" ? request.senderCity : request.receiverCity;
  const state = party === "sender" ? request.senderState : request.receiverState;
  const pin = party === "sender" ? request.senderPincode : request.receiverPincode;
  const line1 = party === "sender" ? request.senderAddress : request.receiverAddress;
  return [line1, line2, [city, state].filter(Boolean).join(", "), pin].filter(Boolean).join("\n");
}

export default function BookingsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [funnelFilter, setFunnelFilter] = useState<"all" | "go" | "pro" | "in_store" | "website">("all");
  const [partnerByRequest, setPartnerByRequest] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<EnquiryWithQuote | null>(null);

  const { data: requests, isLoading } = useQuery<EnquiryWithQuote[]>({
    queryKey: ["/api/booking-requests"],
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
  });
  const { data: partners } = useQuery<CourierPartner[]>({
    queryKey: ["/api/partners"],
  });

  const activePartners = (partners || []).filter((partner) => partner.isActive !== false);

  const bookings = useMemo(() => {
    return (requests || [])
      .filter((request) => isCustomerBookingOrder(request))
      .filter((request) => request.status !== "rejected")
      .filter((request) => {
        if (funnelFilter !== "all" && bookingFunnel(request) !== funnelFilter) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          request.requestNumber.toLowerCase().includes(q) ||
          request.senderName.toLowerCase().includes(q) ||
          request.receiverName.toLowerCase().includes(q) ||
          request.senderPhone.includes(q) ||
          (request.xgooOrderId || "").toLowerCase().includes(q)
        );
      });
  }, [requests, funnelFilter, search]);

  useEffect(() => {
    if (!selected) return;
    const next = (requests || []).find((request) => request.id === selected.id);
    if (next) setSelected(next);
  }, [requests, selected]);

  const openBooking = (request: EnquiryWithQuote) => {
    const partnerId = partnerByRequest[request.id] || "";
    if (request.convertedShipmentId) {
      navigate(`/shipments/${request.convertedShipmentId}`);
      return;
    }
    navigate(bookingRequestToNewBookingHref(request, partnerId || undefined));
  };

  const markReviewed = useMutation({
    mutationFn: async (id: string) => apiRequest("PATCH", `/api/booking-requests/${id}/status`, { status: "reviewed" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/booking-requests"] }),
    onError: (error: Error) => toast({ title: "Could not update booking", description: error.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">
            Customer orders from XGoo Go, XGoo Pro, and In Store. Pick a courier, then book in that partner.
          </p>
        </div>
        <Button asChild data-testid="button-new-booking-from-list">
          <Link href="/bookings/new">
            <PackagePlus className="mr-2 h-4 w-4" />
            New walk-in booking
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search AWB request, sender, or phone"
                className="pl-9"
                data-testid="input-bookings-search"
              />
            </div>
            <Select value={funnelFilter} onValueChange={(value) => setFunnelFilter(value as typeof funnelFilter)}>
              <SelectTrigger className="w-full sm:w-44" data-testid="select-booking-funnel">
                <SelectValue placeholder="All funnels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All funnels</SelectItem>
                <SelectItem value="go">XGoo Go</SelectItem>
                <SelectItem value="pro">XGoo Pro</SelectItem>
                <SelectItem value="in_store">In Store</SelectItem>
                <SelectItem value="website">Store link</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-medium">No customer bookings</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Orders from Go, Pro, and store QR appear here. Walk-in bookings start from New Booking.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Funnel</TableHead>
                    <TableHead>From → To</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead className="w-[1%]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((request) => {
                    const funnel = bookingFunnel(request);
                    const booked = Boolean(request.convertedShipmentId);
                    return (
                      <TableRow
                        key={request.id}
                        className="cursor-pointer"
                        data-testid={`row-booking-${request.id}`}
                        onClick={() => setSelected(request)}
                      >
                        <TableCell>
                          <p className="font-medium">{request.xgooOrderId || request.requestNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {request.createdAt ? format(new Date(request.createdAt), "dd MMM, HH:mm") : "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{BOOKING_FUNNEL_LABELS[funnel]}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{request.senderName}</p>
                          <p className="text-xs text-muted-foreground">
                            {request.senderCity || "—"} → {request.receiverName} · {request.receiverCity || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm">
                          {request.weight ? `${request.weight} kg` : "—"} · {request.numberOfPieces || 1} pcs
                          {request.contentDescription ? (
                            <span className="block max-w-[180px] truncate text-xs text-muted-foreground">
                              {request.contentDescription}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell onClick={(event) => event.stopPropagation()}>
                          {booked ? (
                            <span className="text-sm text-muted-foreground">Already a shipment</span>
                          ) : (
                            <Select
                              value={partnerByRequest[request.id] || ""}
                              onValueChange={(value) =>
                                setPartnerByRequest((prev) => ({ ...prev, [request.id]: value }))
                              }
                            >
                              <SelectTrigger className="w-[180px]" data-testid={`select-booking-partner-${request.id}`}>
                                <SelectValue placeholder="Select courier" />
                              </SelectTrigger>
                              <SelectContent>
                                {activePartners.map((partner) => (
                                  <SelectItem key={partner.id} value={partner.id}>
                                    {partner.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelected(request)}
                              data-testid={`button-view-booking-${request.id}`}
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              View
                            </Button>
                            {booked ? (
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/shipments/${request.convertedShipmentId}`}>Shipment</Link>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (!partnerByRequest[request.id] && activePartners.length > 0) {
                                    toast({
                                      title: "Select a courier partner",
                                      description: "Choose who will move this booking, then book in that partner.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  if (request.status === "pending") {
                                    markReviewed.mutate(request.id);
                                  }
                                  openBooking(request);
                                }}
                                data-testid={`button-book-order-${request.id}`}
                              >
                                {markReviewed.isPending ? (
                                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Truck className="mr-1 h-3.5 w-3.5" />
                                )}
                                Book
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>Booking details</DialogTitle>
                <DialogDescription>
                  {selected.xgooOrderId || selected.requestNumber} · {BOOKING_FUNNEL_LABELS[bookingFunnel(selected)]}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{selected.status}</Badge>
                  <Badge variant="outline">
                    {selected.shipmentType === "international"
                      ? `International${selected.destinationCountry ? ` · ${selected.destinationCountry}` : ""}`
                      : "Domestic"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selected.createdAt ? format(new Date(selected.createdAt), "PPP 'at' p") : "—"}
                  </span>
                </div>

                {(selected.pickupJob || selected.quotation) ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selected.pickupJob ? (
                      <section className="space-y-2 rounded-md border p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pickup job</h3>
                        <dl className="space-y-2">
                          <DetailLine label="Partner" value={selected.pickupJob.partnerName} />
                          <DetailLine
                            label="Status"
                            value={pickupJobLabels[selected.pickupJob.status] || selected.pickupJob.status}
                          />
                        </dl>
                      </section>
                    ) : null}
                    {selected.quotation ? (
                      <section className="space-y-2 rounded-md border p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quotation</h3>
                        <dl className="space-y-2">
                          <DetailLine label="Quote no." value={selected.quotation.quotationNumber} />
                          <DetailLine label="Amount" value={formatInr(selected.quotation.totalAmount)} />
                          <DetailLine label="Customer" value={selected.quotation.status} />
                        </dl>
                      </section>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-6 sm:grid-cols-2">
                  <section className="space-y-3 rounded-md border p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Shipper</h3>
                    <dl className="space-y-2">
                      <DetailLine label="Name" value={selected.senderName} />
                      <DetailLine label="Phone" value={selected.senderPhone} />
                      <DetailLine label="Email" value={selected.senderEmail} />
                      <DetailLine label="Address" value={partyAddress(selected, "sender")} />
                    </dl>
                  </section>
                  <section className="space-y-3 rounded-md border p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Consignee</h3>
                    <dl className="space-y-2">
                      <DetailLine label="Name" value={selected.receiverName} />
                      <DetailLine label="Phone" value={selected.receiverPhone} />
                      <DetailLine label="Address" value={partyAddress(selected, "receiver")} />
                    </dl>
                  </section>
                </div>

                <section className="space-y-3 rounded-md border p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Package</h3>
                  <dl className="grid gap-2 sm:grid-cols-2">
                    <DetailLine label="Weight" value={selected.weight ? `${selected.weight} kg` : null} />
                    <DetailLine label="Pieces" value={selected.numberOfPieces || 1} />
                    <DetailLine
                      label="Dimensions"
                      value={
                        selected.packageLength || selected.packageWidth || selected.packageHeight
                          ? `${[selected.packageLength, selected.packageWidth, selected.packageHeight].filter(Boolean).join(" × ")} cm`
                          : null
                      }
                    />
                    <DetailLine label="Value" value={selected.declaredValue ? `₹${selected.declaredValue}` : null} />
                    <div className="sm:col-span-2">
                      <DetailLine label="Contents" value={selected.contentDescription} />
                    </div>
                    {selected.packageItems?.length ? (
                      <div className="sm:col-span-2">
                        <DetailLine label="Items" value={selected.packageItems.join(", ")} />
                      </div>
                    ) : null}
                  </dl>
                </section>

                <section className="space-y-3 rounded-md border p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Service</h3>
                  <dl className="grid gap-2 sm:grid-cols-2">
                    <DetailLine label="Type" value={selected.serviceType || "surface"} />
                    <DetailLine label="Preference" value={selected.courierPreference} />
                    <DetailLine label="Pickup" value={selected.pickupLocationName} />
                    <DetailLine
                      label="Slot"
                      value={[selected.pickupDate, selected.pickupTimeSlot?.replace("-", " – ")].filter(Boolean).join(" · ")}
                    />
                  </dl>
                  {selected.pickupLat && selected.pickupLng ? (
                    <a
                      href={`https://www.google.com/maps?q=${selected.pickupLat},${selected.pickupLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Open pickup on map
                    </a>
                  ) : null}
                  {selected.notes ? (
                    <p className="flex items-start gap-2 text-sm">
                      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      {selected.notes}
                    </p>
                  ) : null}
                </section>

                {selected.packagePhotoUrls?.length ? (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Photos</h3>
                    <div className="flex flex-wrap gap-2">
                      {selected.packagePhotoUrls.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt="Package" className="h-24 w-24 rounded-md object-cover" />
                        </a>
                      ))}
                    </div>
                  </section>
                ) : null}

                <Separator />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  {selected.convertedShipmentId ? (
                    <Button asChild>
                      <Link href={`/shipments/${selected.convertedShipmentId}`}>Open shipment</Link>
                    </Button>
                  ) : (
                    <>
                      <div className="w-full space-y-2 sm:max-w-xs">
                        <p className="text-sm font-medium">Courier partner</p>
                        <Select
                          value={partnerByRequest[selected.id] || ""}
                          onValueChange={(value) =>
                            setPartnerByRequest((prev) => ({ ...prev, [selected.id]: value }))
                          }
                        >
                          <SelectTrigger data-testid="select-detail-booking-partner">
                            <SelectValue placeholder="Select courier" />
                          </SelectTrigger>
                          <SelectContent>
                            {activePartners.map((partner) => (
                              <SelectItem key={partner.id} value={partner.id}>
                                {partner.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={() => {
                          if (!partnerByRequest[selected.id] && activePartners.length > 0) {
                            toast({
                              title: "Select a courier partner",
                              description: "Choose who will move this booking, then book in that partner.",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (selected.status === "pending") markReviewed.mutate(selected.id);
                          openBooking(selected);
                        }}
                        data-testid="button-book-from-details"
                      >
                        <Truck className="mr-2 h-4 w-4" />
                        Book
                        {partnerByRequest[selected.id]
                          ? ` in ${activePartners.find((partner) => partner.id === partnerByRequest[selected.id])?.name || "partner"}`
                          : ""}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
