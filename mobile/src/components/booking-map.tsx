import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { OpenStreetMap } from '@/components/open-street-map';
import { useAppTheme } from '@/lib/theme';

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  markerColor?: string;
  onMapPress: (latitude: number, longitude: number) => void;
};

const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

export function BookingMap({
  latitude = null,
  longitude = null,
  markerColor,
  onMapPress,
}: Props) {
  const { colors, isDark } = useAppTheme();

  if (!googleMapsKey) {
    return (
      <OpenStreetMap
        latitude={latitude}
        longitude={longitude}
        onMapPress={onMapPress}
      />
    );
  }

  const center = {
    latitude: latitude ?? 17.385,
    longitude: longitude ?? 78.4867,
  };

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      userInterfaceStyle={isDark ? 'dark' : 'light'}
      region={{
        ...center,
        latitudeDelta: latitude == null ? 0.12 : 0.02,
        longitudeDelta: longitude == null ? 0.12 : 0.02,
      }}
      showsUserLocation
      showsMyLocationButton={false}
      onPress={(event) =>
        onMapPress(
          event.nativeEvent.coordinate.latitude,
          event.nativeEvent.coordinate.longitude,
        )
      }
    >
      {latitude != null && longitude != null ? (
        <Marker
          coordinate={{ latitude, longitude }}
          pinColor={markerColor || colors.accent}
        />
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});

