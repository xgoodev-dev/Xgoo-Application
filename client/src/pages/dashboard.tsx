import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Package,
  IndianRupee,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Truck,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ShipmentWithRelations } from "@shared/schema";

interface DashboardStats {
  todayBookings: number;
  todayRevenue: string;
  pendingPayments: string;
  monthlyBookings: number;
  monthlyRevenue: string;
  statusCounts: {
    booked: number;
    picked_up: number;
    in_transit: number;
    delivered: number;
  };
}

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

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function RecentShipmentRow({ shipment }: { shipment: ShipmentWithRelations }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Package className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <div className="font-medium text-sm">{shipment.bookingNumber}</div>
          <div className="text-xs text-muted-foreground">
            To {shipment.receiverCity || "N/A"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium">{formatCurrency(shipment.totalAmount)}</div>
          <div className="text-xs text-muted-foreground">
            {shipment.courierPartner?.name || "N/A"}
          </div>
        </div>
        <Badge variant="secondary" className={statusColors[shipment.status]}>
          {statusLabels[shipment.status]}
        </Badge>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentShipments, isLoading: shipmentsLoading } = useQuery<ShipmentWithRelations[]>({
    queryKey: ["/api/shipments"],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your office overview.
          </p>
        </div>
        <Button asChild data-testid="button-new-booking">
          <Link href="/bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatsCard
              title="Today's Bookings"
              value={stats?.todayBookings?.toString() || "0"}
              subtitle="Shipments booked today"
              icon={Package}
            />
            <StatsCard
              title="Today's Revenue"
              value={formatCurrency(stats?.todayRevenue || "0")}
              subtitle="Total collected"
              icon={IndianRupee}
            />
            <StatsCard
              title="Pending Payments"
              value={formatCurrency(stats?.pendingPayments || "0")}
              subtitle="Credit outstanding"
              icon={Clock}
            />
            <StatsCard
              title="Monthly Bookings"
              value={stats?.monthlyBookings?.toString() || "0"}
              subtitle={formatCurrency(stats?.monthlyRevenue || "0") + " revenue"}
              icon={TrendingUp}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatusCard
              label="Booked"
              count={stats?.statusCounts?.booked || 0}
              color="bg-amber-50 dark:bg-zinc-900 dark:border dark:border-zinc-800"
            />
            <StatusCard
              label="Picked Up"
              count={stats?.statusCounts?.picked_up || 0}
              color="bg-blue-50 dark:bg-zinc-900 dark:border dark:border-zinc-800"
            />
            <StatusCard
              label="In Transit"
              count={stats?.statusCounts?.in_transit || 0}
              color="bg-purple-50 dark:bg-zinc-900 dark:border dark:border-zinc-800"
            />
            <StatusCard
              label="Delivered"
              count={stats?.statusCounts?.delivered || 0}
              color="bg-green-50 dark:bg-zinc-900 dark:border dark:border-zinc-800"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg">Recent Shipments</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/shipments" data-testid="link-view-all-shipments">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {shipmentsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : recentShipments && recentShipments.length > 0 ? (
              <div>
                {recentShipments.slice(0, 5).map((shipment) => (
                  <RecentShipmentRow key={shipment.id} shipment={shipment} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No shipments yet</p>
                <Button variant="ghost" asChild className="mt-2">
                  <Link href="/bookings/new">Create your first booking</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <Link href="/bookings/new" data-testid="button-quick-new-booking">
                <Package className="mr-3 h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">New Booking</div>
                  <div className="text-xs text-muted-foreground">Create shipment</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <Link href="/customers" data-testid="button-quick-customers">
                <Users className="mr-3 h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Customers</div>
                  <div className="text-xs text-muted-foreground">Manage customers</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <Link href="/partners" data-testid="button-quick-partners">
                <Truck className="mr-3 h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Partners</div>
                  <div className="text-xs text-muted-foreground">Courier partners</div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <Link href="/reports" data-testid="button-quick-reports">
                <TrendingUp className="mr-3 h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Reports</div>
                  <div className="text-xs text-muted-foreground">View analytics</div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
