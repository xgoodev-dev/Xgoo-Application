import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton, BackButton, Field, Pill, Screen } from '@/components/ui';
import { proApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'call', label: 'Call' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'website', label: 'Website' },
  { id: 'app', label: 'Store app' },
  { id: 'other', label: 'Other' },
] as const;

export default function OrderNewScreen() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    channel: 'whatsapp',
    name: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    contentDescription: '',
    weight: '1',
    saveCustomer: true,
  });

  const submit = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await proApi.createOrder(token, {
        channel: form.channel,
        name: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        pincode: form.pincode,
        contentDescription: form.contentDescription,
        weight: form.weight,
        saveCustomer: form.saveCustomer,
        notifyBuyer: true,
      });
      router.replace('/(tabs)/orders');
    } catch (error) {
      Alert.alert('Could not create order', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboard contentStyle={{ gap: 12 }}>
      <BackButton fallback="/(tabs)/orders" />
      <Text style={[styles.title, { color: colors.text }]}>New order</Text>
      <Text style={[styles.label, { color: colors.text }]}>Channel</Text>
      <View style={styles.pills}>
        {CHANNELS.map((channel) => (
          <Pill
            key={channel.id}
            label={channel.label}
            active={form.channel === channel.id}
            onPress={() => setForm((c) => ({ ...c, channel: channel.id }))}
          />
        ))}
      </View>
      <Field label="Customer name" value={form.name} onChangeText={(name) => setForm((c) => ({ ...c, name }))} />
      <Field label="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={(phone) => setForm((c) => ({ ...c, phone }))} />
      <Field label="Delivery address" multiline value={form.address} onChangeText={(address) => setForm((c) => ({ ...c, address }))} />
      <Field label="City" value={form.city} onChangeText={(city) => setForm((c) => ({ ...c, city }))} />
      <Field label="Pincode" keyboardType="number-pad" value={form.pincode} onChangeText={(pincode) => setForm((c) => ({ ...c, pincode }))} />
      <Field
        label="What’s in the parcel"
        value={form.contentDescription}
        onChangeText={(contentDescription) => setForm((c) => ({ ...c, contentDescription }))}
      />
      <Field label="Weight (kg)" keyboardType="decimal-pad" value={form.weight} onChangeText={(weight) => setForm((c) => ({ ...c, weight }))} />
      <AppButton title="Create order" loading={saving} onPress={() => void submit()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
});
