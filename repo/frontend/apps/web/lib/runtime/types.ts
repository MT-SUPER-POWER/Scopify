import type {
  AudioFeatureFrameV1,
  AudioFeatureTransportRole,
  DesktopIconVisibilityState,
  DesktopPlaybackControllerLayout,
  DesktopPlaybackControllerOpenResult,
  DesktopPlaybackWallpaperModel,
  DesktopPlaybackWallpaperPreferencesUpdate,
  DesktopHostConfig,
  DiscordPresenceSnapshot,
  DiscordPresenceStatus,
  CacheCategory,
  CacheScope,
  ClearDesktopCacheRequest,
  DesktopCacheStats,
  PageCacheStats,
  PlaybackHostClientCommand,
  PlaybackHostHostMessage,
  PlaybackTransportPayload,
  PlaybackTransportRole,
  RendererLogEvent,
} from "@mt-super-power/desktop-contract";

import type {
  DesktopLyricCommand,
  DesktopLyricPreferences,
  DesktopLyricPreferencesUpdate,
} from "@/types/desktopLyric";
import type { AppUpdateState } from "@/types/updater";
import type { LyricData } from "@/types/lyrics";
import type { CachePreferences } from "@/types/cache";

export type RuntimeUnsubscribe = () => void;
export type RuntimeKind = "browser" | "desktop";
export type MediaControlCommand = "next" | "prev" | "toggle-play";
export type AppCloseAction = "exit" | "minimize" | "cancel";

export interface RuntimeAppLifecycle {
  exit(): void;
  relaunch(): void;
  submitCloseAction(action: AppCloseAction): void;
}

export interface RuntimeAuthentication {
  completeLogin(): boolean;
  openLoginWindow(): boolean;
  persistMusicCookie(cookie: string, backendOrigin: string): Promise<boolean>;
}

/** Bounded high-frequency audio feature transport; payload delivery is best-effort. */
export interface RuntimeAudioFeature {
  connect(
    role: AudioFeatureTransportRole,
    connectionId: string,
    onFrame: (frame: AudioFeatureFrameV1) => void,
    onClose: () => void,
  ): RuntimeUnsubscribe;
  publish(frame: AudioFeatureFrameV1): boolean;
}

export interface RuntimeCache {
  clear(): Promise<PageCacheStats>;
  clearSelected(request: ClearDesktopCacheRequest): Promise<DesktopCacheStats>;
  delete(key: string): Promise<void>;
  deleteScoped(scope: CacheScope, key: string): Promise<void>;
  get<T = unknown>(key: string): Promise<T | null>;
  getPreferences(): Promise<CachePreferences>;
  getScoped<T = unknown>(scope: CacheScope, key: string): Promise<T | null>;
  savePreferences(preferences: CachePreferences): Promise<CachePreferences>;
  set<T = unknown>(key: string, value: T, ttlMs: number): Promise<void>;
  setScoped<T = unknown>(
    scope: CacheScope,
    key: string,
    value: T,
    ttlMs: number,
    category?: CacheCategory,
  ): Promise<void>;
  stats(): Promise<PageCacheStats>;
  statsAll(): Promise<DesktopCacheStats>;
}

export interface RuntimeConfiguration {
  loadHostConfig(): Promise<DesktopHostConfig | null>;
  saveHostConfig(config: DesktopHostConfig): Promise<DesktopHostConfig | null>;
  selectDirectory(defaultPath?: string): Promise<string | null>;
}

export interface RuntimeDesktopLyrics {
  close(): Promise<boolean>;
  getPreferences(): Promise<DesktopLyricPreferences | null>;
  onCommand(callback: (command: DesktopLyricCommand) => void): RuntimeUnsubscribe;
  open(): Promise<boolean>;
  sendCommand(command: DesktopLyricCommand): void;
  toggle(): Promise<boolean>;
  updatePreferences(update: DesktopLyricPreferencesUpdate): Promise<DesktopLyricPreferences | null>;
}

export interface RuntimeDesktopIcons {
  getVisibility(): Promise<DesktopIconVisibilityState>;
  setVisibility(visible: boolean): Promise<DesktopIconVisibilityState>;
}

export interface RuntimeDiscordPresence {
  getStatus(): Promise<DiscordPresenceStatus | null>;
  onStatusChanged(callback: (status: DiscordPresenceStatus) => void): RuntimeUnsubscribe;
  publish(snapshot: DiscordPresenceSnapshot): Promise<DiscordPresenceStatus | null>;
  testConnection(): Promise<DiscordPresenceStatus | null>;
}

export interface RuntimeDesktopPlaybackWallpaper {
  closeController(): Promise<boolean>;
  configure(
    update: DesktopPlaybackWallpaperPreferencesUpdate,
  ): Promise<DesktopPlaybackWallpaperModel>;
  getModel(): Promise<DesktopPlaybackWallpaperModel>;
  onModelChanged(callback: (model: DesktopPlaybackWallpaperModel) => void): RuntimeUnsubscribe;
  retry(): Promise<DesktopPlaybackWallpaperModel>;
  setControllerLayout(layout: DesktopPlaybackControllerLayout): Promise<boolean>;
  showController(): Promise<DesktopPlaybackControllerOpenResult>;
}

export interface RuntimeLogging {
  getDirectory(): Promise<string | null>;
  write(event: RendererLogEvent): Promise<boolean>;
}

export interface RuntimeMediaControls {
  onCommand(callback: (command: MediaControlCommand) => void): RuntimeUnsubscribe;
  setPlaying(isPlaying: boolean): void;
}

export interface RuntimePlaybackTransport<TLyrics = LyricData> {
  connect(
    role: PlaybackTransportRole,
    connectionId: string,
    onPayload: (payload: PlaybackTransportPayload<TLyrics>) => void,
    onClose: () => void,
  ): RuntimeUnsubscribe;
  send(payload: PlaybackTransportPayload<TLyrics>): boolean;
}

/** Payloads received by the visible client are Host receipts and snapshots. */
export type RuntimePlaybackHostControlClientPayload = PlaybackHostHostMessage;

/** Every queue or session command the visible client may send to the Host. */
export type RuntimePlaybackHostControlHostPayload = PlaybackHostClientCommand;

/** A lifecycle-bound view of one preload-owned, role-specific control port. */
export interface RuntimePlaybackHostControlConnection<TPayload> {
  close(): void;
  send(payload: TPayload): boolean;
}

/**
 * Low-frequency session control is directionally constrained:
 * the visible renderer is the client and the hidden renderer is the Host.
 * Neither adapter exposes the other side of its preload bridge.
 */
export interface RuntimePlaybackHostControl {
  connectClient(
    connectionId: string,
    onPayload: (payload: RuntimePlaybackHostControlClientPayload) => void,
    onClose: () => void,
  ): RuntimePlaybackHostControlConnection<RuntimePlaybackHostControlHostPayload>;
  connectHost(
    connectionId: string,
    onPayload: (payload: RuntimePlaybackHostControlHostPayload) => void,
    onClose: () => void,
  ): RuntimePlaybackHostControlConnection<RuntimePlaybackHostControlClientPayload>;
}

/**
 * The narrow lifecycle proof available only to the hidden Playback Host.
 * Other renderer kinds deliberately expose a safe inert implementation.
 */
export interface RuntimePlaybackHost {
  getNonce(): string | null;
  reportReady(nonce: string): boolean;
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
  readonly audioFeature: RuntimeAudioFeature;
  readonly auth: RuntimeAuthentication;
  readonly cache: RuntimeCache;
  readonly config: RuntimeConfiguration;
  readonly desktopIcons: RuntimeDesktopIcons;
  readonly discord: RuntimeDiscordPresence;
  readonly desktopLyrics: RuntimeDesktopLyrics;
  readonly desktopPlaybackWallpaper: RuntimeDesktopPlaybackWallpaper;
  readonly isDesktop: boolean;
  readonly kind: RuntimeKind;
  readonly logging: RuntimeLogging;
  readonly media: RuntimeMediaControls;
  readonly navigation: RuntimeNavigation;
  readonly playback: RuntimePlaybackTransport;
  readonly playbackHost: RuntimePlaybackHost;
  readonly playbackHostControl: RuntimePlaybackHostControl;
  readonly updates: RuntimeUpdates;
  readonly window: RuntimeWindowControls;
}
