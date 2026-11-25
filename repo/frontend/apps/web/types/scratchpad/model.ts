import type { MusicProvider } from "@scopify/music-domain/identity";
import type { PlayerTrack } from "@/types/player/model";

export interface ScratchpadOrigin {
  label: string;
}

export interface ScratchpadEntry {
  key: string;
  track: PlayerTrack;
  addedAt: number;
  origin?: ScratchpadOrigin;
}

export interface ScratchpadGroup {
  key: MusicProvider;
  provider: MusicProvider;
  entries: ScratchpadEntry[];
}

export interface LocalHistoryEntry {
  key: string;
  track: PlayerTrack;
  playedAt: number;
}

export type HistoryDayKind = "today" | "yesterday" | "earlier";

export interface HistoryDayGroup {
  kind: HistoryDayKind;
  start: number;
  entries: LocalHistoryEntry[];
}

export type ScratchpadPanelTab = "notes" | "history" | "queue" | "moments";

export type ScratchpadWorkspaceTab = "overview" | "notes" | "queue" | "history" | "moments";

export type ScratchpadCardDensity = "standard" | "compact";

export type ScratchpadSaveSource = "scratchpad" | "queue" | "history" | "moments";

export interface SongNoteTag {
  key: string;
  name: string;
  createdAt: number;
}

export interface SongNoteComment {
  id: string;
  text: string;
  at?: number;
  createdAt: number;
  editedAt?: number;
}

export interface SongNoteRecord {
  key: string;
  track: PlayerTrack;
  tags: string[];
  tagAddedAt: Record<string, number>;
  comments: SongNoteComment[];
  updatedAt: number;
}

export type SongNoteSort = "written" | "timeline";

export interface SongNoteTagGroup {
  key: string;
  tagKey: string | null;
  name: string;
  records: SongNoteRecord[];
}

export interface ScratchpadAppendResult {
  added: number;
  skipped: number;
  addedKeys: string[];
  entries: ScratchpadEntry[];
}

export type ScratchpadQueueBatchAction = "next" | "end" | "remove";

export interface ScratchpadSaveDialogState {
  open: boolean;
  tracks: PlayerTrack[];
  source?: ScratchpadSaveSource;
}

export interface ScratchpadStoreState {
  entries: ScratchpadEntry[];
  localHistory: LocalHistoryEntry[];
  tags: SongNoteTag[];
  momentsByKey: Record<string, SongNoteRecord>;
  panelTab: ScratchpadPanelTab;
  viewingMomentTrack: PlayerTrack | null;
  momentSort: SongNoteSort;
  lastAddedKeys: string[];
  addNonce: number;
  workspaceOpen: boolean;
  workspaceTab: ScratchpadWorkspaceTab;
  density: ScratchpadCardDensity;
  saveDialog: ScratchpadSaveDialogState;
  addTracks: (
    tracks: readonly PlayerTrack[],
    origin?: ScratchpadOrigin,
  ) => Omit<ScratchpadAppendResult, "entries">;
  removeKeys: (keys: readonly string[]) => void;
  clearEntries: () => void;
  moveGroupEntries: (provider: MusicProvider, keys: readonly string[], targetIndex: number) => void;
  recordHistory: (track: PlayerTrack) => void;
  removeHistoryKeys: (keys: readonly string[]) => void;
  clearHistory: () => void;
  setPanelTab: (tab: ScratchpadPanelTab) => void;
  setViewingMomentTrack: (track: PlayerTrack | null) => void;
  setMomentSort: (sort: SongNoteSort) => void;
  addMomentComment: (track: PlayerTrack, text: string, at?: number) => SongNoteComment | null;
  editMomentComment: (trackKey: string, commentId: string, text: string) => void;
  deleteMomentComment: (trackKey: string, commentId: string) => void;
  addTagToTracks: (tracks: readonly PlayerTrack[], rawTagName: string) => boolean;
  removeTagFromTrack: (trackKey: string, tagKey: string) => void;
  renameTag: (tagKey: string, rawNextName: string) => boolean;
  deleteTag: (tagKey: string) => void;
  openWorkspace: (tab?: ScratchpadWorkspaceTab) => void;
  closeWorkspace: () => void;
  setWorkspaceTab: (tab: ScratchpadWorkspaceTab) => void;
  setDensity: (density: ScratchpadCardDensity) => void;
  openSaveDialog: (tracks: readonly PlayerTrack[], source?: ScratchpadSaveSource) => void;
  closeSaveDialog: () => void;
}
