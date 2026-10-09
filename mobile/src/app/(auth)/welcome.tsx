import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, BrandLockup, Card, Screen } from '@/components/ui';
import { TechPartnerCredit } from '@/components/tech-partner-credit';
import { LegalLinks } from '@/components/legal-links';
import { XGOO_GO } from '@/lib/site-info';
import { useAppTheme } from '@/lib/theme';

export default function WelcomeScreen() {
  const { colors } = useAppTheme();
  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <BrandLockup />

      <View style={styles.hero}>
        <View style={styles.illustration}>
          <Image
            source={require('../../../assets/images/welcome-illustration.png')}
            style={styles.illustrationImage}
            contentFit="contain"
            accessibilityLabel="XGoo Go delivery map"
          />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Move parcels.{'\n'}Move possibilities.
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {XGOO_GO.name} — {XGOO_GO.meaning} Book pickups, compare delivery options,
          and come back for the next one.
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton
          title="Get started"
          icon={ArrowRight}
          onPress={() => router.push('/(auth)/register')}
        />
        <AppButton
          title="I already have an account"
          variant="secondary"
          onPress={() => router.push('/(auth)/sign-in')}
        />
        <Card style={styles.trust}>
          <Text style={[styles.trustText, { color: colors.textMuted }]}>
            Trusted movement, from pickup to delivery.
          </Text>
        </Card>
        <TechPartnerCredit style={styles.credit} />
        <LegalLinks prefix="By continuing you agree to our" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', paddingTop: 18, paddingBottom: 28 },
  hero: { alignItems: 'center' },
  illustration: {
    width: 156,
    height: 122,
    marginBottom: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: 156,
    height: 122,
  },
  title: { fontSize: 33, lineHeight: 39, fontWeight: '900', textAlign: 'center', letterSpacing: -1 },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 13, paddingHorizontal: 10 },
  actions: { gap: 11 },
  trust: { paddingVertical: 11, alignItems: 'center', marginTop: 2, elevation: 0, shadowOpacity: 0 },
  trustText: { fontSize: 11, fontWeight: '600' },
  credit: { marginTop: 10 },
});
