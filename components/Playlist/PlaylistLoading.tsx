import { Skeleton } from "@/components/ui/skeleton";

export default function PlaylistLoading() {
  return (
    <div className="flex flex-col gap-2 pt-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2 py-1">
          <Skeleton className="h-4 w-5 shrink-0 bg-white/10" />
          <Skeleton className="h-10 w-10 shrink-0 rounded bg-white/10" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-1/3 bg-white/10" />
            <Skeleton className="h-3 w-1/5 bg-white/10" />
          </div>
          <Skeleton className="hidden h-4 w-1/5 bg-white/10 md:block" />
          <Skeleton className="hidden h-4 w-24 bg-white/10 lg:block" />
          <Skeleton className="h-4 w-10 shrink-0 bg-white/10" />
        </div>
      ))}
    </div>
  );
}
