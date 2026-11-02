"use client";

import { useSpring } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type MouseEvent,
} from "react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.4;
const FIT_PADDING = 24;
const PAN_EDGE = 32;
const ZOOM_SPRING = { stiffness: 320, damping: 34 };

interface PanDrag {
  id: number;
  panX: number;
  panY: number;
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Fits the receipt into the viewport, then lets the user zoom (buttons, keys, pinch or
 * ctrl/cmd + wheel, double click) and pan (drag or wheel) instead of a native scrollbar.
 * Zoom is relative to the fitted size, so 1 always means "whole receipt visible".
 */
export function useReceiptZoom() {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const fit = useRef(1);
  const zoom = useRef(MIN_ZOOM);
  const pan = useRef({ x: 0, y: 0 });
  const drag = useRef<PanDrag | null>(null);
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);
  const [isDragging, setIsDragging] = useState(false);
  const scale = useSpring(1, ZOOM_SPRING);
  const x = useSpring(0, ZOOM_SPRING);
  const y = useSpring(0, ZOOM_SPRING);

  const apply = useCallback(
    (nextZoom: number, panX: number, panY: number, immediate = false) => {
      const box = viewport.current;
      const el = content.current;
      if (!box || !el) return;
      const total = fit.current * nextZoom;
      const overflowX = el.offsetWidth * total - box.clientWidth;
      const overflowY = el.offsetHeight * total - box.clientHeight;
      const maxX = overflowX > 0 ? overflowX / 2 + PAN_EDGE : 0;
      const maxY = overflowY > 0 ? overflowY / 2 + PAN_EDGE : 0;
      zoom.current = nextZoom;
      pan.current = { x: clamp(panX, -maxX, maxX), y: clamp(panY, -maxY, maxY) };
      if (immediate) {
        scale.jump(total);
        x.jump(pan.current.x);
        y.jump(pan.current.y);
      } else {
        scale.set(total);
        x.set(pan.current.x);
        y.set(pan.current.y);
      }
      setZoomLevel(nextZoom);
    },
    [scale, x, y],
  );

  /** Zooms while keeping the content point under `origin` (relative to the viewport centre) still. */
  const zoomTo = useCallback(
    (next: number, origin = { x: 0, y: 0 }, immediate = false) => {
      const nextZoom = clamp(next, MIN_ZOOM, MAX_ZOOM);
      const ratio = nextZoom / zoom.current;
      apply(
        nextZoom,
        origin.x - (origin.x - pan.current.x) * ratio,
        origin.y - (origin.y - pan.current.y) * ratio,
        immediate,
      );
    },
    [apply],
  );

  const pointFrom = useCallback((clientX: number, clientY: number) => {
    const box = viewport.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };
    return { x: clientX - box.left - box.width / 2, y: clientY - box.top - box.height / 2 };
  }, []);

  const zoomIn = useCallback(() => zoomTo(zoom.current * ZOOM_STEP), [zoomTo]);
  const zoomOut = useCallback(() => zoomTo(zoom.current / ZOOM_STEP), [zoomTo]);
  const reset = useCallback(() => apply(MIN_ZOOM, 0, 0), [apply]);

  useEffect(() => {
    const box = viewport.current;
    const el = content.current;
    if (!box || !el) return;
    const measure = () => {
      fit.current = Math.min(
        1,
        (box.clientHeight - FIT_PADDING * 2) / el.offsetHeight,
        (box.clientWidth - FIT_PADDING) / el.offsetWidth,
      );
      apply(zoom.current, pan.current.x, pan.current.y, true);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, [apply]);

  useEffect(() => {
    const box = viewport.current;
    if (!box) return;
    // Trackpad pinch arrives as ctrl + wheel; React's wheel listener is passive, so bind natively.
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.ctrlKey || event.metaKey) {
        zoomTo(
          zoom.current * Math.exp(-event.deltaY * 0.01),
          pointFrom(event.clientX, event.clientY),
          true,
        );
      } else {
        apply(zoom.current, pan.current.x - event.deltaX, pan.current.y - event.deltaY, true);
      }
    };
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => box.removeEventListener("wheel", onWheel);
  }, [apply, pointFrom, zoomTo]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "+" || event.key === "=") zoomIn();
      else if (event.key === "-") zoomOut();
      else if (event.key === "0") reset();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reset, zoomIn, zoomOut]);

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (zoom.current <= MIN_ZOOM || event.button !== 0 || !event.isPrimary) return;
    if (event.target instanceof Element && event.target.closest("a, button")) return;
    drag.current = {
      id: event.pointerId,
      panX: pan.current.x,
      panY: pan.current.y,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    apply(
      zoom.current,
      current.panX + event.clientX - current.x,
      current.panY + event.clientY - current.y,
      true,
    );
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setIsDragging(false);
  }

  function onDoubleClick(event: MouseEvent<HTMLElement>) {
    if (event.target instanceof Element && event.target.closest("a, button")) return;
    zoomTo(zoom.current > MIN_ZOOM ? MIN_ZOOM : 2.2, pointFrom(event.clientX, event.clientY));
  }

  return {
    canZoomIn: zoomLevel < MAX_ZOOM,
    canZoomOut: zoomLevel > MIN_ZOOM,
    content,
    handlers: {
      onDoubleClick,
      onLostPointerCapture: onPointerUp,
      onPointerCancel: onPointerUp,
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
    isDragging,
    isZoomed: zoomLevel > MIN_ZOOM,
    reset,
    scale,
    viewport,
    x,
    y,
    zoomIn,
    zoomLevel,
    zoomOut,
  };
}
