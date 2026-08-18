import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Box, MapPin } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Card } from '@/components/ui';
import type { AppBanner } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/api';
import { useAppTheme } from '@/lib/theme';

const BANNER_HEIGHT = 190;
const AUTO_ADVANCE_MS = 5000;

type Props = {
  banners: AppBanner[];
};

export function HomeBanner({ banners }: Props) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const bannerWidth = Math.max(280, width - 40);
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      const next = (indexRef.current + 1) % banners.length;
      indexRef.current = next;
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * bannerWidth, animated: true });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [bannerWidth, banners.length]);

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / bannerWidth);
    indexRef.current = next;
    setIndex(next);
  };

  if (banners.length === 0) {
    return <DefaultBanner />;
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        decelerationRate="fast"
        style={[styles.carousel, { width: bannerWidth, backgroundColor: colors.surface }]}
      >
        {banners.map((banner) => (
          <BannerSlide key={banner.id} banner={banner} width={bannerWidth} />
        ))}
      </ScrollView>
      {banners.length > 1 ? (
        <View style={styles.dots}>
          {banners.map((banner, itemIndex) => (
            <View
              key={banner.id}
              style={[
                styles.dot,
                {
                  backgroundColor: itemIndex === index ? colors.accent : colors.border,
                  width: itemIndex === index ? 16 : 7,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function BannerSlide({ banner, width }: { banner: AppBanner; width: number }) {
  const imageUrl = resolveMediaUrl(banner.imageUrl);
  const hasCopy = Boolean(banner.title || banner.subtitle);

  return (
    <Pressable
      accessibilityRole={banner.linkUrl ? 'link' : 'image'}
      accessibilityLabel={banner.title || 'Promotional banner'}
      disabled={!banner.linkUrl}
      onPress={() => void openBannerLink(banner.linkUrl)}
      style={[styles.slide, { width }]}
    >
      <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
      {hasCopy ? (
        <LinearGradient colors={['transparent', 'rgba(13,13,16,0.82)']} style={styles.overlay}>
          {banner.title ? <Text style={styles.bannerTitle}>{banner.title}</Text> : null}
          {banner.subtitle ? <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text> : null}
        </LinearGradient>
      ) : null}
    </Pressable>
  );
}

function DefaultBanner() {
  return (
    <Card style={[styles.hero, { backgroundColor: '#FF4907', borderColor: '#FF4907' }]}>
      <View style={styles.heroCopy}>
        <Text style={styles.heroEyebrow}>READY WHEN YOU ARE</Text>
        <Text style={styles.heroTitle}>Where should your{'\n'}parcel move next?</Text>
      </View>
      <View style={styles.heroArt}>
        <View style={styles.heroCircle}>
          <Box size={45} color="#FF4907" />
        </View>
        <View style={styles.heroPin}>
          <MapPin size={20} color="#FFFFFF" />
        </View>
      </View>
    </Card>
  );
}

async function openBannerLink(linkUrl?: string | null) {
  const value = linkUrl?.trim();
  if (!value) return;

  const normalized = value.replace(/^\/+/, '').toLowerCase();
  if (normalized === 'book' || normalized === '(tabs)/book') {
    router.push('/(tabs)/book');
    return;
  }

  const url = /^https?:\/\//i.test(value) || value.startsWith('tel:') ? value : `https://${value}`;
  try {
    await Linking.openURL(url);
  } catch {
    // Ignore invalid promotional links rather than blocking the home screen.
  }
}

const styles = StyleSheet.create({
  carousel: {
    height: BANNER_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
  },
  slide: {
    height: BANNER_HEIGHT,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#1D1F23',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 36,
    paddingBottom: 16,
    gap: 4,
  },
  bannerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  bannerSubtitle: { color: '#FFE8DE', fontSize: 12, lineHeight: 16, fontWeight: '600' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: { height: 7, borderRadius: 999 },
  hero: {
    minHeight: BANNER_HEIGHT,
    padding: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowOpacity: 0.2,
    shadowColor: '#FF4907',
  },
  heroCopy: { flex: 1.3, zIndex: 2, justifyContent: 'center', gap: 8 },
  heroEyebrow: { color: '#FFE0D4', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { color: '#FFFFFF', fontSize: 22, lineHeight: 27, fontWeight: '900' },
  heroArt: { flex: 0.7, justifyContent: 'center', alignItems: 'center' },
  heroCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  heroPin: {
    position: 'absolute',
    right: 2,
    top: 26,
    width: 37,
    height: 37,
    borderRadius: 14,
    backgroundColor: '#1D1F23',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
