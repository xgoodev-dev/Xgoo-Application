import { router } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, BrandLockup, Field, Screen } from '@/components/ui';
import { TechPartnerCredit } from '@/components/tech-partner-credit';
import { LegalLinks } from '@/components/legal-links';
import { useAuth } from '@/lib/auth';
import { consumePendingDeepLink } from '@/lib/pending-deep-link';
import { useAppTheme } from '@/lib/theme';

export default function RegisterScreen() {
  const { register, requestOtp } = useAuth();
  const { colors } = useAppTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const sendCode = async () => {
    if (!name.trim() || phone.trim().length < 10) {
      Alert.alert(
        'Complete your account',
        'Add your name and a valid 10-digit mobile number.',
      );
      return;
    }
    setLoading(true);
    try {
      const result = await requestOtp(phone, 'register');
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
      Alert.alert('Could not send OTP', error instanceof Error ? error.message : 'Try again.');
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
      await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        otp,
      });
      router.replace(consumePendingDeepLink() || '/(tabs)');
    } catch (error) {
      Alert.alert('Could not create account', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard contentStyle={styles.content}>
      <Pressable
        onPress={() => (step === 'otp' ? setStep('details') : router.back())}
        style={styles.back}
      >
        <ArrowLeft size={22} color={colors.text} />
      </Pressable>
      <BrandLockup compact />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>Start moving</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {step === 'details'
            ? 'Create your XGoo Go account for faster parcel bookings. We will verify your mobile with an OTP.'
            : `Enter the OTP sent to ${phone.trim()}.`}
        </Text>
      </View>

      <View style={styles.form}>
        {step === 'details' ? (
          <>
            <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
            <Field
              label="Mobile number"
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
            <AppButton title="Send OTP" icon={ArrowRight} loading={loading} onPress={sendCode} />
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
            <AppButton title="Verify and create account" icon={ArrowRight} loading={loading} onPress={submit} />
            <Pressable disabled={resendIn > 0 || loading} onPress={() => void sendCode()}>
              <Text style={{ color: resendIn > 0 ? colors.textMuted : colors.accent, fontWeight: '700', textAlign: 'center' }}>
                {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.switchRow}>
        <Text style={{ color: colors.textMuted }}>Already registered? </Text>
        <Pressable onPress={() => router.replace('/(auth)/sign-in')}>
          <Text style={{ color: colors.accent, fontWeight: '700' }}>Sign in</Text>
        </Pressable>
      </View>
      <LegalLinks prefix="By creating an account you agree to our" />
      <TechPartnerCredit style={styles.credit} />
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
  credit: { marginTop: 16 },
});
