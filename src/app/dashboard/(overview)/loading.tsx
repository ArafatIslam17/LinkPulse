import { Skeleton } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-3 mb-6 h-5 w-72 max-w-full" />
      <Skeleton className="h-36 w-full rounded-2xl lg:h-28" />
      <div className="mt-6 space-y-px overflow-hidden rounded-2xl">
        <Skeleton className="h-16 w-full rounded-none" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-none opacity-70" />
        ))}
      </div>
    </div>
  );
}
