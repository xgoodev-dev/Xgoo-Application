import { getGoogleMapsApiKey } from "./geocode";

function numberOr(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function renderGoogleMapsInteractivePage(input: {
  lat: number;
  lng: number;
  zoom: number;
  markerLat?: number | null;
  markerLng?: number | null;
  markerColor?: string;
}): string {
  const apiKey = getGoogleMapsApiKey();
  const lat = input.lat;
  const lng = input.lng;
  const zoom = Math.min(20, Math.max(3, Math.round(input.zoom)));
  const hasMarker =
    input.markerLat != null &&
    input.markerLng != null &&
    Number.isFinite(input.markerLat) &&
    Number.isFinite(input.markerLng);
  const markerColor = (input.markerColor || "#FF4907").replace(/[^#A-Fa-f0-9]/g, "") || "#FF4907";

  if (!apiKey) {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;background:#17181B;color:#A1A1AA;font-family:sans-serif;display:flex;align-items:center;justify-content:center}
p{padding:24px;text-align:center;font-size:14px}</style></head>
<body><p>Google Maps is not configured yet. Enter the address below.</p></body></html>`;
  }

  const key = encodeURIComponent(apiKey);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <style>
    html, body, #map { margin: 0; height: 100%; width: 100%; background: #111; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function post(lat, lng) {
      var payload = JSON.stringify({ lat: lat, lng: lng });
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(payload);
    }
    function initMap() {
      var center = { lat: ${lat}, lng: ${lng} };
      var map = new google.maps.Map(document.getElementById('map'), {
        center: center,
        zoom: ${zoom},
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false
      });
      var marker = null;
      function setPin(pos) {
        if (!marker) {
          marker = new google.maps.Marker({
            map: map,
            position: pos,
            draggable: true,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '${markerColor}',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }
          });
          marker.addListener('dragend', function () {
            var next = marker.getPosition();
            post(next.lat(), next.lng());
          });
        } else {
          marker.setPosition(pos);
        }
      }
      ${hasMarker ? `setPin({ lat: ${input.markerLat}, lng: ${input.markerLng} });` : ""}
      map.addListener('click', function (event) {
        setPin(event.latLng);
        post(event.latLng.lat(), event.latLng.lng());
      });
    }
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${key}&callback=initMap" async defer></script>
</body>
</html>`;
}

export function parseInteractiveMapQuery(query: Record<string, unknown>) {
  const lat = numberOr(query.lat, 17.385);
  const lng = numberOr(query.lng, 78.4867);
  const zoom = numberOr(query.zoom, 12);
  const marker = String(query.m || "");
  let markerLat: number | null = null;
  let markerLng: number | null = null;
  if (marker.includes(",")) {
    const [latText, lngText] = marker.split(",");
    const parsedLat = Number(latText);
    const parsedLng = Number(lngText);
    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
      markerLat = parsedLat;
      markerLng = parsedLng;
    }
  }
  return { lat, lng, zoom, markerLat, markerLng };
}
