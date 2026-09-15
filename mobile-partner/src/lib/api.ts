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
  branchId: string;
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

async function request<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('x-pickup-token', token);
  const res = await fetch(`${getApiUrl()}${path}`, { ...init, headers });
  if (!res.ok) await parseError(res);
  return (await res.json()) as T;
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
  signup(input: PickupSignupInput) {
    return request<{ token: string; user: PickupPartner }>(
      `/api/public/office/${OFFICE_SLUG}/pickup/signup`,
      {
        method: 'POST',
        body: JSON.stringify({
          ...input,
          phone: normalizeMobilePhone(input.phone),
        }),
      },
    );
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
