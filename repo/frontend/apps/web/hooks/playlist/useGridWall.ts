"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { KeyboardEvent } from "react";
import { useLatticeCamera } from "@/hooks/playlist/useLatticeCamera";
import { computeCardFrame } from "@/lib/playlist/grid/falloff";
import { adjacentHexCell, cullHexWall, layoutHexWall } from "@/lib/playlist/grid/hex";
import { GRID_METRICS } from "@/constants/playlistGrid";
import type { GridCell, GridDirection } from "@/types/playlist/grid";
import type { LatticeCamera } from "@/types/playlist/lattice";

// Mounted beyond the pane edge so a drag reveals cards that are already painted.
const OVERSCAN = 160;

const writeFrame = (
  element: HTMLElement,
  cell: GridCell,
  camera: LatticeCamera,
  width: number,
  height: number,
) => {
  const frame = computeCardFrame(
    cell.x + camera.x - width / 2,
    cell.y + camera.y - height / 2,
    width,
    height,
    GRID_METRICS,
  );
  const { style, dataset } = element;
  style.display = frame.visible ? "" : "none";
  if (!frame.visible) return null;
  style.transform = `translate3d(${cell.x}px, ${cell.y}px, 0) scale(${frame.scale.toFixed(4)})`;
  style.opacity = frame.opacity.toFixed(3);
  style.zIndex = String(frame.zIndex);
  const centered = String(frame.centered);
  if (dataset.centered !== centered) dataset.centered = centered;
  return frame;
};

/** Hex card wall: the shared lattice camera plus a per-frame distance falloff written straight to the DOM. */
export function useGridWall(trackCount: number) {
  const cells = useMemo(() => layoutHexWall(trackCount, GRID_METRICS), [trackCount]);
  const cellsRef = useRef(cells);
  cellsRef.current = cells;
  const cards = useRef(new Map<number, HTMLElement>());
  const centerIndex = useRef(0);
  const frameRef = useRef<(camera: LatticeCamera) => void>(() => undefined);
  const camera = useLatticeCamera({
    centered: true,
    onFrame: (next) => frameRef.current(next),
  });
  const { bounds, viewport, viewportRef, cameraRef, center } = camera;
  frameRef.current = (next) => {
    const { width, height } = viewportRef.current;
    if (!width) return;
    let nearest = Infinity;
    for (const [index, element] of cards.current) {
      const cell = cellsRef.current[index];
      if (!cell) continue;
      const frame = writeFrame(element, cell, next, width, height);
      if (!frame) continue;
      const distance = (cell.x + next.x - width / 2) ** 2 + (cell.y + next.y - height / 2) ** 2;
      if (distance < nearest) {
        nearest = distance;
        centerIndex.current = index;
      }
    }
  };
  const visible = useMemo(
    () =>
      viewport.width && viewport.height ? cullHexWall(cells, bounds, GRID_METRICS, OVERSCAN) : [],
    [cells, bounds, viewport],
  );
  const register = useCallback(
    (index: number, element: HTMLElement | null) => {
      if (!element) {
        cards.current.delete(index);
        return;
      }
      cards.current.set(index, element);
      const cell = cellsRef.current[index];
      const { width, height } = viewportRef.current;
      if (cell && width) writeFrame(element, cell, cameraRef.current, width, height);
    },
    [cameraRef, viewportRef],
  );
  // A card is positioned by writeFrame; once the visible set changes, recompute which one is centred.
  useEffect(() => {
    frameRef.current(cameraRef.current);
  }, [cameraRef, visible]);
  const panTo = useCallback(
    (index: number) => {
      const cell = cellsRef.current[index];
      if (cell) center({ x: cell.x, y: cell.y, width: 0, height: 0 }, false);
    },
    [center],
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
    if (event.key === "Enter") {
      event.preventDefault();
      onActivate(centerIndex.current);
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
    const from = cellsRef.current[centerIndex.current];
    if (!direction || !from) return;
    event.preventDefault();
    event.stopPropagation();
    const next = adjacentHexCell(cellsRef.current, from, direction, GRID_METRICS);
    if (next) panTo(next.index);
  };
  return { ...camera, visible, register, panTo, onKeyDown, centerIndex };
}
