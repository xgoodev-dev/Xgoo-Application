import type { LucideIcon } from 'lucide-react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { XGOO_PICKUP } from '@/lib/site-info';
import { useAppTheme } from '@/lib/theme';

type KeyboardScrollContextValue = {
  scrollToFocused: (target: View | null) => void;
};

const KeyboardScrollContext = createContext<KeyboardScrollContextValue | null>(null);

export function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/images/xgoo-logo.png')}
      accessibilityLabel={XGOO_PICKUP.name}
      resizeMode="contain"
      style={{ width: size, height: size, borderRadius: Math.max(6, size * 0.2) }}
    />
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.brand}>
      <LogoMark size={compact ? 28 : 38} />
      <View>
        <Text style={[styles.brandName, { color: colors.text }, compact && { fontSize: 18 }]}>
          {XGOO_PICKUP.name}
        </Text>
        {!compact && (
          <Text style={[styles.brandTag, { color: colors.textMuted }]}>{XGOO_PICKUP.meaning}</Text>
        )}
      </View>
    </View>
  );
}

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  keyboard?: boolean;
  contentStyle?: ViewStyle;
  refreshControl?: ScrollViewProps['refreshControl'];
}>;

export function Screen({
  children,
  scroll = true,
  padded = true,
  keyboard = false,
  contentStyle,
  refreshControl,
}: ScreenProps) {
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const scrollHostRef = useRef<View>(null);
  const scrollYRef = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!keyboard) return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboard]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const scrollToFocused = useCallback(
    (target: View | null) => {
      if (!target || !scrollRef.current || !scrollHostRef.current) return;
      requestAnimationFrame(() => {
        target.measureInWindow((_x, y, _width, height) => {
          scrollHostRef.current?.measureInWindow((_sx, sy, _sw, sh) => {
            // Keep a cushion above the keypad / footer button area.
            const cushion = Platform.OS === 'android' ? 28 : 20;
            const visibleBottom =
              sy + sh - (Platform.OS === 'ios' ? Math.max(0, keyboardHeight * 0.15) : 0) - cushion;
            const fieldBottom = y + height;
            if (fieldBottom <= visibleBottom) return;
            const delta = fieldBottom - visibleBottom;
            scrollRef.current?.scrollTo({
              y: Math.max(0, scrollYRef.current + delta + 12),
              animated: true,
            });
          });
        });
      });
    },
    [keyboardHeight],
  );

  // Android already resizes the window (`softwareKeyboardLayoutMode: resize`).
  // Extra full keyboard padding would double-count; keep a small scroll cushion instead.
  const keyboardPadding =
    keyboard && keyboardHeight > 0
      ? Platform.OS === 'ios'
        ? 24
        : 48
      : keyboard
        ? 36
        : 0;

  const basePaddingBottom =
    typeof contentStyle?.paddingBottom === 'number' ? contentStyle.paddingBottom : 24;

  const content = scroll ? (
    <View ref={scrollHostRef} style={styles.flex} collapsable={false}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets={keyboard && Platform.OS === 'ios'}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.screenContent,
          padded && styles.screenPadding,
          contentStyle,
          keyboard
            ? { paddingBottom: Math.max(30, basePaddingBottom + keyboardPadding) }
            : null,
        ]}
      >
        {children}
      </ScrollView>
    </View>
  ) : (
    <View style={[styles.screenContent, padded && styles.screenPadding, contentStyle]}>
      {children}
    </View>
  );

  const body =
    keyboard && Platform.OS === 'ios' ? (
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={8}>
        {content}
      </KeyboardAvoidingView>
    ) : (
      content
    );

  return (
    <KeyboardScrollContext.Provider value={{ scrollToFocused }}>
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
        edges={keyboard && keyboardHeight > 0 ? ['top'] : ['top', 'bottom']}
      >
        {body}
      </SafeAreaView>
    </KeyboardScrollContext.Provider>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; onPress?: () => void }>) {
  const { colors } = useAppTheme();
  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      shadowColor: colors.shadow,
    },
    style,
  ];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [cardStyle, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

export function AppButton({
  title,
  icon: Icon,
  variant = 'primary',
  loading,
  disabled,
  style,
  ...props
}: PressableProps & {
  title: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  const backgrounds = {
    primary: colors.accent,
    secondary: colors.surfaceMuted,
    ghost: 'transparent',
    danger: colors.danger,
  };
  const foreground = variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: backgrounds[variant] },
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : (
        <>
          {Icon ? <Icon size={18} color={foreground} /> : null}
          <Text style={[styles.buttonText, { color: foreground }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  helperText,
  multiline,
  onFocus,
  ...props
}: TextInputProps & { label?: string; error?: string; helperText?: string }) {
  const { colors } = useAppTheme();
  const fieldRef = useRef<View>(null);
  const keyboardScroll = useContext(KeyboardScrollContext);

  return (
    <View ref={fieldRef} style={styles.field} collapsable={false}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        multiline={multiline}
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.surface,
          },
          multiline && styles.inputMultiline,
        ]}
        onFocus={(event) => {
          onFocus?.(event);
          // Wait for keyboard animation / window resize, then bring field into view.
          setTimeout(() => keyboardScroll?.scrollToFocused(fieldRef.current), Platform.OS === 'ios' ? 60 : 120);
          setTimeout(() => keyboardScroll?.scrollToFocused(fieldRef.current), Platform.OS === 'ios' ? 280 : 320);
        }}
        {...props}
      />
      {helperText && !error ? (
        <Text style={[styles.helper, { color: colors.textMuted }]}>{helperText}</Text>
      ) : null}
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

export function Pill({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: active ? color || colors.text : colors.surface,
          borderColor: active ? color || colors.text : colors.border,
        },
      ]}
    >
      <Text style={[styles.pillText, { color: active ? '#FFFFFF' : colors.textMuted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Icon size={30} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>{description}</Text>
      {action}
    </View>
  );
}

export function SectionTitle({ children, action }: PropsWithChildren<{ action?: ReactNode }>) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.sectionTitle}>
      <Text style={[styles.sectionTitleText, { color: colors.text }]}>{children}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  screenContent: { flexGrow: 1, paddingBottom: 32 },
  screenPadding: { paddingHorizontal: 20, paddingTop: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
  brandTag: { fontSize: 10, marginTop: -2, letterSpacing: 0.4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },
  headerCopy: { flex: 1 },
  pageTitle: { fontSize: 27, lineHeight: 33, fontWeight: '800', letterSpacing: -0.6 },
  pageSubtitle: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 16,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.995 }] },
  button: {
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  buttonText: { fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  field: { gap: 7 },
  label: { fontSize: 13, fontWeight: '600' },
  input: {
    minHeight: 50,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  inputMultiline: { minHeight: 96, paddingTop: 14, textAlignVertical: 'top' },
  helper: { fontSize: 11, lineHeight: 15 },
  error: { fontSize: 11 },
  pill: {
    minHeight: 34,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
  },
  pillText: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6, marginBottom: 18 },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitleText: { fontSize: 17, fontWeight: '700' },
});

