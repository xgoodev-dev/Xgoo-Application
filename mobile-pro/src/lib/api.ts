import { Platform } from 'react-native';
import { getApiUrl, OFFICE_SLUG, normalizeMobilePhone } from '@/lib/server';

export { getApiUrl, OFFICE_SLUG, normalizeMobilePhone } from '@/lib/server';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export type CustomerUser = {
  id: string;
  officeId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  accountType?: 'individual' | 'business' | string | null;
};

export type BusinessProfile = {
  id?: string | null;
  companyName?: string | null;
  storeName?: string | null;
  storeType?: string | null;
  gstNumber?: string | null;
  pickupAddress?: string | null;
  pickupCity?: string | null;
  pickupState?: string | null;
  pickupPincode?: string | null;
  pickupPhone?: string | null;
  pickupTimeSlot?: string | null;
  pickupStyle?: 'standing' | 'on_demand' | string | null;
  billingCycle?: 'daily' | 'weekly' | 'monthly' | string | null;
  weekdays?: Record<string, boolean> | null;
  verificationStatus?: string | null;
  verificationNote?: string | null;
  applicationComplete?: boolean;
  verified?: boolean;
  ready?: boolean;
};

export type Destination = {
  id: string;
  name: string;
  phone: string;
  address: string;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  shipmentType?: string | null;
  destinationCountry?: string | null;
};

export type StoreOrder = {
  id: string;
  channel: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress?: string | null;
  receiverCity?: string | null;
  contentDescription?: string | null;
  weight?: string | number | null;
  numberOfPieces?: number | null;
  xgooOrderId?: string | null;
  status: string;
  bookingRequestId?: string | null;
};

export type TodayJob = {
  id: string;
  receiverName: string;
  receiverPhone?: string | null;
  receiverCity?: string | null;
  receiverAddress: string;
  contentDescription?: string | null;
  weight?: string | number | null;
  xgooOrderId?: string | null;
  status: 'planned' | 'skipped' | 'submitted' | string;
  bookingRequestId?: string | null;
};

export type TodayPayload = {
  pickupDay: boolean;
  pickupStyle?: 'standing' | 'on_demand';
  profile: BusinessProfile;
  jobs: TodayJob[];
};

export type BookingRow = {
  id: string;
  requestNumber: string;
  status: string;
  receiverName?: string;
  receiverCity?: string | null;
  senderCity?: string | null;
  xgooOrderId?: string | null;
  createdAt?: string | null;
  tracking?: { overallStatusLabel?: string; overallStatus?: string };
};

export type BillRow = {
  id: string;
  requestNumber: string;
  receiverName: string;
  amount: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | string;
  bookedAt?: string | null;
};

export type BillsPayload = {
  billingCycle: string;
  period: { label: string };
  outstandingTotal: string;
  paidTotal: string;
  outstandingCount: number;
  bills: BillRow[];
};

export type ReferralDashboard = {
  program: {
    isActive: boolean;
    commissionType: 'percent' | 'flat';
    commissionValue: string;
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

export type CoverageResult = {
  configured?: boolean;
  served?: boolean;
  message?: string;
};

async function api<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('x-customer-token', token);
  const client = Platform.OS === 'ios' ? 'mobile_ios' : 'mobile_android';
  headers.set('x-xgoo-client', client);

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(`Cannot reach XGoo Pro at ${getApiUrl()}. Check your internet connection.`, 0);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(payload?.message || 'Request failed', response.status);
  }
  return payload as T;
}

export type AuthSession = { token: string; user: CustomerUser };

export const proApi = {
  sendOtp: (phone: string, purpose: 'login' | 'register') =>
    api<{ success: boolean; debugOtp?: string }>(
      `/api/public/office/${OFFICE_SLUG}/customer/otp/send`,
      { method: 'POST', body: JSON.stringify({ phone: normalizeMobilePhone(phone), purpose }) },
    ),
  login: (input: { email?: string; phone?: string; password?: string; otp?: string }) =>
    api<AuthSession>(`/api/public/office/${OFFICE_SLUG}/customer/login`, {
      method: 'POST',
      body: JSON.stringify({ ...input, accountType: 'business' }),
    }),
  register: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) =>
    api<AuthSession>(`/api/public/office/${OFFICE_SLUG}/customer/register`, {
      method: 'POST',
      body: JSON.stringify({ ...input, phone: normalizeMobilePhone(input.phone), accountType: 'business' }),
    }),
  me: (token: string) => api<CustomerUser>('/api/customer/me', {}, token),
  logout: (token: string) => api<{ success: boolean }>('/api/customer/logout', { method: 'POST' }, token),
  registerPushToken: (token: string, input: { token: string; platform: 'android' | 'ios' }) =>
    api<{ id: string }>('/api/customer/push-token', { method: 'POST', body: JSON.stringify(input) }, token),
  coverage: (token: string) => api<CoverageResult>('/api/customer/service-coverage', {}, token),
  notifications: (token: string) =>
    api<Array<{ id: string; title: string; body: string; createdAt: string }>>(
      '/api/customer/notifications',
      {},
      token,
    ),
  profile: (token: string) => api<BusinessProfile>('/api/customer/business/profile', {}, token),
  saveProfile: (token: string, body: Record<string, unknown>) =>
    api<BusinessProfile>(
      '/api/customer/business/profile',
      { method: 'PATCH', body: JSON.stringify(body) },
      token,
    ),
  submitApplication: (token: string, body: Record<string, unknown>) =>
    api<BusinessProfile>(
      '/api/customer/business/application',
      { method: 'POST', body: JSON.stringify(body) },
      token,
    ),
  destinations: (token: string) => api<Destination[]>('/api/customer/business/destinations', {}, token),
  createDestination: (token: string, body: Record<string, unknown>) =>
    api<Destination>(
      '/api/customer/business/destinations',
      { method: 'POST', body: JSON.stringify(body) },
      token,
    ),
  deleteDestination: (token: string, id: string) =>
    api<{ success: boolean }>(`/api/customer/business/destinations/${id}`, { method: 'DELETE' }, token),
  orders: (token: string) => api<StoreOrder[]>('/api/customer/business/orders', {}, token),
  createOrder: (token: string, body: Record<string, unknown>) =>
    api<StoreOrder>('/api/customer/business/orders', { method: 'POST', body: JSON.stringify(body) }, token),
  queueOrderPickup: (token: string, id: string) =>
    api<StoreOrder>(`/api/customer/business/orders/${id}/pickup`, { method: 'POST', body: '{}' }, token),
  cancelOrder: (token: string, id: string) =>
    api<StoreOrder>(`/api/customer/business/orders/${id}/cancel`, { method: 'POST', body: '{}' }, token),
  today: (token: string, date: string) =>
    api<TodayPayload>(`/api/customer/business/today?date=${encodeURIComponent(date)}`, {}, token),
  addTodayJob: (token: string, body: Record<string, unknown>) =>
    api<TodayJob>('/api/customer/business/today/jobs', { method: 'POST', body: JSON.stringify(body) }, token),
  confirmToday: (token: string, date: string) =>
    api<{ success: boolean }>(
      '/api/customer/business/today/confirm',
      { method: 'POST', body: JSON.stringify({ date }) },
      token,
    ),
  bookings: (token: string) => api<BookingRow[]>('/api/customer/bookings', {}, token),
  booking: (token: string, id: string) =>
    api<{ request: BookingRow; tracking: Record<string, unknown> }>(
      `/api/customer/bookings/${id}`,
      {},
      token,
    ),
  bills: (token: string) => api<BillsPayload>('/api/customer/business/bills', {}, token),
  settleBills: (token: string, body: Record<string, unknown>) =>
    api<BillsPayload>(
      '/api/customer/business/bills/settle',
      { method: 'POST', body: JSON.stringify(body) },
      token,
    ),
  referral: (token: string) => api<ReferralDashboard>('/api/customer/referral', {}, token),
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

export function proAccessState(profile?: BusinessProfile | null) {
  if (!profile) return 'loading' as const;
  const complete = Boolean(
    profile.applicationComplete ??
      (profile.companyName?.trim() &&
        profile.storeName?.trim() &&
        profile.storeType?.trim() &&
        profile.gstNumber?.trim() &&
        profile.pickupAddress?.trim()),
  );
  if (!complete || profile.verificationStatus === 'rejected') return 'apply' as const;
  if (profile.verificationStatus !== 'approved') return 'pending' as const;
  return 'approved' as const;
}
