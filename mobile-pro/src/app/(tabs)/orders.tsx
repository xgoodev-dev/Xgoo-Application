import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ClipboardList, Plus } from 'lucide-react-native';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AccessGate } from '@/components/access-gate';
import { AppButton, Card, EmptyState, PageHeader, Screen } from '@/components/ui';
import { proApi } from '@/lib/api';
import { useProProfile } from '@/lib/profile';
import { useAppTheme } from '@/lib/theme';

const STATUS: Record<string, string> = {
  open: 'Open',
  pickup_requested: 'On pickup',
  booked: 'Booked',
  cancelled: 'Cancelled',
};

export default function OrdersScreen() {
  const { token, profile, access, coverageLocked, coverage, loading } = useProProfile();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['pro-orders', token],
    enabled: access === 'approved' && !coverageLocked,
    queryFn: () => proApi.orders(token),
  });
  const pickup = useMutation({
    mutationFn: (id: string) => proApi.queueOrderPickup(token, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pro-orders', token] }),
    onError: (error) => Alert.alert('Could not queue pickup', error instanceof Error ? error.message : 'Try again.'),
  });
  const cancel = useMutation({
    mutationFn: (id: string) => proApi.cancelOrder(token, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pro-orders', token] }),
  });

  return (
    <AccessGate access={loading ? 'loading' : access} profile={profile} coverageLocked={coverageLocked} coverageMessage={coverage?.message}>
      <Screen>
        <PageHeader
          title="Orders"
          subtitle="WhatsApp, calls, Instagram, and your store link."
          right={<AppButton title="New" icon={Plus} onPress={() => router.push('/order-new')} />}
        />
        {query.data?.length ? (
          <View style={styles.list}>
            {query.data.map((order) => (
              <Card key={order.id} style={styles.row}>
                <Text style={[styles.name, { color: colors.text }]}>{order.receiverName}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {STATUS[order.status] || order.status}
                  {order.xgooOrderId ? ` · ${order.xgooOrderId}` : ''}
                  {order.receiverCity ? ` · ${order.receiverCity}` : ''}
                </Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {order.contentDescription || 'Parcel'} · {order.channel}
                </Text>
                {order.status === 'open' ? (
                  <View style={styles.actions}>
                    <AppButton title="Queue pickup" onPress={() => pickup.mutate(order.id)} />
                    <AppButton title="Cancel" variant="ghost" onPress={() => cancel.mutate(order.id)} />
                  </View>
                ) : null}
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No orders yet"
            description="Create an order from a customer message, or share your store link."
            action={<AppButton title="Create order" onPress={() => router.push('/order-new')} />}
          />
        )}
      </Screen>
    </AccessGate>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: { gap: 4 },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 12 },
  actions: { gap: 8, marginTop: 10 },
});
