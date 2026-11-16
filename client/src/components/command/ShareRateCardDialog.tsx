import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileImage, FileSpreadsheet, FileText, Loader2, Mail, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { XGOO_CONTACT } from "@/components/marketing/site-info";
import { toGridRow, type EnrichedTariffRow } from "@/components/pricing/types";
import {
  buildRateCardFile,
  downloadTariffPricingImages,
  downloadTariffPricingPdf,
  downloadTariffPricingSheets,
  rateCardShareText,
  shareRateCardFile,
  triggerDownload,
  type RateCardAudience,
  type RateCardFormat,
} from "@/lib/tariff-pricing-pdf";
import type { CourierPartner } from "@shared/schema";

type RateCardResponse = {
  rowCount: number;
  sheetCount: number;
  sheets: Array<{
    id: string;
    label: string;
    status: string;
    validFrom?: string | null;
    validTo?: string | null;
    partnerName?: string | null;
  }>;
  rows: EnrichedTariffRow[];
  validFrom?: string | null;
  validTo?: string | null;
};

const AUDIENCES: Array<{ id: RateCardAudience; label: string; detail: string }> = [
  { id: "customers", label: "Customers", detail: "Doorstep and store bookings" },
  { id: "partners", label: "Partners", detail: "Courier and channel partners" },
  { id: "collaborators", label: "Collaborators", detail: "XGoo stores and teams" },
];

const FORMATS: Array<{ id: RateCardFormat; label: string; icon: typeof FileText }> = [
  { id: "pdf", label: "PDF", icon: FileText },
  { id: "image", label: "Image", icon: FileImage },
  { id: "sheets", label: "Sheets", icon: FileSpreadsheet },
];

export function ShareRateCardDialog({
  triggerLabel = "Share rate card",
  compact = false,
}: {
  triggerLabel?: string;
  compact?: boolean;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState<RateCardAudience>("customers");
  const [format, setFormat] = useState<RateCardFormat>("pdf");
  const [busy, setBusy] = useState<"download" | "share" | "whatsapp" | "email" | null>(null);

  const partners = useQuery<CourierPartner[]>({
    queryKey: ["/api/partners"],
    enabled: open,
  });
  const card = useQuery<RateCardResponse>({
    queryKey: ["/api/tariffs/rate-card"],
    enabled: open,
  });

  const options = useMemo(() => {
    if (!card.data?.rows.length) return null;
    return {
      rows: card.data.rows.map(toGridRow),
      partners: partners.data || [],
      version: {
        label:
          card.data.sheetCount > 1
            ? `Consolidated · ${card.data.sheetCount} tariff sheets`
            : card.data.sheets[0]?.label || "XGoo rate card",
        validFrom: card.data.validFrom,
        validTo: card.data.validTo,
      },
      audience,
      title: "XGoo Rate Card",
    };
  }, [audience, card.data, partners.data]);

  async function run(action: "download" | "share" | "whatsapp" | "email") {
    if (!options) {
      toast({
        title: "No rates to share",
        description: "Activate or keep a draft tariff sheet first.",
        variant: "destructive",
      });
      return;
    }
    setBusy(action);
    try {
      if (action === "download") {
        if (format === "pdf") await downloadTariffPricingPdf(options);
        else if (format === "image") await downloadTariffPricingImages(options);
        else await downloadTariffPricingSheets(options);
        toast({
          title: "Rate card ready",
          description: `Branded ${format === "sheets" ? "Excel / Google Sheets" : format} file downloaded.`,
        });
        return;
      }
      const file = await buildRateCardFile(options, format);
      if (action === "share") {
        const result = await shareRateCardFile(file);
        toast({
          title: result === "shared" ? "Rate card shared" : "Rate card downloaded",
          description:
            result === "shared"
              ? "Pick WhatsApp, email, or another app on this device."
              : "This browser cannot attach the file. The branded rate card was downloaded instead.",
        });
        return;
      }
      triggerDownload(file.blob, file.filename);
      const text = rateCardShareText(file.prepared);
      const link =
        action === "whatsapp"
          ? `https://wa.me/?text=${encodeURIComponent(`${text}\n\nAttach the downloaded ${file.filename} file.`)}`
          : `mailto:?subject=${encodeURIComponent("XGoo Rate Card")}&body=${encodeURIComponent(`${text}\n\nAttach the downloaded ${file.filename} file.`)}`;
      window.open(link, "_blank", "noopener,noreferrer");
      toast({
        title: action === "whatsapp" ? "WhatsApp opened" : "Email opened",
        description: "The branded rate card was downloaded so you can attach it.",
      });
    } catch (error) {
      toast({
        title: "Could not share the rate card",
        description: error instanceof Error ? error.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={compact ? "sm" : "default"} className="gap-1.5" data-testid="button-share-rate-card">
          <Share2 className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share XGoo rate card</DialogTitle>
          <DialogDescription>
            Send a branded, consolidated card to customers, partners, or collaborators as PDF, image, or Sheets.
          </DialogDescription>
        </DialogHeader>

        {card.isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Building the consolidated rate card…
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {card.data?.rowCount || 0} live rates from {card.data?.sheetCount || 0} tariff{" "}
              {(card.data?.sheetCount || 0) === 1 ? "sheet" : "sheets"}.
            </p>

            <div className="space-y-2">
              <Label>Share with</Label>
              <div className="grid grid-cols-3 gap-2">
                {AUDIENCES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAudience(item.id)}
                    className={`rounded-lg border px-3 py-2 text-left ${
                      audience === item.id ? "border-[#FF4907] bg-[#FFF0EA]" : "border-border"
                    }`}
                  >
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground">{item.detail}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Format</Label>
              <div className="grid grid-cols-3 gap-2">
                {FORMATS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormat(item.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold ${
                      format === item.id ? "border-[#FF4907] bg-[#FFF0EA]" : "border-border"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button disabled={Boolean(busy)} onClick={() => void run("download")}>
                {busy === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Download
              </Button>
              <Button variant="outline" disabled={Boolean(busy)} onClick={() => void run("share")}>
                {busy === "share" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                Share
              </Button>
              <Button variant="outline" disabled={Boolean(busy)} onClick={() => void run("whatsapp")}>
                {busy === "whatsapp" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                WhatsApp
              </Button>
              <Button variant="outline" disabled={Boolean(busy)} onClick={() => void run("email")}>
                {busy === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Email
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {XGOO_CONTACT.website} · {XGOO_CONTACT.email} · {XGOO_CONTACT.phone}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
