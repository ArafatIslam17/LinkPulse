"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, ExternalLink, Link2, Search, Trash2 } from "lucide-react";
import type { LinkSummary } from "@/lib/links";
import { displayShortUrl, formatDate, formatNumber, formatRelative, splitUrl } from "@/lib/format";
import { CopyButton } from "./copy-button";
import { PendingIcon } from "./pending-icon";
import { DeleteLinkDialog } from "./delete-link-dialog";
import { EmptyState, Panel, buttonClass } from "./ui";

type Props = { links: LinkSummary[]; baseUrl: string; timeZone: string; now: number };

function OriginalUrl({ url }: { url: string }) {
  const { host, rest } = splitUrl(url);
  return (
    <span className="flex min-w-0 text-sm" title={url}>
      <span className="shrink-0 text-ink">{host}</span>
      <span className="truncate text-faint">{rest}</span>
      <span className="sr-only">{url}</span>
    </span>
  );
}

function LinkActions({
  link,
  shortUrl,
  onDelete,
}: {
  link: LinkSummary;
  shortUrl: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <CopyButton value={shortUrl} label="Copy" variant="ghost" iconOnly />
      <a
        href={shortUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass("ghost", "icon")}
        aria-label={`Open ${displayShortUrl(shortUrl)} in a new tab`}
        title="Open"
      >
        <ExternalLink className="size-4" aria-hidden="true" />
      </a>
      <Link
        href={`/dashboard/${link.shortCode}`}
        className={buttonClass("ghost", "icon")}
        aria-label={`View analytics for ${displayShortUrl(shortUrl)}`}
        title="View analytics"
      >
        <PendingIcon icon={BarChart3} />
      </Link>
      <button
        type="button"
        onClick={onDelete}
        className={buttonClass("ghost", "icon", "hover:bg-danger-soft hover:text-danger")}
        aria-label={`Delete ${displayShortUrl(shortUrl)}`}
        title="Delete"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function LinksTable({ links, baseUrl, timeZone, now }: Props) {
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<LinkSummary | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return links;
    return links.filter((l) => l.shortCode.includes(q) || l.originalUrl.toLowerCase().includes(q));
  }, [links, query]);

  const shortUrlOf = (l: LinkSummary) => `${baseUrl}/${l.shortCode}`;
  const lastClicked = (l: LinkSummary) => (l.lastClickedAt ? formatRelative(l.lastClickedAt, now) : "Never");

  if (links.length === 0) {
    return (
      <Panel>
        <EmptyState
          icon={<Link2 className="size-5" />}
          title="No links yet"
          action={
            <Link href="/" className={buttonClass("primary")}>
              Create your first link
            </Link>
          }
        >
          Links you shorten in this browser appear here with their click counts.
        </EmptyState>
      </Panel>
    );
  }

  return (
    <Panel aria-labelledby="links-heading">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <h2 id="links-heading" className="text-base font-semibold tracking-tight">
          Links <span className="font-normal text-faint tabular-nums">{links.length}</span>
        </h2>
        <label className="relative block sm:w-72">
          <span className="sr-only">Search links</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by alias or URL"
            className="min-h-11 w-full rounded-xl bg-bg pr-3 pl-10 text-base shadow-[inset_0_0_0_1px_var(--line)] outline-none placeholder:text-faint focus:shadow-[inset_0_0_0_2px_var(--route)] sm:text-sm"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted">No links match &ldquo;{query}&rdquo;.</p>
      ) : (
        <>
          {/* Desktop and tablet: table */}
          <div className="hidden md:block">
            <table className="w-full table-fixed text-left">
              <thead className="text-xs text-faint">
                <tr className="border-b border-line">
                  <th scope="col" className="w-[30%] px-5 py-3 font-medium">Short link</th>
                  <th scope="col" className="px-3 py-3 font-medium">Destination</th>
                  <th scope="col" className="w-20 px-3 py-3 text-right font-medium">Clicks</th>
                  <th scope="col" className="hidden w-32 px-3 py-3 font-medium lg:table-cell">Last click</th>
                  <th scope="col" className="hidden w-28 px-3 py-3 font-medium xl:table-cell">Created</th>
                  <th scope="col" className="w-48 px-3 py-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((link) => {
                  const shortUrl = shortUrlOf(link);
                  return (
                    <tr key={link.shortCode} className="hover:bg-surface-2/50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/dashboard/${link.shortCode}`}
                          className="block truncate font-mono text-sm font-medium hover:text-route"
                          title={shortUrl}
                        >
                          /{link.shortCode}
                        </Link>
                        <span className="text-xs text-faint">{link.isCustom ? "Custom alias" : "Random code"}</span>
                      </td>
                      <td className="px-3 py-3">
                        <OriginalUrl url={link.originalUrl} />
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums">
                        {formatNumber(link.clickCount)}
                      </td>
                      <td className="hidden px-3 py-3 text-sm text-muted lg:table-cell">{lastClicked(link)}</td>
                      <td className="hidden px-3 py-3 text-sm text-muted xl:table-cell">
                        {formatDate(link.createdAt, timeZone)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end">
                          <LinkActions link={link} shortUrl={shortUrl} onDelete={() => setDeleting(link)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phones: cards */}
          <ul className="divide-y divide-line md:hidden">
            {filtered.map((link) => {
              const shortUrl = shortUrlOf(link);
              return (
                <li key={link.shortCode} className="px-4 pt-4 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/${link.shortCode}`}
                        className="block truncate font-mono text-base font-medium"
                      >
                        /{link.shortCode}
                      </Link>
                      <div className="mt-1">
                        <OriginalUrl url={link.originalUrl} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-lg font-semibold tabular-nums">{formatNumber(link.clickCount)}</div>
                      <div className="text-xs text-faint">clicks</div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-faint">
                    Created {formatDate(link.createdAt, timeZone)}, last click {lastClicked(link).toLowerCase()}
                  </p>
                  <div className="-ml-2.5 mt-1">
                    <LinkActions link={link} shortUrl={shortUrl} onDelete={() => setDeleting(link)} />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {deleting && (
        <DeleteLinkDialog
          shortCode={deleting.shortCode}
          displayUrl={displayShortUrl(shortUrlOf(deleting))}
          open
          onClose={() => setDeleting(null)}
        />
      )}
    </Panel>
  );
}
