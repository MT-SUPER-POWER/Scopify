"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { useLatticeCamera } from "@/hooks/playlist/useLatticeCamera";
import { BRAVAIS_SEAM_MAX_WIDTH, BRAVAIS_SEAM_MIN_WIDTH } from "@/constants/playlistBravais";
import {
  buildBravaisWall,
  clampBravaisCamera,
  cullBravaisSeats,
  nearestSeamColumn,
  seamShift,
  unshiftWallX,
} from "@/lib/playlist/bravais/wall";
import type { LatticeCamera } from "@/types/playlist/lattice";

const OVERSCAN = 420;
// How long the camera must rest before the seam moves to where the user is looking.
const SETTLE_DELAY = 260;
const EASE = [0.22, 1, 0.36, 1] as const;
// Screen margin kept between an open seam and the pane edge.
const SEAM_EDGE_MARGIN = 14;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Finite poster wall that splits open along a block boundary. Tiles on either side of the seam are
 * shifted apart by `--seam`; the seam panel rides the world horizontally and spans the pane vertically.
 * When the camera comes to rest away from the seam, the wall closes it and splits open at the block
 * boundary nearest the middle of the pane, so the seam is always where the user is looking.
 */
export function useBravaisWall(trackCount: number) {
  const reducedMotion = useReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;
  const [anchorColumn, setAnchorColumn] = useState<number | undefined>(undefined);
  const wall = useMemo(
    () => buildBravaisWall(trackCount, anchorColumn),
    [trackCount, anchorColumn],
  );
  const wallRef = useRef(wall);
  wallRef.current = wall;
  const seamWidthRef = useRef(BRAVAIS_SEAM_MAX_WIDTH);
  const seamValueRef = useRef(0);
  const seamAnimation = useRef<{ stop: () => void } | null>(null);
  const reanchoring = useRef(false);
  const lastFit = useRef(0);
  const settleTimer = useRef<number | undefined>(undefined);
  const settleRef = useRef<() => void>(() => undefined);
  const panelRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<(camera: LatticeCamera) => void>(() => undefined);
  const camera = useLatticeCamera({
    centered: true,
    origin: { x: wall.boundaryX, y: wall.height / 2 },
    clamp: (next, viewport) =>
      clampBravaisCamera(next, viewport, wallRef.current, seamWidthRef.current),
    onFrame: (next) => frameRef.current(next),
  });
  const { bounds, viewport, viewportRef, center, cameraRef, fieldRef } = camera;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedRef = useRef(selectedIndex);
  selectedRef.current = selectedIndex;
  const panTo = useCallback(
    (index: number) => {
      const seat = wallRef.current.seats[index];
      if (!seat || seat.trackIndex < 0) return;
      const opening = seamShift(wallRef.current, seamWidthRef.current);
      const shift = seat.side === "left" ? opening.left : opening.right;
      const { instance } = seat;
      center(
        { x: instance.x + shift, y: instance.y, width: instance.width, height: instance.height },
        false,
      );
    },
    [center],
  );
  const seamWidth = Math.round(
    Math.min(BRAVAIS_SEAM_MAX_WIDTH, Math.max(BRAVAIS_SEAM_MIN_WIDTH, viewport.width * 0.32)),
  );
  seamWidthRef.current = seamWidth;
  frameRef.current = (next) => {
    const panel = panelRef.current;
    if (panel) panel.style.transform = `translate3d(${next.x + wallRef.current.boundaryX}px, 0, 0)`;
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => settleRef.current(), SETTLE_DELAY);
  };
  useEffect(() => {
    frameRef.current(cameraRef.current);
  }, [cameraRef, wall]);
  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  /** Tweens the seam opening, in pixels; resolves false if something else took over meanwhile. */
  const moveSeam = useCallback(
    (to: number, duration: number) =>
      new Promise<boolean>((resolve) => {
        const field = fieldRef.current;
        seamAnimation.current?.stop();
        if (!field) return resolve(false);
        const write = (value: number) => {
          seamValueRef.current = value;
          const shift = seamShift(wallRef.current, value);
          field.style.setProperty("--seam", `${value}px`);
          field.style.setProperty("--seam-l", `${shift.left}px`);
          field.style.setProperty("--seam-r", `${shift.right}px`);
          field.style.setProperty("--seam-c", `${shift.center}px`);
        };
        if (reducedMotionRef.current || duration === 0) {
          write(to);
          return resolve(true);
        }
        const controls = animate(seamValueRef.current, to, {
          duration,
          ease: EASE,
          onUpdate: write,
          onComplete: () => resolve(true),
          onStop: () => resolve(false),
        });
        seamAnimation.current = controls;
      }),
    [fieldRef],
  );
  // The wall opens once the pane has a size, and follows the pane when it is resized.
  useEffect(() => {
    if (!viewport.width || reanchoring.current) return;
    void moveSeam(seamWidth, seamValueRef.current ? 0.2 : 0.7);
  }, [moveSeam, seamWidth, viewport.width]);
  useEffect(() => () => seamAnimation.current?.stop(), []);

  /**
   * Moves the camera the least it takes for the whole seam to be on screen. With `prefer`, the camera
   * first goes to that song, so the seam only pulls it off-centre as far as the pane forces.
   */
  const fitToSeam = useCallback(
    (prefer: number | null) => {
      const view = viewportRef.current;
      const current = wallRef.current;
      const opening = seamShift(current, seamWidthRef.current);
      let { x, y } = cameraRef.current;
      const seat = prefer === null ? undefined : current.seats[prefer];
      if (seat && seat.trackIndex >= 0) {
        const shift = seat.side === "left" ? opening.left : opening.right;
        x = view.width / 2 - (seat.instance.x + seat.instance.width / 2 + shift);
        y = view.height / 2 - (seat.instance.y + seat.instance.height / 2);
      }
      const half = seamWidthRef.current / 2 + SEAM_EDGE_MARGIN;
      const seamCentre = x + current.boundaryX + opening.center;
      if (seamCentre - half < 0) x -= seamCentre - half;
      else if (seamCentre + half > view.width) x -= seamCentre + half - view.width;
      if (Math.abs(x - cameraRef.current.x) < 1 && Math.abs(y - cameraRef.current.y) < 1) return;
      // The wall's edge limits may stop the camera short; do not chase it in circles.
      if (performance.now() - lastFit.current < 1200) return;
      lastFit.current = performance.now();
      center({ x: view.width / 2 - x, y: view.height / 2 - y, width: 0, height: 0 }, false);
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
    const middle = unshiftWallX(
      current,
      seamWidthRef.current,
      viewportRef.current.width / 2 - cameraRef.current.x,
    );
    const target = nearestSeamColumn(current, middle);
    // Leave a seam that is still near the middle where it is, so small moves do not make it hop.
    const near = Math.min(current.blockWidth * 0.35, viewportRef.current.width * 0.3);
    if (target === current.anchorColumn || Math.abs(middle - current.boundaryX) < near) {
      // The seam stays; just make sure it is still on screen.
      const opening = seamShift(current, seamWidthRef.current);
      const seamCentre = cameraRef.current.x + current.boundaryX + opening.center;
      const half = seamWidthRef.current / 2 + SEAM_EDGE_MARGIN;
      if (seamCentre - half < -1 || seamCentre + half > viewportRef.current.width + 1)
        fitToSeam(null);
      return;
    }
    reanchoring.current = true;
    let completed = false;
    try {
      if (!(await moveSeam(0, 0.22))) return;
      setAnchorColumn(target);
      await nextFrame();
      await nextFrame();
      // The halves give way differently at the new boundary; keep the selected song where the eye is.
      fitToSeam(selectedRef.current);
      completed = await moveSeam(seamWidthRef.current, 0.55);
    } finally {
      reanchoring.current = false;
      // Something interrupted the move halfway: never leave the wall closed or half open.
      if (!completed) void moveSeam(seamWidthRef.current, 0.3);
    }
  };

  const visible = useMemo(
    () => (viewport.width && viewport.height ? cullBravaisSeats(wall, bounds, OVERSCAN) : []),
    [wall, bounds, viewport],
  );
  const select = useCallback(
    (index: number | null, pan = true) => {
      setSelectedIndex(index);
      if (index !== null && pan) panTo(index);
    },
    [panTo],
  );
  return { ...camera, wall, visible, panelRef, seamWidth, selectedIndex, select, panTo };
}
