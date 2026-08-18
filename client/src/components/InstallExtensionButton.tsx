import { useState } from "react";
import { CheckCircle2, Puzzle } from "lucide-react";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useXgooExtension } from "@/hooks/use-xgoo-extension";

export function InstallExtensionButton() {
  const { installed, checking } = useXgooExtension();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={installed ? "outline" : "default"}
        size="sm"
        className="hidden sm:inline-flex"
        onClick={() => setOpen(true)}
        data-testid="button-install-extension"
      >
        <img src={xgooLogo} alt="" className="h-4 w-4 object-contain" />
        {checking ? "Checking extension…" : installed ? "Extension connected" : "Install XGoo Partner Sync"}
      </Button>
      <Button
        type="button"
        variant={installed ? "outline" : "default"}
        size="icon"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label={installed ? "XGoo Partner Sync connected" : "Install XGoo Partner Sync extension"}
        data-testid="button-install-extension-icon"
      >
        <img src={xgooLogo} alt="" className="h-5 w-5 object-contain" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-install-extension">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={xgooLogo} alt="" className="h-7 w-7 object-contain" />
              XGoo Partner Sync
            </DialogTitle>
            <DialogDescription>
              {installed
                ? "The extension is connected. Reload it on chrome://extensions after updates."
                : "Install the unpacked Chrome/Edge extension to Autofill partner booking forms."}
            </DialogDescription>
          </DialogHeader>
          {installed ? (
            <p className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Ready for World First, Delhivery, and other browser-assist partners.
            </p>
          ) : (
            <ol className="list-decimal space-y-2 pl-4 text-sm">
              <li>
                Open <code className="text-xs">chrome://extensions</code> (or{" "}
                <code className="text-xs">edge://extensions</code>).
              </li>
              <li>Turn on <strong>Developer mode</strong>.</li>
              <li>
                Click <strong>Load unpacked</strong> and select the{" "}
                <code className="text-xs">extension</code> folder in this XGoo project.
              </li>
              <li>Refresh this page. The header should show Extension connected.</li>
            </ol>
          )}
          <p className="text-xs text-muted-foreground">
            Chrome cannot install unpacked extensions with one click. After load, pin the XGoo icon
            in the toolbar.
          </p>
          {!installed ? (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Puzzle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Keep the <code className="text-xs">extension</code> folder on this machine. Moving it
              disables the extension until you load it again.
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
