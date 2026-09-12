import { router } from 'expo-router';
import { ArrowLeft, CircleHelp, Mail, MessageCircle, Phone, ExternalLink } from 'lucide-react-native';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Screen } from '@/components/ui';
import { TechPartnerCredit } from '@/components/tech-partner-credit';
import { useAppTheme } from '@/lib/theme';

const supportOptions = [
  {
    icon: MessageCircle,
    title: 'Chat on WhatsApp',
    subtitle: 'Message the XGoo support team',
    url: 'https://wa.me/15559529213',
  },
  {
    icon: Phone,
    title: 'Call support',
    subtitle: '+91 93471 38235 · Mon–Sat, 9 AM–7 PM',
    url: 'tel:+919347138235',
  },
  {
    icon: Mail,
    title: 'Email support',
    subtitle: 'connect@xgoo.in',
    url: 'mailto:connect@xgoo.in?subject=XGoo%20Mobile%20Support',
  },
  {
    icon: ExternalLink,
    title: 'Visit XGoo website',
    subtitle: 'www.xgoo.in',
    url: 'https://www.xgoo.in',
  },
];

export default function HelpSupportScreen() {
  const { colors } = useAppTheme();

  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open', 'This service is not available on your device.');
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={21} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>Help and support</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            We are here to keep your movement simple.
          </Text>
        </View>
      </View>

      <Card style={[styles.hero, { backgroundColor: colors.accentSoft }]}>
        <CircleHelp size={30} color={colors.accent} />
        <View style={styles.flex}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>How can we help?</Text>
          <Text style={[styles.copy, { color: colors.textMuted }]}>
            Contact XGoo about a booking, pickup, delivery, account, or payment.
          </Text>
        </View>
      </Card>

      <Text style={[styles.section, { color: colors.textMuted }]}>CONTACT XGOO</Text>
      <View style={styles.options}>
        {supportOptions.map(({ icon: Icon, title, subtitle, url }) => (
          <Card key={title} onPress={() => void open(url)} style={styles.option}>
            <View style={[styles.optionIcon, { backgroundColor: colors.surfaceMuted }]}>
              <Icon size={20} color={colors.accent} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
            </View>
            <ExternalLink size={16} color={colors.textMuted} />
          </Card>
        ))}
      </View>

      <Text style={[styles.section, { color: colors.textMuted }]}>QUICK ANSWERS</Text>
      <Card style={styles.faq}>
        <Faq
          question="Where can I find my booking number?"
          answer="Open Shipments. Every submitted request displays its XGoo request number."
        />
        <Divider />
        <Faq
          question="When is my pickup confirmed?"
          answer="Your request appears as Pending until XGoo confirms serviceability, price, and pickup timing."
        />
        <Divider />
        <Faq
          question="How do I track a parcel?"
          answer="Open Track and enter the request number, booking number, or AWB supplied by XGoo."
        />
      </Card>
      <TechPartnerCredit style={styles.credit} />
    </Screen>
  );
}

function Faq({ question, answer }: { question: string; answer: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.faqItem}>
      <Text style={[styles.faqQuestion, { color: colors.text }]}>{question}</Text>
      <Text style={[styles.copy, { color: colors.textMuted }]}>{answer}</Text>
    </View>
  );
}

function Divider() {
  const { colors } = useAppTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { fontSize: 23, fontWeight: '800' },
  subtitle: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  hero: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, elevation: 0, shadowOpacity: 0 },
  heroTitle: { fontSize: 17, fontWeight: '800' },
  copy: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  flex: { flex: 1 },
  section: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginTop: 24, marginBottom: 8 },
  options: { gap: 9 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 },
  optionIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 14, fontWeight: '700' },
  optionSubtitle: { fontSize: 10, marginTop: 2 },
  faq: { paddingVertical: 4 },
  faqItem: { paddingVertical: 13 },
  faqQuestion: { fontSize: 13, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth },
  credit: { marginTop: 28, marginBottom: 8 },
});

