import type { MusicProvider } from "@scopify/music-domain/identity";
import type { QueryClient } from "@tanstack/react-query";

import { queryPersister } from "@/lib/query/persister";
import { runtime } from "@/lib/runtime";
import { usePlayerStore } from "@/store/module/player";
import { useActiveProviderStore } from "@/store/module/provider";
import type { ProviderSwitchSteps } from "@/types/music/provider";

const PENDING_SWITCH_STORAGE_KEY = "scopify:pending-provider-switch";
export const PROVIDER_SWITCH_REQUESTED_EVENT = "scopify:provider-switch-requested";

/**
 * Switches the whole app to another platform. The order matters: playback stops and the queue
 * empties first so nothing of the old platform keeps playing, the caches go next so no page can
 * read the old platform's data, the app routes home, and only then does the platform change,
 * so no page of the old platform renders against the new one. Already on `target`, it only
 * routes home. Returns whether the platform changed.
 */
export async function switchProvider(
  target: MusicProvider,
  steps: ProviderSwitchSteps,
): Promise<boolean> {
  if (steps.getActiveProvider() === target) {
    steps.goHome();
    return false;
  }
  steps.stopPlayback();
  await steps.clearCaches();
  steps.goHome();
  steps.setActiveProvider(target);
  return true;
}

/** Stops playback and empties the queue through the player's public actions; keeps the volume. */
export function stopPlaybackForSwitch() {
  const player = usePlayerStore.getState();
  const { volume } = player;
  player.setIsPlaying(false);
  player.cleanCache();
  usePlayerStore.getState().setVolume(volume);
}

/** Drops every query, in memory and in the persisted (Desktop page cache) copy. */
export async function clearQueryCachesForSwitch(queryClient: QueryClient) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await queryPersister.removeClient();
}

/** The switch steps of the running app: its player, its query client and its router. */
export function createProviderSwitchSteps(
  queryClient: QueryClient,
  goHome: () => void,
): ProviderSwitchSteps {
  return {
    getActiveProvider: () => useActiveProviderStore.getState().activeProvider,
    stopPlayback: stopPlaybackForSwitch,
    clearCaches: () => clearQueryCachesForSwitch(queryClient),
    goHome,
    setActiveProvider: (provider) => useActiveProviderStore.getState().setActiveProvider(provider),
  };
}

function getStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function isMusicProvider(value: unknown): value is MusicProvider {
  return value === "netease" || value === "qq";
}

/**
 * Asks the app window to switch to the platform that was just logged into, unless it is already
 * active (a re-login keeps the queue and the page the login returns to). The request is
 * stored, because on Desktop the login runs in its own window and finishing it reloads the
 * main window, which takes the request once its query cache is restored; the login window
 * itself must not switch, or it would rewrite the main window's persisted queue. In the
 * browser the login page is part of the app, so the request is handled right away.
 */
export function requestProviderSwitch(provider: MusicProvider) {
  if (useActiveProviderStore.getState().activeProvider === provider) return;
  getStorage()?.setItem(PENDING_SWITCH_STORAGE_KEY, provider);
  if (typeof window !== "undefined" && !runtime.isDesktop) {
    window.dispatchEvent(new Event(PROVIDER_SWITCH_REQUESTED_EVENT));
  }
}

/** Takes the stored switch request, if any; a request is handled once. */
export function takePendingProviderSwitch(): MusicProvider | null {
  const storage = getStorage();
  const value = storage?.getItem(PENDING_SWITCH_STORAGE_KEY);
  if (value === null || value === undefined) return null;
  storage?.removeItem(PENDING_SWITCH_STORAGE_KEY);
  return isMusicProvider(value) ? value : null;
}
