import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ArrowLeft, Copy } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { AppButton, Card, Field, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { customerApi } from '@/lib/api';
import { useAppTheme } from '@/lib/theme';

function formatReferralRupees(value: string | number | null | undefined) {
  const amount = Number.parseFloat(String(value ?? '0'));
  if (!Number.isFinite(amount)) return '₹0';
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function ReferEarnScreen() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const [bank, setBank] = useState({
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfsc: '',
  });

  const query = useQuery({
    queryKey: ['customer-referral', token],
    enabled: Boolean(token),
    queryFn: () => customerApi.referral(token!),
  });
  const data = query.data;

  const join = useMutation({
    mutationFn: () => customerApi.joinReferral(token!),
    onSuccess: (next) => {
      queryClient.setQueryData(['customer-referral', token], next);
    },
    onError: (error) =>
      Alert.alert('Could not join', error instanceof Error ? error.message : 'Try again.'),
  });

  const saveBank = useMutation({
    mutationFn: () =>
      customerApi.saveReferralBank(token!, {
        bankAccountName: bank.bankAccountName.trim(),
        bankAccountNumber: bank.bankAccountNumber.trim(),
        bankIfsc: bank.bankIfsc.trim().toUpperCase(),
      }),
    onSuccess: (next) => {
      queryClient.setQueryData(['customer-referral', token], next);
      setBank({ bankAccountName: '', bankAccountNumber: '', bankIfsc: '' });
      Alert.alert('Bank details saved', 'Command will pay this account when your earnings are ready.');
    },
    onError: (error) =>
      Alert.alert('Bank details not saved', error instanceof Error ? error.message : 'Check the details.'),
  });

  const shareLink = data?.partner
    ? `https://www.xgoo.in/r/${data.partner.code}`
    : 'https://www.xgoo.in/refer';

  return (
    <Screen keyboard>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={21} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>Refer and earn</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            You earn when someone you refer sends a courier and pays the quote.
          </Text>
        </View>
      </View>

      {data ? (
        <Card>
          <Text style={[styles.rate, { color: colors.text }]}>
            {data.program.commissionType === 'flat'
              ? `${formatReferralRupees(data.program.commissionValue)} per paid courier`
              : `${data.program.commissionValue}% of the paid quote`}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            Minimum payout {formatReferralRupees(data.program.minPayoutAmount)}
          </Text>
        </Card>
      ) : null}

      {!data?.partner ? (
        <AppButton
          title={join.isPending ? 'Joining…' : 'Join as a referral partner'}
          disabled={!data?.program.isActive || join.isPending}
          onPress={() => join.mutate()}
        />
      ) : (
        <>
          <Card>
            <Text style={[styles.meta, { color: colors.textMuted }]}>Your code</Text>
            <Text style={[styles.rate, { color: colors.text }]}>{data.partner.code}</Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              Pending {formatReferralRupees(data.partner.totals.pending + data.partner.totals.approved)} · Paid{' '}
              {formatReferralRupees(data.partner.totals.paid)}
            </Text>
          </Card>
          <AppButton
            title="Share your link"
            icon={Copy}
            variant="secondary"
            onPress={() => void Share.share({ message: `Book with XGoo using my referral link: ${shareLink}` })}
          />
          <Card>
            <Text style={[styles.section, { color: colors.text }]}>Bank account</Text>
            {data.partner.hasBank ? (
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {data.partner.bankAccountName} · {data.partner.bankAccountNumberMasked} · {data.partner.bankIfsc}
              </Text>
            ) : (
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                Add the account Command should pay.
              </Text>
            )}
            <Field
              label="Account holder name"
              value={bank.bankAccountName}
              onChangeText={(bankAccountName) => setBank((current) => ({ ...current, bankAccountName }))}
            />
            <Field
              label="Account number"
              keyboardType="number-pad"
              value={bank.bankAccountNumber}
              onChangeText={(bankAccountNumber) => setBank((current) => ({ ...current, bankAccountNumber }))}
            />
            <Field
              label="IFSC"
              autoCapitalize="characters"
              value={bank.bankIfsc}
              onChangeText={(bankIfsc) => setBank((current) => ({ ...current, bankIfsc: bankIfsc.toUpperCase() }))}
            />
            <AppButton
              title={saveBank.isPending ? 'Saving…' : 'Save bank details'}
              disabled={saveBank.isPending}
              onPress={() => saveBank.mutate()}
            />
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 18 },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4 },
  rate: { fontSize: 18, fontWeight: '800' },
  meta: { fontSize: 12, marginTop: 6 },
  section: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
});
