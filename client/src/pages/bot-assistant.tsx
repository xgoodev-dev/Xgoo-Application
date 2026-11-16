import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOperatingStore } from "@/hooks/use-operating-store";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { kioskUrl } from "@/features/kiosk/KioskApp";
import type { Office } from "@shared/schema";

const PIN_KEY = "xgoo_kiosk_staff_pin";

export default function BotAssistantPage() {
  const { isCommandWorkspace, store: hub, isLoading } = useOperatingStore();
  const { data: office } = useQuery<Office>({
    queryKey: ["/api/office"],
  });
  const [pin, setPin] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPin(localStorage.getItem(PIN_KEY) || "");
  }, []);

  const url = useMemo(() => {
    if (typeof window === "undefined" || !office?.publicSlug || !hub?.id) return "";
    return kioskUrl(window.location.origin, office.publicSlug, hub.id);
  }, [office?.publicSlug, hub?.id]);

  const openKiosk = () => {
    if (!url) return;
    const from = isCommandWorkspace ? "command" : "hub";
    window.location.href = `${url}${url.includes("?") ? "&" : "?"}from=${from}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">XGoo Bot Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Walk-in receptionist for this {XGOO_MODULES.hub.name} store. Open it on the counter tablet
          {isCommandWorkspace ? ". Pick the store in the header." : "."}
        </p>
      </div>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : !office?.publicSlug ? (
        <p className="text-sm text-muted-foreground">
          Finish Hub setup (store slug) before opening Bot Assistant.
        </p>
      ) : !hub ? (
        <p className="text-sm text-muted-foreground">Select a store in the header first.</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-[#FF4907]" />
              {hub.name}
            </CardTitle>
            <CardDescription>
              Bound to this store. Customers cannot switch stores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input readOnly value={url} className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? "Copied" : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={openKiosk} data-testid="button-open-kiosk">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open on this tablet
              </Button>
            </div>
            <div className="max-w-xs space-y-2">
              <p className="text-sm font-medium">Staff PIN for this tablet</p>
              <Input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Set a PIN"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  localStorage.setItem(PIN_KEY, pin.trim());
                  setSaved(true);
                  window.setTimeout(() => setSaved(false), 2000);
                }}
              >
                {saved ? "Saved on this device" : "Save PIN"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Device-local PIN only. Production stores should still use Hub login to exit kiosk.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
