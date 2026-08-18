import { Skeleton } from "@/components/ui/skeleton";

export function LibraryLoading() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 10 }, (_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-md bg-skeleton" />
          <Skeleton className="h-4 w-3/4 bg-skeleton" />
          <Skeleton className="h-3 w-1/2 bg-skeleton" />
        </div>
      ))}
    </div>
  );
}
