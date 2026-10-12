import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { getApiUrl } from '@/lib/server';

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  onMapPress: (latitude: number, longitude: number) => void;
  onUnavailable?: () => void;
};

const DEFAULT_LAT = 20.5937;
const DEFAULT_LNG = 78.9629;

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

export function GoogleStaticBookingMap({
  latitude = null,
  longitude = null,
  onMapPress,
  onUnavailable,
}: Props) {
  const [failed, setFailed] = useState(false);
  const [size, setSize] = useState({ width: 640, height: 400 });
  const lat = latitude ?? DEFAULT_LAT;
  const lng = longitude ?? DEFAULT_LNG;
  const zoom = latitude == null || longitude == null ? 5 : 15;
  const uri = useMemo(() => {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      zoom: String(zoom),
      w: '640',
      h: '400',
    });
    if (latitude != null && longitude != null) {
      params.set('m', `${latitude},${longitude}`);
    }
    return `${getApiUrl()}/api/maps/static?${params.toString()}`;
  }, [lat, lng, latitude, longitude, zoom]);

  if (failed) {
    return <View style={styles.map} />;
  }

  return (
    <Pressable
      style={styles.map}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width > 0 && height > 0) setSize({ width, height });
      }}
      onPress={(event) => {
        const { locationX, locationY } = event.nativeEvent;
        const next = pixelToLatLng(
          locationX,
          locationY,
          size.width,
          size.height,
          lat,
          lng,
          zoom,
        );
        onMapPress(next.lat, next.lng);
      }}
    >
      <Image
        source={{ uri }}
        style={styles.map}
        resizeMode="stretch"
        onError={() => {
          setFailed(true);
          onUnavailable?.();
        }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, width: '100%', height: '100%' },
});
