import { Skeleton } from "@/components/ui/skeleton";

export default function PlaylistLoading() {
  return (
    <div className="flex flex-col gap-2 pt-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2 py-1">
          <Skeleton className="w-5 h-4 bg-white/10 shrink-0" />
          <Skeleton className="w-10 h-10 bg-white/10 rounded shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <Skeleton className="h-4 w-1/3 bg-white/10" />
            <Skeleton className="h-3 w-1/5 bg-white/10" />
          </div>
          <Skeleton className="hidden md:block h-4 w-1/5 bg-white/10" />
          <Skeleton className="hidden lg:block h-4 w-24 bg-white/10" />
          <Skeleton className="h-4 w-10 bg-white/10 shrink-0" />
        </div>
      ))}
    </div>
  );
}
