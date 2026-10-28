import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  Box,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  MapPin,
  PackageCheck,
  Phone,
  Truck,
} from 'lucide-react-native';
import { useState } from 'react';
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

type JourneyState = 'completed' | 'current' | 'upcoming';

type JourneyStage = {
  key: string;
  label: string;
  state: JourneyState;
};

const STATUS_HEADLINE: Record<string, string> = {
  pending: 'Waiting for the office to confirm',
  reviewed: 'The office is reviewing this booking',
  approved: 'Pickup will be scheduled',
  converted: 'Shipment is being prepared',
  booked: 'Awaiting courier pickup',
  picked_up: 'Collected and on the move',
  in_transit: 'On the way to the destination',
  out_for_delivery: 'Out for delivery',
  delivered: 'Parcel has been delivered',
  rejected: 'This request was not approved',
  cancelled: 'This shipment was cancelled',
};

function statusKey(status: string) {
  return status.toLowerCase().replace(/-/g, '_');
}

function shortPlace(value?: string | null, fallback = '') {
  if (!value) return fallback;
  const first = value.split(',')[0]?.trim() || value.trim();
  return first.length > 22 ? `${first.slice(0, 20)}…` : first;
}

function formatStamp(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusIcon(status: string) {
  const key = statusKey(status);
  switch (key) {
    case 'delivered':
      return PackageCheck;
    case 'rejected':
    case 'cancelled':
      return AlertCircle;
    case 'in_transit':
    case 'out_for_delivery':
    case 'picked_up':
      return Truck;
    case 'approved':
    case 'converted':
    case 'booked':
      return PackageCheck;
    case 'pending':
    case 'reviewed':
      return Clock3;
    default:
      return Box;
  }
}

function heroColors(status: string): [string, string] {
  const key = statusKey(status);
  if (key === 'delivered') return ['#16A34A', '#15803D'];
  if (key === 'rejected' || key === 'cancelled') return ['#DC2626', '#B91C1C'];
  return ['#FF4907', '#C73604'];
}

function buildJourney(status: string): JourneyStage[] {
  const key = statusKey(status);
  if (key === 'rejected' || key === 'cancelled') {
    return [
      { key: 'booked', label: 'Booked', state: 'completed' },
      { key: 'closed', label: key === 'rejected' ? 'Rejected' : 'Cancelled', state: 'current' },
    ];
  }

  const stages = [
    { key: 'booked', label: 'Booked' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'moving', label: 'Moving' },
    { key: 'delivered', label: 'Delivered' },
  ];

  let current = 0;
  switch (key) {
    case 'pending':
    case 'reviewed':
      current = 1;
      break;
    case 'approved':
    case 'converted':
    case 'booked':
      current = 1;
      break;
    case 'picked_up':
    case 'in_transit':
    case 'out_for_delivery':
      current = 2;
      break;
    case 'delivered':
      current = 3;
      break;
    default:
      current = 0;
  }

  return stages.map((stage, index) => ({
    ...stage,
    state: index < current ? 'completed' : index === current ? 'current' : 'upcoming',
  }));
}

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const [showAddresses, setShowAddresses] = useState(false);
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
    overallStatus?: string;
    overallStatusLabel?: string;
    currentLocation?: string | null;
    currentStatusDetail?: string | null;
    isDelivered?: boolean;
    isRejected?: boolean;
    events?: TrackingEvent[];
    timeline?: TrackingEvent[];
    steps?: TrackingEvent[];
  };
  const status = track.overallStatus || request.status;
  const label = track.overallStatusLabel || statusLabel(request.status);
  const progress = progressForStatus(request.status);
  const headline = STATUS_HEADLINE[statusKey(status)] || track.currentStatusDetail || 'Movement update pending';
  const fromCity = shortPlace(request.senderCity, 'Pickup');
  const toCity = shortPlace(request.receiverCity, 'Destination');
  const Icon = statusIcon(status);
  const [heroFrom, heroTo] = heroColors(status);
  const journey = buildJourney(status);

  const events =
    track.steps?.map((event) => ({
      ...event,
      completed: event.state === 'completed',
      current: event.state === 'current',
    })) ||
    track.events ||
    track.timeline ||
    [];
  const completedEvents = events.filter((event) => event.completed || event.state === 'completed');
  const nowEvent =
    events.find((event) => event.current || event.state === 'current') ||
    completedEvents[completedEvents.length - 1];

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.back}
        >
          <ArrowLeft size={21} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Track</Text>
          <Text style={[styles.headerMeta, { color: colors.textMuted }]}>#{request.requestNumber}</Text>
        </View>
      </View>

      <LinearGradient colors={[heroFrom, heroTo]} style={styles.hero}>
        <View style={styles.heroIconWrap}>
          <Icon size={28} color="#FFFFFF" />
        </View>
        <RouteScene progress={progress} from={fromCity} to={toCity} />
        <Text style={styles.heroStatus}>{label}</Text>
        <Text style={styles.heroHeadline}>{headline}</Text>
      </LinearGradient>

      <View style={styles.journeyWrap}>
        {journey.map((stage, index) => (
          <View key={stage.key} style={styles.journeyItem}>
            <View style={styles.journeyRail}>
              <View
                style={[
                  styles.journeyDot,
                  stage.state === 'completed' && { backgroundColor: colors.accent },
                  stage.state === 'current' && {
                    backgroundColor: colors.accentSoft,
                    borderColor: colors.accent,
                    borderWidth: 2,
                  },
                  stage.state === 'upcoming' && {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                {stage.state === 'completed' ? (
                  <Check size={12} color="#FFFFFF" />
                ) : stage.state === 'current' ? (
                  <View style={[styles.journeyPulse, { backgroundColor: colors.accent }]} />
                ) : null}
              </View>
              {index < journey.length - 1 ? (
                <View
                  style={[
                    styles.journeyLine,
                    {
                      backgroundColor:
                        stage.state === 'completed' ? colors.accent : colors.border,
                    },
                  ]}
                />
              ) : null}
            </View>
            <Text
              style={[
                styles.journeyLabel,
                {
                  color:
                    stage.state === 'upcoming'
                      ? colors.textMuted
                      : stage.state === 'current'
                        ? colors.accent
                        : colors.text,
                },
              ]}
            >
              {stage.label}
            </Text>
          </View>
        ))}
      </View>

      {nowEvent ? (
        <Card style={styles.nowCard}>
          <Text style={[styles.nowEyebrow, { color: colors.accent }]}>NOW</Text>
          <Text style={[styles.nowTitle, { color: colors.text }]}>
            {nowEvent.label || 'Latest update'}
          </Text>
          {nowEvent.description ? (
            <Text numberOfLines={2} style={[styles.nowCopy, { color: colors.textMuted }]}>
              {nowEvent.description}
            </Text>
          ) : null}
          {formatStamp(nowEvent.timestamp) ? (
            <Text style={[styles.nowTime, { color: colors.textMuted }]}>
              {formatStamp(nowEvent.timestamp)}
            </Text>
          ) : null}
        </Card>
      ) : null}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Parcel</Text>
      <Card style={styles.parcelCard}>
        <View style={styles.parcelStats}>
          <View style={[styles.parcelStat, { backgroundColor: colors.surfaceMuted }]}>
            <Box size={16} color={colors.accent} />
            <Text numberOfLines={1} style={[styles.parcelStatValue, { color: colors.text }]}>
              {request.contentDescription || 'Parcel'}
            </Text>
            <Text style={[styles.parcelStatLabel, { color: colors.textMuted }]}>Contents</Text>
          </View>
          <View style={[styles.parcelStat, { backgroundColor: colors.surfaceMuted }]}>
            <PackageCheck size={16} color={colors.accent} />
            <Text numberOfLines={1} style={[styles.parcelStatValue, { color: colors.text }]}>
              {request.weight} kg · {request.numberOfPieces} pc
            </Text>
            <Text style={[styles.parcelStatLabel, { color: colors.textMuted }]}>Package</Text>
          </View>
        </View>
        <View style={styles.receiverRow}>
          <Phone size={15} color={colors.accent} />
          <Text style={[styles.receiverText, { color: colors.text }]}>
            {request.receiverName}
          </Text>
        </View>
        <Pressable
          onPress={() => setShowAddresses((open) => !open)}
          style={styles.addressToggle}
        >
          <MapPin size={14} color={colors.textMuted} />
          <Text style={[styles.addressToggleText, { color: colors.textMuted }]}>
            {showAddresses ? 'Hide addresses' : 'Pickup & delivery addresses'}
          </Text>
          {showAddresses ? (
            <ChevronUp size={16} color={colors.textMuted} />
          ) : (
            <ChevronDown size={16} color={colors.textMuted} />
          )}
        </Pressable>
        {showAddresses ? (
          <View style={styles.addressBlock}>
            <Text style={[styles.addressLabel, { color: colors.textMuted }]}>FROM</Text>
            <Text style={[styles.addressValue, { color: colors.text }]}>
              {request.pickupLocationName || request.senderAddress}
            </Text>
            <Text style={[styles.addressLabel, { color: colors.textMuted, marginTop: 12 }]}>TO</Text>
            <Text style={[styles.addressValue, { color: colors.text }]}>
              {request.receiverAddress}
            </Text>
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

function RouteScene({
  progress,
  from,
  to,
}: {
  progress: number;
  from: string;
  to: string;
}) {
  const truckLeft = Math.min(86, Math.max(6, progress));
  return (
    <View style={styles.scene}>
      <View style={styles.sceneTrack} />
      <View style={[styles.sceneFill, { width: `${Math.max(8, progress)}%` }]} />
      <View style={[styles.scenePin, styles.scenePinStart]}>
        <MapPin size={12} color="#FF4907" />
      </View>
      <View style={[styles.sceneTruck, { left: `${truckLeft}%` }]}>
        <Truck size={14} color="#FFFFFF" />
      </View>
      <View style={[styles.scenePin, styles.scenePinEnd]}>
        <MapPin size={12} color="#16A34A" />
      </View>
      <View style={styles.sceneCities}>
        <Text numberOfLines={1} style={styles.sceneCity}>
          {from}
        </Text>
        <Text numberOfLines={1} style={[styles.sceneCity, styles.sceneCityEnd]}>
          {to}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  back: { width: 42, height: 42, justifyContent: 'center' },
  headerCopy: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  headerMeta: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  hero: {
    borderRadius: 0,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroStatus: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 18,
  },
  heroHeadline: {
    color: '#FFE3D7',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    fontWeight: '600',
  },
  scene: { height: 72, justifyContent: 'center' },
  sceneTrack: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.28)',
    top: 18,
  },
  sceneFill: {
    position: 'absolute',
    left: 8,
    height: 3,
    backgroundColor: '#FFFFFF',
    top: 18,
  },
  scenePin: {
    position: 'absolute',
    top: 8,
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenePinStart: { left: 0 },
  scenePinEnd: { right: 0 },
  sceneTruck: {
    position: 'absolute',
    top: 6,
    width: 28,
    height: 28,
    marginLeft: -14,
    backgroundColor: '#161719',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sceneCities: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sceneCity: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sceneCityEnd: { textAlign: 'right' },
  journeyWrap: {
    flexDirection: 'row',
    marginTop: 22,
    marginBottom: 8,
  },
  journeyItem: { flex: 1, alignItems: 'center' },
  journeyRail: {
    width: '100%',
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyDot: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  journeyPulse: { width: 8, height: 8 },
  journeyLine: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    height: 2,
  },
  journeyLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  nowCard: { marginTop: 18, paddingVertical: 16 },
  nowEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  nowTitle: { fontSize: 18, fontWeight: '800', marginTop: 6, letterSpacing: -0.3 },
  nowCopy: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  nowTime: { fontSize: 11, marginTop: 8, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 26, marginBottom: 10 },
  parcelCard: { gap: 14 },
  parcelStats: { flexDirection: 'row', gap: 10 },
  parcelStat: { flex: 1, padding: 12, gap: 6 },
  parcelStatValue: { fontSize: 13, fontWeight: '800' },
  parcelStatLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  receiverRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  receiverText: { fontSize: 14, fontWeight: '700' },
  addressToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 2 },
  addressToggleText: { flex: 1, fontSize: 12, fontWeight: '600' },
  addressBlock: { paddingTop: 4 },
  addressLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  addressValue: { fontSize: 13, lineHeight: 18, marginTop: 4 },
});
