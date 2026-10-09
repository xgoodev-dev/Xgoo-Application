import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Clock3, ShieldCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, Card, Screen } from '@/components/ui';
import { XGOO_PRO } from '@/lib/site-info';
import { useAppTheme } from '@/lib/theme';
import type { BusinessProfile } from '@/lib/api';

export function AccessGate({
  access,
  profile,
  coverageLocked,
  coverageMessage,
  children,
}: {
  access: 'loading' | 'apply' | 'pending' | 'approved';
  profile?: BusinessProfile;
  coverageLocked?: boolean;
  coverageMessage?: string;
  children: ReactNode;
}) {
  const { colors } = useAppTheme();

  switch (access) {
    case 'loading':
      return (
        <Screen>
          <Text style={{ color: colors.textMuted }}>Loading your store…</Text>
        </Screen>
      );
    case 'apply':
      return (
        <Screen>
          <Text style={[styles.title, { color: colors.text }]}>Open your {XGOO_PRO.name} store</Text>
          <Text style={[styles.copy, { color: colors.textMuted }]}>
            Send store details to XGoo Command. You can create orders after the store is verified.
          </Text>
          {profile?.verificationStatus === 'rejected' && profile.verificationNote ? (
            <Card>
              <Text style={{ color: colors.danger }}>{profile.verificationNote}</Text>
            </Card>
          ) : null}
          <AppButton title="Submit store details" onPress={() => router.push('/apply')} />
        </Screen>
      );
    case 'pending':
      return (
        <Screen>
          <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
            <Clock3 size={28} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Waiting for Command</Text>
          <Text style={[styles.copy, { color: colors.textMuted }]}>
            {profile?.storeName || 'Your store'} is with XGoo Command for verification.
          </Text>
          <AppButton title="Update details" variant="secondary" onPress={() => router.push('/apply')} />
        </Screen>
      );
    case 'approved':
      if (coverageLocked) {
        return (
          <Screen>
            <Text style={[styles.title, { color: colors.text }]}>Not in range yet</Text>
            <Text style={[styles.copy, { color: colors.textMuted }]}>
              {coverageMessage ||
                'XGoo Pro is available around the Hub service area. We will notify you as we expand.'}
            </Text>
            <AppButton title="Help and support" variant="secondary" onPress={() => router.push('/help-support')} />
          </Screen>
        );
      }
      return <>{children}</>;
    default: {
      const _exhaustive: never = access;
      return _exhaustive;
    }
  }
}

export function VerifiedBadge() {
  const { colors } = useAppTheme();
  return (
    <View style={styles.badge}>
      <ShieldCheck size={14} color={colors.success} />
      <Text style={[styles.badgeText, { color: colors.success }]}>Verified by Command</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  copy: { fontSize: 14, lineHeight: 21, marginBottom: 20 },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
});
