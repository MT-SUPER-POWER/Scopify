import { Skeleton } from "@/components/ui/skeleton";

export function LibraryLoading() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 10 }, (_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="bg-skeleton aspect-square w-full rounded-md" />
          <Skeleton className="bg-skeleton h-4 w-3/4" />
          <Skeleton className="bg-skeleton h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
