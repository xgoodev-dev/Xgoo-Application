import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton, BackButton, Field, Pill, Screen } from '@/components/ui';
import { proApi } from '@/lib/api';
import { goBackOr } from '@/lib/nav';
import { useProProfile } from '@/lib/profile';
import { useAppTheme } from '@/lib/theme';

const DAYS = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
] as const;

export default function ScheduleScreen() {
  const { token, profile, refresh } = useProProfile();
  const { colors } = useAppTheme();
  const [saving, setSaving] = useState(false);
  const [pickupStyle, setPickupStyle] = useState(profile?.pickupStyle === 'on_demand' ? 'on_demand' : 'standing');
  const [pickupTimeSlot, setPickupTimeSlot] = useState(profile?.pickupTimeSlot || '11:00');
  const [weekdays, setWeekdays] = useState<Record<string, boolean>>(
    profile?.weekdays || { sun: false, mon: true, tue: true, wed: true, thu: true, fri: true, sat: true },
  );

  const save = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await proApi.saveProfile(token, { pickupStyle, pickupTimeSlot, weekdays });
      await refresh();
      Alert.alert('Schedule saved', 'Pickup partners will follow these days and time.');
      goBackOr('/(tabs)/profile');
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <BackButton fallback="/(tabs)/profile" />
      <Text style={[styles.title, { color: colors.text }]}>Pickup schedule</Text>
      <View style={styles.pills}>
        <Pill label="Daily standing" active={pickupStyle === 'standing'} onPress={() => setPickupStyle('standing')} />
        <Pill label="On demand" active={pickupStyle === 'on_demand'} onPress={() => setPickupStyle('on_demand')} />
      </View>
      <Field label="Preferred time slot" value={pickupTimeSlot} onChangeText={setPickupTimeSlot} helperText="Example: 11:00" />
      <Text style={[styles.label, { color: colors.text }]}>Weekdays</Text>
      <View style={styles.pills}>
        {DAYS.map((day) => (
          <Pill
            key={day.id}
            label={day.label}
            active={Boolean(weekdays[day.id])}
            onPress={() => setWeekdays((current) => ({ ...current, [day.id]: !current[day.id] }))}
          />
        ))}
      </View>
      <AppButton title="Save schedule" loading={saving} onPress={() => void save()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', marginBottom: 14 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
});
