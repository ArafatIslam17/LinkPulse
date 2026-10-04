import Link from "next/link";
import { ShortenForm } from "@/components/shorten-form";
import { CopyButton } from "@/components/copy-button";
import { siteConfig } from "@/lib/config";
import { displayShortUrl, formatNumber, formatRelative, splitUrl } from "@/lib/format";
import { listLinks } from "@/lib/links";
import { getBaseUrl, getOwnerId, getTimezone } from "@/lib/request-context";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [baseUrl, ownerId, timeZone] = await Promise.all([getBaseUrl(), getOwnerId(), getTimezone()]);
  const recent = ownerId ? await listLinks(ownerId, 5) : [];
  const now = Date.now();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="max-w-3xl pt-12 pb-10 sm:pt-20">
        <h1 className="text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance sm:text-6xl">
          {siteConfig.tagline}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted text-pretty">
          Paste any link to get a short one you can share. Every click is counted, with referrers, devices, browsers
          and countries on a dashboard of their own.
        </p>
      </section>

      <section className="max-w-3xl" aria-label="Shorten a link">
        <ShortenForm displayHost={displayShortUrl(baseUrl)} timeZone={timeZone} />
      </section>

      {recent.length > 0 && (
        <section className="max-w-3xl pt-14 pb-20" aria-labelledby="recent-heading">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="recent-heading" className="text-lg font-semibold tracking-tight">
              Your recent links
            </h2>
            <Link href="/dashboard" className="rounded text-sm font-medium text-route hover:underline">
              See all in dashboard
            </Link>
          </div>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-[inset_0_0_0_1px_var(--line)]">
            {recent.map((link) => {
              const shortUrl = `${baseUrl}/${link.shortCode}`;
              const { host, rest } = splitUrl(link.originalUrl);
              return (
                <li key={link.shortCode} className="flex items-center gap-3 py-3 pr-3 pl-5">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/${link.shortCode}`}
                      className="block truncate font-mono text-[15px] font-medium hover:text-route"
                    >
                      {displayShortUrl(shortUrl)}
                    </Link>
                    <p className="truncate text-sm text-faint" title={link.originalUrl}>
                      {host}
                      {rest}
                    </p>
                  </div>
                  <div className="hidden text-right text-sm sm:block">
                    <div className="font-medium tabular-nums">{formatNumber(link.clickCount)} clicks</div>
                    <div className="text-faint">{formatRelative(link.createdAt, now)}</div>
                  </div>
                  <CopyButton value={shortUrl} label="Copy" variant="ghost" iconOnly />
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {recent.length === 0 && <div className="pb-20" />}
    </div>
  );
}
