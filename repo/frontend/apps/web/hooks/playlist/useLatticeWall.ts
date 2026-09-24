"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useLatticeCamera } from "@/hooks/playlist/useLatticeCamera";
import {
  getLatticeGeometry,
  getInstanceBlock,
  locateInstanceAt,
  layoutExpandedBlock,
  layoutLattice,
  locateNearestInstance,
} from "@/lib/playlist/lattice/layout";
import { findAdjacentInstance, findNearestInstance } from "@/lib/playlist/lattice/wallNavigation";
import type { QueueInstance, WallDirection } from "@/types/playlistLattice";

const metrics = { cellSize: 128, gap: 8 };

export function useLatticeWall(trackCount: number) {
  const camera = useLatticeCamera();
  const { bounds, viewport, viewportRef, center, cameraRef, fieldRef } = camera;
  const [selected, setSelected] = useState<QueueInstance | null>(null);
  const [focused, setFocused] = useState<QueueInstance | null>(null);
  const focusRef = useRef<QueueInstance | null>(null);
  const keyboardFocus = useRef(false);
  const geometry = useMemo(() => getLatticeGeometry(trackCount, metrics), [trackCount]);
  const layout = useMemo(
    () => (selected ? layoutExpandedBlock(geometry, trackCount, selected, metrics) : null),
    [geometry, selected, trackCount],
  );
  useEffect(() => {
    if (!selected) return;
    const rect = layout?.get(selected.instanceId);
    if (rect) center(rect);
  }, [center, layout, selected, viewport.width, viewport.height]);
  const instances = useMemo(() => {
    if (!viewport.width || !viewport.height) return [];
    const visible = layoutLattice(geometry, trackCount, bounds, 500, metrics);
    // Expansion redistributes every tile in its block; retain those tiles even when
    // their original positions lie outside the cull region.
    if (selected) {
      const block = getInstanceBlock(geometry, selected);
      for (let slot = 0; slot < 12; slot++) {
        const item = locateInstanceAt(geometry, trackCount, block.column, block.row, slot, metrics);
        if (item && !visible.some((tile) => tile.instanceId === item.instanceId))
          visible.push(item);
      }
    }
    for (const keep of [selected, focused])
      if (keep && !visible.some((item) => item.instanceId === keep.instanceId)) visible.push(keep);
    return visible;
  }, [geometry, bounds, selected, focused, trackCount, viewport]);
  const focus = useCallback((instance: QueueInstance) => {
    focusRef.current = instance;
    setFocused((previous) => (previous?.instanceId === instance.instanceId ? previous : instance));
  }, []);
  const select = useCallback(
    (instance: QueueInstance) => {
      focus(instance);
      setSelected(instance);
    },
    [focus],
  );
  const locate = useCallback(
    (index: number) => {
      const current = cameraRef.current,
        viewport = viewportRef.current;
      const point = {
        x: (viewport.width / 2 - current.x) / current.scale,
        y: (viewport.height / 2 - current.y) / current.scale,
      };
      const instance = locateNearestInstance(geometry, trackCount, index, point, metrics);
      if (!instance) return;
      select(instance);
      const rect = layoutExpandedBlock(geometry, trackCount, instance, metrics).get(
        instance.instanceId,
      );
      if (rect) center(rect);
    },
    [cameraRef, center, geometry, select, trackCount, viewportRef],
  );
  useEffect(() => {
    if (!keyboardFocus.current || !focused) return;
    keyboardFocus.current = false;
    const frame = requestAnimationFrame(() => {
      const poster = [
        ...(fieldRef.current?.querySelectorAll<HTMLElement>("[data-instance]") ?? []),
      ].find((node) => node.dataset.instance === focused.instanceId);
      poster?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [fieldRef, focused]);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>, onClose: () => void) => {
    if (event.defaultPrevented) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (selected || focused) {
        setSelected(null);
        setFocused(null);
        focusRef.current = null;
        fieldRef.current?.focus({ preventScroll: true });
      } else onClose();
      return;
    }
    if (
      event.target instanceof Element &&
      event.target.closest('button, input, [role="slider"], [role="menu"]')
    )
      return;
    const direction: WallDirection | undefined =
      event.key === "ArrowLeft"
        ? "left"
        : event.key === "ArrowRight"
          ? "right"
          : event.key === "ArrowUp"
            ? "up"
            : event.key === "ArrowDown"
              ? "down"
              : undefined;
    if (!direction) return;
    event.preventDefault();
    event.stopPropagation();
    const current = cameraRef.current;
    const from = focusRef.current;
    const next = from
      ? findAdjacentInstance(from, direction, geometry, trackCount, metrics, layout ?? undefined)
      : findNearestInstance(instances, {
          x: (viewport.width / 2 - current.x) / current.scale,
          y: (viewport.height / 2 - current.y) / current.scale,
        });
    if (!next) return;
    keyboardFocus.current = true;
    focus(next);
    center(layout?.get(next.instanceId) ?? next, false);
  };
  return { ...camera, instances, layout, selected, focused, select, locate, focus, onKeyDown };
}
