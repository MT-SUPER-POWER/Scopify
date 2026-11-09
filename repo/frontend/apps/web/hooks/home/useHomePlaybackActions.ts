"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { adaptNeteaseTrack } from "@/lib/providers/netease/adapters/track";
import { getAlbumDetailData } from "@/lib/providers/netease/api/album";
import { getArtistTopSongs } from "@/lib/providers/netease/api/artist";
import { readAllPlaylistTracks } from "@/lib/music/readPlaylistTracks";
import { usePlayerStore } from "@/store";
import { useTranslation } from "react-i18next";

import { pruneSongDetail } from "@/types/song/api";
import type { HomePlaybackActions } from "@/types/home/model";
import type { PlayerTrack } from "@/types/player/model";

/** 首页各栏目共用播放动作；读取 Query 的状态不参与此 hook。 */
export function useHomePlaybackActions(): HomePlaybackActions {
  const { t } = useTranslation();
  const provider = useActiveProvider();
  const [loadingPlayId, setLoadingPlayId] = useState<string | null>(null);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const playQueueIndex = usePlayerStore((state) => state.playQueueIndex);
  const playTrack = usePlayerStore((state) => state.playTrack);

  const playCollection = useCallback(
    async (key: string, event: React.MouseEvent, load: () => Promise<PlayerTrack[]>) => {
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
      playCollection(`playlist-${id}`, event, () =>
        readAllPlaylistTracks(provider, {
          provider: provider.provider,
          kind: "playlist",
          id: String(id),
        }),
      ),
    // Albums and artists are NetEase-only on the home page until their areas are migrated.
    handlePlayAlbum: (id, event) =>
      playCollection(`album-${id}`, event, async () =>
        ((await getAlbumDetailData(id)).songs ?? []).map((song) =>
          adaptNeteaseTrack(pruneSongDetail(song)),
        ),
      ),
    handlePlayArtistTopSongs: (id, event) =>
      playCollection(`artist-${id}`, event, async () =>
        ((await getArtistTopSongs(id, 50)).data.songs ?? []).map((song) =>
          adaptNeteaseTrack(pruneSongDetail(song)),
        ),
      ),
    playTracks: async (tracks, index) => {
      if (!tracks[index]) return;
      setQueue([...tracks], index);
      await playTrack(tracks[index]);
    },
  };
}
