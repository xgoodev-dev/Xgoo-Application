import { Platform } from 'react-native';
import {
  getApiUrl,
  isPrivateLanUrl,
  OFFICE_SLUG,
  PRODUCTION_API_URL,
  normalizeMobilePhone,
} from '@/lib/server';

export { getApiUrl, OFFICE_SLUG, normalizeMobilePhone } from '@/lib/server';

export function resolveMediaUrl(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const API_URL = getApiUrl();
  return `${API_URL}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

export type PickupSlot = {
  value: string;
  label: string;
  enabled: boolean;
};

export type PickupSettings = {
  slots: PickupSlot[];
  sameDayCutoffHour: number;
  cutoffNote: string;
};

export type AppBanner = {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  active?: boolean;
};

export type CustomerUser = {
  id: string;
  officeId: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
};

export type CustomerAddress = {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  lat?: string | null;
  lng?: string | null;
  addressType: 'sender' | 'receiver';
  isDefault?: boolean | null;
};

export type CustomerBooking = {
  id: string;
  requestNumber: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderCity?: string | null;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity?: string | null;
  weight: string;
  numberOfPieces: number;
  contentDescription: string;
  serviceType?: string | null;
  shipmentType?: string | null;
  destinationCountry?: string | null;
  status: string;
  createdAt: string;
  pickupLocationName?: string | null;
  pickupLat?: string | null;
  pickupLng?: string | null;
  tracking?: {
    overallStatus?: string;
    overallStatusLabel?: string;
    currentLocation?: string | null;
    progress?: number;
  };
};

export type CustomerNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, string | number | boolean | null> | null;
  readAt?: string | null;
  createdAt: string;
};

export type BookingPayload = {
  senderName: string;
  senderPhone: string;
  senderEmail?: string;
  senderAddress: string;
  senderCity?: string;
  senderState?: string;
  senderPincode?: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverCity?: string;
  receiverState?: string;
  receiverPincode?: string;
  weight: string;
  numberOfPieces: number;
  contentDescription: string;
  declaredValue?: string;
  serviceType: 'air' | 'surface';
  courierPreference?: string;
  shipmentType?: 'domestic' | 'international';
  destinationCountry?: string;
  notes?: string;
  pickupLat?: string | null;
  pickupLng?: string | null;
  pickupLocationName?: string | null;
  pickupDate?: string | null;
  pickupTimeSlot?: string | null;
  referralCode?: string | null;
};

export type ReferralDashboard = {
  program: {
    isActive: boolean;
    commissionType: 'percent' | 'flat';
    commissionValue: string;
    domesticCommissionValue?: string;
    internationalCommissionValue?: string;
    minPayoutAmount: string;
  };
  partner: null | {
    code: string;
    status: 'active' | 'suspended';
    sharePath: string;
    bankAccountName: string;
    bankAccountNumberMasked: string;
    bankIfsc: string;
    hasBank: boolean;
    totals: { pending: number; approved: number; paid: number };
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const REQUEST_TIMEOUT_MS = 18_000;

async function fetchApi<T>(
  baseUrl: string,
  path: string,
  options: RequestInit,
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('x-customer-token', token);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = Array.isArray(payload?.errors)
        ? payload.errors.map((item: { message?: string }) => item.message).filter(Boolean).join(', ')
        : null;
      throw new ApiError(detail || payload?.message || 'Request failed', response.status);
    }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new ApiError(
      aborted
        ? 'XGoo took too long to respond. Check your internet connection and try again.'
        : `Cannot reach XGoo Go at ${baseUrl}. Check your internet connection and try again.`,
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const API_URL = getApiUrl();
  try {
    return await fetchApi<T>(API_URL, path, options, token);
  } catch (error) {
    if (API_URL !== PRODUCTION_API_URL && isPrivateLanUrl(API_URL)) {
      return fetchApi<T>(PRODUCTION_API_URL, path, options, token);
    }
    throw error;
  }
}

export const customerApi = {
  sendOtp: (phone: string, purpose: 'login' | 'register') =>
    api<{
      success: boolean;
      phone: string;
      expiresInSec: number;
      channel: string;
      debugOtp?: string;
    }>(`/api/public/office/${OFFICE_SLUG}/customer/otp/send`, {
      method: 'POST',
      body: JSON.stringify({ phone: normalizeMobilePhone(phone), purpose }),
    }),
  login: (phone: string, otp: string) =>
    api<{ user: CustomerUser; token: string }>(
      `/api/public/office/${OFFICE_SLUG}/customer/login`,
      {
        method: 'POST',
        body: JSON.stringify({ phone: normalizeMobilePhone(phone), otp }),
      },
    ),
  register: (input: {
    name: string;
    phone: string;
    email?: string;
    otp: string;
  }) =>
    api<{ user: CustomerUser; token: string }>(
      `/api/public/office/${OFFICE_SLUG}/customer/register`,
      {
        method: 'POST',
        body: JSON.stringify({ ...input, phone: normalizeMobilePhone(input.phone) }),
      },
    ),
  me: (token: string) => api<CustomerUser>('/api/customer/me', {}, token),
  updateMe: (token: string, input: Partial<CustomerUser>) =>
    api<CustomerUser>(
      '/api/customer/me',
      { method: 'PATCH', body: JSON.stringify(input) },
      token,
    ),
  changePassword: (
    token: string,
    input: { currentPassword: string; newPassword: string },
  ) =>
    api<{ success: boolean }>(
      '/api/customer/password',
      { method: 'PATCH', body: JSON.stringify(input) },
      token,
    ),
  registerPushToken: (
    token: string,
    input: { token: string; platform: 'android' | 'ios' },
  ) =>
    api<{ id: string }>(
      '/api/customer/push-token',
      { method: 'POST', body: JSON.stringify(input) },
      token,
    ),
  notifications: (token: string) =>
    api<CustomerNotification[]>('/api/customer/notifications', {}, token),
  markNotificationsRead: (token: string, id?: string) =>
    api<{ success: boolean }>(
      '/api/customer/notifications/read',
      { method: 'PATCH', body: JSON.stringify(id ? { id } : {}) },
      token,
    ),
  logout: (token: string) =>
    api<{ success: boolean }>('/api/customer/logout', { method: 'POST' }, token),
  bookings: (token: string) =>
    api<CustomerBooking[]>('/api/customer/bookings', {}, token),
  booking: (token: string, id: string) =>
    api<{
      request: CustomerBooking;
      shipment: Record<string, unknown> | null;
      tracking: Record<string, unknown>;
    }>(`/api/customer/bookings/${id}`, {}, token),
  createBooking: (token: string, input: BookingPayload) =>
    api<{ success: boolean; requestNumber: string; message: string }>(
      '/api/customer/bookings',
      {
        method: 'POST',
        headers: {
          'x-xgoo-client':
            Platform.OS === 'ios' ? 'mobile_ios' : 'mobile_android',
        },
        body: JSON.stringify(input),
      },
      token,
    ),
  searchPlaces: (query: string) =>
    api<
      Array<{
        lat: number;
        lng: number;
        displayName: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
        country?: string;
      }>
    >(`/api/maps/geocode?q=${encodeURIComponent(query)}&limit=6`),
  pickupSettings: () =>
    api<PickupSettings>(`/api/public/office/${OFFICE_SLUG}/pickup-settings`),
  appBanners: () =>
    api<{ banners: AppBanner[] }>(`/api/public/office/${OFFICE_SLUG}/app-banners`),
  addresses: (token: string) =>
    api<CustomerAddress[]>('/api/customer/addresses', {}, token),
  createAddress: (
    token: string,
    input: Omit<CustomerAddress, 'id'>,
  ) =>
    api<CustomerAddress>(
      '/api/customer/addresses',
      { method: 'POST', body: JSON.stringify(input) },
      token,
    ),
  updateAddress: (
    token: string,
    id: string,
    input: Partial<CustomerAddress>,
  ) =>
    api<CustomerAddress>(
      `/api/customer/addresses/${id}`,
      { method: 'PATCH', body: JSON.stringify(input) },
      token,
    ),
  deleteAddress: (token: string, id: string) =>
    api<{ success: boolean }>(
      `/api/customer/addresses/${id}`,
      { method: 'DELETE' },
      token,
    ),
  referral: (token: string) =>
    api<ReferralDashboard>('/api/customer/referral', {}, token),
  joinReferral: (token: string) =>
    api<ReferralDashboard>('/api/customer/referral/join', { method: 'POST' }, token),
  saveReferralBank: (
    token: string,
    input: { bankAccountName: string; bankAccountNumber: string; bankIfsc: string },
  ) =>
    api<ReferralDashboard>(
      '/api/customer/referral/bank',
      { method: 'PATCH', body: JSON.stringify(input) },
      token,
    ),
};

