import type {
  DesktopPlaybackControllerOpenResult,
  DesktopPlaybackWallpaperModel,
  DesktopPlaybackWallpaperPreferences,
  DesktopPlaybackWallpaperPreferencesUpdate,
} from "@scopify/desktop-contract";
import type { DesktopPlaybackWallpaperPreferencesRepository } from "@/types/service/desktop/wallpaper/preferences";
import type { DesktopPlaybackWallpaperSettledStatus } from "@/types/service/desktop/wallpaper/stateMachine";
export type DesktopPlaybackWallpaperReconcileReason = "configure" | "initialize" | "retry";

export interface DesktopPlaybackWallpaperDriver {
  dispose?(): Promise<void> | void;
  reconcile(
    preferences: DesktopPlaybackWallpaperPreferences,
    context: {
      reason: DesktopPlaybackWallpaperReconcileReason;
      signal: AbortSignal;
    },
  ): Promise<DesktopPlaybackWallpaperSettledStatus | null>;
}

export interface DesktopPlaybackControllerLauncher {
  show(): Promise<DesktopPlaybackControllerOpenResult>;
}

export interface DesktopPlaybackWallpaperService {
  configure(
    update: DesktopPlaybackWallpaperPreferencesUpdate,
  ): Promise<DesktopPlaybackWallpaperModel>;
  dispose(): Promise<void>;
  getModel(): DesktopPlaybackWallpaperModel;
  initialize(): Promise<DesktopPlaybackWallpaperModel>;
  retry(): Promise<DesktopPlaybackWallpaperModel>;
  showController(): Promise<DesktopPlaybackControllerOpenResult>;
  subscribe(listener: (model: DesktopPlaybackWallpaperModel) => void): () => void;
}

export interface DesktopPlaybackWallpaperServiceOptions {
  controller?: DesktopPlaybackControllerLauncher;
  driver: DesktopPlaybackWallpaperDriver;
  onError?: (message: string, error: unknown) => void;
  preferences: DesktopPlaybackWallpaperPreferencesRepository;
}
