import { Bot, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { kioskUrl } from "@/features/kiosk/KioskApp";
import { XGOO_MODULES } from "@/components/marketing/site-info";

export function HubBotAssistantCard({
  officeSlug,
  branchId,
  hubName,
}: {
  officeSlug: string | null | undefined;
  branchId: string;
  hubName: string;
}) {
  const url =
    typeof window === "undefined" || !officeSlug
      ? ""
      : kioskUrl(window.location.origin, officeSlug, branchId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-[#FF4907]" />
          XGoo Bot Assistant
        </CardTitle>
        <CardDescription>
          Counter receptionist for {hubName}. Opens in kiosk view, bound to this {XGOO_MODULES.hub.name}{" "}
          store.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild disabled={!url}>
          <a href={url ? `${url}${url.includes("?") ? "&" : "?"}from=hub` : "#"}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Bot Assistant
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href="/bot-assistant">Bot settings</a>
        </Button>
      </CardContent>
    </Card>
  );
}
