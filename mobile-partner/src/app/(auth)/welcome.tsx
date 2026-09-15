import { router } from 'expo-router';
import { ArrowRight, MapPin, PackageCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, BrandLockup, Card, Screen } from '@/components/ui';
import { TechPartnerCredit } from '@/components/tech-partner-credit';
import { LegalLinks } from '@/components/legal-links';
import { XGOO_PICKUP } from '@/lib/site-info';
import { useAppTheme } from '@/lib/theme';

export default function WelcomeScreen() {
  const { colors } = useAppTheme();
  return (
    <Screen contentStyle={styles.content}>
      <BrandLockup />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>Collect at the door</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {XGOO_PICKUP.name} assigns doorstep pickups, then you inspect, quote, pack, and create the AWB.
        </Text>
      </View>
      <View style={styles.points}>
        <Card style={styles.point}>
          <MapPin size={20} color={colors.accent} />
          <Text style={[styles.pointText, { color: colors.text }]}>Accept a nearby pickup and arrive on site</Text>
        </Card>
        <Card style={styles.point}>
          <PackageCheck size={20} color={colors.accent} />
          <Text style={[styles.pointText, { color: colors.text }]}>Weigh, quote, pack, and share tracking</Text>
        </Card>
      </View>
      <View style={styles.actions}>
        <AppButton title="Sign in" icon={ArrowRight} onPress={() => router.push('/(auth)/sign-in')} />
        <AppButton title="Create account" variant="secondary" onPress={() => router.push('/(auth)/sign-up')} />
      </View>
      <TechPartnerCredit style={styles.credit} />
      <LegalLinks prefix="By continuing you agree to our" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 24, paddingBottom: 28 },
  copy: { marginTop: 36, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 10 },
  points: { gap: 10, marginBottom: 28 },
  actions: { gap: 10 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  pointText: { flex: 1, fontSize: 14, fontWeight: '600' },
  credit: { marginTop: 28 },
});
