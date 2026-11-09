import { musicResourceKey } from "@scopify/music-domain/identity";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { translate } from "@/lib/i18n";
import { usePlayerStore } from "@/store";
import { useI18nStore } from "@/store/module/i18n";
import type { DiscographyAlbum } from "@/types/artist/model";
import type { PlayerTrack } from "@/types/player/model";

export function useArtistPlay(popularTracks: readonly PlayerTrack[]) {
  const provider = useActiveProvider();
  const { currentTrack, isPlaying, setIsPlaying, setQueue, playQueueIndex } = usePlayerStore();
  const [loadingAlbumKey, setLoadingAlbumKey] = useState<string | null>(null);

  const firstKey = popularTracks[0] ? musicResourceKey(popularTracks[0].ref) : null;
  const currentKey = currentTrack ? musicResourceKey(currentTrack.ref) : null;
  const isPlayingArtist = firstKey !== null && currentKey === firstKey && isPlaying;

  const handlePlayArtist = useCallback(() => {
    if (popularTracks.length === 0) return;
    if (firstKey === currentKey) {
      setIsPlaying(!isPlaying);
      return;
    }
    setQueue([...popularTracks], 0);
    void playQueueIndex(0);
  }, [popularTracks, firstKey, currentKey, isPlaying, setIsPlaying, setQueue, playQueueIndex]);

  const handlePlayAlbum = useCallback(
    async (album: DiscographyAlbum, e: React.MouseEvent) => {
      e.stopPropagation();
      const key = musicResourceKey(album.ref);
      if (loadingAlbumKey === key) return;
      setLoadingAlbumKey(key);
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
        setLoadingAlbumKey(null);
      }
    },
    [loadingAlbumKey, provider, setQueue, playQueueIndex],
  );

  return {
    isPlayingArtist,
    loadingAlbumKey,
    handlePlayArtist,
    handlePlayAlbum,
  };
}
