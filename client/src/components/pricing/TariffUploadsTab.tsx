import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, Download, Loader2, AlertCircle } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, authFetch } from "@/lib/queryClient";
import {
  TARIFF_UPLOAD_ACCEPT,
  buildTariffUploadPayloadFromFiles,
  fileFromBase64,
  isTariffImageFile,
} from "@/lib/tariff-upload";
import type { CourierPartner, TariffVersion } from "@shared/schema";
import { ImportPreviewDialog } from "./ImportPreviewDialog";
import type { ImportPreviewItem } from "./types";

type Props = {
  partners: CourierPartner[];
  tariffs: TariffVersion[];
  onImported?: (versionId: string) => void;
};

export function TariffUploadsTab({ partners, tariffs, onImported }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);

  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadPartnerId, setUploadPartnerId] = useState("");
  const [compareVersionId, setCompareVersionId] = useState("");
  const [validFrom, setValidFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [validTo, setValidTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [activateOnUpload, setActivateOnUpload] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewItem[]>([]);
  const [previewSummary, setPreviewSummary] = useState<Record<string, number>>({});
  const [previewTotal, setPreviewTotal] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [readingPhoto, setReadingPhoto] = useState(false);

  const handleDownloadTemplate = async () => {
    const res = await authFetch("/api/tariffs/template");
    if (!res.ok) {
      toast({ title: "Download failed", variant: "destructive" });
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "xgoo-tariff-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const runPreview = async (files: File[]) => {
    if (!uploadLabel.trim()) {
      toast({ title: "Label required", description: "Enter a name for this tariff cycle.", variant: "destructive" });
      return;
    }
    const usable = files.filter(Boolean);
    if (usable.length === 0) return;
    setIsUploading(true);
    setReadingPhoto(usable.some(isTariffImageFile));
    try {
      const payload = await buildTariffUploadPayloadFromFiles(usable, {
        label: uploadLabel,
        courierPartnerId: uploadPartnerId || undefined,
        compareVersionId: compareVersionId || undefined,
      });
      const res = await apiRequest("POST", "/api/tariffs/preview", payload);
      const data = await res.json();

      if (Array.isArray(data.createdPartners) && data.createdPartners.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      }

      pendingFileRef.current =
        data.extracted?.fileData && data.extracted?.fileName
          ? fileFromBase64(data.extracted.fileName, data.extracted.fileData)
          : usable[0];
      setPreview(data.preview || []);
      setPreviewSummary(data.summary || {});
      setPreviewTotal(data.totalRows || 0);
      setPreviewOpen(true);
      if (data.source === "image") {
        toast({
          title: "Rate card read",
          description: `${data.totalRows || 0} tariff rows extracted from the photo. Review and confirm to import.`,
        });
      }
    } catch (e) {
      toast({
        title: "Preview failed",
        description: e instanceof Error ? e.message : "Could not parse file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setReadingPhoto(false);
    }
  };

  const confirmImport = async () => {
    const file = pendingFileRef.current;
    if (!file) return;
    setIsUploading(true);
    try {
      const payload = await buildTariffUploadPayloadFromFiles([file], {
        label: uploadLabel,
        courierPartnerId: uploadPartnerId || undefined,
        validFrom,
        validTo,
        activate: activateOnUpload ? "true" : "false",
      });
      const res = await apiRequest("POST", "/api/tariffs/upload", payload);
      const data = await res.json();

      if (Array.isArray(data.createdPartners) && data.createdPartners.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      }

      toast({
        title: "Tariff imported",
        description: `${data.imported} rows imported${data.parseErrors?.length ? ` (${data.parseErrors.length} skipped)` : ""}.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/tariffs"] });
      setUploadLabel("");
      setPreviewOpen(false);
      pendingFileRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (data.version?.id) {
        onImported?.(data.version.id);
      }
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bulk tariff import</CardTitle>
          <CardDescription>
            Upload CSV, Excel, or a photo/scan of a rate card. Photos are converted into the tariff template and previewed before you confirm.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download template
          </Button>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Tariff cycle name *</Label>
              <Input value={uploadLabel} onChange={(e) => setUploadLabel(e.target.value)} placeholder="e.g. FedEx March 2026" />
            </div>
            <div className="space-y-2">
              <Label>Default partner (optional)</Label>
              <Select value={uploadPartnerId || "all"} onValueChange={(v) => setUploadPartnerId(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="All partners" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All partners (partner_code column)</SelectItem>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Compare against (optional)</Label>
              <Select value={compareVersionId || "none"} onValueChange={(v) => setCompareVersionId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="No comparison" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No comparison</SelectItem>
                  {tariffs.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
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
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors ${
              dragActive ? "border-primary bg-muted/50" : ""
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(false);
              const dropped = Array.from(e.dataTransfer.files || []);
              if (dropped.length) runPreview(dropped);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={TARIFF_UPLOAD_ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                if (selected.length) runPreview(selected);
              }}
            />
            {isUploading ? (
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            )}
            <p className="mt-2 font-medium">
              {readingPhoto
                ? "Reading rate card from photo…"
                : isUploading
                  ? "Preparing preview…"
                  : "Drop CSV, Excel, or a rate-card photo here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, WEBP, or GIF photos are converted to the tariff template. Spreadsheets still work as before.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="pt-4 flex gap-2 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium">Tariff table is the source of truth</p>
            <p className="text-muted-foreground">
              Edit rates in the <strong>Tariff Table</strong> tab. Customer price is calculated from partner rate, margins, charges, discount, and GST.
            </p>
          </div>
        </CardContent>
      </Card>

      <ImportPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        preview={preview}
        summary={previewSummary}
        totalRows={previewTotal}
        onConfirm={confirmImport}
        confirming={isUploading}
      />
    </div>
  );
}
