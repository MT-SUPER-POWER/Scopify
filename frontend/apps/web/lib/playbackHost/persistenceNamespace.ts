/**
 * The playback authority lives in a separate renderer. Its persisted Zustand
 * state must never share a namespace with the visible window: either renderer
 * can otherwise revive the other one's queue, playback position, or settings
 * before the control broker has established authority.
 */
export const PLAYER_PERSISTENCE_STORAGE_KEY = "player-storage";
export const TIME_PERSISTENCE_STORAGE_KEY = "player-time-storage";

export const PLAYBACK_HOST_PLAYER_PERSISTENCE_STORAGE_KEY = "playback-host-player-storage";
export const PLAYBACK_HOST_TIME_PERSISTENCE_STORAGE_KEY = "playback-host-player-time-storage";

export interface PlaybackHostWindowLike {
  playbackHostAPI?: unknown;
}

function getRendererWindow(): PlaybackHostWindowLike | undefined {
  if (typeof window === "undefined") return undefined;
  return window;
}

/**
 * Deliberately checks the host-only preload surface rather than Electron in
 * general: the regular desktop renderer must retain the browser namespace.
 */
export function isPlaybackHostRenderer(
  rendererWindow: PlaybackHostWindowLike | null | undefined = getRendererWindow(),
): boolean {
  return rendererWindow?.playbackHostAPI !== undefined;
}

export function getPlayerPersistenceStorageKey(
  rendererWindow?: PlaybackHostWindowLike | null,
): string {
  return isPlaybackHostRenderer(rendererWindow)
    ? PLAYBACK_HOST_PLAYER_PERSISTENCE_STORAGE_KEY
    : PLAYER_PERSISTENCE_STORAGE_KEY;
}

export function getTimePersistenceStorageKey(
  rendererWindow?: PlaybackHostWindowLike | null,
): string {
  return isPlaybackHostRenderer(rendererWindow)
    ? PLAYBACK_HOST_TIME_PERSISTENCE_STORAGE_KEY
    : TIME_PERSISTENCE_STORAGE_KEY;
}
