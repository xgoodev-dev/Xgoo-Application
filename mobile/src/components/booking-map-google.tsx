import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAppTheme } from '@/lib/theme';

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  markerColor?: string;
  onMapPress: (latitude: number, longitude: number) => void;
  onMapReady?: () => void;
};

export function GoogleBookingMap({
  latitude = null,
  longitude = null,
  markerColor,
  onMapPress,
  onMapReady,
}: Props) {
  const { colors } = useAppTheme();
  const center = {
    latitude: latitude ?? 17.385,
    longitude: longitude ?? 78.4867,
  };

  return (
    <View collapsable={false} style={styles.wrap}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        userInterfaceStyle="light"
        loadingEnabled
        loadingIndicatorColor="#FF4907"
        loadingBackgroundColor="#e8eaed"
        region={{
          ...center,
          latitudeDelta: latitude == null ? 0.12 : 0.02,
          longitudeDelta: longitude == null ? 0.12 : 0.02,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        onMapReady={onMapReady}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, width: '100%', height: '100%' },
  map: { width: '100%', height: '100%', ...StyleSheet.absoluteFillObject },
});
