import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Truck } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';
import { AccessGate } from '@/components/access-gate';
import { Card, EmptyState, PageHeader, Screen } from '@/components/ui';
import { proApi } from '@/lib/api';
import { shortDate } from '@/lib/format';
import { useProProfile } from '@/lib/profile';
import { useAppTheme } from '@/lib/theme';

export default function ShipmentsScreen() {
  const { token, profile, access, coverageLocked, coverage, loading } = useProProfile();
  const { colors } = useAppTheme();
  const query = useQuery({
    queryKey: ['pro-bookings', token],
    enabled: access === 'approved' && !coverageLocked,
    queryFn: () => proApi.bookings(token),
  });

  return (
    <AccessGate access={loading ? 'loading' : access} profile={profile} coverageLocked={coverageLocked} coverageMessage={coverage?.message}>
      <Screen>
        <PageHeader title="Shipments" subtitle="Bookings after pickup is confirmed." />
        {query.data?.length ? (
          query.data.map((booking) => (
            <Card key={booking.id} style={styles.row} onPress={() => router.push(`/shipment/${booking.id}`)}>
              <Text style={[styles.name, { color: colors.text }]}>
                {booking.tracking?.overallStatusLabel || booking.status}
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {booking.requestNumber}
                {booking.xgooOrderId ? ` · ${booking.xgooOrderId}` : ''}
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {booking.receiverName || 'Receiver'}
                {booking.receiverCity ? ` · ${booking.receiverCity}` : ''} · {shortDate(booking.createdAt)}
              </Text>
            </Card>
          ))
        ) : (
          <EmptyState icon={Truck} title="No shipments yet" description="Confirmed pickups appear here with tracking." />
        )}
      </Screen>
    </AccessGate>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 10, gap: 3 },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 12 },
});
