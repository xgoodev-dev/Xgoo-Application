import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  FileText,
  Truck,
  CheckCircle,
  Printer,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ShipmentWithRelations } from "@shared/schema";

const statusColors: Record<string, string> = {
  booked:
    "bg-amber-100 text-amber-700 dark:bg-zinc-800 dark:text-zinc-200 dark:border dark:border-zinc-700",
  picked_up:
    "bg-blue-100 text-blue-700 dark:bg-zinc-800 dark:text-blue-400 dark:border dark:border-zinc-700",
  in_transit:
    "bg-purple-100 text-purple-700 dark:bg-zinc-800 dark:text-purple-300 dark:border dark:border-zinc-700",
  delivered:
    "bg-green-100 text-green-700 dark:bg-zinc-800 dark:text-green-400 dark:border dark:border-zinc-700",
};

const statusLabels: Record<string, string> = {
  booked: "Booked",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
};

const nextStatus: Record<string, string> = {
  booked: "picked_up",
  picked_up: "in_transit",
  in_transit: "delivered",
};

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function ShipmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: shipments, isLoading } = useQuery<ShipmentWithRelations[]>({
    queryKey: ["/api/shipments"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/shipments/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "Status Updated", description: "Shipment status has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const filteredShipments = shipments?.filter((shipment) => {
    const matchesSearch =
      search === "" ||
      shipment.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
      shipment.awbNumber?.toLowerCase().includes(search.toLowerCase()) ||
      shipment.senderName.toLowerCase().includes(search.toLowerCase()) ||
      shipment.receiverName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shipments</h1>
          <p className="text-muted-foreground">Manage all your shipments</p>
        </div>
        <Button asChild data-testid="button-new-shipment">
          <Link href="/bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by booking #, AWB, sender, receiver..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-shipments"
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
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
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
          ) : filteredShipments && filteredShipments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking #</TableHead>
                    <TableHead>AWB</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id} data-testid={`row-shipment-${shipment.id}`}>
                      <TableCell className="font-medium">{shipment.bookingNumber}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {shipment.awbNumber || "-"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{shipment.senderName}</div>
                          <div className="text-xs text-muted-foreground">
                            {shipment.senderCity || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{shipment.receiverName}</div>
                          <div className="text-xs text-muted-foreground">
                            {shipment.receiverCity || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{shipment.courierPartner?.name || "-"}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(shipment.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[shipment.status]}>
                          {statusLabels[shipment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {shipment.bookedAt
                          ? format(new Date(shipment.bookedAt), "dd MMM, HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${shipment.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/shipments/${shipment.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/shipments/${shipment.id}/label`}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print Label
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/shipments/${shipment.id}/invoice`}>
                                <Receipt className="mr-2 h-4 w-4" />
                                View Invoice
                              </Link>
                            </DropdownMenuItem>
                            {shipment.status !== "delivered" && nextStatus[shipment.status] && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: shipment.id,
                                    status: nextStatus[shipment.status],
                                  })
                                }
                              >
                                {shipment.status === "booked" && (
                                  <>
                                    <Truck className="mr-2 h-4 w-4" />
                                    Mark Picked Up
                                  </>
                                )}
                                {shipment.status === "picked_up" && (
                                  <>
                                    <Package className="mr-2 h-4 w-4" />
                                    Mark In Transit
                                  </>
                                )}
                                {shipment.status === "in_transit" && (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark Delivered
                                  </>
                                )}
                              </DropdownMenuItem>
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
            <div className="py-16 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-1">No shipments found</h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first booking to get started"}
              </p>
              {!search && statusFilter === "all" && (
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
