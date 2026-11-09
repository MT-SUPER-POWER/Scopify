import type { DesktopMcpConfig } from "./mcp";

export type DesktopCloseAction = 0 | 1 | 2;
export type DesktopLogLevel = "debug" | "error" | "info" | "warn";
export type DesktopProxyMode = "custom" | "direct" | "system";

export interface DesktopBackendConfig {
  autoStart: boolean;
  port: number;
}

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
  /** Local music APIs hosted by Desktop, one entry per platform. */
  backend: {
    netease: DesktopBackendConfig;
    /** Runs in its own utility process because the API listens as an import side effect. */
    qq: DesktopBackendConfig;
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
  /**
   * Public MCP listener policy. Credentials are deliberately excluded: the
   * Electron Main process owns them through secure storage.
   */
  mcp: DesktopMcpConfig;
  network: {
    proxyMode: DesktopProxyMode;
    proxyUrl: string;
  };
  updater: {
    allowPrerelease: boolean;
    autoDownload: boolean;
    checkOnStartup: boolean;
  };
}
