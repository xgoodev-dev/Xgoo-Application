import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const PRODUCTION_API_URL = 'https://www.xgoo.in';

export const DEFAULT_API_URL = (
  process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL
).replace(/\/$/, '');

export const OFFICE_SLUG = process.env.EXPO_PUBLIC_OFFICE_SLUG || 'demo-office';

function hostnameOf(url: string) {
  try {
    return new URL(url.includes('://') ? url : `http://${url}`).hostname;
  } catch {
    return '';
  }
}

export function isPrivateLanUrl(url: string) {
  const host = hostnameOf(url);
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '10.0.2.2' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

export function getApiUrl() {
  const configured = DEFAULT_API_URL;
  const inExpoGo = Constants.appOwnership === 'expo' && Platform.OS !== 'web';
  // Expo Go on a phone cannot reach the PC when Metro/LAN is down.
  // Send OTP/login against production so WhatsApp still works.
  if (inExpoGo && isPrivateLanUrl(configured)) {
    return PRODUCTION_API_URL;
  }
  return configured;
}

export function normalizeMobilePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}
