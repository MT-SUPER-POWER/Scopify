import { Skeleton } from "@/components/ui/skeleton";

export function LoadingHeaderSkeleton() {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <Skeleton className="bg-skeleton size-10 rounded-full" />
        <Skeleton className="bg-skeleton size-10 rounded-full" />
      </div>
      <div className="flex flex-1 justify-center">
        <Skeleton className="bg-skeleton h-10 w-full max-w-100 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="bg-skeleton hidden size-9 rounded-full lg:block" />
        <Skeleton className="bg-skeleton size-9 rounded-full" />
        <Skeleton className="bg-skeleton size-9 rounded-full" />
      </div>
    </div>
  );
}

export function LoadingSidebarSkeleton() {
  return (
    <aside className="bg-surface-sunken flex min-h-0 w-20 shrink-0 flex-col overflow-hidden rounded-lg p-3 lg:w-1/5 lg:p-4">
      <div className="mb-7 flex h-9 items-center gap-3">
        <div className="bg-surface border-border text-content flex size-9 items-center justify-center rounded-full border text-xs font-semibold">
          N
        </div>
        <Skeleton className="bg-skeleton hidden h-4 w-24 lg:block" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex h-9 items-center gap-3 rounded-md px-1">
            <Skeleton className="bg-skeleton size-5 shrink-0 rounded-md" />
            <Skeleton className="bg-skeleton hidden h-3 lg:block lg:w-20" />
          </div>
        ))}
      </div>

      <div className="bg-skeleton-subtle my-6 h-px" />
      <Skeleton className="bg-skeleton mb-3 hidden h-3 w-20 lg:block" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-1">
            <Skeleton className="bg-skeleton size-8 shrink-0 rounded-md" />
            <div className="hidden min-w-0 flex-1 space-y-1.5 lg:block">
              <Skeleton className="bg-skeleton h-3 w-4/5" />
              <Skeleton className="bg-skeleton-subtle h-2 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function LoadingPlayerBarSkeleton() {
  return (
    <footer className="bg-surface-elevated flex h-17 items-center gap-4 rounded-lg px-4 lg:h-20 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
        <Skeleton className="bg-skeleton size-12 shrink-0 rounded-md lg:size-14" />
        <div className="min-w-0 space-y-2">
          <Skeleton className="bg-skeleton h-3 w-28 lg:w-40" />
          <Skeleton className="bg-skeleton-subtle h-2.5 w-20 lg:w-28" />
        </div>
      </div>

      <div className="hidden w-1/3 max-w-120 flex-col items-center gap-2 md:flex">
        <div className="flex items-center gap-4">
          <Skeleton className="bg-skeleton size-4 rounded-full" />
          <Skeleton className="bg-skeleton size-5 rounded-full" />
          <Skeleton className="bg-skeleton size-9 rounded-full" />
          <Skeleton className="bg-skeleton size-5 rounded-full" />
          <Skeleton className="bg-skeleton size-4 rounded-full" />
        </div>
        <Skeleton className="bg-skeleton h-1 w-full rounded-full" />
      </div>

      <div className="hidden flex-1 justify-end gap-3 lg:flex">
        <Skeleton className="bg-skeleton size-5 rounded-md" />
        <Skeleton className="bg-skeleton size-5 rounded-md" />
        <Skeleton className="bg-skeleton h-1.5 w-20 self-center rounded-full" />
      </div>
    </footer>
  );
}
