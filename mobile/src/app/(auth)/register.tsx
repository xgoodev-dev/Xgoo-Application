import { router } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, BrandLockup, Field, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { colors } = useAppTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim() || phone.trim().length < 10 || password.length < 6) {
      Alert.alert(
        'Complete your account',
        'Add your name, a valid phone number, and a password of at least 6 characters.',
      );
      return;
    }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
      });
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Could not create account', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard contentStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <ArrowLeft size={22} color={colors.text} />
      </Pressable>
      <BrandLockup compact />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>Start moving</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Create your account for faster parcel bookings.
        </Text>
      </View>

      <View style={styles.form}>
        <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
        <Field
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="10-digit mobile number"
        />
        <Field
          label="Email (optional)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 6 characters"
        />
        <AppButton title="Create account" icon={ArrowRight} loading={loading} onPress={submit} />
      </View>

      <View style={styles.switchRow}>
        <Text style={{ color: colors.textMuted }}>Already registered? </Text>
        <Pressable onPress={() => router.replace('/(auth)/sign-in')}>
          <Text style={{ color: colors.accent, fontWeight: '700' }}>Sign in</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16 },
  back: { width: 42, height: 42, justifyContent: 'center', marginLeft: -8, marginBottom: 20 },
  copy: { marginTop: 38, marginBottom: 26 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { fontSize: 14, marginTop: 8 },
  form: { gap: 15 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});

