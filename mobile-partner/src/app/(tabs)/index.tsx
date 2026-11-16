import { useQuery } from '@tanstack/react-query';
import { Inbox } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JobTimelineCard } from '@/components/job-list';
import { EmptyState, Screen } from '@/components/ui';
import { pickupApi, type PickupJob, type PickupPartnerStats } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { rupees } from '@/lib/fuel-math';
import { useAppTheme } from '@/lib/theme';

const LIVE = new Set(['assigned', 'accepted', 'en_route', 'arrived']);

export default function HomeScreen() {
  const { token, user } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Partner';

  const jobs = useQuery({
    queryKey: ['pickup-jobs', 'all', token],
    enabled: Boolean(token),
    queryFn: () => pickupApi.jobs(token!, 'all'),
    refetchInterval: 15_000,
  });
  const stats = useQuery({
    queryKey: ['pickup-stats', token],
    enabled: Boolean(token),
    queryFn: () => pickupApi.stats(token!),
    refetchInterval: 20_000,
  });

  const allJobs = jobs.data || [];
  const current = allJobs.find((job) => LIVE.has(job.status));
  const newJobs = allJobs.filter((job) => job.status === 'assigned' && job.id !== current?.id);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.hero, { backgroundColor: colors.ink, paddingTop: insets.top + 16 }]}>
        <View style={styles.heroTop}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>{firstName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.hello}>Hello, {firstName}</Text>
            <Text style={styles.helloSub}>
              {current ? 'You have a pickup in motion' : 'New doorstep pickups land here'}
            </Text>
          </View>
        </View>
        <TodayStrip stats={stats.data} />
      </View>

      <Screen
        edges={['bottom']}
        refreshControl={
          <RefreshControl
            refreshing={jobs.isFetching}
            onRefresh={() => {
              void jobs.refetch();
              void stats.refetch();
            }}
            tintColor={colors.accent}
          />
        }
      >
        {current ? (
          <HomeSection title="Now" colors={colors}>
            <JobTimelineCard job={current} />
          </HomeSection>
        ) : null}

        <HomeSection title="New pickups" colors={colors}>
          {newJobs.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={current ? 'No other new pickups' : 'No new pickups'}
              description="Stay available. The next collection will show here."
            />
          ) : (
            <View style={styles.list}>
              {newJobs.map((job: PickupJob) => (
                <JobTimelineCard key={job.id} job={job} />
              ))}
            </View>
          )}
        </HomeSection>
      </Screen>
    </View>
  );
}

function HomeSection({
  title,
  colors,
  children,
}: {
  title: string;
  colors: { text: string };
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={[styles.section, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function TodayStrip({ stats }: { stats?: PickupPartnerStats }) {
  if (!stats) return null;
  return (
    <View style={styles.strip}>
      <StripStat label="Pickups" value={String(stats.today.pickupsCompleted)} />
      <StripStat label="Km" value={stats.today.distanceKm.toFixed(1)} />
      <StripStat label="Fuel" value={`${stats.today.fuelLitres.toFixed(1)} L`} />
      <StripStat label="Cost" value={rupees(stats.today.fuelCost)} />
    </View>
  );
}

function StripStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stripStat}>
      <Text style={styles.stripValue}>{value}</Text>
      <Text style={styles.stripLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 16,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  heroCopy: { flex: 1 },
  hello: { color: '#FAFAFA', fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  helloSub: { color: '#A1A1AA', fontSize: 13, marginTop: 3 },
  strip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  stripStat: { flex: 1, alignItems: 'center', gap: 2 },
  stripValue: { color: '#FAFAFA', fontSize: 15, fontWeight: '800' },
  stripLabel: { color: '#A1A1AA', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  sectionWrap: { marginBottom: 8 },
  section: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  list: { gap: 12 },
});
