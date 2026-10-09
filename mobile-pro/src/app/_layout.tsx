import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { RootErrorBoundary } from '@/components/root-error-boundary';
import { AuthProvider } from '@/lib/auth';
import {
  addNotificationResponseReceivedListener,
  ensureNotificationHandler,
} from '@/lib/notifications';
import { AppThemeProvider, useAppTheme } from '@/lib/theme';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppNavigator() {
  const { isDark, colors } = useAppTheme();
  useEffect(() => {
    try {
      ensureNotificationHandler();
      const subscription = addNotificationResponseReceivedListener((response) => {
        const bookingId = response.notification.request.content.data?.bookingRequestId;
        if (typeof bookingId === 'string' && bookingId) {
          router.push(`/shipment/${bookingId}`);
        } else {
          router.push('/notifications');
        }
      });
      return () => subscription.remove();
    } catch (error) {
      console.warn('Notification listeners skipped', error);
      return undefined;
    }
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="apply" />
        <Stack.Screen name="customers" />
        <Stack.Screen name="customer-new" />
        <Stack.Screen name="order-new" />
        <Stack.Screen name="bills" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="store-details" />
        <Stack.Screen name="refer-earn" />
        <Stack.Screen name="help-support" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="shipment/[id]" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, retry: 1 },
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </RootErrorBoundary>
  );
}
