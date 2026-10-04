import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import type { BucketUnit, Range } from "./ranges";

export type PeriodCounts = { today: number; week: number; month: number };

export type OverviewStats = PeriodCounts & { totalLinks: number; totalClicks: number };

const localNow = (tz: string) => sql`(now() AT TIME ZONE ${tz})`;
// Start of the current day/week/month in the viewer's timezone, as an absolute timestamp.
const periodStart = (unit: "day" | "week" | "month", tz: string) =>
  sql`(date_trunc(${unit}, ${localNow(tz)}) AT TIME ZONE ${tz})`;

function periodFilters(tz: string) {
  return sql`
    count(*) FILTER (WHERE c.created_at >= ${periodStart("day", tz)})::int AS today,
    count(*) FILTER (WHERE c.created_at >= ${periodStart("week", tz)})::int AS week,
    count(*) FILTER (WHERE c.created_at >= ${periodStart("month", tz)})::int AS month
  `;
}

const earliestPeriod = (tz: string) =>
  sql`LEAST(${periodStart("week", tz)}, ${periodStart("month", tz)})`;

export async function getOverviewStats(ownerId: string, tz: string): Promise<OverviewStats> {
  const { rows } = await getDb().execute<OverviewStats>(sql`
    WITH owned AS (
      SELECT id, click_count FROM links WHERE owner_id = ${ownerId}
    ),
    periods AS (
      SELECT ${periodFilters(tz)}
      FROM clicks c
      WHERE c.link_id IN (SELECT id FROM owned)
        AND c.created_at >= ${earliestPeriod(tz)}
    )
    SELECT
      (SELECT count(*)::int FROM owned) AS "totalLinks",
      (SELECT coalesce(sum(click_count), 0)::int FROM owned) AS "totalClicks",
      periods.today, periods.week, periods.month
    FROM periods
  `);
  return rows[0];
}

export async function getLinkPeriodCounts(linkId: number, tz: string): Promise<PeriodCounts> {
  const { rows } = await getDb().execute<PeriodCounts>(sql`
    SELECT ${periodFilters(tz)}
    FROM clicks c
    WHERE c.link_id = ${linkId} AND c.created_at >= ${earliestPeriod(tz)}
  `);
  return rows[0];
}

type Window = { unit: BucketUnit; startLocal: SQL; step: string };

function resolveWindow(range: Range, tz: string, linkCreatedAt: Date): Window {
  const now = localNow(tz);
  switch (range) {
    case "24h":
      return { unit: "hour", startLocal: sql`date_trunc('hour', ${now}) - interval '23 hours'`, step: "1 hour" };
    case "7d":
      return { unit: "day", startLocal: sql`date_trunc('day', ${now}) - interval '6 days'`, step: "1 day" };
    case "30d":
      return { unit: "day", startLocal: sql`date_trunc('day', ${now}) - interval '29 days'`, step: "1 day" };
    case "all": {
      const ageDays = (Date.now() - linkCreatedAt.getTime()) / 86_400_000;
      const unit: BucketUnit = ageDays <= 120 ? "day" : ageDays <= 730 ? "week" : "month";
      // Always show at least a week of history so a brand-new link doesn't render as a single bar.
      const created = sql`(${linkCreatedAt.toISOString()}::timestamptz AT TIME ZONE ${tz})`;
      const startLocal =
        unit === "day"
          ? sql`LEAST(date_trunc('day', ${created}), date_trunc('day', ${now}) - interval '6 days')`
          : sql`date_trunc(${unit}, ${created})`;
      return { unit, startLocal, step: `1 ${unit}` };
    }
  }
}

export type TrendPoint = { bucket: string; clicks: number };
export type BreakdownItem = { label: string; clicks: number };
export type LinkAnalytics = {
  unit: BucketUnit;
  rangeTotal: number;
  trend: TrendPoint[];
  referrers: BreakdownItem[];
  devices: BreakdownItem[];
  browsers: BreakdownItem[];
  os: BreakdownItem[];
  countries: BreakdownItem[];
};

export async function getLinkAnalytics(
  linkId: number,
  range: Range,
  tz: string,
  linkCreatedAt: Date,
): Promise<LinkAnalytics> {
  const db = getDb();
  const { unit, startLocal, step } = resolveWindow(range, tz, linkCreatedAt);
  const rangeStart = sql`((${startLocal}) AT TIME ZONE ${tz})`;

  const trendQuery = db.execute<TrendPoint>(sql`
    WITH series AS (
      SELECT generate_series(${startLocal}, date_trunc(${unit}, ${localNow(tz)}), ${step}::interval) AS bucket
    ),
    counts AS (
      SELECT date_trunc(${unit}, created_at AT TIME ZONE ${tz}) AS bucket, count(*)::int AS clicks
      FROM clicks
      WHERE link_id = ${linkId} AND created_at >= ${rangeStart}
      GROUP BY 1
    )
    SELECT to_char(series.bucket, 'YYYY-MM-DD"T"HH24:MI:SS') AS bucket, coalesce(counts.clicks, 0) AS clicks
    FROM series LEFT JOIN counts USING (bucket)
    ORDER BY series.bucket
  `);

  // One scan of the range produces every breakdown.
  const breakdownQuery = db.execute<{
    dimension: "referrer" | "device" | "browser" | "os" | "country";
    label: string | null;
    clicks: number;
  }>(sql`
    SELECT
      CASE
        WHEN GROUPING(referrer) = 0 THEN 'referrer'
        WHEN GROUPING(device) = 0 THEN 'device'
        WHEN GROUPING(browser) = 0 THEN 'browser'
        WHEN GROUPING(os) = 0 THEN 'os'
        ELSE 'country'
      END AS dimension,
      COALESCE(referrer, device, browser, os, country) AS label,
      count(*)::int AS clicks
    FROM clicks
    WHERE link_id = ${linkId} AND created_at >= ${rangeStart}
    GROUP BY GROUPING SETS ((referrer), (device), (browser), (os), (country))
  `);

  const [trend, breakdown] = await Promise.all([trendQuery, breakdownQuery]);

  const groups: Record<string, BreakdownItem[]> = { referrer: [], device: [], browser: [], os: [], country: [] };
  for (const row of breakdown.rows) {
    groups[row.dimension].push({ label: row.label ?? "", clicks: Number(row.clicks) });
  }
  const sorted = (items: BreakdownItem[], emptyLabel: string) =>
    items
      .map((i) => ({ ...i, label: i.label || emptyLabel }))
      .sort((a, b) => b.clicks - a.clicks || a.label.localeCompare(b.label));

  const devices = sorted(groups.device, "Other");

  return {
    unit,
    rangeTotal: devices.reduce((sum, d) => sum + d.clicks, 0),
    trend: trend.rows.map((r) => ({ bucket: r.bucket, clicks: Number(r.clicks) })),
    referrers: sorted(groups.referrer, "Direct"),
    devices,
    browsers: sorted(groups.browser, "Unknown"),
    os: sorted(groups.os, "Unknown"),
    countries: sorted(groups.country, "Unknown"),
  };
}
