"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { useLatticePointer } from "@/hooks/playlist/useLatticePointer";
import type { Bounds, LatticeCamera, LatticeViewport, ReflowTile } from "@/types/playlistLattice";

// The wall fills the pane; keep focused posters below the overlaid h-16 Header.
const HEADER_INSET = 64;

const getBounds = (camera: LatticeCamera, viewport: LatticeViewport): Bounds => ({
  left: -camera.x / camera.scale,
  top: -camera.y / camera.scale,
  right: (viewport.width - camera.x) / camera.scale,
  bottom: (viewport.height - camera.y) / camera.scale,
});

export function useLatticeCamera() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<LatticeCamera>({ x: 0, y: 0, scale: 0.65 });
  const viewportRef = useRef<LatticeViewport>({ width: 0, height: 0 });
  const boundsRef = useRef(getBounds(cameraRef.current, viewportRef.current));
  const [bounds, setBounds] = useState(boundsRef.current);
  const [viewport, setViewport] = useState(viewportRef.current);
  const animationRef = useRef<{ stop: () => void } | null>(null);
  const reducedMotion = useReducedMotion();
  const stop = useCallback(() => {
    animationRef.current?.stop();
    animationRef.current = null;
  }, []);
  const apply = useCallback((next: LatticeCamera, force = false) => {
    cameraRef.current = next;
    if (worldRef.current)
      worldRef.current.style.transform = `translate3d(${next.x}px, ${next.y}px, 0) scale(${next.scale})`;
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
      stop();
    };
  }, [apply, stop]);
  const center = useCallback(
    (rect: Omit<ReflowTile, "instanceId">, fit = true) => {
      stop();
      const viewport = viewportRef.current;
      const contentHeight = Math.max(0, viewport.height - HEADER_INSET);
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
        y: HEADER_INSET + (contentHeight - rect.height * scale) / 2 - rect.y * scale,
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
    [apply, reducedMotion, stop],
  );
  const pointerHandlers = useLatticePointer({
    fieldRef,
    cameraRef,
    viewportRef,
    animationRef,
    apply,
    stop,
    reducedMotion,
  });
  return { fieldRef, worldRef, cameraRef, viewport, viewportRef, bounds, center, pointerHandlers };
}
