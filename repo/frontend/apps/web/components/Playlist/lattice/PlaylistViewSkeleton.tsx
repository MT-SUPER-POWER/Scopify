import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import {
  BLOCK_COLS,
  BLOCK_ROWS,
  getBlockTemplate,
} from "@/constants/playlistLattice/blockTemplates";
import type { PlaylistViewMode } from "@/types/playlist/lattice";

// Cards per row; the shorter middle row sits half a card in, like the real hex wall.
const CARD_ROWS = [5, 4, 5];

/** One block of the Lattice layout stretched over the pane; the real wall is built from the same templates. */
function WallSkeleton() {
  return (
    <div className="absolute inset-0 p-1.5">
      <div className="relative size-full">
        {getBlockTemplate(0, 0).map((slot, index) => (
          <div
            key={index}
            className="absolute p-[3px]"
            style={{
              left: `${(slot.x / BLOCK_COLS) * 100}%`,
              top: `${(slot.y / BLOCK_ROWS) * 100}%`,
              width: `${(slot.cols / BLOCK_COLS) * 100}%`,
              height: `${(slot.rows / BLOCK_ROWS) * 100}%`,
            }}
          >
            <Skeleton className="size-full rounded-none bg-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Staggered cards, bigger in the middle and fading outwards, like the Grid wall they stand in for. */
function CardsSkeleton() {
  return (
    <div className="absolute inset-0 grid place-content-center gap-8">
      {CARD_ROWS.map((cards, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-7">
          {Array.from({ length: cards }, (_, index) => {
            const distance = Math.abs(index - (cards - 1) / 2) + Math.abs(rowIndex - 1) * 0.6;
            return (
              <div
                key={index}
                className="flex w-40 flex-col gap-3 rounded-xl border border-border bg-card p-2.5"
                style={{ opacity: Math.max(0.35, 1 - distance * 0.28) }}
              >
                <Skeleton className="aspect-square w-full rounded-lg bg-skeleton" />
                <Skeleton className="h-3.5 w-3/4 bg-skeleton" />
                <Skeleton className="h-3 w-1/2 bg-skeleton" />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Shown while the page's songs load and the last-used immersive view is about to open. */
export function PlaylistViewSkeleton({ mode }: { mode: PlaylistViewMode }) {
  return (
    <section
      aria-hidden
      data-playlist-view-skeleton={mode}
      className="absolute inset-0 isolate z-15 overflow-hidden bg-card"
    >
      {mode === "grid" ? <CardsSkeleton /> : <WallSkeleton />}
    </section>
  );
}
