import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { LinksTable } from "@/components/links-table";
import { StatStrip } from "@/components/stat-strip";
import { buttonClass } from "@/components/ui";
import { getOverviewStats } from "@/lib/analytics";
import { listLinks } from "@/lib/links";
import { getBaseUrl, getOwnerId, getTimezone } from "@/lib/request-context";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your short links and how often they've been clicked.",
  robots: { index: false },
};

export default async function DashboardPage() {
  const [ownerId, baseUrl, timeZone] = await Promise.all([getOwnerId(), getBaseUrl(), getTimezone()]);
  const [stats, links] = ownerId
    ? await Promise.all([getOverviewStats(ownerId, timeZone), listLinks(ownerId)])
    : [{ totalLinks: 0, totalClicks: 0, today: 0, week: 0, month: 0 }, []];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted">Every link you&apos;ve shortened in this browser.</p>
        </div>
        <Link href="/" className={buttonClass("primary")}>
          <Plus className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">New link</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      <StatStrip
        stats={[
          { label: "Total links", value: stats.totalLinks },
          { label: "Total clicks", value: stats.totalClicks, emphasis: true },
          { label: "Today", value: stats.today },
          { label: "This week", value: stats.week },
          { label: "This month", value: stats.month },
        ]}
      />

      <div className="mt-6">
        <LinksTable links={links} baseUrl={baseUrl} timeZone={timeZone} now={Date.now()} />
      </div>
    </div>
  );
}
