"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { useLatticeCamera } from "@/hooks/playlist/useLatticeCamera";
import { BRAVAIS_SEAM_MAX_WIDTH, BRAVAIS_SEAM_MIN_WIDTH } from "@/constants/playlistBravais";
import {
  bravaisSeatsIn,
  bravaisSideOf,
  createBravaisWall,
  nearestBravaisInstance,
  nearestSeamColumn,
  unshiftWallX,
} from "@/lib/playlist/bravais/wall";
import type { BravaisSelection } from "@/types/playlist/bravaisComponents";
import type { LatticeCamera, QueueInstance } from "@/types/playlist/lattice";

const OVERSCAN = 420;
// How long the camera must rest before the seam moves to where the user is looking.
const SETTLE_DELAY = 260;
const EASE = [0.22, 1, 0.36, 1] as const;
// Screen margin kept between an open seam and the pane edge.
const SEAM_EDGE_MARGIN = 14;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Endless poster wall that splits open along a block boundary. Tiles on either side of the seam are
 * shifted apart; the seam panel rides the world horizontally and spans the pane vertically.
 * When the camera comes to rest away from the seam, the wall closes it and splits open at the block
 * boundary nearest the middle of the pane, so the seam is always where the user is looking.
 *
 * The opening is tracked in screen pixels (the panel does not zoom) and written to CSS variables in
 * world pixels for the tiles: `--seam-screen`, `--seam-l` and `--seam-r`.
 */
export function useBravaisWall(trackCount: number) {
  const reducedMotion = useReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;
  const [anchorColumn, setAnchorColumn] = useState<number | undefined>(undefined);
  const wall = useMemo(
    () => createBravaisWall(trackCount, anchorColumn),
    [trackCount, anchorColumn],
  );
  const wallRef = useRef(wall);
  wallRef.current = wall;
  const seamWidthRef = useRef(BRAVAIS_SEAM_MAX_WIDTH);
  const seamValueRef = useRef(0);
  const seamScale = useRef(1);
  const seamAnimation = useRef<{ stop: () => void } | null>(null);
  const reanchoring = useRef(false);
  const lastFit = useRef(0);
  const settleTimer = useRef<number | undefined>(undefined);
  const settleRef = useRef<() => void>(() => undefined);
  const panelRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<(camera: LatticeCamera) => void>(() => undefined);
  const camera = useLatticeCamera({
    centered: true,
    minScale: 0.3,
    maxScale: 1.5,
    origin: { x: wall.boundaryX, y: wall.geometry.cellHeight / 2 },
    onFrame: (next) => frameRef.current(next),
  });
  const { bounds, viewport, viewportRef, center, cameraRef, fieldRef } = camera;
  const [selected, setSelected] = useState<BravaisSelection | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const seamWidth = Math.round(
    Math.min(BRAVAIS_SEAM_MAX_WIDTH, Math.max(BRAVAIS_SEAM_MIN_WIDTH, viewport.width * 0.32)),
  );
  seamWidthRef.current = seamWidth;

  const writeSeam = useCallback(
    (value: number) => {
      const field = fieldRef.current;
      if (!field) return;
      seamValueRef.current = value;
      seamScale.current = cameraRef.current.scale;
      // The halves give way in world pixels, so the gap on screen stays `value` at any zoom.
      const world = value / cameraRef.current.scale;
      field.style.setProperty("--seam-screen", `${value}px`);
      field.style.setProperty("--seam-l", `${-world / 2}px`);
      field.style.setProperty("--seam-r", `${world / 2}px`);
    },
    [cameraRef, fieldRef],
  );
  frameRef.current = (next) => {
    const panel = panelRef.current;
    if (panel)
      panel.style.transform = `translate3d(${next.x + wallRef.current.boundaryX * next.scale}px, 0, 0)`;
    if (next.scale !== seamScale.current) writeSeam(seamValueRef.current);
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => settleRef.current(), SETTLE_DELAY);
  };
  useEffect(() => {
    frameRef.current(cameraRef.current);
  }, [cameraRef, wall]);
  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  /** Tweens the seam opening, in screen pixels; resolves false if something else took over meanwhile. */
  const moveSeam = useCallback(
    (to: number, duration: number) =>
      new Promise<boolean>((resolve) => {
        seamAnimation.current?.stop();
        if (!fieldRef.current) return resolve(false);
        if (reducedMotionRef.current || duration === 0) {
          writeSeam(to);
          return resolve(true);
        }
        seamAnimation.current = animate(seamValueRef.current, to, {
          duration,
          ease: EASE,
          onUpdate: writeSeam,
          onComplete: () => resolve(true),
          onStop: () => resolve(false),
        });
      }),
    [fieldRef, writeSeam],
  );
  // The wall opens once the pane has a size, and follows the pane when it is resized.
  useEffect(() => {
    if (!viewport.width || reanchoring.current) return;
    void moveSeam(seamWidth, seamValueRef.current ? 0.2 : 0.7);
  }, [moveSeam, seamWidth, viewport.width]);
  useEffect(() => () => seamAnimation.current?.stop(), []);

  // World pixels the halves are pushed apart by when the seam is fully open at the current zoom.
  const openWorld = () => seamWidthRef.current / cameraRef.current.scale;
  const shiftFor = (instance: QueueInstance) =>
    (bravaisSideOf(wallRef.current, instance) === "left" ? -1 : 1) * (openWorld() / 2);
  const shiftForRef = useRef(shiftFor);
  shiftForRef.current = shiftFor;

  const panTo = useCallback(
    (instance: QueueInstance) => {
      center(
        {
          x: instance.x + shiftForRef.current(instance),
          y: instance.y,
          width: instance.width,
          height: instance.height,
        },
        false,
      );
    },
    [center],
  );
  /**
   * Moves the camera the least it takes for the whole seam to be on screen. With `prefer`, the camera
   * first goes to that tile, so the seam only pulls it off-centre as far as the pane forces.
   */
  const fitToSeam = useCallback(
    (prefer: QueueInstance | null) => {
      const view = viewportRef.current;
      const current = wallRef.current;
      const { scale } = cameraRef.current;
      let { x, y } = cameraRef.current;
      if (prefer) {
        x = view.width / 2 - (prefer.x + prefer.width / 2 + shiftForRef.current(prefer)) * scale;
        y = view.height / 2 - (prefer.y + prefer.height / 2) * scale;
      }
      const half = seamWidthRef.current / 2 + SEAM_EDGE_MARGIN;
      const seamCentre = x + current.boundaryX * scale;
      if (seamCentre - half < 0) x -= seamCentre - half;
      else if (seamCentre + half > view.width) x -= seamCentre + half - view.width;
      if (Math.abs(x - cameraRef.current.x) < 1 && Math.abs(y - cameraRef.current.y) < 1) return;
      // Do not chase a target the camera cannot reach in circles.
      if (performance.now() - lastFit.current < 1200) return;
      lastFit.current = performance.now();
      center(
        { x: (view.width / 2 - x) / scale, y: (view.height / 2 - y) / scale, width: 0, height: 0 },
        false,
      );
    },
    [cameraRef, center, viewportRef],
  );

  settleRef.current = async () => {
    const field = fieldRef.current;
    if (!field || reanchoring.current) return;
    if (field.dataset.dragging === "true") {
      settleTimer.current = window.setTimeout(() => settleRef.current(), SETTLE_DELAY);
      return;
    }
    const current = wallRef.current;
    const view = viewportRef.current;
    const { scale } = cameraRef.current;
    const middle = unshiftWallX(
      current,
      openWorld(),
      (view.width / 2 - cameraRef.current.x) / scale,
    );
    const target = nearestSeamColumn(current, middle);
    // Leave a seam that is still near the middle where it is, so small moves do not make it hop.
    const near = Math.min(current.geometry.blockWidth * 0.35, (view.width / scale) * 0.3);
    if (target === current.anchorColumn || Math.abs(middle - current.boundaryX) < near) {
      // The seam stays; just make sure it is still on screen.
      const seamCentre = cameraRef.current.x + current.boundaryX * scale;
      const half = seamWidthRef.current / 2 + SEAM_EDGE_MARGIN;
      if (seamCentre - half < -1 || seamCentre + half > view.width + 1) fitToSeam(null);
      return;
    }
    reanchoring.current = true;
    let completed = false;
    try {
      if (!(await moveSeam(0, 0.22))) return;
      setAnchorColumn(target);
      await nextFrame();
      await nextFrame();
      // The halves give way differently at the new boundary; keep the selected tile where the eye is.
      fitToSeam(selectedRef.current?.instance ?? null);
      completed = await moveSeam(seamWidthRef.current, 0.55);
    } finally {
      reanchoring.current = false;
      // Something interrupted the move halfway: never leave the wall closed or half open.
      if (!completed) void moveSeam(seamWidthRef.current, 0.3);
    }
  };

  const visible = useMemo(
    () =>
      viewport.width && viewport.height && trackCount > 0
        ? bravaisSeatsIn(wall, bounds, OVERSCAN)
        : [],
    [wall, bounds, viewport, trackCount],
  );
  const selectInstance = useCallback(
    (instance: QueueInstance) => {
      setSelected({ index: instance.queueIndex, instance });
      panTo(instance);
    },
    [panTo],
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
  return { ...camera, wall, visible, panelRef, seamWidth, selected, select, selectInstance };
}
