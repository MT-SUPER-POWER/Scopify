import type { SceneView } from "./sonnetScene";
import type { MotionValue } from "framer-motion";
import type { AudioBands, SonnetTuning, Theme } from "../../../components/lyrics/folia/src/types";
import type { SonnetProgram } from "../../../components/lyrics/folia/src/components/visualizer/sonnet/types";

// src/components/visualizer/sonnet/createSonnetPixiRuntime.ts
// Owns Pixi lifecycle and mutates bounded scene views directly from absolute playback time.
export type PixiModule = typeof import("pixi.js");

export interface SonnetSongMetadata {
  title?: string | null;
  artist?: string | null;
  album?: string | null;
}

export interface SonnetRuntimeOptions {
  host: HTMLDivElement;
  songSeed?: string | number;
  program: SonnetProgram;
  theme: Theme;
  tuning: SonnetTuning;
  currentTime: MotionValue<number>;
  audioPower?: MotionValue<number>;
  audioBands?: AudioBands;
  lyricsFontScale: number;
  staticMode: boolean;
  transparentBackground: boolean;
  paused: boolean;
  songTitle?: string | null;
  songArtist?: string | null;
  songAlbum?: string | null;
  signal?: AbortSignal;
}

export interface SonnetSongContext {
  /**
   * Track identity. Only a change here is a real song change; the rest of this object also
   * moves when the theme is edited or lyrics are hidden, and those must swap silently rather
   * than play a dissolve.
   */
  seed: string | number | undefined;
  program: SonnetProgram;
  theme: Theme;
}

export interface SonnetIconTextures {
  textures: Map<string, import("pixi.js").Texture>;
  urls: Set<string>;
}

export interface SonnetSongSwap {
  /** Cleared once committed; the rest of the dissolve is the uncover. */
  pending: SonnetSongContext | null;
  /** Already acquired for the incoming theme; adopted on commit, released if abandoned. */
  pendingIcons: SonnetIconTextures | null;
  /** The incoming scene, built under the cover before the commit needs it. */
  staged: SonnetStagedScene | null;
  startedAt: number;
  settle: () => void;
  /** Drops the abort listener, so a long skip session cannot pile them up on one signal. */
  detachAbort: () => void;
}

export interface SonnetStagedScene {
  scene: SceneView;
  index: number;
}
