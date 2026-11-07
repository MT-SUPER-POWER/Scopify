"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { GRID_METRICS, GRID_OVERSCAN } from "@/constants/playlistGrid";
import { computeGridPlacement } from "@/lib/playlist/grid/falloff";
import { visibleHexCells } from "@/lib/playlist/grid/hex";
import { holdFlipReveal, releaseFlipReveal } from "@/lib/playlist/flipReveal";
import { getCameraBounds, getInitialCamera } from "@/lib/playlist/lattice/camera";
import { getLatticeGeometry, LATTICE_METRICS, layoutLattice } from "@/lib/playlist/lattice/layout";
import { useLatticePreferences } from "@/store/module/lattice";
import type { LatticeViewport, PlaylistViewMode } from "@/types/playlist/lattice";

// Tailwind's pulse. Locked to the document clock, so a card's skeleton face picks up exactly where
// the skeleton it replaces left off instead of popping to another brightness.
const PULSE_PERIOD = 2000;

function PulseSkeleton({ className }: { className: string }) {
  const [delay] = useState(() => -(performance.now() % PULSE_PERIOD));
  return <Skeleton className={className} style={{ animationDelay: `${delay}ms` }} />;
}

/** The skeleton side of a Lattice poster. */
export function LatticeTileFace() {
  return <PulseSkeleton className="size-full rounded-none bg-skeleton" />;
}

/** The skeleton side of a Grid card; same box as the real card so the turn lands in place. */
export function GridCardFace() {
  return (
    <div className="flex size-full flex-col rounded-xl border border-border bg-card p-2.5 shadow-lg group-data-[lights-off=true]/grid:brightness-50">
      <PulseSkeleton className="aspect-square w-full shrink-0 rounded-lg bg-skeleton" />
      <PulseSkeleton className="mt-3 h-3.5 w-3/4 bg-skeleton" />
      <PulseSkeleton className="mt-2 h-3 w-1/2 bg-skeleton" />
    </div>
  );
}

/** The opening camera's view of the wall. The real wall is built from the same layout functions. */
function WallSkeleton({ view }: { view: LatticeViewport }) {
  const camera = useMemo(() => getInitialCamera(view, false), [view]);
  const tiles = useMemo(
    () =>
      layoutLattice(
        // The tiles do not depend on the song count, which is why they can be drawn before it is known.
        getLatticeGeometry(1, LATTICE_METRICS),
        1,
        getCameraBounds(camera, view),
        0,
        LATTICE_METRICS,
      ),
    [camera, view],
  );
  return (
    <div
      className="absolute inset-0 origin-top-left"
      style={{ transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.scale})` }}
    >
      {tiles.map((tile) => (
        <div
          key={tile.instanceId}
          className="absolute top-0 left-0"
          style={{
            width: tile.width,
            height: tile.height,
            transform: `translate(${tile.x}px, ${tile.y}px)`,
          }}
        >
          <LatticeTileFace />
        </div>
      ))}
    </div>
  );
}

function CardsSkeleton({ view }: { view: LatticeViewport }) {
  const camera = useMemo(() => getInitialCamera(view, true), [view]);
  const cards = useMemo(
    () =>
      visibleHexCells(
        getCameraBounds(camera, view),
        1,
        GRID_METRICS,
        GRID_OVERSCAN,
        new Map(),
      ).flatMap((cell) => {
        const placement = computeGridPlacement(cell, camera, view);
        return placement ? [{ cell, placement }] : [];
      }),
    [camera, view],
  );
  return (
    <>
      <div className="absolute inset-0 [perspective:1800px]">
        <div
          className="absolute inset-0 origin-top-left [transform-style:preserve-3d]"
          style={{
            transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.scale})`,
          }}
        >
          {cards.map(({ cell, placement }) => (
            <div
              key={cell.key}
              className="absolute"
              style={{
                left: -GRID_METRICS.cardWidth / 2,
                top: -GRID_METRICS.cardHeight / 2,
                width: GRID_METRICS.cardWidth,
                height: GRID_METRICS.cardHeight,
                transform: placement.transform,
                opacity: placement.frame.opacity,
                zIndex: placement.frame.zIndex,
              }}
            >
              <GridCardFace />
            </div>
          ))}
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-1 bg-[radial-gradient(ellipse_70%_75%_at_50%_50%,transparent_45%,color-mix(in_oklab,var(--card)_85%,transparent)_100%)]"
      />
    </>
  );
}

/**
 * Shown while the page's songs load and the last-used immersive view is about to open. `arm` says the
 * skeleton is standing in for data, so the view replacing it flips into place; while only the view's
 * code is loading the songs were already known, and the view just appears.
 */
export function PlaylistViewSkeleton({
  mode,
  arm = true,
}: {
  mode: PlaylistViewMode;
  arm?: boolean;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const [view, setView] = useState<LatticeViewport | null>(null);
  const lightsOff = useLatticePreferences((state) => state.lightsOff);
  useLayoutEffect(() => {
    holdFlipReveal(arm);
    return releaseFlipReveal;
  }, [arm]);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () =>
      setView((previous) =>
        previous?.width === root.clientWidth && previous.height === root.clientHeight
          ? previous
          : { width: root.clientWidth, height: root.clientHeight },
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);
  return (
    <section
      ref={rootRef}
      aria-hidden
      data-playlist-view-skeleton={mode}
      data-lights-off={mode === "grid" && lightsOff}
      className="group/grid absolute inset-0 isolate z-15 overflow-hidden bg-card"
    >
      {view && (mode === "grid" ? <CardsSkeleton view={view} /> : <WallSkeleton view={view} />)}
    </section>
  );
}
