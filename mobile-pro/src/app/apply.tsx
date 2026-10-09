import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton, BackButton, Field, Pill, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { proApi } from '@/lib/api';
import { useProProfile } from '@/lib/profile';
import { useAppTheme } from '@/lib/theme';

const STORE_TYPES = [
  { id: 'cloth_store', label: 'Cloth store' },
  { id: 'gift_shop', label: 'Gift shop' },
  { id: 'social_media_store', label: 'Social media store' },
  { id: 'it_office', label: 'IT / office' },
  { id: 'pharmacy', label: 'Pharmacy' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'other', label: 'Other' },
] as const;

export default function ApplyScreen() {
  const { token } = useAuth();
  const { profile, refresh } = useProProfile();
  const { colors } = useAppTheme();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: profile?.companyName || '',
    storeName: profile?.storeName || '',
    storeType: profile?.storeType || '',
    gstNumber: profile?.gstNumber || '',
    pickupAddress: profile?.pickupAddress || '',
    pickupCity: profile?.pickupCity || '',
    pickupState: profile?.pickupState || '',
    pickupPincode: profile?.pickupPincode || '',
  });

  const submit = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await proApi.submitApplication(token, form);
      await refresh();
      Alert.alert('Submitted to Command', 'We’ll open your Pro account after these details are verified.');
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Could not submit', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboard contentStyle={{ gap: 12 }}>
      <BackButton fallback="/(tabs)" />
      <Text style={[styles.title, { color: colors.text }]}>Store details</Text>
      <Text style={[styles.copy, { color: colors.textMuted }]}>
        XGoo Command uses this to verify your store before standing pickup starts.
      </Text>
      <Field label="Business name" value={form.companyName} onChangeText={(companyName) => setForm((c) => ({ ...c, companyName }))} />
      <Field label="Store name" value={form.storeName} onChangeText={(storeName) => setForm((c) => ({ ...c, storeName }))} />
      <Text style={[styles.label, { color: colors.text }]}>Store type</Text>
      <View style={styles.pills}>
        {STORE_TYPES.map((type) => (
          <Pill
            key={type.id}
            label={type.label}
            active={form.storeType === type.id}
            onPress={() => setForm((c) => ({ ...c, storeType: type.id }))}
          />
        ))}
      </View>
      <Field
        label="GSTIN"
        autoCapitalize="characters"
        value={form.gstNumber}
        onChangeText={(gstNumber) => setForm((c) => ({ ...c, gstNumber: gstNumber.toUpperCase() }))}
      />
      <Field
        label="Store address"
        multiline
        value={form.pickupAddress}
        onChangeText={(pickupAddress) => setForm((c) => ({ ...c, pickupAddress }))}
      />
      <Field label="City" value={form.pickupCity} onChangeText={(pickupCity) => setForm((c) => ({ ...c, pickupCity }))} />
      <Field label="State" value={form.pickupState} onChangeText={(pickupState) => setForm((c) => ({ ...c, pickupState }))} />
      <Field
        label="Pincode"
        keyboardType="number-pad"
        value={form.pickupPincode}
        onChangeText={(pickupPincode) => setForm((c) => ({ ...c, pickupPincode }))}
      />
      <AppButton title={saving ? 'Submitting…' : 'Submit to Command'} loading={saving} onPress={() => void submit()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800' },
  copy: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
});
