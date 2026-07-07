import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  Download,
  Calculator,
  FileSpreadsheet,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CourierPartner, TariffVersion } from "@shared/schema";
import type { PricingQuoteResult } from "@shared/pricing";

type TariffVersionRow = TariffVersion & { partnerName?: string | null };

type CompareResponse = {
  quotes: Array<PricingQuoteResult & { partnerName: string; partnerCode: string }>;
};

export default function PricingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadPartnerId, setUploadPartnerId] = useState<string>("");
  const [validFrom, setValidFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [validTo, setValidTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [activateOnUpload, setActivateOnUpload] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [estFrom, setEstFrom] = useState("");
  const [estTo, setEstTo] = useState("");
  const [estWeight, setEstWeight] = useState("1");
  const [estLength, setEstLength] = useState("");
  const [estWidth, setEstWidth] = useState("");
  const [estHeight, setEstHeight] = useState("");
  const [estService, setEstService] = useState<"air" | "surface">("surface");
  const [runEstimate, setRunEstimate] = useState(0);

  const { data: partners } = useQuery<CourierPartner[]>({
    queryKey: ["/api/partners"],
  });

  const { data: tariffs, isLoading: tariffsLoading } = useQuery<TariffVersionRow[]>({
    queryKey: ["/api/tariffs"],
  });

  const { data: estimate, isFetching: estimating } = useQuery<CompareResponse>({
    queryKey: [
      "pricing-estimate",
      runEstimate,
      estFrom,
      estTo,
      estWeight,
      estService,
      estLength,
      estWidth,
      estHeight,
    ],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/pricing/quote", {
        serviceType: estService,
        senderPincode: estFrom || undefined,
        receiverPincode: estTo || undefined,
        weight: estWeight,
        length: estLength || undefined,
        width: estWidth || undefined,
        height: estHeight || undefined,
      });
      return res.json();
    },
    enabled: runEstimate > 0 && !!estWeight,
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("POST", `/api/tariffs/${id}/activate`, {}),
    onSuccess: () => {
      toast({ title: "Tariff activated", description: "This rate card is now live for bookings." });
      queryClient.invalidateQueries({ queryKey: ["/api/tariffs"] });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/tariffs/${id}`),
    onSuccess: () => {
      toast({ title: "Tariff deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/tariffs"] });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleDownloadTemplate = async () => {
    const res = await fetch("/api/tariffs/template", { credentials: "include" });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "xgoo-tariff-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async (file: File) => {
    if (!uploadLabel.trim()) {
      toast({ title: "Label required", description: "Enter a name for this tariff cycle.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("label", uploadLabel);
      if (uploadPartnerId) formData.append("courierPartnerId", uploadPartnerId);
      formData.append("validFrom", validFrom);
      formData.append("validTo", validTo);
      formData.append("activate", activateOnUpload ? "true" : "false");

      const res = await fetch("/api/tariffs/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      toast({
        title: "Tariff imported",
        description: `${data.imported} rows imported${data.parseErrors?.length ? ` (${data.parseErrors.length} skipped)` : ""}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tariffs"] });
      setUploadLabel("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Could not import file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-green-600">Active</Badge>;
    if (status === "expired") return <Badge variant="secondary">Expired</Badge>;
    return <Badge variant="outline">Draft</Badge>;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Shipping Price Estimator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload partner tariff sheets (CSV/Excel), set margins on Courier Partners, and get live quotes for bookings.
        </p>
      </div>

      <Tabs defaultValue="tariffs">
        <TabsList>
          <TabsTrigger value="tariffs">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Tariff Uploads
          </TabsTrigger>
          <TabsTrigger value="estimator">
            <Calculator className="h-4 w-4 mr-2" />
            Price Estimator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tariffs" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bulk tariff import</CardTitle>
              <CardDescription>
                Upload CSV or Excel (.xlsx) from FedEx, ICL, UPS, etc. Tariffs typically refresh every 15 days.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download template
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Tariff cycle name *</Label>
                  <Input
                    value={uploadLabel}
                    onChange={(e) => setUploadLabel(e.target.value)}
                    placeholder="e.g. FedEx March 2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default partner (optional)</Label>
                  <Select value={uploadPartnerId || "all"} onValueChange={(v) => setUploadPartnerId(v === "all" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All partners in file" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All partners (use partner_code column)</SelectItem>
                      {partners?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valid from</Label>
                  <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Valid to</Label>
                  <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={activateOnUpload} onCheckedChange={setActivateOnUpload} id="activate-upload" />
                  <Label htmlFor="activate-upload">Activate immediately</Label>
                </div>
              </div>

              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
                {isUploading ? (
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                )}
                <p className="mt-2 font-medium">Drop CSV / Excel here or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Columns: partner_code, service_type, origin/destination pincode or zone, weight_min, weight_max, tariff_amount
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Imported tariff cycles</CardTitle>
            </CardHeader>
            <CardContent>
              {tariffsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : !tariffs?.length ? (
                <p className="text-sm text-muted-foreground">No tariffs uploaded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Valid</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tariffs.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.label}</TableCell>
                        <TableCell>{t.partnerName || "Multi-partner"}</TableCell>
                        <TableCell className="text-xs">
                          {t.validFrom ? new Date(t.validFrom).toLocaleDateString() : "—"}
                          {" → "}
                          {t.validTo ? new Date(t.validTo).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>{t.rowCount ?? 0}</TableCell>
                        <TableCell>{statusBadge(t.status)}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {t.status !== "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => activateMutation.mutate(t.id)}
                              disabled={activateMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(t.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="pt-4 flex gap-2 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium">Margins are set per partner</p>
                <p className="text-muted-foreground">
                  Go to <strong>Courier Partners</strong> → edit partner → set <strong>Margin (₹)</strong> and{" "}
                  <strong>Margin (%)</strong>. Sell price = partner tariff + fixed margin + percentage margin.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estimator" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compare all partners</CardTitle>
              <CardDescription>Uses active tariff rows + your margins. Falls back to rate card if no match.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>From pincode</Label>
                  <Input value={estFrom} onChange={(e) => setEstFrom(e.target.value)} placeholder="110001" />
                </div>
                <div className="space-y-2">
                  <Label>To pincode</Label>
                  <Input value={estTo} onChange={(e) => setEstTo(e.target.value)} placeholder="400001" />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input type="number" step="0.1" value={estWeight} onChange={(e) => setEstWeight(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Select value={estService} onValueChange={(v) => setEstService(v as "air" | "surface")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="surface">Surface</SelectItem>
                      <SelectItem value="air">Air</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>L (cm)</Label>
                  <Input type="number" value={estLength} onChange={(e) => setEstLength(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>W (cm)</Label>
                  <Input type="number" value={estWidth} onChange={(e) => setEstWidth(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>H (cm)</Label>
                  <Input type="number" value={estHeight} onChange={(e) => setEstHeight(e.target.value)} />
                </div>
              </div>
              <Button onClick={() => setRunEstimate((n) => n + 1)} disabled={!estWeight || estimating}>
                {estimating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
                Get estimates
              </Button>

              {estimate?.quotes && estimate.quotes.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Chg. weight</TableHead>
                      <TableHead>Partner tariff</TableHead>
                      <TableHead>Margin</TableHead>
                      <TableHead>Your price</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estimate.quotes.map((q, i) => (
                      <TableRow key={q.courierPartnerId} className={i === 0 ? "bg-green-50/50 dark:bg-green-950/20" : ""}>
                        <TableCell className="font-medium">
                          {q.partnerName}
                          {i === 0 && <Badge className="ml-2 text-xs">Best</Badge>}
                        </TableCell>
                        <TableCell>{q.chargeableWeight.toFixed(2)} kg</TableCell>
                        <TableCell>₹{q.tariffAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-xs">
                          ₹{q.marginAmount} + {q.marginPercent}%
                          <br />
                          = ₹{q.marginTotal.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-bold text-primary">
                          <IndianRupee className="inline h-3 w-3" />
                          {q.sellPrice.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={q.source === "tariff" ? "default" : "secondary"}>{q.source}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
