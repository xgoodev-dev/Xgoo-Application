import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PickupLocationMap } from "@/components/customer/PickupLocationMap";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import {
  DEFAULT_HUB_SERVICE_RADIUS_KM,
  MAX_HUB_SERVICE_RADIUS_KM,
  MIN_HUB_SERVICE_RADIUS_KM,
  parseCoord,
  parseServiceRadiusKm,
} from "@shared/service-coverage";
import type { Branch } from "@shared/schema";

const hubLocationSchema = z.object({
  name: z.string().min(1, "Hub name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  serviceRadiusKm: z.coerce
    .number()
    .min(MIN_HUB_SERVICE_RADIUS_KM)
    .max(MAX_HUB_SERVICE_RADIUS_KM),
});

type HubLocationForm = z.infer<typeof hubLocationSchema>;

function invalidateHubQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
  queryClient.invalidateQueries({ queryKey: ["/api/command/stores"] });
}

export function HubServiceRangeInput({
  branchId,
  value,
}: {
  branchId: string;
  value: string | number | null | undefined;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [km, setKm] = useState(String(parseServiceRadiusKm(value)));

  useEffect(() => {
    setKm(String(parseServiceRadiusKm(value)));
  }, [value]);

  const save = useMutation({
    mutationFn: (serviceRadiusKm: string) =>
      apiRequest("PATCH", `/api/branches/${branchId}`, { serviceRadiusKm }),
    onSuccess: () => {
      invalidateHubQueries(queryClient);
      toast({ title: "Service range updated" });
    },
    onError: (error: Error) =>
      toast({ title: "Could not update range", description: error.message, variant: "destructive" }),
  });

  const commit = () => {
    const next = String(parseServiceRadiusKm(km));
    setKm(next);
    if (next === String(parseServiceRadiusKm(value))) return;
    save.mutate(next);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={MIN_HUB_SERVICE_RADIUS_KM}
        max={MAX_HUB_SERVICE_RADIUS_KM}
        step="1"
        value={km}
        onChange={(event) => setKm(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        className="h-9 w-24"
        aria-label="Service range in kilometres"
        data-testid={`input-hub-radius-${branchId}`}
      />
      <span className="text-sm text-muted-foreground">km</span>
      {save.isPending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
    </div>
  );
}

export function HubServiceAreaSettings({ branch }: { branch: Branch }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<HubLocationForm>({
    resolver: zodResolver(hubLocationSchema),
    defaultValues: {
      name: branch.name || "",
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || "",
      pincode: branch.pincode || "",
      lat: branch.lat || "",
      lng: branch.lng || "",
      serviceRadiusKm: parseServiceRadiusKm(branch.serviceRadiusKm),
    },
  });

  useEffect(() => {
    form.reset({
      name: branch.name || "",
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || "",
      pincode: branch.pincode || "",
      lat: branch.lat || "",
      lng: branch.lng || "",
      serviceRadiusKm: parseServiceRadiusKm(branch.serviceRadiusKm),
    });
  }, [branch, form]);

  const save = useMutation({
    mutationFn: (data: HubLocationForm) =>
      apiRequest("PATCH", `/api/branches/${branch.id}`, {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        lat: data.lat || null,
        lng: data.lng || null,
        serviceRadiusKm: data.serviceRadiusKm,
      }),
    onSuccess: () => {
      invalidateHubQueries(queryClient);
      toast({
        title: "Hub location saved",
        description: `${XGOO_MODULES.go.shortName} and ${XGOO_MODULES.pro.shortName} can book within this range.`,
      });
    },
    onError: (error: Error) =>
      toast({ title: "Could not save Hub location", description: error.message, variant: "destructive" }),
  });

  const lat = parseCoord(form.watch("lat"));
  const lng = parseCoord(form.watch("lng"));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Hub location and service range
        </CardTitle>
        <CardDescription>
          {XGOO_MODULES.go.name} and {XGOO_MODULES.pro.name} can book only around this Hub pin.
          Default range is {DEFAULT_HUB_SERVICE_RADIUS_KM} km. Increase or decrease it here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit((data) => save.mutate(data))}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hub name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. New Hafeezpet Hub" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Street, area" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="serviceRadiusKm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service range (km)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={MIN_HUB_SERVICE_RADIUS_KM}
                      max={MAX_HUB_SERVICE_RADIUS_KM}
                      step="1"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Go and Pro users outside this circle see an expanding-soon page after login.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium">Map pin</p>
              <p className="text-xs text-muted-foreground">
                Search or drop a pin on the Hub. This is the centre of the service circle.
              </p>
              <PickupLocationMap
                initialLat={lat ?? undefined}
                initialLng={lng ?? undefined}
                onLocationSelect={(nextLat, nextLng, name) => {
                  form.setValue("lat", String(nextLat), { shouldDirty: true });
                  form.setValue("lng", String(nextLng), { shouldDirty: true });
                  if (!form.getValues("address")) {
                    form.setValue("address", name, { shouldDirty: true });
                  }
                }}
              />
            </div>
            <Button type="submit" disabled={save.isPending} data-testid="button-save-hub-service-area">
              {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Hub location
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
