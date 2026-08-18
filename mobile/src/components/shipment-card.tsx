import { ArrowRight, Box, ChevronRight, MapPin, Truck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import type { CustomerBooking } from '@/lib/api';
import { useAppTheme } from '@/lib/theme';

export function progressForStatus(status: string) {
  const key = status.toLowerCase().replace(/-/g, '_');
  if (key === 'delivered') return 100;
  if (key === 'out_for_delivery') return 86;
  if (key === 'in_transit') return 68;
  if (key === 'picked_up' || key === 'converted') return 44;
  if (key === 'approved' || key === 'booked') return 28;
  if (key === 'rejected' || key === 'cancelled') return 0;
  return 12;
}

export function statusLabel(status: string) {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function ShipmentCard({
  booking,
  onPress,
  compact = false,
}: {
  booking: CustomerBooking;
  onPress: () => void;
  compact?: boolean;
}) {
  const { colors } = useAppTheme();
  const progress = booking.tracking?.progress ?? progressForStatus(booking.status);
  const from = booking.senderCity || booking.pickupLocationName || 'Pickup';
  const to = booking.receiverCity || 'Destination';

  return (
    <Card onPress={onPress} style={compact ? styles.compact : undefined}>
      <View style={styles.top}>
        <View style={styles.numberWrap}>
          <View style={[styles.boxIcon, { backgroundColor: colors.accentSoft }]}>
            <Box size={17} color={colors.accent} />
          </View>
          <View>
            <Text style={[styles.number, { color: colors.text }]}>#{booking.requestNumber}</Text>
            <Text style={[styles.date, { color: colors.textMuted }]}>
              {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
              })}
            </Text>
          </View>
        </View>
        <View style={[styles.status, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.statusText, { color: colors.accent }]}>
            {booking.tracking?.overallStatusLabel || statusLabel(booking.status)}
          </Text>
        </View>
      </View>

      <View style={styles.route}>
        <View style={[styles.lineBase, { backgroundColor: colors.border }]} />
        <View
          style={[
            styles.lineProgress,
            { backgroundColor: colors.accent, width: `${Math.max(3, progress)}%` },
          ]}
        />
        <View style={[styles.routePoint, styles.routeStart, { borderColor: colors.accent }]} />
        <View style={[styles.routePoint, styles.routeEnd, { borderColor: colors.success }]} />
        <View
          style={[
            styles.truck,
            { backgroundColor: colors.accent, left: `${Math.min(94, Math.max(4, progress))}%` },
          ]}
        >
          <Truck size={11} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.cities}>
        <View style={styles.city}>
          <MapPin size={12} color={colors.textMuted} />
          <Text numberOfLines={1} style={[styles.cityText, { color: colors.text }]}>
            {from}
          </Text>
        </View>
        <ArrowRight size={14} color={colors.textMuted} />
        <View style={[styles.city, styles.cityRight]}>
          <Text numberOfLines={1} style={[styles.cityText, { color: colors.text }]}>
            {to}
          </Text>
          <ChevronRight size={14} color={colors.textMuted} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  compact: { padding: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  numberWrap: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  boxIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  number: { fontSize: 13, fontWeight: '800' },
  date: { fontSize: 10, marginTop: 2 },
  status: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, maxWidth: '45%' },
  statusText: { fontSize: 10, fontWeight: '700' },
  route: { height: 28, marginTop: 13, marginHorizontal: 4, justifyContent: 'center' },
  lineBase: { position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 3 },
  lineProgress: { position: 'absolute', left: 0, height: 3, borderRadius: 3 },
  routePoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2.5,
    backgroundColor: '#FFFFFF',
  },
  routeStart: { left: -2 },
  routeEnd: { right: -2 },
  truck: {
    position: 'absolute',
    width: 23,
    height: 23,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -11,
  },
  cities: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  city: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  cityRight: { justifyContent: 'flex-end' },
  cityText: { fontSize: 11, fontWeight: '600', maxWidth: '80%' },
});

