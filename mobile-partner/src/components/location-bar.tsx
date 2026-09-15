import { LocateFixed, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '@/lib/theme';

export function LocationBar() {
  const { colors } = useAppTheme();
  const [label, setLabel] = useState('Tap for live location');
  const [locating, setLocating] = useState(false);
  const [live, setLive] = useState(false);

  function refresh() {
    if (locating) return;
    if (!navigator.geolocation) {
      setLabel('Location unavailable');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=16&addressdetails=1`,
            { headers: { Accept: 'application/json' } },
          );
          const data = (await res.json()) as { display_name?: string };
          setLabel(
            data.display_name ||
              `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          );
          setLive(true);
        } catch {
          setLabel(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          setLive(true);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setLabel('Location off — tap to retry');
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  return (
    <Pressable
      onPress={refresh}
      disabled={locating}
      style={[styles.bar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={live ? 'Refresh live location' : 'Fetch live location'}
    >
      <MapPin size={14} color={colors.accent} />
      <Text style={[styles.text, { color: colors.text }]} numberOfLines={1}>
        {locating ? 'Finding live location…' : label}
      </Text>
      <LocateFixed size={14} color={colors.accent} />
      <Text style={[styles.action, { color: colors.accent }]}>
        {locating ? '…' : live ? 'Refresh' : 'Live'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, fontSize: 12, fontWeight: '600' },
  action: { fontSize: 11, fontWeight: '700' },
});
