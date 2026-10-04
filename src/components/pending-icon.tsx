"use client";

import { useLinkStatus } from "next/link";
import { Loader2, type LucideIcon } from "lucide-react";

/**
 * Icon for use inside a next/link that swaps to a spinner while that link's navigation
 * is in progress. Used for links into analytics pages, which load without a skeleton
 * (a route-level loading boundary there drops rapid date-range switches).
 */
export function PendingIcon({ icon: Icon, className = "size-4" }: { icon: LucideIcon; className?: string }) {
  const { pending } = useLinkStatus();
  return pending ? (
    <Loader2 className={`${className} animate-spin`} aria-label="Loading" />
  ) : (
    <Icon className={className} aria-hidden="true" />
  );
}
