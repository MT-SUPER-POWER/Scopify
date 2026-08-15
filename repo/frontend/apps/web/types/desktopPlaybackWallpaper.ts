import type {
  DesktopPlaybackControllerLayout,
  DesktopPlaybackWallpaperModel,
  DesktopPlaybackWallpaperPreferencesUpdate,
  PlaybackProjection,
} from "@scopify/desktop-contract";
import type { MotionValue } from "framer-motion";

import type { FoliaPlaybackBridge } from "@/types/foliaStage";
import type { LyricData } from "@/types/lyrics";
import type { PlaybackPresentationTrack } from "@/types/playbackProjection";

export type DesktopPlaybackControllerTab = "appearance" | "wallpaper";

export interface DesktopWallpaperFoliaPlaybackState {
  bridge: FoliaPlaybackBridge;
  model: DesktopPlaybackWallpaperModel | null;
  positionMs: number;
  projection: PlaybackProjection<LyricData>;
  track: PlaybackPresentationTrack | null;
}

export interface DesktopWallpaperAudioMotionValues {
  audioPower: MotionValue<number>;
  bass: MotionValue<number>;
  lowMid: MotionValue<number>;
  mid: MotionValue<number>;
  spectrum: MotionValue<Uint8Array<ArrayBuffer>>;
  treble: MotionValue<number>;
  vocal: MotionValue<number>;
}

export interface DesktopPlaybackWallpaperControllerState {
  closeController(): Promise<boolean>;
  configure(
    update: DesktopPlaybackWallpaperPreferencesUpdate,
  ): Promise<DesktopPlaybackWallpaperModel | null>;
  isPending: boolean;
  model: DesktopPlaybackWallpaperModel | null;
  retry(): Promise<DesktopPlaybackWallpaperModel | null>;
  setLayout(layout: DesktopPlaybackControllerLayout): Promise<boolean>;
  showController(): Promise<boolean>;
}
