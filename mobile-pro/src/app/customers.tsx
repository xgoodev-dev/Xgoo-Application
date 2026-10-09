import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Plus, Users } from 'lucide-react-native';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton, BackButton, Card, EmptyState, PageHeader, Screen } from '@/components/ui';
import { proApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function CustomersScreen() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['pro-customers', token],
    enabled: Boolean(token),
    queryFn: () => proApi.destinations(token!),
  });
  const remove = useMutation({
    mutationFn: (id: string) => proApi.deleteDestination(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pro-customers', token] }),
    onError: (error) => Alert.alert('Could not delete', error instanceof Error ? error.message : 'Try again.'),
  });

  return (
    <Screen>
      <BackButton fallback="/(tabs)" />
      <PageHeader
        title="Customers"
        subtitle="Saved receivers for standing pickup."
        right={<AppButton title="Add" icon={Plus} onPress={() => router.push('/customer-new')} />}
      />
      {query.data?.length ? (
        <View style={styles.list}>
          {query.data.map((item) => (
            <Card key={item.id}>
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {item.phone}
                {item.city ? ` · ${item.city}` : ''}
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>{item.address}</Text>
              <AppButton title="Remove" variant="ghost" onPress={() => remove.mutate(item.id)} />
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Save receivers you ship to often."
          action={<AppButton title="Add customer" onPress={() => router.push('/customer-new')} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 3 },
});
