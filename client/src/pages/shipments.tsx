import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  Package,
  Plus,
  Search,
  Filter,
  Truck,
  CheckCircle,
  Printer,
  Receipt,
  FileText,
  Download,
  X,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  PARTNER_SYNC_STATUS_LABELS,
  type PartnerSyncStatus,
} from "@shared/partner-sync";
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

const nextStatusAction: Record<string, { label: string; icon: typeof Truck }> = {
  booked: { label: "Mark Picked Up", icon: Truck },
  picked_up: { label: "Mark In Transit", icon: Package },
  in_transit: { label: "Mark Delivered", icon: CheckCircle },
};

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function ActionButton({
  href,
  label,
  icon: Icon,
  onClick,
  testId,
}: {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  testId?: string;
}) {
  const className = "h-8 w-8 shrink-0";

  const inner = href ? (
    <Button variant="outline" size="icon" className={className} asChild data-testid={testId}>
      <Link href={href}>
        <Icon className="h-3.5 w-3.5" />
      </Link>
    </Button>
  ) : (
    <Button variant="outline" size="icon" className={className} onClick={onClick} data-testid={testId}>
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export default function ShipmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  const filteredShipments = useMemo(
    () =>
      shipments?.filter((shipment) => {
        const matchesSearch =
          search === "" ||
          shipment.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
          shipment.awbNumber?.toLowerCase().includes(search.toLowerCase()) ||
          shipment.senderName.toLowerCase().includes(search.toLowerCase()) ||
          shipment.receiverName.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;
        return matchesSearch && matchesStatus;
      }) ?? [],
    [shipments, search, statusFilter],
  );

  const allVisibleSelected =
    filteredShipments.length > 0 && filteredShipments.every((s) => selectedIds.has(s.id));
  const someVisibleSelected = filteredShipments.some((s) => selectedIds.has(s.id));

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredShipments.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const advanceStatus = async (ids: string[]) => {
    const targets = ids
      .map((id) => shipments?.find((s) => s.id === id))
      .filter((s): s is ShipmentWithRelations => !!s && s.status !== "delivered" && !!nextStatus[s.status]);

    if (targets.length === 0) {
      toast({ title: "Nothing to update", description: "Selected shipments are already delivered.", variant: "destructive" });
      return;
    }

    try {
      await Promise.all(
        targets.map((s) =>
          updateStatusMutation.mutateAsync({ id: s.id, status: nextStatus[s.status] }),
        ),
      );
      toast({
        title: "Status updated",
        description: `${targets.length} shipment${targets.length > 1 ? "s" : ""} advanced.`,
      });
      clearSelection();
    } catch {
      /* mutation onError handles toast */
    }
  };

  const openBulkPaths = (pathSuffix: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    ids.forEach((id) => window.open(`/shipments/${id}/${pathSuffix}`, "_blank", "noopener,noreferrer"));
    toast({
      title: "Opened in new tabs",
      description: `${ids.length} document${ids.length > 1 ? "s" : ""} opened.`,
    });
  };

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
        </CardContent>
      </Card>

      {selectedIds.size > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium mr-2">
              {selectedIds.size} selected
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => advanceStatus(Array.from(selectedIds))}
              disabled={updateStatusMutation.isPending}
            >
              <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
              Advance Status
            </Button>
            <Button size="sm" variant="outline" onClick={() => openBulkPaths("label")}>
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Print Labels
            </Button>
            <Button size="sm" variant="outline" onClick={() => openBulkPaths("bill")}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Customer Bills
            </Button>
            <Button size="sm" variant="outline" onClick={() => openBulkPaths("invoice")}>
              <Receipt className="mr-1.5 h-3.5 w-3.5" />
              Invoices
            </Button>
            <Button size="sm" variant="outline" onClick={() => openBulkPaths("invoice?download=1")}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download Invoices
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection} className="ml-auto">
              <X className="mr-1.5 h-3.5 w-3.5" />
              Clear
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-10 w-10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : filteredShipments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                        onCheckedChange={(v) => toggleAllVisible(v === true)}
                        aria-label="Select all visible shipments"
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>Booking #</TableHead>
                    <TableHead>AWB</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Partner sync</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="min-w-[220px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => {
                    const isSelected = selectedIds.has(shipment.id);
                    const advance = nextStatusAction[shipment.status];

                    return (
                      <TableRow
                        key={shipment.id}
                        data-testid={`row-shipment-${shipment.id}`}
                        className={cn(isSelected && "bg-primary/5")}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(v) => toggleRow(shipment.id, v === true)}
                            aria-label={`Select ${shipment.bookingNumber}`}
                            data-testid={`checkbox-shipment-${shipment.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={`/shipments/${shipment.id}`}
                            className="hover:underline"
                            data-testid={`link-shipment-${shipment.id}`}
                          >
                            {shipment.bookingNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {shipment.externalAwb || shipment.awbNumber || "-"}
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
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-normal">
                            {PARTNER_SYNC_STATUS_LABELS[
                              (shipment.partnerSyncStatus ?? "pending") as PartnerSyncStatus
                            ]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {shipment.bookedAt
                            ? format(new Date(shipment.bookedAt), "dd MMM, HH:mm")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1">
                            <ActionButton
                              href={`/shipments/${shipment.id}`}
                              label="Partner sync"
                              icon={ExternalLink}
                              testId={`action-sync-${shipment.id}`}
                            />
                            <ActionButton
                              href={`/shipments/${shipment.id}/label`}
                              label="Print Label"
                              icon={Printer}
                              testId={`action-label-${shipment.id}`}
                            />
                            <ActionButton
                              href={`/shipments/${shipment.id}/bill`}
                              label="Customer Bill"
                              icon={FileText}
                              testId={`action-bill-${shipment.id}`}
                            />
                            <ActionButton
                              href={`/shipments/${shipment.id}/invoice`}
                              label="View Invoice"
                              icon={Receipt}
                              testId={`action-invoice-${shipment.id}`}
                            />
                            <ActionButton
                              href={`/shipments/${shipment.id}/invoice?download=1`}
                              label="Download Invoice"
                              icon={Download}
                              testId={`action-download-${shipment.id}`}
                            />
                            {advance && (
                              <ActionButton
                                label={advance.label}
                                icon={advance.icon}
                                testId={`action-status-${shipment.id}`}
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: shipment.id,
                                    status: nextStatus[shipment.status],
                                  })
                                }
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
