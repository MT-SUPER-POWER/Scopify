import type { MusicPlaylist } from "@scopify/music-domain/playlist";
import type { MusicAlbumResult } from "@scopify/music-domain/search";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { getAlbumDetail } from "@/lib/providers/netease/api/album";
import { adaptNeteaseTrack } from "@/lib/providers/netease/adapters/track";
import { translate } from "@/lib/i18n";
import { usePlayerStore } from "@/store";
import { useI18nStore } from "@/store/module/i18n";
import { pruneSongDetail, type RawSongDetail, type SongDetail } from "@/types/song/api";

export function usePlayActions() {
  const provider = useActiveProvider();
  const { setQueue, playQueueIndex } = usePlayerStore();
  const [loadingPlayId, setLoadingPlayId] = useState<string | null>(null);

  const handlePlayPlaylist = useCallback(
    async (playlist: MusicPlaylist, e: React.MouseEvent) => {
      e.stopPropagation();
      const key = `playlist-${playlist.ref.id}`;
      if (loadingPlayId === key) return;
      setLoadingPlayId(key);
      try {
        const { tracks } = await provider.getPlaylistTracks(playlist.ref, {
          offset: 0,
          limit: Math.max(playlist.trackCount, 1),
        });
        if (!tracks.length) {
          toast.error(translate(useI18nStore.getState().locale, "sidebar.lib.noTracks"));
          return;
        }
        setQueue(tracks, 0);
        await playQueueIndex(0);
      } catch {
        toast.error(translate(useI18nStore.getState().locale, "sidebar.lib.fetchTracksFailed"));
      } finally {
        setLoadingPlayId(null);
      }
    },
    [loadingPlayId, provider, setQueue, playQueueIndex],
  );

  /** Albums have no interface type yet, so this is NetEase's album read (`album.read`). */
  const handlePlayAlbum = useCallback(
    async (album: MusicAlbumResult, e: React.MouseEvent) => {
      e.stopPropagation();
      const key = `album-${album.ref.id}`;
      if (loadingPlayId === key) return;
      setLoadingPlayId(key);
      try {
        const res = await getAlbumDetail(Number(album.ref.id));
        const tracks: SongDetail[] = (res.data.songs ?? []).map((song: RawSongDetail) =>
          pruneSongDetail({
            ...song,
            al: {
              id: song.al?.id ?? 0,
              name: song.al?.name ?? "",
              picUrl:
                song.al?.picUrl ?? res.data?.album?.picUrl ?? res.data?.album?.blurPicUrl ?? "",
            },
          }),
        );
        if (!tracks.length) {
          toast.error(translate(useI18nStore.getState().locale, "artist.toast.albumEmpty"));
          return;
        }
        setQueue(tracks.map(adaptNeteaseTrack), 0);
        await playQueueIndex(0);
      } catch {
        toast.error(translate(useI18nStore.getState().locale, "artist.toast.loadAlbumFailed"));
      } finally {
        setLoadingPlayId(null);
      }
    },
    [loadingPlayId, setQueue, playQueueIndex],
  );

  return { loadingPlayId, handlePlayPlaylist, handlePlayAlbum };
}
