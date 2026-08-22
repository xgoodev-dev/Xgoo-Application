import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format, subDays } from "date-fns";
import {
  Package,
  IndianRupee,
  Clock,
  TrendingUp,
  ArrowRight,
  Truck,
  Users,
  Inbox,
  Calculator,
  Files,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { apiRequest } from "@/lib/queryClient";
import type { ShipmentWithRelations, BookingRequest } from "@shared/schema";

interface DashboardStats {
  todayBookings: number;
  todayRevenue: string;
  pendingPayments: string;
  monthlyBookings: number;
  monthlyRevenue: string;
  pendingBookingRequests: number;
  todayBookingRequests: number;
  statusCounts: {
    booked: number;
    picked_up: number;
    in_transit: number;
    delivered: number;
  };
}

interface ReportData {
  dateWise: Array<{ date: string; bookings: number; revenue: string }>;
  partnerWise: Array<{ partnerId: string; partnerName: string; bookings: number; revenue: string }>;
  customerWise: Array<{ customerId: string; customerName: string; bookings: number; revenue: string }>;
  summary: {
    totalBookings: number;
    totalRevenue: string;
    avgBookingValue: string;
    topPartner: string;
    topCustomer: string;
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
  cancelled:
    "bg-red-100 text-red-700 dark:bg-zinc-800 dark:text-red-400 dark:border dark:border-zinc-700",
};

const statusLabels: Record<string, string> = {
  booked: "Booked",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const revenueChartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--primary))" },
  bookings: { label: "Bookings", color: "hsl(142 76% 36%)" },
} satisfies ChartConfig;

const statusChartConfig = {
  booked: { label: "Booked", color: "hsl(38 92% 50%)" },
  picked_up: { label: "Picked Up", color: "hsl(217 91% 60%)" },
  in_transit: { label: "In Transit", color: "hsl(271 81% 56%)" },
  delivered: { label: "Delivered", color: "hsl(142 76% 36%)" },
} satisfies ChartConfig;

const partnerChartConfig = {
  bookings: { label: "Bookings", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatCurrencyShort(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
  return `₹${Math.round(amount)}`;
}

function QuickActionIcon({
  href,
  icon: Icon,
  label,
  badge,
  testId,
  iconClassName = "text-primary",
  bgClassName = "from-primary/25 to-primary/5 border-primary/20",
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  testId?: string;
  iconClassName?: string;
  bgClassName?: string;
}) {
  return (
    <Link href={href} data-testid={testId}>
      <div className="group flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors">
        <div className="relative">
          <div
            className={`flex h-[3.25rem] w-[3.25rem] sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br border shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform ${bgClassName}`}
          >
            <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${iconClassName}`} />
          </div>
          {badge != null && badge > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </div>
        <span className="text-[11px] sm:text-xs font-medium text-center leading-tight max-w-[4.5rem]">
          {label}
        </span>
      </div>
    </Link>
  );
}

function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
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
          <div className="text-xs text-muted-foreground">To {shipment.receiverCity || "N/A"}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium">{formatCurrency(shipment.totalAmount)}</div>
          <div className="text-xs text-muted-foreground">{shipment.courierPartner?.name || "N/A"}</div>
        </div>
        <Badge variant="secondary" className={statusColors[shipment.status]}>
          {statusLabels[shipment.status]}
        </Badge>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const chartFrom = format(subDays(new Date(), 29), "yyyy-MM-dd");
  const chartTo = format(new Date(), "yyyy-MM-dd");

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentShipments, isLoading: shipmentsLoading } = useQuery<ShipmentWithRelations[]>({
    queryKey: ["/api/shipments"],
  });

  const { data: bookingRequests, isLoading: requestsLoading } = useQuery<BookingRequest[]>({
    queryKey: ["/api/booking-requests"],
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 20_000,
  });

  const { data: reportData, isLoading: chartsLoading } = useQuery<ReportData>({
    queryKey: ["dashboard-charts", chartFrom, chartTo],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/reports?from=${chartFrom}&to=${chartTo}`);
      return res.json();
    },
  });

  const trendData =
    reportData?.dateWise.map((row) => ({
      date: format(new Date(row.date), "MMM d"),
      revenue: parseFloat(row.revenue) || 0,
      bookings: row.bookings,
    })) ?? [];

  const statusPieData = stats
    ? [
        { name: "booked", value: stats.statusCounts.booked, fill: "var(--color-booked)" },
        { name: "picked_up", value: stats.statusCounts.picked_up, fill: "var(--color-picked_up)" },
        { name: "in_transit", value: stats.statusCounts.in_transit, fill: "var(--color-in_transit)" },
        { name: "delivered", value: stats.statusCounts.delivered, fill: "var(--color-delivered)" },
      ].filter((d) => d.value > 0)
    : [];

  const partnerBarData =
    reportData?.partnerWise.slice(0, 6).map((p) => ({
      name: p.partnerName.length > 12 ? `${p.partnerName.slice(0, 12)}…` : p.partnerName,
      bookings: p.bookings,
      revenue: parseFloat(p.revenue) || 0,
    })) ?? [];

  const totalStatus = statusPieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back! Here's your office overview.</p>
      </div>

      {/* App-icon quick actions — top */}
      <Card className="border-none shadow-sm bg-muted/30">
        <CardContent className="p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
            Quick Actions
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1 sm:gap-2">
            <QuickActionIcon
              href="/bookings/new"
              icon={Package}
              label="New Booking"
              testId="button-quick-new-booking"
              bgClassName="from-orange-500/25 to-orange-500/5 border-orange-500/25"
              iconClassName="text-orange-500"
            />
            <QuickActionIcon
              href="/shipments"
              icon={BarChart3}
              label="Shipments"
              bgClassName="from-sky-500/25 to-sky-500/5 border-sky-500/25"
              iconClassName="text-sky-500"
            />
            <QuickActionIcon
              href="/customers"
              icon={Users}
              label="Customers"
              testId="button-quick-customers"
              bgClassName="from-violet-500/25 to-violet-500/5 border-violet-500/25"
              iconClassName="text-violet-500"
            />
            <QuickActionIcon
              href="/partners"
              icon={Truck}
              label="Partners"
              testId="button-quick-partners"
              bgClassName="from-emerald-500/25 to-emerald-500/5 border-emerald-500/25"
              iconClassName="text-emerald-500"
            />
            <QuickActionIcon
              href="/booking-requests"
              icon={Inbox}
              label="Requests"
              badge={stats?.pendingBookingRequests}
              testId="button-quick-booking-requests"
              bgClassName="from-amber-500/25 to-amber-500/5 border-amber-500/25"
              iconClassName="text-amber-500"
            />
            <QuickActionIcon
              href="/pricing"
              icon={Calculator}
              label="Pricing"
              bgClassName="from-rose-500/25 to-rose-500/5 border-rose-500/25"
              iconClassName="text-rose-500"
            />
            <QuickActionIcon
              href="/documents"
              icon={Files}
              label="Documents"
              bgClassName="from-indigo-500/25 to-indigo-500/5 border-indigo-500/25"
              iconClassName="text-indigo-500"
            />
            <QuickActionIcon
              href="/reports"
              icon={TrendingUp}
              label="Reports"
              testId="button-quick-reports"
              bgClassName="from-teal-500/25 to-teal-500/5 border-teal-500/25"
              iconClassName="text-teal-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))
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
              subtitle={`${formatCurrency(stats?.monthlyRevenue || "0")} revenue`}
              icon={TrendingUp}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue trend</CardTitle>
            <CardDescription>Last 30 days — area curve</CardDescription>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : trendData.length > 0 ? (
              <ChartContainer config={revenueChartConfig} className="h-[220px] w-full">
                <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={formatCurrencyShort} width={48} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) =>
                          name === "revenue" ? formatCurrency(Number(value)) : value
                        }
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    fill="url(#revenueFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                No revenue data for this period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily bookings</CardTitle>
            <CardDescription>Last 30 days — bar chart</CardDescription>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : trendData.length > 0 ? (
              <ChartContainer config={revenueChartConfig} className="h-[220px] w-full">
                <BarChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                No booking data for this period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Shipment status</CardTitle>
            <CardDescription>Current pipeline — donut chart</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : totalStatus > 0 ? (
              <ChartContainer config={statusChartConfig} className="h-[220px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {statusPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                No shipments yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Courier partners</CardTitle>
            <CardDescription>Bookings by partner — horizontal bars</CardDescription>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : partnerBarData.length > 0 ? (
              <ChartContainer config={partnerChartConfig} className="h-[220px] w-full">
                <BarChart data={partnerBarData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={72} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                No partner data for this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Combined bookings + revenue line */}
      {trendData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bookings vs revenue</CardTitle>
            <CardDescription>Dual-axis line chart — last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-[240px] w-full">
              <LineChart data={trendData} margin={{ top: 8, right: 48, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCurrencyShort}
                  width={48}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) =>
                        name === "revenue" ? formatCurrency(Number(value)) : value
                      }
                    />
                  }
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="bookings"
                  stroke="var(--color-bookings)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {(stats?.pendingBookingRequests ?? 0) > 0 || (stats?.todayBookingRequests ?? 0) > 0 ? (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-zinc-900 dark:border-zinc-700">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-zinc-800">
                <Inbox className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-semibold">Customer Booking Requests</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.pendingBookingRequests || 0} pending
                  {(stats?.todayBookingRequests ?? 0) > 0 && ` · ${stats?.todayBookingRequests} today`}
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/booking-requests">Review Requests</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg">Recent Customer Requests</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/booking-requests">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : bookingRequests && bookingRequests.length > 0 ? (
              <div className="space-y-3">
                {bookingRequests.slice(0, 5).map((req) => (
                  <div key={req.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{req.requestNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.senderName} → {req.receiverCity || req.receiverName}
                        {req.pickupDate && ` · ${req.pickupDate}`}
                      </p>
                    </div>
                    <Badge variant={req.status === "pending" ? "secondary" : "outline"} className="capitalize">
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No customer booking requests yet</p>
              </div>
            )}
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}
