import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";

export function MvInfoSkeleton() {
  return (
    <div aria-hidden className="mt-4">
      <Skeleton className="h-7 w-2/3 bg-skeleton" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full bg-skeleton" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 bg-skeleton" />
            <Skeleton className="h-3 w-20 bg-skeleton" />
          </div>
          <Skeleton className="h-9 w-16 rounded-full bg-skeleton" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-full bg-skeleton" />
          <Skeleton className="h-9 w-20 rounded-full bg-skeleton" />
          <Skeleton className="h-9 w-20 rounded-full bg-skeleton" />
        </div>
      </div>
      <Skeleton className="mt-4 h-20 w-full rounded-xl bg-skeleton" />
    </div>
  );
}
