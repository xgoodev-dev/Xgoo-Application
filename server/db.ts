import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

/**
 * Vercel/serverless: keep the pool tiny so we do not exhaust the DB connection limit.
 * Long-lived Node (Docker, VPS): default pg pool sizing is fine.
 */
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

/**
 * Passwords with @, #, etc. break postgres URLs unless encoded.
 * Split on the last @ so user:password can contain @.
 */
export function normalizePostgresUrl(raw: string): string {
  const trimmed = raw.trim();
  const protoMatch = trimmed.match(/^(postgres(?:ql)?:\/\/)(.+)$/i);
  if (!protoMatch) return trimmed;

  const rest = protoMatch[2];
  const atIndex = rest.lastIndexOf("@");
  if (atIndex === -1) return trimmed;

  const userinfo = rest.slice(0, atIndex);
  const hostpart = rest.slice(atIndex + 1);
  const colonIndex = userinfo.indexOf(":");
  if (colonIndex === -1) return trimmed;

  const user = userinfo.slice(0, colonIndex);
  const password = userinfo.slice(colonIndex + 1);
  let decodedPassword = password;
  try {
    decodedPassword = decodeURIComponent(password);
  } catch {
    decodedPassword = password;
  }
  const encodedPassword = encodeURIComponent(decodedPassword);

  return `${protoMatch[1]}${user}:${encodedPassword}@${hostpart}`;
}

export function getDatabaseHost(connectionString: string): string {
  try {
    return new URL(normalizePostgresUrl(connectionString)).hostname;
  } catch {
    return "unknown";
  }
}

function buildSupabasePoolerUrl(): string | null {
  const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const poolerHost = process.env.SUPABASE_POOLER_HOST?.trim();

  if (!projectRef || !password || !poolerHost) return null;

  const encodedPassword = encodeURIComponent(password);
  return `postgresql://postgres.${projectRef}:${encodedPassword}@${poolerHost}:6543/postgres`;
}

function resolveDatabaseUrl(): string {
  const candidates = [
    isServerless ? process.env.DATABASE_POOL_URL : undefined,
    buildSupabasePoolerUrl(),
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.DATABASE_POOL_URL,
  ];

  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return normalizePostgresUrl(trimmed);
  }

  throw new Error(
    "DATABASE_URL must be set. On Vercel with Supabase, use DATABASE_POOL_URL (pooler port 6543) or set SUPABASE_PROJECT_REF + SUPABASE_DB_PASSWORD + SUPABASE_POOLER_HOST.",
  );
}

const connectionString = resolveDatabaseUrl();
export const databaseHost = getDatabaseHost(connectionString);

/** Local dev typically does not use TLS; managed Postgres (Supabase, Neon, Railway, etc.) requires it. */
function isLocalDatabase(url: string): boolean {
  return (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("0.0.0.0")
  );
}

const pool = new Pool({
  connectionString,
  max: isServerless ? 1 : 10,
  idleTimeoutMillis: isServerless ? 5000 : 30000,
  connectionTimeoutMillis: isServerless ? 15000 : 20000,
  // Supabase / PgBouncer transaction pooler on serverless requires prepared statements off.
  ...(isServerless ? { allowExitOnIdle: true, prepare: false as const } : {}),
  ...(isLocalDatabase(connectionString)
    ? {}
    : {
        ssl: { rejectUnauthorized: false },
      }),
});

pool.on("error", (err) => {
  console.error("Unexpected Postgres pool error:", err);
});

export { pool };

export const db = drizzle(pool, { schema });

export async function verifyDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
