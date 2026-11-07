import type { Bounds, LatticeCamera, LatticeViewport } from "@/types/playlist/lattice";

export const getCameraBounds = (camera: LatticeCamera, viewport: LatticeViewport): Bounds => ({
  left: -camera.x / camera.scale,
  top: -camera.y / camera.scale,
  right: (viewport.width - camera.x) / camera.scale,
  bottom: (viewport.height - camera.y) / camera.scale,
});

/** Where a wall opens; the skeleton draws from the same camera so its tiles land on the real ones. */
export const getInitialCamera = (viewport: LatticeViewport, centered: boolean): LatticeCamera =>
  centered
    ? { x: viewport.width / 2, y: viewport.height / 2, scale: 1 }
    : { x: 0, y: 0, scale: Math.min(0.65, Math.max(0.35, viewport.width / 1750)) };
