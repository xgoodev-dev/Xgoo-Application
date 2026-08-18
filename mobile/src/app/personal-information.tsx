import { router } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, Card, Field, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function PersonalInformationScreen() {
  const { user, updateUser } = useAuth();
  const { colors } = useAppTheme();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    email: user?.email || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
  }));

  const save = async () => {
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Enter your full name before saving.');
      return;
    }
    setSaving(true);
    try {
      await updateUser({
        ...form,
        name: form.name.trim(),
        email: form.email.trim() || null,
      });
      Alert.alert('Profile updated', 'Your personal information has been saved.');
    } catch (error) {
      Alert.alert('Could not update profile', error instanceof Error ? error.message : 'Try again.');
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
          <Text style={[styles.title, { color: colors.text }]}>Personal information</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Keep your account and pickup details current.
          </Text>
        </View>
      </View>

      <Card style={styles.form}>
        <Field
          label="Full name"
          value={form.name}
          autoCapitalize="words"
          returnKeyType="next"
          onChangeText={(name) => setForm((current) => ({ ...current, name }))}
        />
        <Field
          label="Phone number"
          value={user?.phone || ''}
          editable={false}
          helperText="Contact support to change the phone number used for sign-in."
        />
        <Field
          label="Email"
          value={form.email}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(email) => setForm((current) => ({ ...current, email }))}
        />
        <Field
          label="Default pickup address"
          value={form.address}
          multiline
          onChangeText={(address) => setForm((current) => ({ ...current, address }))}
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <Field
              label="City"
              value={form.city}
              onChangeText={(city) => setForm((current) => ({ ...current, city }))}
            />
          </View>
          <View style={styles.flex}>
            <Field
              label="Pincode"
              value={form.pincode}
              keyboardType="number-pad"
              onChangeText={(pincode) => setForm((current) => ({ ...current, pincode }))}
            />
          </View>
        </View>
        <Field
          label="State"
          value={form.state}
          onChangeText={(state) => setForm((current) => ({ ...current, state }))}
        />
      </Card>

      <AppButton title="Save changes" icon={Save} loading={saving} onPress={() => void save()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { fontSize: 23, fontWeight: '800' },
  subtitle: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  form: { gap: 16, marginBottom: 18 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
});

