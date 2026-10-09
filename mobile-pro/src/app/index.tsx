import * as SplashScreen from 'expo-splash-screen';
import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { BrandSplash } from '@/components/splash';
import { useAuth } from '@/lib/auth';
import { hasSeenOnboarding } from '@/lib/onboarding';

const SPLASH_MS = 1800;

export default function EntryScreen() {
  const { loading, token } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined);
    const timer = setTimeout(() => setMinElapsed(true), SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    hasSeenOnboarding()
      .then(setOnboarded)
      .catch(() => setOnboarded(false));
  }, []);

  const ready = !loading && minElapsed && onboarded !== null;
  if (!ready) return <BrandSplash />;

  if (token) return <Redirect href="/(tabs)" />;
  const next = (onboarded ? '/(auth)/welcome' : '/(auth)/onboarding') as unknown as Href;
  return <Redirect href={next} />;
}
