import type { BrowserWindow } from "electron";
import type {
  DesktopPlaybackControllerLayout,
  DesktopPlaybackControllerOpenResult,
} from "@scopify/desktop-contract";
export interface DesktopPlaybackControllerWindowOptions {
  rendererBaseUrl: string;
}

export interface DesktopPlaybackControllerWindow {
  close(): boolean;
  dispose(): void;
  getWindow(): BrowserWindow | null;
  setLayout(layout: DesktopPlaybackControllerLayout): boolean;
  show(): Promise<DesktopPlaybackControllerOpenResult>;
}
