import type {
  DesktopIconVisibilityState,
  DesktopPlaybackControllerLayout,
  DesktopPlaybackControllerOpenResult,
  DesktopPlaybackWallpaperAudioFrame,
  DesktopPlaybackWallpaperModel,
  DesktopPlaybackWallpaperPreferencesUpdate,
  DesktopHostConfig,
  PageCacheStats,
  RendererLogEvent,
} from "@scopify/desktop-contract";

import type {
  DesktopLyricCommand,
  DesktopLyricPreferences,
  DesktopLyricPreferencesUpdate,
  DesktopLyricSnapshot,
  DesktopLyricSnapshotInput,
} from "@/types/desktopLyric";
import type { AppUpdateState } from "@/types/updater";

export type RuntimeUnsubscribe = () => void;
export type RuntimeKind = "browser" | "desktop";
export type MediaControlCommand = "next" | "prev" | "toggle-play";
export type AppCloseAction = "exit" | "minimize";

export interface RuntimeAppLifecycle {
  exit(): void;
  onCloseRequested(callback: () => void): RuntimeUnsubscribe;
  relaunch(): void;
  submitCloseAction(action: AppCloseAction): void;
}

export interface RuntimeAuthentication {
  completeLogin(): boolean;
  openLoginWindow(): boolean;
  persistMusicCookie(cookie: string, backendOrigin: string): Promise<boolean>;
}

export interface RuntimeCache {
  clear(): Promise<PageCacheStats>;
  delete(key: string): Promise<void>;
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T, ttlMs: number): Promise<void>;
  stats(): Promise<PageCacheStats>;
}

export interface RuntimeConfiguration {
  loadHostConfig(): Promise<DesktopHostConfig | null>;
  saveHostConfig(config: DesktopHostConfig): Promise<DesktopHostConfig | null>;
}

export interface RuntimeDesktopLyrics {
  close(): Promise<boolean>;
  getPreferences(): Promise<DesktopLyricPreferences | null>;
  getSnapshot(): Promise<DesktopLyricSnapshot | null>;
  onCommand(callback: (command: DesktopLyricCommand) => void): RuntimeUnsubscribe;
  onSnapshot(callback: (snapshot: DesktopLyricSnapshot) => void): RuntimeUnsubscribe;
  publish(snapshot: DesktopLyricSnapshotInput): Promise<DesktopLyricSnapshot | null>;
  sendCommand(command: DesktopLyricCommand): void;
  updatePreferences(update: DesktopLyricPreferencesUpdate): Promise<DesktopLyricPreferences | null>;
}

export interface RuntimeDesktopIcons {
  getVisibility(): Promise<DesktopIconVisibilityState>;
  setVisibility(visible: boolean): Promise<DesktopIconVisibilityState>;
}

export interface RuntimeDesktopPlaybackWallpaper {
  closeController(): Promise<boolean>;
  configure(
    update: DesktopPlaybackWallpaperPreferencesUpdate,
  ): Promise<DesktopPlaybackWallpaperModel>;
  getModel(): Promise<DesktopPlaybackWallpaperModel>;
  getPresentation(): Promise<DesktopLyricSnapshot | null>;
  onAudioFrame(callback: (frame: DesktopPlaybackWallpaperAudioFrame) => void): RuntimeUnsubscribe;
  onModelChanged(callback: (model: DesktopPlaybackWallpaperModel) => void): RuntimeUnsubscribe;
  onPresentationChanged(callback: (presentation: DesktopLyricSnapshot) => void): RuntimeUnsubscribe;
  publishAudioFrame(frame: DesktopPlaybackWallpaperAudioFrame): void;
  publishPresentation(
    presentation: DesktopLyricSnapshotInput,
  ): Promise<DesktopLyricSnapshot | null>;
  retry(): Promise<DesktopPlaybackWallpaperModel>;
  setControllerLayout(layout: DesktopPlaybackControllerLayout): Promise<boolean>;
  showController(): Promise<DesktopPlaybackControllerOpenResult>;
}

export interface RuntimeLogging {
  write(event: RendererLogEvent): Promise<boolean>;
}

export interface RuntimeMediaControls {
  onCommand(callback: (command: MediaControlCommand) => void): RuntimeUnsubscribe;
  setPlaying(isPlaying: boolean): void;
}

export interface RuntimeNavigation {
  navigateMainWindow(path: string): boolean;
  onNavigate(callback: (path: string) => void): RuntimeUnsubscribe;
}

export interface RuntimeUpdates {
  check(): Promise<AppUpdateState>;
  download(): Promise<AppUpdateState>;
  getStatus(): Promise<AppUpdateState>;
  install(): void;
  onStatusChanged(callback: (status: AppUpdateState) => void): RuntimeUnsubscribe;
}

export interface RuntimeWindowControls {
  minimize(): void;
  onFullscreenChanged(callback: (isFullscreen: boolean) => void): RuntimeUnsubscribe;
  setFullscreen(fullscreen: boolean): Promise<void>;
}

/**
 * The sole seam between renderer behaviour and its Browser/Electron hosts.
 * Callers depend on these intent-level modules, never on the preload bridge.
 */
export interface WebRuntime {
  readonly app: RuntimeAppLifecycle;
  readonly auth: RuntimeAuthentication;
  readonly cache: RuntimeCache;
  readonly config: RuntimeConfiguration;
  readonly desktopIcons: RuntimeDesktopIcons;
  readonly desktopLyrics: RuntimeDesktopLyrics;
  readonly desktopPlaybackWallpaper: RuntimeDesktopPlaybackWallpaper;
  readonly isDesktop: boolean;
  readonly kind: RuntimeKind;
  readonly logging: RuntimeLogging;
  readonly media: RuntimeMediaControls;
  readonly navigation: RuntimeNavigation;
  readonly updates: RuntimeUpdates;
  readonly window: RuntimeWindowControls;
}
