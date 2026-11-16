import { router } from 'expo-router';
import { ChevronRight, Inbox, Package } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, PageHeader, Screen } from '@/components/ui';
import type { PickupJob } from '@/lib/api';
import { useAppTheme } from '@/lib/theme';

export const STATUS_LABELS: Record<string, string> = {
  assigned: 'New',
  accepted: 'Accepted',
  en_route: 'En route',
  arrived: 'Arrived',
  inspected: 'Inspected',
  quote_sent: 'Quote sent',
  quote_accepted: 'Accepted',
  packed: 'Packed',
  at_hub: 'At store',
  awb_created: 'AWB ready',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
  unassigned: 'Unassigned',
};

export function StatusBadge({ status }: { status: string }) {
  const { colors } = useAppTheme();
  const tone =
    status === 'completed'
      ? colors.success
      : status === 'declined' || status === 'cancelled'
        ? colors.danger
        : status === 'assigned'
          ? colors.accent
          : colors.info;
  return (
    <View style={[styles.badge, { backgroundColor: `${tone}18` }]}>
      <Text style={[styles.badgeText, { color: tone }]}>{STATUS_LABELS[status] || status}</Text>
    </View>
  );
}

export function JobTimelineCard({ job }: { job: PickupJob }) {
  const { colors } = useAppTheme();
  const request = job.request;
  return (
    <Card onPress={() => router.push(`/job/${job.id}`)} style={styles.timeline}>
      <View style={styles.timelineTop}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
          <Package size={16} color={colors.accent} />
        </View>
        <View style={styles.timelineCopy}>
          <Text style={[styles.request, { color: colors.text }]}>{request?.requestNumber || 'Pickup'}</Text>
          <Text style={[styles.sender, { color: colors.textMuted }]}>{request?.senderName || 'Customer'}</Text>
        </View>
        <StatusBadge status={job.status} />
      </View>
      <View style={styles.track}>
        <View style={[styles.dot, { backgroundColor: colors.ink }]} />
        <View style={[styles.trackLine, { backgroundColor: colors.accent }]} />
        <View style={[styles.dot, { backgroundColor: colors.accent }]} />
      </View>
      <View style={styles.cities}>
        <Text style={[styles.city, { color: colors.text }]} numberOfLines={1}>
          {request?.senderCity || request?.pickupLocationName || 'Pickup'}
        </Text>
        <Text style={[styles.city, { color: colors.text, textAlign: 'right' }]} numberOfLines={1}>
          {request?.receiverCity || request?.receiverName || 'Destination'}
        </Text>
      </View>
      <View style={styles.footer}>
        <Text style={[styles.cta, { color: colors.accent }]}>Open route</Text>
        <ChevronRight size={16} color={colors.accent} />
      </View>
    </Card>
  );
}

export function JobList({
  title,
  subtitle,
  jobs,
  refreshing,
  onRefresh,
  empty,
  header,
}: {
  title: string;
  subtitle?: string;
  jobs: PickupJob[];
  refreshing: boolean;
  onRefresh: () => void;
  empty: string;
  header?: ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <PageHeader title={title} subtitle={subtitle} />
      {header}
      {jobs.length === 0 ? (
        <EmptyState icon={Inbox} title="Nothing here yet" description={empty} />
      ) : (
        <View style={styles.list}>
          {jobs.map((job) => (
            <JobTimelineCard key={job.id} job={job} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  timeline: { padding: 16, gap: 12, borderRadius: 22 },
  timelineTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  timelineCopy: { flex: 1, gap: 2 },
  request: { fontSize: 15, fontWeight: '800' },
  sender: { fontSize: 12 },
  track: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  trackLine: { flex: 1, height: 2, borderRadius: 999 },
  cities: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  city: { flex: 1, fontSize: 13, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cta: { fontSize: 13, fontWeight: '800' },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800' },
});
