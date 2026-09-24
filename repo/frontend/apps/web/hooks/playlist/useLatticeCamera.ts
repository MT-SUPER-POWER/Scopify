"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { LatticeCamera, LatticeDrag, ReflowTile } from "@/types/playlistLattice";

export function useLatticeCamera() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<LatticeCamera>({ x: 24, y: 16, scale: 0.65 });
  const [camera, setCamera] = useState(cameraRef.current);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const drag = useRef<LatticeDrag | null>(null);
  const didDrag = useRef(false);
  const frame = useRef<number | null>(null);
  const move = useCallback((next: LatticeCamera) => {
    cameraRef.current = next;
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      setCamera(cameraRef.current);
    });
  }, []);
  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const observer = new ResizeObserver(([entry]) => {
      setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(field);
    const wheel = (event: WheelEvent) => {
      // Keep browser zoom available; ordinary wheel/trackpad gestures move the wall.
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? field.clientHeight : 1;
      move({
        ...cameraRef.current,
        x: cameraRef.current.x - event.deltaX * factor,
        y: cameraRef.current.y - event.deltaY * factor,
      });
    };
    field.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer.disconnect();
      field.removeEventListener("wheel", wheel);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [move]);
  const center = useCallback(
    (rect: Omit<ReflowTile, "instanceId">) => {
      const scale = Math.min(
        0.72,
        Math.max(0.2, (viewport.width - 64) / rect.width),
        Math.max(0.2, (viewport.height - 64) / rect.height),
      );
      move({
        x: (viewport.width - rect.width * scale) / 2 - rect.x * scale,
        y: (viewport.height - rect.height * scale) / 2 - rect.y * scale,
        scale,
      });
    },
    [move, viewport],
  );
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !event.isPrimary) return;
    didDrag.current = false;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      camera: cameraRef.current,
    };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!didDrag.current && Math.hypot(dx, dy) < 6) return;
    didDrag.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    move({ ...start.camera, x: start.camera.x + dx, y: start.camera.y + dy });
  };
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return {
    fieldRef,
    camera,
    cameraRef,
    viewport,
    center,
    move,
    didDrag,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onLostPointerCapture: endDrag,
    },
  };
}
