import type {
  DesktopIconVisibilityState,
  DesktopPlaybackWallpaperModel,
  DesktopPlaybackWallpaperPreferencesUpdate,
} from "@scopify/desktop-contract";

import type { SongDetail } from "@/types/api/music";

export interface DesktopPlaybackPlayerControlsProps {
  currentSong: SongDetail | null;
  isConnected: boolean;
  isPlaying: boolean;
  onNext(): void;
  onPrevious(): void;
  onTogglePlaying(): void;
  onVolumeChange(volume: number): void;
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
