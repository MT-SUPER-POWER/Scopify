import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import {
  BLOCK_COLS,
  BLOCK_ROWS,
  getBlockTemplate,
} from "@/constants/playlistLattice/blockTemplates";
import {
  BRAVAIS_BLOCK_UNITS,
  BRAVAIS_PANEL_MAX_WIDTH,
  BRAVAIS_PANEL_MIN_WIDTH,
  BRAVAIS_TEMPLATES,
} from "@/constants/playlistBravais";
import type { PlaylistViewMode } from "@/types/playlist/lattice";

// Cards per row; the shorter middle row sits half a card in, like the real hex wall.
const CARD_ROWS = [5, 4, 5];
// More rows than any pane is tall; the panel clips the rest.
const PANEL_ROWS = 16;
// Blocks down one halve of the Bravais wall; the pane clips the rest.
const SIDE_BLOCKS = 5;
const PANEL_WIDTH = `clamp(${BRAVAIS_PANEL_MIN_WIDTH}px, 32%, ${BRAVAIS_PANEL_MAX_WIDTH}px)`;

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

/** One halve of the Bravais wall: a column of the same square-tiled blocks. */
function SideSkeleton({ side }: { side: "left" | "right" }) {
  return (
    <div
      className="absolute inset-y-0 flex flex-col overflow-hidden"
      style={{ [side]: 3, width: `calc((100% - ${PANEL_WIDTH}) / 2 - 3px)` }}
    >
      {Array.from({ length: SIDE_BLOCKS }, (_, row) => (
        <div key={row} className="relative aspect-square w-full shrink-0">
          {BRAVAIS_TEMPLATES[(row * 2 + (side === "left" ? 0 : 1)) % BRAVAIS_TEMPLATES.length].map(
            (slot, index) => (
              <div
                key={index}
                className="absolute p-[3px]"
                style={{
                  left: `${(slot.x / BRAVAIS_BLOCK_UNITS) * 100}%`,
                  top: `${(slot.y / BRAVAIS_BLOCK_UNITS) * 100}%`,
                  width: `${(slot.cols / BRAVAIS_BLOCK_UNITS) * 100}%`,
                  height: `${(slot.rows / BRAVAIS_BLOCK_UNITS) * 100}%`,
                }}
              >
                <Skeleton className="size-full rounded-none bg-skeleton" />
              </div>
            ),
          )}
        </div>
      ))}
    </div>
  );
}

/** The Bravais view: both halves and the list between them, so nothing jumps when they arrive. */
function BravaisSkeleton() {
  return (
    <>
      <SideSkeleton side="left" />
      <SideSkeleton side="right" />
      <div
        className="absolute inset-y-0 left-1/2 flex -translate-x-1/2 flex-col gap-2 overflow-hidden p-5"
        style={{ width: PANEL_WIDTH }}
      >
        <Skeleton className="h-7 w-4/5 shrink-0 bg-skeleton" />
        <Skeleton className="h-3.5 w-1/3 shrink-0 bg-skeleton" />
        <div className="my-3 flex shrink-0 items-center gap-2">
          <Skeleton className="size-10 shrink-0 rounded-full bg-skeleton" />
          <Skeleton className="h-10 flex-1 rounded-full bg-skeleton" />
        </div>
        {Array.from({ length: PANEL_ROWS }, (_, index) => (
          <div key={index} className="flex h-12 shrink-0 items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-md bg-skeleton" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-3/5 bg-skeleton" />
              <Skeleton className="h-3 w-2/5 bg-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </>
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
      {mode === "grid" && <CardsSkeleton />}
      {mode === "lattice" && <WallSkeleton />}
      {mode === "bravais" && <BravaisSkeleton />}
    </section>
  );
}
