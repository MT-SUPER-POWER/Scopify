"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { useLatticePointer } from "@/hooks/playlist/useLatticePointer";
import type {
  Bounds,
  LatticeCamera,
  LatticeCameraOptions,
  LatticeViewport,
  ReflowTile,
} from "@/types/playlist/lattice";

// The wall fills the pane; keep focused posters below the overlaid h-16 Header.
const HEADER_INSET = 64;

const getBounds = (camera: LatticeCamera, viewport: LatticeViewport): Bounds => ({
  left: -camera.x / camera.scale,
  top: -camera.y / camera.scale,
  right: (viewport.width - camera.x) / camera.scale,
  bottom: (viewport.height - camera.y) / camera.scale,
});

export function useLatticeCamera({
  centered = false,
  minScale = 0.2,
  maxScale = 2,
  origin,
  clamp,
  onFrame,
  onZoom,
  dragSign,
}: LatticeCameraOptions = {}) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<LatticeCamera>({ x: 0, y: 0, scale: 0.65 });
  const viewportRef = useRef<LatticeViewport>({ width: 0, height: 0 });
  const boundsRef = useRef(getBounds(cameraRef.current, viewportRef.current));
  const [bounds, setBounds] = useState(boundsRef.current);
  const [viewport, setViewport] = useState(viewportRef.current);
  const animationRef = useRef<{ stop: () => void } | null>(null);
  const reducedMotion = useReducedMotion();
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const onZoomRef = useRef(onZoom);
  onZoomRef.current = onZoom;
  const clampRef = useRef(clamp);
  clampRef.current = clamp;
  const originRef = useRef(origin);
  originRef.current = origin;
  const stop = useCallback(() => {
    animationRef.current?.stop();
    animationRef.current = null;
  }, []);
  const crispTimer = useRef<number | undefined>(undefined);
  const apply = useCallback((requested: LatticeCamera, force = false) => {
    const next = clampRef.current?.(requested, viewportRef.current) ?? requested;
    cameraRef.current = next;
    const world = worldRef.current;
    if (world) {
      // While moving, keep the world on its own layer so panning stays on the compositor. A layer
      // rasterised before a zoom is only stretched afterwards, so once the camera rests the hint is
      // dropped and the browser redraws everything at the scale it is shown at.
      if (world.style.willChange !== "transform") world.style.willChange = "transform";
      world.style.transform = `translate3d(${next.x}px, ${next.y}px, 0) scale(${next.scale})`;
      window.clearTimeout(crispTimer.current);
      crispTimer.current = window.setTimeout(() => {
        world.style.willChange = "auto";
      }, 160);
    }
    onFrameRef.current?.(next);
    const visible = getBounds(next, viewportRef.current);
    const culled = boundsRef.current;
    // 500 world-pixel overscan; refill with 180 pixels still in reserve.
    if (
      force ||
      visible.left < culled.left - 320 ||
      visible.right > culled.right + 320 ||
      visible.top < culled.top - 320 ||
      visible.bottom > culled.bottom + 320
    ) {
      boundsRef.current = visible;
      setBounds(visible);
    }
  }, []);
  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const resize = () => {
      const previous = viewportRef.current;
      const next = { width: field.clientWidth, height: field.clientHeight };
      viewportRef.current = next;
      const camera = cameraRef.current;
      apply(
        previous.width
          ? {
              ...camera,
              x: camera.x + (next.width - previous.width) / 2,
              y: camera.y + (next.height - previous.height) / 2,
            }
          : centered
            ? {
                x: next.width / 2 - (originRef.current?.x ?? 0),
                y: next.height / 2 - (originRef.current?.y ?? 0),
                scale: 1,
              }
            : { ...camera, scale: Math.min(0.65, Math.max(0.35, next.width / 1750)) },
        true,
      );
      setViewport(next);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(field);
    return () => {
      observer.disconnect();
      window.clearTimeout(crispTimer.current);
      stop();
    };
  }, [apply, centered, stop]);
  const center = useCallback(
    (rect: Omit<ReflowTile, "instanceId">, fit = true) => {
      stop();
      const viewport = viewportRef.current;
      const inset = centered ? 0 : HEADER_INSET;
      const contentHeight = Math.max(0, viewport.height - inset);
      const start = cameraRef.current;
      const scale = fit
        ? Math.min(
            0.72,
            Math.max(0.2, (viewport.width - 48) / rect.width),
            Math.max(0.2, (contentHeight - 48) / rect.height),
          )
        : start.scale;
      const next = {
        x: (viewport.width - rect.width * scale) / 2 - rect.x * scale,
        y: inset + (contentHeight - rect.height * scale) / 2 - rect.y * scale,
        scale,
      };
      if (reducedMotion) {
        apply(next, true);
        return;
      }
      animationRef.current = animate(0, 1, {
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (progress) =>
          apply({
            x: start.x + (next.x - start.x) * progress,
            y: start.y + (next.y - start.y) * progress,
            scale: start.scale + (next.scale - start.scale) * progress,
          }),
        onComplete: () => apply(next, true),
      });
    },
    [apply, centered, reducedMotion, stop],
  );
  const zoom = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      if (onZoomRef.current) {
        onZoomRef.current(factor);
        return;
      }
      const field = fieldRef.current;
      if (!field) return;
      const rect = field.getBoundingClientRect();
      const from = cameraRef.current;
      const scale = Math.min(maxScale, Math.max(minScale, from.scale * factor));
      if (scale === from.scale) return;
      // Keep the world point under the pointer (or the pane centre) where it is.
      const px = (clientX ?? rect.left + rect.width / 2) - rect.left;
      const py = (clientY ?? rect.top + rect.height / 2) - rect.top;
      const ratio = scale / from.scale;
      apply({ x: px - (px - from.x) * ratio, y: py - (py - from.y) * ratio, scale });
    },
    [apply, fieldRef, maxScale, minScale],
  );
  /** Button and key zoom: eases towards the target instead of jumping. */
  const zoomBy = useCallback(
    (factor: number) => {
      if (onZoomRef.current) {
        onZoomRef.current(factor);
        return;
      }
      stop();
      const from = cameraRef.current;
      const scale = Math.min(maxScale, Math.max(minScale, from.scale * factor));
      const field = fieldRef.current;
      if (!field || scale === from.scale) return;
      const view = viewportRef.current;
      const ratio = scale / from.scale;
      const next = {
        x: view.width / 2 - (view.width / 2 - from.x) * ratio,
        y: view.height / 2 - (view.height / 2 - from.y) * ratio,
        scale,
      };
      if (reducedMotion) {
        apply(next, true);
        return;
      }
      animationRef.current = animate(0, 1, {
        duration: 0.25,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (progress) =>
          apply({
            x: from.x + (next.x - from.x) * progress,
            y: from.y + (next.y - from.y) * progress,
            scale: from.scale + (next.scale - from.scale) * progress,
          }),
        onComplete: () => apply(next, true),
      });
    },
    [apply, fieldRef, maxScale, minScale, reducedMotion, stop, viewportRef, cameraRef],
  );
  const pointerHandlers = useLatticePointer({
    fieldRef,
    cameraRef,
    viewportRef,
    animationRef,
    apply,
    stop,
    reducedMotion,
    zoom,
    dragSign,
  });
  return {
    fieldRef,
    worldRef,
    cameraRef,
    viewport,
    viewportRef,
    bounds,
    center,
    zoomBy,
    pointerHandlers,
  };
}
