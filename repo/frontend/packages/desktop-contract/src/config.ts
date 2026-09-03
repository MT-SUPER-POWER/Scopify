export type DesktopCloseAction = 0 | 1 | 2;
export type DesktopLogLevel = "debug" | "error" | "info" | "warn";
export type DesktopProxyMode = "custom" | "direct" | "system";

/**
 * Desktop-owned settings exposed to the Renderer settings UI.
 * Web request, locale and backend settings deliberately do not cross this boundary.
 */
export interface DesktopHostConfig {
  app: {
    closeAction: DesktopCloseAction;
    devTools: boolean;
    gpuAcceleration: boolean;
  };
  backend: {
    autoStart: boolean;
    port: number;
  };
  cache: {
    dir: string;
    page: {
      enabled: boolean;
      maxSizeMB: number;
      searchTtlMinutes: number;
      ttlMinutes: number;
    };
    playback: {
      enabled: boolean;
      lyricTtlMinutes: number;
      maxEntries: number;
      maxSizeMB: number;
      urlTtlMinutes: number;
    };
  };
  discord: {
    applicationId: string;
    enabled: boolean;
  };
  frontend: {
    devPort: number;
    host: string;
  };
  logging: {
    dir: string;
    format: string;
    keepDays: number;
    level: DesktopLogLevel;
    maxSizeMB: number;
  };
  network: {
    proxyMode: DesktopProxyMode;
    proxyUrl: string;
  };
  updater: {
    autoDownload: boolean;
    checkOnStartup: boolean;
  };
}
