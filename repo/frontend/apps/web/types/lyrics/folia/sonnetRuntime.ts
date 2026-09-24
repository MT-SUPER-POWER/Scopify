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
