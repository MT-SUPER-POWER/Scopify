export interface DesktopLyricInteractiveRect {
  height: number;
  width: number;
  x: number;
  y: number;
}

export type DesktopLyricCommand =
  | { rects: DesktopLyricInteractiveRect[]; type: "set-desktop-lyric-interactive-region" }
  | { type: "resize-desktop-lyric-window"; width: number; height: number }
  | { enabled: boolean; type: "set-main-window-always-on-top" }
  | { enabled: boolean; type: "set-main-window-click-through" }
  | { enabled: boolean; type: "set-stage-transparent" }
  | { height: number; type: "resize-main-window"; width: number }
  | { type: "set-stage-border-visible"; visible: boolean }
  | { type: "set-stage-controls-visible"; visible: boolean };

export interface DesktopLyricPreferences {
  alwaysOnTop: boolean;
  clickThrough: boolean;
  enabled?: boolean;
  preventSleepOnPlayback?: boolean;
  showSecondaryLyric?: boolean;
  skipTaskbar: boolean;
}

export type DesktopLyricPreferencesUpdate = Partial<DesktopLyricPreferences>;
