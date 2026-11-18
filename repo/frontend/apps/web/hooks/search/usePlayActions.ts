import type { MusicPlaylist } from "@scopify/music-domain/playlist";
import type { MusicAlbumResult } from "@scopify/music-domain/search";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { translate } from "@/lib/i18n";
import { usePlayerStore } from "@/store";
import { useI18nStore } from "@/store/module/i18n";

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

  const handlePlayAlbum = useCallback(
    async (album: MusicAlbumResult, e: React.MouseEvent) => {
      e.stopPropagation();
      const key = `album-${album.ref.id}`;
      if (loadingPlayId === key) return;
      setLoadingPlayId(key);
      try {
        const { tracks } = await provider.getAlbum(album.ref);
        if (!tracks.length) {
          toast.error(translate(useI18nStore.getState().locale, "artist.toast.albumEmpty"));
          return;
        }
        setQueue(tracks, 0);
        await playQueueIndex(0);
      } catch {
        toast.error(translate(useI18nStore.getState().locale, "artist.toast.loadAlbumFailed"));
      } finally {
        setLoadingPlayId(null);
      }
    },
    [loadingPlayId, provider, setQueue, playQueueIndex],
  );

  return { loadingPlayId, handlePlayPlaylist, handlePlayAlbum };
}
