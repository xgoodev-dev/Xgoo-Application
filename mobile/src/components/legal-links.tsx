import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { XGOO_LEGAL_URLS } from '@/lib/site-info';
import { useAppTheme } from '@/lib/theme';

export function LegalLinks({ prefix }: { prefix?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      {prefix ? (
        <Text style={[styles.text, { color: colors.textMuted }]}>{prefix} </Text>
      ) : null}
      <Pressable onPress={() => void Linking.openURL(XGOO_LEGAL_URLS.terms)}>
        <Text style={[styles.link, { color: colors.accent }]}>Terms</Text>
      </Pressable>
      <Text style={[styles.text, { color: colors.textMuted }]}> and </Text>
      <Pressable onPress={() => void Linking.openURL(XGOO_LEGAL_URLS.privacy)}>
        <Text style={[styles.link, { color: colors.accent }]}>Privacy Policy</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  text: { fontSize: 12, lineHeight: 18 },
  link: { fontSize: 12, lineHeight: 18, fontWeight: '700' },
});
