import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton, BrandLockup, Card, Screen } from '@/components/ui';
import { LegalLinks } from '@/components/legal-links';
import { useAuth } from '@/lib/auth';
import { XGOO_PICKUP } from '@/lib/site-info';
import { useAppTheme } from '@/lib/theme';

export default function ProfileScreen() {
  const { user, setAvailability, signOut } = useAuth();
  const { colors } = useAppTheme();
  const available = user?.availability === 'available';

  return (
    <Screen>
      <BrandLockup />
      <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'Partner'}</Text>
      <Text style={[styles.phone, { color: colors.textMuted }]}>{user?.phone}</Text>
      {user?.storeName ? (
        <Text style={[styles.phone, { color: colors.textMuted, marginTop: 2 }]}>
          Assigned store: {user.storeName}
        </Text>
      ) : null}
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
          {XGOO_PICKUP.name} only receives doorstep pickup requests. Hub walk-in bookings stay in Hub.
        </Text>
        <LegalLinks />
        <AppButton title="Sign out" variant="secondary" onPress={() => void signOut()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 28, fontWeight: '900', marginTop: 24 },
  phone: { fontSize: 14, marginTop: 6, marginBottom: 20 },
  status: { padding: 16, gap: 10 },
  statusLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  statusValue: { fontSize: 18, fontWeight: '800' },
  footer: { marginTop: 28, gap: 16 },
  hint: { fontSize: 13, lineHeight: 19 },
});
