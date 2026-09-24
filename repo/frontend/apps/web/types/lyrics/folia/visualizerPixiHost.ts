import type { DependencyList, RefObject } from "react";

// src/components/visualizer/pixiRuntimeHost.ts
// Mount-once lifecycle for the imperative Pixi directors (tempera, sonnet). Those runtimes used
// to list every song-scoped input in their create effect's dependency array, so a track change
// destroyed the WebGL context, the texture pool and the whole scene cache and rebuilt them from
// scratch - with the canvas gone from the DOM for the whole async build. Here the runtime is
// created once and a song change is handed to it in place, the same way tuning changes already
// were, while the outgoing song keeps rendering until the runtime is ready to swap.

export interface VisualizerPixiHostOptions<TRuntime, TSong> {
  hostRef: RefObject<HTMLDivElement | null>;
  /** Prefix for console output, e.g. `Tempera`. */
  label: string;
  /**
   * Inputs that genuinely require a new runtime (canvas-wide settings, texture pools).
   * Song-scoped inputs must NOT appear here - that is what `song` is for.
   */
  rebuildKey: DependencyList;
  /** Everything that changes per track, as one object whose identity changes with it. */
  song: TSong;
  create: (host: HTMLDivElement, song: TSong, signal: AbortSignal) => Promise<TRuntime>;
  /** Applies a new song to a live runtime. Resolves when the handover has finished. */
  swap: (runtime: TRuntime, song: TSong, signal: AbortSignal) => Promise<void> | void;
  destroy: (runtime: TRuntime) => void;
  /** Reported when `create` fails, so the mode can show its text fallback. */
  onFailedChange?: (failed: boolean) => void;
}
