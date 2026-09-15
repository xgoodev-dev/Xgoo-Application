import { router } from 'expo-router';
import { ArrowLeft, LogIn } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, BrandLockup, Field, Screen } from '@/components/ui';
import { TechPartnerCredit } from '@/components/tech-partner-credit';
import { LegalLinks } from '@/components/legal-links';
import { useAuth } from '@/lib/auth';
import { getApiUrl } from '@/lib/server';
import { useAppTheme } from '@/lib/theme';

export default function SignInScreen() {
  const { requestOtp, signIn, signInWithPassword } = useAuth();
  const { colors } = useAppTheme();
  const [mode, setMode] = useState<'password' | 'otp-phone' | 'otp'>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const sendCode = async () => {
    if (phone.trim().length < 10) {
      Alert.alert('Check your mobile number', 'Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const result = await requestOtp(phone);
      setMode('otp');
      setOtp('');
      setResendIn(45);
      Alert.alert(
        'OTP sent',
        result.debugOtp ? `Use this code: ${result.debugOtp}` : 'Until WhatsApp is configured, use 123456.',
      );
    } catch (error) {
      Alert.alert('Could not send OTP', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async () => {
    if (phone.trim().length < 10 || password.length < 8) {
      Alert.alert('Check your details', 'Enter your mobile number and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithPassword(phone, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Could not sign in', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    if (otp.replace(/\D/g, '').length !== 6) {
      Alert.alert('Enter the OTP', 'Type the 6-digit code from WhatsApp.');
      return;
    }
    setLoading(true);
    try {
      await signIn(phone, otp);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Could not sign in', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard contentStyle={styles.content}>
      <Pressable
        onPress={() => {
          if (mode === 'otp') setMode('otp-phone');
          else if (mode === 'otp-phone') setMode('password');
          else router.back();
        }}
        style={styles.back}
      >
        <ArrowLeft size={22} color={colors.text} />
      </Pressable>
      <BrandLockup compact />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>Partner sign in</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {mode === 'password'
            ? 'Use the mobile number and password for your store.'
            : mode === 'otp-phone'
              ? 'Use the mobile number Hub invited. We will send an OTP on WhatsApp.'
              : `Enter the OTP sent to ${phone.trim()}.`}
        </Text>
      </View>
      <View style={styles.form}>
        {mode === 'password' ? (
          <>
            <Field
              label="Mobile number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholder="10-digit mobile number"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholder="Password"
            />
            <AppButton title="Sign in" icon={LogIn} loading={loading} onPress={submitPassword} />
            <Pressable onPress={() => setMode('otp-phone')}>
              <Text style={[styles.link, { color: colors.accent }]}>Sign in with OTP instead</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={[styles.link, { color: colors.textMuted }]}>New partner? Create an account</Text>
            </Pressable>
            {typeof __DEV__ !== 'undefined' && __DEV__ ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 12 }}>
                Talking to {getApiUrl()}
              </Text>
            ) : null}
          </>
        ) : null}
        {mode === 'otp-phone' ? (
          <>
            <Field
              label="Mobile number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholder="10-digit mobile number"
            />
            <AppButton title="Send OTP" icon={LogIn} loading={loading} onPress={sendCode} />
          </>
        ) : null}
        {mode === 'otp' ? (
          <>
            <Field
              label="OTP"
              value={otp}
              onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              maxLength={6}
            />
            <AppButton title="Verify and sign in" icon={LogIn} loading={loading} onPress={submitOtp} />
            <Pressable disabled={resendIn > 0 || loading} onPress={() => void sendCode()}>
              <Text
                style={{
                  color: resendIn > 0 ? colors.textMuted : colors.accent,
                  fontWeight: '700',
                  textAlign: 'center',
                }}
              >
                {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>
      <LegalLinks prefix="By signing in you agree to our" />
      <TechPartnerCredit style={styles.credit} />
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
  link: { fontWeight: '700', textAlign: 'center' },
  credit: { marginTop: 28 },
});
