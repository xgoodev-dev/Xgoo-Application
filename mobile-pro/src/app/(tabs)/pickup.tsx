import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Truck } from 'lucide-react-native';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AccessGate } from '@/components/access-gate';
import { AppButton, Card, EmptyState, PageHeader, Screen } from '@/components/ui';
import { proApi } from '@/lib/api';
import { todayIsoDate } from '@/lib/format';
import { useProProfile } from '@/lib/profile';
import { useAppTheme } from '@/lib/theme';

export default function PickupScreen() {
  const { token, profile, access, coverageLocked, coverage, loading } = useProProfile();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const date = todayIsoDate();
  const query = useQuery({
    queryKey: ['pro-today', token, date],
    enabled: access === 'approved' && !coverageLocked,
    queryFn: () => proApi.today(token, date),
  });
  const confirm = useMutation({
    mutationFn: () => proApi.confirmToday(token, date),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pro-today', token, date] });
      Alert.alert('Pickup confirmed', 'XGoo will collect the parcels on this list.');
    },
    onError: (error) => Alert.alert('Could not confirm', error instanceof Error ? error.message : 'Try again.'),
  });

  const jobs = query.data?.jobs || [];

  return (
    <AccessGate access={loading ? 'loading' : access} profile={profile} coverageLocked={coverageLocked} coverageMessage={coverage?.message}>
      <Screen>
        <PageHeader
          title="Pickup"
          subtitle={
            query.data?.pickupStyle === 'on_demand'
              ? 'Pickup only when you have orders'
              : 'Daily standing pickup'
          }
        />
        <Card>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{date}</Text>
          <Text style={[styles.copy, { color: colors.text }]}>
            {query.data?.pickupDay
              ? 'This is a pickup day for your store.'
              : 'Not a standing day. Confirm only if you queued on-demand jobs.'}
          </Text>
        </Card>
        {jobs.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Nothing on today’s list"
            description="Queue an open order for pickup, or add a customer from Orders."
          />
        ) : (
          <View style={styles.list}>
            {jobs.map((job) => (
              <Card key={job.id}>
                <Text style={[styles.name, { color: colors.text }]}>{job.receiverName}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {job.status}
                  {job.xgooOrderId ? ` · ${job.xgooOrderId}` : ''}
                  {job.receiverCity ? ` · ${job.receiverCity}` : ''}
                </Text>
              </Card>
            ))}
            <AppButton
              title={confirm.isPending ? 'Confirming…' : 'Confirm today’s pickup'}
              loading={confirm.isPending}
              onPress={() => confirm.mutate()}
            />
          </View>
        )}
      </Screen>
    </AccessGate>
  );
}

const styles = StyleSheet.create({
  meta: { fontSize: 12 },
  copy: { fontSize: 14, marginTop: 6 },
  list: { gap: 10, marginTop: 16 },
  name: { fontSize: 16, fontWeight: '700' },
});
