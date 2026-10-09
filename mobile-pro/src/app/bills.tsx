import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt } from 'lucide-react-native';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton, BackButton, Card, EmptyState, PageHeader, Pill, Screen } from '@/components/ui';
import { proApi } from '@/lib/api';
import { rupees, shortDate } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function BillsScreen() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['pro-bills', token],
    enabled: Boolean(token),
    queryFn: () => proApi.bills(token!),
  });
  const settle = useMutation({
    mutationFn: () => proApi.settleBills(token!, { paymentMode: 'upi' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['pro-bills', token] });
      Alert.alert('Marked as settling', 'Command will match this against your outstanding bills.');
    },
    onError: (error) => Alert.alert('Could not settle', error instanceof Error ? error.message : 'Try again.'),
  });

  return (
    <Screen>
      <BackButton fallback="/(tabs)/profile" />
      <PageHeader title="Bills" subtitle={query.data?.period.label || 'Accepted quotes for your store'} />
      <View style={styles.pills}>
        <Pill label={`Due ${rupees(query.data?.outstandingTotal)}`} active />
        <Pill label={`Paid ${rupees(query.data?.paidTotal)}`} />
      </View>
      {query.data?.bills.length ? (
        <View style={styles.list}>
          {query.data.bills.map((bill) => (
            <Card key={bill.id}>
              <Text style={[styles.name, { color: colors.text }]}>{bill.receiverName}</Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {bill.requestNumber} · {shortDate(bill.bookedAt)} · {bill.paymentStatus}
              </Text>
              <Text style={[styles.amount, { color: colors.text }]}>{rupees(bill.amount)}</Text>
            </Card>
          ))}
          {Number(query.data.outstandingTotal) > 0 ? (
            <AppButton title="Settle outstanding (UPI)" loading={settle.isPending} onPress={() => settle.mutate()} />
          ) : null}
        </View>
      ) : (
        <EmptyState icon={Receipt} title="No bills yet" description="Accepted quotes appear here." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  list: { gap: 10 },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 3 },
  amount: { fontSize: 18, fontWeight: '800', marginTop: 6 },
});
