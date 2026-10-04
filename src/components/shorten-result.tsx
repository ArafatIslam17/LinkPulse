"use client";

import Link from "next/link";
import { BarChart3, ExternalLink } from "lucide-react";
import type { LinkSummary } from "@/lib/links";
import { displayShortUrl, formatDate, formatNumber } from "@/lib/format";
import { CopyButton } from "./copy-button";
import { PendingIcon } from "./pending-icon";
import { buttonClass } from "./ui";

export function ShortenResult({
  link,
  shortUrl,
  timeZone,
}: {
  link: LinkSummary;
  shortUrl: string;
  timeZone: string;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl bg-surface shadow-[inset_0_0_0_1px_var(--line)]">
      <div className="relative px-5 pt-5 sm:px-6 sm:pt-6">
        <p className="truncate pr-6 font-mono text-sm text-faint" title={link.originalUrl}>
          {link.originalUrl}
        </p>
        {/* The hop: long URL lands on the short one. */}
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="my-1 h-6 w-28 text-route" aria-hidden="true">
          <path
            d="M2 2 C 2 20, 40 22, 96 20"
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            className="hop-path"
          />
        </svg>
        <a
          href={shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rise block break-all font-mono text-2xl font-medium tracking-tight text-route hover:underline sm:text-3xl"
        >
          {displayShortUrl(shortUrl)}
        </a>
      </div>

      <div className="rise mt-5 flex flex-wrap items-center gap-2 px-5 sm:px-6">
        <CopyButton value={shortUrl} label="Copy link" variant="primary" />
        <a href={shortUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary")}>
          <ExternalLink className="size-4" aria-hidden="true" />
          Open
        </a>
        <Link href={`/dashboard/${link.shortCode}`} className={buttonClass("ghost")}>
          <PendingIcon icon={BarChart3} />
          View analytics
        </Link>
      </div>

      <dl className="mt-5 grid grid-cols-2 border-t border-line text-sm sm:grid-cols-3">
        <div className="px-5 py-3.5 sm:px-6">
          <dt className="text-faint">Created</dt>
          <dd className="mt-0.5 font-medium">{formatDate(link.createdAt, timeZone)}</dd>
        </div>
        <div className="border-l border-line px-5 py-3.5 sm:px-6">
          <dt className="text-faint">Clicks</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{formatNumber(link.clickCount)}</dd>
        </div>
        <div className="col-span-2 border-t border-line px-5 py-3.5 sm:col-span-1 sm:border-t-0 sm:border-l sm:px-6">
          <dt className="text-faint">Type</dt>
          <dd className="mt-0.5 font-medium">{link.isCustom ? "Custom alias" : "Random code"}</dd>
        </div>
      </dl>
    </div>
  );
}
