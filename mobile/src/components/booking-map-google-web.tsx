import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import {
  fetchGoogleStaticMapDataUri,
  getMapsPageOrigin,
  resolveGoogleMapsBrowserKey,
} from '@/lib/google-maps-key';

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  markerColor?: string;
  onMapPress: (latitude: number, longitude: number) => void;
};

const DEFAULT_LAT = 17.385;
const DEFAULT_LNG = 78.4867;
const MAPS_ORIGIN = `${getMapsPageOrigin()}/`;

function pixelToLatLng(
  x: number,
  y: number,
  width: number,
  height: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
) {
  const scale = 256 * 2 ** zoom;
  const worldX = ((centerLng + 180) / 360) * scale;
  const sinLat = Math.sin((centerLat * Math.PI) / 180);
  const worldY = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  const clickX = worldX + (x - width / 2);
  const clickY = worldY + (y - height / 2);
  const lng = (clickX / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * clickY) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat, lng };
}

function rgbColor(value?: string) {
  const hex = /^#([0-9A-Fa-f]{6})$/.exec(value || '');
  if (!hex) return 'rgb(255,73,7)';
  const n = Number.parseInt(hex[1], 16);
  return `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`;
}

function buildGoogleMapsHtml(input: {
  apiKey: string;
  lat: number;
  lng: number;
  zoom: number;
  markerLat: number | null;
  markerLng: number | null;
  markerColor: string;
}) {
  const key = encodeURIComponent(input.apiKey);
  const hasMarker =
    input.markerLat != null &&
    input.markerLng != null &&
    Number.isFinite(input.markerLat) &&
    Number.isFinite(input.markerLng);
  const pin = rgbColor(input.markerColor);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <style>
    html, body, #map { margin: 0; height: 100%; width: 100%; background: rgb(232,234,237); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function post(data) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }
    window.gm_authFailure = function () { post({ error: 'auth' }); };
    var map = null;
    var marker = null;
    var pending = null;
    function setPin(pos) {
      if (!map) return;
      if (!marker) {
        marker = new google.maps.Marker({
          map: map,
          position: pos,
          draggable: true,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '${pin}',
            fillOpacity: 1,
            strokeColor: 'rgb(255,255,255)',
            strokeWeight: 2
          }
        });
        marker.addListener('dragend', function () {
          var next = marker.getPosition();
          post({ lat: next.lat(), lng: next.lng() });
        });
      } else {
        marker.setPosition(pos);
      }
    }
    window.__xgooSetCenter = function (lat, lng, pinNow) {
      var pos = { lat: lat, lng: lng };
      if (!map) { pending = { pos: pos, pinNow: pinNow }; return; }
      map.panTo(pos);
      if (pinNow) setPin(pos);
    };
    function initMap() {
      var options = {
        center: { lat: ${input.lat}, lng: ${input.lng} },
        zoom: ${input.zoom},
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
      ${hasMarker ? `setPin({ lat: ${input.markerLat}, lng: ${input.markerLng} });` : ''}
      if (pending) {
        map.panTo(pending.pos);
        if (pending.pinNow) setPin(pending.pos);
        pending = null;
      }
      map.addListener('click', function (event) {
        setPin(event.latLng);
        post({ lat: event.latLng.lat(), lng: event.latLng.lng() });
      });
    }
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly&callback=initMap" async defer></script>
</body>
</html>`;
}

export function ExpoGoGoogleMap({
  latitude = null,
  longitude = null,
  markerColor,
  onMapPress,
}: Props) {
  const webRef = useRef<WebView>(null);
  const [apiKey, setApiKey] = useState('');
  const [staticUri, setStaticUri] = useState('');
  const [loading, setLoading] = useState(true);
  const [jsFailed, setJsFailed] = useState(false);
  const [size, setSize] = useState({ width: 640, height: 400 });
  const lat = latitude ?? DEFAULT_LAT;
  const lng = longitude ?? DEFAULT_LNG;
  const zoom = latitude == null || longitude == null ? 11 : 16;
  const hasMarker = latitude != null && longitude != null;

  useEffect(() => {
    let active = true;
    setLoading(true);
    void (async () => {
      const key = await resolveGoogleMapsBrowserKey();
      if (!active) return;
      setApiKey(key);
      if (!key) {
        setStaticUri('');
        setLoading(false);
        return;
      }
      const dataUri = await fetchGoogleStaticMapDataUri({
        apiKey: key,
        lat,
        lng,
        zoom,
        markerLat: latitude,
        markerLng: longitude,
      });
      if (!active) return;
      setStaticUri(dataUri);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [lat, lng, zoom, latitude, longitude]);

  useEffect(() => {
    if (staticUri || !apiKey || jsFailed) return;
    webRef.current?.injectJavaScript(
      `window.__xgooSetCenter && window.__xgooSetCenter(${lat},${lng},${hasMarker ? 'true' : 'false'}); true;`,
    );
  }, [apiKey, jsFailed, staticUri, lat, lng, hasMarker]);

  const html = useMemo(() => {
    if (!apiKey) return '';
    return buildGoogleMapsHtml({
      apiKey,
      lat,
      lng,
      zoom,
      markerLat: latitude,
      markerLng: longitude,
      markerColor: markerColor || 'rgb(255,73,7)',
    });
  }, [apiKey]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as {
        lat?: number;
        lng?: number;
        error?: string;
      };
      if (payload.error) {
        setJsFailed(true);
        return;
      }
      if (typeof payload.lat === 'number' && typeof payload.lng === 'number') {
        onMapPress(payload.lat, payload.lng);
      }
    } catch {
      // Ignore unrelated WebView messages.
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#FF4907" />
        <Text style={styles.loadingText}>Loading Google Map…</Text>
      </View>
    );
  }

  if (staticUri) {
    return (
      <Pressable
        style={styles.map}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          if (width > 0 && height > 0) setSize({ width, height });
        }}
        onPress={(event) => {
          const next = pixelToLatLng(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
            size.width,
            size.height,
            lat,
            lng,
            zoom,
          );
          onMapPress(next.lat, next.lng);
        }}
      >
        <Image source={{ uri: staticUri }} style={styles.map} resizeMode="cover" />
      </Pressable>
    );
  }

  if (apiKey && html && !jsFailed) {
    return (
      <View collapsable={false} style={styles.map}>
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
          renderError={() => (
            <View style={styles.loading}>
              <Text style={styles.loadingText}>Use the address field to set this location.</Text>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.loading}>
      <Text style={styles.loadingText}>Use the address field to set this location.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, width: '100%', height: '100%', backgroundColor: '#e8eaed' },
  web: { flex: 1, backgroundColor: '#e8eaed', opacity: 0.99 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e8eaed',
    paddingHorizontal: 16,
  },
  loadingText: { color: '#5f6368', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
