import { Image, Linking, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/lib/theme';

const TECTANGLE_URL = 'https://www.tectangle.com';
const TECTANGLE_WHITE = require('../../assets/images/tectangle-white-logo.png');
const TECTANGLE_BLACK = require('../../assets/images/tectangle-black-logo.png');

export function TechPartnerCredit({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors, isDark } = useAppTheme();
  return (
    <Pressable
      onPress={() => {
        void Linking.openURL(TECTANGLE_URL).catch(() => undefined);
      }}
      style={[styles.wrap, style]}
      accessibilityRole="link"
      accessibilityLabel="Designed and developed by Tectangle, www.tectangle.com"
    >
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Designed and developed by</Text>
        <Image
          source={isDark ? TECTANGLE_WHITE : TECTANGLE_BLACK}
          accessibilityLabel="Tectangle"
          resizeMode="contain"
          style={styles.logo}
        />
        <Text style={[styles.site, { color: colors.textMuted }]}>www.tectangle.com</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 11, fontWeight: '500', marginRight: 8 },
  logo: { width: 108, height: 22 },
  site: { fontSize: 11, fontWeight: '500', marginLeft: 8 },
});
