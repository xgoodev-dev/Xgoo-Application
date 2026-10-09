import { router } from 'expo-router';
import { Share, StyleSheet, Text } from 'react-native';
import { AppButton, BackButton, Card, Screen } from '@/components/ui';
import { useProProfile } from '@/lib/profile';
import { publicSiteUrl } from '@/lib/server';
import { useAppTheme } from '@/lib/theme';

export default function StoreDetailsScreen() {
  const { profile } = useProProfile();
  const { colors } = useAppTheme();
  const link = profile?.id ? publicSiteUrl(`/s/${profile.id}`) : '';

  return (
    <Screen>
      <BackButton fallback="/(tabs)/profile" />
      <Text style={[styles.title, { color: colors.text }]}>{profile?.storeName || 'Store details'}</Text>
      <Card style={styles.card}>
        <Text style={[styles.meta, { color: colors.textMuted }]}>{profile?.companyName}</Text>
        <Text style={[styles.body, { color: colors.text }]}>{profile?.pickupAddress}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {[profile?.pickupCity, profile?.pickupState, profile?.pickupPincode].filter(Boolean).join(', ')}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>GSTIN {profile?.gstNumber || '—'}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          Status: {profile?.verificationStatus || 'pending'}
        </Text>
      </Card>
      {link ? (
        <AppButton title="Share customer order link" onPress={() => void Share.share({ message: link })} />
      ) : null}
      <AppButton title="Update details" variant="secondary" onPress={() => router.push('/apply')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', marginBottom: 14 },
  card: { gap: 6, marginBottom: 14 },
  body: { fontSize: 15, lineHeight: 22 },
  meta: { fontSize: 13 },
});
