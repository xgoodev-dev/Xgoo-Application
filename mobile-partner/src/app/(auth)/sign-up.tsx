import { router } from 'expo-router';
import { ArrowLeft, UserPlus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, BrandLockup, Field, Screen } from '@/components/ui';
import { TechPartnerCredit } from '@/components/tech-partner-credit';
import { LegalLinks } from '@/components/legal-links';
import { pickupApi, type PickupStore } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

const GOVT_ID_OPTIONS = [
  { id: 'aadhaar', label: 'Aadhaar' },
  { id: 'pan', label: 'PAN' },
  { id: 'driving_license', label: 'Driving licence' },
  { id: 'voter_id', label: 'Voter ID' },
] as const;

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const { colors } = useAppTheme();
  const [stores, setStores] = useState<PickupStore[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [govtIdType, setGovtIdType] = useState<(typeof GOVT_ID_OPTIONS)[number]['id']>('aadhaar');
  const [govtIdNumber, setGovtIdNumber] = useState('');
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    pickupApi
      .stores()
      .then((list) => {
        if (!active) return;
        setStores(list);
        setBranchId((current) => current || list[0]?.id || '');
      })
      .catch(() => {
        if (active) setStores([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const submit = async () => {
    if (
      name.trim().length < 2 ||
      phone.replace(/\D/g, '').length < 10 ||
      password.length < 8 ||
      address.trim().length < 4 ||
      govtIdNumber.trim().length < 4 ||
      !branchId
    ) {
      Alert.alert('Check your details', 'Name, mobile, password, address, government ID, and store are required.');
      return;
    }
    setLoading(true);
    try {
      await signUp({
        name: name.trim(),
        phone,
        password,
        address: address.trim(),
        govtIdType,
        govtIdNumber,
        branchId,
      });
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Could not create account', error instanceof Error ? error.message : 'Please try again.');
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
        <Text style={[styles.title, { color: colors.text }]}>Create partner account</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Join one store. You will only collect doorstep orders assigned to that store.
        </Text>
      </View>
      <View style={styles.form}>
        <Field label="Name" value={name} onChangeText={setName} autoComplete="name" placeholder="Full name" />
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
          autoComplete="password-new"
          placeholder="At least 8 characters"
        />
        <Field
          label="Address"
          value={address}
          onChangeText={setAddress}
          multiline
          placeholder="House / street / area"
        />
        <Text style={[styles.section, { color: colors.text }]}>Government ID</Text>
        <View style={styles.chips}>
          {GOVT_ID_OPTIONS.map((option) => {
            const selected = option.id === govtIdType;
            return (
              <Pressable
                key={option.id}
                onPress={() => setGovtIdType(option.id)}
                style={[
                  styles.chip,
                  {
                    borderColor: selected ? colors.accent : colors.border,
                    backgroundColor: selected ? colors.accent : colors.surface,
                  },
                ]}
              >
                <Text style={{ color: selected ? '#fff' : colors.text, fontWeight: '700', fontSize: 13 }}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Field
          label="ID number"
          value={govtIdNumber}
          onChangeText={setGovtIdNumber}
          autoCapitalize="characters"
          placeholder="Enter the ID number"
        />
        <Text style={[styles.section, { color: colors.text }]}>Assigned store</Text>
        <View style={styles.stores}>
          {stores.map((store) => {
            const selected = store.id === branchId;
            return (
              <Pressable
                key={store.id}
                onPress={() => setBranchId(store.id)}
                style={[
                  styles.store,
                  {
                    borderColor: selected ? colors.accent : colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>{store.name}</Text>
                {store.city ? (
                  <Text style={{ color: colors.textMuted, marginTop: 2, fontSize: 12 }}>{store.city}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <AppButton title="Create account" icon={UserPlus} loading={loading} onPress={submit} />
        <LegalLinks prefix="By creating an account you agree to our" />
      </View>
      <TechPartnerCredit style={styles.credit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 36 },
  back: { width: 42, height: 42, justifyContent: 'center', marginLeft: -8, marginBottom: 20 },
  copy: { marginTop: 20, marginBottom: 22 },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  form: { gap: 14 },
  section: { fontSize: 13, fontWeight: '800', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  stores: { gap: 8 },
  store: { borderWidth: 1, borderRadius: 12, padding: 12 },
  credit: { marginTop: 24 },
});
