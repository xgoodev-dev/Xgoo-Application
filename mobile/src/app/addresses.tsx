import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Plus, Star, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, Card, EmptyState, Field, Pill, Screen } from '@/components/ui';
import { customerApi, type CustomerAddress } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

const emptyForm = {
  label: '',
  name: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  addressType: 'sender' as 'sender' | 'receiver',
};

export default function AddressesScreen() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const addresses = useQuery({
    queryKey: ['customer-addresses', token],
    queryFn: () => customerApi.addresses(token!),
    enabled: !!token,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['customer-addresses', token] });

  const create = useMutation({
    mutationFn: () =>
      customerApi.createAddress(token!, {
        ...form,
        lat: null,
        lng: null,
        isDefault: false,
      }),
    onSuccess: () => {
      setForm(emptyForm);
      setShowForm(false);
      void refresh();
    },
    onError: (error) =>
      Alert.alert('Could not save address', error instanceof Error ? error.message : 'Try again.'),
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CustomerAddress> }) =>
      customerApi.updateAddress(token!, id, input),
    onSuccess: () => void refresh(),
  });
  const remove = useMutation({
    mutationFn: (id: string) => customerApi.deleteAddress(token!, id),
    onSuccess: () => void refresh(),
  });

  const submit = () => {
    if (!form.label || !form.name || form.phone.length < 10 || !form.address) {
      Alert.alert('Complete the address', 'Label, name, valid phone and address are required.');
      return;
    }
    create.mutate();
  };

  return (
    <Screen keyboard>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={21} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>Saved addresses</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Reuse pickup and delivery details.
          </Text>
        </View>
        <Pressable
          onPress={() => setShowForm((value) => !value)}
          style={[styles.add, { backgroundColor: colors.accent }]}
        >
          <Plus size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {showForm ? (
        <Card style={styles.form}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Add an address</Text>
          <View style={styles.types}>
            <Pill
              label="Pickup"
              active={form.addressType === 'sender'}
              onPress={() => setForm({ ...form, addressType: 'sender' })}
              color={colors.accent}
            />
            <Pill
              label="Delivery"
              active={form.addressType === 'receiver'}
              onPress={() => setForm({ ...form, addressType: 'receiver' })}
              color={colors.success}
            />
          </View>
          <Field
            label="Label"
            placeholder="Home, Office..."
            value={form.label}
            onChangeText={(label) => setForm({ ...form, label })}
          />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Field
                label="Contact name"
                value={form.name}
                onChangeText={(name) => setForm({ ...form, name })}
              />
            </View>
            <View style={styles.flex}>
              <Field
                label="Phone"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(phone) => setForm({ ...form, phone })}
              />
            </View>
          </View>
          <Field
            label="Full address"
            multiline
            value={form.address}
            onChangeText={(address) => setForm({ ...form, address })}
          />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Field
                label="City"
                value={form.city}
                onChangeText={(city) => setForm({ ...form, city })}
              />
            </View>
            <View style={styles.flex}>
              <Field
                label="Pincode"
                keyboardType="number-pad"
                value={form.pincode}
                onChangeText={(pincode) => setForm({ ...form, pincode })}
              />
            </View>
          </View>
          <AppButton title="Save address" loading={create.isPending} onPress={submit} />
        </Card>
      ) : null}

      <View style={styles.list}>
        {(addresses.data || []).map((address) => (
          <Card key={address.id} style={styles.addressCard}>
            <View
              style={[
                styles.addressIcon,
                {
                  backgroundColor:
                    address.addressType === 'sender' ? colors.accentSoft : colors.surfaceMuted,
                },
              ]}
            >
              <MapPin
                size={20}
                color={address.addressType === 'sender' ? colors.accent : colors.success}
              />
            </View>
            <View style={styles.addressCopy}>
              <View style={styles.addressTitleRow}>
                <Text style={[styles.addressTitle, { color: colors.text }]}>{address.label}</Text>
                {address.isDefault ? <Star size={13} fill={colors.accent} color={colors.accent} /> : null}
              </View>
              <Text style={[styles.addressMeta, { color: colors.textMuted }]}>
                {address.name} · {address.phone}
              </Text>
              <Text numberOfLines={2} style={[styles.addressText, { color: colors.textMuted }]}>
                {[address.address, address.city, address.pincode].filter(Boolean).join(', ')}
              </Text>
            </View>
            <View style={styles.addressActions}>
              {!address.isDefault ? (
                <Pressable onPress={() => update.mutate({ id: address.id, input: { isDefault: true } })}>
                  <Star size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
              <Pressable
                onPress={() =>
                  Alert.alert('Remove address?', address.label, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(address.id) },
                  ])
                }
              >
                <Trash2 size={18} color={colors.danger} />
              </Pressable>
            </View>
          </Card>
        ))}
      </View>

      {!addresses.isLoading && !showForm && (addresses.data || []).length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Save frequent pickup and delivery locations for faster bookings."
          action={<AppButton title="Add address" onPress={() => setShowForm(true)} />}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  back: { width: 42, height: 42, justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 11, marginTop: 2 },
  add: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  form: { gap: 14, marginBottom: 18 },
  formTitle: { fontSize: 17, fontWeight: '800' },
  types: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  list: { gap: 11 },
  addressCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  addressIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addressCopy: { flex: 1 },
  addressTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  addressTitle: { fontSize: 15, fontWeight: '700' },
  addressMeta: { fontSize: 11, marginTop: 3 },
  addressText: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  addressActions: { gap: 15, paddingTop: 3 },
});

