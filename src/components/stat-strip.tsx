import clsx from "clsx";
import { formatNumber } from "@/lib/format";

export type Stat = { label: string; value: number; hint?: string; emphasis?: boolean };

/**
 * A single panel of figures. On phones the first two stats take half the width each
 * and the rest share a row; on wider screens they sit in one line.
 */
export function StatStrip({ stats }: { stats: Stat[] }) {
  const leading = stats.length - 3;
  return (
    <dl
      className={clsx(
        "grid grid-cols-6 overflow-hidden rounded-2xl bg-surface shadow-[inset_0_0_0_1px_var(--line)]",
        stats.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4",
      )}
    >
      {stats.map((stat, i) => {
        const isLeading = i < leading;
        const startsMobileRow = isLeading ? i % 2 === 0 : i === leading;
        return (
        <div
          key={stat.label}
          className={clsx(
            "border-line px-4 py-4 sm:px-5 sm:py-5 lg:col-span-1",
            isLeading ? (leading === 1 ? "col-span-6" : "col-span-3") : "col-span-2",
            isLeading && "border-b lg:border-b-0",
            !startsMobileRow && "border-l",
            i > 0 && "lg:border-l",
          )}
        >
          <dt className="text-sm text-muted">{stat.label}</dt>
          <dd
            className={clsx(
              "mt-1 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl",
              stat.emphasis && "text-route",
            )}
          >
            {formatNumber(stat.value)}
          </dd>
          {stat.hint && <p className="mt-0.5 text-xs text-faint">{stat.hint}</p>}
        </div>
        );
      })}
    </dl>
  );
}
