export type DesktopLyricCommand =
  | { enabled: boolean; type: "set-main-window-always-on-top" }
  | { enabled: boolean; type: "set-main-window-click-through" }
  | { enabled: boolean; type: "set-stage-transparent" }
  | { height: number; type: "resize-main-window"; width: number }
  | { positionMs: number; type: "seek" }
  | { type: "next" }
  | { type: "previous" }
  | { type: "set-stage-border-visible"; visible: boolean }
  | { type: "set-stage-controls-visible"; visible: boolean }
  | { type: "toggle-like" }
  | { type: "toggle-play" };

export interface DesktopLyricPreferences {
  alwaysOnTop: boolean;
  clickThrough: boolean;
  skipTaskbar: boolean;
}

export type DesktopLyricPreferencesUpdate = Partial<DesktopLyricPreferences>;

export interface DesktopLyricSnapshot<
  TLyrics = unknown,
> extends DesktopLyricSnapshotInput<TLyrics> {
  updatedAt: number;
}

export interface DesktopLyricSnapshotInput<TLyrics = unknown> {
  isLiked: boolean;
  isPlaying: boolean;
  lyrics: TLyrics | null;
  positionMs: number;
  track: DesktopLyricTrack | null;
}

export interface DesktopLyricSnapshotUpdate<TLyrics = unknown> {
  isLiked?: boolean;
  isPlaying?: boolean;
  lyrics?: TLyrics | null;
  positionMs?: number;
  track?: DesktopLyricTrack | null;
}

export interface DesktopLyricTrack {
  albumTitle?: string;
  artistNames: string[];
  artworkUrl?: string;
  durationMs: number;
  id: number | string;
  title: string;
}
