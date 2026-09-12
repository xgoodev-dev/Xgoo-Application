import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

export default function AuthLayout() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  if (token) return <Redirect href="/(tabs)" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'none',
      }}
    />
  );
}

