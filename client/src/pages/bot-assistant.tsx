import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Bot, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { kioskUrl } from "@/features/kiosk/KioskApp";
import type { BranchWithServiceAreas, Office } from "@shared/schema";

const PIN_KEY = "xgoo_kiosk_staff_pin";

export default function BotAssistantPage() {
  const [, setLocation] = useLocation();
  const { isCommandWorkspace, isLoading, branchId } = useStaffAccess();
  const { data: office } = useQuery<Office>({
    queryKey: ["/api/office"],
    enabled: !isLoading && !isCommandWorkspace,
  });
  const { data: branches } = useQuery<BranchWithServiceAreas[]>({
    queryKey: ["/api/branches"],
    enabled: !isLoading && !isCommandWorkspace,
  });
  const [pin, setPin] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && isCommandWorkspace) setLocation("/stores");
  }, [isCommandWorkspace, isLoading, setLocation]);

  useEffect(() => {
    setPin(localStorage.getItem(PIN_KEY) || "");
  }, []);

  const hub =
    branches?.find((branch) => branch.id === branchId) ||
    branches?.find((branch) => branch.isPrimary) ||
    branches?.[0];

  const url = useMemo(() => {
    if (typeof window === "undefined" || !office?.publicSlug) return "";
    return kioskUrl(window.location.origin, office.publicSlug, hub?.id);
  }, [office?.publicSlug, hub?.id]);

  if (isLoading || isCommandWorkspace) return null;

  const openKiosk = () => {
    if (!url) return;
    const withFrom = `${url}${url.includes("?") ? "&" : "?"}from=hub`;
    window.location.href = withFrom;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">XGoo Bot Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Walk-in receptionist for this {XGOO_MODULES.hub.name} store. Open it on the counter tablet.
        </p>
      </div>
      {!office?.publicSlug ? (
        <p className="text-sm text-muted-foreground">
          Finish Hub setup (store slug) before opening Bot Assistant.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-[#FF4907]" />
              {office.name}
            </CardTitle>
            <CardDescription>
              Bound to this store{hub ? ` · ${hub.name}` : ""}. Customers cannot switch stores.
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
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
    </div>
  );
}
