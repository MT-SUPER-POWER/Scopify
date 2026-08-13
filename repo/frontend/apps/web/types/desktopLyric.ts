export type DesktopLyricCommand =
  | { enabled: boolean; type: "set-main-window-always-on-top" }
  | { enabled: boolean; type: "set-main-window-click-through" }
  | { enabled: boolean; type: "set-stage-transparent" }
  | { height: number; type: "resize-main-window"; width: number }
  | { type: "set-stage-border-visible"; visible: boolean }
  | { type: "set-stage-controls-visible"; visible: boolean };

export interface DesktopLyricPreferences {
  alwaysOnTop: boolean;
  clickThrough: boolean;
  skipTaskbar: boolean;
}

export type DesktopLyricPreferencesUpdate = Partial<DesktopLyricPreferences>;
