import { router } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, LogIn } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, BrandLockup, Field, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const { colors } = useAppTheme();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (phone.trim().length < 10 || !password) {
      Alert.alert('Check your details', 'Enter your phone number and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(phone, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Could not sign in', error instanceof Error ? error.message : 'Please try again.');
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
        <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Sign in to book and track your parcels.
        </Text>
      </View>

      <View style={styles.form}>
        <Field
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          placeholder="10-digit mobile number"
        />
        <View>
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!visible}
            autoComplete="password"
            placeholder="Your password"
          />
          <Pressable style={styles.eye} onPress={() => setVisible((value) => !value)}>
            {visible ? (
              <EyeOff size={19} color={colors.textMuted} />
            ) : (
              <Eye size={19} color={colors.textMuted} />
            )}
          </Pressable>
        </View>
        <AppButton title="Sign in" icon={LogIn} loading={loading} onPress={submit} />
      </View>

      <View style={styles.switchRow}>
        <Text style={{ color: colors.textMuted }}>New to XGoo? </Text>
        <Pressable onPress={() => router.replace('/(auth)/register')}>
          <Text style={{ color: colors.accent, fontWeight: '700' }}>Create account</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16 },
  back: { width: 42, height: 42, justifyContent: 'center', marginLeft: -8, marginBottom: 20 },
  copy: { marginTop: 46, marginBottom: 28 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { fontSize: 14, marginTop: 8 },
  form: { gap: 17 },
  eye: { position: 'absolute', right: 14, bottom: 15 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 26 },
});

