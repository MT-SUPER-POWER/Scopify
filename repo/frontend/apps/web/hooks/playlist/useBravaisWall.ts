"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLatticeCamera } from "@/hooks/playlist/useLatticeCamera";
import { BRAVAIS_PANEL_MAX_WIDTH, BRAVAIS_PANEL_MIN_WIDTH } from "@/constants/playlistBravais";
import {
  bravaisTilesIn,
  createBravaisWall,
  nearestBravaisInstance,
  revealBravaisTile,
} from "@/lib/playlist/bravais/wall";
import type { BravaisSelection } from "@/types/playlist/bravaisComponents";
import type { QueueInstance } from "@/types/playlist/lattice";

const OVERSCAN = 420;

/**
 * Endless poster wall that slides behind a panel pinned to the middle of the pane. The panel never
 * moves with the camera, so the list is always there however far the wall has been dragged; a
 * selected tile is brought out beside the panel instead of under it.
 */
export function useBravaisWall(trackCount: number) {
  const wall = useMemo(() => createBravaisWall(trackCount), [trackCount]);
  const wallRef = useRef(wall);
  wallRef.current = wall;
  const camera = useLatticeCamera({
    centered: true,
    minScale: 0.3,
    maxScale: 1.5,
    origin: { x: wall.originX, y: wall.geometry.cellHeight / 2 },
  });
  const { bounds, viewport, viewportRef, center, cameraRef } = camera;
  const [selected, setSelected] = useState<BravaisSelection | null>(null);
  const panelWidth = Math.round(
    Math.min(BRAVAIS_PANEL_MAX_WIDTH, Math.max(BRAVAIS_PANEL_MIN_WIDTH, viewport.width * 0.32)),
  );
  const panelWidthRef = useRef(panelWidth);
  panelWidthRef.current = panelWidth;

  const visible = useMemo(
    () =>
      viewport.width && viewport.height && trackCount > 0
        ? bravaisTilesIn(wall, bounds, OVERSCAN)
        : [],
    [wall, bounds, viewport, trackCount],
  );
  const selectInstance = useCallback(
    (instance: QueueInstance) => {
      setSelected({ index: instance.queueIndex, instance });
      const view = viewportRef.current;
      const from = cameraRef.current;
      const { x, y } = revealBravaisTile(instance, from, view, panelWidthRef.current);
      if (x === from.x && y === from.y) return;
      // `center` puts a rect in the middle of the pane; a point there leaves the camera at x, y.
      center(
        {
          x: (view.width / 2 - x) / from.scale,
          y: (view.height / 2 - y) / from.scale,
          width: 0,
          height: 0,
        },
        false,
      );
    },
    [cameraRef, center, viewportRef],
  );
  /** Selects the copy of a song nearest to where the pane is looking. */
  const select = useCallback(
    (index: number | null) => {
      if (index === null) {
        setSelected(null);
        return;
      }
      const view = viewportRef.current;
      const { x, y, scale } = cameraRef.current;
      const instance = nearestBravaisInstance(wallRef.current, index, {
        x: (view.width / 2 - x) / scale,
        y: (view.height / 2 - y) / scale,
      });
      if (instance) selectInstance(instance);
    },
    [cameraRef, selectInstance, viewportRef],
  );
  return { ...camera, wall, visible, panelWidth, selected, select, selectInstance };
}
