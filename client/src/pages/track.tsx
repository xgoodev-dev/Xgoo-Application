import { useEffect, useMemo } from "react";
import { Smartphone } from "lucide-react";
import { useParams, useSearch } from "wouter";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PublicTrackingSearch } from "@/components/customer/PublicTrackingSearch";
import { PageSeo } from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { SEO_PAGES } from "@/lib/seo";
import {
  androidTrackIntentHref,
  isGenericTrackRef,
  xgooGoTrackHref,
} from "@shared/track-links";

const ORANGE = "#FF4907";

function trackingRefFromRoute(params: { ref?: string }, search: string): string {
  const fromPath = params.ref?.trim() || "";
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const fromQuery = (query.get("q") || query.get("ref") || query.get("track") || "").trim();
  const raw = fromPath || fromQuery;
  return isGenericTrackRef(raw) ? "" : raw;
}

function isAndroidBrowser() {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}

function isMobileBrowser() {
  return typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export default function TrackPage() {
  const params = useParams<{ ref?: string }>();
  const search = useSearch();
  const trackingRef = useMemo(() => trackingRefFromRoute(params, search), [params, search]);
  const appHref = xgooGoTrackHref(trackingRef || "open");
  const intentHref =
    typeof window !== "undefined"
      ? androidTrackIntentHref(trackingRef || "open", window.location.href)
      : appHref;

  useEffect(() => {
    if (!isAndroidBrowser()) return;
    const timer = window.setTimeout(() => {
      window.location.href = intentHref;
    }, 250);
    return () => window.clearTimeout(timer);
  }, [intentHref]);

  return (
    <MarketingLayout>
      <PageSeo {...SEO_PAGES.track} />
      <section className="mx-auto w-full max-w-xl px-4 pb-16 pt-4 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: ORANGE }}>
          Track shipment
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
          Where is your parcel?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Enter a request number, booking number, or AWB. If XGoo Go is installed, Track Shipment
          opens your current shipments in the app.
        </p>

        {isMobileBrowser() ? (
          <Button
            asChild
            className="mt-5 h-11 w-full border-0 font-semibold text-white"
            style={{ background: ORANGE }}
          >
            <a href={isAndroidBrowser() ? intentHref : appHref}>
              <Smartphone className="mr-2 h-4 w-4" />
              Open in XGoo Go
            </a>
          </Button>
        ) : null}

        <div className="mt-6 rounded-md border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <PublicTrackingSearch variant="panel" initialQuery={trackingRef} autoSearch />
        </div>
      </section>
    </MarketingLayout>
  );
}
