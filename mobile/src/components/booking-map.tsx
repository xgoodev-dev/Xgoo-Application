import Constants from 'expo-constants';
import { GoogleBookingMap } from '@/components/booking-map-google';
import { ExpoGoGoogleMap } from '@/components/booking-map-google-web';

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  markerColor?: string;
  onMapPress: (latitude: number, longitude: number) => void;
};

export function BookingMap(props: Props) {
  if (Constants.appOwnership === 'expo') {
    return <ExpoGoGoogleMap {...props} />;
  }
  return <GoogleBookingMap {...props} />;
}
