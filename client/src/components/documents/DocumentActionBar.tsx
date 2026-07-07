import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2, Mail, Printer } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { downloadDocumentAsPdf } from "@/lib/document-pdf";

interface DocumentActionBarProps {
  backLabel?: string;
  onBack: () => void;
  shareText: string;
  downloadFilename: string;
  printLabel?: string;
}

export function DocumentActionBar({
  backLabel = "Back",
  onBack,
  shareText,
  downloadFilename,
  printLabel = "Print",
}: DocumentActionBarProps) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadDocumentAsPdf(downloadFilename);
      toast({ title: "Downloaded", description: "PDF saved to your device." });
    } catch (err) {
      toast({
        title: "Download failed",
        description: err instanceof Error ? err.message : "Could not generate PDF",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="print:hidden p-4 flex items-center gap-2 border-b bg-card flex-wrap sticky top-0 z-10">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" /> {backLabel}
      </Button>
      <div className="flex-1" />
      <Button
        variant="outline"
        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank")}
      >
        <SiWhatsapp className="h-4 w-4 mr-2" /> WhatsApp
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          window.location.href = `mailto:?subject=${encodeURIComponent(downloadFilename.replace(".pdf", ""))}&body=${encodeURIComponent(shareText)}`;
        }}
      >
        <Mail className="h-4 w-4 mr-2" /> Email
      </Button>
      <Button variant="outline" onClick={handleDownload} disabled={downloading}>
        {downloading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Download PDF
      </Button>
      <Button onClick={() => window.print()}>
        <Printer className="h-4 w-4 mr-2" /> {printLabel}
      </Button>
    </div>
  );
}
