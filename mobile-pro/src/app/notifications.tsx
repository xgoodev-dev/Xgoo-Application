import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';
import { BackButton, Card, EmptyState, Screen } from '@/components/ui';
import { proApi } from '@/lib/api';
import { shortDate } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function NotificationsScreen() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const query = useQuery({
    queryKey: ['pro-notifications', token],
    enabled: Boolean(token),
    queryFn: () => proApi.notifications(token!),
  });

  return (
    <Screen>
      <BackButton fallback="/(tabs)" />
      <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
      {query.data?.length ? (
        query.data.map((item) => (
          <Card key={item.id} style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>{item.body}</Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>{shortDate(item.createdAt)}</Text>
          </Card>
        ))
      ) : (
        <EmptyState icon={Bell} title="You’re up to date" description="Order and pickup updates will show here." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', marginBottom: 16 },
  row: { marginBottom: 10, gap: 4 },
  label: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12 },
});
