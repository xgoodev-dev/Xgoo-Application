import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  CircleHelp,
  LogOut,
  MapPinned,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { AppButton, Card, PageHeader, Screen } from '@/components/ui';
import { TechPartnerCredit } from '@/components/tech-partner-credit';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, isDark, setMode } = useAppTheme();

  const logout = () => {
    Alert.alert('Sign out?', 'You can sign back in with your phone number.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => void signOut().then(() => router.replace('/(auth)/welcome')),
      },
    ]);
  };

  return (
    <Screen>
      <PageHeader title="Profile" subtitle="Your XGoo Go account." />
      <Card style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={styles.avatarText}>
            {user?.name
              ?.split(' ')
              .map((item) => item[0])
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'XG'}
          </Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{user?.phone}</Text>
          {user?.email ? (
            <Text style={[styles.meta, { color: colors.textMuted }]}>{user.email}</Text>
          ) : null}
        </View>
      </Card>

      <Text style={[styles.section, { color: colors.textMuted }]}>ACCOUNT</Text>
      <Card style={styles.menu}>
        <MenuRow
          icon={UserRound}
          label="Personal information"
          onPress={() => router.push('/personal-information')}
        />
        <Divider />
        <MenuRow
          icon={MapPinned}
          label="Saved addresses"
          onPress={() => router.push('/addresses')}
        />
        <Divider />
        <MenuRow
          icon={ShieldCheck}
          label="Privacy and security"
          onPress={() => router.push('/privacy-security')}
        />
      </Card>

      <Text style={[styles.section, { color: colors.textMuted }]}>PREFERENCES</Text>
      <Card style={styles.menu}>
        <View style={styles.menuRow}>
          <View style={[styles.menuIcon, { backgroundColor: colors.surfaceMuted }]}>
            {isDark ? <Moon size={18} color={colors.text} /> : <Sun size={18} color={colors.text} />}
          </View>
          <View style={styles.menuLabel}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Dark mode</Text>
            <Text style={[styles.menuHint, { color: colors.textMuted }]}>
              Switch between dark and light appearance
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={(value) => setMode(value ? 'dark' : 'light')}
            trackColor={{ false: colors.border, true: colors.accent }}
          />
        </View>
        <Divider />
        <MenuRow
          icon={Bell}
          label="Notifications"
          onPress={() => router.push('/notifications')}
        />
        <Divider />
        <MenuRow
          icon={CircleHelp}
          label="Help and support"
          onPress={() => router.push('/help-support')}
        />
      </Card>

      <AppButton
        title="Sign out"
        icon={LogOut}
        variant="secondary"
        style={styles.logout}
        onPress={logout}
      />
      <Text style={[styles.version, { color: colors.textMuted }]}>XGoo Go · Version 1.0.0</Text>
      <TechPartnerCredit style={styles.credit} />
    </Screen>
  );
}

function Divider() {
  const { colors } = useAppTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

function MenuRow({
  icon: Icon,
  label,
  onPress,
}: {
  icon: typeof UserRound;
  label: string;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Icon size={18} color={colors.text} />
      </View>
      <Text style={[styles.menuTitle, styles.menuLabel, { color: colors.text }]}>{label}</Text>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  profileCopy: { flex: 1 },
  name: { fontSize: 19, fontWeight: '800' },
  meta: { fontSize: 12, marginTop: 3 },
  section: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 24, marginBottom: 8 },
  menu: { paddingVertical: 3, paddingHorizontal: 14 },
  menuRow: { minHeight: 59, flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1 },
  menuTitle: { fontSize: 14, fontWeight: '600' },
  menuHint: { fontSize: 10, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 48 },
  logout: { marginTop: 24 },
  version: { fontSize: 10, textAlign: 'center', marginTop: 16 },
  credit: { marginTop: 18, marginBottom: 8 },
});

