import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowRight, Box, MapPin, PackageCheck, Truck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, BrandLockup, Card, Screen } from '@/components/ui';
import { TechPartnerCredit } from '@/components/tech-partner-credit';
import { XGOO_GO } from '@/lib/site-info';
import { useAppTheme } from '@/lib/theme';

export default function WelcomeScreen() {
  const { colors, isDark } = useAppTheme();
  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <BrandLockup />

      <View style={styles.hero}>
        <LinearGradient
          colors={isDark ? ['#231710', '#17181B'] : ['#FFF0EA', '#FFFFFF']}
          style={[styles.illustration, { borderColor: colors.border }]}
        >
          <View style={[styles.route, { backgroundColor: colors.border }]} />
          <View style={[styles.pin, styles.pinOne, { backgroundColor: colors.accentSoft }]}>
            <MapPin size={24} color={colors.accent} />
          </View>
          <View style={[styles.pin, styles.pinTwo, { backgroundColor: colors.surface }]}>
            <PackageCheck size={25} color={colors.success} />
          </View>
          <View style={[styles.truck, { backgroundColor: colors.accent }]}>
            <Truck size={30} color="#FFFFFF" />
          </View>
          <View style={[styles.box, { backgroundColor: colors.surfaceRaised }]}>
            <Box size={38} color={colors.accent} />
          </View>
        </LinearGradient>

        <Text style={[styles.title, { color: colors.text }]}>
          Move parcels.{'\n'}Move possibilities.
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {XGOO_GO.name} — {XGOO_GO.meaning.toLowerCase()}. Book pickups, compare delivery options,
          and track every movement from one simple app.
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
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', paddingTop: 18, paddingBottom: 28 },
  hero: { alignItems: 'center' },
  illustration: {
    width: '100%',
    height: 260,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 30,
    overflow: 'hidden',
  },
  route: {
    position: 'absolute',
    width: 250,
    height: 3,
    left: 42,
    top: 130,
    transform: [{ rotate: '-13deg' }],
  },
  pin: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinOne: { left: 32, bottom: 42 },
  pinTwo: { right: 30, top: 36 },
  truck: {
    position: 'absolute',
    left: '45%',
    top: 99,
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  box: {
    position: 'absolute',
    left: 34,
    top: 28,
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 33, lineHeight: 39, fontWeight: '900', textAlign: 'center', letterSpacing: -1 },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 13, paddingHorizontal: 10 },
  actions: { gap: 11 },
  trust: { paddingVertical: 11, alignItems: 'center', marginTop: 2, elevation: 0, shadowOpacity: 0 },
  trustText: { fontSize: 11, fontWeight: '600' },
  credit: { marginTop: 10 },
});

