import type { BrowserWindow, IpcMainEvent } from "electron";

import {
  PLAYBACK_HOST_MEDIA_PLAYING_CHANNEL,
  parsePlaybackHostMediaPlayingRequest,
} from "@scopify/desktop-contract/playbackHost";

export type PlaybackHostMediaPlayingListener = (event: IpcMainEvent, input: unknown) => void;

export interface PlaybackHostMediaPlayingIpcMain {
  on(channel: string, listener: PlaybackHostMediaPlayingListener): unknown;
  removeListener(channel: string, listener: PlaybackHostMediaPlayingListener): unknown;
}

export interface PlaybackHostMediaPlayingIpcOptions {
  /** Main owns lookup so a recovered host window is checked at receipt time. */
  getPlaybackHostWindow(): BrowserWindow | null;
  /** Applies the authorized source of truth to native player affordances. */
  setMediaPlaying(isPlaying: boolean): void;
  /** Composition root supplies Electron's ipcMain; this module has no global Electron state. */
  ipc: PlaybackHostMediaPlayingIpcMain;
  onRejected?(message: string): void;
}

export interface PlaybackHostMediaPlayingIpcHost {
  dispose(): void;
}

/**
 * Accepts native playing-state updates only from the active hidden Playback Host.
 *
 * The visible renderer's legacy `player-state-changed` route is intentionally
 * separate: it remains available for browser/compatibility mode, but cannot
 * impersonate the desktop media authority on this channel.
 */
export function initializePlaybackHostMediaPlayingIpc(
  options: PlaybackHostMediaPlayingIpcOptions,
): PlaybackHostMediaPlayingIpcHost {
  let disposed = false;

  const onMediaPlaying: PlaybackHostMediaPlayingListener = (event, input) => {
    const request = parsePlaybackHostMediaPlayingRequest(input);
    if (!request) {
      options.onRejected?.("Rejected malformed playback host media-playing update.");
      return;
    }

    const hostWindow = options.getPlaybackHostWindow();
    if (
      !hostWindow ||
      hostWindow.isDestroyed() ||
      hostWindow.webContents.isDestroyed() ||
      event.sender.id !== hostWindow.webContents.id
    ) {
      options.onRejected?.("Rejected unauthorized playback host media-playing update.");
      return;
    }

    options.setMediaPlaying(request.isPlaying);
  };

  options.ipc.on(PLAYBACK_HOST_MEDIA_PLAYING_CHANNEL, onMediaPlaying);

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      options.ipc.removeListener(PLAYBACK_HOST_MEDIA_PLAYING_CHANNEL, onMediaPlaying);
    },
  };
}
