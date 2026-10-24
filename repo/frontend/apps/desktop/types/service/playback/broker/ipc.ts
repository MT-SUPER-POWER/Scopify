import type { BrowserWindow } from "electron";
import type { PlaybackBrokerDiagnostics } from "@/types/service/playback/broker";
export interface PlaybackBrokerIpcOptions {
  getAuthorityWindow(): BrowserWindow | null;
  getReplicaWindows(): Array<BrowserWindow | null>;
  /** Called once for each authorized authority transport that registers successfully. */
  onAuthorityConnected?(senderId: number): void;
  onRejected?(message: string): void;
}

/**
 * Electron adapter for an already-created PlaybackBroker.
 *
 * The adapter only owns its `ipcMain` listener. The composition root owns the
 * Broker and can attach other trusted transports (such as the Main gateway)
 * without coupling them to Electron IPC.
 */
export interface PlaybackBrokerIpcBinding {
  dispose(): void;
}

/** @deprecated Prefer `PlaybackBrokerIpcBinding` plus a separately owned Broker. */
export interface PlaybackBrokerIpcHost extends PlaybackBrokerIpcBinding {
  getDiagnostics(): PlaybackBrokerDiagnostics;
}
