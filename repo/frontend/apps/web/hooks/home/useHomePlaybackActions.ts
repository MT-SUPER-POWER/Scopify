"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getAlbumDetailData } from "@/lib/api/album";
import { getArtistTopSongs } from "@/lib/api/artist";
import { getPlaylistAllTracks } from "@/lib/api/playlist";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import type { HomePlaybackActions } from "@/types/home";

/** 首页各栏目共用播放动作；读取 Query 的状态不参与此 hook。 */
export function useHomePlaybackActions(): HomePlaybackActions {
  const { t } = useI18n();
  const [loadingPlayId, setLoadingPlayId] = useState<string | null>(null);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const playQueueIndex = usePlayerStore((state) => state.playQueueIndex);
  const playTrack = usePlayerStore((state) => state.playTrack);

  const playCollection = useCallback(
    async (key: string, event: React.MouseEvent, load: () => Promise<SongDetail[]>) => {
      event.stopPropagation();
      if (loadingPlayId === key) return;
      setLoadingPlayId(key);
      try {
        const tracks = await load();
        if (!tracks.length) {
          toast.error(t("home.toast.playlistEmpty"));
          return;
        }
        setQueue(tracks, 0);
        await playQueueIndex(0);
      } catch {
        toast.error(t("home.toast.loadPlaylistFailed"));
      } finally {
        setLoadingPlayId(null);
      }
    },
    [loadingPlayId, playQueueIndex, setQueue, t],
  );

  return {
    loadingPlayId,
    handlePlayPlaylist: (id, event) =>
      playCollection(`playlist-${id}`, event, async () =>
        ((await getPlaylistAllTracks({ id })).data.songs ?? []).map(pruneSongDetail),
      ),
    handlePlayAlbum: (id, event) =>
      playCollection(`album-${id}`, event, async () =>
        ((await getAlbumDetailData(id)).songs ?? []).map(pruneSongDetail),
      ),
    handlePlayArtistTopSongs: (id, event) =>
      playCollection(`artist-${id}`, event, async () =>
        ((await getArtistTopSongs(id, 50)).data.songs ?? []).map(pruneSongDetail),
      ),
    playSongs: async (songs, index) => {
      if (!songs[index]) return;
      setQueue(songs, index);
      await playTrack(songs[index]);
    },
  };
}
