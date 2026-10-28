import { getApiUrl, OFFICE_SLUG, normalizeMobilePhone } from '@/lib/server';

export { getApiUrl, OFFICE_SLUG, normalizeMobilePhone } from '@/lib/server';

export type PickupPartner = {
  id: string;
  officeId: string;
  branchId?: string | null;
  name: string;
  phone: string;
  address?: string | null;
  govtIdType?: string | null;
  govtIdNumber?: string | null;
  signupSource?: string | null;
  status: string;
  availability: 'offline' | 'available' | 'busy' | string;
  hasPassword?: boolean;
  storeName?: string | null;
};

export type PickupStore = {
  id: string;
  name: string;
  city?: string | null;
};

export type PickupSignupInput = {
  name: string;
  phone: string;
  password: string;
  address: string;
  govtIdType: 'aadhaar' | 'pan' | 'driving_license' | 'voter_id';
  govtIdNumber: string;
};

export type PickupSignupResult = {
  pending: true;
  message: string;
};

export type PickupFuelRate = {
  officeId: string;
  vehicleType: string;
  mileageKmPerLitre: string;
  fuelPricePerLitre: string;
};

export type PickupShift = {
  id: string;
  status: 'open' | 'closed' | string;
  startedAt: string;
  endedAt?: string | null;
  durationMinutes: number;
  distanceKm: string;
  fuelLitres: string;
  fuelCost: string;
  mileageKmPerLitre?: string | null;
  fuelPricePerLitre?: string | null;
};

export type PickupFuelClaim = {
  id: string;
  shiftId: string;
  distanceKm: string;
  fuelLitres: string;
  amount: string;
  status: 'requested' | 'approved' | 'rejected' | 'paid' | string;
  notes?: string | null;
  reviewNotes?: string | null;
  requestedAt?: string | null;
  paidAt?: string | null;
};

export type PickupDutySnapshot = {
  rate: PickupFuelRate;
  current: PickupShift | null;
  shifts: PickupShift[];
  claims: PickupFuelClaim[];
};

export type PickupJob = {
  id: string;
  status: string;
  actualWeight?: string | null;
  actualPieces?: number | null;
  actualContents?: string | null;
  inspectionNotes?: string | null;
  inspectionPhotoUrls?: string[] | null;
  awbNumber?: string | null;
  request?: {
    id: string;
    requestNumber: string;
    senderName: string;
    senderPhone: string;
    senderAddress: string;
    senderCity?: string | null;
    receiverName: string;
    receiverCity?: string | null;
    pickupLocationName?: string | null;
    pickupLat?: string | null;
    pickupLng?: string | null;
    receiverAddress?: string | null;
    receiverAddressLine2?: string | null;
    receiverPincode?: string | null;
    shipmentType?: string | null;
    weight?: string | null;
    numberOfPieces?: number | null;
    contentDescription?: string | null;
  } | null;
  quotation?: {
    id: string;
    quotationNumber: string;
    totalAmount: string;
    status: string;
    acceptToken?: string | null;
  } | null;
  shipment?: {
    id: string;
    bookingNumber: string;
    awbNumber?: string | null;
  } | null;
  storeVisit?: {
    isBusinessStore: boolean;
    parcels: Array<{
      id: string;
      status: string;
      requestNumber: string;
      receiverName: string;
      receiverCity?: string | null;
      quotationAmount?: string | null;
      quotationStatus?: string | null;
    }>;
  };
};

async function parseError(res: Response) {
  const body = await res.json().catch(() => ({}));
  throw new Error((body as { message?: string }).message || `Request failed (${res.status})`);
}

const REQUEST_TIMEOUT_MS = 18_000;

function isCanceledFetch(error: unknown) {
  if (!(error instanceof Error)) return false;
  const text = `${error.name} ${error.message}`.toLowerCase();
  return (
    error.name === 'AbortError' ||
    text.includes('abort') ||
    text.includes('canceled') ||
    text.includes('cancelled')
  );
}

function isNetworkFetch(error: unknown) {
  if (!(error instanceof Error)) return false;
  const text = `${error.name} ${error.message}`.toLowerCase();
  return (
    isCanceledFetch(error) ||
    error.name === 'TypeError' ||
    text.includes('network') ||
    text.includes('failed to fetch') ||
    text.includes('fetch failed')
  );
}

async function request<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const apiUrl = getApiUrl();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('x-pickup-token', token);

  const run = async () => {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), REQUEST_TIMEOUT_MS);
    });
    const res = await Promise.race([
      fetch(`${apiUrl}${path}`, { ...init, headers }),
      timeout,
    ]);
    if (!res.ok) await parseError(res);
    return (await res.json()) as T;
  };

  try {
    return await run();
  } catch (firstError) {
    let error: unknown = firstError;
    if (isCanceledFetch(firstError)) {
      try {
        return await run();
      } catch (retryError) {
        error = retryError;
      }
    }
    if (error instanceof Error && error.message === 'timeout') {
      throw new Error('XGoo took too long to respond. Check your internet connection and try again.');
    }
    if (isNetworkFetch(error)) {
      throw new Error(`Cannot reach XGoo Pickup at ${apiUrl}. Check your internet connection and try again.`);
    }
    throw error;
  }
}

export const pickupApi = {
  sendOtp(phone: string) {
    return request<{ debugOtp?: string; expiresInSec: number }>(
      `/api/public/office/${OFFICE_SLUG}/pickup/otp`,
      { method: 'POST', body: JSON.stringify({ phone: normalizeMobilePhone(phone) }) },
    );
  },
  stores() {
    return request<PickupStore[]>(`/api/public/office/${OFFICE_SLUG}/pickup/stores`);
  },
  async signup(input: PickupSignupInput) {
    const stores = await pickupApi.stores().catch(() => [] as PickupStore[]);
    const result = await request<PickupSignupResult & { token?: string }>(
      `/api/public/office/${OFFICE_SLUG}/pickup/signup`,
      {
        method: 'POST',
        body: JSON.stringify({
          ...input,
          phone: normalizeMobilePhone(input.phone),
          ...(stores[0]?.id ? { branchId: stores[0].id } : {}),
        }),
      },
    );
    return {
      pending: true as const,
      message:
        result.message ||
        'Request sent. Hub will assign a store and activate your account. You can then sign in with password or OTP.',
    };
  },
  loginWithPassword(phone: string, password: string) {
    return request<{ token: string; user: PickupPartner }>(
      `/api/public/office/${OFFICE_SLUG}/pickup/login-password`,
      { method: 'POST', body: JSON.stringify({ phone: normalizeMobilePhone(phone), password }) },
    );
  },
  login(phone: string, otp: string) {
    return request<{ token: string; user: PickupPartner }>(
      `/api/public/office/${OFFICE_SLUG}/pickup/login`,
      { method: 'POST', body: JSON.stringify({ phone: normalizeMobilePhone(phone), otp }) },
    );
  },
  me(token: string) {
    return request<PickupPartner>('/api/pickup/me', {}, token);
  },
  updateMe(token: string, input: Partial<Pick<PickupPartner, 'availability' | 'name'>> & { password?: string }) {
    return request<PickupPartner>('/api/pickup/me', { method: 'PATCH', body: JSON.stringify(input) }, token);
  },
  logout(token: string) {
    return request<{ success: boolean }>('/api/pickup/logout', { method: 'POST' }, token);
  },
  duty(token: string) {
    return request<PickupDutySnapshot>('/api/pickup/duty', {}, token);
  },
  startDuty(token: string) {
    return request<PickupShift>('/api/pickup/duty/start', { method: 'POST', body: JSON.stringify({}) }, token);
  },
  pingDuty(
    token: string,
    points: Array<{ lat: number; lng: number; accuracy?: number; recordedAt?: string }>,
  ) {
    return request<PickupShift>(
      '/api/pickup/duty/ping',
      { method: 'POST', body: JSON.stringify({ points }) },
      token,
    );
  },
  stopDuty(token: string, point?: { lat: number; lng: number }) {
    return request<{ shift: PickupShift | null }>(
      '/api/pickup/duty/stop',
      { method: 'POST', body: JSON.stringify(point || {}) },
      token,
    );
  },
  requestFuel(token: string, shiftId: string, notes?: string) {
    return request<PickupFuelClaim>(
      '/api/pickup/fuel/claims',
      { method: 'POST', body: JSON.stringify({ shiftId, notes }) },
      token,
    );
  },
  registerPushToken(token: string, input: { token: string; platform: string }) {
    return request('/api/pickup/push-token', { method: 'POST', body: JSON.stringify(input) }, token);
  },
  jobs(token: string, bucket: 'new' | 'active' | 'history' | 'all' = 'all') {
    return request<PickupJob[]>(`/api/pickup/jobs?bucket=${bucket}`, {}, token);
  },
  job(token: string, id: string) {
    return request<PickupJob>(`/api/pickup/jobs/${id}`, {}, token);
  },
  action(token: string, id: string, action: string, body?: Record<string, unknown>) {
    return request<PickupJob>(
      `/api/pickup/jobs/${id}/${action}`,
      { method: 'POST', body: JSON.stringify(body || {}) },
      token,
    );
  },
};
