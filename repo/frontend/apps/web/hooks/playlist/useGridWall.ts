"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { KeyboardEvent } from "react";
import { useLatticeCamera } from "@/hooks/playlist/useLatticeCamera";
import { GRID_METRICS, GRID_OVERSCAN } from "@/constants/playlistGrid";
import { computeGridPlacement } from "@/lib/playlist/grid/falloff";
import { adjacentHexCell, locateHexCell, visibleHexCells } from "@/lib/playlist/grid/hex";
import { ZOOM_STEP, zoomKeyDirection } from "@/lib/playlist/zoomKeys";
import type { GridCell, GridDirection } from "@/types/playlist/grid";
import type { LatticeCamera } from "@/types/playlist/lattice";

const writeFrame = (
  element: HTMLElement,
  cell: GridCell,
  camera: LatticeCamera,
  view: { width: number; height: number },
) => {
  const placement = computeGridPlacement(cell, camera, view);
  const { style, dataset } = element;
  style.display = placement ? "" : "none";
  if (!placement) return null;
  const { frame } = placement;
  style.transform = placement.transform;
  style.opacity = frame.opacity.toFixed(3);
  style.zIndex = String(frame.zIndex);
  const centered = String(frame.centered);
  if (dataset.centered !== centered) dataset.centered = centered;
  return frame;
};

/** Endless hex card wall: the shared lattice camera plus a per-frame distance falloff written straight to the DOM. */
export function useGridWall(trackCount: number) {
  // Cells are cached per track count so a card keeps its identity while the wall scrolls.
  const cache = useMemo(() => new Map<string, GridCell>(), [trackCount]); // eslint-disable-line react-hooks/exhaustive-deps
  const countRef = useRef(trackCount);
  countRef.current = trackCount;
  const cacheRef = useRef(cache);
  cacheRef.current = cache;
  const cards = useRef(new Map<string, { element: HTMLElement; cell: GridCell }>());
  const centerCell = useRef<GridCell | null>(null);
  const frameRef = useRef<(camera: LatticeCamera) => void>(() => undefined);
  const camera = useLatticeCamera({
    centered: true,
    minScale: 0.3,
    maxScale: 1.6,
    onFrame: (next) => frameRef.current(next),
  });
  const { bounds, viewport, viewportRef, cameraRef, center, zoomBy } = camera;
  frameRef.current = (next) => {
    const view = viewportRef.current;
    if (!view.width) return;
    let nearest = Infinity;
    for (const { element, cell } of cards.current.values()) {
      const frame = writeFrame(element, cell, next, view);
      if (!frame) continue;
      const distance =
        (cell.x + (next.x - view.width / 2) / next.scale) ** 2 +
        (cell.y + (next.y - view.height / 2) / next.scale) ** 2;
      if (distance < nearest) {
        nearest = distance;
        centerCell.current = cell;
      }
    }
  };
  const visible = useMemo(
    () =>
      viewport.width && viewport.height
        ? visibleHexCells(bounds, trackCount, GRID_METRICS, GRID_OVERSCAN, cache)
        : [],
    [bounds, cache, trackCount, viewport],
  );
  // Drops cells nobody is looking at any more, so a long session cannot grow the cache without bound.
  useEffect(() => {
    if (cache.size > 4000) cache.clear();
  }, [cache, visible]);
  const register = useCallback(
    (cell: GridCell, element: HTMLElement | null) => {
      if (!element) {
        cards.current.delete(cell.key);
        return;
      }
      cards.current.set(cell.key, { element, cell });
      const view = viewportRef.current;
      if (view.width) writeFrame(element, cell, cameraRef.current, view);
    },
    [cameraRef, viewportRef],
  );
  // A card is positioned by writeFrame; once the visible set changes, recompute which one is centred.
  useEffect(() => {
    frameRef.current(cameraRef.current);
  }, [cameraRef, visible]);
  const panToCell = useCallback(
    (cell: GridCell) => center({ x: cell.x, y: cell.y, width: 0, height: 0 }, false),
    [center],
  );
  /** Pans to the copy of a song nearest to where the pane is looking. */
  const panTo = useCallback(
    (index: number) => {
      const count = countRef.current;
      const view = viewportRef.current;
      const current = cameraRef.current;
      if (count <= 0 || index < 0 || index >= count) return;
      const cell = locateHexCell(
        index,
        count,
        {
          x: (view.width / 2 - current.x) / current.scale,
          y: (view.height / 2 - current.y) / current.scale,
        },
        GRID_METRICS,
        cacheRef.current,
      );
      panToCell(cell);
    },
    [cameraRef, panToCell, viewportRef],
  );
  const onKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    onClose: () => void,
    onActivate: (index: number) => void,
  ) => {
    if (event.defaultPrevented) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (
      event.target instanceof Element &&
      event.target.closest('button, input, [role="slider"], [role="menu"]')
    )
      return;
    const zoomDirection = zoomKeyDirection(event);
    if (zoomDirection) {
      event.preventDefault();
      event.stopPropagation();
      zoomBy(zoomDirection > 0 ? ZOOM_STEP : 1 / ZOOM_STEP);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (centerCell.current) onActivate(centerCell.current.index);
      return;
    }
    const direction: GridDirection | undefined =
      event.key === "ArrowLeft"
        ? "left"
        : event.key === "ArrowRight"
          ? "right"
          : event.key === "ArrowUp"
            ? "up"
            : event.key === "ArrowDown"
              ? "down"
              : undefined;
    const from = centerCell.current;
    if (!direction || !from) return;
    event.preventDefault();
    event.stopPropagation();
    panToCell(adjacentHexCell(from, direction, countRef.current, GRID_METRICS, cacheRef.current));
  };
  return { ...camera, visible, register, panTo, panToCell, onKeyDown };
}
