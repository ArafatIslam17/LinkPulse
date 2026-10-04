import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { envInt } from "@/lib/config";
import * as schema from "./schema";

type Db = NodePgDatabase<typeof schema>;

// Reuse one pool per server instance (and across hot reloads in development).
const globalForDb = globalThis as unknown as { pool?: Pool; db?: Db };

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  const pool = new Pool({
    connectionString,
    max: envInt("DATABASE_POOL_MAX", 5),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  // Lets Vercel Fluid compute release idle connections before a function instance is suspended.
  attachDatabasePool(pool);
  return pool;
}

export function getDb(): Db {
  if (!globalForDb.db) {
    globalForDb.pool ??= createPool();
    globalForDb.db = drizzle(globalForDb.pool, { schema });
  }
  return globalForDb.db;
}

export { schema };
