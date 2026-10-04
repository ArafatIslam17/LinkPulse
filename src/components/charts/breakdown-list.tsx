import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";
import type { BreakdownItem } from "@/lib/analytics";

const MAX_ROWS = 6;

/** Folds the long tail into "Other" so the list stays scannable. */
function topWithOther(items: BreakdownItem[]): BreakdownItem[] {
  if (items.length <= MAX_ROWS) return items;
  const head = items.slice(0, MAX_ROWS - 1);
  const rest = items.slice(MAX_ROWS - 1).reduce((sum, i) => sum + i.clicks, 0);
  return [...head, { label: "Other", clicks: rest }];
}

/**
 * Ranked horizontal bars. Length encodes count; the label and number are always printed,
 * so the list doubles as its own data table.
 */
export function BreakdownList({
  title,
  items,
  total,
  renderLabel,
  emptyText,
}: {
  title: string;
  items: BreakdownItem[];
  total: number;
  renderLabel?: (label: string) => ReactNode;
  emptyText: string;
}) {
  const rows = topWithOther(items);
  const max = Math.max(...rows.map((r) => r.clicks), 1);

  return (
    <section className="rounded-2xl bg-surface p-5 shadow-[inset_0_0_0_1px_var(--line)]" aria-label={title}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {rows.length > 0 && <span className="text-xs text-faint">Clicks</span>}
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const share = total > 0 ? Math.round((row.clicks / total) * 100) : 0;
            return (
              <li key={row.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate" title={row.label}>
                    {renderLabel ? renderLabel(row.label) : row.label}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    <span className="font-semibold">{formatNumber(row.clicks)}</span>
                    <span className="ml-2 inline-block w-9 text-right text-faint">{share}%</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-surface-2" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-route"
                    style={{ width: `${Math.max((row.clicks / max) * 100, 2)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
