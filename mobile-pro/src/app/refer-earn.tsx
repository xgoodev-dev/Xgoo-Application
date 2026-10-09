import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Share, StyleSheet, Text } from 'react-native';
import { AppButton, BackButton, Card, Field, Screen } from '@/components/ui';
import { proApi } from '@/lib/api';
import { rupees } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { publicSiteUrl } from '@/lib/server';
import { useAppTheme } from '@/lib/theme';

export default function ReferEarnScreen() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const [bank, setBank] = useState({ bankAccountName: '', bankAccountNumber: '', bankIfsc: '' });
  const query = useQuery({
    queryKey: ['pro-referral', token],
    enabled: Boolean(token),
    queryFn: () => proApi.referral(token!),
  });
  const join = useMutation({
    mutationFn: () => proApi.joinReferral(token!),
    onSuccess: (data) => queryClient.setQueryData(['pro-referral', token], data),
  });
  const saveBank = useMutation({
    mutationFn: () => proApi.saveReferralBank(token!, bank),
    onSuccess: (data) => {
      queryClient.setQueryData(['pro-referral', token], data);
      Alert.alert('Bank details saved');
    },
    onError: (error) => Alert.alert('Could not save bank', error instanceof Error ? error.message : 'Try again.'),
  });
  const data = query.data;
  const shareLink = data?.partner ? publicSiteUrl(`/r/${data.partner.code}`) : publicSiteUrl('/refer');

  return (
    <Screen keyboard>
      <BackButton fallback="/(tabs)/profile" />
      <Text style={[styles.title, { color: colors.text }]}>Refer and earn</Text>
      <Text style={[styles.copy, { color: colors.textMuted }]}>
        You earn when someone you refer sends a courier and pays the quote.
      </Text>
      {data ? (
        <Card>
          <Text style={[styles.rate, { color: colors.text }]}>
            {data.program.commissionType === 'flat'
              ? `${rupees(data.program.commissionValue)} per paid courier`
              : `${data.program.commissionValue}% of the paid quote`}
          </Text>
        </Card>
      ) : null}
      {!data?.partner ? (
        <AppButton title="Join as a referral partner" loading={join.isPending} onPress={() => join.mutate()} />
      ) : (
        <>
          <Card>
            <Text style={[styles.meta, { color: colors.textMuted }]}>Your code {data.partner.code}</Text>
            <Text style={[styles.rate, { color: colors.text }]}>
              Pending {rupees(data.partner.totals.pending)} · Paid {rupees(data.partner.totals.paid)}
            </Text>
          </Card>
          <AppButton title="Share your link" onPress={() => void Share.share({ message: shareLink })} />
          <Field label="Account holder" value={bank.bankAccountName} onChangeText={(bankAccountName) => setBank((c) => ({ ...c, bankAccountName }))} />
          <Field label="Account number" keyboardType="number-pad" value={bank.bankAccountNumber} onChangeText={(bankAccountNumber) => setBank((c) => ({ ...c, bankAccountNumber }))} />
          <Field label="IFSC" autoCapitalize="characters" value={bank.bankIfsc} onChangeText={(bankIfsc) => setBank((c) => ({ ...c, bankIfsc: bankIfsc.toUpperCase() }))} />
          <AppButton title="Save bank details" variant="secondary" loading={saveBank.isPending} onPress={() => saveBank.mutate()} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800' },
  copy: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  rate: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 12, marginBottom: 6 },
});
