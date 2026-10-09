import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Bell, ClipboardList, Receipt, Truck, Users } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AccessGate, VerifiedBadge } from '@/components/access-gate';
import { AppButton, Card, PageHeader, Screen } from '@/components/ui';
import { proApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { rupees, todayIsoDate } from '@/lib/format';
import { useProProfile } from '@/lib/profile';
import { useAppTheme } from '@/lib/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const { token, profile, access, coverageLocked, coverage, loading } = useProProfile();
  const { colors } = useAppTheme();
  const date = todayIsoDate();
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Mover';

  const today = useQuery({
    queryKey: ['pro-today', token, date],
    enabled: access === 'approved' && !coverageLocked,
    queryFn: () => proApi.today(token, date),
  });
  const orders = useQuery({
    queryKey: ['pro-orders', token],
    enabled: access === 'approved' && !coverageLocked,
    queryFn: () => proApi.orders(token),
  });
  const bookings = useQuery({
    queryKey: ['pro-bookings', token],
    enabled: access === 'approved' && !coverageLocked,
    queryFn: () => proApi.bookings(token),
  });
  const bills = useQuery({
    queryKey: ['pro-bills', token],
    enabled: access === 'approved' && !coverageLocked,
    queryFn: () => proApi.bills(token),
  });
  const customers = useQuery({
    queryKey: ['pro-customers', token],
    enabled: access === 'approved' && !coverageLocked,
    queryFn: () => proApi.destinations(token),
  });

  const openOrders = (orders.data || []).filter((item) => item.status === 'open').length;
  const inTransit = (bookings.data || []).filter((item) =>
    ['converted', 'picked_up', 'in_transit', 'out_for_delivery'].includes(item.status),
  ).length;

  return (
    <AccessGate
      access={loading ? 'loading' : access}
      profile={profile}
      coverageLocked={coverageLocked}
      coverageMessage={coverage?.message}
    >
      <Screen>
        <PageHeader
          title={`Hello, ${firstName}`}
          subtitle={profile?.storeName || profile?.companyName || 'Your store'}
          right={
            <Pressable onPress={() => router.push('/notifications')}>
              <Bell size={22} color={colors.text} />
            </Pressable>
          }
        />
        <VerifiedBadge />
        <View style={styles.grid}>
          <Stat label="Open orders" value={String(openOrders)} onPress={() => router.push('/(tabs)/orders')} />
          <Stat label="In transit" value={String(inTransit)} onPress={() => router.push('/(tabs)/shipments')} />
          <Stat label="Customers" value={String(customers.data?.length || 0)} onPress={() => router.push('/customers')} />
          <Stat
            label="Bills due"
            value={rupees(bills.data?.outstandingTotal)}
            onPress={() => router.push('/bills')}
          />
        </View>
        <Card style={styles.today}>
          <Text style={[styles.todayTitle, { color: colors.text }]}>Today’s pickup</Text>
          <Text style={[styles.todayCopy, { color: colors.textMuted }]}>
            {today.data?.pickupDay
              ? `${today.data.jobs.filter((job) => job.status !== 'skipped').length} jobs on the list`
              : 'Not a standing pickup day. Add on-demand jobs if you have parcels.'}
          </Text>
          <AppButton title="Open pickup" icon={Truck} onPress={() => router.push('/(tabs)/pickup')} />
        </Card>
        <View style={styles.actions}>
          <AppButton title="New order" icon={ClipboardList} onPress={() => router.push('/order-new')} />
          <AppButton title="Settle bills" icon={Receipt} variant="secondary" onPress={() => router.push('/bills')} />
          <AppButton title="Customers" icon={Users} variant="secondary" onPress={() => router.push('/customers')} />
        </View>
      </Screen>
    </AccessGate>
  );
}

function Stat({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Card onPress={onPress} style={styles.stat}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  stat: { width: '47%', flexGrow: 1 },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 6 },
  today: { marginTop: 14, gap: 10 },
  todayTitle: { fontSize: 16, fontWeight: '700' },
  todayCopy: { fontSize: 13, lineHeight: 18 },
  actions: { gap: 10, marginTop: 16 },
});
