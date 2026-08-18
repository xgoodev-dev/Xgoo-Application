import { z } from "zod";

export const MAX_APP_BANNERS = 8;

const optionalText = z
  .string()
  .trim()
  .max(160)
  .optional()
  .transform((value) => (value ? value : undefined));

export const appBannerSchema = z.object({
  id: z.string().min(1),
  imageUrl: z.string().min(1).max(1000),
  title: optionalText,
  subtitle: optionalText,
  linkUrl: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => (value ? value : undefined)),
  active: z.boolean().default(true),
});

export const appBannerSettingsSchema = z.object({
  banners: z.array(appBannerSchema).max(MAX_APP_BANNERS).default([]),
});

export type AppBanner = z.infer<typeof appBannerSchema>;
export type AppBannerSettings = z.infer<typeof appBannerSettingsSchema>;

export const DEFAULT_APP_BANNER_SETTINGS: AppBannerSettings = {
  banners: [],
};

export function mergeAppBannerSettings(raw: unknown): AppBannerSettings {
  if (!raw || typeof raw !== "object") {
    return { banners: [] };
  }

  const parsed = appBannerSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { banners: [] };
  }

  return {
    banners: parsed.data.banners.map((banner) => ({ ...banner })),
  };
}

export function publishedAppBanners(raw: unknown): AppBanner[] {
  return mergeAppBannerSettings(raw).banners.filter(
    (banner) => banner.active && banner.imageUrl.trim().length > 0,
  );
}
