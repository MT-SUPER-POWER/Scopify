import { Skeleton } from "@/components/ui/skeleton";

export default function PlaylistLoading() {
  return (
    <div className="flex flex-col gap-2 pt-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2 py-1">
          <Skeleton className="bg-skeleton h-4 w-5 shrink-0" />
          <Skeleton className="bg-skeleton size-10 shrink-0 rounded" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="bg-skeleton h-4 w-1/3" />
            <Skeleton className="bg-skeleton h-3 w-1/5" />
          </div>
          <Skeleton className="bg-skeleton hidden h-4 w-1/5 md:block" />
          <Skeleton className="bg-skeleton hidden h-4 w-24 lg:block" />
          <Skeleton className="bg-skeleton h-4 w-10 shrink-0" />
        </div>
      ))}
    </div>
  );
}
