import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Box,
  Check,
  Clock3,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  Truck,
} from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Screen } from '@/components/ui';
import { progressForStatus, statusLabel } from '@/components/shipment-card';
import { customerApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

type TrackingEvent = {
  key?: string;
  label?: string;
  description?: string;
  location?: string | null;
  timestamp?: string | null;
  completed?: boolean;
  current?: boolean;
  state?: 'completed' | 'current' | 'upcoming';
};

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const detail = useQuery({
    queryKey: ['customer-booking', id, token],
    queryFn: () => customerApi.booking(token!, id!),
    enabled: !!token && !!id,
    refetchInterval: 15_000,
  });

  if (detail.isLoading || !detail.data) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const { request, tracking } = detail.data;
  const track = tracking as {
    overallStatusLabel?: string;
    currentLocation?: string | null;
    events?: TrackingEvent[];
    timeline?: TrackingEvent[];
    steps?: TrackingEvent[];
  };
  const progress = progressForStatus(request.status);
  const events =
    track.steps?.map((event) => ({
      ...event,
      completed: event.state === 'completed',
      current: event.state === 'current',
    })) ||
    track.events ||
    track.timeline || [
      { label: 'Booking requested', completed: true, timestamp: request.createdAt },
      { label: 'Pickup confirmed', completed: progress >= 25 },
      { label: 'Parcel picked up', completed: progress >= 45 },
      { label: 'In transit', completed: progress >= 68, current: progress >= 45 && progress < 100 },
      { label: 'Delivered', completed: progress === 100 },
    ];

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/(tabs)')
          }
          style={styles.back}
        >
          <ArrowLeft size={21} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Shipment tracking</Text>
          <Text style={[styles.headerMeta, { color: colors.textMuted }]}>
            #{request.requestNumber}
          </Text>
        </View>
      </View>

      <Card style={[styles.statusCard, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
        <View>
          <Text style={styles.statusEyebrow}>CURRENT STATUS</Text>
          <Text style={styles.statusTitle}>
            {track.overallStatusLabel || statusLabel(request.status)}
          </Text>
          <Text style={styles.statusLocation}>
            {track.currentLocation || request.senderCity || 'Movement update pending'}
          </Text>
        </View>
        <View style={styles.statusIcon}>
          <Truck size={31} color={colors.accent} />
        </View>
      </Card>

      <Card style={styles.routeCard}>
        <View style={styles.routeTop}>
          <View style={styles.routeCity}>
            <MapPin size={15} color={colors.accent} />
            <Text style={[styles.routeLabel, { color: colors.textMuted }]}>FROM</Text>
            <Text numberOfLines={1} style={[styles.routeValue, { color: colors.text }]}>
              {request.senderCity || 'Pickup'}
            </Text>
          </View>
          <Navigation size={20} color={colors.textMuted} />
          <View style={[styles.routeCity, styles.routeRight]}>
            <MapPin size={15} color={colors.success} />
            <Text style={[styles.routeLabel, { color: colors.textMuted }]}>TO</Text>
            <Text numberOfLines={1} style={[styles.routeValue, { color: colors.text }]}>
              {request.receiverCity || 'Destination'}
            </Text>
          </View>
        </View>
        <View style={[styles.progressBase, { backgroundColor: colors.border }]}>
          <View
            style={[styles.progressFill, { backgroundColor: colors.accent, width: `${progress}%` }]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textMuted }]}>{progress}% complete</Text>
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Movement timeline</Text>
      <Card style={styles.timeline}>
        {events.map((event, index) => {
          const done = !!event.completed || index === 0;
          const current = !!event.current;
          return (
            <View key={event.key || `${event.label}-${index}`} style={styles.event}>
              <View style={styles.eventRail}>
                <View
                  style={[
                    styles.eventDot,
                    {
                      backgroundColor: done || current ? colors.accent : colors.surfaceMuted,
                      borderColor: done || current ? colors.accent : colors.border,
                    },
                  ]}
                >
                  {done ? <Check size={11} color="#FFFFFF" /> : <Clock3 size={10} color={colors.textMuted} />}
                </View>
                {index < events.length - 1 ? (
                  <View
                    style={[
                      styles.eventLine,
                      { backgroundColor: done ? colors.accent : colors.border },
                    ]}
                  />
                ) : null}
              </View>
              <View style={styles.eventCopy}>
                <Text
                  style={[
                    styles.eventTitle,
                    { color: done || current ? colors.text : colors.textMuted },
                  ]}
                >
                  {event.label || event.description || 'Shipment update'}
                </Text>
                {event.description && event.label ? (
                  <Text style={[styles.eventDescription, { color: colors.textMuted }]}>
                    {event.description}
                  </Text>
                ) : null}
                {event.location ? (
                  <Text style={[styles.eventLocation, { color: colors.textMuted }]}>
                    {event.location}
                  </Text>
                ) : null}
                {event.timestamp ? (
                  <Text style={[styles.eventTime, { color: colors.textMuted }]}>
                    {new Date(event.timestamp).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Parcel details</Text>
      <Card style={styles.details}>
        <DetailRow icon={Box} label="Contents" value={request.contentDescription} />
        <DetailRow icon={PackageCheck} label="Package" value={`${request.weight} kg · ${request.numberOfPieces} piece(s)`} />
        <DetailRow icon={Phone} label="Receiver" value={`${request.receiverName} · ${request.receiverPhone}`} />
        <DetailRow icon={MapPin} label="Delivery" value={request.receiverAddress} />
      </Card>
    </Screen>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Box;
  label: string;
  value: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Icon size={17} color={colors.accent} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  back: { width: 42, height: 42, justifyContent: 'center' },
  headerCopy: { flex: 1 },
  headerTitle: { fontSize: 21, fontWeight: '800' },
  headerMeta: { fontSize: 11, marginTop: 2 },
  statusCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusEyebrow: { color: '#FFD7C7', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  statusTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginTop: 7 },
  statusLocation: { color: '#FFE3D7', fontSize: 11, marginTop: 4 },
  statusIcon: { width: 62, height: 62, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  routeCard: { marginTop: 12 },
  routeTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeCity: { flex: 1 },
  routeRight: { alignItems: 'flex-end' },
  routeLabel: { fontSize: 8, fontWeight: '800', marginTop: 4 },
  routeValue: { fontSize: 13, fontWeight: '700', marginTop: 2, maxWidth: '95%' },
  progressBase: { height: 5, borderRadius: 4, marginTop: 17, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 4 },
  progressText: { fontSize: 9, marginTop: 6, textAlign: 'right' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 24, marginBottom: 10 },
  timeline: { paddingBottom: 5 },
  event: { minHeight: 66, flexDirection: 'row', gap: 12 },
  eventRail: { width: 24, alignItems: 'center' },
  eventDot: { width: 24, height: 24, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eventLine: { flex: 1, width: 2 },
  eventCopy: { flex: 1, paddingBottom: 16 },
  eventTitle: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  eventDescription: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  eventLocation: { fontSize: 10, fontWeight: '600', marginTop: 3 },
  eventTime: { fontSize: 9, marginTop: 4 },
  details: { gap: 15 },
  detailRow: { flexDirection: 'row', gap: 11, alignItems: 'center' },
  detailIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  detailValue: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});

