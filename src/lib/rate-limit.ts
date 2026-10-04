import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { rateLimitRules } from "./config";

/**
 * Fixed-window rate limiter backed by Postgres, so it holds across serverless instances.
 * Returns true when the request is allowed.
 */
export async function consumeRateLimit(key: string): Promise<boolean> {
  const db = getDb();
  const { limit, windowSeconds } = rateLimitRules;
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000);

  const result = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, window_start, count)
    VALUES (${key}, ${windowStart.toISOString()}, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
    RETURNING count
  `);

  // Occasionally clear out expired windows instead of running a cron job.
  if (Math.random() < 0.05) {
    await db.execute(sql`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`);
  }

  return Number(result.rows[0]?.count ?? 0) <= limit;
}
