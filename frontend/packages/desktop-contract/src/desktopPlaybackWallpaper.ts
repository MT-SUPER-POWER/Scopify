export type DesktopPlaybackControllerLayout = "compact" | "expanded";
export type DesktopPlaybackWallpaperFullscreenPolicy = "keep-running" | "pause" | "stop";

export interface DesktopPlaybackWallpaperLayers {
  background: boolean;
  lyrics: boolean;
}

export interface DesktopPlaybackWallpaperPreferences {
  enabled: boolean;
  fullscreenPolicy: DesktopPlaybackWallpaperFullscreenPolicy;
  layers: DesktopPlaybackWallpaperLayers;
  systemWallpaperFallback: boolean;
}

export type DesktopPlaybackWallpaperPreferencesUpdate = Partial<
  Omit<DesktopPlaybackWallpaperPreferences, "layers">
> & {
  layers?: Partial<DesktopPlaybackWallpaperLayers>;
};

export const DEFAULT_DESKTOP_PLAYBACK_WALLPAPER_PREFERENCES = {
  enabled: false,
  fullscreenPolicy: "pause",
  layers: {
    background: true,
    lyrics: true,
  },
  systemWallpaperFallback: false,
} as const satisfies DesktopPlaybackWallpaperPreferences;

export type DesktopPlaybackWallpaperPolicyReason =
  "display-off" | "fullscreen" | "lock-screen" | "suspend";

export type DesktopPlaybackWallpaperRecoveryReason =
  "explorer-restarted" | "host-lost" | "renderer-crashed";

export type DesktopPlaybackWallpaperStatus =
  | {
      reason: "disabled" | "no-visible-layer";
      state: "inactive";
    }
  | { state: "starting" }
  | { displayId: string; state: "running" }
  | {
      reason: DesktopPlaybackWallpaperPolicyReason;
      state: "policy-paused" | "policy-stopped";
    }
  | {
      attempt: number;
      reason: DesktopPlaybackWallpaperRecoveryReason;
      state: "recovering";
    }
  | { diagnostic: string; state: "unsupported" }
  | { diagnostic: string; retryable: boolean; state: "faulted" };

export interface DesktopPlaybackWallpaperModel {
  preferences: DesktopPlaybackWallpaperPreferences;
  status: DesktopPlaybackWallpaperStatus;
}

export interface DesktopPlaybackWallpaperAudioFrame {
  bass: number;
  lowMid: number;
  mid: number;
  power: number;
  sampledAt: number;
  spectrum: number[];
  treble: number;
  vocal: number;
}

export type DesktopPlaybackControllerOpenResult =
  | { opened: true }
  | {
      opened: false;
      reason: "failed" | "unavailable" | "unsupported";
    };
