"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import type { BucketUnit } from "@/lib/ranges";
import { formatNumber } from "@/lib/format";

type Point = { bucket: string; clicks: number };

// Buckets arrive as local wall-clock times ("2026-10-05T14:00:00"); parse them as UTC
// and format in UTC so the label shows exactly that wall-clock time.
function parseBucket(bucket: string) {
  return new Date(`${bucket}Z`);
}

function tickLabel(bucket: string, unit: BucketUnit) {
  const d = parseBucket(bucket);
  if (unit === "hour") return d.toLocaleTimeString("en-US", { hour: "numeric", timeZone: "UTC" });
  if (unit === "month") return d.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function fullLabel(bucket: string, unit: BucketUnit) {
  const d = parseBucket(bucket);
  switch (unit) {
    case "hour":
      return d.toLocaleString("en-US", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "UTC",
      });
    case "week":
      return `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}`;
    case "month":
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    default:
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  }
}

function ChartTooltip({ active, payload, unit }: TooltipContentProps<number, string> & { unit: BucketUnit }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as Point;
  return (
    <div className="rounded-lg bg-ink px-3 py-2 text-sm text-bg shadow-lg">
      <div className="opacity-75">{fullLabel(point.bucket, unit)}</div>
      <div className="font-semibold tabular-nums">
        {formatNumber(point.clicks)} {point.clicks === 1 ? "click" : "clicks"}
      </div>
    </div>
  );
}

export function TrendChart({ data, unit }: { data: Point[]; unit: BucketUnit }) {
  const max = Math.max(...data.map((d) => d.clicks), 0);
  // Show fewer ticks on dense series so labels never collide.
  const interval = data.length > 14 ? Math.ceil(data.length / 7) - 1 : data.length > 8 ? 1 : 0;

  return (
    <div>
      <div className="h-64 w-full sm:h-72" role="img" aria-label="Clicks over time chart. A data table follows.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="0" />
            <XAxis
              dataKey="bucket"
              tickFormatter={(b: string) => tickLabel(b, unit)}
              interval={interval}
              tickLine={false}
              axisLine={{ stroke: "var(--line)" }}
              tick={{ fill: "var(--faint)", fontSize: 12 }}
              tickMargin={8}
              minTickGap={8}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, max === 0 ? 4 : "auto"]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--faint)", fontSize: 12 }}
              width={44}
              tickFormatter={(v: number) => formatNumber(v)}
            />
            <Tooltip
              cursor={{ fill: "var(--surface-2)" }}
              content={(props) => <ChartTooltip {...(props as TooltipContentProps<number, string>)} unit={unit} />}
              isAnimationActive={false}
            />
            <Bar dataKey="clicks" fill="var(--route)" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>Clicks over time</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Clicks</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.bucket}>
              <td>{fullLabel(d.bucket, unit)}</td>
              <td>{d.clicks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
