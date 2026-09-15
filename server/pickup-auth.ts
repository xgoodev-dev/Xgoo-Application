import bcrypt from "bcryptjs";
import type { Branch, Office, PickupGovtIdType, PickupPartner } from "@shared/schema";
import { PICKUP_GOVT_ID_TYPES } from "@shared/schema";
import { normalizePickupPhone } from "./pickup-otp";
import { storage } from "./storage";

const PASSWORD_MIN_LENGTH = 8;

export type PublicPickupPartner = Omit<PickupPartner, "passwordHash"> & {
  hasPassword: boolean;
  storeName: string | null;
};

export function pickupGovtIdLabel(type: PickupGovtIdType | null | undefined) {
  switch (type) {
    case "aadhaar":
      return "Aadhaar";
    case "pan":
      return "PAN";
    case "driving_license":
      return "Driving licence";
    case "voter_id":
      return "Voter ID";
    case null:
    case undefined:
      return "Government ID";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function assertPickupPassword(password: string) {
  if (password.trim().length < PASSWORD_MIN_LENGTH) {
    throw Object.assign(new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`), {
      status: 400,
    });
  }
}

export async function hashPickupPassword(password: string) {
  assertPickupPassword(password);
  return bcrypt.hash(password, 10);
}

export async function verifyPickupPassword(password: string, passwordHash: string | null | undefined) {
  if (!passwordHash) {
    throw Object.assign(new Error("This partner does not have a password yet. Ask the store to set one, or use OTP."), {
      status: 401,
    });
  }
  const matches = await bcrypt.compare(password, passwordHash);
  if (!matches) {
    throw Object.assign(new Error("Incorrect mobile number or password."), { status: 401 });
  }
}

export function assertGovtId(input: { govtIdType: string; govtIdNumber: string }) {
  if (!PICKUP_GOVT_ID_TYPES.includes(input.govtIdType as (typeof PICKUP_GOVT_ID_TYPES)[number])) {
    throw Object.assign(new Error("Choose a valid government ID type."), { status: 400 });
  }
  const number = input.govtIdNumber.replace(/\s+/g, "").toUpperCase();
  if (number.length < 4) {
    throw Object.assign(new Error("Enter the government ID number."), { status: 400 });
  }
  return { govtIdType: input.govtIdType, govtIdNumber: number };
}

export async function assignSoleStoreIfNeeded(partner: PickupPartner) {
  if (partner.branchId) return partner;
  const stores = await storage.getBranchesByOffice(partner.officeId);
  if (stores.length !== 1) return partner;
  return (await storage.updatePickupPartner(partner.id, { branchId: stores[0].id })) ?? partner;
}

export async function toPublicPickupPartner(partner: PickupPartner): Promise<PublicPickupPartner> {
  const store = partner.branchId ? await storage.getBranch(partner.branchId) : undefined;
  const { passwordHash, ...safe } = partner;
  return {
    ...safe,
    hasPassword: Boolean(passwordHash),
    storeName: store?.name ?? null,
  };
}

export async function requireOfficeStore(office: Office, branchId: string | null | undefined): Promise<Branch> {
  if (!branchId) {
    throw Object.assign(new Error("Assign this pickup partner to a store."), { status: 400 });
  }
  const branch = await storage.getBranch(branchId);
  if (!branch || branch.officeId !== office.id) {
    throw Object.assign(new Error("Choose a valid store for this pickup partner."), { status: 400 });
  }
  return branch;
}

export async function createPickupPartnerAccount(input: {
  office: Office;
  branchId: string;
  name: string;
  phone: string;
  password: string;
  address: string;
  govtIdType: string;
  govtIdNumber: string;
  signupSource: "hub" | "self";
}) {
  const phone = normalizePickupPhone(input.phone);
  if (phone.length < 10) {
    throw Object.assign(new Error("Enter a valid 10-digit mobile number."), { status: 400 });
  }
  await requireOfficeStore(input.office, input.branchId);
  const existing = await storage.getPickupPartnerByPhone(input.office.id, phone);
  if (existing) {
    throw Object.assign(new Error("A pickup partner with this mobile number already exists."), {
      status: 400,
    });
  }
  const govt = assertGovtId(input);
  const passwordHash = await hashPickupPassword(input.password);
  return storage.createPickupPartner({
    officeId: input.office.id,
    branchId: input.branchId,
    name: input.name.trim(),
    phone,
    passwordHash,
    address: input.address.trim(),
    govtIdType: govt.govtIdType,
    govtIdNumber: govt.govtIdNumber,
    signupSource: input.signupSource,
    status: "active",
    availability: "offline",
  });
}
