"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import { usePlayerStore } from "@/store/module/player";
import { useScratchpadStore } from "@/store/module/scratchpad";
import type { PlayerTrack } from "@/types/player/model";
import type { ScratchpadSaveSource } from "@/types/scratchpad/model";

/**
 * 速记簿列表与扩展画布共用的播放、入队、替换与歌单收纳操作。
 */
export function useScratchpadActions() {
  const { t } = useTranslation();

  const playNow = useCallback((track: PlayerTrack) => {
    void usePlayerStore.getState().playTrackInQueue(track);
  }, []);

  const playQueueTrack = useCallback((track: PlayerTrack, indexHint?: number) => {
    const state = usePlayerStore.getState();
    const targetKey = playerTrackKey(track);
    if (
      indexHint !== undefined &&
      indexHint >= 0 &&
      indexHint < state.queue.length &&
      playerTrackKey(state.queue[indexHint]) === targetKey
    ) {
      if (indexHint === state.queueIndex) void state.togglePlaying();
      else void state.playQueueIndex(indexHint);
      return;
    }
    const index = state.queue.findIndex((item) => playerTrackKey(item) === targetKey);
    if (index >= 0) {
      if (index === state.queueIndex) void state.togglePlaying();
      else void state.playQueueIndex(index);
      return;
    }
    void state.playTrackInQueue(track);
  }, []);

  const enqueueTracks = useCallback(
    (tracks: readonly PlayerTrack[]) => {
      if (tracks.length === 0) return;
      const state = usePlayerStore.getState();
      const existing = new Set(state.queue.map(playerTrackKey));
      const nextTracks: PlayerTrack[] = [];
      for (const track of tracks) {
        const key = playerTrackKey(track);
        if (existing.has(key)) continue;
        existing.add(key);
        nextTracks.push(track);
      }
      if (nextTracks.length === 0) {
        toast.info(t("playlist.table.queueExists"));
        return;
      }
      state.appendQueueItems(nextTracks);
      toast.success(
        nextTracks.length === 1
          ? t("playlist.table.queueAdded")
          : t("scratchpad.toastEnqueuedCount", { count: nextTracks.length }),
      );
    },
    [t],
  );

  const replaceQueueAndPlay = useCallback(
    (tracks: readonly PlayerTrack[]) => {
      if (tracks.length === 0) return;
      void usePlayerStore.getState().playFromSong(tracks[0], [...tracks], null);
      toast.success(t("scratchpad.toastQueueReplaced", { count: tracks.length }));
    },
    [t],
  );

  const openSaveToPlaylist = useCallback(
    (tracks: readonly PlayerTrack[], source?: ScratchpadSaveSource) => {
      useScratchpadStore.getState().openSaveDialog(tracks, source);
    },
    [],
  );

  return useMemo(
    () => ({
      playNow,
      playQueueTrack,
      enqueueTracks,
      replaceQueueAndPlay,
      openSaveToPlaylist,
    }),
    [enqueueTracks, openSaveToPlaylist, playNow, playQueueTrack, replaceQueueAndPlay],
  );
}
