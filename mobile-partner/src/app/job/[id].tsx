import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { LocationBar } from '@/components/location-bar';
import { AppButton, Field, Screen } from '@/components/ui';
import { pickupApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function JobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const [weight, setWeight] = useState('');
  const [pieces, setPieces] = useState('1');
  const [contents, setContents] = useState('');
  const [notes, setNotes] = useState('');
  const [awb, setAwb] = useState('');
  const [quoteTotal, setQuoteTotal] = useState('');

  const jobQuery = useQuery({
    queryKey: ['pickup-job', id, token],
    enabled: Boolean(token && id),
    queryFn: () => pickupApi.job(token!, String(id)),
    refetchInterval: 10_000,
  });

  const run = useMutation({
    mutationFn: (input: { action: string; body?: Record<string, unknown> }) =>
      pickupApi.action(token!, String(id), input.action, input.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pickup-job', id, token] });
      void queryClient.invalidateQueries({ queryKey: ['pickup-jobs'] });
    },
    onError: (error: Error) => Alert.alert('Could not update job', error.message),
  });

  const job = jobQuery.data;
  const request = job?.request;
  const storeVisit = job?.storeVisit;
  const storeParcels = storeVisit?.parcels || [];
  const inspectedReady = storeParcels.filter((parcel) =>
    ['inspected', 'quote_sent'].includes(parcel.status),
  ).length;
  const waitingAccept = storeParcels.filter((parcel) => parcel.status === 'quote_sent').length;
  const mapsUrl =
    request?.pickupLat && request?.pickupLng
      ? `https://www.google.com/maps?q=${request.pickupLat},${request.pickupLng}`
      : request?.senderAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(request.senderAddress)}`
        : null;

  return (
    <Screen keyboard>
      <LocationBar />
      <Pressable onPress={() => router.back()} style={styles.back}>
        <ArrowLeft size={22} color={colors.text} />
      </Pressable>
      <Text style={[styles.kicker, { color: colors.accent }]}>{request?.requestNumber || 'Pickup'}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{request?.senderName || 'Customer'}</Text>
      <Text style={[styles.meta, { color: colors.textMuted }]}>
        {request?.senderAddress}
        {request?.senderCity ? `\n${request.senderCity}` : ''}
      </Text>
      <Text style={[styles.phone, { color: colors.text }]}>{request?.senderPhone}</Text>
      {request?.receiverName ? (
        <View style={styles.toBox}>
          <Text style={[styles.kicker, { color: colors.accent }]}>To</Text>
          <Text style={[styles.parcelTitle, { color: colors.text }]}>{request.receiverName}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {[request.receiverAddress, request.receiverAddressLine2, request.receiverCity, request.receiverPincode]
              .filter(Boolean)
              .join(', ')}
          </Text>
        </View>
      ) : null}
      {mapsUrl ? (
        <AppButton title="Open map" variant="secondary" onPress={() => void Linking.openURL(mapsUrl)} />
      ) : null}

      {storeVisit?.isBusinessStore && storeParcels.length > 1 ? (
        <View style={styles.storeVisit}>
          <Text style={[styles.wait, { color: colors.text }]}>
            Inspect every parcel at this store, then send the final quotations together. Pack only after the store accepts.
          </Text>
          {storeParcels.map((parcel) => (
            <Pressable
              key={parcel.id}
              onPress={() => {
                if (parcel.id !== id) router.push(`/job/${parcel.id}`);
              }}
              style={[styles.parcelRow, { borderColor: colors.border }]}
            >
              <Text style={[styles.parcelTitle, { color: colors.text }]}>
                {parcel.requestNumber} · {parcel.receiverName}
              </Text>
              <Text style={[styles.parcelMeta, { color: colors.textMuted }]}>
                {parcel.receiverCity || 'Route pending'}
                {parcel.quotationAmount ? ` · ₹${parcel.quotationAmount}` : ''}
                {` · ${parcel.status.replace(/_/g, ' ')}`}
              </Text>
            </Pressable>
          ))}
          {inspectedReady > 0 ? (
            <AppButton
              title={
                inspectedReady === 1
                  ? 'Send final quotation'
                  : `Send ${inspectedReady} final quotations`
              }
              loading={run.isPending}
              onPress={() => run.mutate({ action: 'quote-store' })}
            />
          ) : null}
          {waitingAccept > 0 ? (
            <Text style={[styles.wait, { color: colors.textMuted }]}>
              Waiting for the store to accept {waitingAccept} quotation{waitingAccept === 1 ? '' : 's'}. Approved amounts go on their Bills.
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        {job?.status === 'assigned' ? (
          <>
            <AppButton title="Accept pickup" loading={run.isPending} onPress={() => run.mutate({ action: 'accept' })} />
            <AppButton
              title="Decline"
              variant="secondary"
              loading={run.isPending}
              onPress={() => run.mutate({ action: 'decline' })}
            />
          </>
        ) : null}
        {job?.status === 'accepted' ? (
          <AppButton title="En route" loading={run.isPending} onPress={() => run.mutate({ action: 'en-route' })} />
        ) : null}
        {job?.status === 'en_route' ? (
          <AppButton title="Arrived" loading={run.isPending} onPress={() => run.mutate({ action: 'arrive' })} />
        ) : null}
        {job?.status === 'arrived' || job?.status === 'inspected' ? (
          <View style={styles.form}>
            <Field
              label="Actual weight (kg)"
              value={weight || job?.actualWeight || request?.weight || ''}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
            <Field
              label="Pieces"
              value={pieces}
              onChangeText={setPieces}
              keyboardType="number-pad"
            />
            <Field
              label="Contents"
              value={contents || job?.actualContents || request?.contentDescription || ''}
              onChangeText={setContents}
            />
            <Field label="Inspection notes" value={notes} onChangeText={setNotes} />
            <AppButton
              title="Save inspection"
              loading={run.isPending}
              onPress={() =>
                run.mutate({
                  action: 'inspect',
                  body: {
                    actualWeight: weight || job?.actualWeight || request?.weight || '1',
                    actualPieces: Number(pieces) || 1,
                    actualContents: contents || request?.contentDescription,
                    inspectionNotes: notes,
                  },
                })
              }
            />
          </View>
        ) : null}
        {job?.status === 'inspected' ? (
          <View style={styles.form}>
            <Field
              label="Quote total (optional)"
              value={quoteTotal}
              onChangeText={setQuoteTotal}
              keyboardType="decimal-pad"
              placeholder="Uses tariff if left blank"
            />
            <AppButton
              title="Send quote"
              loading={run.isPending}
              onPress={() =>
                run.mutate({
                  action: 'quote',
                  body: quoteTotal ? { totalAmount: quoteTotal } : {},
                })
              }
            />
          </View>
        ) : null}
        {job?.status === 'quote_sent' ? (
          <Text style={[styles.wait, { color: colors.textMuted }]}>
            Quote {job.quotation?.quotationNumber} sent (₹{job.quotation?.totalAmount}). Waiting for the store to accept before packing.
          </Text>
        ) : null}
        {job?.status === 'quote_accepted' ? (
          <AppButton title="Mark packed" loading={run.isPending} onPress={() => run.mutate({ action: 'pack' })} />
        ) : null}
        {job?.status === 'packed' ? (
          <>
            <Text style={[styles.wait, { color: colors.textMuted }]}>
              Pack the parcel, then bring it to the XGoo store. The shipment is raised after it arrives.
            </Text>
            <AppButton
              title="Arrived at XGoo store"
              loading={run.isPending}
              onPress={() => run.mutate({ action: 'hub' })}
            />
          </>
        ) : null}
        {job?.status === 'at_hub' || job?.status === 'awb_created' || (job?.status === 'packed' && job.shipment) ? (
          <View style={styles.form}>
            <Field label="AWB number" value={awb || job.awbNumber || ''} onChangeText={setAwb} />
            <AppButton
              title="Save AWB"
              loading={run.isPending}
              onPress={() => run.mutate({ action: 'awb', body: { awbNumber: awb || job.awbNumber } })}
            />
          </View>
        ) : null}
        {job?.status === 'awb_created' ? (
          <AppButton title="Complete pickup" loading={run.isPending} onPress={() => run.mutate({ action: 'complete' })} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { width: 42, height: 42, justifyContent: 'center', marginLeft: -8, marginBottom: 12 },
  kicker: { fontSize: 12, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '900', marginTop: 6 },
  meta: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  phone: { fontSize: 15, fontWeight: '700', marginVertical: 12 },
  actions: { gap: 12, marginTop: 16 },
  form: { gap: 12 },
  wait: { fontSize: 14, lineHeight: 20 },
  toBox: { marginTop: 12, gap: 4 },
  storeVisit: { gap: 10, marginTop: 16 },
  parcelRow: { borderWidth: 1, padding: 12, gap: 4 },
  parcelTitle: { fontSize: 14, fontWeight: '700' },
  parcelMeta: { fontSize: 12 },
});
