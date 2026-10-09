import { router } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, BackButton, BrandLockup, Field, Pill, Screen } from '@/components/ui';
import { TechPartnerCredit } from '@/components/tech-partner-credit';
import { LegalLinks } from '@/components/legal-links';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function SignInScreen() {
  const { requestOtp, signInWithPassword, signInWithOtp } = useAuth();
  const { colors } = useAppTheme();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
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
      setOtpSent(true);
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

  const submit = async () => {
    setLoading(true);
    try {
      if (method === 'email') {
        if (!email.trim() || !password) {
          Alert.alert('Enter your details', 'Email and password are required.');
          return;
        }
        await signInWithPassword(email, password);
      } else {
        if (otp.replace(/\D/g, '').length !== 6) {
          Alert.alert('Enter the OTP', 'Type the 6-digit code.');
          return;
        }
        await signInWithOtp(phone, otp);
      }
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Could not sign in', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard contentStyle={styles.content}>
      <BackButton fallback="/(auth)/welcome" />
      <BrandLockup compact />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>Sign in</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Use the same XGoo Pro account you use on the website.
        </Text>
      </View>
      <View style={styles.pills}>
        <Pill label="Email" active={method === 'email'} onPress={() => setMethod('email')} />
        <Pill label="Mobile OTP" active={method === 'phone'} onPress={() => setMethod('phone')} />
      </View>
      {method === 'email' ? (
        <>
          <Field
            label="Work email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field label="Password" secureTextEntry value={password} onChangeText={setPassword} />
          <AppButton title="Sign in" icon={LogIn} loading={loading} onPress={() => void submit()} />
        </>
      ) : (
        <>
          <Field
            label="Mobile number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            editable={!otpSent}
          />
          {otpSent ? (
            <Field label="OTP" keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} />
          ) : null}
          {!otpSent ? (
            <AppButton title="Send OTP" loading={loading} onPress={() => void sendCode()} />
          ) : (
            <>
              <AppButton title="Sign in" icon={LogIn} loading={loading} onPress={() => void submit()} />
              <AppButton
                title={resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
                variant="ghost"
                disabled={resendIn > 0}
                onPress={() => void sendCode()}
              />
            </>
          )}
        </>
      )}
      <Pressable onPress={() => router.replace('/(auth)/register')} style={styles.switch}>
        <Text style={[styles.switchText, { color: colors.textMuted }]}>
          New store? <Text style={{ color: colors.accent, fontWeight: '700' }}>Create an account</Text>
        </Text>
      </Pressable>
      <TechPartnerCredit style={styles.credit} />
      <LegalLinks />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingBottom: 28 },
  copy: { marginTop: 8, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  pills: { flexDirection: 'row', gap: 8 },
  switch: { alignItems: 'center', paddingVertical: 8 },
  switchText: { fontSize: 14 },
  credit: { marginTop: 8 },
});
