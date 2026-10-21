export interface DesktopLyricInteractiveRect {
  height: number;
  width: number;
  x: number;
  y: number;
}

export type DesktopLyricCommand =
  | { rects: DesktopLyricInteractiveRect[]; type: "set-desktop-lyric-interactive-region" }
  | { height: number; type: "set-desktop-lyric-height" }
  | { type: "move-desktop-lyric-window"; x: number; y: number }
  | { type: "save-desktop-lyric-window" }
  | { enabled: boolean; type: "set-main-window-always-on-top" }
  | { enabled: boolean; type: "set-main-window-click-through" }
  | { enabled: boolean; type: "set-stage-transparent" }
  | { height: number; type: "resize-main-window"; width: number }
  | { type: "set-stage-border-visible"; visible: boolean }
  | { type: "set-stage-controls-visible"; visible: boolean };

export interface DesktopLyricPreferences {
  alwaysOnTop: boolean;
  enabled?: boolean;
  /** 锁定后窗口不可拖拽/缩放且鼠标穿透，仅保留解锁按钮可点。 */
  locked: boolean;
  preventSleepOnPlayback?: boolean;
  showSecondaryLyric?: boolean;
  skipTaskbar: boolean;
}

export type DesktopLyricPreferencesUpdate = Partial<DesktopLyricPreferences>;
