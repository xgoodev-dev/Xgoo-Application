import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LogoMark } from '@/components/ui';
import { XGOO_PRO } from '@/lib/site-info';

export function BrandSplash({ busy = true }: { busy?: boolean }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.mark}>
        <LogoMark size={112} />
      </View>
      <Text style={styles.name}>{XGOO_PRO.name}</Text>
      <Text style={styles.tag}>{XGOO_PRO.meaning}</Text>
      {busy ? <ActivityIndicator style={styles.loader} color="#FF4907" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E0F11',
    paddingHorizontal: 28,
  },
  mark: {
    width: 132,
    height: 132,
    borderRadius: 36,
    backgroundColor: '#17181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 22,
    color: '#FAFAFA',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  tag: {
    marginTop: 8,
    color: '#A1A1AA',
    fontSize: 15,
    textAlign: 'center',
  },
  loader: { marginTop: 32 },
});
