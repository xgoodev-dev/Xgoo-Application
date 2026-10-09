import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { RootErrorBoundary } from '@/components/root-error-boundary';
import { AuthProvider } from '@/lib/auth';
import { AppThemeProvider, useAppTheme } from '@/lib/theme';

function AppNavigator() {
  const { isDark, colors } = useAppTheme();

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
        <Stack.Screen name="booking" options={{ gestureEnabled: false }} />
        <Stack.Screen name="shipment/[id]" />
        <Stack.Screen name="track/[ref]" />
        <Stack.Screen name="addresses" />
        <Stack.Screen name="personal-information" />
        <Stack.Screen name="privacy-security" />
        <Stack.Screen name="help-support" />
        <Stack.Screen name="refer-earn" />
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
