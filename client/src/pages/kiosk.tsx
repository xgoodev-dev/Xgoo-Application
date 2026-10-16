import { useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { parseHubIdFromSearch } from "@/lib/hub-qr";
import { KioskApp } from "@/features/kiosk/KioskApp";

export default function KioskPage() {
  const params = useParams<{ slug?: string }>();
  const [location] = useLocation();
  const search = typeof window !== "undefined" ? window.location.search : "";
  const hubId = useMemo(() => parseHubIdFromSearch(search), [search, location]);
  const fromHub = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("from") === "hub";
  return <KioskApp slug={params.slug} hubId={hubId} fromHub={fromHub} />;
}
