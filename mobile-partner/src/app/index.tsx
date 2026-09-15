import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BrandLockup } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function EntryScreen() {
  const { loading, token } = useAuth();
  const { colors } = useAppTheme();

  if (!loading) {
    return <Redirect href={token ? '/(tabs)' : '/(auth)/welcome'} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BrandLockup />
      <Text style={[styles.copy, { color: colors.textMuted }]}>Collect at the door.</Text>
      <ActivityIndicator style={styles.loader} color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  copy: { marginTop: 12, fontSize: 13 },
  loader: { marginTop: 28 },
});
