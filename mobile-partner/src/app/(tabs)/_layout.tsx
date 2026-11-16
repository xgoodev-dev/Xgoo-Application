import { useQuery } from '@tanstack/react-query';
import { Redirect, router, Tabs } from 'expo-router';
import { Briefcase, CircleUserRound, Clock3, Home, Navigation } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickupApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

const LIVE = new Set(['assigned', 'accepted', 'en_route', 'arrived']);

export default function TabsLayout() {
  const { token, loading } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const jobs = useQuery({
    queryKey: ['pickup-jobs', 'all', token],
    enabled: Boolean(token),
    queryFn: () => pickupApi.jobs(token!, 'all'),
    refetchInterval: 20_000,
  });
  const liveJob =
    (jobs.data || []).find((job) => LIVE.has(job.status)) ||
    (jobs.data || []).find((job) => job.status === 'assigned');

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!token) return <Redirect href="/(auth)/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 68 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(10, insets.bottom),
          backgroundColor: colors.tab,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="go"
        options={{
          title: 'Route',
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View style={[styles.fab, { backgroundColor: colors.accent }]}>
              <Navigation size={22} color="#FFFFFF" />
            </View>
          ),
        }}
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            if (liveJob) router.push(`/job/${liveJob.id}`);
            else router.push('/(tabs)/active');
          },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Clock3 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <CircleUserRound size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="fuel" options={{ href: null, title: 'Fuel' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginTop: -18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#FF4907',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
