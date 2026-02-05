import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subDays } from "date-fns";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  Users,
  Truck,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface ReportData {
  dateWise: Array<{
    date: string;
    bookings: number;
    revenue: string;
  }>;
  customerWise: Array<{
    customerId: string;
    customerName: string;
    bookings: number;
    revenue: string;
  }>;
  partnerWise: Array<{
    partnerId: string;
    partnerName: string;
    bookings: number;
    revenue: string;
  }>;
  summary: {
    totalBookings: number;
    totalRevenue: string;
    avgBookingValue: string;
    topPartner: string;
    topCustomer: string;
  };
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("this_month");
  const { toast } = useToast();

  const getDateRange = () => {
    const today = new Date();
    switch (dateRange) {
      case "today":
        return {
          from: format(today, "yyyy-MM-dd"),
          to: format(today, "yyyy-MM-dd"),
        };
      case "last_7_days":
        return {
          from: format(subDays(today, 7), "yyyy-MM-dd"),
          to: format(today, "yyyy-MM-dd"),
        };
      case "last_30_days":
        return {
          from: format(subDays(today, 30), "yyyy-MM-dd"),
          to: format(today, "yyyy-MM-dd"),
        };
      case "this_month":
      default:
        return {
          from: format(startOfMonth(today), "yyyy-MM-dd"),
          to: format(endOfMonth(today), "yyyy-MM-dd"),
        };
    }
  };

  const { from, to } = getDateRange();

  const { data: reportData, isLoading } = useQuery<ReportData>({
    queryKey: ["/api/reports", from, to],
  });

  const handleExport = async (reportType: string) => {
    try {
      const response = await fetch(
        `/api/reports/export?type=${reportType}&from=${from}&to=${to}`,
        { credentials: "include" }
      );
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}_report_${from}_${to}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Export Complete", description: "Report has been downloaded." });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">View analytics and export data</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]" data-testid="select-date-range">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
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
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold">{reportData?.summary.totalBookings || 0}</p>
                  </div>
                  <Package className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(reportData?.summary.totalRevenue || "0")}
                    </p>
                  </div>
                  <IndianRupee className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Booking Value</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(reportData?.summary.avgBookingValue || "0")}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Top Partner</p>
                    <p className="text-lg font-bold truncate">
                      {reportData?.summary.topPartner || "-"}
                    </p>
                  </div>
                  <Truck className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Date-wise Shipments
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("date_wise")}
              data-testid="button-export-datewise"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : reportData?.dateWise && reportData.dateWise.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.dateWise.slice(0, 10).map((row) => (
                      <TableRow key={row.date}>
                        <TableCell>{format(new Date(row.date), "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-right">{row.bookings}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No data for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customer-wise Revenue
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("customer_wise")}
              data-testid="button-export-customerwise"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : reportData?.customerWise && reportData.customerWise.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.customerWise.slice(0, 10).map((row) => (
                      <TableRow key={row.customerId}>
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell className="text-right">{row.bookings}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No data for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Partner-wise Volume
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("partner_wise")}
              data-testid="button-export-partnerwise"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : reportData?.partnerWise && reportData.partnerWise.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Avg. Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.partnerWise.map((row) => (
                      <TableRow key={row.partnerId}>
                        <TableCell className="font-medium">{row.partnerName}</TableCell>
                        <TableCell className="text-right">{row.bookings}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.revenue)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(
                            row.bookings > 0
                              ? parseFloat(row.revenue) / row.bookings
                              : 0
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No data for the selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
