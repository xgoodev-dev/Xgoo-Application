import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Inbox,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  MapPin,
  Clock,
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
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { quotationForEnquiry, type EnquiryWithQuote } from "@/lib/enquiry-quote";
import type { BookingRequest, PickupPartner, Quotation } from "@shared/schema";

type EnquiryRow = EnquiryWithQuote;

type EnquiryChannel = "go" | "website" | "walkin" | "call" | "whatsapp" | "pro" | "other";

const statusColors: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-zinc-800 dark:text-zinc-200 dark:border dark:border-zinc-700",
  reviewed:
    "bg-blue-100 text-blue-700 dark:bg-zinc-800 dark:text-blue-400 dark:border dark:border-zinc-700",
  approved:
    "bg-green-100 text-green-700 dark:bg-zinc-800 dark:text-green-400 dark:border dark:border-zinc-700",
  rejected:
    "bg-red-100 text-red-700 dark:bg-zinc-800 dark:text-red-400 dark:border dark:border-zinc-700",
  converted:
    "bg-purple-100 text-purple-700 dark:bg-zinc-800 dark:text-purple-300 dark:border dark:border-zinc-700",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  approved: "Approved",
  rejected: "Rejected",
  converted: "Converted",
};

const quoteStatusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Waiting for customer",
  accepted: "Customer approved",
  rejected: "Customer declined",
  expired: "Expired",
};

function formatQuoteAmount(amount: string | number) {
  const value = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (!Number.isFinite(value)) return `₹${amount}`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

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

const sourceLabels: Record<string, string> = {
  mobile_android: "XGoo Go (Android)",
  mobile_ios: "XGoo Go (iOS)",
  mobile_app: "XGoo Go",
  whatsapp: "WhatsApp",
  in_store: "Walk-in",
  phone: "Call",
  partner_api: "Partner API",
  customer_portal: "XGoo Go / Pro",
  website: "Website",
  staff_portal: "Walk-in",
  api: "API",
  legacy: "Legacy",
  b2b_daily: "XGoo Pro",
};

const channelLabels: Record<EnquiryChannel, string> = {
  go: "XGoo Go",
  website: "Website",
  walkin: "Walk-in",
  call: "Call",
  whatsapp: "WhatsApp",
  pro: "XGoo Pro",
  other: "Other",
};

function enquiryChannel(request: BookingRequest): EnquiryChannel {
  switch (request.source) {
    case "mobile_android":
    case "mobile_ios":
    case "mobile_app":
    case "customer_portal":
      return "go";
    case "website":
      return "website";
    case "in_store":
    case "staff_portal":
      return "walkin";
    case "phone":
      return "call";
    case "whatsapp":
      return "whatsapp";
    case "b2b_daily":
      return "pro";
    case "legacy":
      return request.customerUserId ? "go" : "other";
    case "partner_api":
    case "api":
      return "other";
    default:
      return "other";
  }
}

function enquirySourceLabel(request: BookingRequest) {
  if (request.source === "legacy" && request.customerUserId) {
    return "XGoo Go / Pro";
  }
  return sourceLabels[request.source] || channelLabels[enquiryChannel(request)];
}

function assignablePartners(partners: PickupPartner[], enquiry: EnquiryRow) {
  return partners.filter(
    (partner) =>
      partner.status === "active" &&
      (!enquiry.branchId || !partner.branchId || partner.branchId === enquiry.branchId),
  );
}

export default function EnquiriesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState<EnquiryChannel | "all">("all");
  const [selectedRequest, setSelectedRequest] = useState<EnquiryRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: pickupPartners = [] } = useQuery<PickupPartner[]>({
    queryKey: ["/api/pickup-partners"],
  });
  const { data: quotations = [] } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });

  const { data: bookingRequests, isLoading, isFetching, refetch } = useQuery<EnquiryRow[]>({
    queryKey: ["/api/booking-requests"],
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    refetchInterval: 15_000,
  });

  const enquiryRows = (bookingRequests || []).map((request) => ({
    ...request,
    quotation: quotationForEnquiry(request, quotations),
  }));

  useEffect(() => {
    if (!selectedRequest) return;
    const next = enquiryRows.find((request) => request.id === selectedRequest.id);
    if (!next) return;
    if (
      next.status !== selectedRequest.status ||
      next.pickupJob?.partnerId !== selectedRequest.pickupJob?.partnerId ||
      next.pickupJob?.status !== selectedRequest.pickupJob?.status ||
      next.quotation?.status !== selectedRequest.quotation?.status ||
      next.quotation?.totalAmount !== selectedRequest.quotation?.totalAmount
    ) {
      setSelectedRequest(next);
    }
  }, [enquiryRows, selectedRequest]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/booking-requests/${id}/status`, { status });
    },
    onSuccess: (_, variables) => {
      const statusMsg = variables.status === "approved" ? "approved" : "rejected";
      toast({
        title: "Enquiry updated",
        description: `This enquiry has been ${statusMsg}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/booking-requests"] });
      setIsDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Could not update enquiry",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const reassignMutation = useMutation({
    mutationFn: async ({ id, partnerId }: { id: string; partnerId?: string }) =>
      apiRequest("POST", `/api/booking-requests/${id}/assign-partner`, partnerId ? { partnerId } : {}),
    onSuccess: () => {
      toast({ title: "Pickup partner assigned", description: "This enquiry is now with the selected partner." });
      queryClient.invalidateQueries({ queryKey: ["/api/booking-requests"] });
    },
    onError: (error: Error) =>
      toast({ title: "Could not assign partner", description: error.message, variant: "destructive" }),
  });

  const handleViewDetails = (request: EnquiryRow) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const handleApprove = (request: EnquiryRow) => {
    const params = new URLSearchParams({
      senderName: request.senderName,
      senderPhone: request.senderPhone,
      senderEmail: request.senderEmail || "",
      senderAddress: request.senderAddress,
      senderCity: request.senderCity || "",
      senderState: request.senderState || "",
      senderPincode: request.senderPincode || "",
      receiverName: request.receiverName,
      receiverPhone: request.receiverPhone,
      receiverAddress: request.receiverAddress,
      receiverCity: request.receiverCity || "",
      receiverState: request.receiverState || "",
      receiverPincode: request.receiverPincode || "",
      weight: request.weight || "",
      numberOfPieces: String(request.numberOfPieces || 1),
      contentDescription: request.contentDescription || "",
      length: request.packageLength || "",
      width: request.packageWidth || "",
      height: request.packageHeight || "",
      declaredValue: request.declaredValue || "",
      serviceType: request.serviceType || "surface",
      bookingRequestId: request.id,
    });

    updateStatusMutation.mutate(
      { id: request.id, status: "approved" },
      {
        onSuccess: () => {
          navigate(`/bookings/new?${params.toString()}`);
        },
      },
    );
  };

  const handleReject = (request: BookingRequest) => {
    updateStatusMutation.mutate({ id: request.id, status: "rejected" });
  };

  const filteredRequests = enquiryRows.filter((request) => {
    const matchesSearch =
      search === "" ||
      request.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
      request.senderName.toLowerCase().includes(search.toLowerCase()) ||
      request.receiverName.toLowerCase().includes(search.toLowerCase()) ||
      request.senderPhone.includes(search) ||
      request.receiverPhone.includes(search);

    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesChannel = channelFilter === "all" || enquiryChannel(request) === channelFilter;

    return matchesSearch && matchesStatus && matchesChannel;
  });

  const canAssign = (request: EnquiryRow) =>
    request.status !== "converted" && request.status !== "rejected";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Enquiries
          </h1>
          <p className="text-muted-foreground">
            Every new enquiry from XGoo Go, the website, walk-in, call, WhatsApp, and XGoo Pro. Open one to see
            the full details and assign a pickup partner.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void refetch()}
          disabled={isFetching}
          data-testid="button-refresh-enquiries"
        >
          {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search enquiry #, sender, receiver, phone..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                data-testid="input-search-enquiries"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={channelFilter}
                onValueChange={(value) => setChannelFilter(value as EnquiryChannel | "all")}
              >
                <SelectTrigger className="w-[170px]" data-testid="select-channel-filter">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  <SelectItem value="go">XGoo Go</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="walkin">Walk-in</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="pro">XGoo Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : filteredRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enquiry #</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pickup partner</TableHead>
                    <TableHead>Quote</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="cursor-pointer"
                      data-testid={`row-enquiry-${request.id}`}
                      onClick={() => handleViewDetails(request)}
                    >
                      <TableCell className="font-medium">{request.requestNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">{request.senderName}</div>
                          <div className="text-xs text-muted-foreground">{request.senderCity || "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">{request.receiverName}</div>
                          <div className="text-xs text-muted-foreground">{request.receiverCity || "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "whitespace-nowrap",
                            request.source === "b2b_daily" && "border-[#FF4907] text-[#FF4907]",
                          )}
                        >
                          {enquirySourceLabel(request)}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        <div className="space-y-1">
                          <div>{request.serviceType || "surface"}</div>
                          <Badge variant="secondary" className="whitespace-nowrap capitalize">
                            {request.shipmentType === "international" ? "International" : "Domestic"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[request.status]}>
                          {statusLabels[request.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.pickupJob ? (
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {request.pickupJob.partnerName || "Unassigned"}
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                request.pickupJob.status === "unassigned"
                                  ? "border-amber-500 text-amber-700"
                                  : ""
                              }
                            >
                              {pickupJobLabels[request.pickupJob.status] || request.pickupJob.status}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {request.quotation ? (
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {formatQuoteAmount(request.quotation.totalAmount)}
                            </div>
                            <Badge variant="outline">
                              {quoteStatusLabels[request.quotation.status] || request.quotation.status}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not sent</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {request.createdAt ? format(new Date(request.createdAt), "dd MMM, HH:mm") : "-"}
                      </TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${request.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(request)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                            {request.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => handleApprove(request)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve & convert
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleReject(request)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No enquiries</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {search || statusFilter !== "all" || channelFilter !== "all"
                  ? "No enquiries match your search"
                  : "New enquiries from Go, website, walk-in, and call will appear here"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enquiry details</DialogTitle>
            <DialogDescription>Enquiry #{selectedRequest?.requestNumber}</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={statusColors[selectedRequest.status]}>
                  {statusLabels[selectedRequest.status]}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(selectedRequest.source === "b2b_daily" && "border-[#FF4907] text-[#FF4907]")}
                >
                  {channelLabels[enquiryChannel(selectedRequest)]} · {enquirySourceLabel(selectedRequest)}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {selectedRequest.shipmentType === "international" ? "International" : "Domestic"}
                  {selectedRequest.shipmentType === "international" && selectedRequest.destinationCountry
                    ? ` · ${selectedRequest.destinationCountry}`
                    : ""}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Received{" "}
                  {selectedRequest.createdAt
                    ? format(new Date(selectedRequest.createdAt), "PPP 'at' p")
                    : "-"}
                </span>
              </div>

              {canAssign(selectedRequest) ? (
                <div className="space-y-2 rounded-lg border p-3">
                  <Label>Assign pickup partner</Label>
                  <Select
                    value={selectedRequest.pickupJob?.partnerId || "unassigned"}
                    onValueChange={(value) =>
                      reassignMutation.mutate({
                        id: selectedRequest.id,
                        partnerId: value === "unassigned" ? undefined : value,
                      })
                    }
                    disabled={reassignMutation.isPending}
                  >
                    <SelectTrigger data-testid="select-enquiry-partner">
                      <SelectValue placeholder="Choose a pickup partner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned — auto-assign if available</SelectItem>
                      {assignablePartners(pickupPartners, selectedRequest).map((partner) => (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.name} · {partner.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {selectedRequest.pickupJob
                      ? `${selectedRequest.pickupJob.partnerName || "Unassigned"} · ${
                          pickupJobLabels[selectedRequest.pickupJob.status] || selectedRequest.pickupJob.status
                        }`
                      : "No pickup partner yet. Choose one for this store’s doorstep collection."}
                  </p>
                </div>
              ) : null}

              <div className="space-y-2 rounded-lg border p-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Quotation sent to customer
                </h4>
                {selectedRequest.quotation ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quote no.</span>
                      <span className="font-medium">{selectedRequest.quotation.quotationNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="text-lg font-semibold">
                        {formatQuoteAmount(selectedRequest.quotation.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer approval</span>
                      <Badge variant="outline">
                        {quoteStatusLabels[selectedRequest.quotation.status] || selectedRequest.quotation.status}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No quotation has been sent yet. The pickup partner sends this after inspection.
                  </p>
                )}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Sender
                  </h4>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{selectedRequest.senderName}</div>
                    <div className="text-sm text-muted-foreground">{selectedRequest.senderPhone}</div>
                    {selectedRequest.senderEmail ? (
                      <div className="text-sm text-muted-foreground">{selectedRequest.senderEmail}</div>
                    ) : null}
                    <div className="text-sm">
                      {selectedRequest.senderAddress}
                      {selectedRequest.senderCity && `, ${selectedRequest.senderCity}`}
                      {selectedRequest.senderState && `, ${selectedRequest.senderState}`}
                      {selectedRequest.senderPincode && ` - ${selectedRequest.senderPincode}`}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Receiver
                  </h4>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{selectedRequest.receiverName}</div>
                    <div className="text-sm text-muted-foreground">{selectedRequest.receiverPhone}</div>
                    <div className="text-sm">
                      {selectedRequest.receiverAddress}
                      {selectedRequest.receiverCity && `, ${selectedRequest.receiverCity}`}
                      {selectedRequest.receiverState && `, ${selectedRequest.receiverState}`}
                      {selectedRequest.receiverPincode && ` - ${selectedRequest.receiverPincode}`}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Package
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weight</span>
                      <span>{selectedRequest.weight ? `${selectedRequest.weight} kg` : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pieces</span>
                      <span>{selectedRequest.numberOfPieces || 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Declared value</span>
                      <span>{selectedRequest.declaredValue ? `₹${selectedRequest.declaredValue}` : "-"}</span>
                    </div>
                    {selectedRequest.contentDescription ? (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Contents</span>
                        <span className="text-right">{selectedRequest.contentDescription}</span>
                      </div>
                    ) : null}
                    {selectedRequest.packageLength || selectedRequest.packageWidth || selectedRequest.packageHeight ? (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dimensions</span>
                        <span>
                          {[selectedRequest.packageLength, selectedRequest.packageWidth, selectedRequest.packageHeight]
                            .filter(Boolean)
                            .join(" × ")}{" "}
                          cm
                        </span>
                      </div>
                    ) : null}
                    {selectedRequest.packageItems?.length ? (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Items</span>
                        <span className="text-right">{selectedRequest.packageItems.join(", ")}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Service
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service type</span>
                      <span className="capitalize">{selectedRequest.serviceType || "surface"}</span>
                    </div>
                    {selectedRequest.courierPreference ? (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Courier preference</span>
                        <span>{selectedRequest.courierPreference}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {selectedRequest.packagePhotoUrls?.length ? (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Photos
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.packagePhotoUrls.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt="Enquiry package" className="h-20 w-20 rounded-md object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              {selectedRequest.pickupDate || selectedRequest.pickupTimeSlot ? (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Scheduled pickup
                    </h4>
                    <p className="flex items-center gap-2 text-sm">
                      <Clock className="h-3 w-3" />
                      {selectedRequest.pickupDate || "—"}
                      {selectedRequest.pickupTimeSlot
                        ? ` · ${selectedRequest.pickupTimeSlot.replace("-", " – ")}`
                        : ""}
                    </p>
                  </div>
                </>
              ) : null}

              {selectedRequest.pickupLocationName ? (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Pickup location
                    </h4>
                    <p className="flex items-start gap-1 text-sm">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                      {selectedRequest.pickupLocationName}
                    </p>
                    {selectedRequest.pickupLat && selectedRequest.pickupLng ? (
                      <a
                        href={`https://www.google.com/maps?q=${selectedRequest.pickupLat},${selectedRequest.pickupLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Open in Google Maps
                      </a>
                    ) : null}
                  </div>
                </>
              ) : null}

              {selectedRequest.notes ? (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Notes
                    </h4>
                    <p className="text-sm">{selectedRequest.notes}</p>
                  </div>
                </>
              ) : null}

              {selectedRequest.status === "pending" ? (
                <>
                  <Separator />
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleReject(selectedRequest)}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedRequest)}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Approve & convert to booking
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
