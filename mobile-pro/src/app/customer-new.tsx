import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AppButton, BackButton, Field, Screen } from '@/components/ui';
import { proApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { goBackOr } from '@/lib/nav';
import { useAppTheme } from '@/lib/theme';

export default function CustomerNewScreen() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const submit = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await proApi.createDestination(token, form);
      goBackOr('/customers');
    } catch (error) {
      Alert.alert('Could not save customer', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboard contentStyle={{ gap: 12 }}>
      <BackButton fallback="/customers" />
      <Text style={[styles.title, { color: colors.text }]}>Add customer</Text>
      <Field label="Name" value={form.name} onChangeText={(name) => setForm((c) => ({ ...c, name }))} />
      <Field label="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={(phone) => setForm((c) => ({ ...c, phone }))} />
      <Field label="Address" multiline value={form.address} onChangeText={(address) => setForm((c) => ({ ...c, address }))} />
      <Field label="City" value={form.city} onChangeText={(city) => setForm((c) => ({ ...c, city }))} />
      <Field label="State" value={form.state} onChangeText={(state) => setForm((c) => ({ ...c, state }))} />
      <Field label="Pincode" keyboardType="number-pad" value={form.pincode} onChangeText={(pincode) => setForm((c) => ({ ...c, pincode }))} />
      <AppButton title="Save customer" loading={saving} onPress={() => void submit()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800' },
});
