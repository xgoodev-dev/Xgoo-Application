import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

const palettes = {
  light: {
    mode: 'light' as const,
    background: '#F6F7F9',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    surfaceMuted: '#F0F1F3',
    text: '#161719',
    textMuted: '#71717A',
    border: '#E4E4E7',
    accent: '#FF4907',
    accentSoft: '#FFF0EA',
    success: '#16A34A',
    info: '#0284C7',
    danger: '#DC2626',
    tab: '#FFFFFF',
    shadow: '#000000',
  },
  dark: {
    mode: 'dark' as const,
    background: '#0E0F11',
    surface: '#17181B',
    surfaceRaised: '#1E2024',
    surfaceMuted: '#27292E',
    text: '#FAFAFA',
    textMuted: '#A1A1AA',
    border: '#303238',
    accent: '#FF4907',
    accentSoft: '#351A10',
    success: '#4ADE80',
    info: '#38BDF8',
    danger: '#F87171',
    tab: '#151619',
    shadow: '#000000',
  },
};

export type AppPalette = (typeof palettes)[keyof typeof palettes];

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: AppPalette;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'xgoo-mobile-theme';

export function AppThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
    });
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark,
      colors: isDark ? palettes.dark : palettes.light,
      setMode,
      toggle: () => setMode(isDark ? 'light' : 'dark'),
    }),
    [isDark, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return value;
}

