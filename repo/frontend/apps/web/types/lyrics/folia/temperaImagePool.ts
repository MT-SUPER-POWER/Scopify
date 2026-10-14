import type { TemperaLayerImage } from "@/components/lyrics/folia/src/types";

/** Everything the canvas-image dialog edits, committed to the tuning in one patch on close. */
export interface TemperaImageLayerCommit {
  layerImages: TemperaLayerImage[];
  layerImageDepth: "back" | "front";
  layerImageFrequency: number;
}

/**
 * Which pool-wide file action is in flight. `adding` and `importing` write the draft after
 * their last await, so both lock the dialog's close paths; `exporting` only reads it.
 */
export type TemperaPoolBusyAction = "idle" | "adding" | "exporting" | "importing";

/** Whether a backup's images replace the pool or join it. */
export type TemperaPoolImportMode = "append" | "replace";

export interface TemperaImagePoolSnapshot {
  layerImages: TemperaLayerImage[];
}

export interface TemperaImageArchiveExportResult {
  blob: Blob;
  /** Placements whose bytes made it into the zip. */
  exported: number;
  /** Placements left out because their file was gone from IndexedDB. */
  skipped: number;
}

export interface TemperaImageArchiveImportResult {
  layerImages: TemperaLayerImage[];
  /** Manifest rows skipped because their bytes were missing or not an image the pool accepts. */
  skipped: number;
  /** Resolvable entries dropped because the pool was already full. */
  truncated: number;
}

export interface TemperaArchiveImageEntry {
  image: TemperaLayerImage;
  bytes: Uint8Array;
  mimeType: string;
}

export interface TemperaImageArchiveReadOptions {
  existing: TemperaLayerImage[];
  maxImages?: number;
  signal?: AbortSignal;
}

export interface UseTemperaImagePoolOptions {
  images: TemperaLayerImage[];
  depth: "back" | "front";
  frequency: number;
  onCommit: (next: TemperaImageLayerCommit) => void;
}
