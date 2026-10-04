import {
  bigserial,
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const links = pgTable(
  "links",
  {
    id: serial("id").primaryKey(),
    shortCode: varchar("short_code", { length: 64 }).notNull(),
    originalUrl: text("original_url").notNull(),
    // Anonymous browser owner today. Swap for a user id when auth is added.
    ownerId: varchar("owner_id", { length: 64 }).notNull(),
    isCustom: boolean("is_custom").notNull().default(false),
    clickCount: integer("click_count").notNull().default(0),
    lastClickedAt: timestamp("last_clicked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("links_short_code_idx").on(t.shortCode),
    index("links_owner_created_idx").on(t.ownerId, t.createdAt),
  ],
);

export const clicks = pgTable(
  "clicks",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    linkId: integer("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // Referrer hostname only; paths and query strings can carry personal data.
    referrer: varchar("referrer", { length: 255 }),
    country: varchar("country", { length: 2 }),
    device: varchar("device", { length: 16 }).notNull().default("desktop"),
    browser: varchar("browser", { length: 48 }),
    os: varchar("os", { length: 48 }),
  },
  (t) => [
    index("clicks_link_created_idx").on(t.linkId, t.createdAt),
    index("clicks_created_idx").on(t.createdAt),
  ],
);

// Fixed-window counters for rate limiting link creation. Keys are salted hashes, never raw IPs.
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: varchar("key", { length: 64 }).notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);

export type Link = typeof links.$inferSelect;
export type Click = typeof clicks.$inferSelect;
