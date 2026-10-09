import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { sql } from "drizzle-orm";
import { db, pool } from "./db";

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_PHOTOS = 3;

function cameraSecret(): string {
  return (
    process.env.EXTENSION_AUTOFILL_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    "xgoo-dev-autofill-v1"
  );
}

export function issueCameraDraftToken(draftId: string): string {
  const body = Buffer.from(
    JSON.stringify({ d: draftId, e: Date.now() + TOKEN_TTL_MS }),
    "utf8",
  ).toString("base64url");
  const sig = createHmac("sha256", cameraSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyCameraDraftToken(token: string, draftId: string): boolean {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return false;
  const [body, sig] = parts;
  const expected = createHmac("sha256", cameraSecret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      d?: string;
      e?: number;
    };
    if (parsed.d !== draftId) return false;
    if (typeof parsed.e !== "number" || parsed.e < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

let schemaReady: Promise<void> | null = null;

export function ensureBookingCameraDrafts() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS booking_camera_drafts (
          id varchar PRIMARY KEY,
          office_id varchar NOT NULL,
          user_id varchar NOT NULL,
          photos jsonb NOT NULL DEFAULT '[]'::jsonb,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now(),
          expires_at timestamptz NOT NULL
        )
      `);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

export type CameraDraft = {
  id: string;
  officeId: string;
  photos: string[];
  expiresAt: Date;
};

function parsePhotos(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export async function createCameraDraft(officeId: string, userId: string): Promise<{
  id: string;
  token: string;
  expiresAt: string;
}> {
  await ensureBookingCameraDrafts();
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await pool.query(
    `INSERT INTO booking_camera_drafts (id, office_id, user_id, photos, expires_at)
     VALUES ($1, $2, $3, '[]'::jsonb, $4)`,
    [id, officeId, userId, expiresAt.toISOString()],
  );
  return { id, token: issueCameraDraftToken(id), expiresAt: expiresAt.toISOString() };
}

export async function getCameraDraft(id: string): Promise<CameraDraft | null> {
  await ensureBookingCameraDrafts();
  const result = await pool.query<{
    id: string;
    office_id: string;
    photos: unknown;
    expires_at: Date;
  }>(
    `SELECT id, office_id, photos, expires_at FROM booking_camera_drafts WHERE id = $1 LIMIT 1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return {
    id: row.id,
    officeId: row.office_id,
    photos: parsePhotos(row.photos),
    expiresAt: new Date(row.expires_at),
  };
}

export async function appendCameraDraftPhoto(id: string, objectPath: string): Promise<string[]> {
  const draft = await getCameraDraft(id);
  if (!draft) {
    const error = new Error("This camera session has expired. Open New Booking again.");
    (error as Error & { status: number }).status = 410;
    throw error;
  }
  if (draft.photos.includes(objectPath)) return draft.photos;
  if (draft.photos.length >= MAX_PHOTOS) {
    const error = new Error("This booking already has 3 package photos.");
    (error as Error & { status: number }).status = 400;
    throw error;
  }
  const next = [...draft.photos, objectPath];
  await pool.query(
    `UPDATE booking_camera_drafts
     SET photos = $2::jsonb, updated_at = now()
     WHERE id = $1`,
    [id, JSON.stringify(next)],
  );
  return next;
}

export const BOOKING_CAMERA_MAX_PHOTOS = MAX_PHOTOS;
