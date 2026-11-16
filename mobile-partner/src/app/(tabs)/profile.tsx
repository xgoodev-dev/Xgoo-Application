import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Fuel } from 'lucide-react-native';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { LegalLinks } from '@/components/legal-links';
import { ProgressCard } from '@/components/progress-card';
import { AppButton, BrandLockup, Card, Screen } from '@/components/ui';
import { pickupApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { XGOO_PICKUP } from '@/lib/site-info';
import { useAppTheme } from '@/lib/theme';

export default function ProfileScreen() {
  const { user, token, setAvailability, signOut } = useAuth();
  const { colors } = useAppTheme();
  const available = user?.availability === 'available';
  const stats = useQuery({
    queryKey: ['pickup-stats', token],
    enabled: Boolean(token),
    queryFn: () => pickupApi.stats(token!),
    refetchInterval: 20_000,
  });

  return (
    <Screen>
      <BrandLockup compact />
      <View style={styles.identity}>
        <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'Partner'}</Text>
        <Text style={[styles.phone, { color: colors.textMuted }]}>{user?.phone}</Text>
        {user?.storeName ? (
          <Text style={[styles.phone, { color: colors.textMuted }]}>Store · {user.storeName}</Text>
        ) : null}
      </View>
      <ProgressCard stats={stats.data} />
      <Card style={styles.status} onPress={() => router.push('/(tabs)/fuel')}>
        <View style={styles.fuelRow}>
          <Fuel size={18} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Duty & fuel</Text>
            <Text style={[styles.fuelCopy, { color: colors.text }]}>Hours, kilometres, and fuel requests</Text>
          </View>
        </View>
      </Card>
      <Card style={styles.status}>
        <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Availability</Text>
        <Text style={[styles.statusValue, { color: colors.text }]}>
          {user?.availability === 'busy' ? 'Busy on a pickup' : available ? 'Available' : 'Offline'}
        </Text>
        <AppButton
          title={available ? 'Go offline' : 'Go available'}
          variant={available ? 'secondary' : 'primary'}
          onPress={() =>
            void setAvailability(available ? 'offline' : 'available').catch((error) =>
              Alert.alert('Could not update', error instanceof Error ? error.message : 'Try again'),
            )
          }
        />
      </Card>
      <View style={styles.footer}>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {XGOO_PICKUP.name} tracks working hours and kilometres from sign-in to sign-out. Request
          fuel cost from Duty & fuel after you sign out.
        </Text>
        <LegalLinks />
        <AppButton title="Sign out" variant="secondary" onPress={() => void signOut()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { marginTop: 22, marginBottom: 18, gap: 4 },
  name: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  phone: { fontSize: 14 },
  status: { padding: 16, gap: 10 },
  fuelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fuelCopy: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  statusLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  statusValue: { fontSize: 18, fontWeight: '800' },
  footer: { marginTop: 28, gap: 16 },
  hint: { fontSize: 13, lineHeight: 19 },
});
