import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronDown, Navigation, Phone, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBadge } from '@/components/job-list';
import { RouteMap, type LiveRouteInfo } from '@/components/route-map';
import { AppButton, Field } from '@/components/ui';
import { pickupApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ARRIVAL_RADIUS_M, coordsFrom, distanceMeters, watchCoords } from '@/lib/maps';
import { notifyLocal } from '@/lib/notifications';
import { useAppTheme } from '@/lib/theme';

const INSPECT_STATUSES = new Set(['arrived', 'inspected']);

export default function JobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [weight, setWeight] = useState('');
  const [pieces, setPieces] = useState('1');
  const [contents, setContents] = useState('');
  const [notes, setNotes] = useState('');
  const [awb, setAwb] = useState('');
  const [quoteTotal, setQuoteTotal] = useState('');
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [follow, setFollow] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [liveRoute, setLiveRoute] = useState<LiveRouteInfo>({});
  const autoArrived = useRef(false);
  const filled = useRef(false);

  const jobQuery = useQuery({
    queryKey: ['pickup-job', id, token],
    enabled: Boolean(token && id),
    queryFn: () => pickupApi.job(token!, String(id)),
    refetchInterval: 10_000,
  });

  const job = jobQuery.data;
  const request = job?.request;
  const moving = job?.status === 'en_route' || follow;

  useEffect(() => {
    autoArrived.current = false;
    filled.current = false;
    setInspectOpen(false);
    setLiveRoute({});
  }, [id]);

  useEffect(() => {
    if (job?.status === 'en_route') setFollow(true);
    if (job && INSPECT_STATUSES.has(job.status)) setInspectOpen(true);
  }, [job?.status]);

  useEffect(() => {
    let stop: (() => void) | undefined;
    void watchCoords(setOrigin, { follow: moving }).then((unsub) => {
      stop = unsub;
    });
    return () => stop?.();
  }, [moving]);

  const originBucket = origin
    ? `${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}`
    : 'none';
  const routeQuery = useQuery({
    queryKey: ['pickup-job-route', id, token, originBucket],
    enabled: Boolean(token && id),
    queryFn: () => pickupApi.jobRoute(token!, String(id), origin || undefined),
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

  const storeVisit = job?.storeVisit;
  const storeParcels = storeVisit?.parcels || [];
  const inspectedReady = storeParcels.filter((parcel) =>
    ['inspected', 'quote_sent'].includes(parcel.status),
  ).length;
  const waitingAccept = storeParcels.filter((parcel) => parcel.status === 'quote_sent').length;
  const destination = coordsFrom({ lat: request?.pickupLat, lng: request?.pickupLng }) || routeQuery.data?.destination;
  const route = routeQuery.data;
  const routeLabel = [liveRoute.distanceText || route?.distanceText, liveRoute.durationText || route?.durationText]
    .filter(Boolean)
    .join(' · ');
  const canInspect = Boolean(job && INSPECT_STATUSES.has(job.status));
  const metersAway =
    origin && destination ? Math.round(distanceMeters(origin, destination)) : null;

  useEffect(() => {
    if (!job || filled.current) return;
    filled.current = true;
    setWeight(job.actualWeight || request?.weight || '');
    setPieces(String(job.actualPieces || request?.numberOfPieces || 1));
    setContents(job.actualContents || request?.contentDescription || '');
    setNotes(job.inspectionNotes || '');
    setAwb(job.awbNumber || '');
  }, [job, request]);

  function markArrived(source: 'auto' | 'manual') {
    if (!job || job.status !== 'en_route' || run.isPending) return;
    run.mutate(
      { action: 'arrive' },
      {
        onSuccess: () => {
          setFollow(false);
          setInspectOpen(true);
          if (source === 'auto') {
            void notifyLocal("You've arrived", 'Tap the current order to inspect the package.');
            Alert.alert("You've arrived", 'Tap the current order to update the package details.', [
              { text: 'Inspect now', onPress: () => setInspectOpen(true) },
            ]);
          }
        },
      },
    );
  }

  useEffect(() => {
    if (!origin || !destination || job?.status !== 'en_route') return;
    if (autoArrived.current) return;
    if (distanceMeters(origin, destination) > ARRIVAL_RADIUS_M) return;
    autoArrived.current = true;
    markArrived('auto');
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, job?.status]);

  function startInAppRoute() {
    setFollow(true);
    if (job?.status === 'accepted') run.mutate({ action: 'en-route' });
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.mapPane, inspectOpen && styles.mapPaneCompact]}>
        <RouteMap
          origin={origin || route?.origin}
          destination={destination}
          destinationLabel={request?.pickupLocationName || request?.senderName || 'Pickup'}
          points={route?.points}
          follow={follow}
          onRouteInfo={setLiveRoute}
        />
        <Pressable
          onPress={() => router.back()}
          style={[styles.close, { top: insets.top + 8, backgroundColor: colors.surface }]}
        >
          <X size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(16, insets.bottom) }]}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
          <Pressable
            disabled={!canInspect}
            onPress={() => setInspectOpen((open) => !open)}
            style={styles.orderRow}
          >
            <View style={[styles.box, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.boxMark, { color: colors.accent }]}>#</Text>
            </View>
            <View style={styles.orderCopy}>
              <Text style={[styles.orderId, { color: colors.text }]}>{request?.requestNumber || 'Pickup'}</Text>
              <Text style={[styles.orderSub, { color: colors.textMuted }]} numberOfLines={1}>
                {canInspect
                  ? inspectOpen
                    ? 'Update the package details below'
                    : 'Tap to inspect this pickup'
                  : request?.pickupLocationName || request?.senderAddress || 'Doorstep collection'}
              </Text>
            </View>
            {job?.status ? <StatusBadge status={job.status} /> : null}
            {canInspect ? <ChevronDown size={16} color={colors.textMuted} /> : null}
          </Pressable>

          {canInspect && inspectOpen ? (
            <View style={styles.form}>
              <Text style={[styles.inspectTitle, { color: colors.text }]}>Package inspection</Text>
              <Field
                label="Actual weight (kg)"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
              <Field label="Pieces" value={pieces} onChangeText={setPieces} keyboardType="number-pad" />
              <Field label="Contents" value={contents} onChangeText={setContents} />
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

          <View style={styles.trip}>
            <View style={styles.tripCol}>
              <Text style={[styles.tripLabel, { color: colors.textMuted }]}>Collect from</Text>
              <Text style={[styles.tripName, { color: colors.text }]}>{request?.senderName || 'Customer'}</Text>
              <Text style={[styles.tripMeta, { color: colors.textMuted }]} numberOfLines={2}>
                {request?.senderCity || request?.senderAddress || 'Pickup point'}
              </Text>
            </View>
            <View style={[styles.tripLine, { backgroundColor: colors.accent }]} />
            <View style={styles.tripCol}>
              <Text style={[styles.tripLabel, { color: colors.textMuted }]}>Moving to</Text>
              <Text style={[styles.tripName, { color: colors.text }]}>{request?.receiverName || 'Destination'}</Text>
              <Text style={[styles.tripMeta, { color: colors.textMuted }]} numberOfLines={2}>
                {request?.receiverCity || request?.receiverPincode || 'Hub'}
              </Text>
            </View>
          </View>

          {routeLabel ? <Text style={[styles.eta, { color: colors.accent }]}>{routeLabel}</Text> : null}
          {job?.status === 'en_route' && metersAway != null ? (
            <Text style={[styles.eta, { color: colors.textMuted }]}>
              {metersAway <= ARRIVAL_RADIUS_M ? 'At the pickup point' : `${metersAway} m to the door`}
            </Text>
          ) : null}

          <View style={styles.actions}>
            {destination && (job?.status === 'accepted' || job?.status === 'assigned' || job?.status === 'en_route') ? (
              <AppButton
                title={follow ? 'Following live route' : 'Start route'}
                icon={Navigation}
                onPress={startInAppRoute}
              />
            ) : null}
            {request?.senderPhone ? (
              <View style={styles.phoneRow}>
                <Phone size={14} color={colors.accent} />
                <Text style={[styles.phone, { color: colors.text }]}>{request.senderPhone}</Text>
              </View>
            ) : null}

            {storeVisit?.isBusinessStore && storeParcels.length > 1 ? (
              <View style={styles.storeVisit}>
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
                      {parcel.receiverCity || 'Route pending'} · {parcel.status.replace(/_/g, ' ')}
                    </Text>
                  </Pressable>
                ))}
                {inspectedReady > 0 ? (
                  <AppButton
                    title={inspectedReady === 1 ? 'Send final quotation' : `Send ${inspectedReady} quotations`}
                    loading={run.isPending}
                    onPress={() => run.mutate({ action: 'quote-store' })}
                  />
                ) : null}
                {waitingAccept > 0 ? (
                  <Text style={[styles.wait, { color: colors.textMuted }]}>
                    Waiting for the store to accept {waitingAccept} quotation{waitingAccept === 1 ? '' : 's'}.
                  </Text>
                ) : null}
              </View>
            ) : null}

            {job?.status === 'assigned' ? (
              <>
                <AppButton title="Accept pickup" loading={run.isPending} onPress={() => run.mutate({ action: 'accept' })} />
                <AppButton title="Decline" variant="secondary" loading={run.isPending} onPress={() => run.mutate({ action: 'decline' })} />
              </>
            ) : null}
            {job?.status === 'accepted' ? (
              <AppButton
                title="I'm on the way"
                loading={run.isPending}
                onPress={() => {
                  setFollow(true);
                  run.mutate({ action: 'en-route' });
                }}
              />
            ) : null}
            {job?.status === 'en_route' ? (
              <AppButton title="I've arrived" loading={run.isPending} onPress={() => markArrived('manual')} />
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
                  onPress={() => run.mutate({ action: 'quote', body: quoteTotal ? { totalAmount: quoteTotal } : {} })}
                />
              </View>
            ) : null}
            {job?.status === 'quote_sent' ? (
              <Text style={[styles.wait, { color: colors.textMuted }]}>
                Quote {job.quotation?.quotationNumber} sent (₹{job.quotation?.totalAmount}). Waiting for the store to accept.
              </Text>
            ) : null}
            {job?.status === 'quote_accepted' ? (
              <AppButton title="Mark packed" loading={run.isPending} onPress={() => run.mutate({ action: 'pack' })} />
            ) : null}
            {job?.status === 'packed' ? (
              <AppButton title="Arrived at XGoo store" loading={run.isPending} onPress={() => run.mutate({ action: 'hub' })} />
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
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mapPane: { flex: 1.15, minHeight: 260 },
  mapPaneCompact: { flex: 0.72, minHeight: 200 },
  close: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sheet: {
    flex: 1,
    marginTop: -22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E4E4E7',
    marginTop: 10,
    marginBottom: 6,
  },
  sheetBody: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  box: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  boxMark: { fontSize: 18, fontWeight: '800' },
  orderCopy: { flex: 1, gap: 2 },
  orderId: { fontSize: 16, fontWeight: '800' },
  orderSub: { fontSize: 12 },
  inspectTitle: { fontSize: 15, fontWeight: '800' },
  trip: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tripCol: { flex: 1, gap: 2 },
  tripLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  tripName: { fontSize: 15, fontWeight: '700' },
  tripMeta: { fontSize: 12, lineHeight: 16 },
  tripLine: { width: 28, height: 2, borderRadius: 999 },
  eta: { fontSize: 13, fontWeight: '800' },
  actions: { gap: 12 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phone: { fontSize: 15, fontWeight: '700' },
  form: { gap: 12 },
  wait: { fontSize: 13, lineHeight: 19 },
  storeVisit: { gap: 8 },
  parcelRow: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 4 },
  parcelTitle: { fontSize: 14, fontWeight: '700' },
  parcelMeta: { fontSize: 12 },
});
