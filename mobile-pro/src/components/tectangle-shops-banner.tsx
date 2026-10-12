import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

const SHOPS_URL = 'https://www.tectangle.com/shops';

export function TectangleShopsBanner() {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Create your ecommerce store in minutes. Open Tectangle Shops."
      onPress={() => void Linking.openURL(SHOPS_URL)}
      style={styles.card}
    >
      <View style={styles.top}>
        <Text style={styles.eyebrow}>For XGoo Pro businesses</Text>
        <Text style={styles.brand}>Tectangle</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.copy}>
          <Text style={styles.title}>Create your ecommerce store in minutes</Text>
          <Text style={styles.cta}>Open Tectangle Shops</Text>
        </View>
        <View style={styles.arrow}>
          <Text style={styles.arrowText}>↗</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: 14, backgroundColor: '#111111' },
  top: {
    backgroundColor: '#FFD400',
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    color: '#111111',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  brand: { color: '#111111', fontSize: 11, fontWeight: '800' },
  body: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12 },
  copy: { flex: 1, gap: 4 },
  title: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', lineHeight: 18 },
  cta: { color: '#FFD400', fontSize: 12, fontWeight: '700' },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD400',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { color: '#111111', fontSize: 14, fontWeight: '800' },
});
