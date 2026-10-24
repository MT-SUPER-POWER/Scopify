import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { cn } from "@/lib/utils";

const TITLE_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-3/5", "w-4/5", "w-1/2"];

interface SidebarPlaylistSkeletonProps {
  /** Icon-only rows; omit to follow the `@container/sidebar` width like the real sidebar. */
  isCollapsed?: boolean;
  rows?: number;
}

/** Mirrors LibraryItem: 64px rows (48px cover + title/subtitle) or 56px collapsed tiles. */
export function SidebarPlaylistSkeleton({ isCollapsed, rows = 6 }: SidebarPlaylistSkeletonProps) {
  const followContainer = isCollapsed === undefined;
  return (
    <div className="space-y-1" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex w-full items-center",
            isCollapsed ? "h-14 justify-center" : "h-16 gap-3 p-2",
            followContainer &&
              "@max-[91px]/sidebar:h-14 @max-[91px]/sidebar:justify-center @max-[91px]/sidebar:p-0",
          )}
        >
          <Skeleton className="size-12 shrink-0 rounded-md bg-skeleton" />
          {!isCollapsed && (
            <div
              className={cn(
                "flex min-w-0 flex-1 flex-col gap-2.5",
                followContainer && "@max-[91px]/sidebar:hidden",
              )}
            >
              <Skeleton
                className={cn("h-3.5 bg-skeleton", TITLE_WIDTHS[index % TITLE_WIDTHS.length])}
              />
              <Skeleton className="h-3 w-2/5 bg-skeleton-subtle" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
