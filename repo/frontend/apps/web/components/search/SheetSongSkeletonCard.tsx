import { Card, CardContent } from "@scopify/ui/shadcn/components/card";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";

export function SheetSongSkeletonCard() {
  return (
    <Card aria-hidden className="gap-0 py-0 shadow-none">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="aspect-3/4 rounded-md" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
