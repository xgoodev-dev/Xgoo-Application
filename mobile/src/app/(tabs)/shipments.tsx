import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { PackageSearch, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { ShipmentCard } from '@/components/shipment-card';
import { AppButton, EmptyState, PageHeader, Pill, Screen } from '@/components/ui';
import { customerApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

type Filter = 'all' | 'pending' | 'in_transit' | 'delivered';

function bucket(status: string): Filter {
  if (status === 'delivered') return 'delivered';
  if (['converted', 'picked_up', 'in_transit', 'out_for_delivery'].includes(status)) {
    return 'in_transit';
  }
  return 'pending';
}

export default function ShipmentsScreen() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const bookings = useQuery({
    queryKey: ['customer-bookings', token],
    queryFn: () => customerApi.bookings(token!),
    enabled: !!token,
  });

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (bookings.data || []).filter((item) => {
      if (filter !== 'all' && bucket(item.status) !== filter) return false;
      if (!search) return true;
      return [
        item.requestNumber,
        item.senderName,
        item.receiverName,
        item.senderCity,
        item.receiverCity,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [bookings.data, filter, query]);

  return (
    <Screen
      keyboard
      refreshControl={
        <RefreshControl
          refreshing={bookings.isRefetching}
          onRefresh={() => void bookings.refetch()}
          tintColor={colors.accent}
        />
      }
    >
      <PageHeader title="Your shipments" subtitle="Every parcel movement in one place." />
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search request, person, or city"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>
      <View style={styles.filters}>
        <Pill label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Pill label="Pending" active={filter === 'pending'} onPress={() => setFilter('pending')} />
        <Pill
          label="In transit"
          active={filter === 'in_transit'}
          onPress={() => setFilter('in_transit')}
        />
        <Pill
          label="Delivered"
          active={filter === 'delivered'}
          onPress={() => setFilter('delivered')}
        />
      </View>

      <View style={styles.list}>
        {filtered.map((booking) => (
          <ShipmentCard
            key={booking.id}
            booking={booking}
            onPress={() => router.push(`/shipment/${booking.id}`)}
          />
        ))}
      </View>

      {!bookings.isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No shipments found"
          description={
            query || filter !== 'all'
              ? 'Try another search or filter.'
              : 'Book a parcel to see it here.'
          }
          action={
            <AppButton
              title="Book a parcel"
              onPress={() => router.push('/(tabs)/book')}
            />
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  searchInput: { flex: 1, height: 48, fontSize: 14 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13, marginBottom: 18 },
  list: { gap: 12 },
});

