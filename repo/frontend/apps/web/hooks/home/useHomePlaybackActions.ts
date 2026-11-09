"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { readAllPlaylistTracks } from "@/lib/music/readPlaylistTracks";
import { usePlayerStore } from "@/store";
import { useTranslation } from "react-i18next";

import type { HomePlaybackActions } from "@/types/home/model";
import type { PlayerTrack } from "@/types/player/model";

/** Tracks of an artist the home page queues when the artist card is played. */
const HOME_ARTIST_TOP_TRACKS = 50;

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
    handlePlayAlbum: (id, event) =>
      playCollection(
        `album-${id}`,
        event,
        async () =>
          (await provider.getAlbum({ provider: provider.provider, kind: "album", id: String(id) }))
            .tracks,
      ),
    handlePlayArtistTopSongs: (id, event) =>
      playCollection(`artist-${id}`, event, async () =>
        (
          await provider.getArtistTopTracks({
            provider: provider.provider,
            kind: "artist",
            id: String(id),
          })
        ).slice(0, HOME_ARTIST_TOP_TRACKS),
      ),
    playTracks: async (tracks, index) => {
      if (!tracks[index]) return;
      setQueue([...tracks], index);
      await playTrack(tracks[index]);
    },
  };
}
