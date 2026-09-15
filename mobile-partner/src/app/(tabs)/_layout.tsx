import { Redirect, Tabs } from 'expo-router';
import { Briefcase, CircleUserRound, Clock3, Inbox } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationBar } from '@/components/location-bar';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function TabsLayout() {
  const { token, loading } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!token) return <Redirect href="/(auth)/welcome" />;

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <LocationBar />
      </View>
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
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => <Inbox size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: 'Active',
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
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
    </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  shell: { flex: 1 },
});
