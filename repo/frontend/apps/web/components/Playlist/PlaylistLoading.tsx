import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";

// Mirrors TrackTable: same gutters, 36px header, 62px rows, and columns scaled from the minimum
// widths in lib/playlist/tracklistColumnLayout at the same 640px / 1024px breakpoints.
const ROW_GRID = [
  "grid items-center",
  "grid-cols-[56px_200fr_72fr]",
  "sm:grid-cols-[56px_200fr_120fr_72fr]",
  "lg:grid-cols-[56px_200fr_120fr_104fr_48fr_72fr]",
].join(" ");
const TITLE_WIDTHS = ["w-2/5", "w-3/5", "w-1/2", "w-2/3", "w-1/3"];
const ARTIST_WIDTHS = ["w-1/4", "w-1/3", "w-1/5", "w-2/5", "w-1/4"];
const ALBUM_WIDTHS = ["w-3/5", "w-2/5", "w-1/2", "w-2/3", "w-1/3"];

export default function PlaylistLoading() {
  return (
    <div className="w-full px-6 md:px-8 lg:px-10 xl:px-12" aria-hidden>
      <div className="-mx-4">
        <div className={`${ROW_GRID} h-9`}>
          <div className="pl-4">
            <Skeleton className="size-3 bg-skeleton" />
          </div>
          <div className="px-2">
            <Skeleton className="h-3 w-10 bg-skeleton" />
          </div>
          <div className="hidden px-2 sm:block">
            <Skeleton className="h-3 w-10 bg-skeleton" />
          </div>
          <div className="hidden px-3 lg:block">
            <Skeleton className="h-3 w-12 bg-skeleton" />
          </div>
          <div className="hidden justify-center px-2 lg:flex">
            <Skeleton className="h-3 w-8 bg-skeleton" />
          </div>
          <div className="flex justify-end pr-4">
            <Skeleton className="size-4 rounded-full bg-skeleton" />
          </div>
        </div>

        {Array.from({ length: 10 }).map((_, i) => {
          const variant = i % TITLE_WIDTHS.length;
          return (
            <div key={i} className={`${ROW_GRID} h-15.5`}>
              <div className="pl-4">
                <Skeleton className="h-3.5 w-4 bg-skeleton" />
              </div>
              <div className="flex min-w-0 items-center gap-3 px-2">
                <Skeleton className="size-10 shrink-0 rounded bg-skeleton" />
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <Skeleton className={`h-4 bg-skeleton ${TITLE_WIDTHS[variant]}`} />
                  <Skeleton className={`h-3 bg-skeleton ${ARTIST_WIDTHS[variant]}`} />
                </div>
              </div>
              <div className="hidden min-w-0 items-center gap-1.5 px-2 sm:flex">
                <Skeleton className="size-3.5 shrink-0 rounded-full bg-skeleton" />
                <Skeleton className={`h-3.5 bg-skeleton ${ALBUM_WIDTHS[variant]}`} />
              </div>
              <div className="hidden px-2 lg:block">
                <Skeleton className="h-3.5 w-20 max-w-full bg-skeleton" />
              </div>
              <div className="hidden justify-center px-2 lg:flex">
                <Skeleton className="size-4.5 rounded-full bg-skeleton" />
              </div>
              <div className="flex justify-end pr-4">
                <Skeleton className="h-3.5 w-9 bg-skeleton" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
