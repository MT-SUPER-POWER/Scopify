"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLatticeCamera } from "@/hooks/playlist/useLatticeCamera";
import {
  BRAVAIS_COLUMN_TARGET_WIDTH,
  BRAVAIS_GAP,
  BRAVAIS_MAX_COLUMNS,
  BRAVAIS_MIN_BLOCK_SIZE,
  BRAVAIS_MIN_SIDE_WIDTH,
  BRAVAIS_PANEL_MAX_WIDTH,
  BRAVAIS_PANEL_MIN_WIDTH,
} from "@/constants/playlistBravais";
import {
  bravaisSeatsIn,
  createBravaisWall,
  nearestBravaisSeat,
  revealBravaisSeat,
} from "@/lib/playlist/bravais/wall";
import type { BravaisSeat } from "@/types/playlist/bravais";
import type { BravaisSelection } from "@/types/playlist/bravaisComponents";

const OVERSCAN = 420;
// Pinch gestures arrive as many small factors; this much of them makes one zoom step.
const ZOOM_THRESHOLD = Math.log(1.2);

const pinToAxis = ({ y }: { y: number }) => ({ x: 0, y, scale: 1 });
// The halve under the pointer follows it; the other one rolls the opposite way.
const signAt = (x: number, width: number): 1 | -1 => (x > width / 2 ? -1 : 1);

/**
 * Two halves of a poster wall either side of a fixed song list. They only move vertically and roll
 * against each other, the left with the camera and the right against it. Their sizes come from the
 * pane rather than a zoomed world, so tiles always end exactly at the list and the pane's edge, and
 * zooming changes how many blocks fit across instead of scaling anything.
 */
export function useBravaisWall(trackCount: number) {
  const rightRef = useRef<HTMLDivElement>(null);
  const zoomStep = useRef<(factor: number) => void>(() => undefined);
  const camera = useLatticeCamera({
    centered: true,
    clamp: pinToAxis,
    dragSign: signAt,
    onZoom: (factor) => zoomStep.current(factor),
    onFrame: ({ y }) => {
      if (rightRef.current) rightRef.current.style.transform = `translate3d(0, ${-y}px, 0)`;
    },
  });
  const { bounds, viewport, viewportRef, center, cameraRef } = camera;
  const preferredPanel = Math.round(
    Math.min(BRAVAIS_PANEL_MAX_WIDTH, Math.max(BRAVAIS_PANEL_MIN_WIDTH, viewport.width * 0.32)),
  );
  const roomy = (viewport.width - preferredPanel) / 2 >= BRAVAIS_MIN_SIDE_WIDTH;
  const panelWidth = roomy ? preferredPanel : viewport.width;
  const sideSpace = Math.max(0, (viewport.width - panelWidth) / 2 - BRAVAIS_GAP * 2);
  const maxColumns = Math.max(
    1,
    Math.min(BRAVAIS_MAX_COLUMNS, Math.floor(sideSpace / BRAVAIS_MIN_BLOCK_SIZE)),
  );
  const autoColumns = Math.round(sideSpace / BRAVAIS_COLUMN_TARGET_WIDTH);
  const [chosenColumns, setChosenColumns] = useState<number | null>(null);
  const columns = Math.max(1, Math.min(maxColumns, chosenColumns ?? autoColumns));
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const zoomTotal = useRef(0);
  zoomStep.current = (factor) => {
    zoomTotal.current += Math.log(factor);
    if (Math.abs(zoomTotal.current) < ZOOM_THRESHOLD) return;
    setChosenColumns(columnsRef.current + (zoomTotal.current > 0 ? -1 : 1));
    zoomTotal.current = 0;
  };
  const wall = useMemo(
    () => createBravaisWall(trackCount, viewport.width, panelWidth, columns),
    [trackCount, viewport.width, panelWidth, columns],
  );
  const wallRef = useRef(wall);
  wallRef.current = wall;
  const [selected, setSelected] = useState<BravaisSelection | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const visible = useMemo(
    () =>
      viewport.width && viewport.height && roomy
        ? // `bounds` is the camera the tiles were last culled at, which only changes in big steps.
          bravaisSeatsIn(wall, -bounds.top, viewport.height, OVERSCAN)
        : [],
    [wall, bounds.top, viewport.width, viewport.height, roomy],
  );
  const selectSeat = useCallback(
    (seat: BravaisSeat) => {
      setSelected({ index: seat.instance.queueIndex, seat });
      const view = viewportRef.current;
      const from = cameraRef.current;
      const y = revealBravaisSeat(seat, from.y, view.height);
      if (y === from.y) return;
      // `center` puts a rect in the middle of the pane; a point there leaves the camera at y.
      center({ x: 0, y: view.height / 2 - y, width: 0, height: 0 }, false);
    },
    [cameraRef, center, viewportRef],
  );
  /** Selects the copy of a song nearest the middle of the pane. */
  const select = useCallback(
    (index: number | null) => {
      if (index === null) {
        setSelected(null);
        return;
      }
      const seat = nearestBravaisSeat(
        wallRef.current,
        index,
        cameraRef.current.y,
        viewportRef.current.height,
      );
      if (seat) selectSeat(seat);
    },
    [cameraRef, selectSeat, viewportRef],
  );
  // Zooming or resizing rebuilds the wall; keep the selected song in view on the new one.
  useEffect(() => {
    if (selectedRef.current) select(selectedRef.current.index);
  }, [select, wall]);
  return { ...camera, wall, visible, rightRef, panelWidth, selected, select, selectSeat };
}
