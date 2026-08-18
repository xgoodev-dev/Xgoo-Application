import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Images,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { apiRequest } from "@/lib/queryClient";
import type { Office } from "@shared/schema";
import {
  MAX_APP_BANNERS,
  mergeAppBannerSettings,
  type AppBanner,
  type AppBannerSettings,
} from "@shared/app-banners";

export function AppBannerSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: office, isLoading } = useQuery<Office>({
    queryKey: ["/api/office"],
  });
  const [settings, setSettings] = useState<AppBannerSettings>({ banners: [] });
  const { uploadFile, isUploading } = useUpload({
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!office) return;
    setSettings(
      mergeAppBannerSettings((office as Office & { appBannerSettings?: unknown }).appBannerSettings),
    );
  }, [office]);

  const saveMutation = useMutation({
    mutationFn: async (next: AppBannerSettings) => {
      if (!office?.id) throw new Error("Office not found");
      return apiRequest("PATCH", `/api/office/${office.id}`, {
        appBannerSettings: next,
      });
    },
    onSuccess: () => {
      toast({
        title: "App banners saved",
        description: "Promotional banners will appear on the customer home screen.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/office"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not save banners",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBanner = (id: string, patch: Partial<AppBanner>) => {
    setSettings((current) => ({
      banners: current.banners.map((banner) =>
        banner.id === id ? { ...banner, ...patch } : banner,
      ),
    }));
  };

  const moveBanner = (index: number, direction: -1 | 1) => {
    setSettings((current) => {
      const next = [...current.banners];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { banners: next };
    });
  };

  const removeBanner = (id: string) => {
    setSettings((current) => ({
      banners: current.banners.filter((banner) => banner.id !== id),
    }));
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = MAX_APP_BANNERS - settings.banners.length;
    if (remaining <= 0) {
      toast({
        title: "Banner limit reached",
        description: `You can add up to ${MAX_APP_BANNERS} banners.`,
        variant: "destructive",
      });
      return;
    }

    const accepted = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remaining);

    if (accepted.length === 0) {
      toast({
        title: "Choose an image",
        description: "Upload a JPG, PNG, or WebP banner image.",
        variant: "destructive",
      });
      return;
    }

    const uploaded: AppBanner[] = [];
    for (const file of accepted) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: `${file.name} is over 5MB.`,
          variant: "destructive",
        });
        continue;
      }
      const result = await uploadFile(file);
      if (!result?.objectPath) continue;
      uploaded.push({
        id: crypto.randomUUID(),
        imageUrl: result.objectPath,
        active: true,
      });
    }

    if (uploaded.length > 0) {
      setSettings((current) => ({ banners: [...current.banners, ...uploaded] }));
      toast({
        title: uploaded.length === 1 ? "Banner added" : "Banners added",
        description: "Save to publish these images in the app.",
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading app banners…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="h-5 w-5" />
          App banners
        </CardTitle>
        <CardDescription>
          Add promotional offer images and important notices for the customer app home banner.
          Use landscape images (about 16:9). Customers still book from Quick Actions below the banner.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(event) => void handleUpload(event.target.files)}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {settings.banners.length} of {MAX_APP_BANNERS} banners
            {settings.banners.filter((banner) => banner.active).length
              ? ` · ${settings.banners.filter((banner) => banner.active).length} live`
              : " · none live yet"}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || settings.banners.length >= MAX_APP_BANNERS}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4 mr-2" />
            )}
            Upload image
          </Button>
        </div>

        {settings.banners.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-10 text-center">
            <Images className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium">No banners yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Until you add images, the app shows the default XGoo home banner.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {settings.banners.map((banner, index) => (
              <div key={banner.id} className="rounded-xl border p-3 sm:p-4 space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted sm:w-56 sm:flex-none">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || `Banner ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {!banner.active ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-semibold uppercase tracking-wide text-white">
                        Hidden
                      </div>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor={`banner-active-${banner.id}`} className="text-sm">
                        Show in app
                      </Label>
                      <Switch
                        id={`banner-active-${banner.id}`}
                        checked={banner.active}
                        onCheckedChange={(checked) => updateBanner(banner.id, { active: checked })}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor={`banner-title-${banner.id}`}>Title (optional)</Label>
                        <Input
                          id={`banner-title-${banner.id}`}
                          value={banner.title || ""}
                          maxLength={160}
                          placeholder="Festive offer"
                          onChange={(event) => updateBanner(banner.id, { title: event.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`banner-subtitle-${banner.id}`}>Subtitle (optional)</Label>
                        <Input
                          id={`banner-subtitle-${banner.id}`}
                          value={banner.subtitle || ""}
                          maxLength={160}
                          placeholder="Same-day connection before 1 PM"
                          onChange={(event) =>
                            updateBanner(banner.id, { subtitle: event.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`banner-link-${banner.id}`}>Tap link (optional)</Label>
                      <Input
                        id={`banner-link-${banner.id}`}
                        value={banner.linkUrl || ""}
                        placeholder="https://www.xgoo.in or book"
                        onChange={(event) => updateBanner(banner.id, { linkUrl: event.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => moveBanner(index, -1)}
                      aria-label="Move banner up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={index === settings.banners.length - 1}
                      onClick={() => moveBanner(index, 1)}
                      aria-label="Move banner down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeBanner(banner.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => saveMutation.mutate(settings)}
            disabled={saveMutation.isPending || isUploading || !office?.id}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save banners
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
