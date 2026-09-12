import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Search, Truck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ShipmentCard } from '@/components/shipment-card';
import { EmptyState, PageHeader, Screen } from '@/components/ui';
import { customerApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { isGenericTrackRef } from '@/lib/track-links';
import { useAppTheme } from '@/lib/theme';

export default function TrackScreen() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ q?: string; ref?: string }>();
  const incoming = typeof params.q === 'string' ? params.q : typeof params.ref === 'string' ? params.ref : '';
  const [query, setQuery] = useState(isGenericTrackRef(incoming) ? '' : incoming);
  const bookings = useQuery({
    queryKey: ['customer-bookings', token],
    queryFn: () => customerApi.bookings(token!),
    enabled: !!token,
  });

  const searchValue = query.trim().replace(/^#/, '').toLowerCase();
  const matches = useMemo(() => {
    return (bookings.data || []).filter((item) => {
      if (!searchValue) return false;
      return item.requestNumber.toLowerCase().includes(searchValue);
    });
  }, [bookings.data, searchValue]);

  const currentShipments = useMemo(() => {
    return (bookings.data || []).filter((item) => {
      const status = item.status;
      return status !== 'delivered' && status !== 'rejected' && status !== 'cancelled';
    });
  }, [bookings.data]);

  return (
    <Screen keyboard>
      <PageHeader title="Track a parcel" subtitle="Enter a request number, or open a current shipment." />
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <Truck size={30} color={colors.accent} />
        </View>
        <Text style={[styles.heroTitle, { color: colors.text }]}>Where is your parcel?</Text>
        <Text style={[styles.heroCopy, { color: colors.textMuted }]}>
          Follow each milestone from booking to delivery.
        </Text>
        <View style={[styles.search, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Search size={19} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoCapitalize="characters"
            placeholder="e.g. BR-2026-0012"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text }]}
          />
        </View>
      </View>

      {searchValue ? (
        <View style={styles.results}>
          {matches.map((booking) => (
            <ShipmentCard
              key={booking.id}
              booking={booking}
              onPress={() => router.push(`/shipment/${booking.id}`)}
            />
          ))}
        </View>
      ) : currentShipments.length > 0 ? (
        <View style={styles.results}>
          <Text style={[styles.section, { color: colors.textMuted }]}>CURRENT SHIPMENTS</Text>
          {currentShipments.map((booking) => (
            <ShipmentCard
              key={booking.id}
              booking={booking}
              onPress={() => router.push(`/shipment/${booking.id}`)}
            />
          ))}
        </View>
      ) : null}

      {searchValue && matches.length === 0 && !bookings.isLoading ? (
        <EmptyState
          icon={Search}
          title="No matching parcel"
          description="Check the request number and try again."
        />
      ) : null}

      {!searchValue && currentShipments.length === 0 ? (
        <View style={styles.tip}>
          <Text style={[styles.tipTitle, { color: colors.text }]}>Tracking tip</Text>
          <Text style={[styles.tipCopy, { color: colors.textMuted }]}>
            Your request number appears in booking confirmation and under Your shipments.
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 24, padding: 22, alignItems: 'center' },
  icon: { width: 68, height: 68, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 20, fontWeight: '800', marginTop: 16 },
  heroCopy: { fontSize: 12, marginTop: 5, textAlign: 'center' },
  search: {
    width: '100%',
    height: 52,
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 20,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  input: { flex: 1, height: 52, fontSize: 15, fontWeight: '600' },
  results: { gap: 12, marginTop: 18 },
  section: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  tip: { marginTop: 26, paddingHorizontal: 8 },
  tipTitle: { fontSize: 13, fontWeight: '700' },
  tipCopy: { fontSize: 12, lineHeight: 18, marginTop: 5 },
});
