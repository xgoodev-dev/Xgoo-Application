import { MapPin, Search, Star, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { customerApi, type CustomerAddress } from '@/lib/api';
import { useAppTheme } from '@/lib/theme';

export type PlaceSuggestion = {
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  lat?: number;
  lng?: number;
  label?: string;
};

type SuggestRow =
  | { kind: 'heading'; id: string; title: string }
  | { kind: 'saved'; id: string; address: CustomerAddress }
  | { kind: 'place'; id: string; place: PlaceSuggestion };

function matchesQuery(haystack: string, query: string) {
  if (!query.trim()) return true;
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
}

export function AddressSuggestField({
  label,
  placeholder,
  value,
  saved,
  onChangeText,
  onSelectSaved,
  onSelectPlace,
}: {
  label: string;
  placeholder?: string;
  value: string;
  saved: CustomerAddress[];
  onChangeText: (value: string) => void;
  onSelectSaved: (address: CustomerAddress) => void;
  onSelectPlace: (place: PlaceSuggestion) => void;
  multiline?: boolean;
}) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [places, setPlaces] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const openPicker = () => {
    setQuery(value);
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 250);
  };

  const closePicker = () => {
    setOpen(false);
    setPlaces([]);
  };

  useEffect(() => {
    if (!open) return;
    if (timer.current) clearTimeout(timer.current);
    const text = query.trim();
    if (text.length < 3) {
      setPlaces([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(() => {
      void customerApi
        .searchPlaces(text)
        .then((results) => {
          setPlaces(
            results.map((item) => ({
              address: item.address || item.displayName,
              city: item.city || '',
              state: item.state || '',
              pincode: item.pincode || '',
              country: item.country,
              lat: item.lat,
              lng: item.lng,
              label: item.displayName,
            })),
          );
        })
        .catch(() => setPlaces([]))
        .finally(() => setSearching(false));
    }, 280);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open, query]);

  const rows = useMemo<SuggestRow[]>(() => {
    const savedMatches = saved
      .filter((item) =>
        matchesQuery(
          [item.label, item.address, item.city, item.state, item.pincode].filter(Boolean).join(' '),
          query,
        ),
      )
      .slice(0, 8);
    const list: SuggestRow[] = [];
    if (savedMatches.length) {
      list.push({ kind: 'heading', id: 'saved-heading', title: 'Saved' });
      savedMatches.forEach((address) => {
        list.push({ kind: 'saved', id: address.id, address });
      });
    }
    if (places.length) {
      list.push({ kind: 'heading', id: 'places-heading', title: 'Places' });
      places.slice(0, 8).forEach((place, index) => {
        list.push({ kind: 'place', id: `place-${place.lat}-${place.lng}-${index}`, place });
      });
    }
    return list;
  }, [places, query, saved]);

  const useTypedAddress = () => {
    const text = query.trim();
    if (!text) return;
    onChangeText(text);
    closePicker();
  };

  return (
    <View>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Pressable
        onPress={openPicker}
        style={[styles.summary, { borderColor: colors.border, backgroundColor: colors.surface }]}
      >
        <MapPin size={16} color={colors.accent} />
        <Text
          numberOfLines={3}
          style={[styles.summaryText, { color: value ? colors.text : colors.textMuted }]}
        >
          {value || placeholder || 'Tap to search saved and Google addresses'}
        </Text>
        <Search size={16} color={colors.textMuted} />
      </Pressable>

      <Modal animationType="slide" visible={open} onRequestClose={closePicker}>
        <SafeAreaView style={[styles.sheet, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.header}>
              <View style={styles.flex}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{label}</Text>
                <Text style={[styles.headerCopy, { color: colors.textMuted }]}>
                  Search or pick a saved address
                </Text>
              </View>
              <Pressable
                onPress={closePicker}
                style={[styles.close, { backgroundColor: colors.surfaceMuted }]}
              >
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            <View
              style={[
                styles.searchBox,
                { borderColor: colors.accent, backgroundColor: colors.surface },
              ]}
            >
              <Search size={16} color={colors.accent} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder={placeholder || 'House, street, area, pincode'}
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.accent}
                autoCorrect={false}
                style={[styles.searchInput, { color: colors.text }]}
                returnKeyType="search"
              />
            </View>

            <FlatList
              data={rows}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: colors.textMuted }]}>
                  {searching
                    ? 'Searching Google…'
                    : query.trim().length < 3
                      ? 'Your saved addresses appear here. Type 3+ letters to search Google.'
                      : 'No matching places. Use the address you typed, or try a different search.'}
                </Text>
              }
              renderItem={({ item }) => {
                if (item.kind === 'heading') {
                  return (
                    <Text style={[styles.section, { color: colors.textMuted }]}>{item.title}</Text>
                  );
                }
                if (item.kind === 'saved') {
                  const address = item.address;
                  return (
                    <Pressable
                      onPress={() => {
                        onSelectSaved(address);
                        closePicker();
                      }}
                      style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    >
                      <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
                        <MapPin size={16} color={colors.accent} />
                      </View>
                      <View style={styles.copy}>
                        <View style={styles.titleRow}>
                          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
                            {address.label || 'Saved address'}
                          </Text>
                          {address.isDefault ? <Star size={13} color={colors.accent} /> : null}
                        </View>
                        <Text numberOfLines={2} style={[styles.sub, { color: colors.textMuted }]}>
                          {[address.address, address.city].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                    </Pressable>
                  );
                }
                const place = item.place;
                return (
                  <Pressable
                    onPress={() => {
                      onSelectPlace(place);
                      closePicker();
                    }}
                    style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  >
                    <View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}>
                      <MapPin size={16} color={colors.textMuted} />
                    </View>
                    <View style={styles.copy}>
                      <Text numberOfLines={2} style={[styles.title, { color: colors.text }]}>
                        {place.address}
                      </Text>
                      <Text numberOfLines={1} style={[styles.sub, { color: colors.textMuted }]}>
                        {[place.city, place.state, place.pincode].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />

            {query.trim().length > 4 ? (
              <Pressable
                onPress={useTypedAddress}
                style={[styles.useTyped, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.useTypedText}>Use this address</Text>
              </Pressable>
            ) : null}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', marginBottom: 7 },
  summary: {
    minHeight: 50,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  summaryText: { flex: 1, fontSize: 15, lineHeight: 21 },
  flex: { flex: 1 },
  sheet: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  headerCopy: { fontSize: 13, marginTop: 3 },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchBox: {
    marginHorizontal: 20,
    marginBottom: 12,
    minHeight: 50,
    borderWidth: 2,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 8 },
  empty: { fontSize: 13, lineHeight: 19, paddingVertical: 24 },
  section: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  icon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, fontSize: 15, fontWeight: '700' },
  sub: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  useTyped: {
    marginHorizontal: 20,
    marginBottom: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useTypedText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
