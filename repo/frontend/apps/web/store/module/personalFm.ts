import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  DEFAULT_PERSONAL_FM_SELECTION,
  isPersonalFmPlaybackSource,
  normalizePersonalFmSelection,
  PERSONAL_FM_PLAYBACK_SOURCE_ID,
  PERSONAL_FM_REFILL_THRESHOLD,
} from "@/constants/personalFm";
import { getPersonalFm, getPersonalFmByMode } from "@/lib/api/personalFm";
import { translate } from "@/lib/i18n";
import { getPersonalFmRemainingCount, selectNewPersonalFmQueueItems } from "@/lib/personalFm/queue";
import { useI18nStore } from "@/store/module/i18n";
import { usePlayerStore } from "@/store/module/player";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import type { PersonalFmSelection, PersonalFmStore } from "@/types/personalFm";

const PERSONAL_FM_STORAGE_KEY = "scopify-personal-fm";
let refillPromise: Promise<boolean> | null = null;

function selectionsMatch(left: PersonalFmSelection, right: PersonalFmSelection) {
  return left.mode === right.mode && left.scene === right.scene;
}

async function fetchPersonalFmSongs(selection: PersonalFmSelection): Promise<SongDetail[]> {
  const fetchDefault = async () => (await getPersonalFm()).data;
  let response;

  if (selection.mode === "DEFAULT") {
    response = await fetchDefault();
  } else {
    try {
      const modeResponse = await getPersonalFmByMode({
        mode: selection.mode,
        ...(selection.mode === "SCENE_RCMD" && selection.scene ? { submode: selection.scene } : {}),
      });
      response = modeResponse.data;
      if (!Array.isArray(response.data) || response.data.length === 0) {
        response = await fetchDefault();
      }
    } catch (error) {
      console.warn("[personal-fm] mode endpoint unavailable, using default FM", error);
      response = await fetchDefault();
    }
  }

  return Array.isArray(response.data) ? response.data.map(pruneSongDetail) : [];
}

async function refillPersonalFmQueue(): Promise<boolean> {
  if (refillPromise) return refillPromise;

  const player = usePlayerStore.getState();
  if (!isPersonalFmPlaybackSource(player.playlistId)) return false;
  const requestedSelection = usePersonalFmStore.getState().selection;

  refillPromise = (async () => {
    try {
      const songs = await fetchPersonalFmSongs(requestedSelection);
      const currentPlayer = usePlayerStore.getState();
      const currentSelection = usePersonalFmStore.getState().selection;
      if (
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
    } finally {
      refillPromise = null;
    }
  })();

  return refillPromise;
}

async function replacePersonalFmStream(selection: PersonalFmSelection): Promise<boolean> {
  usePersonalFmStore.setState({ error: null, status: "loading" });
  try {
    const songs = await fetchPersonalFmSongs(selection);
    if (songs.length === 0) {
      throw new Error(translate(useI18nStore.getState().locale, "personalFm.error.empty"));
    }

    const player = usePlayerStore.getState();
    player.setShuffle(false);
    player.setRepeatMode("off");
    await player.playFromSong(songs[0], songs, PERSONAL_FM_PLAYBACK_SOURCE_ID);
    usePersonalFmStore.setState({ error: null, status: "active" });
    return true;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : translate(useI18nStore.getState().locale, "personalFm.error.loadFailed");
    usePersonalFmStore.setState({ error: message, status: "error" });
    return false;
  }
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

        const remaining = getPersonalFmRemainingCount(player.queue.length, player.queueIndex);
        if (remaining <= 0) {
          await refillPersonalFmQueue();
        } else if (remaining <= PERSONAL_FM_REFILL_THRESHOLD) {
          void refillPersonalFmQueue();
        }
        await usePlayerStore.getState().playNext(source);
      },
      error: null,
      selection: DEFAULT_PERSONAL_FM_SELECTION,
      setSelection: async (selection) => {
        const normalized = normalizePersonalFmSelection(selection);
        if (selectionsMatch(get().selection, normalized)) return true;
        set({ selection: normalized });
        return isPersonalFmPlaybackSource(usePlayerStore.getState().playlistId)
          ? replacePersonalFmStream(normalized)
          : true;
      },
      start: async () => {
        const player = usePlayerStore.getState();
        if (isPersonalFmPlaybackSource(player.playlistId) && player.currentSongDetail) {
          set({ error: null, status: "active" });
          return true;
        }
        return replacePersonalFmStream(get().selection);
      },
      status: "idle",
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
