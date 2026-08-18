import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, CheckCircle2, Eye, GitCompare, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TariffVersion } from "@shared/schema";
import type { VersionCompareRow } from "./types";

type TariffVersionRow = TariffVersion & { partnerName?: string | null };

type Props = {
  tariffs: TariffVersionRow[];
  loading?: boolean;
  onViewVersion: (id: string) => void;
};

function statusBadge(status: string) {
  if (status === "active") return <Badge className="bg-green-600">Active</Badge>;
  if (status === "archived") return <Badge variant="secondary">Archived</Badge>;
  if (status === "expired") return <Badge variant="outline">Expired</Badge>;
  return <Badge variant="outline">Draft</Badge>;
}

export function RateHistoryTab({ tariffs, loading, onViewVersion }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [compareOpen, setCompareOpen] = useState(false);
  const [versionA, setVersionA] = useState("");
  const [versionB, setVersionB] = useState("");
  const [comparison, setComparison] = useState<VersionCompareRow[]>([]);
  const [comparing, setComparing] = useState(false);

  const activateMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/tariffs/${id}/activate`, {}),
    onSuccess: () => {
      toast({ title: "Version restored as active" });
      queryClient.invalidateQueries({ queryKey: ["/api/tariffs"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/tariffs/${id}/archive`, {}),
    onSuccess: () => {
      toast({ title: "Version archived" });
      queryClient.invalidateQueries({ queryKey: ["/api/tariffs"] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/tariffs/${id}/restore`, {}),
    onSuccess: () => {
      toast({ title: "Version restored to draft" });
      queryClient.invalidateQueries({ queryKey: ["/api/tariffs"] });
    },
  });

  const runCompare = async () => {
    if (!versionA || !versionB) return;
    setComparing(true);
    try {
      const res = await apiRequest("POST", "/api/tariffs/compare", { versionAId: versionA, versionBId: versionB });
      const data = await res.json();
      setComparison(data.comparison || []);
      setCompareOpen(true);
    } catch (e) {
      toast({
        title: "Compare failed",
        description: e instanceof Error ? e.message : "Could not compare",
        variant: "destructive",
      });
    } finally {
      setComparing(false);
    }
  };

  const diffClass = (diff: number) => {
    if (diff > 0.009) return "text-green-600 bg-green-50 dark:bg-green-950/30";
    if (diff < -0.009) return "text-red-600 bg-red-50 dark:bg-red-950/30";
    return "text-muted-foreground bg-muted/50";
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Rate history</CardTitle>
          <div className="flex gap-2 items-center">
            <Select value={versionA} onValueChange={setVersionA}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Old version" /></SelectTrigger>
              <SelectContent>
                {tariffs.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={versionB} onValueChange={setVersionB}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="New version" /></SelectTrigger>
              <SelectContent>
                {tariffs.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={runCompare} disabled={!versionA || !versionB || comparing}>
              {comparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4 mr-1" />}
              Compare
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : !tariffs.length ? (
            <p className="text-sm text-muted-foreground">No tariff versions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Uploaded</TableHead>
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
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {t.validFrom ? new Date(t.validFrom).toLocaleDateString() : "—"}
                      {" → "}
                      {t.validTo ? new Date(t.validTo).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>{t.rowCount ?? 0}</TableCell>
                    <TableCell>{statusBadge(t.status)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => onViewVersion(t.id)} title="View in table">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {t.status !== "active" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => activateMutation.mutate(t.id)}
                          title="Restore as active"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {t.status === "archived" ? (
                        <Button size="sm" variant="ghost" onClick={() => restoreMutation.mutate(t.id)} title="Unarchive">
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      ) : t.status !== "active" && (
                        <Button size="sm" variant="ghost" onClick={() => archiveMutation.mutate(t.id)} title="Archive">
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Version comparison</DialogTitle>
            <DialogDescription>
              Green = price increased · Red = decreased · Grey = no change
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Weight</TableHead>
                <TableHead>Old price</TableHead>
                <TableHead>New price</TableHead>
                <TableHead>Difference</TableHead>
                <TableHead>%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.map((row, i) => (
                <TableRow key={i} className={diffClass(row.diff)}>
                  <TableCell>{row.weight}</TableCell>
                  <TableCell>₹{row.oldPrice.toFixed(2)}</TableCell>
                  <TableCell>₹{row.newPrice.toFixed(2)}</TableCell>
                  <TableCell>{row.diff >= 0 ? "+" : ""}{row.diff.toFixed(2)}</TableCell>
                  <TableCell>{row.pctDiff >= 0 ? "+" : ""}{row.pctDiff}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
}
