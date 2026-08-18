import { MapPin } from 'lucide-react-native';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAppTheme } from '@/lib/theme';

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  onMapPress: (latitude: number, longitude: number) => void;
};

function mapHtml(latitude: number | null, longitude: number | null, isDark: boolean) {
  const centerLat = latitude ?? 17.385;
  const centerLng = longitude ?? 78.4867;
  const markerScript =
    latitude != null && longitude != null
      ? `L.marker([${latitude}, ${longitude}], { icon: pickupIcon }).addTo(map);`
      : '';
  const tiles = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        html, body, #map { height: 100%; width: 100%; margin: 0; background: ${isDark ? '#17181B' : '#F4F4F5'}; }
        .leaflet-control-attribution { font: 8px/1.2 sans-serif; opacity: .7; }
        .pickup-pin {
          width: 28px; height: 28px; border-radius: 10px 10px 10px 2px;
          background: #FF4907; border: 3px solid white; box-shadow: 0 3px 12px rgba(0,0,0,.3);
          transform: rotate(-45deg);
        }
        .pickup-pin:after {
          content: ''; display: block; width: 7px; height: 7px; border-radius: 50%;
          background: white; margin: 7px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        const map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], ${latitude == null ? 11 : 15});
        L.tileLayer('${tiles}', {
          maxZoom: 20,
          subdomains: 'abcd',
          attribution: '&copy; OpenStreetMap &copy; CARTO'
        }).addTo(map);
        const pickupIcon = L.divIcon({
          className: '',
          html: '<div class="pickup-pin"></div>',
          iconSize: [32, 32],
          iconAnchor: [10, 27]
        });
        ${markerScript}
        map.on('click', function(event) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapPress',
            latitude: event.latlng.lat,
            longitude: event.latlng.lng
          }));
        });
      </script>
    </body>
  </html>`;
}

export function OpenStreetMap({
  latitude = null,
  longitude = null,
  onMapPress,
}: Props) {
  const { colors, isDark } = useAppTheme();

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.surfaceMuted }]}>
        <MapPin size={32} color={colors.accent} />
        <Text style={{ color: colors.textMuted }}>Interactive map is available in the mobile app.</Text>
      </View>
    );
  }

  return (
    <WebView
      key={`${latitude ?? 'none'}-${longitude ?? 'none'}-${isDark ? 'dark' : 'light'}`}
      source={{ html: mapHtml(latitude, longitude, isDark) }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      mixedContentMode="always"
      setSupportMultipleWindows={false}
      style={styles.map}
      onMessage={(event) => {
        try {
          const message = JSON.parse(event.nativeEvent.data) as {
            type?: string;
            latitude?: number;
            longitude?: number;
          };
          if (
            message.type === 'mapPress' &&
            typeof message.latitude === 'number' &&
            typeof message.longitude === 'number'
          ) {
            onMapPress(message.latitude, message.longitude);
          }
        } catch {
          // Ignore unrelated webview messages.
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: 'transparent' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
});

