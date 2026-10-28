import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const PRODUCTION_API_URL = 'https://www.xgoo.in';

export const OFFICE_SLUG = process.env.EXPO_PUBLIC_OFFICE_SLUG || 'demo-office';

function hostFromExpo() {
  const extra = Constants.expoConfig?.extra as { debuggerHost?: string } | undefined;
  const candidates = [
    Constants.expoConfig?.hostUri,
    extra?.debuggerHost,
    Constants.linkingUri,
  ];
  for (const value of candidates) {
    if (!value) continue;
    const host = String(value)
      .replace(/^[a-z]+:\/\//i, '')
      .split('/')[0]
      .split(':')[0];
    if (host && !host.includes('exp.direct')) return host;
  }
  return null;
}

function developmentApiUrl() {
  const port = process.env.EXPO_PUBLIC_API_PORT || '3005';
  const host = hostFromExpo();
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${port}`;
  }
  if (Platform.OS === 'android') return `http://10.0.2.2:${port}`;
  return `http://localhost:${port}`;
}

export function getApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (configured) return configured;
  if (typeof __DEV__ !== 'undefined' && __DEV__) return developmentApiUrl();
  return PRODUCTION_API_URL;
}

export function normalizeMobilePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}
