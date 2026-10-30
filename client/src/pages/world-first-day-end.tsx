import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { WorldFirstWalletBar } from "@/components/bookings/world-first-wallet-bar";
import { WORLD_FIRST_VENDORS } from "@shared/world-first-masters";

type PendingRow = Record<string, string | number | boolean | null>;

function todayInput(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toPortalDate(value: string): string {
  const [yyyy, mm, dd] = value.split("-");
  if (!yyyy || !mm || !dd) return value;
  return `${dd}/${mm}/${yyyy}`;
}

function rowAwb(row: PendingRow): string {
  return String(row.AWBNo || row.awbno || row.AwbNo || row.AWB || row.ForwardingNo || "").trim();
}

function rowManifestNo(row: PendingRow): string {
  return String(row.ManifestNo || row.manifestno || row.ManiNo || row.CCode || row.custmanino || "").trim();
}

function cell(row: PendingRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim()) return String(value);
  }
  return "—";
}

export default function WorldFirstDayEndPage() {
  const { toast } = useToast();
  const [fromDate, setFromDate] = useState(todayInput);
  const [toDate, setToDate] = useState(todayInput);
  const [vendor, setVendor] = useState("all");
  const [tab, setTab] = useState<"pending" | "manifest">("pending");
  const [selected, setSelected] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const vendorCode = vendor === "all" ? "" : vendor;
  const query = `/api/integrations/world-first/${tab === "pending" ? "pending-awb" : "manifests"}?from=${encodeURIComponent(toPortalDate(fromDate))}&to=${encodeURIComponent(toPortalDate(toDate))}&vendor=${encodeURIComponent(vendorCode)}`;

  const listQuery = useQuery<{ rows: PendingRow[] }>({
    queryKey: [query],
    enabled: loaded,
  });

  const rows = listQuery.data?.rows || [];
  const columns = useMemo(() => {
    if (tab === "pending") {
      return [
        { label: "AWB", keys: ["AWBNo", "awbno", "AwbNo", "AWB"] },
        { label: "Origin", keys: ["Origin", "org", "OriginName"] },
        { label: "Destination", keys: ["Destination", "dest", "DestinationName"] },
        { label: "Vendor", keys: ["Vendor", "VendorName", "vendor_name"] },
        { label: "Weight", keys: ["ChargedWeight", "Weight", "ActlWeight"] },
      ];
    }
    return [
      { label: "Manifest", keys: ["ManifestNo", "manifestno", "ManiNo", "CCode"] },
      { label: "Date", keys: ["ManifestDate", "Date", "fdate"] },
      { label: "Vendor", keys: ["Vendor", "VendorName", "vendor_name"] },
      { label: "AWBs", keys: ["AWBCount", "Pcs", "NoOfAwb"] },
    ];
  }, [tab]);

  const search = () => {
    setSelected([]);
    setLoaded(true);
    void listQuery.refetch();
  };

  const manifestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/integrations/world-first/manifest", {
        awbs: selected,
      });
      return res.json() as Promise<{ message: string }>;
    },
    onSuccess: (result) => {
      toast({ title: "Manifest generated", description: result.message });
      setSelected([]);
      setTab("manifest");
      void listQuery.refetch();
    },
    onError: (error: Error) => {
      toast({ title: "Could not manifest", description: error.message, variant: "destructive" });
    },
  });

  const toggleAwb = (awb: string, on: boolean) => {
    setSelected((prev) => (on ? [...new Set([...prev, awb])] : prev.filter((value) => value !== awb)));
  };

  const openManifestPdf = async (manifestNo: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/integrations/world-first/manifest-print?manifestNo=${encodeURIComponent(manifestNo)}`,
        { headers },
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || "Could not print manifest.");
      }
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({
        title: "Could not print manifest",
        description: error instanceof Error ? error.message : "Print failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">World First Day End</h1>
          <p className="text-sm text-muted-foreground">
            After booking, check account balance, view pending AWBs, then manifest to generate invoice and
            manifest documents.
          </p>
        </div>
        <WorldFirstWalletBar />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-4 w-4" />
            Day end
          </CardTitle>
          <CardDescription>Same From Date, To Date, and Vendor filters as Xpresion Day End.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={tab === "pending" ? "default" : "outline"} onClick={() => setTab("pending")}>
              View Pending AWB
            </Button>
            <Button type="button" variant={tab === "manifest" ? "default" : "outline"} onClick={() => setTab("manifest")}>
              View Manifest
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="wf-from">From Date</Label>
              <Input id="wf-from" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wf-to">To Date</Label>
              <Input id="wf-to" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Vendor</Label>
              <Select value={vendor} onValueChange={setVendor}>
                <SelectTrigger>
                  <SelectValue placeholder="All vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All vendors</SelectItem>
                  {WORLD_FIRST_VENDORS.map((row) => (
                    <SelectItem key={row.code} value={row.code}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="button" className="w-full" onClick={search} disabled={listQuery.isFetching}>
                {listQuery.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {tab === "pending" ? "View Pending AWB" : "View Manifest"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">
            {tab === "pending" ? "Pending AWBs" : "Manifests"} ({rows.length})
          </CardTitle>
          {tab === "pending" ? (
            <Button
              type="button"
              disabled={selected.length === 0 || manifestMutation.isPending}
              onClick={() => manifestMutation.mutate()}
            >
              {manifestMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Manifest {selected.length || ""} selected
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {!loaded ? (
            <p className="text-sm text-muted-foreground">Choose dates, then load pending AWBs or manifests.</p>
          ) : listQuery.isError ? (
            <p className="text-sm text-destructive">
              {listQuery.error instanceof Error ? listQuery.error.message : "Could not load World First data."}
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No records for this date range.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    {tab === "pending" ? <th className="px-3 py-2 font-medium"> </th> : null}
                    {columns.map((col) => (
                      <th key={col.label} className="px-3 py-2 font-medium">
                        {col.label}
                      </th>
                    ))}
                    {tab === "manifest" ? <th className="px-3 py-2 font-medium">Print</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const awb = rowAwb(row);
                    const manifestNo = rowManifestNo(row);
                    return (
                      <tr key={`${awb || manifestNo || index}`} className="border-t">
                        {tab === "pending" ? (
                          <td className="px-3 py-2">
                            <Checkbox
                              checked={selected.includes(awb)}
                              disabled={!awb}
                              onCheckedChange={(value) => toggleAwb(awb, value === true)}
                            />
                          </td>
                        ) : null}
                        {columns.map((col) => (
                          <td key={col.label} className="px-3 py-2 font-mono text-xs">
                            {cell(row, col.keys)}
                          </td>
                        ))}
                        {tab === "manifest" ? (
                          <td className="px-3 py-2">
                            {manifestNo ? (
                              <Button variant="outline" size="sm" type="button" onClick={() => void openManifestPdf(manifestNo)}>
                                <Printer className="mr-1 h-3.5 w-3.5" />
                                Invoice / Manifest
                              </Button>
                            ) : (
                              "—"
                            )}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
