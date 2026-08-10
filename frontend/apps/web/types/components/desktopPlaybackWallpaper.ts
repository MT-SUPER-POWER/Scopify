import type {
  DesktopIconVisibilityState,
  DesktopPlaybackWallpaperModel,
  DesktopPlaybackWallpaperPreferencesUpdate,
} from "@scopify/desktop-contract";
import type { ReactNode } from "react";

import type { SongDetail } from "@/types/api/music";
import type { DesktopLyricTrack } from "@/types/desktopLyric";

export interface DesktopPlaybackControllerLyric {
  primary: string;
  secondary?: string;
}

export interface FoliaPlaybackProgressBarProps {
  ariaLabel: string;
  durationMs: number;
  onSeek(positionMs: number): void;
  positionMs: number;
}

export interface DesktopPlaybackPlayerControlsProps {
  activeLyric: DesktopPlaybackControllerLyric | null;
  currentSong: SongDetail | null;
  desktopControl: ReactNode;
  durationMs: number;
  isPlaying: boolean;
  onNext(): void;
  onPrevious(): void;
  onSeek(positionMs: number): void;
  onTogglePlaying(): void;
  onVolumeChange(volume: number): void;
  positionMs: number;
  track: DesktopLyricTrack | null;
  volume: number;
}

export interface DesktopPlaybackWallpaperControlsProps {
  desktopIconVisibility: DesktopIconVisibilityState | null;
  isDesktopIconPending: boolean;
  isPending: boolean;
  model: DesktopPlaybackWallpaperModel | null;
  onConfigure(update: DesktopPlaybackWallpaperPreferencesUpdate): Promise<void>;
  onDesktopIconVisibilityChange(visible: boolean): Promise<void>;
  onRetry(): Promise<void>;
}
