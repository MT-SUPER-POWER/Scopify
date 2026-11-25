import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { NOW_PLAYING_PANEL_MEDIA_QUERY } from "@/constants/layout";
import { translate } from "@/lib/i18n";
import {
  appendScratchpadEntries,
  moveWithinGroup,
  recordLocalHistoryEntry,
  removeLocalHistoryKeys,
  removeScratchpadKeys,
} from "@/lib/scratchpad/scratchpadModel";
import {
  addSongMomentComment,
  addTagToSongRecords,
  deleteSongMomentComment,
  deleteSongTag,
  editSongMomentComment,
  removeTagFromSongRecord,
  renameSongTag,
} from "@/lib/scratchpad/songNotesModel";
import { useI18nStore } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import type { PlayerTrack } from "@/types/player/model";
import type {
  ScratchpadEntry,
  ScratchpadOrigin,
  ScratchpadStoreState,
  SongNoteRecord,
  SongNoteTag,
} from "@/types/scratchpad/model";

const SCRATCHPAD_STORAGE_KEY = "scopify-scratchpad";
const SCRATCHPAD_STORAGE_VERSION = 1;

function isValidEntry(value: unknown): value is ScratchpadEntry {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ScratchpadEntry>;
  return (
    typeof item.key === "string" &&
    typeof item.addedAt === "number" &&
    Boolean(item.track && item.track.ref && typeof item.track.title === "string")
  );
}

function isValidTag(value: unknown): value is SongNoteTag {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SongNoteTag>;
  return (
    typeof item.key === "string" &&
    typeof item.name === "string" &&
    typeof item.createdAt === "number"
  );
}

function isValidMomentRecord(value: unknown): value is SongNoteRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SongNoteRecord>;
  return (
    typeof item.key === "string" &&
    Boolean(item.track && item.track.ref && typeof item.track.title === "string") &&
    Array.isArray(item.tags) &&
    Array.isArray(item.comments) &&
    typeof item.updatedAt === "number"
  );
}

export const useScratchpadStore = create<ScratchpadStoreState>()(
  persist(
    (set, get) => ({
      entries: [],
      localHistory: [],
      tags: [],
      momentsByKey: {},
      panelTab: "notes",
      viewingMomentTrack: null,
      momentSort: "written",
      lastAddedKeys: [],
      addNonce: 0,
      workspaceOpen: false,
      workspaceTab: "overview",
      density: "standard",
      saveDialog: { open: false, tracks: [] },

      addTracks: (tracks, origin) => {
        const result = appendScratchpadEntries(get().entries, tracks, origin);
        if (result.added > 0) {
          set((state) => ({
            entries: result.entries,
            lastAddedKeys: result.addedKeys,
            addNonce: state.addNonce + 1,
          }));
        }
        return {
          added: result.added,
          skipped: result.skipped,
          addedKeys: result.addedKeys,
        };
      },

      removeKeys: (keys) => {
        if (keys.length === 0) return;
        const removeSet = new Set(keys);
        set((state) => ({
          entries: removeScratchpadKeys(state.entries, keys),
          lastAddedKeys: state.lastAddedKeys.filter((key) => !removeSet.has(key)),
        }));
      },

      clearEntries: () => set({ entries: [], lastAddedKeys: [] }),

      moveGroupEntries: (provider, keys, targetIndex) => {
        set((state) => ({
          entries: moveWithinGroup(state.entries, provider, keys, targetIndex),
        }));
      },

      recordHistory: (track) => {
        set((state) => ({
          localHistory: recordLocalHistoryEntry(state.localHistory, track),
        }));
      },

      removeHistoryKeys: (keys) => {
        if (keys.length === 0) return;
        set((state) => ({
          localHistory: removeLocalHistoryKeys(state.localHistory, keys),
        }));
      },

      clearHistory: () => set({ localHistory: [] }),

      setPanelTab: (panelTab) => set({ panelTab }),

      setViewingMomentTrack: (viewingMomentTrack) => set({ viewingMomentTrack }),

      setMomentSort: (momentSort) => set({ momentSort }),

      addMomentComment: (track, text, at) => {
        const result = addSongMomentComment(get().momentsByKey, track, text, at);
        if (result.comment) {
          set({ momentsByKey: result.records });
        }
        return result.comment;
      },

      editMomentComment: (trackKey, commentId, text) => {
        set((state) => ({
          momentsByKey: editSongMomentComment(state.momentsByKey, trackKey, commentId, text),
        }));
      },

      deleteMomentComment: (trackKey, commentId) => {
        set((state) => ({
          momentsByKey: deleteSongMomentComment(state.momentsByKey, trackKey, commentId),
        }));
      },

      addTagToTracks: (tracks, rawTagName) => {
        const result = addTagToSongRecords(get().momentsByKey, get().tags, tracks, rawTagName);
        if (!result.changed) return false;
        set({ momentsByKey: result.records, tags: result.tags });
        return true;
      },

      removeTagFromTrack: (trackKey, tagKey) => {
        set((state) => ({
          momentsByKey: removeTagFromSongRecord(state.momentsByKey, trackKey, tagKey),
        }));
      },

      renameTag: (tagKey, rawNextName) => {
        const result = renameSongTag(get().momentsByKey, get().tags, tagKey, rawNextName);
        if (!result.renamed) return false;
        set({ momentsByKey: result.records, tags: result.tags });
        return true;
      },

      deleteTag: (tagKey) => {
        set((state) => {
          const result = deleteSongTag(state.momentsByKey, state.tags, tagKey);
          return { momentsByKey: result.records, tags: result.tags };
        });
      },

      openWorkspace: (tab = "overview") => set({ workspaceOpen: true, workspaceTab: tab }),

      closeWorkspace: () => set({ workspaceOpen: false }),

      setWorkspaceTab: (tab) => set({ workspaceTab: tab }),

      setDensity: (density) => set({ density }),

      openSaveDialog: (tracks, source) => {
        if (tracks.length === 0) return;
        set({ saveDialog: { open: true, tracks: [...tracks], source } });
      },

      closeSaveDialog: () => set({ saveDialog: { open: false, tracks: [] } }),
    }),
    {
      name: SCRATCHPAD_STORAGE_KEY,
      version: SCRATCHPAD_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        entries: state.entries,
        localHistory: state.localHistory,
        tags: state.tags,
        momentsByKey: state.momentsByKey,
        density: state.density,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ScratchpadStoreState> | undefined;
        const entries = Array.isArray(persisted?.entries)
          ? persisted.entries.filter(isValidEntry)
          : currentState.entries;
        const localHistory = Array.isArray(persisted?.localHistory)
          ? persisted.localHistory.filter(
              (item) =>
                Boolean(
                  item && typeof item.key === "string" && typeof item.playedAt === "number",
                ) && Boolean(item?.track?.ref),
            )
          : currentState.localHistory;
        const tags = Array.isArray(persisted?.tags)
          ? persisted.tags.filter(isValidTag)
          : currentState.tags;
        const momentsByKey: Record<string, SongNoteRecord> = {};
        if (persisted?.momentsByKey && typeof persisted.momentsByKey === "object") {
          for (const [key, record] of Object.entries(persisted.momentsByKey)) {
            if (isValidMomentRecord(record)) momentsByKey[key] = record;
          }
        }
        const density =
          persisted?.density === "compact" || persisted?.density === "standard"
            ? persisted.density
            : currentState.density;
        return {
          ...currentState,
          entries,
          localHistory,
          tags,
          momentsByKey,
          density,
          workspaceOpen: false,
          viewingMomentTrack: null,
          saveDialog: { open: false, tracks: [] },
        };
      },
    },
  ),
);

/** 收进速记簿并给出带跳转动作的提示。 */
export function collectTracksToScratchpad(
  tracks: readonly PlayerTrack[],
  origin?: ScratchpadOrigin,
) {
  if (tracks.length === 0) return { added: 0, skipped: 0, addedKeys: [] as string[] };
  const result = useScratchpadStore.getState().addTracks(tracks, origin);
  const locale = useI18nStore.getState().locale;

  const openTarget = () => {
    if (typeof window !== "undefined" && window.matchMedia(NOW_PLAYING_PANEL_MEDIA_QUERY).matches) {
      const ui = useUiStore.getState();
      ui.setIsNowPlayingPanelOpen(true);
      ui.setNowPlayingPanelTab("scratchpad");
      return;
    }
    useScratchpadStore.getState().openWorkspace("notes");
  };

  if (result.added > 0) {
    toast.success(translate(locale, "scratchpad.toastAdded", { count: result.added }), {
      action: {
        label: translate(locale, "scratchpad.open"),
        onClick: openTarget,
      },
    });
  } else if (result.skipped > 0) {
    toast.info(translate(locale, "scratchpad.toastAlreadyIn"), {
      action: {
        label: translate(locale, "scratchpad.open"),
        onClick: openTarget,
      },
    });
  }
  return result;
}

/** 打开指定曲目的「时刻」（桌面宽屏切到右侧栏时刻页，窄屏或无面板时展开工作区时刻画布）。 */
export function openTrackMoments(track: PlayerTrack) {
  const scratchpad = useScratchpadStore.getState();
  scratchpad.setViewingMomentTrack(track);
  scratchpad.setPanelTab("moments");
  if (typeof window !== "undefined" && window.matchMedia(NOW_PLAYING_PANEL_MEDIA_QUERY).matches) {
    scratchpad.closeWorkspace();
    const ui = useUiStore.getState();
    ui.setIsNowPlayingPanelOpen(true);
    ui.setNowPlayingPanelTab("scratchpad");
    return;
  }
  scratchpad.openWorkspace("moments");
}
