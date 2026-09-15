import { router } from 'expo-router';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Card, Screen } from '@/components/ui';
import type { PickupJob } from '@/lib/api';
import { useAppTheme } from '@/lib/theme';

const STATUS_LABELS: Record<string, string> = {
  assigned: 'New assignment',
  accepted: 'Accepted',
  en_route: 'En route',
  arrived: 'Arrived',
  inspected: 'Inspected',
  quote_sent: 'Quote sent',
  quote_accepted: 'Quote accepted',
  packed: 'Packed',
  at_hub: 'At XGoo store',
  awb_created: 'AWB created',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
  unassigned: 'Unassigned',
};

export function JobList({
  title,
  jobs,
  refreshing,
  onRefresh,
  empty,
}: {
  title: string;
  jobs: PickupJob[];
  refreshing: boolean;
  onRefresh: () => void;
  empty: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {jobs.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>{empty}</Text>
      ) : (
        <View style={styles.list}>
          {jobs.map((job) => {
            const request = job.request;
            return (
              <Card key={job.id} onPress={() => router.push(`/job/${job.id}`)} style={styles.card}>
                <Text style={[styles.request, { color: colors.accent }]}>
                  {request?.requestNumber || 'Pickup'}
                </Text>
                <Text style={[styles.name, { color: colors.text }]}>{request?.senderName || 'Customer'}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {request?.pickupLocationName || request?.senderAddress || 'Doorstep pickup'}
                </Text>
                <Text style={[styles.status, { color: colors.text }]}>
                  {STATUS_LABELS[job.status] || job.status}
                </Text>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '900', marginBottom: 18 },
  empty: { fontSize: 14, lineHeight: 20 },
  list: { gap: 10 },
  card: { padding: 16, gap: 4 },
  request: { fontSize: 12, fontWeight: '700' },
  name: { fontSize: 17, fontWeight: '800' },
  meta: { fontSize: 13 },
  status: { fontSize: 13, fontWeight: '600', marginTop: 4 },
});
