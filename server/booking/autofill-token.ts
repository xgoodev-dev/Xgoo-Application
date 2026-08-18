import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

function autofillSecret(): string {
  return (
    process.env.EXTENSION_AUTOFILL_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    "xgoo-dev-autofill-v1"
  );
}

export function issueAutofillToken(shipmentId: string): string {
  const body = Buffer.from(
    JSON.stringify({ s: shipmentId, e: Date.now() + TOKEN_TTL_MS }),
    "utf8",
  ).toString("base64url");
  const sig = createHmac("sha256", autofillSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyAutofillToken(token: string, shipmentId: string): boolean {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return false;
  const [body, sig] = parts;
  const expected = createHmac("sha256", autofillSecret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      s?: string;
      e?: number;
    };
    if (parsed.s !== shipmentId) return false;
    if (typeof parsed.e !== "number" || parsed.e < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}
