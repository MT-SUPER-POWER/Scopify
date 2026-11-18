import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  DEFAULT_PERSONAL_FM_SELECTION,
  isPersonalFmPlaybackSource,
  normalizePersonalFmSelection,
  PERSONAL_FM_PLAYBACK_SOURCE_ID,
  PERSONAL_FM_REFILL_THRESHOLD,
} from "@/constants/personalFm";
import { translate } from "@/lib/i18n";
import { getPersonalFmRemainingCount, selectNewPersonalFmQueueItems } from "@/lib/personalFm/queue";
import { getMusicProvider } from "@/lib/providers";
import { useActiveProviderStore } from "@/store/module/provider";
import { useI18nStore } from "@/store/module/i18n";
import { usePlayerStore } from "@/store/module/player";
import type { PersonalFmSelection, PersonalFmStore } from "@/types/personalFm/model";
import type { PlayerTrack } from "@/types/player/model";

const PERSONAL_FM_STORAGE_KEY = "scopify-personal-fm";
let refillPromise: Promise<boolean> | null = null;
let streamPromise: Promise<boolean> | null = null;
let streamRevision = 0;

function selectionsMatch(left: PersonalFmSelection, right: PersonalFmSelection) {
  return left.mode === right.mode && left.scene === right.scene;
}

/** The next batch from the active platform's personal FM. */
async function fetchPersonalFmSongs(selection: PersonalFmSelection): Promise<PlayerTrack[]> {
  const provider = getMusicProvider(useActiveProviderStore.getState().activeProvider);
  if (!provider.getPersonalFmTracks) throw new Error("Personal FM is unsupported.");
  return provider.getPersonalFmTracks({
    mode: selection.mode,
    ...(selection.scene ? { scene: selection.scene } : {}),
  });
}

async function refillPersonalFmQueue(): Promise<boolean> {
  if (refillPromise) return refillPromise;

  const player = usePlayerStore.getState();
  if (!isPersonalFmPlaybackSource(player.playlistId)) return false;
  const requestedSelection = usePersonalFmStore.getState().selection;
  const requestedRevision = streamRevision;

  const request = (async () => {
    try {
      const songs = await fetchPersonalFmSongs(requestedSelection);
      const currentPlayer = usePlayerStore.getState();
      const currentSelection = usePersonalFmStore.getState().selection;
      if (
        requestedRevision !== streamRevision ||
        !isPersonalFmPlaybackSource(currentPlayer.playlistId) ||
        !selectionsMatch(currentSelection, requestedSelection)
      ) {
        return false;
      }

      const nextSongs = selectNewPersonalFmQueueItems(currentPlayer.queue, songs);
      if (nextSongs.length === 0) return false;
      currentPlayer.appendQueueItems(nextSongs);
      return true;
    } catch (error) {
      console.error("[personal-fm] failed to refill queue", error);
      return false;
    }
  })();
  refillPromise = request;
  void request.finally(() => {
    if (refillPromise === request) refillPromise = null;
  });
  return request;
}

function replacePersonalFmStream(selection: PersonalFmSelection): Promise<boolean> {
  const requestedRevision = ++streamRevision;
  const playbackRevision = usePlayerStore.getState().playbackSessionRevision;
  refillPromise = null;
  usePersonalFmStore.setState({ error: null, status: "loading" });
  const request = (async () => {
    try {
      const songs = await fetchPersonalFmSongs(selection);
      if (requestedRevision !== streamRevision) return true;
      const player = usePlayerStore.getState();
      // A different playback action during the request takes precedence over this response.
      if (player.playbackSessionRevision !== playbackRevision) {
        usePersonalFmStore.setState({ status: "idle" });
        return true;
      }
      if (songs.length === 0) {
        throw new Error(translate(useI18nStore.getState().locale, "personalFm.error.empty"));
      }

      player.setShuffle(false);
      player.setRepeatMode("off");
      await player.playFromSong(songs[0], songs, PERSONAL_FM_PLAYBACK_SOURCE_ID);
      if (requestedRevision === streamRevision) {
        usePersonalFmStore.setState({
          error: null,
          status: isPersonalFmPlaybackSource(usePlayerStore.getState().playlistId)
            ? "active"
            : "idle",
        });
      }
      return true;
    } catch (error) {
      if (requestedRevision !== streamRevision) return true;
      const message =
        error instanceof Error
          ? error.message
          : translate(useI18nStore.getState().locale, "personalFm.error.loadFailed");
      usePersonalFmStore.setState({ error: message, status: "error" });
      return false;
    }
  })();
  streamPromise = request;
  void request.finally(() => {
    if (streamPromise === request) streamPromise = null;
  });
  return request;
}

export const usePersonalFmStore = create<PersonalFmStore>()(
  persist(
    (set, get) => ({
      advance: async (source = "manual") => {
        const player = usePlayerStore.getState();
        if (!isPersonalFmPlaybackSource(player.playlistId)) {
          await player.playNext(source);
          return;
        }

        if (get().status === "loading") return;
        const requestedRevision = streamRevision;
        const playbackRevision = player.playbackSessionRevision;
        const hasForwardHistory = player.historyIndex < player.historyStack.length - 1;
        const remaining = getPersonalFmRemainingCount(player.queue.length, player.queueIndex);
        if (!hasForwardHistory && remaining <= 0) {
          const refilled = await refillPersonalFmQueue();
          const currentPlayer = usePlayerStore.getState();
          if (
            requestedRevision !== streamRevision ||
            currentPlayer.playbackSessionRevision !== playbackRevision ||
            !isPersonalFmPlaybackSource(currentPlayer.playlistId)
          )
            return;
          if (!refilled) {
            if (source === "ended") currentPlayer.setIsPlaying(false);
            set({
              error: translate(useI18nStore.getState().locale, "personalFm.error.loadFailed"),
              status: "error",
            });
            return;
          }
        } else if (!hasForwardHistory && remaining <= PERSONAL_FM_REFILL_THRESHOLD) {
          void refillPersonalFmQueue();
        }
        await usePlayerStore.getState().playNext(source);
      },
      removeDislikedTrack: async (track) => {
        const findIndex = (queue: readonly PlayerTrack[]) => {
          const exact = queue.indexOf(track);
          if (exact >= 0) return exact;
          // Metadata updates can replace queue objects while feedback is pending.
          const matches = (item: PlayerTrack) =>
            item.ref.provider === track.ref.provider && item.ref.id === track.ref.id;
          const index = queue.findIndex(matches);
          return index < 0 || queue.slice(index + 1).some(matches) ? -1 : index;
        };
        const player = usePlayerStore.getState();
        if (
          isPersonalFmPlaybackSource(player.playlistId) &&
          player.queueIndex >= 0 &&
          player.queueIndex === player.queue.length - 1 &&
          findIndex(player.queue) === player.queueIndex
        ) {
          await refillPersonalFmQueue();
        }

        // Recheck after refilling: playback can move or switch sources during the request.
        const currentPlayer = usePlayerStore.getState();
        if (isPersonalFmPlaybackSource(currentPlayer.playlistId)) {
          const index = findIndex(currentPlayer.queue);
          if (index >= 0) currentPlayer.removeQueueItem(index, true);
        } else {
          const { tracks } = get();
          const index = findIndex(tracks);
          if (index >= 0) set({ tracks: tracks.filter((_, i) => i !== index) });
        }
      },
      error: null,
      ensureReady: async () => {
        const player = usePlayerStore.getState();
        if (isPersonalFmPlaybackSource(player.playlistId) && player.queue.length > 0) {
          const tracks = player.queue;
          if (get().tracks !== tracks) set({ tracks });
          return true;
        }
        if (get().tracks.length > 0) return true;
        const started = await (streamPromise ?? replacePersonalFmStream(get().selection));
        return started && get().tracks.length > 0;
      },
      selection: DEFAULT_PERSONAL_FM_SELECTION,
      setSelection: async (selection) => {
        const normalized = normalizePersonalFmSelection(selection);
        if (selectionsMatch(get().selection, normalized)) return true;
        set({ selection: normalized });
        return get().status === "loading" ||
          isPersonalFmPlaybackSource(usePlayerStore.getState().playlistId)
          ? replacePersonalFmStream(normalized)
          : true;
      },
      start: () => streamPromise ?? replacePersonalFmStream(get().selection),
      status: "idle",
      tracks: [],
    }),
    {
      name: PERSONAL_FM_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selection: state.selection }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        selection: normalizePersonalFmSelection(
          (persistedState as Partial<PersonalFmStore> | undefined)?.selection,
        ),
      }),
    },
  ),
);

// Remember the FM playlist independently of the current playback source. Navigating or
// starting a different playlist must not discard the songs the user was browsing.
usePlayerStore.subscribe((player, previous) => {
  const queue = isPersonalFmPlaybackSource(player.playlistId)
    ? player.queue
    : isPersonalFmPlaybackSource(previous.playlistId)
      ? previous.queue
      : null;
  if (queue && usePersonalFmStore.getState().tracks !== queue) {
    usePersonalFmStore.setState({ tracks: queue as PlayerTrack[] });
  }
});
