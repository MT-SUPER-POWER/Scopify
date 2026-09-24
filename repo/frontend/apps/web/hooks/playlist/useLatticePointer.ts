"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { animate } from "framer-motion";
import type { LatticePointerOptions, LatticeDrag } from "@/types/playlistLattice";

export function useLatticePointer({
  fieldRef,
  cameraRef,
  viewportRef,
  animationRef,
  apply,
  stop,
  reducedMotion,
}: LatticePointerOptions) {
  const drag = useRef<LatticeDrag | null>(null);
  const didDrag = useRef(false);
  const cancel = useCallback(() => {
    const pointer = drag.current;
    drag.current = null;
    if (pointer && fieldRef.current?.hasPointerCapture(pointer.pointerId))
      fieldRef.current.releasePointerCapture(pointer.pointerId);
    if (fieldRef.current) delete fieldRef.current.dataset.dragging;
    stop();
  }, [fieldRef, stop]);
  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || !event.isPrimary || drag.current) return;
      stop();
      didDrag.current = false;
      if (
        event.target instanceof Element &&
        event.target.closest(
          'button:not([data-lattice-select]), input, select, textarea, a, [role="slider"]',
        )
      )
        return;
      drag.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        camera: cameraRef.current,
        lastX: event.clientX,
        lastY: event.clientY,
        time: event.timeStamp,
        vx: 0,
        vy: 0,
      };
    },
    [cameraRef, stop],
  );
  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const pointer = drag.current;
      if (!pointer || pointer.pointerId !== event.pointerId) return;
      const dx = event.clientX - pointer.x,
        dy = event.clientY - pointer.y;
      if (!didDrag.current && Math.hypot(dx, dy) > 7) {
        didDrag.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.dataset.dragging = "true";
      }
      const elapsed = event.timeStamp - pointer.time;
      if (elapsed > 0) {
        pointer.vx = ((event.clientX - pointer.lastX) / elapsed) * 1000;
        pointer.vy = ((event.clientY - pointer.lastY) / elapsed) * 1000;
      }
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;
      pointer.time = event.timeStamp;
      if (didDrag.current)
        apply({ ...pointer.camera, x: pointer.camera.x + dx, y: pointer.camera.y + dy });
    },
    [apply],
  );
  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const pointer = drag.current;
      if (!pointer || pointer.pointerId !== event.pointerId) return;
      drag.current = null;
      delete event.currentTarget.dataset.dragging;
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
      if (!didDrag.current || reducedMotion || event.timeStamp - pointer.time > 80) return;
      const speed = Math.hypot(pointer.vx, pointer.vy);
      if (speed < 40) return;
      const from = cameraRef.current;
      animationRef.current = animate(0, Math.min(speed, 4000) * 0.3, {
        type: "inertia",
        velocity: Math.min(speed, 4000),
        power: 0.3,
        timeConstant: 280,
        restDelta: 0.5,
        onUpdate: (distance) =>
          apply({
            ...from,
            x: from.x + (distance * pointer.vx) / speed,
            y: from.y + (distance * pointer.vy) / speed,
          }),
      });
    },
    [animationRef, apply, cameraRef, reducedMotion],
  );
  const onPointerCancel = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (drag.current?.pointerId === event.pointerId) cancel();
    },
    [cancel],
  );
  const onClickCapture = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!didDrag.current || event.detail === 0) return;
    didDrag.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);
  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      if (drag.current) return;
      stop();
      const unit =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewportRef.current.height : 1;
      const dx = (event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX) * unit;
      const dy = (event.shiftKey && !event.deltaX ? 0 : event.deltaY) * unit;
      const from = cameraRef.current;
      apply({ ...from, x: from.x - dx, y: from.y - dy });
    };
    const outside = (event: globalThis.PointerEvent) => {
      if (drag.current?.pointerId === event.pointerId) cancel();
    };
    field.addEventListener("wheel", wheel, { passive: false });
    field.addEventListener("keydown", cancel, true);
    window.addEventListener("blur", cancel);
    window.addEventListener("pointerup", outside);
    window.addEventListener("pointercancel", outside);
    return () => {
      field.removeEventListener("wheel", wheel);
      field.removeEventListener("keydown", cancel, true);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("pointerup", outside);
      window.removeEventListener("pointercancel", outside);
      cancel();
    };
  }, [apply, cameraRef, cancel, fieldRef, stop, viewportRef]);
  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture: onPointerCancel,
    onClickCapture,
  };
}
