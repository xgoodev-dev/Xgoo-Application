function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function browserMapsKey() {
  return (
    process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

export function parseRouteViewQuery(query: Record<string, unknown>) {
  return {
    originLat: num(query.originLat),
    originLng: num(query.originLng),
    destLat: num(query.destLat) ?? 17.4487856,
    destLng: num(query.destLng) ?? 78.3638547,
    label: typeof query.label === "string" ? query.label.slice(0, 80) : "Pickup",
  };
}

export function renderPickupRoutePage(input: {
  originLat: number | null;
  originLng: number | null;
  destLat: number;
  destLng: number;
  label: string;
}): string {
  const apiKey = browserMapsKey();
  const dest = { lat: input.destLat, lng: input.destLng };
  const origin =
    input.originLat != null && input.originLng != null
      ? { lat: input.originLat, lng: input.originLng }
      : null;
  const label = JSON.stringify(input.label || "Pickup");

  if (!apiKey) {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;display:flex;align-items:center;justify-content:center;background:#F4F4F5;color:#52525B;font-family:sans-serif}</style>
</head><body><p>Google Maps is not configured.</p></body></html>`;
  }

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
    window.gm_authFailure = function () {
      document.body.innerHTML = '<p style="font-family:sans-serif;color:#52525B;padding:24px;text-align:center">Google Maps could not start. Check the Maps key referrer.</p>';
    };
    function initMap() {
      var dest = ${JSON.stringify(dest)};
      var origin = ${JSON.stringify(origin)};
      var map = new google.maps.Map(document.getElementById('map'), {
        center: dest,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false
      });
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
      new google.maps.Marker({ map: map, position: dest, title: ${label}, icon: pin('#FF4907', 10) });
      if (origin) {
        new google.maps.Marker({ map: map, position: origin, title: 'You', icon: pin('#18181B', 8) });
        var renderer = new google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: true,
          polylineOptions: { strokeColor: '#FF4907', strokeOpacity: 0.95, strokeWeight: 6 }
        });
        new google.maps.DirectionsService().route({
          origin: origin,
          destination: dest,
          travelMode: google.maps.TravelMode.DRIVING
        }, function (result, status) {
          if (status === 'OK') renderer.setDirections(result);
          else {
            new google.maps.Polyline({
              map: map,
              path: [origin, dest],
              strokeColor: '#FF4907',
              strokeWeight: 6
            });
            map.fitBounds(new google.maps.LatLngBounds(origin, dest), 48);
          }
        });
      }
    }
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&callback=initMap" async defer></script>
</body>
</html>`;
}
