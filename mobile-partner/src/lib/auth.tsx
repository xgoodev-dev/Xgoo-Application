import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';
import { pickupApi, type PickupPartner } from '@/lib/api';
import { canUseRemotePush, registerForPushNotifications } from '@/lib/notifications';

type AuthContextValue = {
  token: string | null;
  user: PickupPartner | null;
  loading: boolean;
  requestOtp: (phone: string) => Promise<{ debugOtp?: string }>;
  signIn: (phone: string, otp: string) => Promise<void>;
  signInWithPassword: (phone: string, password: string) => Promise<void>;
  signUp: (input: Parameters<typeof pickupApi.signup>[0]) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setAvailability: (availability: PickupPartner['availability']) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = 'xgoo-pickup-token';

async function loadToken() {
  try {
    if (Platform.OS === 'web') return localStorage.getItem(TOKEN_KEY);
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn('Could not read saved session', error);
    return null;
  }
}

async function saveToken(token: string | null) {
  try {
    if (Platform.OS === 'web') {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
      return;
    }
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn('Could not save session', error);
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<PickupPartner | null>(null);
  const [loading, setLoading] = useState(true);

  const establishSession = useCallback(async (session: { token: string; user: PickupPartner }) => {
    await saveToken(session.token);
    setToken(session.token);
    setUser(session.user);
  }, []);

  useEffect(() => {
    let active = true;
    loadToken()
      .then(async (saved) => {
        if (!saved) return;
        const current = await pickupApi.me(saved);
        if (!active) return;
        setToken(saved);
        setUser(current);
      })
      .catch(() => saveToken(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!token || !canUseRemotePush()) return;
    registerForPushNotifications()
      .then((pushToken) => {
        if (!pushToken) return;
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        return pickupApi.registerPushToken(token, { token: pushToken, platform });
      })
      .catch((error) => console.warn('Push notification registration failed', error));
  }, [token]);

  const requestOtp = useCallback(async (phone: string) => {
    const result = await pickupApi.sendOtp(phone);
    return { debugOtp: result.debugOtp };
  }, []);

  const signIn = useCallback(
    async (phone: string, otp: string) => {
      const session = await pickupApi.login(phone.trim(), otp);
      await establishSession(session);
    },
    [establishSession],
  );

  const signInWithPassword = useCallback(
    async (phone: string, password: string) => {
      const session = await pickupApi.loginWithPassword(phone.trim(), password);
      await establishSession(session);
    },
    [establishSession],
  );

  const signUp = useCallback(
    async (input: Parameters<typeof pickupApi.signup>[0]) => {
      const session = await pickupApi.signup(input);
      await establishSession(session);
    },
    [establishSession],
  );

  const signOut = useCallback(async () => {
    const currentToken = token;
    setToken(null);
    setUser(null);
    await saveToken(null);
    if (currentToken) await pickupApi.logout(currentToken).catch(() => undefined);
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    setUser(await pickupApi.me(token));
  }, [token]);

  const setAvailability = useCallback(
    async (availability: PickupPartner['availability']) => {
      if (!token) return;
      setUser(await pickupApi.updateMe(token, { availability }));
    },
    [token],
  );

  const changePassword = useCallback(
    async (password: string) => {
      if (!token) return;
      setUser(await pickupApi.updateMe(token, { password }));
    },
    [token],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      requestOtp,
      signIn,
      signInWithPassword,
      signUp,
      signOut,
      refreshUser,
      setAvailability,
      changePassword,
    }),
    [
      changePassword,
      loading,
      refreshUser,
      requestOtp,
      setAvailability,
      signIn,
      signInWithPassword,
      signOut,
      signUp,
      token,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
