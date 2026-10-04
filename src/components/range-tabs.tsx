"use client";

import type { ReactNode } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import { RANGES, type Range } from "@/lib/ranges";

function TabLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return (
    <>
      {label}
      {pending && <Loader2 className="ml-1.5 size-3.5 animate-spin" aria-label="Loading" />}
    </>
  );
}

/**
 * Date range switcher. Plain links, so it works before hydration and with middle-click;
 * the current view stays on screen while the next range loads.
 */
export function RangeTabs({ value, children }: { value: Range; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <nav
        aria-label="Date range"
        className="grid grid-cols-4 gap-1 rounded-xl bg-surface p-1 shadow-[inset_0_0_0_1px_var(--line)] sm:inline-grid"
      >
        {RANGES.map((r) => {
          const active = r.value === value;
          return (
            <Link
              key={r.value}
              href={`${pathname}?range=${r.value}`}
              replace
              scroll={false}
              prefetch={false}
              aria-current={active ? "true" : undefined}
              className={clsx(
                "flex min-h-10 items-center justify-center rounded-lg px-1.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-4",
                active ? "bg-ink text-bg" : "text-muted hover:bg-surface-2 hover:text-ink",
              )}
            >
              <TabLabel label={r.label} />
            </Link>
          );
        })}
      </nav>
      <div className="mt-5">{children}</div>
    </div>
  );
}
