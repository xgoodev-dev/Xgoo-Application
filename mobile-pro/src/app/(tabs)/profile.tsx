import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Clock,
  Gift,
  LogOut,
  Receipt,
  Store,
  Users,
} from 'lucide-react-native';
import { Alert, Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { AppButton, Card, PageHeader, Screen } from '@/components/ui';
import { TechPartnerCredit } from '@/components/tech-partner-credit';
import { useAuth } from '@/lib/auth';
import { useProProfile } from '@/lib/profile';
import { getApiUrl, publicSiteUrl } from '@/lib/server';
import { XGOO_PRO } from '@/lib/site-info';
import { useAppTheme } from '@/lib/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile } = useProProfile();
  const { colors } = useAppTheme();
  const storeLink = profile?.id ? publicSiteUrl(`/s/${profile.id}`) : publicSiteUrl('/refer');

  return (
    <Screen>
      <PageHeader title="More" subtitle={XGOO_PRO.name} />
      <Card style={styles.profile}>
        {profile?.logoUrl ? (
          <Image
            source={{
              uri: profile.logoUrl.startsWith('http')
                ? profile.logoUrl
                : `${getApiUrl()}${profile.logoUrl}`,
            }}
            style={styles.logo}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>
              {(profile?.storeName || user?.name || 'XG')
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>
            {profile?.storeName || profile?.companyName || user?.name}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{user?.email || user?.phone}</Text>
        </View>
      </Card>
      <Text style={[styles.section, { color: colors.textMuted }]}>STORE</Text>
      <Card style={styles.menu}>
        <MenuRow icon={Store} label="Store details" onPress={() => router.push('/store-details')} />
        <MenuRow icon={Clock} label="Pickup schedule" onPress={() => router.push('/schedule')} />
        <MenuRow icon={Users} label="Customers" onPress={() => router.push('/customers')} />
        <MenuRow icon={Receipt} label="Bills" onPress={() => router.push('/bills')} />
        <MenuRow
          icon={Gift}
          label="Share store link"
          onPress={() => void Share.share({ message: `Order delivery with ${XGOO_PRO.name}: ${storeLink}` })}
        />
      </Card>
      <Text style={[styles.section, { color: colors.textMuted }]}>ACCOUNT</Text>
      <Card style={styles.menu}>
        <MenuRow icon={Gift} label="Refer and earn" onPress={() => router.push('/refer-earn')} />
        <MenuRow icon={Bell} label="Notifications" onPress={() => router.push('/notifications')} />
        <MenuRow icon={CircleHelp} label="Help and support" onPress={() => router.push('/help-support')} />
      </Card>
      <AppButton
        title="Sign out"
        icon={LogOut}
        variant="secondary"
        style={styles.logout}
        onPress={() =>
          Alert.alert('Sign out?', 'You can sign back in with email or mobile OTP.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
          ])
        }
      />
      <TechPartnerCredit style={styles.credit} />
    </Screen>
  );
}

function MenuRow({
  icon: Icon,
  label,
  onPress,
}: {
  icon: typeof Store;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Icon size={18} color={colors.text} />
      </View>
      <Text style={[styles.menuTitle, { color: colors.text }]}>{label}</Text>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 56, height: 56, borderRadius: 18 },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800' },
  meta: { fontSize: 12, marginTop: 3 },
  section: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 22, marginBottom: 8 },
  menu: { paddingVertical: 4, paddingHorizontal: 8 },
  menuRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6 },
  menuIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  logout: { marginTop: 24 },
  credit: { marginTop: 20, marginBottom: 8 },
});
