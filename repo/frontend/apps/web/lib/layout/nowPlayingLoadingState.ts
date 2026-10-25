import { NOW_PLAYING_PANEL_MEDIA_QUERY } from "@/constants/layout";
import { PLAYER_PERSISTENCE_STORAGE_KEY } from "@/constants/playbackPersistence";
import type { NowPlayingLoadingState } from "@/types/ui";

const UI_STORAGE_KEY = "ui-storage";

function readPersistedState<T>(key: string) {
  const raw = window.localStorage.getItem(key);
  return raw ? ((JSON.parse(raw) as { state?: T }).state ?? null) : null;
}

/**
 * Predicts how the Now Playing panel will render once the stores hydrate, so loading
 * placeholders reserve the same space: full panel, collapsed rail, or nothing.
 */
export function readNowPlayingLoadingState(): NowPlayingLoadingState {
  try {
    if (!window.matchMedia(NOW_PLAYING_PANEL_MEDIA_QUERY).matches) return null;
    const player = readPersistedState<{ currentSongDetail?: unknown }>(
      PLAYER_PERSISTENCE_STORAGE_KEY,
    );
    if (!player?.currentSongDetail) return null;
    const ui = readPersistedState<{ isNowPlayingPanelOpen?: boolean }>(UI_STORAGE_KEY);
    return (ui?.isNowPlayingPanelOpen ?? true) ? "panel" : "rail";
  } catch {
    return null;
  }
}
