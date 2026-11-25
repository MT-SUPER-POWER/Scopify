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

export type ScratchpadWorkspaceTab = "overview" | "notes" | "queue" | "history";

export type ScratchpadCardDensity = "standard" | "compact";

export type ScratchpadSaveSource = "scratchpad" | "queue" | "history";

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
  openWorkspace: (tab?: ScratchpadWorkspaceTab) => void;
  closeWorkspace: () => void;
  setWorkspaceTab: (tab: ScratchpadWorkspaceTab) => void;
  setDensity: (density: ScratchpadCardDensity) => void;
  openSaveDialog: (tracks: readonly PlayerTrack[], source?: ScratchpadSaveSource) => void;
  closeSaveDialog: () => void;
}
