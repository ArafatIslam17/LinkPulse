export const RANGES = [
  { value: "24h", label: "24 hours", long: "the last 24 hours" },
  { value: "7d", label: "7 days", long: "the last 7 days" },
  { value: "30d", label: "30 days", long: "the last 30 days" },
  { value: "all", label: "All time", long: "all time" },
] as const;

export type Range = (typeof RANGES)[number]["value"];

export const DEFAULT_RANGE: Range = "7d";

export function parseRange(value: string | string[] | undefined): Range {
  const v = Array.isArray(value) ? value[0] : value;
  return RANGES.some((r) => r.value === v) ? (v as Range) : DEFAULT_RANGE;
}

export type BucketUnit = "hour" | "day" | "week" | "month";
