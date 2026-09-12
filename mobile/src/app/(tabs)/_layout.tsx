import { Redirect, Tabs, useLocalSearchParams, usePathname } from 'expo-router';
import { CircleUserRound, House, PackagePlus, Search, Truck } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { setPendingDeepLink } from '@/lib/pending-deep-link';
import { useAppTheme } from '@/lib/theme';

export default function TabsLayout() {
  const { token, loading } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const pathname = usePathname();
  const params = useLocalSearchParams<{ q?: string; ref?: string }>();

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!token) {
    const query = typeof params.q === 'string' ? params.q : typeof params.ref === 'string' ? params.ref : '';
    if (pathname.includes('track') || pathname.includes('shipment')) {
      setPendingDeepLink(query ? `/(tabs)/track?q=${encodeURIComponent(query)}` : '/(tabs)/track');
    } else if (pathname.includes('shipments')) {
      setPendingDeepLink('/(tabs)/shipments');
    }
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingTop: 7,
          paddingBottom: Math.max(8, insets.bottom),
          backgroundColor: colors.tab,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <House size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shipments"
        options={{
          title: 'Shipments',
          tabBarIcon: ({ color, size }) => <Truck size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: 'Book',
          tabBarIcon: () => (
            <View style={[styles.bookIcon, { backgroundColor: colors.accent }]}>
              <PackagePlus size={25} color="#FFFFFF" />
            </View>
          ),
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', color: colors.accent },
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <CircleUserRound size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bookIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -23,
    shadowColor: '#FF4907',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
});

