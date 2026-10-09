import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, LogoMark, Screen } from '@/components/ui';
import { TechPartnerCredit } from '@/components/tech-partner-credit';
import { LegalLinks } from '@/components/legal-links';
import { XGOO_PRO } from '@/lib/site-info';
import { useAppTheme } from '@/lib/theme';

export default function WelcomeScreen() {
  const { colors } = useAppTheme();
  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.hero}>
        <LogoMark size={72} />
        <Text style={[styles.name, { color: colors.text }]}>{XGOO_PRO.name}</Text>
        <Text style={[styles.title, { color: colors.text }]}>Your store. Standing pickup.</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Sign in or create an account to move orders, confirm pickup, and settle bills — the same Pro
          workspace as the website.
        </Text>
      </View>
      <View style={styles.actions}>
        <AppButton title="Create store account" icon={ArrowRight} onPress={() => router.push('/(auth)/register')} />
        <AppButton title="Sign in" variant="secondary" onPress={() => router.push('/(auth)/sign-in')} />
        <TechPartnerCredit style={styles.credit} />
        <LegalLinks prefix="By continuing you agree to our" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', paddingTop: 36, paddingBottom: 28 },
  hero: { alignItems: 'center', paddingTop: 24 },
  name: { marginTop: 16, fontSize: 15, fontWeight: '700', letterSpacing: 0.4 },
  title: { marginTop: 18, fontSize: 32, fontWeight: '900', letterSpacing: -0.8, textAlign: 'center' },
  subtitle: { marginTop: 12, fontSize: 15, lineHeight: 22, textAlign: 'center', paddingHorizontal: 8 },
  actions: { gap: 10 },
  credit: { marginTop: 18 },
});
