export const DEFAULT_API_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://www.xgoo.in'
).replace(/\/$/, '');

export const OFFICE_SLUG = process.env.EXPO_PUBLIC_OFFICE_SLUG || 'demo-office';

export function getApiUrl() {
  return DEFAULT_API_URL;
}

export function normalizeMobilePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}
