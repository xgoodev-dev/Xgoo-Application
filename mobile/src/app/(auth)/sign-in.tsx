import { router } from 'expo-router';
import { ArrowLeft, LogIn } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, BrandLockup, Field, Screen } from '@/components/ui';
import { TechPartnerCredit } from '@/components/tech-partner-credit';
import { useAuth } from '@/lib/auth';
import { consumePendingDeepLink } from '@/lib/pending-deep-link';
import { useAppTheme } from '@/lib/theme';

export default function SignInScreen() {
  const { requestOtp, signIn } = useAuth();
  const { colors } = useAppTheme();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
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
      const result = await requestOtp(phone, 'login');
      setStep('otp');
      setOtp('');
      setResendIn(45);
      Alert.alert(
        'OTP sent',
        result.debugOtp
          ? `Use this code: ${result.debugOtp}`
          : "Until WhatsApp is configured, use 123456.",
      );
    } catch (error) {
      Alert.alert('Could not send OTP', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (otp.replace(/\D/g, '').length !== 6) {
      Alert.alert('Enter the OTP', 'Type the 6-digit code from WhatsApp.');
      return;
    }
    setLoading(true);
    try {
      await signIn(phone, otp);
      router.replace(consumePendingDeepLink() || '/(tabs)');
    } catch (error) {
      Alert.alert('Could not sign in', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard contentStyle={styles.content}>
      <Pressable
        onPress={() => (step === 'otp' ? setStep('phone') : router.back())}
        style={styles.back}
      >
        <ArrowLeft size={22} color={colors.text} />
      </Pressable>
      <BrandLockup compact />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {step === 'phone'
            ? 'Sign in with your mobile number. We will send an OTP on WhatsApp.'
            : `Enter the OTP sent to ${phone.trim()}.`}
        </Text>
      </View>

      <View style={styles.form}>
        {step === 'phone' ? (
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
        ) : (
          <>
            <Field
              label="OTP"
              value={otp}
              onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              maxLength={6}
              helperText="Until WhatsApp OTP is set up, use 123456"
            />
            <AppButton title="Verify and sign in" icon={LogIn} loading={loading} onPress={submit} />
            <Pressable disabled={resendIn > 0 || loading} onPress={() => void sendCode()}>
              <Text style={{ color: resendIn > 0 ? colors.textMuted : colors.accent, fontWeight: '700', textAlign: 'center' }}>
                {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.switchRow}>
        <Text style={{ color: colors.textMuted }}>New to XGoo Go? </Text>
        <Pressable onPress={() => router.replace('/(auth)/register')}>
          <Text style={{ color: colors.accent, fontWeight: '700' }}>Create account</Text>
        </Pressable>
      </View>
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
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 26 },
  credit: { marginTop: 28 },
});
