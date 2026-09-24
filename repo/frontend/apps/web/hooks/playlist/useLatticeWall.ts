"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLatticeCamera } from "@/hooks/playlist/useLatticeCamera";
import {
  getLatticeGeometry,
  layoutExpandedBlock,
  layoutLattice,
  locateNearestInstance,
} from "@/lib/playlist/lattice/layout";
import type { QueueInstance } from "@/types/playlistLattice";

const metrics = { cellSize: 128, gap: 8 };

export function useLatticeWall(trackCount: number) {
  const camera = useLatticeCamera();
  const { camera: position, viewport, center, cameraRef } = camera;
  const [selected, setSelected] = useState<QueueInstance | null>(null);
  const geometry = useMemo(() => getLatticeGeometry(trackCount, metrics), [trackCount]);
  // Keep the selected card centred when the sidebar or window is resized.
  useEffect(() => {
    if (!selected) return;
    const rect = layoutExpandedBlock(geometry, trackCount, selected, metrics).get(
      selected.instanceId,
    );
    if (rect) center(rect);
  }, [center, geometry, selected, trackCount]);
  const instances = useMemo(() => {
    if (!viewport.width || !viewport.height) return [];
    const bounds = {
      left: -position.x / position.scale,
      top: -position.y / position.scale,
      right: (viewport.width - position.x) / position.scale,
      bottom: (viewport.height - position.y) / position.scale,
    };
    const visible = layoutLattice(geometry, trackCount, bounds, 180, metrics);
    if (selected && !visible.some((item) => item.instanceId === selected.instanceId))
      visible.push(selected);
    return visible;
  }, [geometry, position, selected, trackCount, viewport]);
  const layout = useMemo(
    () => (selected ? layoutExpandedBlock(geometry, trackCount, selected, metrics) : null),
    [geometry, selected, trackCount],
  );
  const select = useCallback((instance: QueueInstance) => {
    setSelected((previous) => (previous?.instanceId === instance.instanceId ? null : instance));
  }, []);
  const locate = useCallback(
    (index: number) => {
      const current = cameraRef.current;
      const point = {
        x: (viewport.width / 2 - current.x) / current.scale,
        y: (viewport.height / 2 - current.y) / current.scale,
      };
      const instance = locateNearestInstance(geometry, trackCount, index, point, metrics);
      if (!instance) return;
      setSelected(instance);
      const rect = layoutExpandedBlock(geometry, trackCount, instance, metrics).get(
        instance.instanceId,
      );
      if (rect) center(rect);
    },
    [cameraRef, center, geometry, trackCount, viewport],
  );
  return { ...camera, instances, layout, selected, select, locate };
}
