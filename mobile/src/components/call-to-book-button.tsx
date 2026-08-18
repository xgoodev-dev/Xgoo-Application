import { Phone } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { callXgooSupport, XGOO_SUPPORT } from '@/lib/support';
import { useAppTheme } from '@/lib/theme';

type Props = {
  /** Compact row for hero / booking step; default is a full card-style button. */
  compact?: boolean;
  label?: string;
  subtitle?: string;
};

export function CallToBookButton({
  compact = false,
  label = 'Call to book',
  subtitle = `${XGOO_SUPPORT.phoneDisplay} · ${XGOO_SUPPORT.hours}`,
}: Props) {
  const { colors } = useAppTheme();

  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${subtitle}`}
        onPress={() => void callXgooSupport('book')}
        style={[
          styles.compact,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <Phone size={16} color={colors.accent} />
        <Text style={[styles.compactLabel, { color: colors.text }]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${subtitle}`}
      onPress={() => void callXgooSupport('book')}
      style={[
        styles.card,
        {
          borderColor: colors.accent,
          backgroundColor: colors.accentSoft,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.accent }]}>
        <Phone size={20} color="#FFFFFF" />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800' },
  subtitle: { fontSize: 11, lineHeight: 15, marginTop: 3 },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    height: 44,
    paddingHorizontal: 14,
  },
  compactLabel: { fontSize: 13, fontWeight: '700' },
});
