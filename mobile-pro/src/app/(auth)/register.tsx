import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, BackButton, BrandLockup, Field, Screen } from '@/components/ui';
import { TechPartnerCredit } from '@/components/tech-partner-credit';
import { LegalLinks } from '@/components/legal-links';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { colors } = useAppTheme();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || form.phone.replace(/\D/g, '').length < 10 || form.password.length < 6) {
      Alert.alert('Check the form', 'Name, work email, 10-digit mobile, and a password of 6+ characters are required.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Could not create account', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard contentStyle={styles.content}>
      <BackButton fallback="/(auth)/welcome" />
      <BrandLockup compact />
      <View>
        <Text style={[styles.title, { color: colors.text }]}>Create your store account</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          After this, you will submit store details for XGoo Command to verify.
        </Text>
      </View>
      <Field label="Owner name" value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} />
      <Field
        label="Work email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={form.email}
        onChangeText={(email) => setForm((current) => ({ ...current, email }))}
      />
      <Field
        label="Mobile number"
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={(phone) => setForm((current) => ({ ...current, phone }))}
      />
      <Field
        label="Password"
        secureTextEntry
        value={form.password}
        onChangeText={(password) => setForm((current) => ({ ...current, password }))}
      />
      <AppButton title="Create account" loading={loading} onPress={() => void submit()} />
      <Pressable onPress={() => router.replace('/(auth)/sign-in')} style={styles.switch}>
        <Text style={[styles.switchText, { color: colors.textMuted }]}>
          Already have an account? <Text style={{ color: colors.accent, fontWeight: '700' }}>Sign in</Text>
        </Text>
      </Pressable>
      <TechPartnerCredit style={styles.credit} />
      <LegalLinks prefix="By creating an account you agree to our" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingBottom: 28 },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  switch: { alignItems: 'center', paddingVertical: 4 },
  switchText: { fontSize: 14 },
  credit: { marginTop: 8 },
});
