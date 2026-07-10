import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  getMetaPixelId,
  initMetaPixel,
  shouldEnableMetaPixel,
  trackMetaPageView,
} from "@/lib/meta-pixel";

/**
 * Meta Pixel on all public website routes (marketing + customer portal).
 * Disabled on staff dashboard routes and after staff login.
 */
export function MetaPixel() {
  const pixelId = getMetaPixelId();
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const lastTrackedPathRef = useRef<string | null>(null);

  const enabled = Boolean(
    pixelId &&
      shouldEnableMetaPixel(location, isAuthenticated, isLoading),
  );

  useEffect(() => {
    if (!enabled || !pixelId) return;

    initMetaPixel(pixelId);

    if (lastTrackedPathRef.current === location) return;
    lastTrackedPathRef.current = location;
    trackMetaPageView();
  }, [enabled, pixelId, location, isAuthenticated, isLoading]);

  return null;
}
