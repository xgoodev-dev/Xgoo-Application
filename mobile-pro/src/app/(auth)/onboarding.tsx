import { router } from 'expo-router';
import { ClipboardList, ShieldCheck, Store } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, LogoMark, Screen } from '@/components/ui';
import { markOnboardingSeen } from '@/lib/onboarding';
import { useAppTheme } from '@/lib/theme';

const SLIDES = [
  {
    id: 'movement',
    icon: Store,
    title: 'Movement creates progress',
    body: 'We believe movement creates progress, and innovation makes progress possible. XGoo Pro is how your store starts moving.',
  },
  {
    id: 'store',
    icon: ClipboardList,
    title: 'Standing pickup for your store',
    body: 'Create orders from WhatsApp, calls, Instagram, and your store link. Confirm pickup when the parcels are ready.',
  },
  {
    id: 'command',
    icon: ShieldCheck,
    title: 'Apply once. Then keep moving.',
    body: 'XGoo Command verifies your store. After that you track shipments, settle bills, and keep customers moving.',
  },
] as const;

export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  if (!slide) return null;
  const last = index === SLIDES.length - 1;
  const Icon = slide.icon;

  const finish = async () => {
    await markOnboardingSeen();
    router.replace('/(auth)/welcome');
  };

  const next = () => {
    if (last) {
      void finish();
      return;
    }
    setIndex((current) => current + 1);
  };

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.top}>
        {last ? (
          <View style={styles.skipSlot} />
        ) : (
          <Pressable onPress={() => void finish()} style={styles.skip}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
          </Pressable>
        )}
        <LogoMark size={36} />
      </View>

      <View style={styles.hero}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
          <Icon size={36} color={colors.accent} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>{slide.body}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((item, slideIndex) => (
            <View
              key={item.id}
              style={[
                styles.dot,
                {
                  backgroundColor: slideIndex === index ? colors.accent : colors.border,
                  width: slideIndex === index ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>
        <AppButton title={last ? 'Get started' : 'Next'} onPress={next} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', paddingTop: 8, paddingBottom: 24 },
  top: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  skip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 4 },
  skipSlot: { width: 48, height: 40 },
  skipText: { fontSize: 15, fontWeight: '600' },
  hero: { alignItems: 'center', paddingHorizontal: 8 },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -0.7, textAlign: 'center' },
  body: { fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 14 },
  footer: { gap: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 999 },
});
