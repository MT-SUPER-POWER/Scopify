import type { IpcMainEvent } from "electron";

import {
  parsePlaybackHostRendererReadyRequest,
  PLAYBACK_HOST_RENDERER_READY_CHANNEL,
} from "@mt-super-power/desktop-contract/playbackHost";

import type { PlaybackHostManager } from "./index.js";

type PlaybackHostReadyListener = (event: IpcMainEvent, input: unknown) => void;

/** Minimal IPC surface so the authorization boundary remains unit-testable. */
export interface PlaybackHostIpcMain {
  on(channel: string, listener: PlaybackHostReadyListener): unknown;
  removeListener(channel: string, listener: PlaybackHostReadyListener): unknown;
}

export interface PlaybackHostIpcOptions {
  /** The manager is the sole authority that validates active host sender + nonce. */
  manager: Pick<PlaybackHostManager, "reportRendererReady">;
  /** Composition root supplies Electron's ipcMain; this module has no raw Electron capability. */
  ipc: PlaybackHostIpcMain;
  onRejected?(message: string): void;
}

export interface PlaybackHostIpcHost {
  dispose(): void;
}

/**
 * Registers the one-way renderer-ready handshake for the hidden PlaybackHost.
 *
 * A renderer gets no status or authority capability in return. The manager owns
 * the active BrowserWindow and per-load nonce, so the IPC layer deliberately
 * delegates both sender and nonce authorization to it.
 */
export function initializePlaybackHostIpc(options: PlaybackHostIpcOptions): PlaybackHostIpcHost {
  const ipc = options.ipc;
  let disposed = false;

  const onRendererReady: PlaybackHostReadyListener = (event, input) => {
    const request = parsePlaybackHostRendererReadyRequest(input);
    if (!request) {
      options.onRejected?.("Rejected malformed playback host renderer-ready handshake.");
      return;
    }

    if (!options.manager.reportRendererReady(event.sender.id, request.nonce)) {
      options.onRejected?.("Rejected unauthorized playback host renderer-ready handshake.");
    }
  };

  ipc.on(PLAYBACK_HOST_RENDERER_READY_CHANNEL, onRendererReady);

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      ipc.removeListener(PLAYBACK_HOST_RENDERER_READY_CHANNEL, onRendererReady);
    },
  };
}
