import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calculator, IndianRupee, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { apiRequest } from "@/lib/queryClient";
import type { CourierPartner } from "@shared/schema";
import type { PricingQuoteResult } from "@shared/pricing";
import { Link } from "wouter";

type QuoteRow = PricingQuoteResult & { partnerName: string; partnerCode: string };

type CompareResponse = {
  quotes?: QuoteRow[];
} & Partial<QuoteRow>;

type Props = {
  partners: CourierPartner[];
};

function normalizeQuotes(data: CompareResponse | null | undefined): QuoteRow[] {
  if (!data) return [];
  if (Array.isArray(data.quotes)) return data.quotes;
  if (data.courierPartnerId && data.sellPrice != null) {
    return [
      {
        courierPartnerId: data.courierPartnerId,
        serviceType: data.serviceType || "air",
        chargeableWeight: data.chargeableWeight || 0,
        billedWeight: (data.billedWeight ?? data.chargeableWeight) || 0,
        actualWeight: data.actualWeight || 0,
        volumetricWeight: data.volumetricWeight || 0,
        tariffAmount: data.tariffAmount || 0,
        marginAmount: data.marginAmount || 0,
        marginPercent: data.marginPercent || 0,
        marginTotal: data.marginTotal || 0,
        sellPrice: data.sellPrice,
        transitDays: data.transitDays,
        source: data.source || "legacy",
        matchedRowId: data.matchedRowId,
        message: data.message,
        weightRoundOffApplied: data.weightRoundOffApplied,
        partnerName: data.partnerName || "Courier",
        partnerCode: data.partnerCode || "",
      },
    ];
  }
  return [];
}

const ROUNDOFF_STORAGE_KEY = "xgoo-pricing-weight-roundoff";

function readRoundOffPreference(): boolean {
  try {
    const stored = localStorage.getItem(ROUNDOFF_STORAGE_KEY);
    if (stored == null) return true;
    return stored === "1" || stored === "true" || stored === "ceil_kg";
  } catch {
    return true;
  }
}

export function PriceEstimatorTab({ partners }: Props) {
  const [originCountry, setOriginCountry] = useState("IN");
  const [destCountry, setDestCountry] = useState("US");
  const [estFrom, setEstFrom] = useState("");
  const [estTo, setEstTo] = useState("");
  const [estWeight, setEstWeight] = useState("1");
  const [estLength, setEstLength] = useState("");
  const [estWidth, setEstWidth] = useState("");
  const [estHeight, setEstHeight] = useState("");
  const [estService, setEstService] = useState<"air" | "surface">("air");
  const [shipmentType, setShipmentType] = useState("international");
  const [packageType, setPackageType] = useState<"document" | "package">("package");
  const [courierFilter, setCourierFilter] = useState("all");
  const [insurance, setInsurance] = useState(false);
  const [declaredValue, setDeclaredValue] = useState("");
  const [weightRoundOff, setWeightRoundOff] = useState(true);
  const [runEstimate, setRunEstimate] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setWeightRoundOff(readRoundOffPreference());
  }, []);

  const setRoundOff = (enabled: boolean) => {
    setWeightRoundOff(enabled);
    try {
      localStorage.setItem(ROUNDOFF_STORAGE_KEY, enabled ? "ceil_kg" : "off");
    } catch {
      /* ignore */
    }
  };

  const {
    data: estimate,
    isFetching: estimating,
    isError,
    error,
  } = useQuery<CompareResponse>({
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
      originCountry,
      destCountry,
      shipmentType,
      packageType,
      courierFilter,
      insurance,
      declaredValue,
      weightRoundOff,
    ],
    queryFn: async () => {
      setErrorMessage(null);
      try {
        const res = await apiRequest("POST", "/api/pricing/quote", {
          serviceType: estService,
          shipmentType,
          packageType,
          originCountry: originCountry.trim().toUpperCase() || undefined,
          destinationCountry: destCountry.trim().toUpperCase() || undefined,
          senderPincode: estFrom || undefined,
          receiverPincode: estTo || undefined,
          weight: estWeight,
          length: estLength || undefined,
          width: estWidth || undefined,
          height: estHeight || undefined,
          insurance,
          declaredValue: declaredValue || undefined,
          weightRoundOff: weightRoundOff ? "ceil_kg" : "off",
          courierPartnerId: courierFilter !== "all" ? courierFilter : undefined,
        });
        return res.json();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to get estimates";
        setErrorMessage(message);
        throw e;
      }
    },
    enabled: runEstimate > 0 && !!estWeight,
    retry: false,
  });

  const quotes = useMemo(() => {
    const all = normalizeQuotes(estimate);
    return all
      .filter((q) => courierFilter === "all" || q.courierPartnerId === courierFilter)
      .sort((a, b) => a.sellPrice - b.sellPrice);
  }, [estimate, courierFilter]);

  const hasRun = runEstimate > 0;
  const tariffMatched = quotes.filter((q) => q.source === "tariff");
  const fallbackOnly = quotes.length > 0 && tariffMatched.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Price estimator</CardTitle>
        <CardDescription>
          Quotes from active tariff rows using Weight (kg) slabs. Chargeable weight is max(actual, volumetric L×W×H÷5000).
          With round-off on, 1.2 kg bills as 2 kg against the next covering slab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Origin country</Label>
            <Input value={originCountry} onChange={(e) => setOriginCountry(e.target.value)} placeholder="IN" />
          </div>
          <div className="space-y-2">
            <Label>Destination country</Label>
            <Input value={destCountry} onChange={(e) => setDestCountry(e.target.value)} placeholder="US" />
          </div>
          <div className="space-y-2">
            <Label>From pincode</Label>
            <Input value={estFrom} onChange={(e) => setEstFrom(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <Label>To pincode</Label>
            <Input value={estTo} onChange={(e) => setEstTo(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <Label>Shipment type</Label>
            <Select
              value={shipmentType}
              onValueChange={(value) => {
                setShipmentType(value);
                if (value === "international" && destCountry === "IN") setDestCountry("US");
                if (value === "domestic") setDestCountry("IN");
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="domestic">Domestic</SelectItem>
                <SelectItem value="international">International</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Package type</Label>
            <Select
              value={packageType}
              onValueChange={(value) => setPackageType(value as "document" | "package")}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="package">Package</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Courier (optional)</Label>
            <Select value={courierFilter} onValueChange={setCourierFilter}>
              <SelectTrigger><SelectValue placeholder="All couriers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All couriers</SelectItem>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Weight (kg)</Label>
            <Input type="number" step="0.1" value={estWeight} onChange={(e) => setEstWeight(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Service</Label>
            <Select value={estService} onValueChange={(v) => setEstService(v as "air" | "surface")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
          <div className="space-y-2">
            <Label>Declared value (₹)</Label>
            <Input type="number" value={declaredValue} onChange={(e) => setDeclaredValue(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={insurance} onCheckedChange={setInsurance} id="est-insurance" />
            <Label htmlFor="est-insurance">Include insurance</Label>
          </div>
          <div className="flex flex-col gap-1 pt-4 sm:col-span-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={weightRoundOff}
                onCheckedChange={setRoundOff}
                id="est-roundoff"
              />
              <Label htmlFor="est-roundoff">Round weight up to next whole kg</Label>
            </div>
            <p className="text-xs text-muted-foreground pl-0 sm:pl-0">
              Example: 1.2 kg → 2 kg, then match the Weight (kg) tariff slab.
            </p>
          </div>
        </div>

        <Button onClick={() => setRunEstimate((n) => n + 1)} disabled={!estWeight || estimating}>
          {estimating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
          Get estimates
        </Button>

        {hasRun && (isError || errorMessage) && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {errorMessage || (error instanceof Error ? error.message : "Could not get estimates")}
          </div>
        )}

        {hasRun && !estimating && !isError && quotes.length === 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            No quotes returned. Check that an active tariff exists for this courier, destination country, service, and package type.
          </div>
        )}

        {fallbackOnly && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            No matching tariff row for destination <strong>{destCountry || "—"}</strong> / {estService}.
            Showing fallback partner rates. For UPS Express Saver try destination <strong>US</strong> or <strong>CA</strong>.
          </div>
        )}

        {quotes.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Courier / Service</TableHead>
                <TableHead>Actual wt.</TableHead>
                <TableHead>Vol. wt.</TableHead>
                <TableHead>Chargeable</TableHead>
                <TableHead>Billed wt.</TableHead>
                <TableHead>Partner rate</TableHead>
                <TableHead>Your price</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Transit</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((q, i) => (
                <TableRow key={`${q.courierPartnerId}-${q.serviceType}-${i}`} className={i === 0 ? "bg-green-50/50 dark:bg-green-950/20" : ""}>
                  <TableCell className="font-medium">
                    {q.partnerName}
                    <span className="text-xs text-muted-foreground ml-1">({q.serviceType})</span>
                    {i === 0 && <Badge className="ml-2 text-xs">Best</Badge>}
                  </TableCell>
                  <TableCell>{q.actualWeight?.toFixed(2) ?? "—"} kg</TableCell>
                  <TableCell>{q.volumetricWeight?.toFixed(2) ?? "—"} kg</TableCell>
                  <TableCell>{q.chargeableWeight.toFixed(2)} kg</TableCell>
                  <TableCell className="font-medium">
                    {(q.billedWeight ?? q.chargeableWeight).toFixed(2)} kg
                    {q.weightRoundOffApplied ? (
                      <span className="block text-[10px] text-muted-foreground">rounded up</span>
                    ) : null}
                  </TableCell>
                  <TableCell>₹{q.tariffAmount.toFixed(2)}</TableCell>
                  <TableCell className="font-bold text-primary">
                    <IndianRupee className="inline h-3 w-3" />
                    {q.sellPrice.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={q.source === "tariff" ? "default" : "secondary"}>
                      {q.source === "tariff" ? "Tariff" : "Fallback"}
                    </Badge>
                  </TableCell>
                  <TableCell>{q.transitDays != null ? `${q.transitDays}d` : "—"}</TableCell>
                  <TableCell>
                    <Link href="/shipments">
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <Package className="h-3 w-3 mr-1" /> Book
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
