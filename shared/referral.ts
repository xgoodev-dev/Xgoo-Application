export const REFERRAL_CODE_MIN = 4;
export const REFERRAL_CODE_MAX = 16;
export const DEFAULT_REFERRAL_COMMISSION_PERCENT = "5";
export const DEFAULT_REFERRAL_MIN_PAYOUT = "100";

export const REFERRAL_COMMISSION_TYPES = ["percent", "flat"] as const;
export const REFERRAL_PARTNER_STATUSES = ["active", "suspended"] as const;
export const REFERRAL_EARNING_STATUSES = ["pending", "approved", "paid", "void"] as const;

export type ReferralCommissionType = (typeof REFERRAL_COMMISSION_TYPES)[number];
export type ReferralPartnerStatus = (typeof REFERRAL_PARTNER_STATUSES)[number];
export type ReferralEarningStatus = (typeof REFERRAL_EARNING_STATUSES)[number];

export function normalizeReferralCode(raw: string | null | undefined): string {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, REFERRAL_CODE_MAX);
}

export function isValidReferralCode(raw: string | null | undefined): boolean {
  const code = normalizeReferralCode(raw);
  return code.length >= REFERRAL_CODE_MIN && code.length <= REFERRAL_CODE_MAX;
}

export function lastTenPhoneDigits(phone: string | null | undefined): string {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}

export function generateReferralCode(name: string): string {
  const letters = String(name || "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `XG${letters}${rand}`.slice(0, REFERRAL_CODE_MAX);
}

export function referralSharePath(code: string): string {
  return `/r/${encodeURIComponent(normalizeReferralCode(code))}`;
}

export function formatReferralRupees(value: string | number | null | undefined): string {
  const amount = Number.parseFloat(String(value ?? "0"));
  if (!Number.isFinite(amount)) return "₹0";
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function calculateReferralCommission(input: {
  quoteAmount: string | number;
  commissionType: ReferralCommissionType;
  commissionValue: string | number;
}): number {
  const quote = Number.parseFloat(String(input.quoteAmount || "0"));
  const rate = Number.parseFloat(String(input.commissionValue || "0"));
  if (!Number.isFinite(quote) || quote <= 0 || !Number.isFinite(rate) || rate <= 0) {
    return 0;
  }
  switch (input.commissionType) {
    case "percent":
      return Math.round(((quote * rate) / 100) * 100) / 100;
    case "flat":
      return Math.round(Math.min(rate, quote) * 100) / 100;
    default: {
      const _exhaustive: never = input.commissionType;
      return _exhaustive;
    }
  }
}

export function maskBankAccountNumber(accountNumber: string | null | undefined): string {
  const digits = String(accountNumber || "").replace(/\D/g, "");
  if (digits.length < 4) return "";
  return `${"•".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}
