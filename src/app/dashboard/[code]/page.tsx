import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MousePointerClick } from "lucide-react";
import { BreakdownList } from "@/components/charts/breakdown-list";
import { TrendChart } from "@/components/charts/trend-chart";
import { CopyButton } from "@/components/copy-button";
import { LinkHeaderActions } from "@/components/link-header-actions";
import { RangeTabs } from "@/components/range-tabs";
import { StatStrip } from "@/components/stat-strip";
import { EmptyState, Panel } from "@/components/ui";
import { getLinkAnalytics, getLinkPeriodCounts } from "@/lib/analytics";
import { countryFlag, countryName, displayShortUrl, formatDate, formatNumber, formatRelative } from "@/lib/format";
import { getOwnedLink } from "@/lib/links";
import { RANGES, parseRange } from "@/lib/ranges";
import { getBaseUrl, getOwnerId, getTimezone } from "@/lib/request-context";
import { normalizeCode } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ range?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return { title: `Analytics for /${normalizeCode(code) ?? code}`, robots: { index: false } };
}

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet",
  other: "Other",
};

export default async function LinkAnalyticsPage({ params, searchParams }: Props) {
  const code = normalizeCode((await params).code);
  const range = parseRange((await searchParams).range);
  const [ownerId, baseUrl, timeZone] = await Promise.all([getOwnerId(), getBaseUrl(), getTimezone()]);
  if (!code || !ownerId) notFound();

  const link = await getOwnedLink(ownerId, code);
  if (!link) notFound();

  const shortUrl = `${baseUrl}/${link.shortCode}`;
  const hasClicks = link.clickCount > 0;
  const [periods, analytics] = hasClicks
    ? await Promise.all([
        getLinkPeriodCounts(link.id, timeZone),
        getLinkAnalytics(link.id, range, timeZone, new Date(link.createdAt)),
      ])
    : [{ today: 0, week: 0, month: 0 }, null];

  const rangeLabel = RANGES.find((r) => r.value === range)!.long;
  const noneInRange = `No clicks in ${rangeLabel}.`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href="/dashboard"
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Dashboard
      </Link>

      <header className="mt-2 mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-mono text-2xl font-medium tracking-tight break-all sm:text-3xl">
            {displayShortUrl(shortUrl)}
          </h1>
          <p className="mt-2 flex min-w-0 items-center gap-2 text-sm text-muted">
            <span className="shrink-0">Goes to</span>
            <a
              href={link.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-ink hover:text-route hover:underline"
              title={link.originalUrl}
            >
              {link.originalUrl}
            </a>
          </p>
          <p className="mt-1 text-sm text-faint">
            Created {formatDate(link.createdAt, timeZone)}
            {link.lastClickedAt && `, last clicked ${formatRelative(link.lastClickedAt)}`}
          </p>
        </div>
        <LinkHeaderActions shortCode={link.shortCode} shortUrl={shortUrl} />
      </header>

      <StatStrip
        stats={[
          { label: "Total clicks", value: link.clickCount, emphasis: true },
          { label: "Today", value: periods.today },
          { label: "This week", value: periods.week },
          { label: "This month", value: periods.month },
        ]}
      />

      {!analytics ? (
        <Panel className="mt-6">
          <EmptyState
            icon={<MousePointerClick className="size-5" />}
            title="No clicks yet"
            action={<CopyButton value={shortUrl} label="Copy short link" variant="primary" />}
          >
            Share your short link to start collecting analytics.
          </EmptyState>
        </Panel>
      ) : (
        <div className="mt-8">
          <RangeTabs value={range}>
            <Panel className="p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-semibold tracking-tight">Clicks over time</h2>
                <p className="text-sm text-muted">
                  <span className="font-semibold text-ink tabular-nums">{formatNumber(analytics.rangeTotal)}</span>{" "}
                  {analytics.rangeTotal === 1 ? "click" : "clicks"} in {rangeLabel}
                </p>
              </div>
              <TrendChart data={analytics.trend} unit={analytics.unit} />
            </Panel>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <BreakdownList
                title="Top referrers"
                items={analytics.referrers}
                total={analytics.rangeTotal}
                emptyText={noneInRange}
              />
              <BreakdownList
                title="Countries"
                items={analytics.countries}
                total={analytics.rangeTotal}
                emptyText={noneInRange}
                renderLabel={(code) =>
                  code === "Unknown" || code === "Other" ? (
                    code
                  ) : (
                    <>
                      <span aria-hidden="true" className="mr-1.5">
                        {countryFlag(code)}
                      </span>
                      {countryName(code)}
                    </>
                  )
                }
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <BreakdownList
                title="Devices"
                items={analytics.devices}
                total={analytics.rangeTotal}
                emptyText={noneInRange}
                renderLabel={(d) => DEVICE_LABELS[d] ?? d}
              />
              <BreakdownList
                title="Browsers"
                items={analytics.browsers}
                total={analytics.rangeTotal}
                emptyText={noneInRange}
              />
              <BreakdownList
                title="Operating systems"
                items={analytics.os}
                total={analytics.rangeTotal}
                emptyText={noneInRange}
              />
            </div>
            <p className="mt-4 text-xs text-faint">
              Country comes from the hosting edge and isn&apos;t available in local development. Bots and link
              previews are not counted.
            </p>
          </RangeTabs>
        </div>
      )}
    </div>
  );
}
