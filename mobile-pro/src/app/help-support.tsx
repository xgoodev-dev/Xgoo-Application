import { Mail, MessageCircle, Phone } from 'lucide-react-native';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { BackButton, Card, Screen } from '@/components/ui';
import { TechPartnerCredit } from '@/components/tech-partner-credit';
import { XGOO_SUPPORT, callXgooSupport } from '@/lib/support';
import { useAppTheme } from '@/lib/theme';

export default function HelpSupportScreen() {
  const { colors } = useAppTheme();
  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open', url);
    }
  };

  return (
    <Screen>
      <BackButton fallback="/(tabs)/profile" />
      <Text style={[styles.title, { color: colors.text }]}>Help and support</Text>
      <Card style={styles.row} onPress={() => void open(XGOO_SUPPORT.whatsappUrl)}>
        <MessageCircle size={18} color={colors.accent} />
        <View>
          <Text style={[styles.label, { color: colors.text }]}>WhatsApp</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>Message XGoo Pro support</Text>
        </View>
      </Card>
      <Card style={styles.row} onPress={() => void callXgooSupport()}>
        <Phone size={18} color={colors.accent} />
        <View>
          <Text style={[styles.label, { color: colors.text }]}>Call</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {XGOO_SUPPORT.phoneDisplay} · {XGOO_SUPPORT.hours}
          </Text>
        </View>
      </Card>
      <Card style={styles.row} onPress={() => void open(`mailto:${XGOO_SUPPORT.email}`)}>
        <Mail size={18} color={colors.accent} />
        <View>
          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{XGOO_SUPPORT.email}</Text>
        </View>
      </Card>
      <TechPartnerCredit style={styles.credit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  label: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  credit: { marginTop: 24 },
});
