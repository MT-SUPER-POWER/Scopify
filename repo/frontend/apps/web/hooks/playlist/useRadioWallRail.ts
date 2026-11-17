"use client";

import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  type AnimationPlaybackControls,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";

import type { RadioWallDrag, RadioWallRailOptions } from "@/types/playlist/radioWall";

const DRAG_THRESHOLD = 8;
const RAIL_SPRING = { type: "spring", stiffness: 250, damping: 32, mass: 0.9 } as const;

export function useRadioWallRail({
  anchor,
  anchorKey,
  range: { min, max },
  fieldRef,
  step,
  reducedMotion,
}: RadioWallRailOptions) {
  const [selection, setSelection] = useState({ key: anchorKey, position: anchor });
  if (selection.key !== anchorKey) setSelection({ key: anchorKey, position: anchor });
  const selected =
    selection.key === anchorKey ? Math.max(min, Math.min(max, selection.position)) : anchor;
  const rail = useMotionValue(anchor);
  const [visibleAt, setVisibleAt] = useState(anchor);
  const visibleAtRef = useRef(anchor);
  const [dragging, setDragging] = useState(false);
  const [settled, setSettled] = useState(true);
  const animation = useRef<AnimationPlaybackControls | null>(null);
  const drag = useRef<RadioWallDrag | null>(null);
  const suppressClick = useRef(false);

  useMotionValueEvent(rail, "change", (value) => {
    const next = Math.round(value);
    if (next === visibleAtRef.current) return;
    visibleAtRef.current = next;
    setVisibleAt(next);
  });

  const select = useCallback(
    (position: number) =>
      setSelection((previous) => {
        const next = Math.max(min, Math.min(max, position));
        return previous.key === anchorKey && previous.position === next
          ? previous
          : { key: anchorKey, position: next };
      }),
    [anchorKey, max, min],
  );

  const nudge = useCallback(
    (direction: number) =>
      setSelection((previous) => {
        const from = previous.key === anchorKey ? previous.position : anchor;
        const position = Math.max(min, Math.min(max, from + direction));
        return previous.key === anchorKey && previous.position === position
          ? previous
          : { key: anchorKey, position };
      }),
    [anchor, anchorKey, max, min],
  );

  useEffect(() => {
    if (dragging) return;
    animation.current?.stop();
    const distance = selected - rail.get();
    if (reducedMotion || distance === 0) {
      rail.set(selected);
      setSettled(true);
      return;
    }
    // A search may jump to the other end of a large queue. Only animate the last few slots.
    if (Math.abs(distance) > 5) rail.jump(selected - Math.sign(distance) * 2);
    setSettled(false);
    animation.current = animate(rail, selected, {
      ...RAIL_SPRING,
      onComplete: () => setSettled(true),
    });
    return () => animation.current?.stop();
  }, [dragging, rail, reducedMotion, selected]);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    let accumulated = 0;
    let lastEvent = 0;
    let lastStep = 0;
    const scroll = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      if (drag.current || event.timeStamp - lastStep < 220) return;
      if (event.timeStamp - lastEvent > 180) accumulated = 0;
      lastEvent = event.timeStamp;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      accumulated += delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? step : 1);
      if (Math.abs(accumulated) < 36) return;
      nudge(Math.sign(accumulated));
      accumulated = 0;
      lastStep = event.timeStamp;
    };
    field.addEventListener("wheel", scroll, { passive: false });
    // The wall already owns touch gestures. Prevent viewport scrolling on WebKit when the
    // browser still delivers a native move from a descendant's implicit capture.
    const preventTouchScroll = (event: TouchEvent) => {
      if (drag.current && event.cancelable) event.preventDefault();
    };
    field.addEventListener("touchmove", preventTouchScroll, { passive: false });
    return () => {
      field.removeEventListener("wheel", scroll);
      field.removeEventListener("touchmove", preventTouchScroll);
    };
  }, [fieldRef, nudge, step]);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0 || drag.current) return;
    suppressClick.current = false;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      from: rail.get(),
      moved: false,
      horizontal: false,
    };
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const dx = event.clientX - active.x;
    const dy = event.clientY - active.y;
    if (!active.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      active.moved = true;
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!active.horizontal && Math.abs(dx) > DRAG_THRESHOLD) {
      animation.current?.stop();
      active.from = rail.get();
      active.horizontal = true;
      setDragging(true);
      setSettled(false);
    }
    if (active.horizontal) rail.set(Math.max(min, Math.min(max, active.from - dx / step)));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (!active.horizontal) return;
    if (!cancelled) {
      const next = Math.round(rail.get());
      const dx = event.clientX - active.x;
      select(next === selected && Math.abs(dx) > 45 ? selected - Math.sign(dx) : next);
    }
    setDragging(false);
  };

  const cancelClickAfterDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current || event.detail === 0) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return {
    rail,
    visibleAt,
    selected,
    settled,
    dragging,
    select,
    nudge,
    cancelClickAfterDrag,
    pointerHandlers: {
      onPointerDown: startDrag,
      onPointerMove: moveDrag,
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => endDrag(event),
      onPointerLeave: (event: PointerEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget && !drag.current?.moved) endDrag(event, true);
      },
      onPointerCancel: (event: PointerEvent<HTMLDivElement>) => endDrag(event, true),
      onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => {
        // Capture transferred from a cover is expected on touch input.
        if (event.target === event.currentTarget) endDrag(event, true);
      },
    },
  };
}
