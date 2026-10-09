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
import { proApi, type AuthSession, type CustomerUser } from '@/lib/api';
import { canUseRemotePush, registerForPushNotifications } from '@/lib/notifications';

type AuthContextValue = {
  token: string | null;
  user: CustomerUser | null;
  loading: boolean;
  requestOtp: (phone: string, purpose: 'login' | 'register') => Promise<{ debugOtp?: string }>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithOtp: (phone: string, otp: string) => Promise<void>;
  register: (input: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = 'xgoo-pro-token';

async function loadToken() {
  try {
    if (Platform.OS === 'web') return localStorage.getItem(TOKEN_KEY);
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
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

function assertProAccount(user: CustomerUser) {
  if (user.accountType === 'individual') {
    throw new Error('This is an XGoo Go account. Download XGoo Go to send a parcel.');
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  const establishSession = useCallback(async (session: AuthSession) => {
    assertProAccount(session.user);
    await saveToken(session.token);
    setToken(session.token);
    setUser(session.user);
  }, []);

  useEffect(() => {
    let active = true;
    loadToken()
      .then(async (saved) => {
        if (!saved) return;
        const current = await proApi.me(saved);
        if (!active) return;
        assertProAccount(current);
        setToken(saved);
        setUser(current);
      })
      .catch(async () => {
        await saveToken(null);
      })
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
        return proApi.registerPushToken(token, {
          token: pushToken,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        });
      })
      .catch((error) => console.warn('Push notification registration failed', error));
  }, [token]);

  const requestOtp = useCallback(async (phone: string, purpose: 'login' | 'register') => {
    const result = await proApi.sendOtp(phone, purpose);
    return { debugOtp: result.debugOtp };
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const session = await proApi.login({ email: email.trim().toLowerCase(), password });
      await establishSession(session);
    },
    [establishSession],
  );

  const signInWithOtp = useCallback(
    async (phone: string, otp: string) => {
      const session = await proApi.login({ phone, otp });
      await establishSession(session);
    },
    [establishSession],
  );

  const register = useCallback(
    async (input: { name: string; email: string; phone: string; password: string }) => {
      const session = await proApi.register(input);
      await establishSession(session);
    },
    [establishSession],
  );

  const signOut = useCallback(async () => {
    const currentToken = token;
    setToken(null);
    setUser(null);
    await saveToken(null);
    if (currentToken) await proApi.logout(currentToken).catch(() => undefined);
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    setUser(await proApi.me(token));
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      requestOtp,
      signInWithPassword,
      signInWithOtp,
      register,
      signOut,
      refreshUser,
    }),
    [loading, refreshUser, register, requestOtp, signInWithOtp, signInWithPassword, signOut, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
