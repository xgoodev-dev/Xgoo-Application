/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import {
  createGoogleMapPinSvg,
  loadGoogleMapsScript,
  pixelToLatLng,
  resolveClientGoogleMapsApiKey,
} from "@/lib/google-maps";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type MapCoordinate = {
  lat: number;
  lng: number;
  label?: string;
};

export type GoogleMapCanvasProps = {
  center?: MapCoordinate;
  zoom?: number;
  marker?: MapCoordinate | null;
  markerColor?: string;
  markerLetter?: string;
  markerDraggable?: boolean;
  onMarkerDragEnd?: (coords: { lat: number; lng: number }) => void;
  pickup?: MapCoordinate | null;
  destination?: MapCoordinate | null;
  showRoute?: boolean;
  circleRadiusKm?: number | null;
  circleCenter?: MapCoordinate | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  onUnavailable?: () => void;
  className?: string;
  minHeight?: string | number;
  disableDefaultUI?: boolean;
  testId?: string;
};

const DEFAULT_INDIA_CENTER: MapCoordinate = { lat: 20.5937, lng: 78.9629 };
const PICKUP_COLOR = "#FF4907";
const DESTINATION_COLOR = "#16A34A";
const ROUTE_STROKE_COLOR = "#FF4907";
const STREET_ZOOM = 16;

type MapEngine = "js" | "static";

function focusMapOn(
  map: google.maps.Map,
  pos: { lat: number; lng: number },
  zoomLevel = STREET_ZOOM,
) {
  map.panTo(pos);
  const current = map.getZoom() ?? 0;
  if (current < 14) map.setZoom(zoomLevel);
}

function fallbackView(
  marker: MapCoordinate | null | undefined,
  pickup: MapCoordinate | null | undefined,
  destination: MapCoordinate | null | undefined,
  circleCenter: MapCoordinate | null | undefined,
  center: MapCoordinate | undefined,
  zoom: number,
) {
  if (pickup && destination) {
    return {
      lat: (pickup.lat + destination.lat) / 2,
      lng: (pickup.lng + destination.lng) / 2,
      zoom: Math.min(zoom, 12),
    };
  }
  const point = marker || pickup || destination || circleCenter || center || DEFAULT_INDIA_CENTER;
  return {
    lat: point.lat,
    lng: point.lng,
    zoom: marker || pickup || destination || circleCenter ? zoom : 5,
  };
}

function GoogleMapFallback({
  marker,
  pickup,
  destination,
  circleCenter,
  circleRadiusKm,
  center,
  zoom,
  onMapClick,
  refreshKey,
}: {
  marker?: MapCoordinate | null;
  pickup?: MapCoordinate | null;
  destination?: MapCoordinate | null;
  circleCenter?: MapCoordinate | null;
  circleRadiusKm?: number | null;
  center?: MapCoordinate;
  zoom: number;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  refreshKey: number;
}) {
  const [mode, setMode] = useState<"embed" | "static">("embed");
  const view = fallbackView(marker, pickup, destination, circleCenter, center, zoom);
  const params = new URLSearchParams({
    lat: String(view.lat),
    lng: String(view.lng),
    zoom: String(view.zoom),
    w: "640",
    h: "400",
    k: String(refreshKey),
  });
  if (marker) params.set("m", `${marker.lat},${marker.lng}`);
  if (pickup) params.set("p", `${pickup.lat},${pickup.lng}`);
  if (destination) params.set("d", `${destination.lat},${destination.lng}`);
  if (circleRadiusKm) params.set("circleKm", String(circleRadiusKm));

  useEffect(() => {
    let active = true;
    fetch("/api/maps/static?lat=20.5937&lng=78.9629&zoom=4&w=64&h=64")
      .then((response) => {
        if (active && response.ok) setMode("static");
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (mode === "embed") {
    return (
      <iframe
        title="Google Map"
        className="absolute inset-0 h-full w-full border-0"
        src={`https://maps.google.com/maps?q=${view.lat},${view.lng}&z=${view.zoom}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }

  return (
    <button
      type="button"
      className="absolute inset-0 block h-full w-full cursor-crosshair"
      onClick={(event) => {
        if (!onMapClick) return;
        const rect = event.currentTarget.getBoundingClientRect();
        onMapClick(
          pixelToLatLng(
            event.clientX - rect.left,
            event.clientY - rect.top,
            rect.width,
            rect.height,
            view.lat,
            view.lng,
            view.zoom,
          ),
        );
      }}
    >
      <img
        src={`/api/maps/static?${params.toString()}`}
        alt="Google Map"
        className="h-full w-full"
        draggable={false}
        onError={() => setMode("embed")}
      />
    </button>
  );
}

export function GoogleMapCanvas({
  center,
  zoom = 15,
  marker,
  markerColor = PICKUP_COLOR,
  markerLetter = "",
  markerDraggable = true,
  onMarkerDragEnd,
  pickup,
  destination,
  showRoute = true,
  circleRadiusKm,
  circleCenter,
  onMapClick,
  onUnavailable,
  className,
  minHeight = 220,
  disableDefaultUI = false,
  testId = "google-map-canvas",
}: GoogleMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const singleMarkerRef = useRef<google.maps.Marker | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  const [engine, setEngine] = useState<MapEngine>("js");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const onUnavailableRef = useRef(onUnavailable);
  onUnavailableRef.current = onUnavailable;

  const useStaticMap = useCallback(() => {
    setEngine("static");
    setLoading(false);
    onUnavailableRef.current?.();
  }, []);

  useEffect(() => {
    const previous = (window as Window & { gm_authFailure?: () => void }).gm_authFailure;
    (window as Window & { gm_authFailure?: () => void }).gm_authFailure = () => {
      previous?.();
      console.warn("Google Maps JavaScript API rejected the map. Using Static Maps.");
      useStaticMap();
    };
    return () => {
      (window as Window & { gm_authFailure?: () => void }).gm_authFailure = previous;
    };
  }, [useStaticMap]);

  useEffect(() => {
    if (engine !== "js") return;
    let active = true;

    void resolveClientGoogleMapsApiKey()
      .then((key) => {
        if (!active) return;
        if (!key) {
          useStaticMap();
          return;
        }
        return loadGoogleMapsScript();
      })
      .then((maps) => {
        if (!active || !maps || !containerRef.current) return;

        const initialCenter =
          marker || pickup || circleCenter || center || DEFAULT_INDIA_CENTER;

        const map = new maps.Map(containerRef.current, {
          center: { lat: initialCenter.lat, lng: initialCenter.lng },
          zoom: marker || pickup || circleCenter ? zoom : 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          disableDefaultUI,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          onMapClick?.({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });

        mapInstanceRef.current = map;
        setLoading(false);
        maps.event.trigger(map, "resize");
      })
      .catch((err) => {
        if (!active) return;
        console.warn("Failed to load Google Maps SDK:", err);
        useStaticMap();
      });

    return () => {
      active = false;
      if (singleMarkerRef.current) singleMarkerRef.current.setMap(null);
      if (pickupMarkerRef.current) pickupMarkerRef.current.setMap(null);
      if (destinationMarkerRef.current) destinationMarkerRef.current.setMap(null);
      if (routePolylineRef.current) routePolylineRef.current.setMap(null);
      if (circleRef.current) circleRef.current.setMap(null);
      mapInstanceRef.current = null;
    };
  }, [engine, disableDefaultUI, useStaticMap]);

  useEffect(() => {
    if (engine !== "js") return;
    const node = containerRef.current;
    if (!node) return;

    const hasGoogleError = () =>
      Boolean(node.querySelector(".gm-err-container, .gm-err-message"));

    if (hasGoogleError()) {
      useStaticMap();
      return;
    }

    const observer = new MutationObserver(() => {
      if (hasGoogleError()) useStaticMap();
    });
    observer.observe(node, { childList: true, subtree: true });
    const timer = window.setTimeout(() => {
      if (hasGoogleError()) useStaticMap();
    }, 2500);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [engine, loading, useStaticMap]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const g = (window as unknown as { google?: typeof google }).google;
    if (!map || !g?.maps) return;

    if (!marker) {
      if (singleMarkerRef.current) {
        singleMarkerRef.current.setMap(null);
        singleMarkerRef.current = null;
      }
      return;
    }

    const pos = { lat: marker.lat, lng: marker.lng };
    const icon = createGoogleMapPinSvg({ color: markerColor, letter: markerLetter, size: 36 });

    if (singleMarkerRef.current) {
      singleMarkerRef.current.setPosition(pos);
      singleMarkerRef.current.setIcon(icon);
      singleMarkerRef.current.setDraggable(markerDraggable);
    } else {
      const nextMarker = new g.maps.Marker({
        position: pos,
        map,
        icon,
        draggable: markerDraggable,
        animation: g.maps.Animation.DROP,
      });

      nextMarker.addListener("dragend", () => {
        const p = nextMarker.getPosition();
        if (p && onMarkerDragEnd) {
          onMarkerDragEnd({ lat: p.lat(), lng: p.lng() });
        }
      });

      singleMarkerRef.current = nextMarker;
    }

    focusMapOn(map, pos, zoom);
  }, [marker?.lat, marker?.lng, markerColor, markerLetter, markerDraggable, onMarkerDragEnd, zoom]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const g = (window as unknown as { google?: typeof google }).google;
    if (!map || !g?.maps) return;

    if (pickup) {
      const pPos = { lat: pickup.lat, lng: pickup.lng };
      const pIcon = createGoogleMapPinSvg({ color: PICKUP_COLOR, letter: "P", size: 36 });
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setPosition(pPos);
      } else {
        pickupMarkerRef.current = new g.maps.Marker({
          position: pPos,
          map,
          icon: pIcon,
          draggable: Boolean(onMarkerDragEnd),
        });
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null);
      pickupMarkerRef.current = null;
    }

    if (destination) {
      const dPos = { lat: destination.lat, lng: destination.lng };
      const dIcon = createGoogleMapPinSvg({ color: DESTINATION_COLOR, letter: "D", size: 36 });
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setPosition(dPos);
      } else {
        destinationMarkerRef.current = new g.maps.Marker({
          position: dPos,
          map,
          icon: dIcon,
          draggable: Boolean(onMarkerDragEnd),
        });
      }
    } else if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
      destinationMarkerRef.current = null;
    }

    if (pickup && destination) {
      const bounds = new g.maps.LatLngBounds();
      bounds.extend({ lat: pickup.lat, lng: pickup.lng });
      bounds.extend({ lat: destination.lat, lng: destination.lng });
      map.fitBounds(bounds, 50);
    } else if (pickup) {
      focusMapOn(map, { lat: pickup.lat, lng: pickup.lng }, zoom);
    } else if (destination) {
      focusMapOn(map, { lat: destination.lat, lng: destination.lng }, zoom);
    }
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng, onMarkerDragEnd, zoom]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const g = (window as unknown as { google?: typeof google }).google;
    if (!map || !g?.maps || !showRoute) {
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }
      return;
    }

    if (!pickup || !destination) {
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }
      return;
    }

    let cancelled = false;

    fetch(
      `/api/maps/route?originLat=${pickup.lat}&originLng=${pickup.lng}&destLat=${destination.lat}&destLng=${destination.lng}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !mapInstanceRef.current || !data) return;

        const path =
          data.points?.map(([lat, lng]: [number, number]) => ({ lat, lng })) || [
            { lat: pickup.lat, lng: pickup.lng },
            { lat: destination.lat, lng: destination.lng },
          ];

        if (routePolylineRef.current) {
          routePolylineRef.current.setPath(path);
        } else {
          routePolylineRef.current = new g.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: ROUTE_STROKE_COLOR,
            strokeOpacity: 0.85,
            strokeWeight: 4,
            map: mapInstanceRef.current,
          });
        }
      })
      .catch((err) => {
        console.warn("Route rendering fallback:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng, showRoute]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const g = (window as unknown as { google?: typeof google }).google;
    if (!map || !g?.maps) return;

    const targetCenter = circleCenter || marker || pickup;
    if (!circleRadiusKm || !targetCenter) {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
      return;
    }

    const pos = { lat: targetCenter.lat, lng: targetCenter.lng };
    const radiusMeters = circleRadiusKm * 1000;

    if (circleRef.current) {
      circleRef.current.setCenter(pos);
      circleRef.current.setRadius(radiusMeters);
    } else {
      circleRef.current = new g.maps.Circle({
        strokeColor: "#FF4907",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF4907",
        fillOpacity: 0.12,
        map,
        center: pos,
        radius: radiusMeters,
      });
    }
  }, [circleRadiusKm, circleCenter?.lat, circleCenter?.lng, marker?.lat, marker?.lng, pickup?.lat, pickup?.lng]);

  const handleRefresh = useCallback(() => {
    if (engine === "static") {
      setRefreshKey((value) => value + 1);
      return;
    }
    const map = mapInstanceRef.current;
    const g = (window as unknown as { google?: typeof google }).google;
    if (!map || !g?.maps) {
      useStaticMap();
      return;
    }
    g.maps.event.trigger(map, "resize");
    if (pickup && destination) {
      const bounds = new g.maps.LatLngBounds();
      bounds.extend({ lat: pickup.lat, lng: pickup.lng });
      bounds.extend({ lat: destination.lat, lng: destination.lng });
      map.fitBounds(bounds, 50);
    } else if (marker || pickup || circleCenter || center) {
      const p = marker || pickup || circleCenter || center!;
      focusMapOn(map, { lat: p.lat, lng: p.lng }, zoom);
    }
  }, [engine, marker, pickup, destination, circleCenter, center, zoom, useStaticMap]);

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-md border bg-muted/20", className)}
      style={{ minHeight }}
      data-testid={testId}
    >
      {engine === "js" ? (
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      ) : (
        <GoogleMapFallback
          marker={marker}
          pickup={pickup}
          destination={destination}
          circleCenter={circleCenter}
          circleRadiusKm={circleRadiusKm}
          center={center}
          zoom={zoom}
          onMapClick={onMapClick}
          refreshKey={refreshKey}
        />
      )}

      {loading && engine === "js" ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Loading Google Maps…
          </div>
        </div>
      ) : null}

      {!loading ? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-3 top-3 z-10 h-8 w-8 bg-white/90 shadow-md hover:bg-white dark:bg-zinc-800/90"
          onClick={handleRefresh}
          title="Refresh map"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
