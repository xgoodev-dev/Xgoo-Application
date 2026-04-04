import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;

/** Local dev typically does not use TLS; managed Postgres (Supabase, Neon, Railway, etc.) requires it. */
function isLocalDatabase(url: string): boolean {
  return (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("0.0.0.0")
  );
}

/**
 * Vercel/serverless: keep the pool tiny so we do not exhaust the DB connection limit.
 * Long-lived Node (Docker, VPS): default pg pool sizing is fine.
 */
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const pool = new Pool({
  connectionString,
  max: isServerless ? 1 : 10,
  idleTimeoutMillis: isServerless ? 5000 : 30000,
  connectionTimeoutMillis: 20000,
  ...(isLocalDatabase(connectionString)
    ? {}
    : {
        ssl: { rejectUnauthorized: false },
      }),
});

export { pool };
export const db = drizzle(pool, { schema });
