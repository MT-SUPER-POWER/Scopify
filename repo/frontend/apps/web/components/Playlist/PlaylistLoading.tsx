import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";

export default function PlaylistLoading() {
  return (
    <div className="flex flex-col gap-2 pt-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2 py-1">
          <Skeleton className="h-4 w-5 shrink-0 bg-skeleton" />
          <Skeleton className="size-10 shrink-0 rounded bg-skeleton" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-1/3 bg-skeleton" />
            <Skeleton className="h-3 w-1/5 bg-skeleton" />
          </div>
          <Skeleton className="hidden h-4 w-1/5 bg-skeleton md:block" />
          <Skeleton className="hidden h-4 w-24 bg-skeleton lg:block" />
          <Skeleton className="h-4 w-10 shrink-0 bg-skeleton" />
        </div>
      ))}
    </div>
  );
}
