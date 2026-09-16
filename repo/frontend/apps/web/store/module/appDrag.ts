"use client";

import { create } from "zustand";
import type { AppDragState } from "@/types/trackDrag";

export const useAppDragStore = create<AppDragState>((set) => ({
  isDragging: false,
  draggedTracks: [],
  sourcePlaylistId: null,
  overTargetId: null,
  pendingTargetIds: [],
  startDrag: (tracks, sourcePlaylistId = null) => set({
    isDragging: tracks.length > 0,
    draggedTracks: [...new Map(tracks.map((track) => [track.id, track])).values()],
    sourcePlaylistId,
    overTargetId: null,
  }),
  endDrag: () => set({ isDragging: false, draggedTracks: [], sourcePlaylistId: null, overTargetId: null }),
  setOverTarget: (overTargetId) => set((state) => state.overTargetId === overTargetId ? state : { overTargetId }),
  setTargetPending: (id, pending) => set((state) => ({
    pendingTargetIds: pending
      ? [...new Set([...state.pendingTargetIds, id])]
      : state.pendingTargetIds.filter((target) => target !== id),
  })),
}));
