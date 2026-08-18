import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AuthProvider } from '@/lib/auth';
import {
  addNotificationResponseReceivedListener,
  ensureNotificationHandler,
} from '@/lib/notifications';
import { AppThemeProvider, useAppTheme } from '@/lib/theme';

function AppNavigator() {
  const { isDark, colors } = useAppTheme();
  useEffect(() => {
    ensureNotificationHandler();
    const subscription = addNotificationResponseReceivedListener((response) => {
      const shipmentId = response.notification.request.content.data?.shipmentId;
      if (typeof shipmentId === 'string' && shipmentId) {
        router.push(`/shipment/${shipmentId}`);
      } else {
        router.push('/notifications');
      }
    });
    return () => subscription.remove();
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
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking" options={{ gestureEnabled: false }} />
        <Stack.Screen name="shipment/[id]" />
        <Stack.Screen name="addresses" />
        <Stack.Screen name="personal-information" />
        <Stack.Screen name="privacy-security" />
        <Stack.Screen name="help-support" />
        <Stack.Screen name="notifications" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 20_000, retry: 1 },
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </AppThemeProvider>
    </QueryClientProvider>
  );
}
