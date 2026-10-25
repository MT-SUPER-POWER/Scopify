import type { BrowserWindow } from "electron";

import type { RendererArtifactVerification } from "../lib/rendererArtifact";

export interface DesktopRendererHost {
  readonly baseUrl: string;
  load(window: BrowserWindow): Promise<void>;
  verify(): RendererArtifactVerification | null;
}

export interface MainWindowRenderingTarget {
  setBackgroundThrottling(allowed: boolean): void;
}

export interface MainWindowRenderingPolicy {
  hidden(): void;
  setKeepAlive(keepAlive: boolean): void;
  shown(): void;
}

export interface MainWindowOptions {
  isQuitting(): boolean;
  onBeforeLoad(window: BrowserWindow): void;
  onClosed(): void;
  onRendererReady(window: BrowserWindow): Promise<void> | void;
  renderer: DesktopRendererHost;
}
