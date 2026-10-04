import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { getDb } from "@/db";
import { links } from "@/db/schema";
import { linkRules } from "./config";
import { RESERVED_ALIASES } from "./validation";

// Lowercase letters and digits, minus look-alikes (0/o, 1/l/i), so codes are easy to read aloud.
const generateCode = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", linkRules.randomCodeLength);

export type LinkSummary = {
  shortCode: string;
  originalUrl: string;
  isCustom: boolean;
  clickCount: number;
  lastClickedAt: string | null;
  createdAt: string;
};

const summaryColumns = {
  shortCode: links.shortCode,
  originalUrl: links.originalUrl,
  isCustom: links.isCustom,
  clickCount: links.clickCount,
  lastClickedAt: links.lastClickedAt,
  createdAt: links.createdAt,
};

type SummaryRow = {
  shortCode: string;
  originalUrl: string;
  isCustom: boolean;
  clickCount: number;
  lastClickedAt: Date | null;
  createdAt: Date;
};

function toSummary(row: SummaryRow): LinkSummary {
  return {
    ...row,
    lastClickedAt: row.lastClickedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export class AliasTakenError extends Error {}

export async function createLink(input: {
  originalUrl: string;
  ownerId: string;
  alias: string | null;
}): Promise<LinkSummary> {
  const db = getDb();

  if (input.alias) {
    const [row] = await db
      .insert(links)
      .values({ shortCode: input.alias, originalUrl: input.originalUrl, ownerId: input.ownerId, isCustom: true })
      .onConflictDoNothing({ target: links.shortCode })
      .returning(summaryColumns);
    if (!row) throw new AliasTakenError();
    return toSummary(row);
  }

  // Collisions are astronomically rare with 7 characters, but retry just in case.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    if (RESERVED_ALIASES.has(code)) continue;
    const [row] = await db
      .insert(links)
      .values({ shortCode: code, originalUrl: input.originalUrl, ownerId: input.ownerId })
      .onConflictDoNothing({ target: links.shortCode })
      .returning(summaryColumns);
    if (row) return toSummary(row);
  }
  throw new Error("Could not generate a unique short code.");
}

export async function listLinks(ownerId: string, limit = 500): Promise<LinkSummary[]> {
  const rows = await getDb()
    .select(summaryColumns)
    .from(links)
    .where(eq(links.ownerId, ownerId))
    .orderBy(desc(links.createdAt))
    .limit(limit);
  return rows.map(toSummary);
}

export async function getOwnedLink(ownerId: string, shortCode: string) {
  const [row] = await getDb()
    .select({ id: links.id, ...summaryColumns })
    .from(links)
    .where(and(eq(links.ownerId, ownerId), eq(links.shortCode, shortCode)))
    .limit(1);
  return row ? { id: row.id, ...toSummary(row) } : null;
}

export async function deleteOwnedLink(ownerId: string, shortCode: string): Promise<boolean> {
  const deleted = await getDb()
    .delete(links)
    .where(and(eq(links.ownerId, ownerId), eq(links.shortCode, shortCode)))
    .returning({ id: links.id });
  return deleted.length > 0;
}

export async function findRedirectTarget(shortCode: string) {
  const [row] = await getDb()
    .select({ id: links.id, originalUrl: links.originalUrl })
    .from(links)
    .where(eq(links.shortCode, shortCode))
    .limit(1);
  return row ?? null;
}

/** Inserts the click and bumps the link's counter in a single round trip. */
export async function recordClick(click: {
  linkId: number;
  referrer: string | null;
  country: string | null;
  device: string;
  browser: string | null;
  os: string | null;
}) {
  await getDb().execute(sql`
    WITH inserted AS (
      INSERT INTO clicks (link_id, referrer, country, device, browser, os)
      VALUES (${click.linkId}, ${click.referrer}, ${click.country}, ${click.device}, ${click.browser}, ${click.os})
      RETURNING link_id, created_at
    )
    UPDATE links
    SET click_count = links.click_count + 1, last_clicked_at = inserted.created_at
    FROM inserted
    WHERE links.id = inserted.link_id
  `);
}
