import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { RootErrorBoundary } from '@/components/root-error-boundary';
import { AuthProvider } from '@/lib/auth';
import {
  addNotificationResponseReceivedListener,
  ensureNotificationHandler,
} from '@/lib/notifications';
import { AppThemeProvider, useAppTheme } from '@/lib/theme';

function AppNavigator() {
  const { isDark, colors } = useAppTheme();
  useEffect(() => {
    try {
      ensureNotificationHandler();
      const subscription = addNotificationResponseReceivedListener((response) => {
        const jobId = response.notification.request.content.data?.jobId;
        if (typeof jobId === 'string' && jobId) {
          router.push(`/job/${jobId}`);
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
          animation: 'none',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="job/[id]" />
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
