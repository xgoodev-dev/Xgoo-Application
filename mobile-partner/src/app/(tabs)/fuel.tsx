import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gauge, Timer } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton, Card, Field, Screen } from '@/components/ui';
import { pickupApi, type PickupFuelClaim, type PickupShift } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { startDutyTracking, stopDutyTracking } from '@/lib/duty-tracker';
import { formatDuration, fuelFromDistance, rupees, VEHICLE_MILEAGE_KM_PER_LITRE } from '@/lib/fuel-math';
import { useAppTheme } from '@/lib/theme';

function claimLabel(status: PickupFuelClaim['status']) {
  switch (status) {
    case 'requested':
      return 'Requested';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'paid':
      return 'Paid';
    default:
      return status;
  }
}

export default function FuelScreen() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const duty = useQuery({
    queryKey: ['pickup-duty', token],
    enabled: Boolean(token),
    queryFn: () => pickupApi.duty(token!),
    refetchInterval: 20_000,
  });

  const mileageDefault = Number(duty.data?.rate.mileageKmPerLitre || VEHICLE_MILEAGE_KM_PER_LITRE.bike);
  const priceDefault = Number(duty.data?.rate.fuelPricePerLitre || 105);

  const [hoursStart, setHoursStart] = useState('09:00');
  const [hoursEnd, setHoursEnd] = useState('18:00');
  const [breakMins, setBreakMins] = useState('0');
  const [calcKm, setCalcKm] = useState('20');
  const [calcMileage, setCalcMileage] = useState('');
  const [calcPrice, setCalcPrice] = useState('');

  const hoursResult = useMemo(() => {
    const [sh, sm] = hoursStart.split(':').map(Number);
    const [eh, em] = hoursEnd.split(':').map(Number);
    if (![sh, sm, eh, em].every((part) => Number.isFinite(part))) return 0;
    const start = sh * 60 + sm;
    let end = eh * 60 + em;
    if (end <= start) end += 24 * 60;
    return Math.max(0, end - start - (Number(breakMins) || 0));
  }, [hoursStart, hoursEnd, breakMins]);

  const fuelPreview = useMemo(
    () =>
      fuelFromDistance(
        Number(calcKm) || 0,
        Number(calcMileage) || mileageDefault,
        Number(calcPrice) || priceDefault,
      ),
    [calcKm, calcMileage, calcPrice, mileageDefault, priceDefault],
  );

  const requestFuel = useMutation({
    mutationFn: (shiftId: string) => pickupApi.requestFuel(token!, shiftId),
    onSuccess: () => {
      Alert.alert('Fuel request sent', 'Hub can now review and pay this duty.');
      void queryClient.invalidateQueries({ queryKey: ['pickup-duty', token] });
    },
    onError: (error: Error) => Alert.alert('Could not request fuel', error.message),
  });

  const current = duty.data?.current;
  const closed = (duty.data?.shifts || []).filter((shift) => shift.status === 'closed');
  const claims = duty.data?.claims || [];

  function claimFor(shiftId: string) {
    return claims.find((claim) => claim.shiftId === shiftId);
  }

  return (
    <Screen keyboard>
      <Text style={[styles.title, { color: colors.text }]}>Duty & fuel</Text>
      <Text style={[styles.copy, { color: colors.textMuted }]}>
        Working hours start when you sign in. Kilometres are tracked until you sign out, then you can
        request fuel cost.
      </Text>

      <Card style={styles.card}>
        <View style={styles.row}>
          <Timer size={18} color={colors.accent} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>On duty now</Text>
        </View>
        {current ? (
          <>
            <View style={styles.stats}>
              <Stat label="Hours" value={formatDuration(current.durationMinutes)} colors={colors} />
              <Stat label="Travelled" value={`${Number(current.distanceKm).toFixed(1)} km`} colors={colors} />
              <Stat label="Fuel" value={`${Number(current.fuelLitres).toFixed(2)} L`} colors={colors} />
              <Stat label="Est. cost" value={rupees(current.fuelCost)} colors={colors} />
            </View>
            <AppButton
              title="End duty"
              variant="secondary"
              onPress={() => {
                void stopDutyTracking().then(() => duty.refetch());
              }}
            />
          </>
        ) : (
          <>
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              Sign in starts duty automatically. Keep location on while you ride. End duty before
              requesting fuel, or sign out at the end of the day.
            </Text>
            <AppButton
              title="Start duty"
              onPress={() => {
                if (!token) return;
                void startDutyTracking(token).then(() => duty.refetch());
              }}
            />
          </>
        )}
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <Timer size={18} color={colors.accent} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Working hours calculator</Text>
        </View>
        <View style={styles.fields}>
          <Field label="Start" value={hoursStart} onChangeText={setHoursStart} placeholder="09:00" />
          <Field label="End" value={hoursEnd} onChangeText={setHoursEnd} placeholder="18:00" />
          <Field
            label="Break (min)"
            value={breakMins}
            onChangeText={setBreakMins}
            keyboardType="number-pad"
          />
        </View>
        <Text style={[styles.result, { color: colors.text }]}>{formatDuration(hoursResult)}</Text>
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <Gauge size={18} color={colors.accent} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Transit fuel calculator</Text>
        </View>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Default is {mileageDefault} km/L at {rupees(priceDefault)} / L for this store.
        </Text>
        <Field
          label="Distance (km)"
          value={calcKm}
          onChangeText={setCalcKm}
          keyboardType="decimal-pad"
        />
        <Field
          label="Mileage (km/L)"
          value={calcMileage}
          onChangeText={setCalcMileage}
          placeholder={String(mileageDefault)}
          keyboardType="decimal-pad"
        />
        <Field
          label="Fuel price (₹/L)"
          value={calcPrice}
          onChangeText={setCalcPrice}
          placeholder={String(priceDefault)}
          keyboardType="decimal-pad"
        />
        <View style={styles.stats}>
          <Stat label="Fuel needed" value={`${fuelPreview.litres.toFixed(2)} L`} colors={colors} />
          <Stat label="Cost" value={rupees(fuelPreview.amount)} colors={colors} />
        </View>
      </Card>

      <Text style={[styles.section, { color: colors.text }]}>Closed duties</Text>
      {closed.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          Sign out at the end of the day to close duty and request fuel.
        </Text>
      ) : (
        closed.map((shift) => (
          <ShiftClaimCard
            key={shift.id}
            shift={shift}
            claim={claimFor(shift.id)}
            colors={colors}
            loading={requestFuel.isPending}
            onRequest={() => requestFuel.mutate(shift.id)}
          />
        ))
      )}
    </Screen>
  );
}

function Stat({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: { text: string; textMuted: string };
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function ShiftClaimCard({
  shift,
  claim,
  colors,
  loading,
  onRequest,
}: {
  shift: PickupShift;
  claim?: PickupFuelClaim;
  colors: { text: string; textMuted: string; accent: string; border: string; success: string; danger: string };
  loading: boolean;
  onRequest: () => void;
}) {
  return (
    <Card style={styles.card}>
      <Text style={[styles.shiftWhen, { color: colors.textMuted }]}>
        {new Date(shift.startedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
        {shift.endedAt
          ? ` – ${new Date(shift.endedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
          : ''}
      </Text>
      <Text style={[styles.shiftLine, { color: colors.text }]}>
        {formatDuration(shift.durationMinutes)} · {Number(shift.distanceKm).toFixed(1)} km · {rupees(shift.fuelCost)}
      </Text>
      {claim ? (
        <Text
          style={[
            styles.claimStatus,
            {
              color:
                claim.status === 'paid' || claim.status === 'approved'
                  ? colors.success
                  : claim.status === 'rejected'
                    ? colors.danger
                    : colors.accent,
            },
          ]}
        >
          {claimLabel(claim.status)}
          {claim.reviewNotes ? ` · ${claim.reviewNotes}` : ''}
        </Text>
      ) : (
        <AppButton title="Request fuel cost" loading={loading} onPress={onRequest} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '900', marginTop: 8 },
  copy: { fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 16 },
  card: { padding: 14, gap: 10, marginBottom: 12, elevation: 0, shadowOpacity: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  hint: { fontSize: 12, lineHeight: 17 },
  empty: { fontSize: 13, lineHeight: 18 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { minWidth: '45%', gap: 2 },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: '800' },
  fields: { gap: 8 },
  result: { fontSize: 22, fontWeight: '900' },
  section: { fontSize: 16, fontWeight: '800', marginTop: 8, marginBottom: 8 },
  shiftWhen: { fontSize: 12, fontWeight: '600' },
  shiftLine: { fontSize: 15, fontWeight: '700' },
  claimStatus: { fontSize: 13, fontWeight: '800' },
});
