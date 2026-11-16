import { createElement, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView as RNWebView, type WebViewMessageEvent } from 'react-native-webview';
import { getMapsPageOrigin, resolveGoogleMapsBrowserKey } from '@/lib/google-maps-key';
import type { MapCoords } from '@/lib/maps';

const WebView = RNWebView as unknown as ComponentType<Record<string, unknown>>;
const MAPS_ORIGIN = `${getMapsPageOrigin()}/`;

export type LiveRouteInfo = {
  distanceText?: string;
  durationText?: string;
};

export type RouteMapProps = {
  origin?: MapCoords | null;
  destination?: MapCoords | null;
  destinationLabel?: string | null;
  points?: Array<[number, number]>;
  follow?: boolean;
  onRouteInfo?: (info: LiveRouteInfo) => void;
};

function buildGoogleRouteHtml(input: { apiKey: string; dest: MapCoords; label: string }) {
  const key = encodeURIComponent(input.apiKey);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <style>
    html, body, #map { margin: 0; height: 100%; width: 100%; background: #e8eaed; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function post(data) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }
    window.gm_authFailure = function () { post({ type: 'auth' }); };
    var map = null;
    var you = null;
    var dest = null;
    var renderer = null;
    var directions = null;
    var fallback = null;
    var lastOrigin = null;
    var lastRouteAt = 0;
    var paused = false;
    var destPos = ${JSON.stringify(input.dest)};
    var destLabel = ${JSON.stringify(input.label)};

    function pin(color, scale) {
      return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: scale,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      };
    }
    function setYou(pos) {
      if (!map) return;
      if (!you) you = new google.maps.Marker({ map: map, position: pos, title: 'You', icon: pin('#18181B', 8), zIndex: 4 });
      else you.setPosition(pos);
    }
    function setDest(pos, label) {
      if (!map) return;
      destPos = pos;
      if (label) destLabel = label;
      if (!dest) dest = new google.maps.Marker({ map: map, position: pos, title: destLabel, icon: pin('#FF4907', 10), zIndex: 3 });
      else dest.setPosition(pos);
    }
    function drawFallback(points) {
      if (!map || !points || points.length < 2) return;
      var path = points.map(function (pair) { return { lat: pair[0], lng: pair[1] }; });
      if (!fallback) {
        fallback = new google.maps.Polyline({
          map: map,
          path: path,
          strokeColor: '#FF4907',
          strokeOpacity: 0.95,
          strokeWeight: 6,
          zIndex: 2
        });
      } else {
        fallback.setPath(path);
      }
    }
    function movedEnough(origin) {
      if (!lastOrigin) return true;
      var dlat = origin.lat - lastOrigin.lat;
      var dlng = origin.lng - lastOrigin.lng;
      var meters = Math.sqrt(dlat * dlat + dlng * dlng) * 111320;
      return meters > 35 || (Date.now() - lastRouteAt) > 25000;
    }
    function routeTo(origin, points) {
      if (!map || !origin || !destPos) return;
      if (!movedEnough(origin)) return;
      lastOrigin = origin;
      lastRouteAt = Date.now();
      directions.route({
        origin: origin,
        destination: destPos,
        travelMode: google.maps.TravelMode.DRIVING
      }, function (result, status) {
        if (status === 'OK' && result) {
          if (fallback) { fallback.setMap(null); fallback = null; }
          renderer.setDirections(result);
          var leg = result.routes[0] && result.routes[0].legs[0];
          if (leg) post({ type: 'route', distanceText: leg.distance && leg.distance.text, durationText: leg.duration && leg.duration.text });
        } else {
          drawFallback(points && points.length > 1 ? points : [[origin.lat, origin.lng], [destPos.lat, destPos.lng]]);
        }
      });
    }
    window.__xgooUpdate = function (state) {
      if (!state) return;
      if (state.destination) setDest(state.destination, state.label);
      if (state.origin) {
        setYou(state.origin);
        if (state.follow && !paused) map.panTo(state.origin);
        routeTo(state.origin, state.points);
      }
    };
    window.__xgooRecenter = function () {
      paused = false;
      if (you) map.panTo(you.getPosition());
      else if (destPos) map.panTo(destPos);
    };
    function initMap() {
      var options = {
        center: destPos,
        zoom: 15,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        gestureHandling: 'greedy'
      };
      if (google.maps.RenderingType && google.maps.RenderingType.RASTER) {
        options.renderingType = google.maps.RenderingType.RASTER;
      }
      map = new google.maps.Map(document.getElementById('map'), options);
      directions = new google.maps.DirectionsService();
      renderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: { strokeColor: '#FF4907', strokeOpacity: 0.95, strokeWeight: 6 }
      });
      setDest(destPos, destLabel);
      map.addListener('dragstart', function () {
        paused = true;
        post({ type: 'paused' });
      });
      post({ type: 'ready' });
    }
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly&callback=initMap" async defer></script>
</body>
</html>`;
}

export function RouteMap({
  origin,
  destination,
  destinationLabel,
  points,
  follow = false,
  onRouteInfo,
}: RouteMapProps) {
  const webRef = useRef<{ injectJavaScript?: (js: string) => void } | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void resolveGoogleMapsBrowserKey().then((key) => {
      if (active) setApiKey(key);
    });
    return () => {
      active = false;
    };
  }, []);

  const dest = destination || origin || null;
  const html = useMemo(() => {
    if (!apiKey || !dest) return '';
    return buildGoogleRouteHtml({
      apiKey,
      dest,
      label: destinationLabel || 'Pickup',
    });
  }, [apiKey, dest?.lat, dest?.lng, destinationLabel]);

  useEffect(() => {
    setReady(false);
  }, [html]);

  function pushState() {
    const payload = {
      origin: origin || null,
      destination: destination || null,
      label: destinationLabel || 'Pickup',
      points: points || [],
      follow,
    };
    webRef.current?.injectJavaScript?.(
      `window.__xgooUpdate && window.__xgooUpdate(${JSON.stringify(payload)}); true;`,
    );
  }

  useEffect(() => {
    if (ready) pushState();
  }, [ready, origin?.lat, origin?.lng, destination?.lat, destination?.lng, destinationLabel, points, follow]);

  function onMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        distanceText?: string;
        durationText?: string;
      };
      if (payload.type === 'auth') {
        setFailed(true);
        return;
      }
      if (payload.type === 'ready') {
        setReady(true);
        pushState();
        return;
      }
      if (payload.type === 'paused') {
        setPaused(true);
        return;
      }
      if (payload.type === 'route') {
        onRouteInfo?.({ distanceText: payload.distanceText, durationText: payload.durationText });
      }
    } catch {
      // Ignore unrelated WebView messages.
    }
  }

  function recenter() {
    setPaused(false);
    webRef.current?.injectJavaScript?.('window.__xgooRecenter && window.__xgooRecenter(); true;');
  }

  if (!dest) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#FF4907" />
        <Text style={styles.loadingText}>Finding the pickup pin…</Text>
      </View>
    );
  }

  if (!apiKey) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#FF4907" />
        <Text style={styles.loadingText}>Loading Google Maps…</Text>
      </View>
    );
  }

  if (failed) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Google Maps could not start. Check the Maps key and reload.</Text>
      </View>
    );
  }

  const mapView =
    Platform.OS === 'web' ? (
      createElement('iframe', {
        title: 'Pickup route',
        srcDoc: html,
        style: { width: '100%', height: '100%', borderWidth: 0 },
      })
    ) : (
      <WebView
        ref={webRef}
        source={{ html, baseUrl: MAPS_ORIGIN }}
        style={styles.web}
        originWhitelist={['https://*', 'http://*', 'about:blank']}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
        nestedScrollEnabled
        onMessage={onMessage}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color="#FF4907" />
          </View>
        )}
      />
    );

  return (
    <View collapsable={false} style={styles.map}>
      {mapView}
      {follow && paused ? (
        <Pressable onPress={recenter} style={styles.recenter}>
          <Text style={styles.recenterText}>Recenter</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, width: '100%', height: '100%', backgroundColor: '#e8eaed', overflow: 'hidden' },
  web: { flex: 1, backgroundColor: '#e8eaed', opacity: 0.99 },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e8eaed',
    paddingHorizontal: 20,
  },
  loadingText: { color: '#5f6368', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  recenter: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 16,
    backgroundColor: '#18181B',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  recenterText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
