import { useEffect, useState, type ComponentType } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/lib/theme';

export default function BookTab() {
  const { colors } = useAppTheme();
  const [BookingScreen, setBookingScreen] = useState<ComponentType | null>(null);

  useEffect(() => {
    let active = true;
    void import('../booking')
      .then((mod) => {
        if (active) setBookingScreen(() => mod.default);
      })
      .catch((error) => {
        console.warn('Could not open booking screen', error);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!BookingScreen) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return <BookingScreen />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
