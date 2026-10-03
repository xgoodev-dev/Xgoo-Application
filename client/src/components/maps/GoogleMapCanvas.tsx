/// <reference types="@types/google.maps" />

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, MapPin, RefreshCw } from "lucide-react";
import {
  createGoogleMapPinSvg,
  getClientGoogleMapsApiKey,
  loadGoogleMapsScript,
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
  // Single marker mode:
  marker?: MapCoordinate | null;
  markerColor?: string;
  markerLetter?: string;
  markerDraggable?: boolean;
  onMarkerDragEnd?: (coords: { lat: number; lng: number }) => void;
  // Dual marker mode (Pickup + Destination):
  pickup?: MapCoordinate | null;
  destination?: MapCoordinate | null;
  showRoute?: boolean;
  // Circle radius overlay (in km) - e.g. for Hub service area:
  circleRadiusKm?: number | null;
  circleCenter?: MapCoordinate | null;
  // Map interactions:
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  className?: string;
  minHeight?: string | number;
  disableDefaultUI?: boolean;
  testId?: string;
};

const DEFAULT_INDIA_CENTER: MapCoordinate = { lat: 20.5937, lng: 78.9629 };
const PICKUP_COLOR = "#FF4907";
const DESTINATION_COLOR = "#16A34A";
const ROUTE_STROKE_COLOR = "#FF4907";

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize map once script is ready
  useEffect(() => {
    let active = true;

    if (!getClientGoogleMapsApiKey()) {
      setError("Google Maps API key not configured. Set VITE_GOOGLE_MAPS_API_KEY in .env");
      setLoading(false);
      return;
    }

    loadGoogleMapsScript()
      .then((maps) => {
        if (!active || !containerRef.current) return;

        const initialCenter =
          marker ||
          pickup ||
          circleCenter ||
          center ||
          DEFAULT_INDIA_CENTER;

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

        // Click on map
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          if (onMapClick) {
            onMapClick({ lat, lng });
          }
        });

        mapInstanceRef.current = map;
        setLoading(false);
      })
      .catch((err) => {
        if (active) {
          console.warn("Failed to load Google Maps SDK:", err);
          setError("Could not load Google Maps. Please check network connection.");
          setLoading(false);
        }
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
  }, [disableDefaultUI]);

  // Update Single Marker
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
      const m = new g.maps.Marker({
        position: pos,
        map,
        icon,
        draggable: markerDraggable,
        animation: g.maps.Animation.DROP,
      });

      m.addListener("dragend", () => {
        const p = m.getPosition();
        if (p && onMarkerDragEnd) {
          onMarkerDragEnd({ lat: p.lat(), lng: p.lng() });
        }
      });

      singleMarkerRef.current = m;
    }

    map.panTo(pos);
  }, [marker?.lat, marker?.lng, markerColor, markerLetter, markerDraggable, onMarkerDragEnd]);

  // Update Dual Markers (Pickup & Destination)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const g = (window as unknown as { google?: typeof google }).google;
    if (!map || !g?.maps) return;

    // Pickup Pin
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

    // Destination Pin
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

    // Fit Bounds
    if (pickup && destination) {
      const bounds = new g.maps.LatLngBounds();
      bounds.extend({ lat: pickup.lat, lng: pickup.lng });
      bounds.extend({ lat: destination.lat, lng: destination.lng });
      map.fitBounds(bounds, 50);
    } else if (pickup) {
      map.panTo({ lat: pickup.lat, lng: pickup.lng });
    } else if (destination) {
      map.panTo({ lat: destination.lat, lng: destination.lng });
    }
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng, onMarkerDragEnd]);

  // Update Route Polyline
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

    // Fetch route from backend Directions proxy
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

  // Update Circle Radius (e.g. for Hub service coverage)
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
    const map = mapInstanceRef.current;
    const g = (window as unknown as { google?: typeof google }).google;
    if (!map || !g?.maps) return;
    g.maps.event.trigger(map, "resize");
    if (pickup && destination) {
      const bounds = new g.maps.LatLngBounds();
      bounds.extend({ lat: pickup.lat, lng: pickup.lng });
      bounds.extend({ lat: destination.lat, lng: destination.lng });
      map.fitBounds(bounds, 50);
    } else if (marker || pickup || circleCenter || center) {
      const p = marker || pickup || circleCenter || center!;
      map.panTo({ lat: p.lat, lng: p.lng });
    }
  }, [marker, pickup, destination, circleCenter, center]);

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-md border bg-muted/20", className)}
      style={{ minHeight }}
      data-testid={testId}
    >
      <div ref={containerRef} className="h-full w-full absolute inset-0" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Loading Google Maps…
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/40 p-4 text-center z-10">
          <MapPin className="h-8 w-8 text-primary mb-2 opacity-80" />
          <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-3 top-3 z-10 h-8 w-8 shadow-md bg-white/90 hover:bg-white dark:bg-zinc-800/90"
          onClick={handleRefresh}
          title="Refresh map"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
