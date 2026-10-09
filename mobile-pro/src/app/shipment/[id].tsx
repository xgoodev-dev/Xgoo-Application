import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { BackButton, Card, Screen } from '@/components/ui';
import { proApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function ShipmentDetailScreen() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const query = useQuery({
    queryKey: ['pro-booking', token, params.id],
    enabled: Boolean(token && params.id),
    queryFn: () => proApi.booking(token!, String(params.id)),
  });
  const request = query.data?.request;
  const tracking = query.data?.tracking as { overallStatusLabel?: string } | undefined;

  return (
    <Screen>
      <BackButton fallback="/(tabs)/shipments" />
      <Text style={[styles.title, { color: colors.text }]}>
        {tracking?.overallStatusLabel || request?.status || 'Shipment'}
      </Text>
      <Card style={styles.card}>
        <Text style={[styles.meta, { color: colors.textMuted }]}>{request?.requestNumber}</Text>
        <Text style={[styles.body, { color: colors.text }]}>{request?.receiverName}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {request?.receiverCity || ''} {request?.xgooOrderId ? `· ${request.xgooOrderId}` : ''}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', marginBottom: 14 },
  card: { gap: 6 },
  body: { fontSize: 18, fontWeight: '700' },
  meta: { fontSize: 13 },
});
