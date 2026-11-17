import type { ReactNode } from "react";

import type { FoliaPlaybackBridge } from "@/types/lyrics/folia/stage";

export type CinemaQuality = "low" | "medium" | "high";

export interface CinemaScenePreferences {
  enabled: boolean;
  seatId: string | null;
  houseLights: boolean;
  curtainsOnPause: boolean;
  quality: CinemaQuality;
}

export interface CinemaSceneState extends CinemaScenePreferences {
  cameraRevision: number;
  recenter: () => void;
  updatePreferences: (preferences: Partial<CinemaScenePreferences>) => void;
}

export interface CinemaSeat {
  id: string;
  row: number;
  number: number;
  eye: [number, number, number];
  occupied: boolean;
}

export interface CinemaSceneInputs {
  active: boolean;
  artworkUrl: string | null;
  accentColor: string;
  bridge: Pick<FoliaPlaybackBridge, "audioBands" | "audioPower" | "isPlaying">;
  reducedMotion: boolean;
}

export interface CinemaSceneSurfaceProps extends Omit<CinemaSceneInputs, "reducedMotion"> {
  isChromeHidden: boolean;
  preserveScreenDrag: boolean;
  onBack: () => void;
  children: (projected: boolean) => ReactNode;
}

export interface CinemaRuntime {
  draw: (now: number, inputs: CinemaSceneInputs) => void;
  turn: (yaw: number, pitch: number) => void;
  dispose: () => void;
}

export type CinemaRuntimeStatus = "idle" | "ready" | "failed";

export interface CinemaPointerDrag {
  pointerId: number;
  x: number;
  y: number;
  captured: boolean;
}
