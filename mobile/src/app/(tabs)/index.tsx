import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  ArrowRight,
  Bell,
  Box,
  Clock3,
  MapPin,
  Moon,
  PackageCheck,
  Plus,
  Sun,
  Truck,
} from 'lucide-react-native';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { CallToBookButton } from '@/components/call-to-book-button';
import { ShipmentCard } from '@/components/shipment-card';
import { AppButton, BrandLockup, Card, Screen, SectionTitle } from '@/components/ui';
import { customerApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function DashboardScreen() {
  const { token, user } = useAuth();
  const { colors, isDark, toggle } = useAppTheme();
  const bookings = useQuery({
    queryKey: ['customer-bookings', token],
    queryFn: () => customerApi.bookings(token!),
    enabled: !!token,
  });
  const notifications = useQuery({
    queryKey: ['customer-notifications', token],
    queryFn: () => customerApi.notifications(token!),
    enabled: !!token,
    refetchInterval: 15_000,
  });
  const unreadNotifications = (notifications.data || []).filter((item) => !item.readAt).length;
  const items = bookings.data || [];
  const inTransit = items.filter((item) =>
    ['converted', 'picked_up', 'in_transit', 'out_for_delivery'].includes(item.status),
  ).length;
  const delivered = items.filter((item) => item.status === 'delivered').length;
  const pending = items.filter((item) =>
    ['pending', 'submitted', 'reviewed', 'approved', 'booked'].includes(item.status),
  ).length;

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={bookings.isRefetching}
          onRefresh={() => {
            void bookings.refetch();
            void notifications.refetch();
          }}
          tintColor={colors.accent}
        />
      }
    >
      <View style={styles.top}>
        <BrandLockup compact />
        <View style={styles.topActions}>
          <Pressable
            onPress={toggle}
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {isDark ? <Sun size={18} color={colors.text} /> : <Moon size={18} color={colors.text} />}
          </Pressable>
          <Pressable
            onPress={() => router.push('/notifications')}
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Bell size={18} color={colors.text} />
            {unreadNotifications ? (
              <View style={[styles.notificationBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <View style={styles.greeting}>
        <Text style={[styles.hello, { color: colors.textMuted }]}>Good day,</Text>
        <Text style={[styles.name, { color: colors.text }]}>{user?.name?.split(' ')[0] || 'Mover'} 👋</Text>
      </View>

      <Card style={[styles.hero, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>READY WHEN YOU ARE</Text>
          <Text style={styles.heroTitle}>Where should your{'\n'}parcel move next?</Text>
          <AppButton
            title="Book a parcel"
            icon={Plus}
            variant="secondary"
            style={styles.heroButton}
            onPress={() => router.push('/(tabs)/book')}
          />
          <CallToBookButton compact label="Call us to book" />
        </View>
        <View style={styles.heroArt}>
          <View style={styles.heroCircle}>
            <Box size={45} color="#FF4907" />
          </View>
          <View style={styles.heroPin}>
            <MapPin size={20} color="#FFFFFF" />
          </View>
        </View>
      </Card>

      <View style={styles.stats}>
        <StatCard icon={Truck} value={inTransit} label="In transit" color={colors.info} />
        <StatCard icon={Clock3} value={pending} label="Pending" color={colors.accent} />
        <StatCard icon={PackageCheck} value={delivered} label="Delivered" color={colors.success} />
      </View>

      <SectionTitle
        action={
          <Pressable onPress={() => router.push('/(tabs)/shipments')} style={styles.viewAll}>
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>View all</Text>
            <ArrowRight size={14} color={colors.accent} />
          </Pressable>
        }
      >
        Recent movements
      </SectionTitle>

      <View style={styles.list}>
        {items.slice(0, 3).map((booking) => (
          <ShipmentCard
            key={booking.id}
            booking={booking}
            compact
            onPress={() => router.push(`/shipment/${booking.id}`)}
          />
        ))}
        {!bookings.isLoading && items.length === 0 ? (
          <Card style={styles.firstCard}>
            <PackageCheck size={28} color={colors.accent} />
            <Text style={[styles.firstTitle, { color: colors.text }]}>Your first movement starts here</Text>
            <Text style={[styles.firstCopy, { color: colors.textMuted }]}>
              Book a parcel and follow every milestone from pickup to delivery.
            </Text>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Truck;
  value: number;
  label: string;
  color: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Card style={styles.statCard}>
      <Icon size={18} color={color} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topActions: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  greeting: { marginTop: 27, marginBottom: 18 },
  hello: { fontSize: 13 },
  name: { fontSize: 28, fontWeight: '900', letterSpacing: -0.6, marginTop: 1 },
  hero: {
    minHeight: 190,
    padding: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowOpacity: 0.2,
    shadowColor: '#FF4907',
  },
  heroCopy: { flex: 1.3, zIndex: 2, gap: 10 },
  heroEyebrow: { color: '#FFE0D4', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { color: '#FFFFFF', fontSize: 22, lineHeight: 27, fontWeight: '900', marginTop: 8 },
  heroButton: { height: 40, minHeight: 40, alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 14 },
  heroArt: { flex: 0.7, justifyContent: 'center', alignItems: 'center' },
  heroCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  heroPin: {
    position: 'absolute',
    right: 2,
    top: 26,
    width: 37,
    height: 37,
    borderRadius: 14,
    backgroundColor: '#1D1F23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { flexDirection: 'row', gap: 9, marginTop: 13 },
  statCard: { flex: 1, padding: 12, gap: 2, elevation: 0, shadowOpacity: 0 },
  statValue: { fontSize: 21, fontWeight: '900', marginTop: 7 },
  statLabel: { fontSize: 10, fontWeight: '600' },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  list: { gap: 11 },
  firstCard: { alignItems: 'center', paddingVertical: 26 },
  firstTitle: { marginTop: 12, fontSize: 15, fontWeight: '700' },
  firstCopy: { marginTop: 6, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});

