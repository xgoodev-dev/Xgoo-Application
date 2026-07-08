import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

/**
 * Vercel/serverless: keep the pool tiny so we do not exhaust the DB connection limit.
 * Long-lived Node (Docker, VPS): default pg pool sizing is fine.
 */
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

function resolveDatabaseUrl(): string {
  const candidates = [
    isServerless ? process.env.DATABASE_POOL_URL : undefined,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.DATABASE_POOL_URL,
  ];

  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }

  throw new Error(
    "DATABASE_URL must be set. On Vercel, add DATABASE_URL (or DATABASE_POOL_URL for Supabase pooler) in Project Settings → Environment Variables.",
  );
}

const connectionString = resolveDatabaseUrl();

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
  connectionTimeoutMillis: isServerless ? 10000 : 20000,
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
