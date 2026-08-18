import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BookingRequest } from "@shared/schema";

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

const sourceLabels: Record<string, string> = {
  mobile_android: "Android App",
  mobile_ios: "iOS App",
  mobile_app: "Mobile App (Legacy)",
  whatsapp: "WhatsApp",
  in_store: "In Store",
  phone: "Phone",
  partner_api: "Partner API",
  customer_portal: "Web Customer Portal",
  website: "Website",
  staff_portal: "Staff Portal",
  api: "API",
  legacy: "Legacy",
};

function bookingSourceLabel(request: BookingRequest) {
  if (request.source === "legacy" && request.customerUserId) {
    return "Customer App / Portal";
  }
  return sourceLabels[request.source] || "Unknown";
}

export default function BookingRequestsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: bookingRequests, isLoading, isFetching, refetch } = useQuery<BookingRequest[]>({
    queryKey: ["/api/booking-requests"],
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    refetchInterval: 15_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/booking-requests/${id}/status`, { status });
    },
    onSuccess: (_, variables) => {
      const statusMsg = variables.status === "approved" ? "approved" : "rejected";
      toast({ 
        title: "Status Updated", 
        description: `Booking request has been ${statusMsg}.` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/booking-requests"] });
      setIsDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (request: BookingRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const handleApprove = (request: BookingRequest) => {
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
      }
    );
  };

  const handleReject = (request: BookingRequest) => {
    updateStatusMutation.mutate({ id: request.id, status: "rejected" });
  };

  const filteredRequests = bookingRequests?.filter((request) => {
    const matchesSearch =
      search === "" ||
      request.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
      request.senderName.toLowerCase().includes(search.toLowerCase()) ||
      request.receiverName.toLowerCase().includes(search.toLowerCase()) ||
      request.senderPhone.includes(search) ||
      request.receiverPhone.includes(search);

    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesSource = sourceFilter === "all" || request.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Booking Requests</h1>
          <p className="text-muted-foreground">
            Review requests from every booking channel, then approve and convert them into shipments.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void refetch()}
          disabled={isFetching}
          data-testid="button-refresh-booking-requests"
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
                placeholder="Search by request #, sender, receiver, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-requests"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[170px]" data-testid="select-source-filter">
                  <SelectValue placeholder="Booking source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="mobile_android">Android App</SelectItem>
                  <SelectItem value="mobile_ios">iOS App</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="in_store">In Store</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="customer_portal">Web Customer Portal</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="partner_api">Partner API</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          ) : filteredRequests && filteredRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request #</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Created from</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                      <TableCell className="font-medium">{request.requestNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{request.senderName}</div>
                          <div className="text-xs text-muted-foreground">
                            {request.senderCity || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{request.receiverName}</div>
                          <div className="text-xs text-muted-foreground">
                            {request.receiverCity || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {bookingSourceLabel(request)}
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
                      <TableCell className="text-muted-foreground text-sm">
                        {request.createdAt
                          ? format(new Date(request.createdAt), "dd MMM, HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${request.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(request)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {request.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => handleApprove(request)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve & Convert
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
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No booking requests</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {search || statusFilter !== "all"
                  ? "No requests match your search criteria"
                  : "Customer booking requests will appear here"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Request Details</DialogTitle>
            <DialogDescription>
              Request #{selectedRequest?.requestNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={statusColors[selectedRequest.status]}>
                  {statusLabels[selectedRequest.status]}
                </Badge>
                <Badge variant="outline">
                  Created from {bookingSourceLabel(selectedRequest)}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {selectedRequest.shipmentType === "international" ? "International" : "Domestic"}
                  {selectedRequest.shipmentType === "international" && selectedRequest.destinationCountry
                    ? ` · ${selectedRequest.destinationCountry}`
                    : ""}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Submitted on {selectedRequest.createdAt 
                    ? format(new Date(selectedRequest.createdAt), "PPP 'at' p") 
                    : "-"}
                </span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Sender Details
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">{selectedRequest.senderName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedRequest.senderPhone}
                    </div>
                    {selectedRequest.senderEmail && (
                      <div className="text-sm text-muted-foreground">
                        {selectedRequest.senderEmail}
                      </div>
                    )}
                    <div className="text-sm">
                      {selectedRequest.senderAddress}
                      {selectedRequest.senderCity && `, ${selectedRequest.senderCity}`}
                      {selectedRequest.senderState && `, ${selectedRequest.senderState}`}
                      {selectedRequest.senderPincode && ` - ${selectedRequest.senderPincode}`}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Receiver Details
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">{selectedRequest.receiverName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedRequest.receiverPhone}
                    </div>
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
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Package Details
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
                      <span className="text-muted-foreground">Declared Value</span>
                      <span>{selectedRequest.declaredValue ? `₹${selectedRequest.declaredValue}` : "-"}</span>
                    </div>
                    {selectedRequest.contentDescription && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contents</span>
                        <span className="text-right">{selectedRequest.contentDescription}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Service Preference
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service Type</span>
                      <span className="capitalize">{selectedRequest.serviceType || "surface"}</span>
                    </div>
                    {selectedRequest.courierPreference && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Courier Preference</span>
                        <span>{selectedRequest.courierPreference}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(selectedRequest.pickupDate || selectedRequest.pickupTimeSlot) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Scheduled Pickup
                    </h4>
                    <p className="text-sm flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {selectedRequest.pickupDate || "—"}
                      {selectedRequest.pickupTimeSlot && ` · ${selectedRequest.pickupTimeSlot.replace("-", " – ")}`}
                    </p>
                  </div>
                </>
              )}

              {selectedRequest.pickupLocationName && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Pickup Location
                    </h4>
                    <p className="text-sm flex items-start gap-1">
                      <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                      {selectedRequest.pickupLocationName}
                    </p>
                    {selectedRequest.pickupLat && selectedRequest.pickupLng && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedRequest.pickupLat},${selectedRequest.pickupLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                        data-testid="link-pickup-map"
                      >
                        Open in Google Maps
                      </a>
                    )}
                  </div>
                </>
              )}

              {selectedRequest.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Notes
                    </h4>
                    <p className="text-sm">{selectedRequest.notes}</p>
                  </div>
                </>
              )}

              {selectedRequest.status === "pending" && (
                <>
                  <Separator />
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleReject(selectedRequest)}
                      disabled={updateStatusMutation.isPending}
                      data-testid="button-reject-request"
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
                      data-testid="button-approve-request"
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Approve & Convert to Booking
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
