import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy, Download, ExternalLink, Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildHubCounterBookingUrl } from "@/lib/hub-qr";
import { XGOO_BRAND, XGOO_MODULES } from "@/components/marketing/site-info";

type HubCounterQrCardProps = {
  officeSlug: string | null | undefined;
  branchId: string;
  hubName: string;
  compact?: boolean;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function copyText(value: string) {
  return navigator.clipboard.writeText(value).catch(() => {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  });
}

export function HubCounterQrCard({
  officeSlug,
  branchId,
  hubName,
  compact = false,
}: HubCounterQrCardProps) {
  const [copied, setCopied] = useState(false);
  const bookingUrl = buildHubCounterBookingUrl(
    typeof window === "undefined" ? "https://www.xgoo.in" : window.location.origin,
    officeSlug,
    branchId,
  );
  const canvasId = `hub-qr-canvas-${branchId}`;
  const qrSize = compact ? 112 : 196;

  const copyLink = async () => {
    await copyText(bookingUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const qrDataUrl = () => {
    const canvas =
      (document.getElementById(canvasId) as HTMLCanvasElement | null) ||
      (document.querySelector(`#${canvasId}-wrap canvas`) as HTMLCanvasElement | null);
    return canvas?.toDataURL("image/png") || "";
  };

  const downloadPng = () => {
    const dataUrl = qrDataUrl();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `xgoo-hub-qr-${hubName.replace(/[^\w]+/g, "-").toLowerCase()}.png`;
    link.click();
  };

  const printPoster = () => {
    const dataUrl = qrDataUrl();
    const popup = window.open("", "_blank", "width=520,height=760");
    if (!popup) {
      window.print();
      return;
    }
    popup.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>${escapeHtml(XGOO_BRAND.productName)} — ${escapeHtml(hubName)}</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; text-align: center; padding: 48px 24px; color: #18181b; }
      h1 { font-size: 28px; margin: 0 0 8px; }
      h2 { font-size: 20px; margin: 0 0 24px; font-weight: 600; }
      img { width: 280px; height: 280px; }
      p { margin: 16px 0 0; }
      .hint { color: #52525b; font-size: 14px; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(XGOO_BRAND.productName)}</h1>
    <h2>${escapeHtml(hubName)}</h2>
    ${dataUrl ? `<img src="${dataUrl}" alt="Hub counter QR" />` : ""}
    <p>Scan to book From and To</p>
    <p class="hint">${escapeHtml(XGOO_MODULES.go.meaning)}</p>
  </body>
</html>`);
    popup.document.close();
    const printNow = () => {
      popup.focus();
      popup.print();
    };
    const img = popup.document.querySelector("img");
    if (img && !img.complete) {
      img.addEventListener("load", printNow, { once: true });
      return;
    }
    printNow();
  };

  const qr = (
    <div className="flex flex-col items-center gap-3">
      <div className="border border-zinc-200 bg-white p-3" data-testid={`hub-qr-${branchId}`} id={`${canvasId}-wrap`}>
        <QRCodeCanvas
          id={canvasId}
          value={bookingUrl}
          size={qrSize}
          level="M"
          marginSize={2}
          bgColor="#ffffff"
          fgColor="#18181b"
        />
      </div>
    </div>
  );

  const actions = (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => void copyLink()} data-testid={`button-copy-hub-qr-${branchId}`}>
        {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
        {copied ? "Copied" : "Copy link"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={printPoster} data-testid={`button-print-hub-qr-${branchId}`}>
        <Printer className="mr-1.5 h-4 w-4" />
        Print
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={downloadPng} data-testid={`button-download-hub-qr-${branchId}`}>
        <Download className="mr-1.5 h-4 w-4" />
        PNG
      </Button>
      <Button type="button" variant="outline" size="sm" asChild>
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-open-hub-qr-${branchId}`}>
          <ExternalLink className="mr-1.5 h-4 w-4" />
          Open
        </a>
      </Button>
    </div>
  );

  if (compact) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {qr}
          <div>
            <p className="text-sm font-medium">Counter QR</p>
            <p className="text-xs text-muted-foreground">
              Customers scan this to fill From and To. The booking stays with {hubName}.
            </p>
          </div>
        </div>
        {actions}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Counter QR
        </CardTitle>
        <CardDescription>
          Print this and keep it at the {XGOO_MODULES.hub.shortName} counter. A customer scans it, fills From
          and To, and the booking shows only in this store. Name and mobile on From create a{" "}
          {XGOO_MODULES.go.name} account if they are new.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {qr}
          <div className="min-w-0 flex-1 space-y-3">
            <Input
              readOnly
              value={bookingUrl}
              className="font-mono text-xs"
              data-testid={`input-hub-qr-url-${branchId}`}
            />
            {actions}
            <p className="text-xs text-muted-foreground">
              Tied to {hubName}. Bookings from this QR do not go to other {XGOO_MODULES.hub.shortName} locations.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
