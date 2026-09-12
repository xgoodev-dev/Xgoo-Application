import { router } from 'expo-router';
import { ArrowLeft, ExternalLink, KeyRound, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, Card, Field, Screen } from '@/components/ui';
import { customerApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function PrivacySecurityScreen() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const changePassword = async () => {
    if (!currentPassword || newPassword.length < 8) {
      Alert.alert('Check your password', 'Enter your current password and a new password of at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Re-enter the same new password in both fields.');
      return;
    }
    setSaving(true);
    try {
      await customerApi.changePassword(token!, { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password changed', 'Your XGoo Go account password has been updated.');
    } catch (error) {
      Alert.alert('Could not change password', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboard>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={21} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>Privacy and security</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Protect your account and understand how your information is used.
          </Text>
        </View>
      </View>

      <Card style={styles.intro}>
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <ShieldCheck size={24} color={colors.accent} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Your account is protected</Text>
          <Text style={[styles.copy, { color: colors.textMuted }]}>
            Sign-in uses a one-time code on your mobile. Your session token is stored securely on this device.
          </Text>
        </View>
      </Card>

      <Text style={[styles.section, { color: colors.textMuted }]}>CHANGE PASSWORD</Text>
      <Card style={styles.form}>
        <Field
          label="Current password"
          value={currentPassword}
          secureTextEntry
          autoCapitalize="none"
          onChangeText={setCurrentPassword}
        />
        <Field
          label="New password"
          value={newPassword}
          secureTextEntry
          autoCapitalize="none"
          helperText="Use at least 8 characters."
          onChangeText={setNewPassword}
        />
        <Field
          label="Confirm new password"
          value={confirmPassword}
          secureTextEntry
          autoCapitalize="none"
          onChangeText={setConfirmPassword}
        />
        <AppButton
          title="Update password"
          icon={KeyRound}
          loading={saving}
          onPress={() => void changePassword()}
        />
      </Card>

      <Card
        onPress={() => void Linking.openURL('https://www.xgoo.in/privacy')}
        style={styles.linkCard}
      >
        <View style={styles.flex}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Privacy policy</Text>
          <Text style={[styles.copy, { color: colors.textMuted }]}>
            Read how XGoo Go collects, protects, and uses customer information.
          </Text>
        </View>
        <ExternalLink size={18} color={colors.textMuted} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { fontSize: 23, fontWeight: '800' },
  subtitle: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  intro: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  copy: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  section: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginTop: 24, marginBottom: 8 },
  form: { gap: 16 },
  linkCard: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
});

