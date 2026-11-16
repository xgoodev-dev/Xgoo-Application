import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import type { PickupPartnerStats } from '@/lib/api';
import { rupees } from '@/lib/fuel-math';
import { useAppTheme } from '@/lib/theme';

export function ProgressCard({
  stats,
  compact = false,
}: {
  stats?: PickupPartnerStats;
  compact?: boolean;
}) {
  const { colors } = useAppTheme();
  if (!stats) return null;

  return (
    <Card style={[styles.card, compact && styles.compact]}>
      <View style={styles.stats}>
        <Stat label="Pickups" value={String(stats.today.pickupsCompleted)} colors={colors} />
        <Stat label="Km" value={stats.today.distanceKm.toFixed(1)} colors={colors} />
        <Stat label="Fuel" value={`${stats.today.fuelLitres.toFixed(1)} L`} colors={colors} />
        <Stat label="Cost" value={rupees(stats.today.fuelCost)} colors={colors} />
      </View>
    </Card>
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
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12, marginBottom: 16 },
  compact: { paddingVertical: 12, marginBottom: 18 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, gap: 2 },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '800' },
});
