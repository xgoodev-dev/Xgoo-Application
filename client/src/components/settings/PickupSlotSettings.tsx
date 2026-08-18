import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Office } from "@shared/schema";
import {
  DEFAULT_PICKUP_SETTINGS,
  buildDefaultPickupSlots,
  mergePickupSettings,
  type PickupSettings,
} from "@shared/pickup-settings";

export function PickupSlotSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: office, isLoading } = useQuery<Office>({
    queryKey: ["/api/office"],
  });
  const [settings, setSettings] = useState<PickupSettings>(DEFAULT_PICKUP_SETTINGS);

  useEffect(() => {
    if (!office) return;
    setSettings(
      mergePickupSettings((office as Office & { pickupSettings?: unknown }).pickupSettings),
    );
  }, [office]);

  const enabledCount = useMemo(
    () => settings.slots.filter((slot) => slot.enabled).length,
    [settings.slots],
  );

  const saveMutation = useMutation({
    mutationFn: async (next: PickupSettings) => {
      if (!office?.id) throw new Error("Office not found");
      return apiRequest("PATCH", `/api/office/${office.id}`, {
        pickupSettings: next,
      });
    },
    onSuccess: () => {
      toast({
        title: "Pickup slots saved",
        description: "Customers will see these pickup times when booking.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/office"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not save pickup settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleSlot = (value: string, enabled: boolean) => {
    setSettings((current) => ({
      ...current,
      slots: current.slots.map((slot) =>
        slot.value === value ? { ...slot, enabled } : slot,
      ),
    }));
  };

  const resetDefaults = () => {
    setSettings({
      ...DEFAULT_PICKUP_SETTINGS,
      slots: buildDefaultPickupSlots(),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading pickup settings…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="h-5 w-5" />
          Pickup Time Slots
        </CardTitle>
        <CardDescription>
          Control which pickup hours customers can choose (9 AM–7 PM). Add a note about same-day
          vs next-day connection around the 1 PM cutoff.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label className="text-sm font-medium">Available hours</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {enabledCount} of {settings.slots.length} slots enabled
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={resetDefaults}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset defaults
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {settings.slots.map((slot) => (
              <label
                key={slot.value}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer hover:bg-muted/40"
              >
                <Checkbox
                  checked={slot.enabled}
                  onCheckedChange={(checked) => toggleSlot(slot.value, checked === true)}
                />
                <span className="text-sm font-medium">{slot.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{slot.value}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <div className="space-y-2">
            <Label htmlFor="same-day-cutoff">Same-day cutoff</Label>
            <Input
              id="same-day-cutoff"
              type="number"
              min={0}
              max={23}
              value={settings.sameDayCutoffHour}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  sameDayCutoffHour: Math.min(
                    23,
                    Math.max(0, Number(event.target.value) || 0),
                  ),
                }))
              }
            />
            <p className="text-xs text-muted-foreground">Hour in 24h format (13 = 1 PM)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cutoff-note">Customer note</Label>
            <Textarea
              id="cutoff-note"
              value={settings.cutoffNote}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  cutoffNote: event.target.value,
                }))
              }
              className="min-h-[96px] resize-none"
              placeholder="Parcels collected or processed before 1 PM…"
            />
          </div>
        </div>

        <div className="rounded-lg border border-[#FF4907]/25 bg-[#FFF7F3] px-3.5 py-3 text-sm text-zinc-800">
          <p className="font-medium text-[#FF4907] mb-1">Preview note</p>
          <p className="text-zinc-700 leading-relaxed">{settings.cutoffNote}</p>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => saveMutation.mutate(settings)}
            disabled={saveMutation.isPending || enabledCount === 0}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save pickup settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
