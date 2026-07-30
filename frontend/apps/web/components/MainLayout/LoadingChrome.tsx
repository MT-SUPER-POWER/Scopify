import { Skeleton } from "@/components/ui/skeleton";

export function LoadingHeaderSkeleton() {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <Skeleton className="size-10 rounded-full bg-white/8" />
        <Skeleton className="size-10 rounded-full bg-white/8" />
      </div>
      <div className="flex flex-1 justify-center">
        <Skeleton className="h-10 w-full max-w-100 rounded-full bg-white/8" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="hidden size-9 rounded-full bg-white/8 lg:block" />
        <Skeleton className="size-9 rounded-full bg-white/8" />
        <Skeleton className="size-9 rounded-full bg-white/8" />
      </div>
    </div>
  );
}

export function LoadingSidebarSkeleton() {
  return (
    <aside className="flex min-h-0 w-20 shrink-0 flex-col overflow-hidden rounded-lg bg-[#0f0f0f] p-3 lg:w-1/5 lg:p-4">
      <div className="mb-7 flex h-9 items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-black text-xs font-semibold text-white">
          N
        </div>
        <Skeleton className="hidden h-4 w-24 bg-white/8 lg:block" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex h-9 items-center gap-3 rounded-md px-1">
            <Skeleton className="size-5 shrink-0 rounded-md bg-white/8" />
            <Skeleton className="hidden h-3 bg-white/8 lg:block lg:w-20" />
          </div>
        ))}
      </div>

      <div className="my-6 h-px bg-white/6" />
      <Skeleton className="mb-3 hidden h-3 w-20 bg-white/8 lg:block" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-1">
            <Skeleton className="size-8 shrink-0 rounded-md bg-white/8" />
            <div className="hidden min-w-0 flex-1 space-y-1.5 lg:block">
              <Skeleton className="h-3 w-4/5 bg-white/8" />
              <Skeleton className="h-2 w-1/2 bg-white/6" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function LoadingPlayerBarSkeleton() {
  return (
    <footer className="flex h-17 items-center gap-4 rounded-lg bg-[#181818] px-4 lg:h-20 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
        <Skeleton className="size-12 shrink-0 rounded-md bg-white/8 lg:size-14" />
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-3 w-28 bg-white/8 lg:w-40" />
          <Skeleton className="h-2.5 w-20 bg-white/6 lg:w-28" />
        </div>
      </div>

      <div className="hidden w-1/3 max-w-120 flex-col items-center gap-2 md:flex">
        <div className="flex items-center gap-4">
          <Skeleton className="size-4 rounded-full bg-white/8" />
          <Skeleton className="size-5 rounded-full bg-white/8" />
          <Skeleton className="size-9 rounded-full bg-white/10" />
          <Skeleton className="size-5 rounded-full bg-white/8" />
          <Skeleton className="size-4 rounded-full bg-white/8" />
        </div>
        <Skeleton className="h-1 w-full rounded-full bg-white/8" />
      </div>

      <div className="hidden flex-1 justify-end gap-3 lg:flex">
        <Skeleton className="size-5 rounded-md bg-white/8" />
        <Skeleton className="size-5 rounded-md bg-white/8" />
        <Skeleton className="h-1.5 w-20 self-center rounded-full bg-white/8" />
      </div>
    </footer>
  );
}
