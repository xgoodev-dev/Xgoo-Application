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
import {
  customerApi,
  type CustomerUser,
} from '@/lib/api';
import {
  canUseRemotePush,
  registerForPushNotifications,
} from '@/lib/notifications';

type AuthContextValue = {
  token: string | null;
  user: CustomerUser | null;
  loading: boolean;
  signIn: (phone: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    phone: string;
    email?: string;
    password: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (input: Partial<CustomerUser>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = 'xgoo-customer-token';

async function loadToken() {
  if (Platform.OS === 'web') return localStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function saveToken(token: string | null) {
  if (Platform.OS === 'web') {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    return;
  }
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  const establishSession = useCallback(
    async (session: { token: string; user: CustomerUser }) => {
      await saveToken(session.token);
      setToken(session.token);
      setUser(session.user);
    },
    [],
  );

  useEffect(() => {
    let active = true;
    loadToken()
      .then(async (saved) => {
        if (!saved) return;
        const current = await customerApi.me(saved);
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
        return customerApi.registerPushToken(token, {
          token: pushToken,
          platform,
        });
      })
      .catch((error) => console.warn('Push notification registration failed', error));
  }, [token]);

  const signIn = useCallback(
    async (phone: string, password: string) => {
      const session = await customerApi.login(phone.trim(), password);
      await establishSession(session);
    },
    [establishSession],
  );

  const register = useCallback(
    async (input: {
      name: string;
      phone: string;
      email?: string;
      password: string;
    }) => {
      const session = await customerApi.register(input);
      await establishSession(session);
    },
    [establishSession],
  );

  const signOut = useCallback(async () => {
    const currentToken = token;
    setToken(null);
    setUser(null);
    await saveToken(null);
    if (currentToken) await customerApi.logout(currentToken).catch(() => undefined);
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    setUser(await customerApi.me(token));
  }, [token]);

  const updateUser = useCallback(
    async (input: Partial<CustomerUser>) => {
      if (!token) return;
      setUser(await customerApi.updateMe(token, input));
    },
    [token],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      signIn,
      register,
      signOut,
      refreshUser,
      updateUser,
    }),
    [loading, refreshUser, register, signIn, signOut, token, updateUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

